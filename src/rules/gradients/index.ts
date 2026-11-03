import { converter, parse, type Oklch } from "culori";

import { defineRule, type Reference } from "../../api/index.ts";
import { markup } from "../shared/index.ts";

const toOklch = converter("oklch");

function gradientFunctions(value: string): string[] {
  const gradients: string[] = [];

  for (const match of value.matchAll(/linear-gradient\s*\(/gi)) {
    const start = match.index;
    let depth = 0;

    for (let index = value.indexOf("(", start); index < value.length; index += 1) {
      if (value[index] === "(") depth += 1;

      if (value[index] === ")") depth -= 1;

      if (depth === 0) {
        gradients.push(value.slice(start, index + 1));
        break;
      }
    }
  }

  return gradients;
}

function parseColor(token: string): Oklch | undefined {
  const color = parse(token);

  return color ? toOklch(color) : undefined;
}

export function isAiStyleGradient(value: string): boolean {
  if (!/linear-gradient\s*\(/i.test(value)) return false;

  const colors: Oklch[] = [];

  for (const match of value.matchAll(/#[\da-f]{6}(?:[\da-f]{2})?\b|#[\da-f]{3,4}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^)]*\)|\btransparent\b/gi)) {
    const color = parseColor(match[0]);

    if (color && (color.alpha ?? 1) >= 0.65) {
      colors.push(color);
    }
  }

  if (colors.length < 2) return false;

  const vivid = colors.filter((color) => color.c >= 0.12 && color.l >= 0.3 && color.l <= 0.9).flatMap((color) => color.h ?? []);

  for (let left = 0; left < vivid.length; left += 1) {
    for (let right = left + 1; right < vivid.length; right += 1) {
      const distance = Math.abs((vivid[left] ?? 0) - (vivid[right] ?? 0));

      if (Math.min(distance, 360 - distance) >= 25) return true;
    }
  }

  return false;
}

export default defineRule({
  id: "no-visible-gradients",
  title: "AI-style gradients",
  description: "AI-generated websites often reuse vivid multi-hue gradients on text, buttons, and decorative surfaces.",
  async match(context) {
    let declarations: Array<{ value: string; reference?: Reference }>;

    if (context.type === "puppeteer") {
      declarations = await context.page.$$eval("*", (elements) => {
        const values: Array<{ value: string; reference: { type: "element"; selector: string; source: string } }> = [];

        for (const element of elements) {
          const style = getComputedStyle(element);
          const value = style.backgroundImage;

          if (element.getClientRects().length > 0 && value.includes("gradient(")) {
            const path: string[] = [];
            let current: Element | null = element;

            while (current) {
              const siblings = current.parentElement ? Array.from(current.parentElement.children).filter((sibling) => sibling.tagName === current?.tagName) : [];
              const position = siblings.indexOf(current) + 1;

              path.unshift(`${current.tagName.toLowerCase()}${siblings.length > 1 ? `[${position}]` : ""}`);
              current = current.parentElement;
            }

            const selector = element.id ? `#${CSS.escape(element.id)}` : `xpath=/${path.join("/")}`;

            values.push({ value, reference: { type: "element", selector, source: element.outerHTML.slice(0, 200) } });
          }
        }

        return values;
      });
    } else {
      declarations = ((await markup(context)).match(/[^{};\n]*(?:linear|radial|conic)-gradient\s*\([^{};\n]*/gi) ?? [])
        .filter((value) => !/^\s*(?:-webkit-)?mask(?:-image)?\s*:/i.test(value))
        .map((value) => ({ value }));
    }

    let total = 0;
    let sloppy = 0;
    const references: Reference[] = [];

    for (const declaration of declarations) {
      const gradients = gradientFunctions(declaration.value);

      total += gradients.length;

      const matches = gradients.filter(isAiStyleGradient).length;

      if (matches > 0) {
        sloppy += matches;

        if (declaration.reference) {
          references.push(declaration.reference);
        }
      }
    }

    return sloppy > 0
      ? { matches: true, explanation: `${sloppy} vivid multi-hue ${sloppy === 1 ? "gradient was" : "gradients were"} found out of ${total} linear gradients.`, references }
      : { matches: false };
  },
});

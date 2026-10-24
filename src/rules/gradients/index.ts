import { defineRule, type Reference } from "../../api/index.ts";
import { count, markup } from "../shared/index.ts";

type Color = { red: number; green: number; blue: number; alpha: number };

const gradientPattern = /(?:linear|radial|conic)-gradient\s*\(/gi;

function parseColor(token: string): Color | undefined {
  if (token.toLowerCase() === "transparent") {
    return { red: 0, green: 0, blue: 0, alpha: 0 };
  }

  if (token.startsWith("#")) {
    const hex = token.slice(1);

    const expanded = hex.length <= 4
      ? Array.from(hex, (character) => character + character).join("")
      : hex;

    return {
      red: Number.parseInt(expanded.slice(0, 2), 16),
      green: Number.parseInt(expanded.slice(2, 4), 16),
      blue: Number.parseInt(expanded.slice(4, 6), 16),
      alpha: expanded.length === 8 ? Number.parseInt(expanded.slice(6, 8), 16) / 255 : 1,
    };
  }

  const body = token.match(/rgba?\(([^)]*)\)/i)?.[1];

  if (!body) {
    return undefined;
  }

  const parts = body.trim().split(/[\s,/]+/);
  const red = Number(parts[0]);
  const green = Number(parts[1]);
  const blue = Number(parts[2]);
  const alpha = parts[3] === undefined ? 1 : Number(parts[3]);

  if (![red, green, blue, alpha].every(Number.isFinite)) {
    return undefined;
  }

  return { red, green, blue, alpha };
}

function isClearGradient(value: string): boolean {
  const colors: Color[] = [];

  for (const match of value.matchAll(/#[\da-f]{3,8}\b|rgba?\([^)]*\)|\btransparent\b/gi)) {
    const color = parseColor(match[0]);

    if (color) {
      colors.push(color);
    }
  }

  if (colors.length < 2) {
    return true;
  }

  for (let left = 0; left < colors.length; left += 1) {
    for (let right = left + 1; right < colors.length; right += 1) {
      const first = colors[left];
      const second = colors[right];

      if (!first || !second) {
        continue;
      }

      const red = first.red * first.alpha - second.red * second.alpha;
      const green = first.green * first.alpha - second.green * second.alpha;
      const blue = first.blue * first.alpha - second.blue * second.alpha;

      if (Math.hypot(red, green, blue) >= 100 || Math.abs(first.alpha - second.alpha) >= 0.4) {
        return true;
      }
    }
  }

  return false;
}

export default defineRule({
  id: "no-visible-gradients",
  title: "Visible gradients",
  description: "AI-generated websites often overuse clearly visible gradients; subtle lighting effects are allowed.",
  async match(context) {
    let declarations: Array<{ value: string; reference?: Reference }>;

    if (context.type === "puppeteer") {
      declarations = await context.page.$$eval("*", (elements) => {
        const values: Array<{ value: string; reference: { type: "element"; selector: string; source: string } }> = [];

        for (const element of elements) {
          const style = getComputedStyle(element);
          const value = `${style.backgroundImage} ${style.maskImage}`;

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
        .map((value) => ({ value }));
    }

    let total = 0;
    let clear = 0;
    const references: Reference[] = [];

    for (const declaration of declarations) {
      const gradientCount = count(declaration.value, gradientPattern);

      total += gradientCount;

      if (isClearGradient(declaration.value)) {
        clear += gradientCount;

        if (declaration.reference) {
          references.push(declaration.reference);
        }
      }
    }

    return clear > 0
      ? { matches: true, explanation: `${clear} clearly visible gradients were found out of ${total} total gradients.`, references }
      : { matches: false };
  },
});

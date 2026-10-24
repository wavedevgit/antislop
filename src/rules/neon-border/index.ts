import { defineRule, type Files } from "../../api/index.ts";
import { cssRules } from "../shared/styles.ts";

type Color = { red: number; green: number; blue: number };

const neonFamilies = new Set(["blue", "cyan", "emerald", "fuchsia", "green", "indigo", "lime", "pink", "purple", "rose", "sky", "violet"]);

function color(value: string): Color | undefined {
  const hex = value.match(/#([\da-f]{3}|[\da-f]{6})\b/i)?.[1];

  if (hex) {
    const expanded = hex.length === 3 ? Array.from(hex, (part) => part + part).join("") : hex;

    return {
      red: Number.parseInt(expanded.slice(0, 2), 16),
      green: Number.parseInt(expanded.slice(2, 4), 16),
      blue: Number.parseInt(expanded.slice(4, 6), 16),
    };
  }

  const rgb = value.match(/rgba?\(\s*(\d+)\D+(\d+)\D+(\d+)/i);

  return rgb
    ? { red: Number(rgb[1]), green: Number(rgb[2]), blue: Number(rgb[3]) }
    : undefined;
}

function isNeon(first: Color, second: Color): boolean {
  const channels = [first.red, first.green, first.blue];
  const saturated = Math.max(...channels) >= 180 && Math.max(...channels) - Math.min(...channels) >= 100;
  const distance = Math.hypot(first.red - second.red, first.green - second.green, first.blue - second.blue);

  return saturated && distance <= 80;
}

function isNeonBorder(declarations: string): boolean {
  const border = declarations.match(/\bborder(?:-(?:top|right|bottom|left))?(?:-color)?\s*:\s*([^;]+)/i)?.[1];
  const shadow = declarations.match(/\bbox-shadow\s*:\s*([^;]+)/i)?.[1];
  const borderColor = border ? color(border) : undefined;
  const shadowColor = shadow ? color(shadow) : undefined;

  return borderColor !== undefined && shadowColor !== undefined && isNeon(borderColor, shadowColor);
}

function sourceNeonBorders(files: Files): number {
  let borders = cssRules(files).filter((rule) => isNeonBorder(rule.declarations)).length;

  for (const file of files.all()) {
    for (const style of file.content.matchAll(/style\s*=\s*(["'])(.*?)\1/gi)) {
      borders += isNeonBorder(style[2] ?? "") ? 1 : 0;
    }

    for (const attribute of file.content.matchAll(/(?:class|className)\s*=\s*(["'])(.*?)\1/g)) {
      const utilities = attribute[2]?.split(/\s+/).map((name) => name.slice(name.lastIndexOf(":") + 1)) ?? [];

      const borderFamily = utilities.map((name) => name.match(/^border-([a-z]+)-(?:300|400|500)(?:\/\d+)?$/)?.[1])
        .find((family) => family && neonFamilies.has(family));

      const shadowFamily = utilities.map((name) => name.match(/^shadow-([a-z]+)-(?:300|400|500)(?:\/\d+)?$/)?.[1])
        .find((family) => family && neonFamilies.has(family));

      borders += borderFamily !== undefined && borderFamily === shadowFamily ? 1 : 0;
    }
  }

  return borders;
}

export default defineRule({
  id: "no-neon-borders",
  title: "Neon borders",
  description: "AI-generated websites often pair saturated borders with matching colored glows.",
  async match(context) {
    const result = context.type === "puppeteer"
      ? await context.page.$$eval("*", (elements) => elements.flatMap((element) => {
        const style = getComputedStyle(element);

        const borderVisible = [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth]
          .some((width) => Number.parseFloat(width) > 0);

        if (!borderVisible || style.boxShadow === "none" || element.getClientRects().length === 0) {
          return [];
        }

        const parse = (value: string) => {
          const match = value.match(/rgba?\(\s*(\d+)\D+(\d+)\D+(\d+)/i);

          return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : undefined;
        };

        const border = parse(style.borderTopColor);
        const shadow = parse(style.boxShadow);

        if (!border || !shadow) {
          return [];
        }

        const saturated = Math.max(...border) >= 180 && Math.max(...border) - Math.min(...border) >= 100;
        const distance = Math.hypot(border[0] - shadow[0], border[1] - shadow[1], border[2] - shadow[2]);

        if (!saturated || distance > 80) {
          return [];
        }

        const path: string[] = [];
        let current: Element | null = element;

        while (current) {
          const siblings = current.parentElement ? Array.from(current.parentElement.children).filter((sibling) => sibling.tagName === current?.tagName) : [];
          const position = siblings.indexOf(current) + 1;

          path.unshift(`${current.tagName.toLowerCase()}${siblings.length > 1 ? `[${position}]` : ""}`);
          current = current.parentElement;
        }

        const selector = element.id ? `#${CSS.escape(element.id)}` : `xpath=/${path.join("/")}`;

        return [{ type: "element" as const, selector, source: element.outerHTML.slice(0, 200) }];
      }))
      : sourceNeonBorders(context.files);

    const borders = Array.isArray(result) ? result.length : result;

    return borders > 0
      ? { matches: true, explanation: `${borders} neon ${borders === 1 ? "border was" : "borders were"} found.`, references: Array.isArray(result) ? result : undefined }
      : { matches: false };
  },
});

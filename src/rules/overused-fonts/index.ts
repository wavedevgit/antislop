import { defineRule, type Reference } from "../../api/index.ts";
import { markup } from "../shared/index.ts";

const overusedFonts = new Set(["Playfair Display", "Instrument Serif"]);

function findOverusedFont(value: string): string | undefined {
  const normalized = value.toLowerCase().replaceAll("_", " ");

  for (const font of overusedFonts) {
    if (normalized.includes(font.toLowerCase())) {
      return font;
    }
  }

  return undefined;
}

function findOverusedTailwindFont(value: string): string | undefined {
  const candidate = value.replace(/^font-(?:\[)?|\]$/g, "").replaceAll("-", " ").toLowerCase();

  for (const font of overusedFonts) {
    const normalized = font.toLowerCase();

    if (candidate === normalized || candidate === normalized.split(" ")[0] || candidate.includes(normalized)) {
      return font;
    }
  }

  return undefined;
}

function tailwindFonts(content: string): string[] {
  const fonts: string[] = [];

  for (const attribute of content.matchAll(/(?:class|className)\s*=\s*(["'])(.*?)\1/g)) {
    for (const name of attribute[2]?.split(/\s+/) ?? []) {
      const utility = name.slice(name.lastIndexOf(":") + 1).replaceAll("_", " ");
      const font = findOverusedTailwindFont(utility);

      if (font) {
        fonts.push(font);
      }
    }
  }

  return fonts;
}

function declaredFonts(content: string): string[] {
  return Array.from(content.matchAll(/(?:font-family|fontFamily|font)\s*[:=]\s*([^;{}]*)/gi))
    .map((declaration) => findOverusedFont(declaration[1] ?? ""))
    .filter((font): font is string => font !== undefined);
}

export default defineRule({
  id: "no-overused-fonts",
  title: "Overused fonts",
  description: "Don't use Playfair Display or Instrument Serif. AI-generated websites overuse them.",
  async match(context) {
    let detected: string[];
    let references: Reference[] = [];

    if (context.type === "puppeteer") {
      const elements = await context.page.$$eval("*", (nodes) => nodes.flatMap((element) => {
        if (element.getClientRects().length === 0) {
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

        return [{ family: getComputedStyle(element).fontFamily, reference: { type: "element" as const, selector, source: element.outerHTML.slice(0, 200) } }];
      }));

      detected = [];

      for (const element of elements) {
        const font = findOverusedFont(element.family);

        if (font) {
          detected.push(font);
          references.push(element.reference);
        }
      }
    } else {
      detected = await markup(context).then((content) => [...declaredFonts(content), ...tailwindFonts(content)]);
    }

    const counts = new Map<string, number>();

    for (const font of detected) {
      counts.set(font, (counts.get(font) ?? 0) + 1);
    }

    const details = Array.from(counts, ([font, uses]) => `${font} (${uses})`).join(", ");

    return detected.length > 0
      ? { matches: true, explanation: `Detected overused fonts: ${details}. Choose a less overused typeface.`, references }
      : { matches: false };
  },
});

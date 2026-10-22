import { defineRule } from "../../api/index.ts";
import { markup } from "../shared/index.ts";

const overusedFonts = new Set(["playfair display", "instrument serif"]);

function usesOverusedFont(value: string): boolean {
  const normalized = value.toLowerCase().replaceAll("_", " ");

  for (const font of overusedFonts) {
    if (normalized.includes(font)) {
      return true;
    }
  }

  return false;
}

function isOverusedTailwindFont(value: string): boolean {
  const candidate = value.replace(/^font-(?:\[)?|\]$/g, "").replaceAll("-", " ");

  for (const font of overusedFonts) {
    if (candidate === font || candidate === font.split(" ")[0] || candidate.includes(font)) {
      return true;
    }
  }

  return false;
}

function tailwindFontUses(content: string): number {
  let uses = 0;

  for (const attribute of content.matchAll(/(?:class|className)\s*=\s*(["'])(.*?)\1/g)) {
    uses += attribute[2]?.split(/\s+/).filter((name) => {
      const utility = name.slice(name.lastIndexOf(":") + 1).replaceAll("_", " ");

      return isOverusedTailwindFont(utility);
    }).length ?? 0;
  }

  return uses;
}

function declaredFontUses(content: string): number {
  return Array.from(content.matchAll(/(?:font-family|fontFamily|font)\s*[:=]\s*([^;{}]*)/gi))
    .filter((declaration) => usesOverusedFont(declaration[1] ?? "")).length;
}

export default defineRule({
  id: "overused-fonts",
  title: "Overused fonts",
  description: "Don't use Playfair Display or Instrument Serif. AI-generated websites overuse them.",
  async match(context) {
    const uses = context.type === "puppeteer"
      ? await context.page.$$eval("*", (elements) => elements.filter((element) => {
        const family = getComputedStyle(element).fontFamily;

        return element.getClientRects().length > 0 && /Playfair Display|Instrument Serif/i.test(family);
      }).length)
      : await markup(context).then((content) => declaredFontUses(content) + tailwindFontUses(content));

    return uses > 0
      ? { matches: true, explanation: `${uses} ${uses === 1 ? "use" : "uses"} of Playfair Display or Instrument Serif ${uses === 1 ? "was" : "were"} found. Choose a less overused typeface.` }
      : { matches: false };
  },
});

import { defineRule } from "../../api/index.ts";
import { count, markup } from "../shared/index.ts";

const monospacePattern = /(?:font-family|font)\s*:[^;{}]*(?:\bmonospace\b|\b[\w -]*Mono\b)/gi;

function tailwindMonospaceUses(content: string): number {
  let uses = 0;

  for (const attribute of content.matchAll(/(?:class|className)\s*=\s*(["'])(.*?)\1/g)) {
    uses += attribute[2]?.split(/\s+/).filter((name) => name.slice(name.lastIndexOf(":") + 1) === "font-mono").length ?? 0;
  }

  return uses;
}

export default defineRule({
  id: "monospace-font",
  title: "Monospace font",
  description: "Only use monospace for real code, not labels or decorative text. Avoid it if possible.",
  async match(context) {
    const uses = context.type === "puppeteer"
      ? await context.page.$$eval("*", (elements) => elements.filter((element) => {
        const family = getComputedStyle(element).fontFamily;

        return element.getClientRects().length > 0 && /\b(?:monospace|mono)\b/i.test(family);
      }).length)
      : await markup(context).then((content) => count(content, monospacePattern) + tailwindMonospaceUses(content));

    return uses > 0
      ? { matches: true, explanation: `${uses} monospace font ${uses === 1 ? "use was" : "uses were"} found. Only use monospace for real code, not labels or decorative text. Avoid it if possible.` }
      : { matches: false };
  },
});

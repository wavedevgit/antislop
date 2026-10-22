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
    const result = context.type === "puppeteer"
      ? await context.page.$$eval("*", (elements) => elements.flatMap((element) => {
        const family = getComputedStyle(element).fontFamily;

        if (element.getClientRects().length === 0 || !/\b(?:monospace|mono)\b/i.test(family)) {
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
      : await markup(context).then((content) => count(content, monospacePattern) + tailwindMonospaceUses(content));

    const uses = Array.isArray(result) ? result.length : result;

    return uses > 0
      ? { matches: true, explanation: `${uses} monospace font ${uses === 1 ? "use was" : "uses were"} found. Only use monospace for real code, not labels or decorative text. Avoid it if possible.`, references: Array.isArray(result) ? result : undefined }
      : { matches: false };
  },
});

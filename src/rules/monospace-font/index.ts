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
  id: "no-decorative-monospace",
  title: "Monospace font",
  description: "Only use monospace for syntax-highlighted code, not single-color labels, prose, or decorative text.",
  async match(context) {
    const result = context.type === "puppeteer"
      ? await context.page.$$eval("*", (elements) => elements.flatMap((element) => {
        const family = getComputedStyle(element).fontFamily;
        const parentFamily = element.parentElement ? getComputedStyle(element.parentElement).fontFamily : "";

        if (
          element.getClientRects().length === 0
          || !element.textContent?.trim()
          || !/\b(?:monospace|mono)\b/i.test(family)
          || /\b(?:monospace|mono)\b/i.test(parentFamily)
          || (element.tagName === "CODE" && !element.closest("pre"))
        ) {
          return [];
        }

        const colors = new Set<string>();

        for (const textElement of [element, ...element.querySelectorAll("*")]) {
          const hasText = Array.from(textElement.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());

          if (hasText && textElement.getClientRects().length > 0) colors.add(getComputedStyle(textElement).color);
        }

        if (colors.size > 1) return [];

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
      ? { matches: true, explanation: `${uses} single-color monospace ${uses === 1 ? "text region was" : "text regions were"} found. Use monospace only when syntax highlighting distinguishes the code.`, references: Array.isArray(result) ? result : undefined }
      : { matches: false };
  },
});

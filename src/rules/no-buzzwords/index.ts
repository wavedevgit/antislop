import { defineRule, type Reference } from "../../api/index.ts";
import { textMatches } from "../shared/index.ts";

const buzzwords = /\b(?:made\s+with\s+love|seamless|blazing|next[-\s]+generation|game[-\s]+changing)\b/gi;

export default defineRule({
  id: "no-buzzwords",
  title: "Buzzwords",
  description: "Avoid clichéd marketing copy such as “made with love,” “seamless,” “blazing,” “next-generation,” and “game-changing.”",
  async match(context) {
    const result = context.type === "files"
      ? await textMatches(context, buzzwords)
      : await context.page.$$eval("body *", (elements, source, flags) => {
        const references: Reference[] = [];

        for (const element of elements) {
          const text = Array.from(element.childNodes)
            .filter((node) => node.nodeType === Node.TEXT_NODE)
            .map((node) => node.textContent ?? "")
            .join(" ");

          const matches = [...text.matchAll(new RegExp(source, flags))];

          if (matches.length === 0 || element.getClientRects().length === 0) continue;

          const path: string[] = [];
          let current: Element | null = element;

          while (current) {
            const siblings = current.parentElement ? Array.from(current.parentElement.children).filter((sibling) => sibling.tagName === current?.tagName) : [];
            path.unshift(`${current.tagName.toLowerCase()}${siblings.length > 1 ? `[${siblings.indexOf(current) + 1}]` : ""}`);
            current = current.parentElement;
          }

          const selector = element.id ? `#${CSS.escape(element.id)}` : `xpath=/${path.join("/")}`;
          const occurrences = new Map<string, number>();

          for (const match of matches) {
            const matchedText = match[0];
            const key = matchedText.toLowerCase();
            const occurrence = occurrences.get(key) ?? 0;

            references.push({ type: "element", selector, source: matchedText, text: matchedText, occurrence });
            occurrences.set(key, occurrence + 1);
          }
        }

        return { count: references.length, references };
      }, buzzwords.source, buzzwords.flags);

    return result.count > 0
      ? { matches: true, explanation: `${result.count} banned ${result.count === 1 ? "buzzword was" : "buzzwords were"} found.`, references: result.references }
      : { matches: false };
  },
});

import { defineRule, type Reference } from "../../api/index.ts";
import { fileReference } from "../shared/index.ts";

const maximumLines = 3;

export default defineRule({
  id: "limit-hero-heading-lines",
  title: "Hero heading over three lines",
  description: "Hero headings should stay within three lines so the opening message remains concise and scannable.",
  async match(context) {
    let references: Reference[];

    if (context.type === "files") {
      references = [];

      for (const file of context.files.all()) {
        const heading = file.content.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/i);

        if (heading && (heading[0].match(/<br\s*\/?\s*>/gi)?.length ?? 0) >= maximumLines) {
          references.push(fileReference(file.path, file.content, heading.index ?? 0));
        }
      }
    } else {
      references = await context.page.$$eval("h1, [role='heading'][aria-level='1']", (headings, maximumLines) => {
        const heading = headings
          .filter((element) => {
            const box = element.getBoundingClientRect();
            const style = getComputedStyle(element);

            return box.width > 0 && box.height > 0 && box.top < innerHeight && style.visibility !== "hidden" && Number(style.opacity) > 0;
          })
          .sort((left, right) => left.getBoundingClientRect().top - right.getBoundingClientRect().top)[0];

        if (!heading) return [];

        const tops: number[] = [];
        const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);

        while (walker.nextNode()) {
          if (!walker.currentNode.textContent?.trim()) continue;

          const range = document.createRange();

          range.selectNodeContents(walker.currentNode);

          for (const box of range.getClientRects()) {
            if (!tops.some((top) => Math.abs(top - box.top) < 2)) tops.push(box.top);
          }
        }

        if (tops.length <= maximumLines) return [];

        const path: string[] = [];

        for (let node: Element | null = heading; node; node = node.parentElement) {
          const siblings = node.parentElement ? [...node.parentElement.children].filter((sibling) => sibling.tagName === node?.tagName) : [];

          path.unshift(`${node.tagName.toLowerCase()}${siblings.length > 1 ? `[${siblings.indexOf(node) + 1}]` : ""}`);
        }

        return [{
          type: "element" as const,
          selector: heading.id ? `#${CSS.escape(heading.id)}` : `xpath=/${path.join("/")}`,
          source: heading.outerHTML.slice(0, 200),
        }];
      }, maximumLines);
    }

    return references.length
      ? { matches: true, explanation: `The hero heading spans more than ${maximumLines} lines.`, references }
      : { matches: false };
  },
});

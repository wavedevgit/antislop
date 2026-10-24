import { defineRule, type Reference } from "../../api/index.ts";
import { fileReference } from "../shared/index.ts";

const badgeBeforeHeadline = /<([a-z][\w.-]*)\b([^>]*)>([^<]{1,60})<\/\1>\s*<h1\b/gi;

const pillStyle = /(?:\b(?:badge|pill)\b|\brounded-full\b|border-radius\s*:\s*(?:50%|999\d*px))/i;

export default defineRule({
  id: "no-headline-badges",
  title: "Headline badge",
  description: "AI-generated landing pages often place a decorative pill badge directly above the main headline.",
  async match(context) {
    let references: Reference[];

    if (context.type === "files") {
      references = [];

      for (const file of context.files.all()) {
        for (const match of file.content.matchAll(badgeBeforeHeadline)) {
          if (pillStyle.test(match[2] ?? "")) {
            references.push(fileReference(file.path, file.content, match.index ?? 0));
          }
        }
      }
    } else {
      references = await context.page.$$eval("h1", (headings) => headings.flatMap((heading) => {
        const badge = heading.previousElementSibling;

        if (!badge || !badge.textContent?.trim() || badge.textContent.trim().length > 60) {
          return [];
        }

        const style = getComputedStyle(badge);
        const badgeBox = badge.getBoundingClientRect();
        const headingBox = heading.getBoundingClientRect();
        const radius = Number.parseFloat(style.borderTopLeftRadius);
        const pill = radius >= badgeBox.height / 2 - 1 || /\b(?:badge|pill)\b/i.test(badge.className);

        if (!pill || badgeBox.width >= headingBox.width || badgeBox.bottom > headingBox.top + 2 || badgeBox.width === 0) {
          return [];
        }

        const path: string[] = [];
        let current: Element | null = badge;

        while (current) {
          const siblings = current.parentElement ? Array.from(current.parentElement.children).filter((sibling) => sibling.tagName === current?.tagName) : [];
          path.unshift(`${current.tagName.toLowerCase()}${siblings.length > 1 ? `[${siblings.indexOf(current) + 1}]` : ""}`);
          current = current.parentElement;
        }

        return [{
          type: "element" as const,
          selector: badge.id ? `#${CSS.escape(badge.id)}` : `xpath=/${path.join("/")}`,
          source: badge.outerHTML.slice(0, 200),
        }];
      }));
    }

    return references.length > 0
      ? { matches: true, explanation: `${references.length} ${references.length === 1 ? "badge was" : "badges were"} found above a main headline.`, references }
      : { matches: false };
  },
});

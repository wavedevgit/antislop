import { defineRule, type Files, type Reference } from "../../api/index.ts";
import { cssRules } from "../shared/styles.ts";

type TitleCounts = { titles: number; italic: number; references?: Reference[] };

function isItalic(value: string): boolean {
  return /font-style\s*:\s*(?:italic|oblique)\b/i.test(value)
    || /(?:^|;)\s*font\s*:\s*(?:italic|oblique)\b/i.test(value);
}

function sourceTitleCounts(files: Files): TitleCounts {
  const italicSelectors = cssRules(files).filter((rule) => isItalic(rule.declarations)).map((rule) => rule.selectors);
  let titles = 0;
  let italic = 0;

  for (const file of files.all()) {
    for (const heading of file.content.matchAll(/<h([1-6])\b([^>]*)>/gi)) {
      titles += 1;

      const tag = `h${heading[1]}`;
      const attributes = heading[2] ?? "";
      const classes = attributes.match(/(?:class|className)\s*=\s*(["'])(.*?)\1/)?.[2]?.split(/\s+/) ?? [];

      const styled = isItalic(attributes)
        || classes.some((className) => ["italic", "[font-style:italic]", "[font-style:oblique]"].includes(className.slice(className.lastIndexOf(":") + 1)))
        || italicSelectors.some((selectors) => selectors.split(",").some((selector) => {
          return new RegExp(`\\b${tag}\\b`, "i").test(selector)
            || classes.some((className) => new RegExp(`\\.${className}\\b`).test(selector));
        }));

      if (styled) {
        italic += 1;
      }
    }
  }

  return { titles, italic };
}

export default defineRule({
  id: "no-mostly-italic-titles",
  title: "Most titles are italic",
  description: "AI-generated websites often italicize most titles instead of building a clear typographic hierarchy.",
  async match(context) {
    const counts = context.type === "puppeteer"
      ? await context.page.$$eval("h1, h2, h3, h4, h5, h6", (headings) => {
        const visible = headings.filter((heading) => heading.textContent?.trim() && heading.getClientRects().length > 0);
        const italic = visible.filter((heading) => /^(?:italic|oblique)$/.test(getComputedStyle(heading).fontStyle));

        return {
          titles: visible.length,
          italic: italic.length,
          references: italic.map((element) => {
            const path: string[] = [];
            let current: Element | null = element;

            while (current) {
              const siblings = current.parentElement ? Array.from(current.parentElement.children).filter((sibling) => sibling.tagName === current?.tagName) : [];
              const position = siblings.indexOf(current) + 1;

              path.unshift(`${current.tagName.toLowerCase()}${siblings.length > 1 ? `[${position}]` : ""}`);
              current = current.parentElement;
            }

            return {
              type: "element" as const,
              selector: element.id ? `#${CSS.escape(element.id)}` : `xpath=/${path.join("/")}`,
              source: element.outerHTML.slice(0, 200),
            };
          }),
        };
      })
      : sourceTitleCounts(context.files);

    const matches = counts.titles >= 2 && counts.italic > counts.titles / 2;

    return matches
      ? { matches, explanation: `${counts.italic} of ${counts.titles} titles are italic. Reserve italics for emphasis instead.`, references: counts.references }
      : { matches };
  },
});

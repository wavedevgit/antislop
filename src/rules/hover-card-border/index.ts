import { defineRule, type Files, type Reference } from "../../api/index.ts";
import { cssClassStyles, isSourceCard } from "../shared/cards.ts";
import { fileReference } from "../shared/index.ts";
import { cssRules } from "../shared/styles.ts";

const border = /border(?:-(?:top|right|bottom|left))?(?:-(?:color|style|width))?\s*:\s*(?!0(?:px)?\b|none\b|transparent\b)/i;

function sourceReferences(files: Files): Reference[] {
  const hoverClasses = new Set<string>();

  for (const rule of cssRules(files)) {
    if (!border.test(rule.declarations)) continue;

    for (const match of rule.selectors.matchAll(/\.([\w-]+):hover\b/g)) {
      if (match[1]) hoverClasses.add(match[1]);
    }
  }

  const cardStyles = cssClassStyles(files);
  const references: Reference[] = [];

  for (const file of files.all()) {
    for (const tag of file.content.matchAll(/<(?:article|aside|div|li|section)\b([^>]*)>/gi)) {
      const attributes = tag[1] ?? "";
      const classes = attributes.match(/(?:class|className)\s*=\s*["']([^"']*)["']/)?.[1]?.split(/\s+/) ?? [];

      const hoverBorder = classes.some((name) => hoverClasses.has(name)
        || /^hover:border(?:-(?!0\b|transparent\b).+)?$/.test(name));

      if (hoverBorder && isSourceCard(attributes, cardStyles)) {
        references.push(fileReference(file.path, file.content, tag.index ?? 0));
      }
    }
  }

  return references;
}

export default defineRule({
  id: "no-hover-card-borders",
  title: "Card border on hover",
  description: "Adding a border only on hover makes cards shift or flash an unnecessary outline.",
  async match(context) {
    const references: Reference[] = context.type === "files"
      ? sourceReferences(context.files)
      : await context.page.evaluate((borderSource) => {
        const border = new RegExp(borderSource, "i");
        const cards = new Set<Element>();

        const visit = (rules: CSSRuleList) => {
          for (const rule of rules) {
            if (rule instanceof CSSStyleRule && rule.selectorText.includes(":hover") && border.test(rule.style.cssText)) {
              for (const selector of rule.selectorText.split(",")) {
                try {
                  document.querySelectorAll(selector.replaceAll(":hover", "")).forEach((element) => cards.add(element));
                } catch {}
              }
            } else if (rule instanceof CSSMediaRule || rule instanceof CSSSupportsRule) {
              visit(rule.cssRules);
            }
          }
        };

        for (const sheet of document.styleSheets) {
          try {
            visit(sheet.cssRules);
          } catch {}
        }

        return [...cards].flatMap((element) => {
          const style = getComputedStyle(element);
          const box = element.getBoundingClientRect();
          const radius = Number.parseFloat(style.borderTopLeftRadius);
          const filled = style.backgroundImage !== "none" || !/rgba?\(0, 0, 0, 0\)|transparent/.test(style.backgroundColor);

          if (!element.matches("article, aside, div, li, section") || !filled || radius === 0 || box.width < 80 || box.height < 40 || !element.getClientRects().length) return [];

          const path: string[] = [];

          for (let node: Element | null = element; node; node = node.parentElement) {
            const siblings = node.parentElement ? [...node.parentElement.children].filter((sibling) => sibling.tagName === node?.tagName) : [];
            path.unshift(`${node.tagName.toLowerCase()}${siblings.length > 1 ? `[${siblings.indexOf(node) + 1}]` : ""}`);
          }

          return [{
            type: "element" as const,
            selector: element.id ? `#${CSS.escape(element.id)}` : `xpath=/${path.join("/")}`,
            source: element.outerHTML.slice(0, 200),
          }];
        });
      }, border.source);

    return references.length
      ? {
        matches: true,
        explanation: `${references.length} ${references.length === 1 ? "card adds" : "cards add"} a border on hover.`,
        references,
      }
      : { matches: false };
  },
});

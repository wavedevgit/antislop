import { defineRule, type Files } from "../../api/index.ts";
import { cssClassStyles, isSourceCard, voidElements } from "../shared/cards.ts";

const cardContainers = new Set(["article", "aside", "div", "footer", "form", "header", "li", "main", "nav", "section"]);

function countNestedSourceCards(files: Files): number {
  const classStyles = cssClassStyles(files);
  let nestedCards = 0;

  for (const file of files.all()) {
    const stack: Array<{ tag: string; card: boolean }> = [];

    for (const tagMatch of file.content.matchAll(/<\s*(\/)?\s*([A-Za-z][\w.-]*)([^>]*)>/g)) {
      const closing = Boolean(tagMatch[1]);
      const tag = tagMatch[2]?.toLowerCase();
      const attributes = tagMatch[3] ?? "";

      if (!tag) {
        continue;
      }

      if (closing) {
        let opening = stack.length - 1;

        while (opening >= 0 && stack[opening]?.tag !== tag) {
          opening -= 1;
        }

        if (opening >= 0) {
          stack.length = opening;
        }

        continue;
      }

      const card = cardContainers.has(tag) && isSourceCard(attributes, classStyles);

      if (card && stack.some((entry) => entry.card)) {
        nestedCards += 1;
      }

      if (!attributes.trimEnd().endsWith("/") && !voidElements.has(tag)) {
        stack.push({ tag, card });
      }
    }
  }

  return nestedCards;
}

export default defineRule({
  id: "card-in-card",
  title: "Cards inside cards",
  description: "AI-generated websites often nest rounded, filled containers inside each other, creating unnecessary visual layers.",
  async match(context) {
    const result = context.type === "puppeteer"
      ? await context.page.$$eval("*", (elements) => {
        const cards = new Set<Element>();
        const containerTags = new Set(["ARTICLE", "ASIDE", "DIV", "FOOTER", "FORM", "HEADER", "LI", "MAIN", "NAV", "SECTION"]);

        for (const element of elements) {
          if (!containerTags.has(element.tagName)) {
            continue;
          }

          const style = getComputedStyle(element);

          const rounded = [
            style.borderTopLeftRadius,
            style.borderTopRightRadius,
            style.borderBottomLeftRadius,
            style.borderBottomRightRadius,
          ].some((radius) => Number.parseFloat(radius) > 0);

          const background = style.backgroundImage !== "none"
            || (style.backgroundColor !== "transparent" && !style.backgroundColor.endsWith(", 0)"));

          const box = element.getBoundingClientRect();
          const containerSized = box.width >= 80 && box.height >= 40;

          if (rounded && background && containerSized && element.getClientRects().length > 0) {
            cards.add(element);
          }
        }

        const references: Array<{ type: "element"; selector: string; source: string }> = [];

        for (const card of cards) {
          let parent = card.parentElement;

          while (parent) {
            if (cards.has(parent)) {
              const path: string[] = [];
              let current: Element | null = card;

              while (current) {
                const siblings = current.parentElement ? Array.from(current.parentElement.children).filter((sibling) => sibling.tagName === current?.tagName) : [];
                const position = siblings.indexOf(current) + 1;

                path.unshift(`${current.tagName.toLowerCase()}${siblings.length > 1 ? `[${position}]` : ""}`);
                current = current.parentElement;
              }

              const selector = card.id ? `#${CSS.escape(card.id)}` : `xpath=/${path.join("/")}`;

              references.push({ type: "element", selector, source: card.outerHTML.slice(0, 200) });
              break;
            }

            parent = parent.parentElement;
          }
        }

        return { count: references.length, references };
      })
      : { count: countNestedSourceCards(context.files), references: undefined };

    return result.count > 0
      ? { matches: true, explanation: `${result.count} rounded containers with backgrounds were nested inside another such container.`, references: result.references }
      : { matches: false };
  },
});

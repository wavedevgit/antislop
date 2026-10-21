import { defineRule, type Files } from "../../api/index.ts";
import { cssClassStyles, isSourceCard, voidElements } from "../shared/cards.ts";

function countSourceLogos(files: Files): number {
  const classStyles = cssClassStyles(files);
  const logos = new Set<number>();
  let nextCard = 0;

  for (const file of files.all()) {
    const stack: Array<{ tag: string; card?: number }> = [];

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

      if (tag === "svg") {
        for (let index = stack.length - 1; index >= 0; index -= 1) {
          const card = stack[index]?.card;

          if (card !== undefined) {
            logos.add(card);
            break;
          }
        }
      }

      const card = isSourceCard(attributes, classStyles) ? nextCard++ : undefined;

      if (!attributes.trimEnd().endsWith("/") && !voidElements.has(tag)) {
        stack.push({ tag, card });
      }
    }
  }

  return logos.size;
}

export default defineRule({
  id: "fake-logo",
  title: "SVG inside a logo card",
  description: "AI-generated websites often present a generic SVG inside a rounded, filled card as fake branding.",
  async match(context) {
    const fakeLogos = context.type === "puppeteer"
      ? await context.page.$$eval("*", (elements) => {
        let total = 0;

        for (const element of elements) {
          const style = getComputedStyle(element);

          const rounded = [
            style.borderTopLeftRadius,
            style.borderTopRightRadius,
            style.borderBottomLeftRadius,
            style.borderBottomRightRadius,
          ].some((radius) => Number.parseFloat(radius) > 0);

          const background = style.backgroundImage !== "none"
            || (style.backgroundColor !== "transparent" && !style.backgroundColor.endsWith(", 0)"));

          if (rounded && background && element.querySelector("svg") && element.getClientRects().length > 0) {
            total += 1;
          }
        }

        return total;
      })
      : countSourceLogos(context.files);

    return fakeLogos > 0
      ? { matches: true, explanation: `${fakeLogos} rounded logo cards containing an SVG were found.` }
      : { matches: false };
  },
});

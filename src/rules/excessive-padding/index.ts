import { defineRule, type Files, type Reference } from "../../api/index.ts";
import { fileReference } from "../shared/index.ts";

const minimumPixels = 48;

const minimumMatches = 3;

const compactCardPixels = 24;

function pixels(value: string): number | undefined {
  const match = value.trim().match(/^([\d.]+)\s*(px|rem|em)$/i);

  if (!match?.[1] || !match[2]) {
    return undefined;
  }

  const amount = Number(match[1]);

  return Number.isFinite(amount) ? amount * (match[2].toLowerCase() === "px" ? 1 : 16) : undefined;
}

function isExcessive(value: string, minimum = minimumPixels): boolean {
  const amount = pixels(value);

  return amount !== undefined && amount >= minimum;
}

function paddingClass(value: string, minimum = minimumPixels): boolean {
  const utility = value.slice(value.lastIndexOf(":") + 1);
  const spacing = utility.match(/^p[trblxy]?-(\d+)$/)?.[1];

  return (spacing !== undefined && Number(spacing) * 4 >= minimum)
    || isExcessive(utility.match(/^p[trblxy]?-\[([^\]]+)\]$/)?.[1] ?? "", minimum);
}

function sourceReferences(files: Files) {
  const references: Reference[] = [];
  const compactCards: Reference[] = [];

  for (const file of files.all()) {
    for (const match of file.content.matchAll(/padding(?:-(?:top|right|bottom|left))?\s*:\s*([^;}]+)/gi)) {
      const values = match[1]?.split(/\s+/).map(pixels).filter((value): value is number => value !== undefined) ?? [];

      if (values.some((value) => value >= minimumPixels)) {
        references.push(fileReference(file.path, file.content, match.index ?? 0));
      }
    }

    for (const match of file.content.matchAll(/(?:class|className)\s*=\s*(["'])(.*?)\1/gi)) {
      if (match[2]?.split(/\s+/).some(paddingClass)) {
        references.push(fileReference(file.path, file.content, match.index ?? 0));
      }
    }

    for (const match of file.content.matchAll(/<[a-z][\w.-]*\b([^>]*)>/gi)) {
      const attributes = match[1] ?? "";
      const classes = attributes.match(/(?:class|className)\s*=\s*["']([^"']*)["']/)?.[1]?.split(/\s+/) ?? [];
      const isCard = classes.some((name) => /(?:^|-)card(?:-|$)/i.test(name));

      const padded = classes.some((name) => paddingClass(name, compactCardPixels))
        || [...attributes.matchAll(/padding(?:-(?:top|right|bottom|left))?\s*:\s*([^;}]+)/gi)]
          .some((padding) => padding[1]?.split(/\s+/).some((value) => isExcessive(value, compactCardPixels)));

      if (isCard && padded) {
        compactCards.push(fileReference(file.path, file.content, match.index ?? 0));
      }
    }
  }

  return { references, compactCards };
}

export default defineRule({
  id: "no-excessive-padding",
  title: "Excessive padding",
  description: "AI-generated sites often add large amounts of padding to ordinary elements without a clear layout reason.",
  async match(context) {
    if (context.type === "files") {
      const { references, compactCards } = sourceReferences(context.files);

      return references.length >= minimumMatches || compactCards.length > 0
        ? {
          matches: true,
          explanation: compactCards.length > 0
            ? `${compactCards.length} compact ${compactCards.length === 1 ? "card uses" : "cards use"} at least ${compactCardPixels}px of padding.`
            : `${references.length} padding declarations or utility classes use at least ${minimumPixels}px.`,
          references: compactCards.length > 0 ? compactCards : references,
        }
        : { matches: false };
    }

    const result = await context.page.$$eval("body *", (elements, limit, cardLimit) => {
      const references = elements.flatMap((element) => {
        const style = getComputedStyle(element);
        const padding = [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft].map(Number.parseFloat);
        const text = Array.from(element.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());

        const compactCard = Array.from(element.classList).some((name) => /(?:^|-)card(?:-|$)/i.test(name))
          && Boolean(element.textContent?.trim())
          && padding.some((value) => value >= cardLimit);

        const oversizedDisclosure = element.tagName === "DETAILS"
          && !element.hasAttribute("open")
          && padding[0] !== undefined
          && padding[2] !== undefined
          && padding[0] + padding[2] >= 32
          && element.getBoundingClientRect().height >= 72;

        if ((!text && !oversizedDisclosure && !compactCard) || element.getClientRects().length === 0 || ["BODY", "MAIN", "SECTION", "HEADER", "FOOTER"].includes(element.tagName) || (!oversizedDisclosure && !compactCard && !padding.some((value) => value >= limit))) {
          return [];
        }

        const path: string[] = [];
        let current: Element | null = element;

        while (current) {
          const siblings = current.parentElement ? Array.from(current.parentElement.children).filter((sibling) => sibling.tagName === current?.tagName) : [];
          path.unshift(`${current.tagName.toLowerCase()}${siblings.length > 1 ? `[${siblings.indexOf(current) + 1}]` : ""}`);
          current = current.parentElement;
        }

        return [{ type: "element" as const, selector: element.id ? `#${CSS.escape(element.id)}` : `xpath=/${path.join("/")}`, source: element.outerHTML.slice(0, 200) }];
      });

      return { references, compactCards: references.filter((reference) => /(?:^|["'\s-])card(?:["'\s-]|$)/i.test(reference.source)).length };
    }, minimumPixels, compactCardPixels);

    return result.references.length >= minimumMatches || result.compactCards > 0
      ? { matches: true, explanation: `${result.references.length} visible elements use excessive padding or oversized collapsed disclosure rows.`, references: result.references }
      : { matches: false };
  },
});

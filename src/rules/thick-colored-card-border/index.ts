import { defineRule, type Files, type Reference } from "../../api/index.ts";
import { cssClassStyles, isSourceCard } from "../shared/cards.ts";
import { fileReference } from "../shared/index.ts";
import { cssRules } from "../shared/styles.ts";

const cardContainers = new Set(["article", "aside", "div", "li", "section"]);

const neutralColors = /\b(?:black|white|gray|grey|slate|zinc|neutral|stone|transparent|currentcolor)\b/i;

function isColored(value: string): boolean {
  const hex = value.match(/#([\da-f]{3}|[\da-f]{6})\b/i)?.[1];
  const rgb = value.match(/rgba?\(\s*(\d+)\D+(\d+)\D+(\d+)/i);
  const hsl = value.match(/hsla?\(\s*[\d.]+(?:deg)?\s*[, ]\s*([\d.]+)%/i);

  const channels = hex
    ? (hex.length === 3 ? [...hex].map((part) => Number.parseInt(part + part, 16)) : [0, 2, 4].map((index) => Number.parseInt(hex.slice(index, index + 2), 16)))
    : rgb?.slice(1, 4).map(Number);

  return channels ? Math.max(...channels) - Math.min(...channels) >= 40 : Number(hsl?.[1] ?? 0) >= 25 || (!neutralColors.test(value) && /\b(?:blue|cyan|emerald|fuchsia|green|indigo|lime|orange|pink|purple|red|rose|sky|teal|violet|yellow)\b/i.test(value));
}

function hasThickBorder(value: string): boolean {
  return [...value.matchAll(/(?:^|[;"'\s])border(?:-width|Width)?\s*[:=]\s*["']?([\d.]+)(px|rem|em)?/gi)]
    .some((match) => Number(match[1]) * (match[2]?.toLowerCase() === "rem" || match[2]?.toLowerCase() === "em" ? 16 : 1) >= 2);
}

function styledClasses(files: Files) {
  const thick = new Set<string>();
  const colored = new Set<string>();

  for (const rule of cssRules(files)) {
    for (const selector of rule.selectors.matchAll(/\.([\w-]+)/g)) {
      if (hasThickBorder(rule.declarations)) thick.add(selector[1] ?? "");

      if (/border(?:-color)?\s*:/i.test(rule.declarations) && isColored(rule.declarations)) colored.add(selector[1] ?? "");
    }
  }

  return { thick, colored };
}

function hasThickColoredBorder(attributes: string, classes: ReturnType<typeof styledClasses>): boolean {
  const names = attributes.match(/(?:class|className)\s*=\s*["']([^"']*)["']/)?.[1]?.split(/\s+/) ?? [];
  const utilities = names.map((name) => name.slice(name.lastIndexOf(":") + 1));

  const thick = hasThickBorder(attributes)
    || names.some((name) => classes.thick.has(name))
    || utilities.some((name) => /^border-(?:[2-9]|\[([2-9]|\d{2,})(?:px)?\])$/.test(name));

  const colored = isColored(attributes)
    || names.some((name) => classes.colored.has(name))
    || utilities.some((name) => /^border-(?:blue|cyan|emerald|fuchsia|green|indigo|lime|orange|pink|purple|red|rose|sky|teal|violet|yellow)(?:-|$)/.test(name));

  return thick && colored;
}

function sourceReferences(files: Files): Reference[] {
  const references: Reference[] = [];
  const cardStyles = cssClassStyles(files);
  const classes = styledClasses(files);

  for (const file of files.all()) {
    for (const tag of file.content.matchAll(/<([A-Za-z][\w.-]*)([^>]*)>/g)) {
      const name = tag[1]?.toLowerCase();
      const attributes = tag[2] ?? "";

      if (name && cardContainers.has(name) && isSourceCard(attributes, cardStyles) && hasThickColoredBorder(attributes, classes)) {
        references.push(fileReference(file.path, file.content, tag.index ?? 0));
      }
    }
  }

  return references;
}

export default defineRule({
  id: "no-thick-colored-card-borders",
  title: "Thick colored card borders",
  description: "A thick colored border makes a rounded card's outline compete with its content.",
  async match(context) {
    const references: Reference[] = context.type === "files"
      ? sourceReferences(context.files)
      : await context.page.$$eval("article, aside, div, li, section", (elements) => elements.flatMap((element) => {
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();
        const widths = [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth].map(Number.parseFloat);
        const color = style.borderTopColor.match(/rgba?\(\s*(\d+)\D+(\d+)\D+(\d+)/i)?.slice(1, 4).map(Number);
        const radius = Math.max(...[style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomLeftRadius, style.borderBottomRightRadius].map(Number.parseFloat));
        const background = style.backgroundImage !== "none" || (style.backgroundColor !== "transparent" && !style.backgroundColor.endsWith(", 0)"));

        if (Math.min(...widths) < 2 || !color || Math.max(...color) - Math.min(...color) < 40 || radius === 0 || !background || box.width < 80 || box.height < 40 || element.getClientRects().length === 0) return [];

        return [{ type: "element" as const, selector: element.id ? `#${CSS.escape(element.id)}` : element.tagName.toLowerCase(), source: element.outerHTML.slice(0, 200) }];
      }));

    return references.length > 0
      ? { matches: true, explanation: `${references.length} rounded ${references.length === 1 ? "card has" : "cards have"} a thick colored border.`, references }
      : { matches: false };
  },
});

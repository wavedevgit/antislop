import { defineRule, type Files, type Reference } from "../../api/index.ts";
import { cssClassStyles, isSourceCard } from "../shared/cards.ts";
import { fileReference } from "../shared/index.ts";
import { cssRules } from "../shared/styles.ts";

const cardContainers = new Set(["article", "aside", "div", "li", "section"]);

function pixels(value: string, unit: string | undefined): number {
  return Number(value) * (unit?.toLowerCase() === "rem" || unit?.toLowerCase() === "em" ? 16 : 1);
}

function hasHairlineBorder(value: string): boolean {
  const match = value.match(/(?:^|[;"'\s])border(?:-width|Width)?\s*[:=]\s*["']?([\d.]+)(px|rem|em)?/i);

  return match?.[1] !== undefined && pixels(match[1], match[2]) > 0 && pixels(match[1], match[2]) <= 1;
}

function hasWideShadow(value: string): boolean {
  const shadow = value.match(/(?:box-shadow|boxShadow)\s*[:=]\s*["']?([^;"'}]+)/i)?.[1];

  if (!shadow || /\bnone\b/i.test(shadow)) return false;

  return [...shadow.matchAll(/(-?[\d.]+)(px|rem|em)/gi)]
    .some((match) => Math.abs(pixels(match[1] ?? "0", match[2])) >= 16);
}

function styledClasses(files: Files) {
  const hairline = new Set<string>();
  const shadow = new Set<string>();

  for (const rule of cssRules(files)) {
    for (const selector of rule.selectors.matchAll(/\.([\w-]+)/g)) {
      const name = selector[1] ?? "";

      if (hasHairlineBorder(rule.declarations)) hairline.add(name);

      if (hasWideShadow(rule.declarations)) shadow.add(name);
    }
  }

  return { hairline, shadow };
}

function isGhostCard(attributes: string, classes: ReturnType<typeof styledClasses>): boolean {
  const names = attributes.match(/(?:class|className)\s*=\s*["']([^"']*)["']/)?.[1]?.split(/\s+/) ?? [];
  const utilities = names.map((name) => name.slice(name.lastIndexOf(":") + 1));

  const hairline = hasHairlineBorder(attributes)
    || names.some((name) => classes.hairline.has(name))
    || utilities.includes("border")
    || utilities.includes("border-1");

  const shadow = hasWideShadow(attributes)
    || names.some((name) => classes.shadow.has(name))
    || utilities.some((name) => /^(?:shadow-xl|shadow-2xl|shadow-\[.+\])$/.test(name));

  return hairline && shadow;
}

function sourceReferences(files: Files): Reference[] {
  const references: Reference[] = [];
  const cardStyles = cssClassStyles(files);
  const classes = styledClasses(files);

  for (const file of files.all()) {
    for (const tag of file.content.matchAll(/<([A-Za-z][\w.-]*)([^>]*)>/g)) {
      const name = tag[1]?.toLowerCase();
      const attributes = tag[2] ?? "";

      if (name && cardContainers.has(name) && isSourceCard(attributes, cardStyles) && isGhostCard(attributes, classes)) {
        references.push(fileReference(file.path, file.content, tag.index ?? 0));
      }
    }
  }

  return references;
}

export default defineRule({
  id: "no-ghost-cards",
  title: "Ghost cards",
  description: "A hairline border paired with a wide soft shadow makes both effects compete to define the same card.",
  async match(context) {
    const references: Reference[] = context.type === "files"
      ? sourceReferences(context.files)
      : await context.page.$$eval("article, aside, div, li, section", (elements) => elements.flatMap((element) => {
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();
        const widths = [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth].map(Number.parseFloat);
        const shadowWidths = [...style.boxShadow.matchAll(/-?[\d.]+px/g)].map((match) => Math.abs(Number.parseFloat(match[0])));
        const radius = Math.max(...[style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomLeftRadius, style.borderBottomRightRadius].map(Number.parseFloat));
        const background = style.backgroundImage !== "none" || (style.backgroundColor !== "transparent" && !style.backgroundColor.endsWith(", 0)"));
        const hairline = widths.every((width) => width > 0 && width <= 1);

        if (!hairline || !shadowWidths.some((width) => width >= 16) || radius === 0 || !background || box.width < 80 || box.height < 40 || element.getClientRects().length === 0) return [];

        return [{ type: "element" as const, selector: element.id ? `#${CSS.escape(element.id)}` : element.tagName.toLowerCase(), source: element.outerHTML.slice(0, 200) }];
      }));

    return references.length > 0
      ? { matches: true, explanation: `${references.length} ghost ${references.length === 1 ? "card pairs" : "cards pair"} a hairline border with a wide shadow.`, references }
      : { matches: false };
  },
});

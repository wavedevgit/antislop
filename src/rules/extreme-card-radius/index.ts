import { defineRule, type Files, type Reference } from "../../api/index.ts";
import { cssClassStyles, isSourceCard } from "../shared/cards.ts";
import { fileReference } from "../shared/index.ts";
import { cssRules } from "../shared/styles.ts";

const cardContainers = new Set(["article", "aside", "div", "li", "section"]);

function radiusInPixels(value: string): number {
  const match = value.trim().match(/^([\d.]+)(px|rem|em)$/i);

  return match ? Number(match[1]) * (/^(?:rem|em)$/i.test(match[2] ?? "") ? 16 : 1) : 0;
}

function extremeRadius(value: string): boolean {
  const radius = value.match(/(?:border-radius|borderRadius)\s*[:=]\s*["']?([^;"'},\s]+)/i)?.[1];

  return radius !== undefined && radiusInPixels(radius) >= 24;
}

function extremeClasses(files: Files): Set<string> {
  const classes = new Set<string>();

  for (const rule of cssRules(files)) {
    if (!extremeRadius(rule.declarations)) continue;

    for (const selector of rule.selectors.matchAll(/\.([\w-]+)/g)) classes.add(selector[1] ?? "");
  }

  return classes;
}

function hasExtremeRadius(attributes: string, classes: Set<string>): boolean {
  if (extremeRadius(attributes)) return true;

  const names = attributes.match(/(?:class|className)\s*=\s*["']([^"']*)["']/)?.[1]?.split(/\s+/) ?? [];

  return names.some((name) => {
    const utility = name.slice(name.lastIndexOf(":") + 1);
    const arbitrary = utility.match(/^rounded-\[([\d.]+)(px|rem|em)\]$/i);

    return classes.has(name) || utility === "rounded-3xl" || (arbitrary !== null && radiusInPixels(`${arbitrary[1]}${arbitrary[2]}`) >= 24);
  });
}

function sourceReferences(files: Files): Reference[] {
  const references: Reference[] = [];
  const cardStyles = cssClassStyles(files);
  const classes = extremeClasses(files);

  for (const file of files.all()) {
    for (const tag of file.content.matchAll(/<([A-Za-z][\w.-]*)([^>]*)>/g)) {
      const name = tag[1]?.toLowerCase();
      const attributes = tag[2] ?? "";

      if (name && cardContainers.has(name) && isSourceCard(attributes, cardStyles) && hasExtremeRadius(attributes, classes)) {
        references.push(fileReference(file.path, file.content, tag.index ?? 0));
      }
    }
  }

  return references;
}

export default defineRule({
  id: "no-extreme-card-radius",
  title: "Extreme border-radius on cards",
  description: "Large corner radii can squeeze card content and make every card look alike.",
  async match(context) {
    const references: Reference[] = context.type === "files"
      ? sourceReferences(context.files)
      : await context.page.$$eval("article, aside, div, li, section", (elements) => elements.flatMap((element) => {
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();
        const radius = Math.max(...[style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomLeftRadius, style.borderBottomRightRadius].map(Number.parseFloat));
        const background = style.backgroundImage !== "none" || (style.backgroundColor !== "transparent" && !style.backgroundColor.endsWith(", 0)"));

        if (radius < 24 || radius < Math.min(box.width, box.height) * 0.2 || !background || box.width < 120 || box.height < 72 || element.children.length === 0 || element.getClientRects().length === 0) return [];

        return [{ type: "element" as const, selector: element.id ? `#${CSS.escape(element.id)}` : element.tagName.toLowerCase(), source: element.outerHTML.slice(0, 200) }];
      }));

    return references.length > 0
      ? { matches: true, explanation: `${references.length} ${references.length === 1 ? "card has" : "cards have"} an extreme corner radius.`, references }
      : { matches: false };
  },
});

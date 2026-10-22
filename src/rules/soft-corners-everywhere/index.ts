import { defineRule, type Files, type Reference } from "../../api/index.ts";
import { fileReference } from "../shared/index.ts";

const roundedUtilities = new Set(["rounded", "rounded-lg", "rounded-xl", "rounded-2xl", "rounded-3xl"]);

function radiusInPixels(value: string): number {
  const match = value.trim().match(/^([\d.]+)(px|rem|em)?/);

  if (!match?.[1]) {
    return 0;
  }

  const radius = Number(match[1]);

  return match[2] === "rem" || match[2] === "em" ? radius * 16 : radius;
}

function sourceReferences(files: Files): Reference[] {
  const references: Reference[] = [];

  for (const file of files.all()) {
    for (const match of file.content.matchAll(/(?:border-radius|borderRadius)\s*[:=]\s*["']?([^;"'},\s]+)/gi)) {
      const radius = radiusInPixels(match[1] ?? "");

      if (radius >= 8 && radius <= 12) {
        references.push(fileReference(file.path, file.content, match.index ?? 0));
      }
    }

    for (const attribute of file.content.matchAll(/(?:class|className)\s*=\s*(["'])(.*?)\1/g)) {
      const rounded = attribute[2]?.split(/\s+/).some((name) => roundedUtilities.has(name.slice(name.lastIndexOf(":") + 1)));

      if (rounded) {
        references.push(fileReference(file.path, file.content, attribute.index ?? 0));
      }
    }
  }

  return references;
}

export default defineRule({
  id: "soft-corners-everywhere",
  title: "Soft corners everywhere",
  description: "AI-generated websites often apply the same soft corner radius to nearly every interface surface.",
  async match(context) {
    if (context.type === "files") {
      const references = sourceReferences(context.files);

      return references.length >= 5
        ? { matches: true, explanation: `${references.length} soft corner-radius declarations or utilities were found throughout the source.`, references }
        : { matches: false };
    }

    const result = await context.page.$$eval("article, aside, button, div, footer, form, header, input, li, main, nav, section, a", (elements) => {
      const candidates: Element[] = [];
      const rounded: Element[] = [];

      for (const element of elements) {
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();

        const radii = [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomLeftRadius, style.borderBottomRightRadius]
          .map(Number.parseFloat);

        const radius = Math.max(...radii);
        const pillOrCircle = radius >= Math.min(box.width, box.height) * 0.4;

        const surface = style.backgroundImage !== "none"
          || !/rgba?\([^)]*,\s*0(?:\.0+)?\s*\)/.test(style.backgroundColor)
          || style.boxShadow !== "none"
          || [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth].some((width) => Number.parseFloat(width) > 0);

        if (element.getClientRects().length === 0 || box.width < 40 || box.height < 24 || !surface || pillOrCircle) {
          continue;
        }

        candidates.push(element);

        if (radius >= 8 && radius <= 12) {
          rounded.push(element);
        }
      }

      const references = rounded.map((element) => {
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
      });

      return { candidates: candidates.length, rounded: rounded.length, references };
    });

    const matches = result.rounded >= 5 && result.rounded / result.candidates >= 0.6;

    return matches
      ? { matches, explanation: `${result.rounded} of ${result.candidates} eligible interface surfaces use soft corner radii.`, references: result.references }
      : { matches };
  },
});

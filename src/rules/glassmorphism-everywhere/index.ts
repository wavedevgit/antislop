import { defineRule, type Files, type Reference } from "../../api/index.ts";
import { fileReference } from "../shared/index.ts";
import { cssRules } from "../shared/styles.ts";

const minimumSurfaces = 3;

function hasBackdropBlur(value: string): boolean {
  return /(?:-webkit-)?backdrop-filter\s*:\s*[^;]*blur\s*\(/i.test(value)
    || /\bbackdrop-blur(?!-none)(?:-[^\s"']+)?\b/.test(value);
}

function glassClasses(files: Files): Set<string> {
  const classes = new Set<string>();

  for (const rule of cssRules(files)) {
    if (!hasBackdropBlur(rule.declarations)) continue;

    for (const selector of rule.selectors.matchAll(/\.([\w-]+)/g)) {
      classes.add(selector[1] ?? "");
    }
  }

  return classes;
}

function sourceReferences(files: Files): Reference[] {
  const references: Reference[] = [];
  const classes = glassClasses(files);

  for (const file of files.all()) {
    for (const tag of file.content.matchAll(/<([A-Za-z][\w.-]*)([^>]*)>/g)) {
      const attributes = tag[2] ?? "";
      const names = attributes.match(/(?:class|className)\s*=\s*["']([^"']*)["']/)?.[1]?.split(/\s+/) ?? [];
      const glass = hasBackdropBlur(attributes) || names.some((name) => classes.has(name));

      if (glass) {
        references.push(fileReference(file.path, file.content, tag.index ?? 0));
      }
    }
  }

  return references;
}

export default defineRule({
  id: "no-glassmorphism-everywhere",
  title: "Glassmorphism everywhere",
  description: "Blur effects, glass cards, and glow borders are often used as decoration rather than to solve a real layering problem.",
  async match(context) {
    const references: Reference[] = context.type === "files"
      ? sourceReferences(context.files)
      : await context.page.$$eval("*", (elements) => elements.flatMap((element) => {
        const style = getComputedStyle(element);
        const backdrop = `${style.backdropFilter} ${style.getPropertyValue("-webkit-backdrop-filter")}`;

        if (!/blur\s*\(/i.test(backdrop) || element.getClientRects().length === 0) return [];

        const path: string[] = [];
        let current: Element | null = element;

        while (current) {
          const siblings = current.parentElement ? Array.from(current.parentElement.children).filter((sibling) => sibling.tagName === current?.tagName) : [];
          path.unshift(`${current.tagName.toLowerCase()}${siblings.length > 1 ? `[${siblings.indexOf(current) + 1}]` : ""}`);
          current = current.parentElement;
        }

        return [{ type: "element" as const, selector: element.id ? `#${CSS.escape(element.id)}` : `xpath=/${path.join("/")}`, source: element.outerHTML.slice(0, 200) }];
      }));

    return references.length >= minimumSurfaces
      ? { matches: true, explanation: `${references.length} surfaces use decorative backdrop blur.`, references }
      : { matches: false };
  },
});

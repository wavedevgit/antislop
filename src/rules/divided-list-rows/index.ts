import { defineRule, type Files, type Reference } from "../../api/index.ts";
import { fileReference } from "../shared/index.ts";
import { cssRules } from "../shared/styles.ts";

const minimumRows = 3;

function sourceReferences(files: Files): Reference[] {
  const references: Reference[] = [];

  for (const file of files.all()) {
    for (const rule of cssRules({ all: () => [file], get: () => file, search: () => [] })) {
      if (!/border-(?:bottom|top)\s*:/i.test(rule.declarations)) continue;

      if (/(?:^|;)\s*border\s*:|border-(?:left|right)\s*:/i.test(rule.declarations)) continue;

      for (const className of rule.selectors.matchAll(/\.([\w-]+)/g)) {
        const name = className[1];
        const rows = [...file.content.matchAll(new RegExp(`class\\s*=\\s*["'][^"']*\\b${name}\\b`, "g"))];

        if (rows.length >= minimumRows) {
          references.push(...rows.map((row) => fileReference(file.path, file.content, row.index ?? 0)));
        }
      }
    }
  }

  return references;
}

export default defineRule({
  id: "divided-list-rows",
  title: "Divided list rows",
  description: "AI-generated sites often present ordinary content as repeated multi-column rows separated by horizontal rules.",
  async match(context) {
    if (context.type === "files") {
      const references = sourceReferences(context.files);

      return references.length >= minimumRows
        ? { matches: true, explanation: `${references.length} repeated rows with divider styling were found.`, references }
        : { matches: false };
    }

    const result = await context.page.$$eval("li, tr, article, section, div", (elements) => {
      const candidates = elements.filter((element) => {
        const style = getComputedStyle(element);
        const children = Array.from(element.children);
        const horizontalBorder = Number.parseFloat(style.borderBottomWidth) > 0 || Number.parseFloat(style.borderTopWidth) > 0;
        const sideBorder = Number.parseFloat(style.borderLeftWidth) > 0 || Number.parseFloat(style.borderRightWidth) > 0;

        const rounded = Math.max(
          Number.parseFloat(style.borderTopLeftRadius),
          Number.parseFloat(style.borderTopRightRadius),
          Number.parseFloat(style.borderBottomLeftRadius),
          Number.parseFloat(style.borderBottomRightRadius),
        ) > 2;

        return element.getClientRects().length > 0
          && horizontalBorder
          && !sideBorder
          && !rounded
          && children.filter((child) => child.textContent?.trim()).length >= 2;
      });

      const groups = new Map<string, Element[]>();

      for (const element of candidates) {
        const key = `${element.tagName}:${element.className}`;
        const group = groups.get(key) ?? [];
        group.push(element);
        groups.set(key, group);
      }

      const rows = [...groups.values()].filter((group) => group.length >= 3).flat();

      return rows.map((element) => {
        const path: string[] = [];
        let current: Element | null = element;

        while (current) {
          const siblings = current.parentElement ? Array.from(current.parentElement.children).filter((sibling) => sibling.tagName === current?.tagName) : [];
          path.unshift(`${current.tagName.toLowerCase()}${siblings.length > 1 ? `[${siblings.indexOf(current) + 1}]` : ""}`);
          current = current.parentElement;
        }

        return { type: "element" as const, selector: element.id ? `#${CSS.escape(element.id)}` : `xpath=/${path.join("/")}`, source: element.outerHTML.slice(0, 200) };
      });
    });

    return result.length >= minimumRows
      ? { matches: true, explanation: `${result.length} repeated rows with divider styling were found.`, references: result }
      : { matches: false };
  },
});

import { defineRule, type Files, type Reference } from "../../api/index.ts";
import { fileReference } from "../shared/index.ts";

const lucideSource = /(?:from\s*|require\(\s*|import\(\s*)["'](?:lucide(?:-react|-vue-next|-svelte)?|@lucide\/[^"']+)["']|data-lucide\s*=|class(?:Name)?\s*=\s*["'][^"']*\blucide(?:\s|-[\w-]+)/gi;

function sourceReferences(files: Files): Reference[] {
  const references: Reference[] = [];

  for (const file of files.all()) {
    for (const match of file.content.matchAll(lucideSource)) {
      references.push(fileReference(file.path, file.content, match.index ?? 0));
    }
  }

  return references;
}

export default defineRule({
  id: "no-slop-icons",
  title: "Slop icons",
  description: "Lucide icons are heavily overused in AI-generated interfaces and can make products look interchangeable.",
  async match(context) {
    const references: Reference[] = context.type === "files"
      ? sourceReferences(context.files)
      : await context.page.$$eval("[class*='lucide'], [data-lucide]", (elements) => elements.flatMap((element) => {
        const lucide = element.hasAttribute("data-lucide")
          || Array.from(element.classList).some((name) => name === "lucide" || name.startsWith("lucide-"));

        if (!lucide || element.getClientRects().length === 0) return [];

        const path: string[] = [];
        let current: Element | null = element;

        while (current) {
          const siblings = current.parentElement ? Array.from(current.parentElement.children).filter((sibling) => sibling.tagName === current?.tagName) : [];
          path.unshift(`${current.tagName.toLowerCase()}${siblings.length > 1 ? `[${siblings.indexOf(current) + 1}]` : ""}`);
          current = current.parentElement;
        }

        return [{
          type: "element" as const,
          selector: element.id ? `#${CSS.escape(element.id)}` : `xpath=/${path.join("/")}`,
          source: element.outerHTML.slice(0, 200),
        }];
      }));

    return references.length > 0
      ? { matches: true, explanation: `${references.length} Lucide ${references.length === 1 ? "icon or import was" : "icons or imports were"} found.`, references }
      : { matches: false };
  },
});

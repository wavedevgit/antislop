import { defineRule, type Files, type Reference } from "../../api/index.ts";
import { fileReference } from "../shared/index.ts";

const themeControl = /(?:theme|dark[ -]?mode|light[ -]?mode|color[ -]?scheme|lucide-(?:moon|sun)|data-lucide\s*=\s*["'](?:moon|sun))/i;

function sourceReferences(files: Files): Reference[] {
  const references: Reference[] = [];

  for (const file of files.all()) {
    for (const container of file.content.matchAll(/<(nav|header)\b[^>]*>[\s\S]*?<\/\1>/gi)) {
      for (const control of (container[0] ?? "").matchAll(/<(?:button|[A-Z][\w.]*)\b[\s\S]*?(?:<\/button>|\/>)/g)) {
        if (themeControl.test(control[0])) {
          references.push(fileReference(file.path, file.content, (container.index ?? 0) + (control.index ?? 0)));
        }
      }
    }
  }

  return references;
}

export default defineRule({
  id: "no-navbar-theme-toggle",
  title: "Navbar theme switcher",
  description: "Navbar theme toggles are an AI-generated website trope that people rarely use.",
  async match(context) {
    const references: Reference[] = context.type === "files"
      ? sourceReferences(context.files)
      : await context.page.$$eval("nav button, header button, nav [role='button'], header [role='button'], nav [role='switch'], header [role='switch']", (elements) => elements.flatMap((element) => {
        const identity = [
          element.getAttribute("aria-label"),
          element.getAttribute("title"),
          element.getAttribute("data-lucide"),
          element.id,
          element.className,
          element.textContent,
          ...Array.from(element.querySelectorAll("[class], [data-lucide]")).flatMap((child) => [child.getAttribute("class"), child.getAttribute("data-lucide")]),
        ].filter(Boolean).join(" ");

        if (!/(?:theme|dark[ -]?mode|light[ -]?mode|color[ -]?scheme|lucide-(?:moon|sun)|(?:^|\s)(?:moon|sun)(?:\s|$))/i.test(identity) || element.getClientRects().length === 0) return [];

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
      ? { matches: true, explanation: `${references.length} navbar theme ${references.length === 1 ? "switcher was" : "switchers were"} found.`, references }
      : { matches: false };
  },
});

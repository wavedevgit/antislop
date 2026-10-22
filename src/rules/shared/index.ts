import type { Reference, RuleContext } from "../../api/index.ts";

export async function markup(context: RuleContext): Promise<string> {
  if (context.type === "puppeteer") {
    return context.page.content();
  }

  return context.files.all().map((file) => file.content).join("\n");
}

export function count(value: string, pattern: RegExp): number {
  return Array.from(value.matchAll(pattern)).length;
}

export function fileReference(path: string, content: string, index: number): Reference {
  const before = content.slice(0, index);
  const lineStart = before.lastIndexOf("\n") + 1;
  const lineEnd = content.indexOf("\n", index);

  return {
    type: "file",
    path,
    line: count(before, /\n/g) + 1,
    column: index - lineStart + 1,
    source: content.slice(lineStart, lineEnd === -1 ? undefined : lineEnd).trim().slice(0, 200),
  };
}

export async function textMatches(context: RuleContext, pattern: RegExp): Promise<{ count: number; references: Reference[] }> {
  if (context.type === "puppeteer") {
    return context.page.$$eval("body *", (elements, source, flags) => {
      let matches = 0;
      const references: Array<{ type: "element"; selector: string; source: string }> = [];

      for (const element of elements) {
        const text = Array.from(element.childNodes)
          .filter((node) => node.nodeType === Node.TEXT_NODE)
          .map((node) => node.textContent ?? "")
          .join(" ");

        const count = Array.from(text.matchAll(new RegExp(source, flags))).length;

        if (count === 0 || element.getClientRects().length === 0) {
          continue;
        }

        matches += count;

        const path: string[] = [];
        let current: Element | null = element;

        while (current) {
          const siblings = current.parentElement ? Array.from(current.parentElement.children).filter((sibling) => sibling.tagName === current?.tagName) : [];
          const position = siblings.indexOf(current) + 1;

          path.unshift(`${current.tagName.toLowerCase()}${siblings.length > 1 ? `[${position}]` : ""}`);
          current = current.parentElement;
        }

        const selector = element.id ? `#${CSS.escape(element.id)}` : `xpath=/${path.join("/")}`;

        references.push({ type: "element", selector, source: text.trim().slice(0, 200) });
      }

      return { count: matches, references };
    }, pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
  }

  const references: Reference[] = [];

  for (const match of context.files.search(pattern)) {
    references.push(fileReference(match.path, match.content, match.index));
  }

  return { count: references.length, references };
}

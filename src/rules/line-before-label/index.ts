import { defineRule, type Files, type Reference } from "../../api/index.ts";
import { fileReference } from "../shared/index.ts";

const siblingElements = /<([a-z][\w.-]*)\b([^>]*)>\s*<\/\1>\s*<([a-z][\w.-]*)\b[^>]*>[^<]{1,80}<\/\3>/gi;

const pseudoElement = /([^{}]+)::before\s*\{([^{}]+)\}/gi;

function isShortLine(value: string): boolean {
  const tailwind = /\b(?:h-px|h-\[(?:1|2)px\])\b/.test(value)
    && /\bw-(?:[4-9]|[1-9]\d|\[(?:1[6-9]|[2-9]\d)px\])\b/.test(value)
    && /\bbg-/.test(value);

  const css = /(?:^|[;"'])\s*(?:height|block-size)\s*[:=]\s*["']?(?:1|2)px\b/i.test(value)
    && /(?:width|inline-size)\s*[:=]\s*["']?(?:[2-9]\d|1\d{2})px\b/i.test(value)
    && /background(?:-color)?\s*[:=]/i.test(value);

  return tailwind || css;
}

function sourceReferences(files: Files): Reference[] {
  const references: Reference[] = [];

  for (const file of files.all()) {
    for (const match of file.content.matchAll(siblingElements)) {
      if (isShortLine(match[2] ?? "")) {
        references.push(fileReference(file.path, file.content, match.index ?? 0));
      }
    }

    for (const match of file.content.matchAll(pseudoElement)) {
      if (/content\s*:\s*["']{2}/i.test(match[2] ?? "") && isShortLine(match[2] ?? "")) {
        references.push(fileReference(file.path, file.content, match.index ?? 0));
      }
    }
  }

  return references;
}

export default defineRule({
  id: "no-line-before-label",
  title: "Line before label",
  description: "AI-generated sites often place a short decorative horizontal line immediately before a small label.",
  async match(context) {
    const references: Reference[] = context.type === "files"
      ? sourceReferences(context.files)
      : await context.page.$$eval("body *", (elements) => elements.flatMap((element) => {
        const children = Array.from(element.children);

        const hasLineBeforeText = children.some((child, index) => {
          const next = children[index + 1];

          if (!next?.textContent?.trim() || child.textContent?.trim()) return false;

          const box = child.getBoundingClientRect();
          const nextBox = next.getBoundingClientRect();
          const style = getComputedStyle(child);

          return box.width >= 16 && box.width <= 160 && box.height > 0 && box.height <= 2
            && nextBox.width > 0 && Math.abs((box.top + box.bottom - nextBox.top - nextBox.bottom) / 2) <= 8
            && style.backgroundColor !== "transparent";
        });

        const before = getComputedStyle(element, "::before");
        const beforeWidth = Number.parseFloat(before.width);
        const beforeHeight = Number.parseFloat(before.height);

        const hasPseudoLine = Boolean(element.textContent?.trim())
          && before.content !== "none"
          && beforeWidth >= 16 && beforeWidth <= 160
          && beforeHeight > 0 && beforeHeight <= 2
          && before.backgroundColor !== "transparent";

        if ((!hasLineBeforeText && !hasPseudoLine) || element.getClientRects().length === 0) return [];

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
      ? { matches: true, explanation: `${references.length} decorative ${references.length === 1 ? "line was" : "lines were"} found before label text.`, references }
      : { matches: false };
  },
});

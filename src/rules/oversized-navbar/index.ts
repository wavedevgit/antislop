import { defineRule, type Files, type Reference } from "../../api/index.ts";
import { fileReference } from "../shared/index.ts";
import { cssRules } from "../shared/styles.ts";

const maximumHeight = 64;

function pixels(value: string, unit: string | undefined): number {
  const amount = Number(value);

  return unit === "rem" || unit === "em" ? amount * 16 : amount;
}

function declaredHeight(value: string): number {
  let height = 0;

  for (const match of value.matchAll(/(?:min-height|height|minHeight)\s*[:=]\s*["']?([\d.]+)(px|rem|em)/gi)) {
    height = Math.max(height, pixels(match[1] ?? "0", match[2]?.toLowerCase()));
  }

  return height;
}

function classHeights(files: Files): Map<string, number> {
  const heights = new Map<string, number>();

  for (const rule of cssRules(files)) {
    const height = declaredHeight(rule.declarations);

    if (height <= maximumHeight) {
      continue;
    }

    for (const selector of rule.selectors.split(",")) {
      const className = selector.trim().match(/^\.([\w-]+)(?::[\w()-]+)*$/)?.[1];

      if (className) {
        heights.set(className, Math.max(heights.get(className) ?? 0, height));
      }
    }
  }

  return heights;
}

function tailwindHeight(className: string): number {
  const utility = className.slice(className.lastIndexOf(":") + 1);
  const spacing = utility.match(/^(?:min-)?h-(\d+(?:\.\d+)?)$/)?.[1];
  const arbitrary = utility.match(/^(?:min-)?h-\[([\d.]+)(px|rem|em)\]$/)?.slice(1);

  if (spacing) {
    return Number(spacing) * 4;
  }

  return arbitrary ? pixels(arbitrary[0] ?? "0", arbitrary[1]) : 0;
}

function sourceReferences(files: Files): Reference[] {
  const references: Reference[] = [];
  const heights = classHeights(files);

  for (const file of files.all()) {
    for (const tag of file.content.matchAll(/<(header|nav)\b([^>]*)>/gi)) {
      const attributes = tag[2] ?? "";
      const classValue = attributes.match(/(?:class|className)\s*=\s*["']([^"']*)["']/)?.[1] ?? "";
      const classHeight = Math.max(0, ...classValue.split(/\s+/).map((className) => Math.max(heights.get(className) ?? 0, tailwindHeight(className))));

      if (Math.max(declaredHeight(attributes), classHeight) > maximumHeight) {
        references.push(fileReference(file.path, file.content, tag.index ?? 0));
      }
    }
  }

  return references;
}

export default defineRule({
  id: "no-oversized-navbar",
  title: "Oversized navbar",
  description: "AI-generated websites often use desktop navigation bars taller than the content requires.",
  async match(context) {
    const references: Reference[] = context.type === "files"
      ? sourceReferences(context.files)
      : await context.page.$$eval("header, nav", (elements, limit) => {
        if (innerWidth < 768) {
          return [];
        }

        return elements.flatMap((element) => {
          if (element.tagName === "HEADER" && element.querySelector("nav")) {
            return [];
          }

          const box = element.getBoundingClientRect();
          const horizontal = box.width >= 320 && box.width / box.height >= 4 && box.top < 160;

          if (!horizontal || box.height <= limit || element.getClientRects().length === 0) {
            return [];
          }

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
        });
      }, maximumHeight);

    return references.length > 0
      ? { matches: true, explanation: `${references.length} desktop ${references.length === 1 ? "navbar taller than 64px was" : "navbars taller than 64px were"} found.`, references }
      : { matches: false };
  },
});

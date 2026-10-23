import { defineRule, type Files, type Reference } from "../../api/index.ts";
import { fileReference } from "../shared/index.ts";

const minimumPixels = 48;

const minimumMatches = 3;

function pixels(value: string): number | undefined {
  const match = value.trim().match(/^([\d.]+)\s*(px|rem|em)$/i);

  if (!match?.[1] || !match[2]) {
    return undefined;
  }

  const amount = Number(match[1]);

  return Number.isFinite(amount) ? amount * (match[2].toLowerCase() === "px" ? 1 : 16) : undefined;
}

function isExcessive(value: string): boolean {
  const amount = pixels(value);

  return amount !== undefined && amount >= minimumPixels;
}

function paddingClass(value: string): boolean {
  const utility = value.slice(value.lastIndexOf(":") + 1);

  if (/^p[trblxy]?-(?:12|14|16|20|24|32)$/.test(utility)) {
    return true;
  }

  return isExcessive(utility.match(/^p[trblxy]?-\[([^\]]+)\]$/)?.[1] ?? "");
}

function sourceReferences(files: Files): Reference[] {
  const references: Reference[] = [];

  for (const file of files.all()) {
    for (const match of file.content.matchAll(/padding(?:-(?:top|right|bottom|left))?\s*:\s*([^;}]+)/gi)) {
      const values = match[1]?.split(/\s+/).map(pixels).filter((value): value is number => value !== undefined) ?? [];

      if (values.some((value) => value >= minimumPixels)) {
        references.push(fileReference(file.path, file.content, match.index ?? 0));
      }
    }

    for (const match of file.content.matchAll(/(?:class|className)\s*=\s*(["'])(.*?)\1/gi)) {
      if (match[2]?.split(/\s+/).some(paddingClass)) {
        references.push(fileReference(file.path, file.content, match.index ?? 0));
      }
    }
  }

  return references;
}

export default defineRule({
  id: "excessive-padding",
  title: "Excessive padding",
  description: "AI-generated sites often add large amounts of padding to ordinary elements without a clear layout reason.",
  async match(context) {
    if (context.type === "files") {
      const references = sourceReferences(context.files);

      return references.length >= minimumMatches
        ? { matches: true, explanation: `${references.length} padding declarations or utility classes use at least ${minimumPixels}px.`, references }
        : { matches: false };
    }

    const references = await context.page.$$eval("body *", (elements, limit) => elements.flatMap((element) => {
      const style = getComputedStyle(element);
      const padding = [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft].map(Number.parseFloat);
      const text = Array.from(element.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());

      if (!text || element.getClientRects().length === 0 || ["BODY", "MAIN", "SECTION", "HEADER", "FOOTER"].includes(element.tagName) || !padding.some((value) => value >= limit)) {
        return [];
      }

      const path: string[] = [];
      let current: Element | null = element;

      while (current) {
        const siblings = current.parentElement ? Array.from(current.parentElement.children).filter((sibling) => sibling.tagName === current?.tagName) : [];
        path.unshift(`${current.tagName.toLowerCase()}${siblings.length > 1 ? `[${siblings.indexOf(current) + 1}]` : ""}`);
        current = current.parentElement;
      }

      return [{ type: "element" as const, selector: element.id ? `#${CSS.escape(element.id)}` : `xpath=/${path.join("/")}`, source: element.outerHTML.slice(0, 200) }];
    }), minimumPixels);

    return references.length >= minimumMatches
      ? { matches: true, explanation: `${references.length} visible text elements use at least ${minimumPixels}px of padding.`, references }
      : { matches: false };
  },
});

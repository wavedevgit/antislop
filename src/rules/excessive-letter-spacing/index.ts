import { defineRule, type Files, type Reference } from "../../api/index.ts";
import { fileReference } from "../shared/index.ts";

const minimumPixels = 0.8;

const minimumRatio = 0.05;

function pixels(value: string): number | undefined {
  const match = value.trim().match(/^([\d.]+)\s*(px|em|rem|%)$/i);

  if (!match?.[1] || !match[2]) {
    return undefined;
  }

  const amount = Number(match[1]);

  if (!Number.isFinite(amount)) {
    return undefined;
  }

  return match[2] === "%" ? amount / 6.25 : match[2].toLowerCase() === "px" ? amount : amount * 16;
}

function isExcessive(value: string): boolean {
  const amount = pixels(value);

  return amount !== undefined && amount >= minimumPixels;
}

function trackingClass(value: string): boolean {
  const utility = value.slice(value.lastIndexOf(":") + 1);

  return utility === "tracking-wider"
    || utility === "tracking-widest"
    || isExcessive(utility.match(/^tracking-\[([^\]]+)\]$/)?.[1] ?? "");
}

function sourceReferences(files: Files): Reference[] {
  const references: Reference[] = [];

  for (const file of files.all()) {
    for (const match of file.content.matchAll(/letter-spacing\s*:\s*([^;}\s]+)/gi)) {
      if (isExcessive(match[1] ?? "")) {
        references.push(fileReference(file.path, file.content, match.index ?? 0));
      }
    }

    for (const match of file.content.matchAll(/(?:class|className)\s*=\s*(["'])(.*?)\1/gi)) {
      if (match[2]?.split(/\s+/).some(trackingClass)) {
        references.push(fileReference(file.path, file.content, match.index ?? 0));
      }
    }
  }

  return references;
}

export default defineRule({
  id: "excessive-letter-spacing",
  title: "Excessive letter spacing",
  description: "AI-generated sites often add conspicuously wide tracking to ordinary text and labels.",
  async match(context) {
    if (context.type === "files") {
      const references = sourceReferences(context.files);

      return references.length
        ? { matches: true, explanation: `${references.length} excessive letter-spacing declaration${references.length === 1 ? "" : "s"} or utility classes were found.`, references }
        : { matches: false };
    }

    const references = await context.page.$$eval("body *", (elements, limits) => elements.flatMap((element) => {
      const text = Array.from(element.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent ?? "")
        .join(" ")
        .trim();

      const style = getComputedStyle(element);
      const letterSpacing = Number.parseFloat(style.letterSpacing);
      const fontSize = Number.parseFloat(style.fontSize);

      if (!text || element.getClientRects().length === 0 || !Number.isFinite(letterSpacing) || letterSpacing < limits.pixels || letterSpacing / fontSize < limits.ratio) {
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
    }), { pixels: minimumPixels, ratio: minimumRatio });

    return references.length
      ? { matches: true, explanation: `${references.length} visible text elements use conspicuously wide letter spacing.`, references }
      : { matches: false };
  },
});

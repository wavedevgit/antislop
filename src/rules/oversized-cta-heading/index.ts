import { defineRule, type Files, type Reference } from "../../api/index.ts";
import { fileReference } from "../shared/index.ts";
import { cssRules } from "../shared/styles.ts";

const threshold = 64;

const headingPattern = /<\s*(h[1-3])\b([^>]*)>/gi;

function pixels(value: string): number | undefined {
  const sizes = [...value.matchAll(/([\d.]+)\s*(px|rem|em)/gi)].map((match) => Number(match[1]) * (match[2]?.toLowerCase() === "px" ? 1 : 16));

  return sizes.length ? Math.max(...sizes) : undefined;
}

function classNames(attributes: string): string[] {
  return attributes.match(/(?:class|className)\s*=\s*["']([^"']*)["']/i)?.[1]?.split(/\s+/) ?? [];
}

function tailwindSize(name: string): number | undefined {
  const sizes = new Map([
    ["text-7xl", 72],
    ["text-8xl", 96],
    ["text-9xl", 128],
  ]);

  const utility = name.slice(name.lastIndexOf(":") + 1);

  return sizes.get(utility) ?? pixels(utility.match(/^text-\[([^\]]+)\]$/)?.[1] ?? "");
}

function headingSize(attributes: string, tag: string, file: string, firstHeading: boolean): number {
  const inline = attributes.match(/font-size\s*:\s*([^;"']+)/i)?.[1];
  const sizes = inline ? [pixels(inline)] : [];

  for (const name of classNames(attributes)) {
    sizes.push(tailwindSize(name));
  }

  for (const rule of cssRules({ all: () => [{ path: "", content: file }], get: () => undefined, search: () => [] })) {
    const selectors = rule.selectors.split(",").map((selector) => selector.trim());

    const matches = selectors.some((selector) => {
      const directTag = new RegExp(`^${tag}(?::|$)`, "i").test(selector);
      const compoundTag = new RegExp(`(?:^|[\\s>+~])${tag}(?::|$)`, "i").test(selector);
      const directClass = classNames(attributes).some((name) => selector.includes(`.${name}`));

      return directTag || directClass || (firstHeading && compoundTag);
    });

    if (!matches) {
      continue;
    }

    const value = rule.declarations.match(/font-size\s*:\s*([^;}]+)/i)?.[1];

    if (value) sizes.push(pixels(value));
  }

  return Math.max(tag === "h1" ? 32 : tag === "h2" ? 24 : 18.72, ...sizes.filter((size): size is number => size !== undefined));
}

function sourceReferences(files: Files): Reference[] {
  const references: Reference[] = [];

  for (const file of files.all()) {
    if (!/<\s*(?:a\b|button\b|[^>]+role\s*=\s*["']button)/i.test(file.content)) continue;

    let headingIndex = 0;

    for (const match of file.content.matchAll(headingPattern)) {
      const tag = match[1]?.toLowerCase();
      const attributes = match[2] ?? "";

      if (tag && headingSize(attributes, tag, file.content, headingIndex === 0) >= threshold) {
        references.push(fileReference(file.path, file.content, match.index ?? 0));
      }

      headingIndex += 1;
    }
  }

  return references;
}

export default defineRule({
  id: "oversized-cta-heading",
  title: "Oversized CTA headings",
  description: "AI-generated landing pages often pair a very large heading with a call to action.",
  async match(context) {
    if (context.type === "files") {
    const references = sourceReferences(context.files);

      return references.length ? { matches: true, explanation: `${references.length} heading${references.length === 1 ? "" : "s"} at or above ${threshold}px were found on pages with a CTA.`, references } : { matches: false };
    }

    const references = await context.page.$$eval("h1, h2, h3", (headings, limit) => headings.flatMap((heading) => {
      if (!heading.textContent?.trim() || heading.getClientRects().length === 0 || Number.parseFloat(getComputedStyle(heading).fontSize) < limit) {
        return [];
      }

      const container = heading.closest("header, main, section, article, aside, div") ?? heading.parentElement;

      if (!container || !Array.from(container.querySelectorAll("a, button, [role=button]")).some((cta) => cta.getClientRects().length > 0)) {
        return [];
      }

      const path: string[] = [];
      let current: Element | null = heading;

      while (current) {
        const siblings = current.parentElement ? Array.from(current.parentElement.children).filter((sibling) => sibling.tagName === current?.tagName) : [];
        path.unshift(`${current.tagName.toLowerCase()}${siblings.length > 1 ? `[${siblings.indexOf(current) + 1}]` : ""}`);

        current = current.parentElement;
      }

      return [{ type: "element" as const, selector: heading.id ? `#${CSS.escape(heading.id)}` : `xpath=/${path.join("/")}`, source: heading.outerHTML.slice(0, 200) }];
    }), threshold);

    return references.length ? { matches: true, explanation: `${references.length} heading${references.length === 1 ? "" : "s"} at or above ${threshold}px were found beside a CTA.`, references } : { matches: false };
  },
});

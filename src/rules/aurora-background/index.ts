import { defineRule, type Files, type Reference } from "../../api/index.ts";
import { count, fileReference } from "../shared/index.ts";

const radialGradient = /radial-gradient\s*\(/gi;

function sourceReferences(files: Files): Reference[] {
  const layered: Reference[] = [];
  const blobs: Reference[] = [];

  for (const file of files.all()) {
    for (const tag of file.content.matchAll(/<[A-Za-z][\w.-]*\b([^>]*)>/g)) {
      const attributes = tag[1] ?? "";
      const classes = attributes.match(/(?:class|className)\s*=\s*["']([^"']*)["']/)?.[1] ?? "";
      const reference = fileReference(file.path, file.content, tag.index ?? 0);

      if (/\baurora(?:-|\b)/i.test(classes) || count(attributes, radialGradient) >= 2) layered.push(reference);

      if (/\b(?:absolute|fixed)\b/.test(classes)
        && /\brounded-full\b/.test(classes)
        && /\bblur-(?:2xl|3xl|\[)/.test(classes)
        && /\bbg-[^\s]+/.test(classes)) {
        blobs.push(reference);
      }
    }

    for (const rule of file.content.matchAll(/([^{}]+)\{([^{}]+)\}/g)) {
      const selector = rule[1] ?? "";
      const declarations = rule[2] ?? "";
      const reference = fileReference(file.path, file.content, rule.index ?? 0);

      if (/aurora/i.test(selector) || count(declarations, radialGradient) >= 2) layered.push(reference);

      if (/position\s*:\s*(?:absolute|fixed)/i.test(declarations)
        && /filter\s*:\s*blur\(\s*(?:[3-9]\d|\d{3,})px/i.test(declarations)
        && /border-radius\s*:\s*(?:50%|999)/i.test(declarations)
        && /background(?:-color)?\s*:/i.test(declarations)) {
        blobs.push(reference);
      }
    }
  }

  return [...layered, ...(blobs.length >= 2 ? blobs : [])];
}

export default defineRule({
  id: "no-aurora-backgrounds",
  title: "Aurora glow background",
  description: "AI-generated hero sections often use oversized blurred color blobs or layered radial gradients as atmospheric decoration.",
  async match(context) {
    const references: Reference[] = context.type === "files"
      ? sourceReferences(context.files)
      : await context.page.$$eval("*", (elements) => {
        const layered: Element[] = [];
        const blobs: Element[] = [];

        for (const element of elements) {
          const style = getComputedStyle(element);
          const box = element.getBoundingClientRect();

          if (element.getClientRects().length === 0) continue;

          const radialCount = style.backgroundImage.match(/radial-gradient\s*\(/gi)?.length ?? 0;
          const namedAurora = Array.from(element.classList).some((name) => /(?:^|[-_])aurora(?:$|[-_])/i.test(name));

          if (namedAurora || (radialCount >= 2 && box.width >= innerWidth / 2 && box.height >= Math.min(300, innerHeight * 0.4))) {
            layered.push(element);
          }

          const blur = Number.parseFloat(style.filter.match(/blur\(\s*([\d.]+)px/i)?.[1] ?? "0");
          const radius = Number.parseFloat(style.borderTopLeftRadius);
          const positioned = style.position === "absolute" || style.position === "fixed";
          const colored = style.backgroundColor !== "transparent" && style.backgroundColor !== "rgba(0, 0, 0, 0)";

          if (positioned && colored && blur >= 32 && box.width >= 120 && box.height >= 120 && radius >= Math.min(box.width, box.height) * 0.4) {
            blobs.push(element);
          }
        }

        const matches = [...layered, ...(blobs.length >= 2 ? blobs : [])];

        return matches.map((element) => {
          const path: string[] = [];
          let current: Element | null = element;

          while (current) {
            const siblings = current.parentElement ? Array.from(current.parentElement.children).filter((sibling) => sibling.tagName === current?.tagName) : [];
            path.unshift(`${current.tagName.toLowerCase()}${siblings.length > 1 ? `[${siblings.indexOf(current) + 1}]` : ""}`);
            current = current.parentElement;
          }

          return {
            type: "element" as const,
            selector: element.id ? `#${CSS.escape(element.id)}` : `xpath=/${path.join("/")}`,
            source: element.outerHTML.slice(0, 200),
          };
        });
      });

    return references.length > 0
      ? { matches: true, explanation: `${references.length} aurora-style background ${references.length === 1 ? "element was" : "elements were"} found.`, references }
      : { matches: false };
  },
});

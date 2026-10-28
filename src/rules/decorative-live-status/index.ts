import { converter } from "culori";

import { defineRule, type Files, type Reference } from "../../api/index.ts";
import { fileReference } from "../shared/index.ts";

const toRgb = converter("rgb");

const statusPagePath = /(?:^|[/_.-])(?:health|incidents?|status|uptime)(?:[/_.-]|$)/i;

const statusText = /\b(?:all systems operational|community online|live now|now live|system online|we(?:'re| are) live)\b/i;

const statusWord = /\b(?:live|online|operational)\b/i;

const signalIdentity = /\b(?:indicator|live|online|pulse|signal|status)(?:[-_\s]|$)/i;

const semanticStatus = /\brole\s*=\s*["']status["']|\baria-live\s*=/i;

const element = /<([a-zA-Z][\w.-]*)\b([^>]*)>([^<]{1,60})<\/\1>/g;

const tag = /<[a-zA-Z][\w.-]*\b([^>]*)>/g;

const cssRule = /([^{}\s][^{}]*?)\s*\{([^{}]+)\}/g;

function isGreen(value: string): boolean {
  const color = toRgb(value.trim());

  return Boolean(color && (color.alpha ?? 1) >= 0.5 && color.g >= 0.35 && color.g - color.r >= 0.12 && color.g - color.b >= 0.06);
}

function isGreenDotStyle(value: string): boolean {
  const width = Number.parseFloat(value.match(/\bwidth\s*:\s*([\d.]+)px/i)?.[1] ?? "");
  const height = Number.parseFloat(value.match(/\bheight\s*:\s*([\d.]+)px/i)?.[1] ?? "");
  const radius = value.match(/\bborder-radius\s*:\s*([^;]+)/i)?.[1]?.trim();
  const background = value.match(/\bbackground(?:-color)?\s*:\s*([^;!]+)/i)?.[1]?.trim();
  const round = radius === "50%" || Number.parseFloat(radius ?? "") >= Math.min(width, height) / 2 - 1;

  return width >= 3 && width <= 18 && height >= 3 && height <= 18 && round && Boolean(background && isGreen(background));
}

function isTailwindGreenDot(attributes: string): boolean {
  const classes = attributes.match(/\bclass(?:Name)?\s*=\s*["']([^"']+)["']/i)?.[1] ?? "";
  const green = /\bbg-(?:emerald|green|lime|teal)-(?:[3-7]00)\b/.test(classes);
  const round = /\brounded-full\b/.test(classes);

  const small = /\bsize-(?:1|1\.5|2|2\.5|3|3\.5|4)\b/.test(classes)
    || (/\bw-(?:1|1\.5|2|2\.5|3|3\.5|4)\b/.test(classes) && /\bh-(?:1|1\.5|2|2\.5|3|3\.5|4)\b/.test(classes));

  return green && round && small;
}

function fileReferences(files: Files): Reference[] {
  const references: Reference[] = [];
  const seen = new Set<string>();

  for (const file of files.all()) {
    if (statusPagePath.test(file.path)) continue;

    const add = (index: number) => {
      const key = `${file.path}:${index}`;

      if (seen.has(key)) return;

      seen.add(key);
      references.push(fileReference(file.path, file.content, index));
    };

    for (const match of file.content.matchAll(element)) {
      const attributes = match[2] ?? "";
      const text = (match[3] ?? "").replace(/\s+/g, " ").trim();

      if (semanticStatus.test(attributes)) continue;

      if (!statusText.test(text) && !(statusWord.test(text) && signalIdentity.test(attributes))) continue;

      add(match.index ?? 0);
    }

    for (const match of file.content.matchAll(tag)) {
      const attributes = match[1] ?? "";
      const inlineStyle = attributes.match(/\bstyle\s*=\s*["']([^"']+)["']/i)?.[1] ?? "";

      if (semanticStatus.test(attributes)) continue;

      if (!isTailwindGreenDot(attributes) && !isGreenDotStyle(inlineStyle)) continue;

      add(match.index ?? 0);
    }

    for (const match of file.content.matchAll(cssRule)) {
      if (!isGreenDotStyle(match[2] ?? "")) continue;

      add(match.index ?? 0);
    }
  }

  return references;
}

export default defineRule({
  id: "no-decorative-live-status",
  title: "Decorative live status",
  description: "Avoid decorative live or online signals and green status dots unless they communicate real application status.",
  async match(context) {
    let references: Reference[];

    if (context.type === "files") {
      references = fileReferences(context.files);
    } else {
      const url = new URL(context.page.url());

      if (statusPagePath.test(`${url.hostname}${url.pathname}`)) return { matches: false };

      references = await context.page.$$eval("body *", (elements, patterns) => {
        const textPattern = new RegExp(patterns.text, "i");
        const wordPattern = new RegExp(patterns.word, "i");
        const identityPattern = new RegExp(patterns.identity, "i");

        const green = (value: string) => {
          const channels = value.match(/[\d.]+/g)?.map(Number);

          if (!channels || channels.length < 3) return false;

          const [red = 0, green = 0, blue = 0, alpha = 1] = channels;

          return alpha >= 0.5 && green >= 90 && green - red >= 30 && green - blue >= 15;
        };

        const greenDot = (style: CSSStyleDeclaration, width?: number, height?: number) => {
          const dotWidth = width ?? Number.parseFloat(style.width);
          const dotHeight = height ?? Number.parseFloat(style.height);
          const radius = Number.parseFloat(style.borderTopLeftRadius);

          return dotWidth >= 3
            && dotWidth <= 18
            && dotHeight >= 3
            && dotHeight <= 18
            && radius >= Math.min(dotWidth, dotHeight) / 2 - 1
            && green(style.backgroundColor);
        };

        return elements.flatMap((candidate) => {
          if (candidate.closest('[role="status"], [aria-live]')) return [];

          const text = Array.from(candidate.childNodes)
            .filter((node) => node.nodeType === Node.TEXT_NODE)
            .map((node) => node.textContent ?? "")
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();

          const box = candidate.getBoundingClientRect();

          if (box.width === 0 || box.height === 0) return [];

          const identity = [
            candidate.id,
            candidate.className,
            candidate.parentElement?.id,
            candidate.parentElement?.className,
          ].join(" ");

          const textSignal = text.length <= 60 && (textPattern.test(text) || (wordPattern.test(text) && identityPattern.test(identity)));

          const style = getComputedStyle(candidate);
          const before = getComputedStyle(candidate, "::before");
          const after = getComputedStyle(candidate, "::after");

          const dot = greenDot(style, box.width, box.height)
            || (before.content !== "none" && greenDot(before))
            || (after.content !== "none" && greenDot(after));

          if (!textSignal && !dot) return [];

          const path: string[] = [];
          let current: Element | null = candidate;

          while (current) {
            const siblings = current.parentElement ? Array.from(current.parentElement.children).filter((sibling) => sibling.tagName === current?.tagName) : [];
            path.unshift(`${current.tagName.toLowerCase()}${siblings.length > 1 ? `[${siblings.indexOf(current) + 1}]` : ""}`);
            current = current.parentElement;
          }

          return [{
            type: "element" as const,
            selector: candidate.id ? `#${CSS.escape(candidate.id)}` : `xpath=/${path.join("/")}`,
            source: candidate.outerHTML.slice(0, 200),
          }];
        });
      }, { text: statusText.source, word: statusWord.source, identity: signalIdentity.source });
    }

    return references.length > 0
      ? { matches: true, explanation: `${references.length} decorative live-status ${references.length === 1 ? "signal was" : "signals were"} found.`, references }
      : { matches: false };
  },
});

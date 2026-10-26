import { defineRule, type Files, type Reference } from "../../api/index.ts";
import { cssClassStyles, isSourceCard } from "../shared/cards.ts";
import { fileReference } from "../shared/index.ts";
import { cssRules } from "../shared/styles.ts";

const cardContainers = new Set(["a", "article", "aside", "div", "li", "section"]);

function stripeWidth(value: string): number {
  let widest = 0;

  for (const match of value.matchAll(/border(?:-(?:left|top)|(?:Left|Top))(?:-width|Width)?\s*[:=]\s*["']?([\d.]+)(px|rem|em)?/gi)) {
    const width = Number(match[1]);

    widest = Math.max(widest, match[2]?.toLowerCase() === "rem" || match[2]?.toLowerCase() === "em" ? width * 16 : width);
  }

  return widest;
}

function splitShadows(value: string): string[] {
  const shadows: string[] = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];

    if (character === "(") depth += 1;
    else if (character === ")") depth -= 1;
    else if (character === "," && depth === 0) {
      shadows.push(value.slice(start, index));
      start = index + 1;
    }
  }

  shadows.push(value.slice(start));

  return shadows;
}

function shadowLengths(value: string): number[] {
  const lengths: number[] = [];

  for (const token of value.trim().split(/\s+/)) {
    const match = token.match(/^(-?[\d.]+)(px|rem|em)?$/i);

    if (!match?.[1]) continue;

    const amount = Number(match[1]);

    if (!Number.isFinite(amount)) continue;

    lengths.push(match[2]?.toLowerCase() === "rem" || match[2]?.toLowerCase() === "em" ? amount * 16 : amount);
  }

  return lengths;
}

function insetStripeWidth(value: string): number {
  let widest = 0;

  for (const match of value.matchAll(/box-shadow\s*[:=]\s*["']?([^;"'}]+)/gi)) {
    for (const shadow of splitShadows(match[1] ?? "")) {
      if (!/\binset\b/i.test(shadow)) continue;

      const [x = 0, y = 0, blur = 0, spread = 0] = shadowLengths(shadow);

      if (blur !== 0 || spread !== 0) continue;

      if ((Math.abs(x) >= 2 && y === 0) || (Math.abs(y) >= 2 && x === 0)) {
        widest = Math.max(widest, Math.abs(x), Math.abs(y));
      }
    }
  }

  return widest;
}

function stripeClasses(files: Files): Set<string> {
  const classes = new Set<string>();

  for (const rule of cssRules(files)) {
    if (stripeWidth(rule.declarations) < 3 && insetStripeWidth(rule.declarations) < 2) {
      continue;
    }

    for (const selector of rule.selectors.split(",")) {
      const className = selector.trim().match(/^\.([\w-]+)(?::[\w()-]+)*$/)?.[1];

      if (className) {
        classes.add(className);
      }
    }
  }

  return classes;
}

function hasStripe(attributes: string, classes: Set<string>): boolean {
  if (stripeWidth(attributes) >= 3 || insetStripeWidth(attributes) >= 2) {
    return true;
  }

  const classValue = attributes.match(/(?:class|className)\s*=\s*["']([^"']*)["']/)?.[1];

  if (!classValue) {
    return false;
  }

  return classValue.split(/\s+/).some((className) => {
    const utility = className.slice(className.lastIndexOf(":") + 1);
    const width = utility.match(/^border-[lt]-(\d+)$/)?.[1];
    const arbitrary = utility.match(/^border-[lt]-\[([\d.]+)(px|rem|em)\]$/)?.slice(1);
    const arbitraryWidth = arbitrary ? Number(arbitrary[0]) * (arbitrary[1] === "px" ? 1 : 16) : 0;

    return classes.has(className) || Number(width) >= 3 || arbitraryWidth >= 3;
  });
}

function sourceReferences(files: Files): Reference[] {
  const references: Reference[] = [];
  const cardStyles = cssClassStyles(files);
  const stripes = stripeClasses(files);

  for (const file of files.all()) {
    for (const tag of file.content.matchAll(/<([A-Za-z][\w.-]*)([^>]*)>/g)) {
      const name = tag[1]?.toLowerCase();
      const attributes = tag[2] ?? "";

      if (name && cardContainers.has(name) && isSourceCard(attributes, cardStyles) && hasStripe(attributes, stripes)) {
        references.push(fileReference(file.path, file.content, tag.index ?? 0));
      }
    }
  }

  return references;
}

export default defineRule({
  id: "no-accent-stripe-cards",
  title: "Accent stripe cards",
  description: "AI-generated landing pages often decorate rounded cards with a thick colored stripe along the top or left edge.",
  async match(context) {
    const references: Reference[] = context.type === "files"
      ? sourceReferences(context.files)
      : await context.page.$$eval("a, article, aside, div, li, section", (elements) => elements.flatMap((element) => {
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();
        const left = Number.parseFloat(style.borderLeftWidth);
        const right = Number.parseFloat(style.borderRightWidth);
        const top = Number.parseFloat(style.borderTopWidth);
        const bottom = Number.parseFloat(style.borderBottomWidth);

        const radius = Math.max(
          Number.parseFloat(style.borderTopLeftRadius),
          Number.parseFloat(style.borderTopRightRadius),
          Number.parseFloat(style.borderBottomLeftRadius),
          Number.parseFloat(style.borderBottomRightRadius),
        );

        const splitShadows = (value: string): string[] => {
          const shadows: string[] = [];
          let depth = 0;
          let start = 0;

          for (let index = 0; index < value.length; index += 1) {
            const character = value[index];

            if (character === "(") depth += 1;
            else if (character === ")") depth -= 1;
            else if (character === "," && depth === 0) {
              shadows.push(value.slice(start, index));
              start = index + 1;
            }
          }

          shadows.push(value.slice(start));

          return shadows;
        };

        const insetStripe = splitShadows(style.boxShadow).some((shadow) => {
          if (!/\binset\b/i.test(shadow)) return false;

          const lengths = [...shadow.matchAll(/-?[\d.]+px/g)].map((match) => Number.parseFloat(match[0]));
          const [x = 0, y = 0, blur = 0, spread = 0] = lengths;

          return blur === 0
            && spread === 0
            && ((Math.abs(x) >= 2 && y === 0) || (Math.abs(y) >= 2 && x === 0));
        });

        const stripe = (left >= 3 && left >= right + 2)
          || (top >= 3 && top >= bottom + 2)
          || insetStripe;

        const background = style.backgroundImage !== "none"
          || (style.backgroundColor !== "transparent" && !style.backgroundColor.endsWith(", 0)"));

        if (!stripe || radius === 0 || !background || box.width < 80 || box.height < 40 || element.getClientRects().length === 0) {
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
      }));

    return references.length > 0
      ? { matches: true, explanation: `${references.length} accent-stripe ${references.length === 1 ? "card was" : "cards were"} found.`, references }
      : { matches: false };
  },
});

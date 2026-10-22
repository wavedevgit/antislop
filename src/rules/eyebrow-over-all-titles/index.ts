import { defineRule, type Files, type Reference } from "../../api/index.ts";
import { voidElements } from "../shared/cards.ts";
import { cssRules } from "../shared/styles.ts";

type TextStyle = { size?: number; weight?: number; color?: string };

type SourceNode = { tag: string; attributes: string; children: SourceNode[] };

type EyebrowCounts = { titles: number; eyebrows: number; references?: Reference[] };

const headingSizes = new Map([
  ["h1", 32],
  ["h2", 24],
  ["h3", 18.72],
  ["h4", 16],
  ["h5", 13.28],
  ["h6", 10.72],
]);

function fontSize(value: string): number | undefined {
  const match = value.trim().match(/^([\d.]+)(px|rem|em)$/);

  if (!match?.[1]) {
    return undefined;
  }

  const size = Number(match[1]);

  return match[2] === "px" ? size : size * 16;
}

function textStyleFromDeclarations(value: string): TextStyle {
  const sizeValue = value.match(/(?:font-size|fontSize)\s*[:=]\s*["']?([^;"',}\s]+)/i)?.[1];
  const weightValue = value.match(/(?:font-weight|fontWeight)\s*[:=]\s*["']?([^;"',}\s]+)/i)?.[1];
  const color = value.match(/(?:^|;)\s*color\s*:\s*([^;}]+)/i)?.[1]?.trim();
  let weight: number | undefined;

  if (weightValue === "bold") {
    weight = 700;
  } else if (weightValue) {
    const parsed = Number(weightValue);

    weight = Number.isFinite(parsed) ? parsed : undefined;
  }

  return { size: sizeValue ? fontSize(sizeValue) : undefined, weight, color };
}

function cssTextStyles(files: Files): Map<string, TextStyle> {
  const styles = new Map<string, TextStyle>();

  for (const rule of cssRules(files)) {
    const declarations = textStyleFromDeclarations(rule.declarations);

    for (const selector of rule.selectors.split(",")) {
      const className = selector.trim().match(/^\.([\w-]+)(?::[\w()-]+)*$/)?.[1];

      if (!className) {
        continue;
      }

      const existing = styles.get(className);

      styles.set(className, {
        size: declarations.size ?? existing?.size,
        weight: declarations.weight ?? existing?.weight,
        color: declarations.color ?? existing?.color,
      });
    }
  }

  return styles;
}

function applyTailwind(style: TextStyle, className: string): void {
  const utility = className.slice(className.lastIndexOf(":") + 1);

  const sizes = new Map<string, number>([
    ["text-xs", 12], ["text-sm", 14], ["text-base", 16], ["text-lg", 18],
    ["text-xl", 20], ["text-2xl", 24], ["text-3xl", 30], ["text-4xl", 36],
    ["text-5xl", 48], ["text-6xl", 60], ["text-7xl", 72], ["text-8xl", 96], ["text-9xl", 128],
  ]);

  const weights = new Map<string, number>([
    ["font-thin", 100], ["font-extralight", 200], ["font-light", 300], ["font-normal", 400],
    ["font-medium", 500], ["font-semibold", 600], ["font-bold", 700], ["font-extrabold", 800], ["font-black", 900],
  ]);

  style.size = sizes.get(utility) ?? style.size;
  style.weight = weights.get(utility) ?? style.weight;

  const arbitrarySize = utility.match(/^text-\[([\d.]+(?:px|rem|em))\]$/)?.[1];

  if (arbitrarySize) {
    style.size = fontSize(arbitrarySize);
  } else if (
    utility.startsWith("text-")
    && !/^(?:text-(?:left|center|right|justify|start|end|wrap|nowrap|balance|pretty|ellipsis|clip)|text-opacity-)/.test(utility)
    && !sizes.has(utility)
  ) {
    style.color = utility;
  }
}

function nodeStyle(node: SourceNode, classStyles: Map<string, TextStyle>): Required<TextStyle> {
  const headingSize = headingSizes.get(node.tag);

  const style: TextStyle = {
    size: headingSize ?? 16,
    weight: headingSize === undefined ? 400 : 700,
    color: "default",
  };

  const classValue = node.attributes.match(/(?:class|className)\s*=\s*["']([^"']*)["']/)?.[1];

  if (classValue) {
    for (const className of classValue.split(/\s+/)) {
      const declared = classStyles.get(className);

      style.size = declared?.size ?? style.size;
      style.weight = declared?.weight ?? style.weight;
      style.color = declared?.color ?? style.color;
      applyTailwind(style, className);
    }
  }

  const inline = textStyleFromDeclarations(node.attributes);

  return {
    size: inline.size ?? style.size ?? 16,
    weight: inline.weight ?? style.weight ?? 400,
    color: inline.color ?? style.color ?? "default",
  };
}

function sourceTrees(files: Files): SourceNode[] {
  const roots: SourceNode[] = [];

  for (const file of files.all()) {
    const stack: SourceNode[] = [];

    for (const tagMatch of file.content.matchAll(/<\s*(\/)?\s*([A-Za-z][\w.-]*)([^>]*)>/g)) {
      const closing = Boolean(tagMatch[1]);
      const tag = tagMatch[2]?.toLowerCase();
      const attributes = tagMatch[3] ?? "";

      if (!tag) {
        continue;
      }

      if (closing) {
        let opening = stack.length - 1;

        while (opening >= 0 && stack[opening]?.tag !== tag) {
          opening -= 1;
        }

        if (opening >= 0) {
          stack.length = opening;
        }

        continue;
      }

      const node: SourceNode = { tag, attributes, children: [] };
      const parent = stack.at(-1);

      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }

      if (!attributes.trimEnd().endsWith("/") && !voidElements.has(tag)) {
        stack.push(node);
      }
    }
  }

  return roots;
}

function countSourceEyebrows(files: Files): EyebrowCounts {
  const classStyles = cssTextStyles(files);
  let titles = 0;
  let eyebrows = 0;

  function visit(node: SourceNode): void {
    for (let index = 0; index < node.children.length; index += 1) {
      const title = node.children[index];

      if (!title || !headingSizes.has(title.tag)) {
        continue;
      }

      titles += 1;

      const eyebrow = node.children[index - 1];

      if (!eyebrow) {
        continue;
      }

      const titleStyle = nodeStyle(title, classStyles);
      const eyebrowStyle = nodeStyle(eyebrow, classStyles);

      if (titleStyle.weight >= 600 && titleStyle.size > eyebrowStyle.size && titleStyle.color !== eyebrowStyle.color) {
        eyebrows += 1;
      }
    }

    for (const child of node.children) {
      visit(child);
    }
  }

  for (const root of sourceTrees(files)) {
    visit(root);
  }

  return { titles, eyebrows };
}

export default defineRule({
  id: "eyebrow-over-all-titles",
  title: "Eyebrows over every title",
  description: "AI-generated websites often place smaller, differently colored text above every large bold heading.",
  async match(context) {
    const counts = context.type === "puppeteer"
      ? await context.page.$$eval("h1, h2, h3, h4, h5, h6", (headings) => {
        let titles = 0;
        const references: Array<{ type: "element"; selector: string; source: string }> = [];

        for (const title of headings) {
          if (!title.textContent?.trim() || title.getClientRects().length === 0) {
            continue;
          }

          titles += 1;

          const eyebrow = title.previousElementSibling;

          if (!eyebrow || !eyebrow.textContent?.trim() || eyebrow.getClientRects().length === 0) {
            continue;
          }

          const titleStyle = getComputedStyle(title);
          const eyebrowStyle = getComputedStyle(eyebrow);
          const titleSize = Number.parseFloat(titleStyle.fontSize);
          const eyebrowSize = Number.parseFloat(eyebrowStyle.fontSize);
          const titleWeight = Number.parseInt(titleStyle.fontWeight, 10);
          const titleBox = title.getBoundingClientRect();
          const eyebrowBox = eyebrow.getBoundingClientRect();

          if (
            titleWeight >= 600
            && titleSize > eyebrowSize
            && titleStyle.color !== eyebrowStyle.color
            && eyebrowBox.bottom <= titleBox.top + 2
          ) {
            const path: string[] = [];
            let current: Element | null = title;

            while (current) {
              const siblings = current.parentElement ? Array.from(current.parentElement.children).filter((sibling) => sibling.tagName === current?.tagName) : [];
              const position = siblings.indexOf(current) + 1;

              path.unshift(`${current.tagName.toLowerCase()}${siblings.length > 1 ? `[${position}]` : ""}`);
              current = current.parentElement;
            }

            const selector = title.id ? `#${CSS.escape(title.id)}` : `xpath=/${path.join("/")}`;

            references.push({ type: "element", selector, source: title.outerHTML.slice(0, 200) });
          }
        }

        return { titles, eyebrows: references.length, references };
      })
      : countSourceEyebrows(context.files);

    const matches = counts.titles >= 2 && counts.eyebrows === counts.titles;

    return matches
      ? { matches, explanation: `All ${counts.titles} headings have smaller, differently colored eyebrow text above them.`, references: counts.references }
      : { matches };
  },
});

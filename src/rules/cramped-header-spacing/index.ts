import { defineRule, type Files, type Reference } from "../../api/index.ts";
import { voidElements } from "../shared/cards.ts";
import { fileReference } from "../shared/index.ts";
import { cssRules } from "../shared/styles.ts";

type SpacingStyle = {
  marginTop?: number;
  marginBottom?: number;
  paddingTop?: number;
  paddingBottom?: number;
  gap?: number;
  top?: number;
  height?: number;
  fixed?: boolean;
};

type BoxSpacing = { top?: number; bottom?: number };

type SourceNode = {
  tag: string;
  attributes: string;
  children: SourceNode[];
  directText: boolean;
  path: string;
  content: string;
  index: number;
};

const headingPattern = /^h[1-6]$/;

function pixels(value: string): number | undefined {
  const match = value.trim().match(/^([\d.]+)(px|rem|em)?$/i);

  return match?.[1] ? Number(match[1]) * (/^(?:rem|em)$/i.test(match[2] ?? "") ? 16 : 1) : undefined;
}

function declaration(value: string, pattern: string): number | undefined {
  const match = value.match(new RegExp(`(?:${pattern})\\s*[:=]\\s*["']?([\\d.]+(?:px|rem|em)?)`, "i"));

  return pixels(match?.[1] ?? "");
}

function boxDeclaration(value: string, property: string): BoxSpacing {
  const values = value.match(new RegExp(`(?:^|[;"'])\\s*${property}\\s*:\\s*([^;}"']+)`, "i"))?.[1]
    ?.trim()
    .split(/\s+/)
    .map(pixels);

  if (!values?.length || values.some((entry) => entry === undefined)) return {};

  return {
    top: values[0],
    bottom: values.length < 3 ? values[0] : values[2],
  };
}

function declarationStyle(value: string): SpacingStyle {
  const margin = boxDeclaration(value, "margin");
  const padding = boxDeclaration(value, "padding");

  return {
    marginTop: declaration(value, "margin-top|marginTop") ?? margin.top,
    marginBottom: declaration(value, "margin-bottom|marginBottom") ?? margin.bottom,
    paddingTop: declaration(value, "padding-top|paddingTop") ?? padding.top,
    paddingBottom: declaration(value, "padding-bottom|paddingBottom") ?? padding.bottom,
    gap: declaration(value, "row-gap|rowGap|gap"),
    top: declaration(value, "top"),
    height: declaration(value, "height|min-height|minHeight"),
    fixed: /(?:position\s*:\s*fixed|\bposition\s*=\s*["']fixed)/i.test(value) || /\bfixed\b/.test(value),
  };
}

function mergeStyle(target: SpacingStyle, source: SpacingStyle): void {
  for (const key of ["marginTop", "marginBottom", "paddingTop", "paddingBottom", "gap", "top", "height"] as const) {
    const value = source[key];

    if (value !== undefined) target[key] = target[key] === undefined ? value : Math.min(target[key], value);
  }

  target.fixed ||= source.fixed;
}

function utilityLength(value: string): number | undefined {
  const arbitrary = value.match(/^\[([\d.]+(?:px|rem|em)?)\]$/)?.[1];

  return arbitrary ? pixels(arbitrary) : /^\d+(?:\.\d+)?$/.test(value) ? Number(value) * 4 : undefined;
}

function utilityStyle(className: string): SpacingStyle {
  const utility = className.slice(className.lastIndexOf(":") + 1);
  const style: SpacingStyle = { fixed: utility === "fixed" };
  const spacing = utility.match(/^(m[bt]|my|m|p[bt]|py|p|gap-y|gap|space-y)-(.+)$/);
  const offset = utility.match(/^(top|h|min-h)-(.+)$/);

  if (spacing?.[1] && spacing[2]) {
    const amount = utilityLength(spacing[2]);

    if (amount !== undefined) {
      if (["mt", "my", "m"].includes(spacing[1])) style.marginTop = amount;

      if (["mb", "my", "m"].includes(spacing[1])) style.marginBottom = amount;

      if (["pt", "py", "p"].includes(spacing[1])) style.paddingTop = amount;

      if (["pb", "py", "p"].includes(spacing[1])) style.paddingBottom = amount;

      if (["gap-y", "gap", "space-y"].includes(spacing[1])) style.gap = amount;
    }
  }

  if (offset?.[1] && offset[2]) {
    const amount = utilityLength(offset[2]);

    if (offset[1] === "top") style.top = amount;

    if (offset[1] === "h" || offset[1] === "min-h") style.height = amount;
  }

  return style;
}

function cssStyles(files: Files) {
  const classes = new Map<string, SpacingStyle>();
  const tags = new Map<string, SpacingStyle>();

  for (const rule of cssRules(files)) {
    const declared = declarationStyle(rule.declarations);

    for (const selector of rule.selectors.split(",")) {
      const className = selector.trim().match(/^\.([\w-]+)(?::[\w()-]+)*$/)?.[1];
      const tag = selector.trim().match(/^(nav|header|h[1-6])$/i)?.[1]?.toLowerCase();

      if (className) {
        const style = classes.get(className) ?? {};
        mergeStyle(style, declared);
        classes.set(className, style);
      }

      if (tag) {
        const style = tags.get(tag) ?? {};
        mergeStyle(style, declared);
        tags.set(tag, style);
      }
    }
  }

  return { classes, tags };
}

function nodeStyle(node: SourceNode, styles: ReturnType<typeof cssStyles>): SpacingStyle {
  const style: SpacingStyle = {};
  const classNames = node.attributes.match(/(?:class|className)\s*=\s*["']([^"']*)["']/)?.[1]?.split(/\s+/) ?? [];

  mergeStyle(style, styles.tags.get(node.tag) ?? {});

  for (const className of classNames) {
    mergeStyle(style, styles.classes.get(className) ?? {});
    mergeStyle(style, utilityStyle(className));
  }

  mergeStyle(style, declarationStyle(node.attributes));

  return style;
}

function sourceTrees(files: Files): SourceNode[] {
  const roots: SourceNode[] = [];

  for (const file of files.all()) {
    const root: SourceNode = {
      tag: "root",
      attributes: "",
      children: [],
      directText: false,
      path: file.path,
      content: file.content,
      index: 0,
    };

    const stack: SourceNode[] = [root];
    let cursor = 0;

    for (const match of file.content.matchAll(/<\s*(\/)?\s*([A-Za-z][\w.-]*)([^>]*)>/g)) {
      if (file.content.slice(cursor, match.index).trim() && stack.at(-1)) stack.at(-1)!.directText = true;

      cursor = (match.index ?? 0) + match[0].length;

      const closing = Boolean(match[1]);
      const tag = match[2]?.toLowerCase();
      const attributes = match[3] ?? "";

      if (!tag) continue;

      if (closing) {
        let opening = stack.length - 1;

        while (opening >= 0 && stack[opening]?.tag !== tag) opening -= 1;

        if (opening >= 0) stack.length = opening;
        continue;
      }

      const node: SourceNode = {
        tag,
        attributes,
        children: [],
        directText: false,
        path: file.path,
        content: file.content,
        index: match.index ?? 0,
      };

      const parent = stack.at(-1);

      parent?.children.push(node);

      if (!attributes.trimEnd().endsWith("/") && !voidElements.has(tag)) stack.push(node);
    }

    roots.push(root);
  }

  return roots;
}

function firstTextNode(node: SourceNode): SourceNode | undefined {
  if (node.directText) return node;

  for (const child of node.children) {
    const text = firstTextNode(child);

    if (text) return text;
  }

  return undefined;
}

function leadingInset(node: SourceNode, styles: ReturnType<typeof cssStyles>): number {
  const own = nodeStyle(node, styles).paddingTop ?? 0;

  if (node.directText) return own;

  const child = node.children.find((candidate) => firstTextNode(candidate));

  return own + (child ? leadingInset(child, styles) : 0);
}

function estimatedHeight(node: SourceNode, styles: ReturnType<typeof cssStyles>): number {
  const style = nodeStyle(node, styles);

  if (style.height !== undefined) return style.height;

  const content = node.directText
    ? 24
    : Math.max(24, ...node.children.map((child) => estimatedHeight(child, styles)));

  return (style.paddingTop ?? 0) + content + (style.paddingBottom ?? 0);
}

function sourceReferences(files: Files): Reference[] {
  const references: Reference[] = [];
  const styles = cssStyles(files);

  function visit(parent: SourceNode): void {
    for (let index = 0; index < parent.children.length - 1; index += 1) {
      const node = parent.children[index];
      const next = parent.children[index + 1];

      if (!node || !next || (!headingPattern.test(node.tag) && node.tag !== "nav" && node.tag !== "header")) continue;

      if (node.tag === "nav" && parent.tag === "header") continue;

      const target = firstTextNode(next);

      if (!target) continue;

      const style = nodeStyle(node, styles);
      const nextStyle = nodeStyle(next, styles);
      const parentStyle = nodeStyle(parent, styles);
      const heading = headingPattern.test(node.tag);
      const explicitHeadingSpacing = style.marginBottom !== undefined || nextStyle.marginTop !== undefined || parentStyle.gap !== undefined;

      if (heading && !explicitHeadingSpacing) continue;

      const siblingGap = Math.max(style.marginBottom ?? 0, nextStyle.marginTop ?? 0, parentStyle.gap ?? 0);

      const gap = style.fixed
        ? leadingInset(next, styles) - ((style.top ?? 0) + estimatedHeight(node, styles))
        : siblingGap + leadingInset(next, styles);

      const minimum = heading ? 4 : 24;

      if (gap < minimum) {
        const reference = heading ? node : target;
        references.push(fileReference(reference.path, reference.content, reference.index));
      }
    }

    for (const child of parent.children) visit(child);
  }

  for (const root of sourceTrees(files)) visit(root);

  return references;
}

export default defineRule({
  id: "no-cramped-header-spacing",
  title: "Cramped header spacing",
  description: "Navigation bars need 24px and text headings need 4px of visible separation from following content.",
  async match(context) {
    const references: Reference[] = context.type === "files"
      ? sourceReferences(context.files)
      : await context.page.$$eval("nav, header, h1, h2, h3, h4, h5, h6", (elements) => elements.flatMap((element) => {
        if (element.tagName === "NAV" && element.closest("header")) return [];

        const next = element.nextElementSibling;

        if (!next || element.getClientRects().length === 0 || next.getClientRects().length === 0) return [];

        const textTarget = [next, ...next.querySelectorAll("*")].find((candidate) => {
          const directText = Array.from(candidate.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());

          return directText && candidate.getClientRects().length > 0;
        });

        if (!textTarget) return [];

        const box = element.getBoundingClientRect();
        const targetBox = textTarget.getBoundingClientRect();
        const horizontalOverlap = Math.min(box.right, targetBox.right) - Math.max(box.left, targetBox.left);
        const gap = targetBox.top - box.bottom;
        const heading = /^H[1-6]$/.test(element.tagName);
        const minimum = heading ? 4 : 24;

        if (horizontalOverlap <= 0 || targetBox.top < box.top || gap >= minimum) return [];

        const referenceElement = heading ? element : textTarget;
        const path: string[] = [];
        let current: Element | null = referenceElement;

        while (current) {
          const siblings = current.parentElement ? Array.from(current.parentElement.children).filter((sibling) => sibling.tagName === current?.tagName) : [];
          path.unshift(`${current.tagName.toLowerCase()}${siblings.length > 1 ? `[${siblings.indexOf(current) + 1}]` : ""}`);
          current = current.parentElement;
        }

        return [{
          type: "element" as const,
          selector: referenceElement.id ? `#${CSS.escape(referenceElement.id)}` : `xpath=/${path.join("/")}`,
          source: referenceElement.outerHTML.slice(0, 200),
        }];
      }));

    return references.length > 0
      ? { matches: true, explanation: `${references.length} ${references.length === 1 ? "header has" : "headers have"} insufficient spacing before the following content.`, references }
      : { matches: false };
  },
});

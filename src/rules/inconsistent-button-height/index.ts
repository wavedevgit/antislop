import { defineRule, type Files, type Reference } from "../../api/index.ts";
import { fileReference } from "../shared/index.ts";
import { cssRules } from "../shared/styles.ts";

const minimumDifference = 2;

type HeightStyle = { height?: number; paddingTop?: number; paddingBottom?: number; borderTop: number; borderBottom: number; lineHeight?: number };

function pixels(value: string): number | undefined {
  const match = value.trim().match(/^([\d.]+)(px|rem|em)?$/i);

  return match?.[1] ? Number(match[1]) * (/^(?:rem|em)$/i.test(match[2] ?? "") ? 16 : 1) : undefined;
}

function declaration(value: string, property: string): number | undefined {
  return pixels(value.match(new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*([\\d.]+(?:px|rem|em)?)`, "i"))?.[1] ?? "");
}

function applyDeclarations(style: HeightStyle, declarations: string): void {
  const padding = declarations.match(/(?:^|;)\s*padding\s*:\s*([^;}]+)/i)?.[1]?.trim().split(/\s+/).map(pixels);
  const border = declarations.match(/(?:^|;)\s*border(?:-width)?\s*:\s*([\d.]+(?:px|rem|em)?)/i)?.[1];

  style.height = declaration(declarations, "height") ?? style.height;
  style.paddingTop = declaration(declarations, "padding-top") ?? padding?.[0] ?? style.paddingTop;
  style.paddingBottom = declaration(declarations, "padding-bottom") ?? (padding?.length === 4 ? padding[2] : padding?.[0]) ?? style.paddingBottom;
  style.borderTop = declaration(declarations, "border-top-width") ?? pixels(border ?? "") ?? style.borderTop;
  style.borderBottom = declaration(declarations, "border-bottom-width") ?? pixels(border ?? "") ?? style.borderBottom;
  style.lineHeight = declaration(declarations, "line-height") ?? style.lineHeight;
}

function utilityPixels(value: string): number | undefined {
  const arbitrary = value.match(/^\[([\d.]+(?:px|rem|em)?)\]$/)?.[1];

  return arbitrary ? pixels(arbitrary) : /^\d+(?:\.5)?$/.test(value) ? Number(value) * 4 : undefined;
}

function applyUtility(style: HeightStyle, className: string): void {
  const utility = className.slice(className.lastIndexOf(":") + 1);
  const spacing = utility.match(/^(h|py|pt|pb|border)-(.*)$/);

  if (spacing?.[1] && spacing[2]) {
    const amount = utilityPixels(spacing[2]);

    if (amount !== undefined) {
      if (spacing[1] === "h") style.height = amount;

      if (spacing[1] === "py" || spacing[1] === "pt") style.paddingTop = amount;

      if (spacing[1] === "py" || spacing[1] === "pb") style.paddingBottom = amount;

      if (spacing[1] === "border") style.borderTop = style.borderBottom = amount;
    }
  }

  if (utility === "border") style.borderTop = style.borderBottom = 1;

  const lineHeights = new Map([
    ["text-xs", 16], ["text-sm", 20], ["text-base", 24], ["text-lg", 28], ["text-xl", 28], ["text-2xl", 32],
  ]);

  style.lineHeight = lineHeights.get(utility) ?? style.lineHeight;

  const leading = utility.match(/^leading-(.+)$/)?.[1];
  const amount = leading ? utilityPixels(leading) : undefined;

  if (amount !== undefined) style.lineHeight = amount;
}

function estimatedHeight(attributes: string, classDeclarations: Map<string, string>): number | undefined {
  const style: HeightStyle = { borderTop: 0, borderBottom: 0 };
  const classes = attributes.match(/(?:class|className)\s*=\s*["']([^"']*)["']/)?.[1]?.split(/\s+/) ?? [];

  for (const className of classes) applyDeclarations(style, classDeclarations.get(className) ?? "");

  for (const className of classes) applyUtility(style, className);

  applyDeclarations(style, attributes.match(/style\s*=\s*["']([^"']*)["']/i)?.[1] ?? "");

  return style.height ?? (style.paddingTop !== undefined && style.paddingBottom !== undefined && style.lineHeight !== undefined
    ? style.paddingTop + style.paddingBottom + style.borderTop + style.borderBottom + style.lineHeight
    : undefined);
}

function sourceResult(files: Files) {
  const classDeclarations = new Map<string, string>();
  const references: Reference[] = [];
  const heights = new Set<number>();
  let groups = 0;

  for (const rule of cssRules(files)) {
    for (const name of rule.selectors.matchAll(/\.([\w-]+)/g)) {
      const className = name[1] ?? "";
      classDeclarations.set(className, `${classDeclarations.get(className) ?? ""};${rule.declarations}`);
    }
  }

  for (const file of files.all()) {
    const stack: Array<{ tag: string; controls: Array<{ attributes: string; index: number; height: number }> }> = [];

    for (const tag of file.content.matchAll(/<\s*(\/)?\s*([A-Za-z][\w.-]*)([^>]*)>/g)) {
      const closing = Boolean(tag[1]);
      const name = tag[2]?.toLowerCase();
      const attributes = tag[3] ?? "";

      if (!name) continue;

      if (closing) {
        let opening = stack.length - 1;

        while (opening >= 0 && stack[opening]?.tag !== name) opening -= 1;

        const frame = opening >= 0 ? stack[opening] : undefined;

        if (frame) {
          stack.length = opening;

          if (frame.controls.length >= 2) {
            const groupHeights = frame.controls.map((control) => control.height);

            if (Math.max(...groupHeights) - Math.min(...groupHeights) >= minimumDifference) {
              groups += 1;

              for (const control of frame.controls) {
                heights.add(control.height);
                references.push(fileReference(file.path, file.content, control.index));
              }
            }
          }
        }

        continue;
      }

      const height = estimatedHeight(attributes, classDeclarations);
      const classes = attributes.match(/(?:class|className)\s*=\s*["']([^"']*)["']/)?.[1] ?? "";

      const buttonLike = name === "button"
        || (name === "input" && /\btype\s*=\s*["'](?:button|submit|reset)["']/i.test(attributes))
        || (name === "a" && (/\brole\s*=\s*["']button["']/i.test(attributes) || /(?:^|\s)(?:btn|button|cta)[\w-]*/i.test(classes)));

      if (buttonLike && height !== undefined) stack.at(-1)?.controls.push({ attributes, index: tag.index ?? 0, height });

      if (!attributes.trimEnd().endsWith("/") && !["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"].includes(name)) {
        stack.push({ tag: name, controls: [] });
      }
    }
  }

  return { references, heights: [...heights].sort((left, right) => left - right), groups };
}

export default defineRule({
  id: "no-inconsistent-button-heights",
  title: "Inconsistent button heights",
  description: "Buttons in the same action row should have equal heights.",
  async match(context) {
    const result = context.type === "files" ? sourceResult(context.files) : await context.page.$$eval("body *", (elements, minimumDifference) => {
      const mismatched = new Set<Element>();
      const heights = new Set<number>();
      let groups = 0;

      for (const parent of elements) {
        const controls = Array.from(parent.children).filter((element) => {
          if (!element.matches('button, a, [role="button"], input[type="button"], input[type="submit"], input[type="reset"]')) return false;

          const box = element.getBoundingClientRect();
          const style = getComputedStyle(element);

          const decoratedLink = element.tagName !== "A"
            || style.backgroundImage !== "none"
            || (style.backgroundColor !== "transparent" && !style.backgroundColor.endsWith(", 0)"))
            || [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth].some((width) => Number.parseFloat(width) > 0);

          return decoratedLink && element.getClientRects().length > 0 && box.width >= 48 && box.height >= 24;
        });

        if (controls.length < 2) continue;

        const boxes = controls.map((control) => control.getBoundingClientRect());
        const sameRow = Math.max(...boxes.map((box) => box.top)) - Math.min(...boxes.map((box) => box.top)) < Math.min(...boxes.map((box) => box.height)) / 2;
        const groupHeights = boxes.map((box) => Math.round(box.height * 10) / 10);

        if (!sameRow || Math.max(...groupHeights) - Math.min(...groupHeights) < minimumDifference) continue;

        groups += 1;

        controls.forEach((control, index) => {
          mismatched.add(control);
          heights.add(groupHeights[index] ?? 0);
        });
      }

      const references = [...mismatched].map((element) => {
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

      return { references, heights: [...heights].sort((left, right) => left - right), groups };
    }, minimumDifference);

    const references: Reference[] = result.references;

    return result.groups > 0
      ? { matches: true, explanation: `${references.length} buttons across ${result.groups} action ${result.groups === 1 ? "row have" : "rows have"} inconsistent heights (${result.heights.join("px, ")}px).`, references }
      : { matches: false };
  },
});

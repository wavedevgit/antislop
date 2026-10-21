import type { Files } from "../../api/index.ts";
import { cssRules } from "./styles.ts";

export const voidElements = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);

export type CardStyle = { rounded: boolean; background: boolean; color?: string };

export function cardStyleFromDeclarations(value: string): CardStyle {
  const radius = value.match(/(?:border-radius|border(?:TopLeft|TopRight|BottomLeft|BottomRight)Radius)\s*[:=]\s*["']?([^;"',}\s]+)/i)?.[1];
  const fill = value.match(/(?:background|backgroundColor|background-color)\s*[:=]\s*["']?([^;"',}\s]+)/i)?.[1];
  const rounded = radius !== undefined && !/^0(?:px|rem|em|%)?$/.test(radius);
  const background = fill !== undefined && !/^(?:none|transparent)$/.test(fill);

  return { rounded, background, color: background ? fill : undefined };
}

export function cssClassStyles(files: Files): Map<string, CardStyle> {
  const classes = new Map<string, CardStyle>();

  for (const rule of cssRules(files)) {
    const declarations = cardStyleFromDeclarations(rule.declarations);

    if (!declarations.rounded && !declarations.background) {
      continue;
    }

    for (const selector of rule.selectors.split(",")) {
      const className = selector.trim().match(/^\.([\w-]+)(?::[\w()-]+)*$/)?.[1];

      if (className) {
        const existing = classes.get(className);

        classes.set(className, {
          rounded: declarations.rounded || existing?.rounded === true,
          background: declarations.background || existing?.background === true,
          color: declarations.color ?? existing?.color,
        });
      }
    }
  }

  return classes;
}

function tailwindCardStyle(attributes: string): CardStyle {
  const classValue = attributes.match(/(?:class|className)\s*=\s*["']([^"']*)["']/)?.[1];

  if (!classValue) {
    return { rounded: false, background: false };
  }

  let rounded = false;
  let background = false;
  let color: string | undefined;

  for (const className of classValue.split(/\s+/)) {
    const utility = className.slice(className.lastIndexOf(":") + 1);

    if (/^rounded(?:-.+)?$/.test(utility) && utility !== "rounded-none") {
      rounded = true;
    }

    if (
      utility.startsWith("bg-")
      && !/^bg-(?:auto|bottom|center|clip|contain|cover|fixed|left|local|none|no-repeat|opacity|origin|repeat|right|scroll|top|transparent)(?:-|$)/.test(utility)
    ) {
      background = true;
      color = utility.slice(3);
    }
  }

  return { rounded, background, color };
}

export function sourceCardStyle(attributes: string, classStyles: Map<string, CardStyle>): CardStyle {
  const inlineStyle = cardStyleFromDeclarations(attributes);
  const tailwindStyle = tailwindCardStyle(attributes);

  if (inlineStyle.rounded && inlineStyle.background) {
    return inlineStyle;
  }

  if (tailwindStyle.rounded && tailwindStyle.background) {
    return tailwindStyle;
  }

  const classValue = attributes.match(/(?:class|className)\s*=\s*["']([^"']*)["']/)?.[1];

  if (!classValue) {
    return { rounded: false, background: false };
  }

  let rounded = false;
  let background = false;
  let color: string | undefined;

  for (const className of classValue.split(/\s+/)) {
    const style = classStyles.get(className);

    rounded ||= style?.rounded === true;
    background ||= style?.background === true;
    color = style?.color ?? color;
  }

  return { rounded, background, color };
}

export function isSourceCard(attributes: string, classStyles: Map<string, CardStyle>): boolean {
  const style = sourceCardStyle(attributes, classStyles);

  return style.rounded && style.background;
}

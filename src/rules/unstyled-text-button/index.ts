import { defineRule, type Files, type Reference } from "../../api/index.ts";
import { fileReference } from "../shared/index.ts";
import { cssRules } from "../shared/styles.ts";

function hasBackground(value: string): boolean {
  return /(?:background(?:-color)?|backgroundColor)\s*[:=]/i.test(value);
}

function hasButtonStyle(value: string): boolean {
  return hasBackground(value) || /(?:border-radius|borderRadius|border-color|borderColor)\s*[:=]/i.test(value);
}

function borderColorUtility(value: string): boolean {
  return /^border-(?![trblxy](?:-|$)|(?:0|2|4|8)$|(?:none|solid|dashed|dotted|double|hidden|collapse|separate|opacity-))/.test(value);
}

function styledClasses(files: Files): Set<string> {
  const classes = new Set<string>();

  for (const rule of cssRules(files)) {
    for (const selector of rule.selectors.split(",")) {
      const styled = selector.includes(":")
        ? /:hover\b/.test(selector) && hasBackground(rule.declarations)
        : hasButtonStyle(rule.declarations);

      if (!styled) continue;

      for (const name of selector.matchAll(/\.([\w-]+)/g)) classes.add(name[1] ?? "");
    }
  }

  return classes;
}

function sourceReferences(files: Files): Reference[] {
  const references: Reference[] = [];
  const styles = styledClasses(files);

  const globalButtonStyle = cssRules(files).some((rule) => rule.selectors.split(",").some((selector) => {
    const normalized = selector.trim().toLowerCase();

    return (normalized === "button" && hasButtonStyle(rule.declarations))
      || (normalized === "button:hover" && hasBackground(rule.declarations));
  }));

  for (const file of files.all()) {
    for (const match of file.content.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)) {
      const attributes = match[1] ?? "";
      const text = match[2]?.replace(/<[^>]+>/g, "").trim();

      if (!text || globalButtonStyle || hasButtonStyle(attributes)) continue;

      const classes = attributes.match(/(?:class|className)\s*=\s*["']([^"']*)["']/)?.[1]?.split(/\s+/) ?? [];

      const styled = classes.some((name) => {
        const utility = name.slice(name.lastIndexOf(":") + 1);

        return styles.has(name)
          || /^bg-(?!transparent\b)/.test(utility)
          || (/^rounded(?:-|$)/.test(utility) && utility !== "rounded-none")
          || borderColorUtility(utility);
      });

      if (!styled) references.push(fileReference(file.path, file.content, match.index ?? 0));
    }
  }

  return references;
}

export default defineRule({
  id: "no-unstyled-text-buttons",
  title: "Unstyled text button",
  description: "Text-like navigation actions should use links unless the button has a visible base or hover treatment.",
  async match(context) {
    const references: Reference[] = context.type === "files"
      ? sourceReferences(context.files)
      : await context.page.$$eval("button", (buttons) => buttons.flatMap((button) => {
        const style = getComputedStyle(button);
        const radii = [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomRightRadius, style.borderBottomLeftRadius].map(Number.parseFloat);

        const transparent = style.backgroundImage === "none"
          && (style.backgroundColor === "transparent" || /^rgba\([^)]*,\s*0(?:\.0+)?\s*\)$/.test(style.backgroundColor));

        const hasText = Boolean(button.textContent?.trim());
        const borderWidths = [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth].map(Number.parseFloat);
        const borderColors = [style.borderTopColor, style.borderRightColor, style.borderBottomColor, style.borderLeftColor];
        const visibleBorderColor = borderWidths.some((width, index) => width > 0 && borderColors[index] !== "transparent" && !/^rgba\([^)]*,\s*0(?:\.0+)?\s*\)$/.test(borderColors[index] ?? ""));

        const hoverBackground = Array.from(button.classList).some((name) => /(?:^|:)hover:bg-(?!transparent\b)/.test(name))
          || Array.from(document.styleSheets).some((sheet) => {
            try {
              return Array.from(sheet.cssRules).some((rule) => rule instanceof CSSStyleRule
                && rule.selectorText.includes(":hover")
                && Boolean(rule.style.background || rule.style.backgroundColor)
                && button.matches(rule.selectorText.replaceAll(":hover", "")));
            } catch {
              return false;
            }
          });

        if (!hasText || !transparent || radii.some((radius) => radius > 0) || visibleBorderColor || hoverBackground || button.getClientRects().length === 0) return [];

        const path: string[] = [];
        let current: Element | null = button;

        while (current) {
          const siblings = current.parentElement ? Array.from(current.parentElement.children).filter((sibling) => sibling.tagName === current?.tagName) : [];
          path.unshift(`${current.tagName.toLowerCase()}${siblings.length > 1 ? `[${siblings.indexOf(current) + 1}]` : ""}`);
          current = current.parentElement;
        }

        return [{
          type: "element" as const,
          selector: button.id ? `#${CSS.escape(button.id)}` : `xpath=/${path.join("/")}`,
          source: button.outerHTML.slice(0, 200),
        }];
      }));

    return references.length > 0
      ? { matches: true, explanation: `${references.length} text ${references.length === 1 ? "button has" : "buttons have"} no background, hover background, border color, or corner radius; use a link for navigation.`, references }
      : { matches: false };
  },
});

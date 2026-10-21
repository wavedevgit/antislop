import type { Files } from "../../api/index.ts";

export type CssRule = { selectors: string; declarations: string };

export function cssRules(files: Files): CssRule[] {
  const rules: CssRule[] = [];

  for (const file of files.all()) {
    const stylesheets: string[] = [];

    if (/\.(?:css|less|sass|scss|styl)$/i.test(file.path)) {
      stylesheets.push(file.content);
    }

    for (const style of file.content.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
      if (style[1]) {
        stylesheets.push(style[1]);
      }
    }

    for (const stylesheet of stylesheets) {
      for (const rule of stylesheet.matchAll(/([^{}]+)\{([^{}]+)\}/g)) {
        if (rule[1] && rule[2]) {
          rules.push({ selectors: rule[1], declarations: rule[2] });
        }
      }
    }
  }

  return rules;
}

import { defineRule, type Files, type Reference } from "../../api/index.ts";
import { fileReference } from "../shared/index.ts";
import { cssRules } from "../shared/styles.ts";

const tailwindRadii = new Map([
  ["rounded-none", 0], ["rounded-sm", 2], ["rounded", 4], ["rounded-md", 6],
  ["rounded-lg", 8], ["rounded-xl", 12], ["rounded-2xl", 16], ["rounded-3xl", 24], ["rounded-full", 9999],
]);

function pixels(value: string): number | undefined {
  const match = value.match(/^([\d.]+)(px|rem|em)?$/i);

  return match?.[1] ? Number(match[1]) * (/^(?:rem|em)$/i.test(match[2] ?? "") ? 16 : 1) : undefined;
}

function declaredRadius(value: string): number | undefined {
  let radius: number | undefined;

  for (const match of value.matchAll(/(?:border-radius|borderRadius)\s*[:=]\s*["']?([^;"'},\s]+)/gi)) {
    radius = pixels(match[1] ?? "");
  }

  return radius;
}

function utilityRadius(name: string): number | undefined {
  const utility = name.slice(name.lastIndexOf(":") + 1);
  const arbitrary = utility.match(/^rounded-\[([\d.]+(?:px|rem|em)?)\]$/i)?.[1];

  return tailwindRadii.get(utility) ?? (arbitrary ? pixels(arbitrary) : undefined);
}

function sourceReferences(files: Files) {
  const classRadii = new Map<string, number>();
  const tagRadii = new Map<string, number>();
  const references: Reference[] = [];
  const radii = new Set<number>();

  for (const rule of cssRules(files)) {
    const radius = declaredRadius(rule.declarations);

    if (radius === undefined) continue;

    for (const selector of rule.selectors.split(",")) {
      for (const name of selector.matchAll(/\.([\w-]+)/g)) classRadii.set(name[1] ?? "", radius);

      const tag = selector.trim().match(/^(button|input)\b/i)?.[1]?.toLowerCase();

      if (tag) tagRadii.set(tag, radius);
    }
  }

  for (const file of files.all()) {
    for (const match of file.content.matchAll(/<(button|input|a)\b([^>]*)>/gi)) {
      const tag = match[1]?.toLowerCase() ?? "";
      const attributes = match[2] ?? "";

      const isButton = tag === "button"
        || (tag === "input" && /\btype\s*=\s*["'](?:button|submit|reset)["']/i.test(attributes))
        || (tag === "a" && /\brole\s*=\s*["']button["']/i.test(attributes));

      if (!isButton) continue;

      let radius = tagRadii.get(tag) ?? 0;
      const classes = attributes.match(/(?:class|className)\s*=\s*["']([^"']*)["']/)?.[1]?.split(/\s+/) ?? [];

      for (const name of classes) radius = utilityRadius(name) ?? classRadii.get(name) ?? radius;

      radius = declaredRadius(attributes) ?? radius;
      radii.add(radius);
      references.push(fileReference(file.path, file.content, match.index ?? 0));
    }
  }

  return { radii, references };
}

export default defineRule({
  id: "no-inconsistent-button-radius",
  title: "Inconsistent button radius",
  description: "Buttons in the same interface should not switch arbitrarily between square and rounded corners.",
  async match(context) {
    const result = context.type === "files"
      ? sourceReferences(context.files)
      : await context.page.$$eval('button, [role="button"], input[type="button"], input[type="submit"], input[type="reset"]', (elements) => {
        const controls = elements.filter((element) => {
          const box = element.getBoundingClientRect();

          return element.getClientRects().length > 0 && box.width >= 24 && box.height >= 20;
        });

        const radii = new Set<number>();

        for (const element of controls) {
          const style = getComputedStyle(element);

          const radius = Math.max(...[
            style.borderTopLeftRadius,
            style.borderTopRightRadius,
            style.borderBottomRightRadius,
            style.borderBottomLeftRadius,
          ].map(Number.parseFloat));

          radii.add(Math.round(radius * 10) / 10);
        }

        const references = controls.map((element) => {
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

        return { radii: [...radii], references };
      });

    const radii = [...result.radii].sort((a, b) => a - b);
    const matches = result.references.length >= 2 && radii.length >= 2;

    return matches
      ? { matches, explanation: `${result.references.length} buttons use inconsistent corner radii (${radii.join("px, ")}px).`, references: result.references }
      : { matches: false };
  },
});

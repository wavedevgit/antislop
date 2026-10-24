import { defineRule, type Files, type Reference } from "../../api/index.ts";
import { fileReference } from "../shared/index.ts";
import { cssRules } from "../shared/styles.ts";

function pillRadius(value: string): boolean {
  const radius = value.match(/(?:border-radius|borderRadius)\s*[:=]\s*["']?([^;"'},\s]+)/i)?.[1] ?? "";

  return radius === "50%" || Number.parseFloat(radius) >= 999;
}

function pillClasses(files: Files): Set<string> {
  const classes = new Set<string>();

  for (const rule of cssRules(files)) {
    if (!pillRadius(rule.declarations)) continue;

    for (const selector of rule.selectors.matchAll(/\.([\w-]+)/g)) classes.add(selector[1] ?? "");
  }

  return classes;
}

function hasPillRadius(attributes: string, classes: Set<string>): boolean {
  if (pillRadius(attributes)) return true;

  const names = attributes.match(/(?:class|className)\s*=\s*["']([^"']*)["']/)?.[1]?.split(/\s+/) ?? [];

  return names.some((name) => classes.has(name) || name.slice(name.lastIndexOf(":") + 1) === "rounded-full");
}

function sourceReferences(files: Files): Reference[] {
  const references: Reference[] = [];
  const classes = pillClasses(files);

  for (const file of files.all()) {
    for (const control of file.content.matchAll(/<(button|a)\b([^>]*)>([\s\S]*?)<\/\1>/gi)) {
      const text = (control[3] ?? "").replace(/<[^>]*>|\{[^}]*\}/g, "").trim();

      if (text.length >= 2 && hasPillRadius(control[2] ?? "", classes)) {
        references.push(fileReference(file.path, file.content, control.index ?? 0));
      }
    }

    for (const input of file.content.matchAll(/<input\b([^>]*)>/gi)) {
      const attributes = input[1] ?? "";
      const value = attributes.match(/\bvalue\s*=\s*["']([^"']*)["']/i)?.[1]?.trim() ?? "";

      if (/\btype\s*=\s*["'](?:button|submit|reset)["']/i.test(attributes) && value.length >= 2 && hasPillRadius(attributes, classes)) {
        references.push(fileReference(file.path, file.content, input.index ?? 0));
      }
    }
  }

  return references;
}

export default defineRule({
  id: "no-pill-buttons",
  title: "Pill-shaped buttons",
  description: "Buttons should use modest corner radii unless the control is genuinely circular.",
  async match(context) {
    const references: Reference[] = context.type === "files"
      ? sourceReferences(context.files)
      : await context.page.$$eval("button, a[href], [role='button'], input[type='button'], input[type='submit'], input[type='reset']", (elements) => elements.flatMap((element) => {
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();
        const text = element instanceof HTMLInputElement ? element.value.trim() : element.textContent?.trim() ?? "";

        const radii = [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomRightRadius, style.borderBottomLeftRadius].map((value) => {
          const amount = Number.parseFloat(value);

          return value.includes("%") ? box.height * amount / 100 : amount;
        });

        const pill = radii.every((radius) => radius >= box.height * 0.4);
        const circle = box.width <= box.height * 1.2;

        if (!pill || circle || text.length < 2 || box.width === 0 || box.height < 24 || element.getClientRects().length === 0) return [];

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
      ? { matches: true, explanation: `${references.length} non-circular ${references.length === 1 ? "button uses" : "buttons use"} a pill-shaped radius.`, references }
      : { matches: false };
  },
});

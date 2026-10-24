import { defineRule, type Files } from "../../api/index.ts";
import { count } from "../shared/index.ts";
import { cssRules } from "../shared/styles.ts";

function isDotOrGridPattern(value: string): boolean {
  const gradients = count(value, /(?:radial|linear)-gradient\s*\(/gi);
  const repeated = /background-size\s*:|\/\s*\d+(?:\.\d+)?px\s+\d+(?:\.\d+)?px/i.test(value);
  const transparent = /transparent|rgba?\([^)]*,\s*0(?:\.0+)?\s*\)/i.test(value);
  const dots = /radial-gradient\s*\(/i.test(value) && /\d+(?:\.\d+)?px/i.test(value);
  const grid = gradients >= 2 && /linear-gradient\s*\(/i.test(value);

  return repeated && transparent && (dots || grid);
}

function sourcePatterns(files: Files): number {
  let patterns = cssRules(files).filter((rule) => isDotOrGridPattern(rule.declarations)).length;

  for (const file of files.all()) {
    for (const style of file.content.matchAll(/style\s*=\s*(["'])(.*?)\1/gi)) {
      patterns += isDotOrGridPattern(style[2] ?? "") ? 1 : 0;
    }

    for (const attribute of file.content.matchAll(/(?:class|className)\s*=\s*(["'])(.*?)\1/g)) {
      const classes = attribute[2]?.split(/\s+/) ?? [];
      const namedPattern = classes.some((name) => /^bg-(?:dot|dots|grid)(?:-|$)/.test(name.slice(name.lastIndexOf(":") + 1)));
      const arbitraryPattern = isDotOrGridPattern(classes.join(" ").replaceAll("_", " "));

      patterns += namedPattern || arbitraryPattern ? 1 : 0;
    }
  }

  return patterns;
}

export default defineRule({
  id: "no-patterned-backgrounds",
  title: "Dotted or grid backgrounds",
  description: "AI-generated websites often place repeating dot or grid patterns behind page content.",
  async match(context) {
    const result = context.type === "puppeteer"
      ? await context.page.$$eval("*", (elements) => elements.flatMap((element) => {
        const style = getComputedStyle(element);
        const image = style.backgroundImage;
        const gradients = image.match(/(?:radial|linear)-gradient\s*\(/gi)?.length ?? 0;
        const sizes = style.backgroundSize.match(/[\d.]+px/g)?.map(Number.parseFloat) ?? [];
        const repeated = sizes.length >= 2 && sizes.every((size) => size <= 80);
        const transparent = /rgba?\([^)]*,\s*0(?:\.0+)?\s*\)/i.test(image);
        const dots = image.includes("radial-gradient(");
        const grid = gradients >= 2 && image.includes("linear-gradient(");

        if (element.getClientRects().length === 0 || !repeated || !transparent || (!dots && !grid)) {
          return [];
        }

        const path: string[] = [];
        let current: Element | null = element;

        while (current) {
          const siblings = current.parentElement ? Array.from(current.parentElement.children).filter((sibling) => sibling.tagName === current?.tagName) : [];
          const position = siblings.indexOf(current) + 1;

          path.unshift(`${current.tagName.toLowerCase()}${siblings.length > 1 ? `[${position}]` : ""}`);
          current = current.parentElement;
        }

        const selector = element.id ? `#${CSS.escape(element.id)}` : `xpath=/${path.join("/")}`;

        return [{ type: "element" as const, selector, source: element.outerHTML.slice(0, 200) }];
      }))
      : sourcePatterns(context.files);

    const patterns = Array.isArray(result) ? result.length : result;

    return patterns > 0
      ? { matches: true, explanation: `${patterns} dotted or grid ${patterns === 1 ? "background was" : "backgrounds were"} found.`, references: Array.isArray(result) ? result : undefined }
      : { matches: false };
  },
});

import { defineRule } from "../../api/index.ts";

export default defineRule({
  id: "no-low-contrast",
  title: "Low contrast text",
  description: "Text should meet WCAG AA contrast against the surface behind it.",
  async match(context) {
    if (context.type === "files") return { matches: false };

    const references = await context.page.$$eval("body *", (elements) => {
      type Color = [number, number, number, number];

      const color = (value: string): Color => {
        const parts = value.match(/[\d.]+/g)?.map(Number) ?? [];

        return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0, parts[3] ?? 1];
      };

      const blend = (front: Color, back: Color): Color => [
        front[0] * front[3] + back[0] * (1 - front[3]),
        front[1] * front[3] + back[1] * (1 - front[3]),
        front[2] * front[3] + back[2] * (1 - front[3]),
        1,
      ];

      const luminance = (value: Color) => {
        const channel = (part: number) => {
          const normalized = part / 255;

          return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
        };

        return 0.2126 * channel(value[0]) + 0.7152 * channel(value[1]) + 0.0722 * channel(value[2]);
      };

      const selector = (element: Element) => {
        if (element.id) return `#${CSS.escape(element.id)}`;
        const path: string[] = [];

        for (let node: Element | null = element; node; node = node.parentElement) {
          const siblings = node.parentElement ? [...node.parentElement.children].filter((sibling) => sibling.tagName === node?.tagName) : [];
          path.unshift(`${node.tagName.toLowerCase()}${siblings.length > 1 ? `[${siblings.indexOf(node) + 1}]` : ""}`);
        }

        return `xpath=/${path.join("/")}`;
      };

      return elements.flatMap((element) => {
        if (!element.getClientRects().length || element.closest("svg")) return [];

        if (![...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())) return [];

        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();

        if (style.visibility === "hidden" || Number(style.opacity) < 1 || box.width <= 1 || box.height <= 1) return [];

        if (style.backgroundClip === "text" || /inset\(\s*50%/.test(style.clipPath)) return [];

        const layers: Color[] = [];

        for (let node: Element | null = element; node; node = node.parentElement) {
          const surface = getComputedStyle(node);
          const backdrop = surface.getPropertyValue("backdrop-filter");

          if (surface.backgroundImage !== "none" || (backdrop && backdrop !== "none")) return [];
          const background = color(surface.backgroundColor);

          if (background[3] > 0) layers.push(background);

          if (background[3] === 1) break;
        }

        if (layers.at(-1)?.[3] !== 1) return [];

        const background = layers.reduceRight((back, front) => blend(front, back));
        const foreground = blend(color(style.color), background);
        const light = luminance(foreground);
        const dark = luminance(background);
        const ratio = (Math.max(light, dark) + 0.05) / (Math.min(light, dark) + 0.05);
        const size = Number.parseFloat(style.fontSize);
        const minimum = size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700) ? 3 : 4.5;

        return ratio < minimum
          ? [{ type: "element" as const, selector: selector(element), source: element.outerHTML.slice(0, 200), ratio }]
          : [];
      });
    });

    if (!references.length) return { matches: false };

    const lowest = Math.min(...references.map((reference) => reference.ratio)).toFixed(1);

    return {
      matches: true,
      explanation: `${references.length} text ${references.length === 1 ? "element falls" : "elements fall"} below WCAG AA contrast. Lowest is ${lowest}:1.`,
      references: references.map((reference) => ({
        type: reference.type,
        selector: reference.selector,
        source: reference.source,
      })),
    };
  },
});

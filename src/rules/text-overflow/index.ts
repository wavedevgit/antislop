import { defineRule } from "../../api/index.ts";

export default defineRule({
  id: "no-text-overflow",
  title: "Text overflow",
  description: "Text should fit inside its container instead of spilling past the edge.",
  async match(context) {
    if (context.type === "files") return { matches: false };

    const references = await context.page.$$eval("body *", (elements) => {
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

        if (style.visibility === "hidden" || Number(style.opacity) <= 0.01 || box.width <= 1 || box.height <= 1) return [];

        if (style.textOverflow === "ellipsis" || style.getPropertyValue("-webkit-line-clamp") !== "none" || /inset\(\s*50%/.test(style.clipPath)) return [];

        for (let node: Element | null = element; node; node = node.parentElement) {
          if (/(auto|scroll)/.test(getComputedStyle(node).overflowX)) return [];
        }

        if (element.scrollWidth - element.clientWidth < 16) return [];

        return [{ type: "element" as const, selector: selector(element), source: element.outerHTML.slice(0, 200) }];
      });
    });

    return references.length
      ? {
        matches: true,
        explanation: references.length === 1 ? "1 text element overflows its container." : `${references.length} text elements overflow their containers.`,
        references,
      }
      : { matches: false };
  },
});

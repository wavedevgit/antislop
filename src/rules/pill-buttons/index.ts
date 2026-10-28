import { defineRule } from "../../api/index.ts";

const minimumButtonHeight = 36;

export default defineRule({
  id: "no-pill-buttons",
  title: "Badge-like buttons",
  description: "Short, fully rounded buttons can look like badges instead of interactive controls.",
  async match(context) {
    if (context.type === "files") return { matches: false };

    const references = await context.page.$$eval("button, a[href], [role='button'], input[type='button'], input[type='submit'], input[type='reset']", (elements, minimumHeight) => elements.flatMap((element) => {
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();
        const text = element instanceof HTMLInputElement ? element.value.trim() : element.textContent?.trim() ?? "";

        const radii = [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomRightRadius, style.borderBottomLeftRadius].map((value) => {
          const amount = Number.parseFloat(value);

          return value.includes("%") ? box.height * amount / 100 : amount;
        });

        const pill = radii.every((radius) => radius >= box.height * 0.4);
        const circle = box.width <= box.height * 1.2;

        if (!pill || circle || text.length < 2 || box.width === 0 || box.height === 0 || box.height >= minimumHeight || element.getClientRects().length === 0) return [];

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
      }), minimumButtonHeight);

    return references.length > 0
      ? { matches: true, explanation: `${references.length} short, fully rounded ${references.length === 1 ? "button looks" : "buttons look"} like a badge.`, references }
      : { matches: false };
  },
});

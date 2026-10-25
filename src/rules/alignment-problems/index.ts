import { defineRule } from "../../api/index.ts";

const tolerance = 8;

export default defineRule({
  id: "no-alignment-problems",
  title: "Alignment problems",
  description: "Equivalent content in a repeated row of cards should align consistently.",
  async match(context) {
    if (context.type === "files") return { matches: false };

    const references = await context.page.$$eval("body *", (elements, tolerance) => {
      const problemElements = new Set<Element>();

      for (const parent of elements) {
        const cards = Array.from(parent.children).filter((element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);

          const decorated = style.boxShadow !== "none"
            || [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth].some((width) => Number.parseFloat(width) > 0)
            || [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomLeftRadius, style.borderBottomRightRadius].some((radius) => Number.parseFloat(radius) > 0);

          return decorated && rect.width >= 140 && rect.height >= 80 && element.getClientRects().length > 0;
        });

        if (cards.length < 3) continue;

        const boxes = cards.map((card) => card.getBoundingClientRect());
        const sameRow = Math.max(...boxes.map((box) => box.top)) - Math.min(...boxes.map((box) => box.top)) <= tolerance;

        const similarSize = Math.max(...boxes.map((box) => box.width)) / Math.min(...boxes.map((box) => box.width)) <= 1.2
          && Math.max(...boxes.map((box) => box.height)) / Math.min(...boxes.map((box) => box.height)) <= 1.2;

        const childCount = cards[0]?.children.length ?? 0;

        if (!sameRow || !similarSize || childCount < 2 || cards.some((card) => card.children.length !== childCount)) continue;

        for (let index = 0; index < childCount; index += 1) {
          const children = cards.map((card) => card.children[index]);

          if (children.some((child) => !child || child.tagName !== children[0]?.tagName)) continue;

          const offsets = children.map((child, cardIndex) => {
            const childBox = child?.getBoundingClientRect();
            const cardBox = boxes[cardIndex];

            return { left: (childBox?.left ?? 0) - (cardBox?.left ?? 0), top: (childBox?.top ?? 0) - (cardBox?.top ?? 0) };
          });

          const middle = (values: number[]) => values.sort((left, right) => left - right)[Math.floor(values.length / 2)] ?? 0;
          const expectedLeft = middle(offsets.map((offset) => offset.left));
          const expectedTop = middle(offsets.map((offset) => offset.top));

          const misaligned = offsets.some((offset) => Math.abs(offset.left - expectedLeft) > tolerance || Math.abs(offset.top - expectedTop) > tolerance);

          if (misaligned) children.forEach((child) => {
            if (child) problemElements.add(child);
          });
        }
      }

      return [...problemElements].map((element) => {
        const path: string[] = [];
        let current: Element | null = element;

        while (current) {
          const siblings = current.parentElement ? Array.from(current.parentElement.children).filter((sibling) => sibling.tagName === current?.tagName) : [];
          path.unshift(`${current.tagName.toLowerCase()}${siblings.length > 1 ? `[${siblings.indexOf(current) + 1}]` : ""}`);
          current = current.parentElement;
        }

        return { type: "element" as const, selector: element.id ? `#${CSS.escape(element.id)}` : `xpath=/${path.join("/")}`, source: element.outerHTML.slice(0, 200) };
      });
    }, tolerance);

    return references.length > 0
      ? { matches: true, explanation: `${references.length} corresponding elements do not align across their repeated cards.`, references }
      : { matches: false };
  },
});

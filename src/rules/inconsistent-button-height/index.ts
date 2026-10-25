import { defineRule, type Reference } from "../../api/index.ts";

const minimumDifference = 2;

export default defineRule({
  id: "no-inconsistent-button-heights",
  title: "Inconsistent button heights",
  description: "Buttons in the same action row should have equal heights.",
  async match(context) {
    if (context.type === "files") return { matches: false };

    const result = await context.page.$$eval("body *", (elements, minimumDifference) => {
      const mismatched = new Set<Element>();
      const heights = new Set<number>();
      let groups = 0;

      for (const parent of elements) {
        const controls = Array.from(parent.children).filter((element) => {
          if (!element.matches('button, a, [role="button"], input[type="button"], input[type="submit"], input[type="reset"]')) return false;

          const box = element.getBoundingClientRect();
          const style = getComputedStyle(element);

          const decoratedLink = element.tagName !== "A"
            || style.backgroundImage !== "none"
            || (style.backgroundColor !== "transparent" && !style.backgroundColor.endsWith(", 0)"))
            || [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth].some((width) => Number.parseFloat(width) > 0);

          return decoratedLink && element.getClientRects().length > 0 && box.width >= 48 && box.height >= 24;
        });

        if (controls.length < 2) continue;

        const boxes = controls.map((control) => control.getBoundingClientRect());
        const sameRow = Math.max(...boxes.map((box) => box.top)) - Math.min(...boxes.map((box) => box.top)) < Math.min(...boxes.map((box) => box.height)) / 2;
        const groupHeights = boxes.map((box) => Math.round(box.height * 10) / 10);

        if (!sameRow || Math.max(...groupHeights) - Math.min(...groupHeights) < minimumDifference) continue;

        groups += 1;

        controls.forEach((control, index) => {
          mismatched.add(control);
          heights.add(groupHeights[index] ?? 0);
        });
      }

      const references = [...mismatched].map((element) => {
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

      return { references, heights: [...heights].sort((left, right) => left - right), groups };
    }, minimumDifference);

    const references: Reference[] = result.references;

    return result.groups > 0
      ? { matches: true, explanation: `${references.length} buttons across ${result.groups} action ${result.groups === 1 ? "row have" : "rows have"} inconsistent heights (${result.heights.join("px, ")}px).`, references }
      : { matches: false };
  },
});

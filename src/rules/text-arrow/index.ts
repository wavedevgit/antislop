import { defineRule } from "../../api/index.ts";
import { count, markup } from "../shared/index.ts";

export default defineRule({
  id: "text-arrow",
  title: "Text arrow",
  description: "Only AI uses this arrow. Use an icon instead.",
  async match(context) {
    const arrows = count(await markup(context), /→/g);

    return arrows > 0
      ? { matches: true, explanation: arrows === 1
        ? "1 text arrow was found. Use an icon instead."
        : `${arrows} text arrows were found. Use icons instead.` }
      : { matches: false };
  },
});

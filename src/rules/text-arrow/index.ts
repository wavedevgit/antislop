import { defineRule } from "../../api/index.ts";
import { textMatches } from "../shared/index.ts";

export default defineRule({
  id: "no-text-arrows",
  title: "Text arrow",
  description: "Only AI uses this arrow. Use an icon instead.",
  async match(context) {
    const result = await textMatches(context, /→/g);

    return result.count > 0
      ? { matches: true, explanation: result.count === 1
        ? "1 text arrow was found. Use an icon instead."
        : `${result.count} text arrows were found. Use icons instead.`, references: result.references }
      : { matches: false };
  },
});

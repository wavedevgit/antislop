import { defineRule } from "../../api/index.ts";
import { count, markup } from "../shared/index.ts";

export default defineRule({
  id: "too-many-emojis",
  title: "Too many emojis",
  description: "AI-generated websites often overuse decorative emojis.",
  async match(context) {
    const emojis = count(await markup(context), /\p{Extended_Pictographic}/gu);

    return emojis >= 3
      ? { matches: true, explanation: `${emojis} emojis were found.` }
      : { matches: false };
  },
});

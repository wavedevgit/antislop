import { defineRule } from "../../api/index.ts";
import { textMatches } from "../shared/index.ts";

const emoji = /(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F)/gu;

export default defineRule({
  id: "limit-emojis",
  title: "Too many emojis",
  description: "AI-generated websites often overuse decorative emojis.",
  async match(context) {
    const result = await textMatches(context, emoji);

    return result.count >= 3
      ? { matches: true, explanation: `${result.count} emojis were found.`, references: result.references }
      : { matches: false };
  },
});

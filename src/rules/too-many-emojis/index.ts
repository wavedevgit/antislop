import { defineRule } from "../../api/index.ts";
import { textMatches } from "../shared/index.ts";

export default defineRule({
  id: "too-many-emojis",
  title: "Too many emojis",
  description: "AI-generated websites often overuse decorative emojis.",
  async match(context) {
    const result = await textMatches(context, /\p{Extended_Pictographic}/gu);

    return result.count >= 3
      ? { matches: true, explanation: `${result.count} emojis were found.`, references: result.references }
      : { matches: false };
  },
});

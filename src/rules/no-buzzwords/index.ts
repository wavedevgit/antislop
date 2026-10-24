import { defineRule } from "../../api/index.ts";
import { textMatches } from "../shared/index.ts";

const buzzwords = /\b(?:made\s+with\s+love|seamless|blazing)\b/gi;

export default defineRule({
  id: "no-buzzwords",
  title: "Buzzwords",
  description: "Avoid clichéd marketing copy such as “made with love,” “seamless,” and “blazing.”",
  async match(context) {
    const result = await textMatches(context, buzzwords);

    return result.count > 0
      ? { matches: true, explanation: `${result.count} banned ${result.count === 1 ? "buzzword was" : "buzzwords were"} found.`, references: result.references }
      : { matches: false };
  },
});

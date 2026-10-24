import { defineRule } from "../../api/index.ts";
import { textMatches } from "../shared/index.ts";

export default defineRule({
  id: "no-unicode-bullets",
  title: "Unicode bullets",
  description: "AI-generated website copy often uses the Unicode bullet character as decoration.",
  async match(context) {
    const result = await textMatches(context, /[•·]/g);

    return result.count > 0
      ? { matches: true, explanation: `${result.count} bullet items were found.`, references: result.references }
      : { matches: false };
  },
});

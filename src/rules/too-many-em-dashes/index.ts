import { defineRule } from "../../api/index.ts";
import { textMatches } from "../shared/index.ts";

export default defineRule({
  id: "too-many-em-dashes",
  title: "Too many em dashes",
  description: "AI-generated website copy often overuses em dashes.",
  async match(context) {
    const result = await textMatches(context, /—/g);

    return result.count >= 3
      ? { matches: true, explanation: `${result.count} em dashes were found.`, references: result.references }
      : { matches: false };
  },
});

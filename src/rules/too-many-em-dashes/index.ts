import { defineRule } from "../../api/index.ts";
import { count, markup } from "../shared/index.ts";

export default defineRule({
  id: "too-many-em-dashes",
  title: "Too many em dashes",
  description: "AI-generated website copy often overuses em dashes.",
  async match(context) {
    const emDashes = count(await markup(context), /—/g);

    return emDashes >= 3
      ? { matches: true, explanation: `${emDashes} em dashes were found.` }
      : { matches: false };
  },
});

import { defineRule } from "../../api/index.ts";
import { count, markup } from "../shared/index.ts";

export default defineRule({
  id: "bullets",
  title: "Unicode bullets",
  description: "AI-generated website copy often uses the Unicode bullet character as decoration.",
  async match(context) {
    const content = context.type === "puppeteer"
      ? await context.page.evaluate(() => document.body?.innerText ?? "")
      : await markup(context);

    const bullets = count(content, /[•·]/g);

    return bullets > 0
      ? { matches: true, explanation: `${bullets} bullet items were found.` }
      : { matches: false };
  },
});

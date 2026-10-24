import { defineRule, type Reference } from "../../api/index.ts";
import { fileReference } from "../shared/index.ts";

export default defineRule({
  id: "require-meta-tags",
  title: "No meta tags",
  description: "Unfinished AI-generated pages often omit metadata entirely.",
  async match(context) {
    let references: Reference[];

    if (context.type === "files") {
      references = context.files.all()
        .filter((file) => /(?:^|\/)index\.html?$/i.test(file.path) && !/<meta\b/i.test(file.content))
        .map((file) => fileReference(file.path, file.content, Math.max(0, file.content.search(/<html\b|<!doctype\b/i))));
    } else {
      references = await context.page.$eval("head", (head) => head.querySelector("meta")
        ? []
        : [{ type: "element" as const, selector: "head", source: head.outerHTML.slice(0, 200) }]);
    }

    return references.length > 0
      ? { matches: true, explanation: `${references.length} ${references.length === 1 ? "page has" : "pages have"} no meta tags.`, references }
      : { matches: false };
  },
});

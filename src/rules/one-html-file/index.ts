import { defineRule } from "../../api/index.ts";

export default defineRule({
  id: "one-html-file",
  title: "Everything in one HTML file",
  description: "AI-generated websites are often shipped as one HTML document with all code embedded inline.",
  async match(context) {
    if (context.type === "puppeteer") {
      const result = await context.page.evaluate(() => {
        const urls = new Set<string>();

        for (const element of document.querySelectorAll("script[src], link[rel='stylesheet'][href], link[rel='modulepreload'][href]")) {
          const attribute = element.getAttribute("src") ?? element.getAttribute("href");

          if (!attribute) {
            continue;
          }

          const url = new URL(attribute, location.href);

          if (url.origin === location.origin) {
            urls.add(url.pathname);
          }
        }

        for (const entry of performance.getEntriesByType("resource")) {
          if (!(entry instanceof PerformanceResourceTiming)) {
            continue;
          }

          const url = new URL(entry.name, location.href);
          const isCode = /\.(?:cjs|css|js|jsx|mjs|wasm)$/i.test(url.pathname) || entry.initiatorType === "script";

          if (url.origin === location.origin && isCode) {
            urls.add(url.pathname);
          }
        }

        return {
          localCodeResources: [...urls],
          reference: { type: "element" as const, selector: "html", source: document.documentElement.outerHTML.slice(0, 200) },
        };
      });

      return result.localCodeResources.length === 0
        ? { matches: true, explanation: "The page loaded no same-origin code files beyond its HTML document.", references: [result.reference] }
        : { matches: false };
    }

    let htmlFiles = 0;
    let separateCodeFiles = 0;

    for (const file of context.files.all()) {
      if (/\.html?$/i.test(file.path)) {
        htmlFiles += 1;
      } else if (/\.(?:astro|cjs|coffee|css|cts|ejs|elm|hbs|jsx?|less|mdx|mjs|mts|php|pug|sass|scss|styl|svelte|tsx?|vue|wasm)$/i.test(file.path)) {
        separateCodeFiles += 1;
      }
    }

    const matches = htmlFiles === 1 && separateCodeFiles === 0;

    return matches
      ? { matches, explanation: `${htmlFiles} HTML file and ${separateCodeFiles} separate code files were found.` }
      : { matches };
  },
});

import { defineRule, type Files, type Reference } from "../../api/index.ts";
import { fileReference } from "../shared/index.ts";

const statusPagePath = /(?:^|[/_.-])(?:health|incidents?|status|uptime)(?:[/_.-]|$)/i;

const statusText = /\b(?:all systems operational|community online|live now|now live|system online|we(?:'re| are) live)\b/i;

const statusWord = /\b(?:live|online|operational)\b/i;

const signalIdentity = /\b(?:indicator|live|online|pulse|signal|status)(?:[-_\s]|$)/i;

const semanticStatus = /\brole\s*=\s*["']status["']|\baria-live\s*=/i;

const element = /<([a-zA-Z][\w.-]*)\b([^>]*)>([^<]{1,60})<\/\1>/g;

function fileReferences(files: Files): Reference[] {
  const references: Reference[] = [];

  for (const file of files.all()) {
    if (statusPagePath.test(file.path)) continue;

    for (const match of file.content.matchAll(element)) {
      const attributes = match[2] ?? "";
      const text = (match[3] ?? "").replace(/\s+/g, " ").trim();

      if (semanticStatus.test(attributes)) continue;

      if (!statusText.test(text) && !(statusWord.test(text) && signalIdentity.test(attributes))) continue;

      references.push(fileReference(file.path, file.content, match.index ?? 0));
    }
  }

  return references;
}

export default defineRule({
  id: "no-decorative-live-status",
  title: "Decorative live status",
  description: "Avoid decorative live or online signals unless they communicate real application status.",
  async match(context) {
    let references: Reference[];

    if (context.type === "files") {
      references = fileReferences(context.files);
    } else {
      const url = new URL(context.page.url());

      if (statusPagePath.test(`${url.hostname}${url.pathname}`)) return { matches: false };

      references = await context.page.$$eval("body *", (elements, patterns) => {
        const textPattern = new RegExp(patterns.text, "i");
        const wordPattern = new RegExp(patterns.word, "i");
        const identityPattern = new RegExp(patterns.identity, "i");

        return elements.flatMap((candidate) => {
          if (candidate.closest('[role="status"], [aria-live]')) return [];

          const text = Array.from(candidate.childNodes)
            .filter((node) => node.nodeType === Node.TEXT_NODE)
            .map((node) => node.textContent ?? "")
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();

          if (!text || text.length > 60 || candidate.getClientRects().length === 0) return [];

          const identity = [
            candidate.id,
            candidate.className,
            candidate.parentElement?.id,
            candidate.parentElement?.className,
          ].join(" ");

          if (!textPattern.test(text) && !(wordPattern.test(text) && identityPattern.test(identity))) return [];

          const path: string[] = [];
          let current: Element | null = candidate;

          while (current) {
            const siblings = current.parentElement ? Array.from(current.parentElement.children).filter((sibling) => sibling.tagName === current?.tagName) : [];
            path.unshift(`${current.tagName.toLowerCase()}${siblings.length > 1 ? `[${siblings.indexOf(current) + 1}]` : ""}`);
            current = current.parentElement;
          }

          return [{
            type: "element" as const,
            selector: candidate.id ? `#${CSS.escape(candidate.id)}` : `xpath=/${path.join("/")}`,
            source: candidate.outerHTML.slice(0, 200),
          }];
        });
      }, { text: statusText.source, word: statusWord.source, identity: signalIdentity.source });
    }

    return references.length > 0
      ? { matches: true, explanation: `${references.length} decorative live-status ${references.length === 1 ? "signal was" : "signals were"} found.`, references }
      : { matches: false };
  },
});

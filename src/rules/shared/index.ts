import type { RuleContext } from "../../api/index.ts";

export async function markup(context: RuleContext): Promise<string> {
  if (context.type === "puppeteer") {
    return context.page.content();
  }

  return context.files.all().map((file) => file.content).join("\n");
}

export function count(value: string, pattern: RegExp): number {
  return Array.from(value.matchAll(pattern)).length;
}

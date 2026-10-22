import type { Reference, Rule, RuleContext } from "../rules/index.ts";

export type Finding = {
  rule: Rule;
  explanation: string;
  references: readonly Reference[];
};

async function fallbackReferences(context: RuleContext): Promise<Reference[]> {
  if (context.type === "puppeteer") {
    throw new Error("Browser findings must provide exact element references");
  }

  return context.files.all().map((file) => {
    const index = file.content.search(/\S/);
    const before = index < 0 ? "" : file.content.slice(0, index);
    const line = before.split("\n").length;
    const column = index < 0 ? 1 : index - before.lastIndexOf("\n");
    const source = index < 0 ? "" : file.content.slice(index, file.content.indexOf("\n", index) < 0 ? undefined : file.content.indexOf("\n", index)).trim().slice(0, 200);

    return { type: "file" as const, path: file.path, line, column, source };
  });
}

export async function detect(rules: readonly Rule[], context: RuleContext): Promise<Finding[]> {
  const findings: Finding[] = [];

  for (const rule of rules) {
    const result = await rule.match(context);

    if (result.matches) {
      const references = result.references?.length ? result.references : await fallbackReferences(context);

      findings.push({ rule, explanation: result.explanation, references });
    }
  }

  return findings;
}

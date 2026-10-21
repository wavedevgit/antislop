import type { Rule, RuleContext } from "../rules/index.ts";

export type Finding = {
  rule: Rule;
  explanation: string;
};

export async function detect(rules: readonly Rule[], context: RuleContext): Promise<Finding[]> {
  const findings: Finding[] = [];

  for (const rule of rules) {
    const result = await rule.match(context);

    if (result.matches) {

      findings.push({ rule, explanation: result.explanation });
    }
  }

  return findings;
}

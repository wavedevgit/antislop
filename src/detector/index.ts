import type { Rule, RuleContext } from "../rules/index.ts";

export type Finding = {
  rule: Rule;
  explanation: string;
};

export async function detect(rules: readonly Rule[], context: RuleContext): Promise<Finding[]> {
  const findings: Finding[] = [];

  for (const rule of rules) {

    if (await rule.match(context)) {

      findings.push({ rule, explanation: await rule.generateExplanation(context) });
    }
  }

  return findings;
}

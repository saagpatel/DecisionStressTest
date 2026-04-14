import type { DecisionMemo } from "@/lib/domain/decision";

export function renderDecisionMemoMarkdown(memo: Omit<DecisionMemo, "markdown">) {
  const sections = [
    `# ${memo.decisionSummary}`,
    `## Recommendation\n**${memo.recommendationLabel}**`,
    `## Reasoning Summary\n${memo.reasoningSummary}`,
    "## Risk Register",
    ...memo.riskRegister.map(
      (risk) =>
        `- **${risk.title}**: ${risk.description} (severity ${risk.severity}/5, likelihood ${risk.likelihood}/5)`,
    ),
    "## Assumptions Register",
    ...memo.assumptionsRegister.map(
      (assumption) =>
        `- ${assumption.statement} (fragility ${assumption.fragility}/5, importance ${assumption.importance}/5)`,
    ),
    `## Regret / Opportunity Cost Summary\n${memo.regretSummary}`,
    "## Mitigation Checklist",
    ...memo.mitigationChecklist.map((mitigation) => `- ${mitigation.checklistItem}`),
    `## Reversible Next Step\n${memo.reversibleNextStep}`,
    "## Kill Criteria",
    ...memo.killCriteria.map((criterion) => `- ${criterion.statement} (${criterion.windowText})`),
    "## Evidence Needed",
    ...memo.evidenceNeeded.map((threshold) => `- ${threshold.thresholdText}`),
  ];

  return sections.join("\n\n");
}

export function exportFilename(slug: string) {
  const safe = slug.replace(/[^a-z0-9-]/gi, "-");
  return `${safe}-decision-memo.md`;
}

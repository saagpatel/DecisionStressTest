import { createDecision, listDecisions } from "../src/lib/db/repositories";
import { decisionIntakeSchema } from "../src/lib/domain/decision";

const fixtures = [
  {
    title: "Launch the analytics add-on for paid beta users",
    decisionType: "project_side_project",
    primaryOption: "Launch a paid beta to ten design partners next month",
    baselineAlternative: "Keep the add-on internal until Q3",
    whyThisMatters: "The add-on could become the next revenue wedge, but it competes with roadmap focus.",
    decisionDeadline: "2026-05-01",
    timeHorizon: "3 months",
    constraints: ["No more than one day per week of founder time", "Do not delay core roadmap work"],
    stakesLevel: "medium",
    successDefinition: "Secure three paying beta users and evidence that the workflow creates repeat usage.",
    biggestKnownUncertainties: ["Will design partners pay this early", "Can the add-on be supported without custom work"],
  },
  {
    title: "Accept the staff platform role",
    decisionType: "career_professional",
    primaryOption: "Accept the staff platform role at the midsize company",
    baselineAlternative: "Stay in the current principal IC role for another year",
    whyThisMatters: "The move could accelerate scope and compensation, but it may reduce autonomy and ship velocity.",
    decisionDeadline: "2026-04-28",
    timeHorizon: "12 months",
    constraints: ["No relocation", "Avoid a role with more than 20 percent people management"],
    stakesLevel: "high",
    successDefinition: "Increase scope and compensation without losing the ability to ship technical work.",
    biggestKnownUncertainties: ["How platform-heavy the role really is", "How political the org is"],
  },
  {
    title: "Adopt Linear for weekly product ops",
    decisionType: "tool_workflow_adoption",
    primaryOption: "Adopt Linear for product planning and weekly execution",
    baselineAlternative: "Keep the current Notion plus Slack workflow",
    whyThisMatters: "The current workflow leaks follow-through and creates too much manual status work.",
    decisionDeadline: "2026-04-22",
    timeHorizon: "6 weeks",
    constraints: ["Migration must fit in one week", "No loss of existing planning docs"],
    stakesLevel: "low",
    successDefinition: "Reduce weekly planning overhead and improve follow-through visibility.",
    biggestKnownUncertainties: ["Whether the team will actually use the workflows", "How much setup maintenance Linear adds"],
  },
];

async function main() {
  const existingTitles = new Set((await listDecisions()).map((decision) => decision.title));

  for (const fixture of fixtures) {
    const parsed = decisionIntakeSchema.parse(fixture);
    if (existingTitles.has(parsed.title)) {
      continue;
    }

    await createDecision(parsed);
    existingTitles.add(parsed.title);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import { decisionIntakeSchema, type DecisionIntake } from "@/lib/domain/decision";

export type StarterExample = {
  id: "career" | "project" | "tool";
  title: string;
  description: string;
  input: DecisionIntake;
};

function starterExample(input: StarterExample) {
  return {
    ...input,
    input: decisionIntakeSchema.parse(input.input),
  } satisfies StarterExample;
}

export const starterExamples = [
  starterExample({
    id: "career",
    title: "Career move with scope upside",
    description: "Shows a high-stakes role decision where scope, compensation, and role shape all matter.",
    input: {
      title: "Take the principal product engineering role",
      decisionType: "career_professional",
      primaryOption: "Accept the principal product engineering role at the growth-stage company",
      baselineAlternative: "Stay in the current senior staff IC role for another year",
      whyThisMatters: "The move increases scope and compensation without forcing a management-heavy track.",
      decisionDeadline: "2026-05-02",
      timeHorizon: "12 months",
      constraints: ["No relocation", "Keep people management under 20 percent of time"],
      stakesLevel: "high",
      successDefinition: "Increase scope, compensation, and product ownership while still shipping technical work.",
      biggestKnownUncertainties: ["How much cross-functional alignment the role needs", "How political the team is"],
    },
  }),
  starterExample({
    id: "project",
    title: "Side-project revenue wedge",
    description: "Shows a bounded product bet where evidence, support burden, and scope control matter most.",
    input: {
      title: "Launch the analytics pilot",
      decisionType: "project_side_project",
      primaryOption: "Launch a paid pilot to five design partners next month",
      baselineAlternative: "Keep the add-on internal until Q3",
      whyThisMatters: "This could become the next revenue wedge if the pilot stays bounded.",
      decisionDeadline: "2026-05-01",
      timeHorizon: "3 months",
      constraints: ["No more than one day per week of founder time", "Do not delay core roadmap work"],
      stakesLevel: "medium",
      successDefinition: "Secure three paying pilot users and repeat usage without custom work.",
      biggestKnownUncertainties: ["Will design partners pay this early?", "How much support the first cohort needs"],
    },
  }),
  starterExample({
    id: "tool",
    title: "Workflow adoption decision",
    description: "Shows a lower-stakes ops change where migration drag and actual team behavior are the real risks.",
    input: {
      title: "Adopt Linear for weekly product ops",
      decisionType: "tool_workflow_adoption",
      primaryOption: "Adopt Linear for planning and weekly execution",
      baselineAlternative: "Keep the current Notion plus Slack workflow",
      whyThisMatters: "The current workflow creates manual status work every week and weak follow-through.",
      decisionDeadline: "2026-04-25",
      timeHorizon: "6 weeks",
      constraints: ["Migration must fit in one week", "No loss of current planning docs"],
      stakesLevel: "low",
      successDefinition: "Reduce weekly planning overhead and improve follow-through visibility.",
      biggestKnownUncertainties: ["Which project templates to start with", "How to mirror the current planning cadence"],
    },
  }),
] as const satisfies StarterExample[];

export function findStarterExample(exampleId?: string | null) {
  return starterExamples.find((example) => example.id === exampleId) ?? null;
}

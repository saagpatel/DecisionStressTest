import type { DecisionIntake, RecommendationLabel } from "@/lib/domain/decision";

export type EvalFixture = {
  name: string;
  expectedLabel: RecommendationLabel;
  input: DecisionIntake;
};

export const evalFixtures: EvalFixture[] = [
  {
    name: "career gold",
    expectedLabel: "Proceed with guardrails",
    input: {
      title: "Take the principal product engineering role",
      decisionType: "career_professional",
      primaryOption: "Accept the principal product engineering role at the growth-stage company",
      baselineAlternative: "Stay in the current senior staff IC role for another year",
      whyThisMatters:
        "The current ceiling is a clear pain, and this move increases scope and compensation without forcing a management-heavy track.",
      decisionDeadline: "2026-05-02",
      timeHorizon: "12 months",
      constraints: ["No relocation", "Keep people management under 20 percent of time"],
      stakesLevel: "high",
      successDefinition: "Increase scope, compensation, and product ownership while still shipping technical work.",
      biggestKnownUncertainties: ["How much cross-functional alignment the role needs", "How the team handles prioritization tradeoffs"],
    },
  },
  {
    name: "career borderline",
    expectedLabel: "Defer until evidence",
    input: {
      title: "Join the new platform strategy team",
      decisionType: "career_professional",
      primaryOption: "Join the new platform strategy team this quarter",
      baselineAlternative: "Stay in the current role until the org structure settles",
      whyThisMatters:
        "The move could broaden influence, but the actual mandate is unclear and the role is still untested.",
      decisionDeadline: "2026-05-12",
      timeHorizon: "12 months",
      constraints: ["No relocation", "Avoid a role with heavy people management"],
      stakesLevel: "high",
      successDefinition: "Take on more scope without losing proximity to product decisions or technical work.",
      biggestKnownUncertainties: [
        "How political the team is",
        "Whether the mandate is real or mostly advisory",
        "How much technical work remains",
        "What success would actually be measured on",
      ],
    },
  },
  {
    name: "career adversarial",
    expectedLabel: "Do not pursue",
    input: {
      title: "Take the compliance-heavy staff platform role",
      decisionType: "career_professional",
      primaryOption: "Accept the staff platform role that owns customer data compliance and procurement-heavy delivery",
      baselineAlternative: "Stay in the current IC role and revisit later",
      whyThisMatters:
        "The compensation jump is meaningful, but the work looks political, people-management heavy, and tied to regulatory risk.",
      decisionDeadline: "2026-05-15",
      timeHorizon: "12 months",
      constraints: ["No relocation", "Avoid a role that adds more than 20 percent people management"],
      stakesLevel: "high",
      successDefinition: "Improve scope and compensation without absorbing compliance ownership or political coordination overhead.",
      biggestKnownUncertainties: [
        "How much customer data and regulatory review sits in the critical path",
        "Whether the role is mostly enablement load rather than building",
        "How much of the roadmap is procurement-driven",
        "How much authority the role actually has",
      ],
    },
  },
  {
    name: "project gold",
    expectedLabel: "Proceed with guardrails",
    input: {
      title: "Launch the paid pilot for the analytics add-on",
      decisionType: "project_side_project",
      primaryOption: "Launch a paid pilot to five design partners next month",
      baselineAlternative: "Keep the add-on internal until Q3",
      whyThisMatters:
        "The design partners are already asking for this workflow, and there is a time-sensitive market window to convert that warm demand.",
      decisionDeadline: "2026-05-01",
      timeHorizon: "3 months",
      constraints: ["No more than one day per week of founder time", "Do not delay core roadmap work"],
      stakesLevel: "medium",
      successDefinition: "Secure three paying pilot users and repeat usage without custom work.",
      biggestKnownUncertainties: ["Which onboarding path converts fastest", "How much support the first cohort needs"],
    },
  },
  {
    name: "project borderline",
    expectedLabel: "Defer until evidence",
    input: {
      title: "Spin up the new paid beta offer",
      decisionType: "project_side_project",
      primaryOption: "Run a paid beta test for the new add-on",
      baselineAlternative: "Keep it internal until stronger demand exists",
      whyThisMatters:
        "The idea could open a new revenue wedge, but the actual buyer urgency is still unclear and mostly untested.",
      decisionDeadline: "2026-05-20",
      timeHorizon: "3 months",
      constraints: ["Keep it to one day per week", "Do not expand scope before the first checkpoint"],
      stakesLevel: "medium",
      successDefinition: "Find a repeatable problem that at least three users will pay to solve.",
      biggestKnownUncertainties: [
        "Whether anyone pays this early",
        "Whether the onboarding is clear",
        "How much manual support it needs",
        "How much of the signal is just polite interest",
      ],
    },
  },
  {
    name: "project adversarial",
    expectedLabel: "Do not pursue",
    input: {
      title: "Replatform the side project onto a compliance-heavy rewrite",
      decisionType: "project_side_project",
      primaryOption: "Replace the current app with a rewrite that adds customer data compliance and procurement workflows",
      baselineAlternative: "Keep the existing app and avoid the rewrite",
      whyThisMatters:
        "The rewrite sounds ambitious, but it adds procurement risk, custom work, and a large migration before any clear demand exists.",
      decisionDeadline: "2026-05-18",
      timeHorizon: "6 months",
      constraints: ["Do not exceed the current budget", "Do not add a long migration before demand is proven"],
      stakesLevel: "high",
      successDefinition: "Create meaningful upside without taking on a compliance-heavy rewrite that blocks everything else.",
      biggestKnownUncertainties: [
        "Whether the market actually needs the new workflow",
        "How large the migration is",
        "How much customer data compliance review is required",
        "How much support burden the new version creates",
      ],
    },
  },
  {
    name: "tool gold",
    expectedLabel: "Proceed with guardrails",
    input: {
      title: "Adopt Linear for weekly product ops",
      decisionType: "tool_workflow_adoption",
      primaryOption: "Adopt Linear for planning and weekly execution",
      baselineAlternative: "Keep the current Notion plus Slack workflow",
      whyThisMatters:
        "The current workflow creates manual status work every week, and the team already feels the clear pain of weak follow-through.",
      decisionDeadline: "2026-04-25",
      timeHorizon: "6 weeks",
      constraints: ["Migration must fit in one week", "No loss of current planning docs"],
      stakesLevel: "low",
      successDefinition: "Reduce weekly planning overhead and improve follow-through visibility.",
      biggestKnownUncertainties: ["Which project templates to start with", "How to mirror the current planning cadence"],
    },
  },
  {
    name: "tool borderline",
    expectedLabel: "Defer until evidence",
    input: {
      title: "Adopt a new roadmap tool for minor convenience",
      decisionType: "tool_workflow_adoption",
      primaryOption: "Adopt the new roadmap tool this month",
      baselineAlternative: "Keep the current workflow",
      whyThisMatters:
        "The new tool might be a nice to have, but the actual improvement still feels unclear and untested.",
      decisionDeadline: "2026-04-29",
      timeHorizon: "6 weeks",
      constraints: ["Keep setup under one week", "Do not break the existing documentation flow"],
      stakesLevel: "low",
      successDefinition: "See a slight improvement in planning overhead without disrupting delivery.",
      biggestKnownUncertainties: [
        "Whether the team really uses it",
        "Whether it changes follow-through at all",
        "How much setup maintenance it adds",
        "Whether the reporting is actually better",
      ],
    },
  },
  {
    name: "tool adversarial",
    expectedLabel: "Do not pursue",
    input: {
      title: "Replace the workflow stack with a procurement-heavy migration",
      decisionType: "tool_workflow_adoption",
      primaryOption: "Replace the current workflow stack with a procurement-heavy migration that handles customer data and compliance workflows",
      baselineAlternative: "Keep the current workflow until the need is proven",
      whyThisMatters:
        "The change looks broad, but it adds vendor lock-in, migration risk, security review, and enablement load before a clear benefit exists.",
      decisionDeadline: "2026-05-10",
      timeHorizon: "8 weeks",
      constraints: ["Do not lose current planning docs", "Do not take on a long migration without proven upside"],
      stakesLevel: "medium",
      successDefinition: "Improve execution quality without absorbing a risky migration or long-term support burden.",
      biggestKnownUncertainties: [
        "How painful the migration really is",
        "How much customer data review it needs",
        "How much enablement load falls on the operator",
        "Whether the upside is real or just tool enthusiasm",
      ],
    },
  },
];

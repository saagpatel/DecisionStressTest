import type { DecisionType, ExecutableStageName } from "@/lib/domain/decision";

export const decisionTypeLabels: Record<DecisionType, string> = {
  project_side_project: "Project / side-project",
  career_professional: "Career / professional",
  tool_workflow_adoption: "Tool / workflow adoption",
};

export const stageCopy: Record<ExecutableStageName, { title: string; description: string }> = {
  normalization: {
    title: "Decision normalization",
    description: "Turn the raw intake into a crisp decision frame, clarified success criteria, and bounded uncertainty.",
  },
  premortem: {
    title: "Pre-mortem",
    description: "Stress-test the primary option by extracting operational risks, fragile assumptions, and mitigations.",
  },
  regret: {
    title: "Regret / inaction",
    description: "Measure the cost of delay, missed upside, and the evidence thresholds that should change the call.",
  },
  synthesis: {
    title: "Synthesis",
    description: "Score the decision, force a recommendation label, and render the final memo.",
  },
};

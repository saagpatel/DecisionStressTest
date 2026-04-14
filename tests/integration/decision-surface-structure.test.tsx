import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { runStage } from "@/lib/analysis/pipeline";
import { createDecision, updateDecisionIntake } from "@/lib/db/repositories";
import type { DecisionIntake } from "@/lib/domain/decision";

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<typeof import("next/navigation")>("next/navigation");

  return {
    ...actual,
    useRouter: () => ({
      refresh: vi.fn(),
    }),
  };
});

const baseInput: DecisionIntake = {
  title: "Launch the pilot carefully",
  decisionType: "project_side_project",
  primaryOption: "Launch a paid pilot to design partners",
  baselineAlternative: "Keep the add-on internal until later",
  whyThisMatters: "This could become the next revenue wedge.",
  decisionDeadline: "2026-05-05",
  timeHorizon: "3 months",
  constraints: ["No more than one day per week", "Do not delay the core roadmap"],
  stakesLevel: "medium",
  successDefinition: "Secure three paying pilot users.",
  biggestKnownUncertainties: ["Will anyone pay this early?", "How much support will it take?"],
};

async function createCompletedDecision(title: string) {
  const decisionId = await createDecision({
    ...baseInput,
    title,
  });

  await runStage(decisionId, "normalization");
  await runStage(decisionId, "premortem");
  await runStage(decisionId, "regret");
  await runStage(decisionId, "synthesis");

  return decisionId;
}

describe("decision surface structure", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  test("keeps workbench structure anchored by navigation, summary, and stage content", async () => {
    const decisionId = await createCompletedDecision("Workbench structure check");

    const pageModule = await import("@/app/decisions/[decisionId]/page");
    render(await pageModule.default({ params: Promise.resolve({ decisionId }) }));

    const nav = screen.getByRole("navigation", { name: "Decision navigation" });
    const summaryRail = screen.getByTestId("workbench-summary-rail");
    const nextActionPanel = screen.getByTestId("next-action-panel");
    const stageHeading = screen.getByRole("heading", { name: "Decision normalization" });
    const intakeHeading = screen.getByRole("heading", { name: "Edit the latest intake snapshot" });

    expect(nav).toBeInTheDocument();
    expect(summaryRail).toBeInTheDocument();
    expect(nextActionPanel).toBeInTheDocument();
    expect(summaryRail.compareDocumentPosition(nextActionPanel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(nextActionPanel.compareDocumentPosition(stageHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(stageHeading.compareDocumentPosition(intakeHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test("puts selected snapshot artifacts ahead of comparison detail on the history page", async () => {
    const decisionId = await createCompletedDecision("History structure check");
    await updateDecisionIntake(decisionId, {
      ...baseInput,
      title: "History structure check",
      whyThisMatters: "This should create a second snapshot for the structure test.",
    });

    const pageModule = await import("@/app/decisions/[decisionId]/history/page");
    render(
      await pageModule.default({
        params: Promise.resolve({ decisionId }),
        searchParams: Promise.resolve({}),
      }),
    );

    const summaryRail = screen.getByTestId("history-summary-rail");
    const selectedSnapshotPanel = screen.getByTestId("selected-snapshot-panel");
    const artifactHeading = screen.getByRole("heading", { name: "Decision normalization" });
    const comparisonPanel = screen.getByTestId("snapshot-comparison-panel");
    const comparisonHeading = screen.getByRole("heading", { name: "Snapshot comparison" });

    expect(screen.getByRole("navigation", { name: "Decision navigation" })).toBeInTheDocument();
    expect(summaryRail.compareDocumentPosition(selectedSnapshotPanel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(selectedSnapshotPanel.compareDocumentPosition(artifactHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(artifactHeading.compareDocumentPosition(comparisonPanel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(comparisonPanel).toContainElement(comparisonHeading);
  });

  test("keeps memo source context above the main recommendation body", async () => {
    const decisionId = await createCompletedDecision("Memo structure check");

    const pageModule = await import("@/app/decisions/[decisionId]/memo/page");
    render(
      await pageModule.default({
        params: Promise.resolve({ decisionId }),
        searchParams: Promise.resolve({}),
      }),
    );

    const sourceLabel = screen.getByText("Analysis source");
    const recommendationHeading = screen.getAllByText("Recommendation")[1];

    expect(sourceLabel.compareDocumentPosition(recommendationHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test("keeps backup controls ahead of the saved decision list on the ledger page", async () => {
    await createCompletedDecision("Ledger structure check");

    const pageModule = await import("@/app/decisions/page");
    render(await pageModule.default());

    const backupHeading = screen.getByRole("heading", { name: "Back up the local decision ledger" });
    const decisionTitle = screen.getByText("Ledger structure check");

    expect(backupHeading.compareDocumentPosition(decisionTitle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

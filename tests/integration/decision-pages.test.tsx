import { render, screen, within } from "@testing-library/react";
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

describe("decision route rendering", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  test("renders the decision ledger page with backup controls and saved work", async () => {
    await createCompletedDecision("Ledger render check");

    const pageModule = await import("@/app/decisions/page");
    render(await pageModule.default());

    expect(screen.getByRole("heading", { name: "Decision ledger" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Back up the local decision ledger" })).toBeInTheDocument();
    expect(screen.getByText("Ledger render check")).toBeInTheDocument();
  });

  test("renders the active workbench page with decision status and stage controls", async () => {
    const decisionId = await createCompletedDecision("Workbench render check");

    const pageModule = await import("@/app/decisions/[decisionId]/page");
    render(await pageModule.default({ params: Promise.resolve({ decisionId }) }));

    expect(screen.getByRole("heading", { name: "Workbench render check" })).toBeInTheDocument();
    expect(screen.getByTestId("workbench-summary-rail")).toBeInTheDocument();
    const nextActionPanel = within(screen.getByTestId("next-action-panel"));
    expect(nextActionPanel.getByText("Next action")).toBeInTheDocument();
    expect(nextActionPanel.getByRole("heading", { name: "Review the memo or rerun a stage" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rerun synthesis" })).toBeInTheDocument();
  });

  test("renders the memo page with current snapshot cues", async () => {
    const decisionId = await createCompletedDecision("Memo render check");

    const pageModule = await import("@/app/decisions/[decisionId]/memo/page");
    render(
      await pageModule.default({
        params: Promise.resolve({ decisionId }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.getByRole("heading", { name: "Memo render check" })).toBeInTheDocument();
    expect(screen.getByText("This is the current snapshot memo.")).toBeInTheDocument();
    expect(screen.getByText("Analysis source")).toBeInTheDocument();
  });

  test("renders the history page with current and historical snapshots", async () => {
    const decisionId = await createCompletedDecision("History render check");
    await updateDecisionIntake(decisionId, {
      ...baseInput,
      title: "History render check",
      whyThisMatters: "The second snapshot should force a fresh comparison.",
    });

    const pageModule = await import("@/app/decisions/[decisionId]/history/page");
    render(
      await pageModule.default({
        params: Promise.resolve({ decisionId }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.getByRole("heading", { name: "History render check" })).toBeInTheDocument();
    expect(screen.getByTestId("history-summary-rail")).toBeInTheDocument();
    const snapshotLedger = within(screen.getByTestId("snapshot-ledger"));
    expect(snapshotLedger.getByText("Current snapshot")).toBeInTheDocument();
    expect(snapshotLedger.getByText("Historical snapshots")).toBeInTheDocument();
    expect(screen.getByText("Snapshot comparison")).toBeInTheDocument();
  });
});

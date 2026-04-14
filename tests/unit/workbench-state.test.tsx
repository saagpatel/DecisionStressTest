import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { StageActions } from "@/features/decisions/components/stage-actions";
import { StageCard } from "@/features/decisions/components/stage-card";
import { deriveWorkbenchStageStates } from "@/features/decisions/lib/workbench-status";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const runStageActionMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

vi.mock("@/features/decisions/actions", () => ({
  runStageAction: (...args: unknown[]) => runStageActionMock(...args),
}));

describe("workbench state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("disables stage buttons until prerequisites are met", () => {
    const stageStates = deriveWorkbenchStageStates({
      currentStage: "intake",
      artifacts: {
        normalization: false,
        premortem: false,
        regret: false,
        synthesis: false,
      },
      latestFailures: {
        normalization: null,
        premortem: null,
        regret: null,
        synthesis: null,
      },
    });

    render(
      <StageActions
        decisionId="decision_1"
        currentStage="intake"
        stageStates={stageStates}
      />,
    );

    expect(screen.getByRole("button", { name: "Run normalization" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Run premortem" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Run regret" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Run synthesis" })).toBeDisabled();
  });

  test("shows rerun labels only for completed stages", () => {
    const stageStates = deriveWorkbenchStageStates({
      currentStage: "regret",
      artifacts: {
        normalization: true,
        premortem: true,
        regret: false,
        synthesis: false,
      },
      latestFailures: {
        normalization: null,
        premortem: null,
        regret: null,
        synthesis: null,
      },
    });

    render(
      <StageActions
        decisionId="decision_1"
        currentStage="regret"
        stageStates={stageStates}
      />,
    );

    expect(screen.getByRole("button", { name: "Rerun normalization" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Rerun premortem" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Run regret" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Run synthesis" })).toBeDisabled();
  });

  test("keeps failure messaging visible after a failed stage action", async () => {
    runStageActionMock.mockResolvedValue({
      ok: false,
      error: "The model request timed out before this stage completed.",
      recoveryText: "Retry this stage.",
    });
    const stageStates = deriveWorkbenchStageStates({
      currentStage: "premortem",
      artifacts: {
        normalization: true,
        premortem: false,
        regret: false,
        synthesis: false,
      },
      latestFailures: {
        normalization: null,
        premortem: null,
        regret: null,
        synthesis: null,
      },
    });

    render(
      <StageActions
        decisionId="decision_1"
        currentStage="premortem"
        stageStates={stageStates}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Run premortem" }));

    await waitFor(() => {
      expect(screen.getByText("The model request timed out before this stage completed.")).toBeInTheDocument();
    });
    expect(screen.getByRole("alert")).toHaveTextContent("The model request timed out before this stage completed.");
    expect(screen.getByText("Retry this stage.")).toBeInTheDocument();
  });

  test("shows stale artifact warning when a rerun fails after prior success", () => {
    render(
      <StageCard
        stage="premortem"
        premortem={{
          failureNarrative: "The launch failed because the workload expanded beyond the original scope.",
          risks: [
            {
              title: "Execution cost overruns",
              description: "The work takes longer than expected.",
              severity: 4,
              likelihood: 3,
              detectability: 3,
              timeToImpact: "2 weeks",
              ownerScope: "Founder",
            },
            {
              title: "Weak early signal",
              description: "The evidence remains noisy.",
              severity: 3,
              likelihood: 3,
              detectability: 2,
              timeToImpact: "2 weeks",
              ownerScope: "Founder",
            },
            {
              title: "Constraint drift",
              description: "The project breaks the time cap.",
              severity: 4,
              likelihood: 2,
              detectability: 4,
              timeToImpact: "1 week",
              ownerScope: "Founder",
            },
          ],
          assumptions: [
            {
              statement: "The upside is worth a bounded test.",
              fragility: 3,
              importance: 5,
              testability: 4,
            },
            {
              statement: "The work fits inside the current schedule.",
              fragility: 4,
              importance: 4,
              testability: 4,
            },
          ],
          mitigations: [
            {
              riskTitle: "Execution cost overruns",
              checklistItem: "Time-box the first test.",
              priority: "high",
              feasibility: 4,
            },
            {
              riskTitle: "Weak early signal",
              checklistItem: "Define a primary metric before launch.",
              priority: "high",
              feasibility: 5,
            },
          ],
        }}
        latestFailure={{
          status: "failed",
          errorCode: "timeout",
          errorMessage: "The model request timed out before this stage completed.",
          refusalReason: null,
          provider: "mock",
        }}
        stageState={deriveWorkbenchStageStates({
          currentStage: "regret",
          artifacts: {
            normalization: true,
            premortem: true,
            regret: false,
            synthesis: false,
          },
          latestFailures: {
            normalization: null,
            premortem: {
              status: "failed",
              errorCode: "timeout",
              errorMessage: "The model request timed out before this stage completed.",
              refusalReason: null,
              provider: "mock",
            },
            regret: null,
            synthesis: null,
          },
        }).find((stage) => stage.stage === "premortem")}
      />,
    );

    expect(screen.getByText("The model request timed out")).toBeInTheDocument();
    expect(
      screen.getByText("The last successful premortem output is still shown below until a new run succeeds."),
    ).toBeInTheDocument();
  });
});

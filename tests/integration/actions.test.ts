import { beforeEach, describe, expect, test, vi } from "vitest";

import { StageExecutionError } from "@/lib/analysis/errors";

const assertLocalRequestMock = vi.fn();
const revalidatePathMock = vi.fn();
const createDecisionMock = vi.fn();
const updateDecisionIntakeMock = vi.fn();
const runStageMock = vi.fn();
const createDatabaseBackupMock = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/lib/security/local-access", () => ({
  assertLocalRequest: assertLocalRequestMock,
}));

vi.mock("@/lib/db/repositories", () => ({
  createDecision: createDecisionMock,
  updateDecisionIntake: updateDecisionIntakeMock,
}));

vi.mock("@/lib/analysis/pipeline", () => ({
  runStage: runStageMock,
}));

vi.mock("@/lib/db/backup", () => ({
  createDatabaseBackup: createDatabaseBackupMock,
}));

describe("decision server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("creates a decision and revalidates the home and ledger routes", async () => {
    createDecisionMock.mockResolvedValue("decision_1");

    const { createDecisionAction } = await import("@/features/decisions/actions");
    const result = await createDecisionAction({
      title: "Launch the bounded pilot",
      decisionType: "project_side_project",
      primaryOption: "Launch a paid pilot next month",
      baselineAlternative: "Keep the add-on internal until later",
      whyThisMatters: "This could become the next revenue wedge.",
      decisionDeadline: "2026-05-05",
      timeHorizon: "3 months",
      constraints: ["No more than one day per week"],
      stakesLevel: "medium",
      successDefinition: "Secure three paying pilot users.",
      biggestKnownUncertainties: ["Will anyone pay this early?"],
    });

    expect(assertLocalRequestMock).toHaveBeenCalled();
    expect(createDecisionMock).toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
    expect(revalidatePathMock).toHaveBeenCalledWith("/decisions");
    expect(result).toEqual({ ok: true, decisionId: "decision_1" });
  });

  test("returns a normalized failure when the local request guard blocks mutation", async () => {
    assertLocalRequestMock.mockRejectedValueOnce(new Error("Forbidden"));

    const { createDecisionAction } = await import("@/features/decisions/actions");
    const result = await createDecisionAction({
      title: "Blocked decision",
      decisionType: "project_side_project",
      primaryOption: "Do the thing",
      baselineAlternative: "Do nothing",
      whyThisMatters: "Need a fast answer.",
      decisionDeadline: "2026-05-05",
      timeHorizon: "2 weeks",
      constraints: ["Keep it simple"],
      stakesLevel: "low",
      successDefinition: "Get to a yes or no.",
      biggestKnownUncertainties: ["Will the guard allow it?"],
    });

    expect(result).toEqual({
      ok: false,
      error: "Forbidden",
    });
  });

  test("updates intake and revalidates the affected decision routes", async () => {
    const { updateDecisionAction } = await import("@/features/decisions/actions");
    const result = await updateDecisionAction("decision_1", {
      title: "Revise the live decision",
      decisionType: "project_side_project",
      primaryOption: "Launch the pilot with tighter scope",
      baselineAlternative: "Keep the add-on internal until later",
      whyThisMatters: "The next revision should stay bounded.",
      decisionDeadline: "2026-05-05",
      timeHorizon: "3 months",
      constraints: ["No more than one day per week"],
      stakesLevel: "medium",
      successDefinition: "Secure three paying pilot users.",
      biggestKnownUncertainties: ["Will anyone pay this early?"],
    });

    expect(updateDecisionIntakeMock).toHaveBeenCalledWith(
      "decision_1",
      expect.objectContaining({ title: "Revise the live decision" }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/decisions/decision_1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/decisions");
    expect(result).toEqual({ ok: true, decisionId: "decision_1" });
  });

  test("normalizes stage execution failures and exposes the recovery shape", async () => {
    runStageMock.mockRejectedValueOnce(
      new StageExecutionError({
        type: "timeout",
        message: "The model request timed out before this stage completed.",
        retryable: true,
        recoveryAction: "retry_stage",
      }),
    );

    const { runStageAction } = await import("@/features/decisions/actions");
    const result = await runStageAction("decision_1", "normalization");

    expect(result).toEqual({
      ok: false,
      error: "The model request timed out before this stage completed.",
      failureType: "timeout",
      retryable: true,
      recoveryAction: "retry_stage",
      recoveryText: "Retry this stage.",
      refusalReason: null,
    });
  });

  test("revalidates workbench, memo, ledger, and home after a successful stage run", async () => {
    const { runStageAction } = await import("@/features/decisions/actions");
    const result = await runStageAction("decision_1", "synthesis");

    expect(runStageMock).toHaveBeenCalledWith("decision_1", "synthesis");
    expect(revalidatePathMock).toHaveBeenCalledWith("/decisions/decision_1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/decisions/decision_1/memo");
    expect(revalidatePathMock).toHaveBeenCalledWith("/decisions");
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
    expect(result).toEqual({ ok: true });
  });

  test("creates a backup and revalidates the decision ledger", async () => {
    createDatabaseBackupMock.mockResolvedValue({
      filename: "decision-stress-test-test-backup.sqlite",
      createdAt: "2026-04-13T00:00:00.000Z",
      path: "/tmp/decision-stress-test-test-backup.sqlite",
    });

    const { createBackupAction } = await import("@/features/decisions/actions");
    const result = await createBackupAction();

    expect(createDatabaseBackupMock).toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith("/decisions");
    expect(result).toEqual({
      ok: true,
      backup: {
        filename: "decision-stress-test-test-backup.sqlite",
        createdAt: "2026-04-13T00:00:00.000Z",
        path: "/tmp/decision-stress-test-test-backup.sqlite",
      },
    });
  });
});

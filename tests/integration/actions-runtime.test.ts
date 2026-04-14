import fs from "node:fs";

import { beforeEach, describe, expect, test, vi } from "vitest";

import { getDecisionById, listDecisionSnapshots } from "@/lib/db/repositories";
import type { DecisionIntake } from "@/lib/domain/decision";

const revalidatePathMock = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/lib/security/local-access", () => ({
  assertLocalRequest: vi.fn().mockResolvedValue(undefined),
}));

const baseInput: DecisionIntake = {
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
};

describe("decision server actions runtime wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("persists a created decision through the real repository layer", async () => {
    const { createDecisionAction } = await import("@/features/decisions/actions");
    const result = await createDecisionAction(baseInput);

    expect(result).toEqual({
      ok: true,
      decisionId: expect.any(String),
    });

    if (!result.ok) {
      throw new Error("createDecisionAction did not succeed");
    }

    const detail = await getDecisionById(result.decisionId);

    expect(detail?.decision.title).toBe(baseInput.title);
    expect(detail?.snapshot?.version).toBe(1);
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
    expect(revalidatePathMock).toHaveBeenCalledWith("/decisions");
  });

  test("creates a fresh snapshot when the intake is revised", async () => {
    const { createDecisionAction, updateDecisionAction } = await import("@/features/decisions/actions");
    const created = await createDecisionAction(baseInput);

    if (!created.ok) {
      throw new Error("createDecisionAction did not succeed");
    }

    await updateDecisionAction(created.decisionId, {
      ...baseInput,
      whyThisMatters: "The revised version needs a smaller first test.",
    });

    const snapshots = await listDecisionSnapshots(created.decisionId);
    const detail = await getDecisionById(created.decisionId);

    expect(snapshots?.snapshots).toHaveLength(2);
    expect(detail?.snapshot?.version).toBe(2);
    expect(detail?.snapshot?.rawIntakeJson.whyThisMatters).toBe("The revised version needs a smaller first test.");
    expect(revalidatePathMock).toHaveBeenCalledWith(`/decisions/${created.decisionId}`);
    expect(revalidatePathMock).toHaveBeenCalledWith("/decisions");
  });

  test("runs a stage and persists the resulting artifact through the real pipeline", async () => {
    const { createDecisionAction, runStageAction } = await import("@/features/decisions/actions");
    const created = await createDecisionAction(baseInput);

    if (!created.ok) {
      throw new Error("createDecisionAction did not succeed");
    }

    const result = await runStageAction(created.decisionId, "normalization");
    const detail = await getDecisionById(created.decisionId);

    expect(result).toEqual({ ok: true });
    expect(detail?.normalized).not.toBeNull();
    expect(detail?.decision.currentStage).toBe("premortem");
    expect(revalidatePathMock).toHaveBeenCalledWith(`/decisions/${created.decisionId}`);
    expect(revalidatePathMock).toHaveBeenCalledWith(`/decisions/${created.decisionId}/memo`);
  });

  test("creates a real backup file through the action boundary", async () => {
    const { createDecisionAction, createBackupAction } = await import("@/features/decisions/actions");
    await createDecisionAction(baseInput);

    const result = await createBackupAction();

    expect(result).toEqual({
      ok: true,
      backup: expect.objectContaining({
        filename: expect.stringContaining(".sqlite"),
        path: expect.any(String),
      }),
    });

    if (!result.ok) {
      throw new Error("createBackupAction did not succeed");
    }

    expect(fs.existsSync(result.backup.path)).toBe(true);
    expect(revalidatePathMock).toHaveBeenCalledWith("/decisions");
  });
});

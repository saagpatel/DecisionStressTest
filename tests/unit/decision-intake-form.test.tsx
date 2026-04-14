import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { DecisionIntakeForm } from "@/features/decisions/components/decision-intake-form";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const createDecisionActionMock = vi.fn();
const updateDecisionActionMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

vi.mock("@/features/decisions/actions", () => ({
  createDecisionAction: (...args: unknown[]) => createDecisionActionMock(...args),
  updateDecisionAction: (...args: unknown[]) => updateDecisionActionMock(...args),
}));

describe("decision intake form starter examples", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createDecisionActionMock.mockResolvedValue({
      ok: true,
      decisionId: "decision_1",
    });
  });

  test("prefills fields from a starter example without creating a decision", async () => {
    render(<DecisionIntakeForm starterExampleId="project" />);

    expect(screen.getByDisplayValue("Launch the analytics pilot")).toBeInTheDocument();
    expect(createDecisionActionMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Career move with scope upside" }));

    await waitFor(() => {
      expect(
        screen.getByDisplayValue("Take the principal product engineering role"),
      ).toBeInTheDocument();
    });
    expect(createDecisionActionMock).not.toHaveBeenCalled();
  });

  test("switches examples cleanly and can return to blank mode", async () => {
    render(<DecisionIntakeForm starterExampleId="career" />);

    expect(
      screen.getByDisplayValue("Take the principal product engineering role"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Workflow adoption decision" }));

    await waitFor(() => {
      expect(screen.getByDisplayValue("Adopt Linear for weekly product ops")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Start blank" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Decision title")).toHaveValue("");
    });
  });
});

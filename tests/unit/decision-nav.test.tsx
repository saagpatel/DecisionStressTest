import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { DecisionNav } from "@/features/decisions/components/decision-nav";

describe("decision navigation", () => {
  test("explains when the current memo route is unavailable", () => {
    render(<DecisionNav decisionId="decision_1" active="workbench" hasCurrentMemo={false} />);

    expect(screen.getByText("Memo")).toHaveAttribute("aria-disabled", "true");
    expect(
      screen.getByText("Memo becomes available after the latest snapshot completes synthesis and generates a fresh memo."),
    ).toBeInTheDocument();
  });
});

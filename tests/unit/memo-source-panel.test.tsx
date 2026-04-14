import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { MemoSourcePanel } from "@/features/decisions/components/memo-source-panel";

describe("memo source panel", () => {
  test("shows historical read-only copy and analysis source", () => {
    render(
      <MemoSourcePanel
        isHistoricalSnapshot
        historyHref="/decisions/decision_1/history?snapshot=snapshot_1"
        analysisSource="Mock simulation"
      />,
    );

    expect(screen.getByText("This is a historical snapshot memo.")).toBeInTheDocument();
    expect(screen.getByText("Mock simulation")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return to this snapshot in history" })).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { DecisionList } from "@/features/decisions/components/decision-list";

describe("decision list", () => {
  test("shows recommendation, snapshot count, and recommendation state for returning users", () => {
    render(
      <DecisionList
        emptyCopy="Nothing here"
        decisions={[
          {
            id: "decision_1",
            title: "Launch the pilot",
            decisionType: "project_side_project",
            currentStage: "intake",
            updatedAt: "2026-04-13T08:15:00.000Z",
            snapshotCount: 2,
            recommendationLabel: null,
            confidenceLevel: null,
            isStaleRecommendation: true,
          },
        ]}
      />,
    );

    expect(screen.getByText("Launch the pilot")).toBeInTheDocument();
    expect(screen.getByText("Recommendation:")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("v2")).toBeInTheDocument();
    expect(screen.getByText("Pending refresh")).toBeInTheDocument();
    expect(
      screen.getByText("The latest intake changed. Re-run downstream stages before relying on the previous recommendation."),
    ).toBeInTheDocument();
  });
});

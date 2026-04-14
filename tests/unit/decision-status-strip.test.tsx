import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { DecisionStatusStrip } from "@/features/decisions/components/decision-status-strip";
import { deriveProviderStatus } from "@/features/decisions/lib/provider-status";

describe("decision status strip", () => {
  test("shows pending refresh state and provider mode", () => {
    render(
      <DecisionStatusStrip
        snapshotVersion={3}
        hasCurrentRecommendation={false}
        hasHistoricalRecommendation
        nextActionTitle="Run Decision frame"
        nextActionDetail="Fresh reasoning needs to start from the latest intake."
        providerStatus={deriveProviderStatus({
          provider: "mock",
          aiEnabled: false,
          issues: [],
        })}
      />,
    );

    expect(screen.getByText("Version 3")).toBeInTheDocument();
    expect(screen.getByText("Pending refresh")).toBeInTheDocument();
    expect(screen.getByText("Run Decision frame")).toBeInTheDocument();
    expect(screen.getByText("Mock simulation")).toBeInTheDocument();
  });
});

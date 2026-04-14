import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { CompactSummaryRail } from "@/features/decisions/components/compact-summary-rail";

describe("compact summary rail", () => {
  test("renders featured and supporting summary items", () => {
    render(
      <CompactSummaryRail
        items={[
          {
            key: "freshness",
            label: "Recommendation",
            value: "Recommendation is current for this snapshot.",
            featured: true,
            badge: {
              label: "Fresh",
              className: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
            },
          },
          {
            key: "next-action",
            label: "Next action",
            value: "Run Risk review",
            detail: "Fresh reasoning needs to start from the latest snapshot.",
          },
        ]}
      />,
    );

    expect(screen.getByText("Recommendation")).toBeInTheDocument();
    expect(screen.getByText("Fresh")).toBeInTheDocument();
    expect(screen.getByText("Run Risk review")).toBeInTheDocument();
  });
});

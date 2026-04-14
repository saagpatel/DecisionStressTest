import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { SnapshotLedger } from "@/features/decisions/components/snapshot-ledger";

describe("snapshot ledger", () => {
  test("renders current and historical groups with the selected snapshot emphasized", () => {
    render(
      <SnapshotLedger
        selectedSnapshotId="snapshot_3"
        groups={[
          {
            title: "Current snapshot",
            rows: [
              {
                snapshotId: "snapshot_3",
                href: "/decisions/decision_1/history?snapshot=snapshot_3",
                version: 3,
                createdAt: "2026-04-13T08:15:00.000Z",
                summary: {
                  snapshotBadge: "Current",
                  stageLabel: "Synthesis",
                  recommendationText: "Proceed with guardrails",
                  confidenceText: "Confidence medium",
                  staleText: null,
                },
              },
            ],
          },
          {
            title: "Historical snapshots",
            rows: [
              {
                snapshotId: "snapshot_2",
                href: "/decisions/decision_1/history?snapshot=snapshot_2",
                version: 2,
                createdAt: "2026-04-12T08:15:00.000Z",
                summary: {
                  snapshotBadge: "Historical",
                  stageLabel: "Memo",
                  recommendationText: "Proceed with guardrails",
                  confidenceText: "Confidence medium",
                  staleText: null,
                },
              },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByText("Current snapshot")).toBeInTheDocument();
    expect(screen.getByText("Historical snapshots")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Version 3/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getAllByText(/Recommendation:/)).toHaveLength(2);
    expect(screen.getAllByText(/Latest stage:/)).toHaveLength(2);
  });

  test("enables the scrollable ledger state when many snapshots exist", () => {
    render(
      <SnapshotLedger
        selectedSnapshotId="snapshot_7"
        groups={[
          {
            title: "Current snapshot",
            rows: [
              {
                snapshotId: "snapshot_7",
                href: "/decisions/decision_1/history?snapshot=snapshot_7",
                version: 7,
                createdAt: "2026-04-13T08:15:00.000Z",
                summary: {
                  snapshotBadge: "Current",
                  stageLabel: "Intake",
                  recommendationText: "Recommendation pending",
                  confidenceText: null,
                  staleText: "Stale recommendation",
                },
              },
            ],
          },
          {
            title: "Historical snapshots",
            rows: Array.from({ length: 6 }, (_, index) => ({
              snapshotId: `snapshot_${index + 1}`,
              href: `/decisions/decision_1/history?snapshot=snapshot_${index + 1}`,
              version: index + 1,
              createdAt: "2026-04-10T08:15:00.000Z",
              summary: {
                snapshotBadge: "Historical",
                stageLabel: "Memo",
                recommendationText: "Proceed",
                confidenceText: "Confidence high",
                staleText: null,
              },
            })),
          },
        ]}
      />,
    );

    expect(screen.getByTestId("snapshot-ledger").className).toContain("overflow-y-auto");
  });
});

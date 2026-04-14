import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { BackupPanel } from "@/features/decisions/components/backup-panel";

const createBackupActionMock = vi.fn();

vi.mock("@/features/decisions/actions", () => ({
  createBackupAction: () => createBackupActionMock(),
}));

describe("backup panel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("shows the current data directory and latest backup info", () => {
    render(
      <BackupPanel
        appDataPath="/Users/test/Library/Application Support/DecisionStressTest"
        latestBackup={{
          filename: "decision-stress-test-development-20260413T081500Z.sqlite",
          path: "/tmp/decision-stress-test-development-20260413T081500Z.sqlite",
          createdAt: "2026-04-13T08:15:00.000Z",
          sizeBytes: 2048,
        }}
      />,
    );

    expect(screen.getByText(/Data directory:/)).toBeInTheDocument();
    expect(screen.getByText("decision-stress-test-development-20260413T081500Z.sqlite")).toBeInTheDocument();
  });

  test("creates a backup and shows the new filename", async () => {
    createBackupActionMock.mockResolvedValue({
      ok: true,
      backup: {
        filename: "decision-stress-test-development-20260413T090000Z.sqlite",
        path: "/tmp/decision-stress-test-development-20260413T090000Z.sqlite",
        createdAt: "2026-04-13T09:00:00.000Z",
        sizeBytes: 2048,
      },
    });

    render(<BackupPanel appDataPath="/tmp/app-data" latestBackup={null} />);

    fireEvent.click(screen.getByRole("button", { name: "Create local backup" }));

    await waitFor(() => {
      expect(screen.getByText("Created backup decision-stress-test-development-20260413T090000Z.sqlite.")).toBeInTheDocument();
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Created backup decision-stress-test-development-20260413T090000Z.sqlite.",
    );
    expect(screen.getByText("decision-stress-test-development-20260413T090000Z.sqlite")).toBeInTheDocument();
  });
});

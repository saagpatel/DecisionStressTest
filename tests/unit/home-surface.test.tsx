import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { ProviderStatusStrip } from "@/features/decisions/components/provider-status-strip";
import { StarterExampleLinks } from "@/features/decisions/components/starter-example-links";
import { deriveProviderStatus } from "@/features/decisions/lib/provider-status";
import { starterExamples } from "@/features/decisions/lib/starter-examples";

describe("home surface panels", () => {
  test("renders provider visibility and starter examples", () => {
    render(
      <div>
        <ProviderStatusStrip
          status={deriveProviderStatus({
            provider: "mock",
            aiEnabled: false,
            issues: [],
          })}
        />
        <StarterExampleLinks examples={starterExamples} />
      </div>,
    );

    expect(screen.getByText("Mock mode", { exact: true })).toBeInTheDocument();
    expect(
      screen.getByText("Mock mode: deterministic local simulation. No OpenAI key required."),
    ).toBeInTheDocument();
    expect(screen.getByText("Career move with scope upside")).toBeInTheDocument();
    expect(screen.getByText("Workflow adoption decision")).toBeInTheDocument();
  });
});

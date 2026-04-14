import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { DecisionPageHeader } from "@/features/decisions/components/decision-page-header";

describe("decision page header", () => {
  test("renders back link, title, nav, summary, and action consistently", () => {
    render(
      <DecisionPageHeader
        backHref="/decisions"
        backLabel="← Back to decision history"
        eyebrow="Decision history"
        title="Launch the pilot"
        description="Review how the decision changed over time."
        action={<button type="button">Open memo</button>}
        nav={<nav aria-label="Decision navigation">nav</nav>}
        summary={<p>Summary strip</p>}
      />,
    );

    expect(screen.getByRole("link", { name: "← Back to decision history" })).toHaveAttribute("href", "/decisions");
    expect(screen.getByRole("heading", { name: "Launch the pilot" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Decision navigation" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open memo" })).toBeInTheDocument();
    expect(screen.getByText("Summary strip")).toBeInTheDocument();
  });
});

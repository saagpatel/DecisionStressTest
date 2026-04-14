import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

describe("decision route-state surfaces", () => {
  test("renders loading feedback for dynamic decision routes", async () => {
    const loadingModule = await import("@/app/decisions/loading");
    render(<loadingModule.default />);

    expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("heading", { name: "Loading decision view..." })).toBeInTheDocument();
  });

  test("renders retry-friendly route error copy", async () => {
    const errorModule = await import("@/app/decisions/error");
    const retry = vi.fn();
    render(<errorModule.default error={new Error("boom")} unstable_retry={retry} reset={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "This decision view did not load cleanly." })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try this route again" }));
    expect(retry).toHaveBeenCalled();
  });

  test("renders a route-level not-found message for missing decisions", async () => {
    const notFoundModule = await import("@/app/decisions/not-found");
    render(<notFoundModule.default />);

    expect(screen.getByRole("heading", { name: "That decision or snapshot is not available." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open decision ledger" })).toBeInTheDocument();
  });
});

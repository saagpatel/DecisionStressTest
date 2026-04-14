import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const assertLocalRequestMock = vi.fn();

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/security/local-access", () => ({
  assertLocalRequest: assertLocalRequestMock,
}));

describe("root layout safety", () => {
  test("awaits the local request guard before rendering", async () => {
    const layoutModule = await import("@/app/layout");
    const tree = await layoutModule.default({
      children: <div>child</div>,
    });
    render(tree);

    expect(assertLocalRequestMock).toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Skip to main content" })).toHaveAttribute("href", "#page-content");
  });

  test("marks the app as non-indexable", async () => {
    const layoutModule = await import("@/app/layout");

    expect(layoutModule.metadata.robots).toEqual({
      index: false,
      follow: false,
    });
  });
});

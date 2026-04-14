import { describe, expect, test } from "vitest";

import {
  findStarterExample,
  starterExamples,
} from "@/features/decisions/lib/starter-examples";

describe("starter examples", () => {
  test("ships exactly three starter examples", () => {
    expect(starterExamples).toHaveLength(3);
    expect(starterExamples.map((example) => example.id)).toEqual([
      "career",
      "project",
      "tool",
    ]);
  });

  test("returns valid decision-shaped presets", () => {
    for (const example of starterExamples) {
      expect(example.input.title.length).toBeGreaterThan(0);
      expect(example.input.constraints.length).toBeGreaterThan(0);
      expect(example.input.biggestKnownUncertainties.length).toBeGreaterThan(0);
    }
  });

  test("finds an example by id", () => {
    expect(findStarterExample("career")?.title).toContain("Career");
    expect(findStarterExample("unknown")).toBeNull();
  });
});

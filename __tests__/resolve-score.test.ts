import { describe, expect, it } from "vitest";
import { resolveScore } from "@/lib/resolve-score";
import { GOLDEN_PROPERTY, MINIMAL_PROPERTY } from "./fixtures/golden-property";

describe("resolveScore", () => {
  it("uses property score when available", () => {
    const result = resolveScore(GOLDEN_PROPERTY, 50);
    expect(result.score).toBe(50);
    expect(result.color).toBe("yellow");
    expect(result.label).toBe("Acceptable");
    expect(result.factors.length).toBeGreaterThan(0);
  });

  it("falls back to calculated score when property score is missing", () => {
    const result = resolveScore(GOLDEN_PROPERTY, null);
    expect(result.score).toBe(85);
    expect(result.color).toBe("green");
  });

  it("keeps one decimal when property score is fractional", () => {
    const result = resolveScore(MINIMAL_PROPERTY, 49.94);
    expect(result.score).toBe(49.9);
    expect(result.color).toBe("yellow");
  });
});

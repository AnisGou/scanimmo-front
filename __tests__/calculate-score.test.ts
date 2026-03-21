/**
 * __tests__/calculate-score.test.ts — Canary tests for scoring logic
 */
import { describe, it, expect } from "vitest";
import { calculateScore, extractDominante } from "@/lib/calculate-score";
import { scoreToPresentation, SCORE_SEUILS } from "@/lib/score-presentation";
import { GOLDEN_PROPERTY, MINIMAL_PROPERTY } from "./fixtures/golden-property";

describe("calculateScore", () => {
  it("golden property score = 85 (with zone Mc recognized)", () => {
    // 50 base + 15 (Mc=multi centre → favorable) + 10 (pente<5%) + 5 (no contam) + 5 (no flood) = 85
    const result = calculateScore(GOLDEN_PROPERTY);
    expect(result.score).toBe(85);
    expect(result.color).toBe("green");
    expect(result.label).toBe("Opportunit\u00e9");
  });

  it("score should be clamped between 0 and 100", () => {
    const worst = {
      ...MINIMAL_PROPERTY,
      contamination: true,
      zone_inondable: true,
      pente_moyenne_pct: 20,
      zonage: "I-001",
    };
    const result = calculateScore(worst);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("contamination should reduce score by 25 (false=+5, true=-20)", () => {
    const clean = { ...MINIMAL_PROPERTY, contamination: false };
    const dirty = { ...MINIMAL_PROPERTY, contamination: true };
    const scoreClean = calculateScore(clean).score;
    const scoreDirty = calculateScore(dirty).score;
    expect(scoreClean - scoreDirty).toBe(25);
  });

  it("factors should have at most 3 entries", () => {
    const result = calculateScore(GOLDEN_PROPERTY);
    expect(result.factors.length).toBeLessThanOrEqual(3);
  });
});

describe("contamination nullable", () => {
  it("null  -> contribution 0", () => {
    const base = calculateScore({ ...MINIMAL_PROPERTY }).score;
    const withNull = calculateScore({ ...MINIMAL_PROPERTY, contamination: null }).score;
    expect(withNull).toBe(base);
  });

  it("false -> contribution +5", () => {
    const base = calculateScore({ ...MINIMAL_PROPERTY }).score;          // contam=null -> 0
    const clean = calculateScore({ ...MINIMAL_PROPERTY, contamination: false }).score;
    expect(clean - base).toBe(5);
  });

  it("true  -> contribution -20", () => {
    const base = calculateScore({ ...MINIMAL_PROPERTY }).score;
    const dirty = calculateScore({ ...MINIMAL_PROPERTY, contamination: true }).score;
    expect(base - dirty).toBe(20);
  });
});

describe("extractDominante", () => {
  it('"33204Mc" -> "MC"',  () => expect(extractDominante("33204Mc")).toBe("MC"));
  it('"33204MC" -> "MC"',  () => expect(extractDominante("33204MC")).toBe("MC"));
  it('"H2"     -> "H"',   () => expect(extractDominante("H2")).toBe("H"));
  it('"CA3"    -> "CA"',  () => expect(extractDominante("CA3")).toBe("CA"));
  it('"33204"  -> null',  () => expect(extractDominante("33204")).toBeNull());
  it('null     -> null',  () => expect(extractDominante(null)).toBeNull());
  it('""       -> null',  () => expect(extractDominante("")).toBeNull());
});

describe("scoreToPresentation", () => {
  it("70 -> Opportunite / green",   () => expect(scoreToPresentation(70).color).toBe("green"));
  it("69.9 -> Acceptable / yellow", () => expect(scoreToPresentation(69.9).color).toBe("yellow"));
  it("40 -> Acceptable / yellow",   () => expect(scoreToPresentation(40).color).toBe("yellow"));
  it("39.9 -> Risque / red",        () => expect(scoreToPresentation(39.9).color).toBe("red"));
  it("0 -> Risque / red",           () => expect(scoreToPresentation(0).color).toBe("red"));
  it("100 -> Opportunite / green",  () => expect(scoreToPresentation(100).color).toBe("green"));
});

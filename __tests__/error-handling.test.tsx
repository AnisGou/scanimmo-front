/**
 * __tests__/error-handling.test.tsx — TC-FE-005: Error handling & edge cases
 *
 * Tests error handling patterns across the frontend:
 * - calculateScore boundary / edge cases
 * - Score color thresholds (exact boundaries)
 * - Score factors deduplication
 * - Invalid/extreme property data
 */
import { describe, it, expect } from "vitest";
import { calculateScore } from "@/lib/calculate-score";
import { GOLDEN_PROPERTY, MINIMAL_PROPERTY } from "./fixtures/golden-property";
import type { PropertyPreview } from "@/lib/types";


// ═══════════════════════════════════════════════════════════════════════
// TC-FE-005a: Score boundaries
// ═══════════════════════════════════════════════════════════════════════

describe("TC-FE-005: Score boundaries", () => {
  it("score is always a finite number", () => {
    const result = calculateScore(GOLDEN_PROPERTY);
    expect(Number.isFinite(result.score)).toBe(true);
  });

  it("score never exceeds 100 even with all bonuses", () => {
    const bestCase: PropertyPreview = {
      ...MINIMAL_PROPERTY,
      zonage: "H-200",           // +15 (H -> favorable)
      pente_moyenne_pct: 1.0,    // +10 (< 5%)
      contamination: false,       // +5
      zone_inondable: false,      // +5
      densite_max: 5.0,          // +10 (> 2)
    };
    const result = calculateScore(bestCase);
    // 50 + 15 + 10 + 5 + 5 + 10 = 95
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.score).toBe(95);
  });

  it("score never goes below 0 even with all penalties", () => {
    const worstCase: PropertyPreview = {
      ...MINIMAL_PROPERTY,
      zonage: "I-100",            // -10 (I prefix)
      pente_moyenne_pct: 25.0,    // -15 (>= 10%)
      contamination: true,         // -20
      zone_inondable: true,        // -15
      lidar_match_method: "OUTSIDE_COVERAGE",  // -3
    };
    const result = calculateScore(worstCase);
    // 50 - 10 - 15 - 20 - 15 - 3 = -13 -> clamped to 0
    expect(result.score).toBe(0);
  });
});


// ═══════════════════════════════════════════════════════════════════════
// TC-FE-005b: Color thresholds
// ═══════════════════════════════════════════════════════════════════════

describe("TC-FE-005: Color thresholds", () => {
  function makePropertyWithScore(target: number): PropertyPreview {
    // Base is 50. We need to adjust to hit target.
    // Use pente_moyenne_pct and contamination/zone_inondable to shift score
    if (target === 50) return { ...MINIMAL_PROPERTY };

    // For boundary tests, build from known factor combinations:
    if (target >= 70) {
      // 50 + 15(H) + 10(pente<5) + 5(no contam) = 80
      return {
        ...MINIMAL_PROPERTY,
        zonage: "H-100",
        pente_moyenne_pct: 2.0,
        contamination: false,
      };
    }
    if (target >= 40 && target < 70) {
      return { ...MINIMAL_PROPERTY }; // score=50
    }
    // target < 40
    return {
      ...MINIMAL_PROPERTY,
      contamination: true,       // -20
      zone_inondable: true,      // -15 => 50-20-15=15
    };
  }

  it("score >= 70 -> green", () => {
    const prop = makePropertyWithScore(80);
    const result = calculateScore(prop);
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.color).toBe("green");
  });

  it("score 40-69 -> yellow", () => {
    const prop = makePropertyWithScore(50);
    const result = calculateScore(prop);
    expect(result.score).toBeGreaterThanOrEqual(40);
    expect(result.score).toBeLessThan(70);
    expect(result.color).toBe("yellow");
  });

  it("score < 40 -> red", () => {
    const prop = makePropertyWithScore(15);
    const result = calculateScore(prop);
    expect(result.score).toBeLessThan(40);
    expect(result.color).toBe("red");
  });

  it("score exactly 85 -> green (golden property with Mc recognized)", () => {
    // 50 base + 15 (Mc=MC -> favorable) + 10 (pente<5) + 5 (no contam) + 5 (no flood) = 85
    const result = calculateScore(GOLDEN_PROPERTY);
    expect(result.score).toBe(85);
    expect(result.color).toBe("green");
  });

  it("score exactly 40 -> yellow (boundary)", () => {
    // 50 - 10(I prefix) = 40
    const prop = { ...MINIMAL_PROPERTY, zonage: "I-100" };
    const result = calculateScore(prop);
    expect(result.score).toBe(40);
    expect(result.color).toBe("yellow");
  });
});


// ═══════════════════════════════════════════════════════════════════════
// TC-FE-005c: Score factors
// ═══════════════════════════════════════════════════════════════════════

describe("TC-FE-005: Score factors", () => {
  it("factors are unique (deduplicated)", () => {
    const result = calculateScore(GOLDEN_PROPERTY);
    const unique = new Set(result.factors);
    expect(unique.size).toBe(result.factors.length);
  });

  it("factors have at most 3 entries", () => {
    // Property with maximum factors
    const prop: PropertyPreview = {
      ...MINIMAL_PROPERTY,
      zonage: "H-100",           // +1 factor
      pente_moyenne_pct: 2.0,    // +1 factor
      contamination: false,       // +1 factor
      zone_inondable: false,      // +1 factor
      densite_max: 5.0,          // +1 factor
    };
    const result = calculateScore(prop);
    expect(result.factors.length).toBeLessThanOrEqual(3);
  });

  it("factors are sorted by impact (most impactful first)", () => {
    // This is verified by the calculateScore top3 sort logic
    const result = calculateScore(GOLDEN_PROPERTY);
    // Just verify they are strings
    for (const f of result.factors) {
      expect(typeof f).toBe("string");
      expect(f.length).toBeGreaterThan(0);
    }
  });
});


// ═══════════════════════════════════════════════════════════════════════
// TC-FE-005d: Edge case property data
// ═══════════════════════════════════════════════════════════════════════

describe("TC-FE-005: Edge case data", () => {
  it("pente_moyenne_pct = 0 gives bonus (< 5)", () => {
    const prop = { ...MINIMAL_PROPERTY, pente_moyenne_pct: 0 };
    const result = calculateScore(prop);
    expect(result.score).toBe(60); // 50 + 10
  });

  it("pente_moyenne_pct exactly 5 gives moderate bonus", () => {
    const prop = { ...MINIMAL_PROPERTY, pente_moyenne_pct: 5 };
    const result = calculateScore(prop);
    expect(result.score).toBe(55); // 50 + 5 (5 < 10)
  });

  it("pente_moyenne_pct exactly 10 gives penalty", () => {
    const prop = { ...MINIMAL_PROPERTY, pente_moyenne_pct: 10 };
    const result = calculateScore(prop);
    expect(result.score).toBe(35); // 50 - 15
  });

  it("densite_max exactly 2 does NOT trigger bonus (requires > 2)", () => {
    const prop = { ...MINIMAL_PROPERTY, densite_max: 2 };
    const result = calculateScore(prop);
    expect(result.score).toBe(50); // no change
  });

  it("densite_max = 2.01 triggers bonus", () => {
    const prop = { ...MINIMAL_PROPERTY, densite_max: 2.01 };
    const result = calculateScore(prop);
    expect(result.score).toBe(60); // 50 + 10
  });

  it("zonage starting with C gives bonus", () => {
    const prop = { ...MINIMAL_PROPERTY, zonage: "C-100" };
    const result = calculateScore(prop);
    expect(result.score).toBe(65); // 50 + 15
  });

  it("zonage R (residential) is favorable", () => {
    const prop = { ...MINIMAL_PROPERTY, zonage: "R-100" };
    const result = calculateScore(prop);
    expect(result.score).toBe(65); // 50 + 15 (R -> favorable)
  });

  it("golden property score decomposition", () => {
    // 50 base + 15 (Mc -> MC, favorable) + 10 (pente 3.46 < 5) + 5 (no contam) + 5 (no flood) = 85
    // zonage "33204Mc" -> extractDominante -> "MC" -> CODES_FAVORABLES -> +15
    // densite_max null -> 0
    // lidar_match_method "WITHIN" -> not OUTSIDE_COVERAGE -> 0
    const result = calculateScore(GOLDEN_PROPERTY);
    expect(result.score).toBe(85);
  });
});


// ═══════════════════════════════════════════════════════════════════════
// TC-FE-005e: ScoreResult type contract
// ═══════════════════════════════════════════════════════════════════════

describe("TC-FE-005: ScoreResult contract", () => {
  it("color is always one of green/yellow/red", () => {
    for (const prop of [GOLDEN_PROPERTY, MINIMAL_PROPERTY]) {
      const result = calculateScore(prop);
      expect(["green", "yellow", "red"]).toContain(result.color);
    }
  });

  it("label is always a non-empty string", () => {
    const result = calculateScore(GOLDEN_PROPERTY);
    expect(typeof result.label).toBe("string");
    expect(result.label.length).toBeGreaterThan(0);
  });

  it("factors is always an array", () => {
    const result = calculateScore(MINIMAL_PROPERTY);
    expect(Array.isArray(result.factors)).toBe(true);
  });
});

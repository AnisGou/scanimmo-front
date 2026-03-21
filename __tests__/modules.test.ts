/**
 * __tests__/modules.test.ts — Tests modules & score-styles logic
 *
 * TC-FE-003: Module availability detection (adapted — no permis modal exists)
 * TC-PDF-005: Pricing tiers structure
 *
 * Original spec assumed a "permis modal" component that does not exist.
 * Tests adapted to cover the actual modules.ts and score-styles.ts logic.
 */
import { describe, it, expect } from "vitest";
import {
  getAvailableModules,
  countAvailableAnalyses,
  MODULE_LABELS,
  MODULE_DESCRIPTIONS,
  PRICING_TIERS,
} from "@/lib/modules";
import { scoreStyles } from "@/lib/score-styles";
import { GOLDEN_PROPERTY, MINIMAL_PROPERTY } from "./fixtures/golden-property";
import type { AvailableModules } from "@/lib/types";


// ═══════════════════════════════════════════════════════════════════════
// TC-FE-003: Module availability
// ═══════════════════════════════════════════════════════════════════════

describe("TC-FE-003: getAvailableModules", () => {
  it("golden property has zoning, lidar, contamination, flood", () => {
    const modules = getAvailableModules(GOLDEN_PROPERTY);
    expect(modules.zoning).toBe(true);
    expect(modules.lidar).toBe(true);
    expect(modules.contamination).toBe(true);
    expect(modules.flood).toBe(true);
  });

  it("golden property has no density or height (null in fixture)", () => {
    const modules = getAvailableModules(GOLDEN_PROPERTY);
    expect(modules.density).toBe(false);
    expect(modules.height).toBe(false);
  });

  it("minimal property has zero modules available", () => {
    const modules = getAvailableModules(MINIMAL_PROPERTY);
    const available = Object.values(modules).filter(Boolean).length;
    expect(available).toBe(0);
  });

  it("OUTSIDE_COVERAGE lidar method -> lidar=false", () => {
    const prop = { ...GOLDEN_PROPERTY, lidar_match_method: "OUTSIDE_COVERAGE" as const };
    const modules = getAvailableModules(prop);
    expect(modules.lidar).toBe(false);
  });

  it("null lidar method -> lidar=false", () => {
    const prop = { ...GOLDEN_PROPERTY, lidar_match_method: null };
    const modules = getAvailableModules(prop);
    expect(modules.lidar).toBe(false);
  });

  it("NEAREST_OK lidar method -> lidar=true", () => {
    const prop = { ...GOLDEN_PROPERTY, lidar_match_method: "NEAREST_OK" as const };
    const modules = getAvailableModules(prop);
    expect(modules.lidar).toBe(true);
  });

  it("returns all 6 module keys", () => {
    const modules = getAvailableModules(GOLDEN_PROPERTY);
    const keys = Object.keys(modules);
    expect(keys).toEqual(
      expect.arrayContaining(["zoning", "lidar", "contamination", "flood", "density", "height"])
    );
    expect(keys.length).toBe(6);
  });
});


describe("TC-FE-003: countAvailableAnalyses", () => {
  it("base count is 8 with zero modules", () => {
    const modules: AvailableModules = {
      zoning: false, lidar: false, contamination: false,
      flood: false, density: false, height: false,
    };
    expect(countAvailableAnalyses(modules)).toBe(8);
  });

  it("each module adds 3 analyses", () => {
    const zeroModules: AvailableModules = {
      zoning: false, lidar: false, contamination: false,
      flood: false, density: false, height: false,
    };
    const oneModule: AvailableModules = { ...zeroModules, zoning: true };
    expect(countAvailableAnalyses(oneModule) - countAvailableAnalyses(zeroModules)).toBe(3);
  });

  it("all modules = 8 + 6*3 = 26", () => {
    const all: AvailableModules = {
      zoning: true, lidar: true, contamination: true,
      flood: true, density: true, height: true,
    };
    expect(countAvailableAnalyses(all)).toBe(26);
  });

  it("golden property analysis count is consistent", () => {
    const modules = getAvailableModules(GOLDEN_PROPERTY);
    const count = countAvailableAnalyses(modules);
    // Golden: zoning=true, lidar=true, contamination=true, flood=true (4 modules) => 8 + 12 = 20
    expect(count).toBe(20);
  });
});


// ═══════════════════════════════════════════════════════════════════════
// TC-FE-003b: MODULE_LABELS & MODULE_DESCRIPTIONS completeness
// ═══════════════════════════════════════════════════════════════════════

describe("TC-FE-003b: MODULE_LABELS", () => {
  const expectedModules: (keyof AvailableModules)[] = [
    "zoning", "lidar", "contamination", "flood", "density", "height",
  ];

  it("has label for every module key", () => {
    for (const key of expectedModules) {
      expect(MODULE_LABELS[key]).toBeDefined();
      expect(typeof MODULE_LABELS[key]).toBe("string");
      expect(MODULE_LABELS[key].length).toBeGreaterThan(0);
    }
  });

  it("has description for every module key", () => {
    for (const key of expectedModules) {
      expect(MODULE_DESCRIPTIONS[key]).toBeDefined();
      expect(typeof MODULE_DESCRIPTIONS[key]).toBe("string");
      expect(MODULE_DESCRIPTIONS[key].length).toBeGreaterThan(0);
    }
  });
});


// ═══════════════════════════════════════════════════════════════════════
// TC-PDF-005: Pricing tiers
// ═══════════════════════════════════════════════════════════════════════

describe("TC-PDF-005: PRICING_TIERS", () => {
  it("has exactly 3 tiers", () => {
    expect(PRICING_TIERS.length).toBe(3);
  });

  it("tier IDs are essentiel, complet, promoteur", () => {
    const ids = PRICING_TIERS.map(t => t.id);
    expect(ids).toEqual(["essentiel", "complet", "promoteur"]);
  });

  it("prices are in ascending order (cents)", () => {
    const prices = PRICING_TIERS.map(t => t.price);
    expect(prices[0]).toBeLessThan(prices[1]);
    expect(prices[1]).toBeLessThan(prices[2]);
  });

  it("complet tier is marked popular", () => {
    const complet = PRICING_TIERS.find(t => t.id === "complet");
    expect(complet?.isPopular).toBe(true);
  });

  it("each tier has features array with at least 3 items", () => {
    for (const tier of PRICING_TIERS) {
      expect(tier.features.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("each tier has priceCAD string with $", () => {
    for (const tier of PRICING_TIERS) {
      expect(tier.priceCAD).toContain("$");
    }
  });
});


// ═══════════════════════════════════════════════════════════════════════
// TC-FE-003c: score-styles
// ═══════════════════════════════════════════════════════════════════════

describe("TC-FE-003c: scoreStyles", () => {
  it("has green, yellow, red keys", () => {
    expect(Object.keys(scoreStyles)).toEqual(
      expect.arrayContaining(["green", "yellow", "red"])
    );
  });

  it("each color has bg, bar, text, border, ring", () => {
    for (const color of ["green", "yellow", "red"] as const) {
      const s = scoreStyles[color];
      expect(s.bg).toBeDefined();
      expect(s.bar).toBeDefined();
      expect(s.text).toBeDefined();
      expect(s.border).toBeDefined();
      expect(s.ring).toBeDefined();
    }
  });

  it("no dynamic template strings (all classes are static Tailwind)", () => {
    for (const color of ["green", "yellow", "red"] as const) {
      const s = scoreStyles[color];
      for (const val of Object.values(s)) {
        // Static Tailwind classes should not contain ${ or backtick patterns
        expect(val).not.toContain("${");
        // All values should be valid Tailwind utility classes (e.g. "bg-green-50")
        expect(val).toMatch(/^[a-z]+-[a-z]+-\d+$/);
      }
    }
  });
});

/**
 * __tests__/null-display.test.ts — TC-NULL-003: Null/undefined display handling
 *
 * Verifies that all display paths handle null/undefined gracefully:
 * - formatNumber / formatCurrency -> "N/D"
 * - calculateScore with all-null property
 * - getAvailableModules with all-null property -> all false
 * - PropertyPreview nullable fields
 */
import { describe, it, expect } from "vitest";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { calculateScore } from "@/lib/calculate-score";
import { getAvailableModules, countAvailableAnalyses } from "@/lib/modules";
import { MINIMAL_PROPERTY } from "./fixtures/golden-property";


// ═══════════════════════════════════════════════════════════════════════
// TC-NULL-003a: formatNumber null handling
// ═══════════════════════════════════════════════════════════════════════

describe("TC-NULL-003: formatNumber null handling", () => {
  it("null returns 'N/D'", () => {
    expect(formatNumber(null)).toBe("N/D");
  });

  it("undefined returns 'N/D'", () => {
    expect(formatNumber(undefined)).toBe("N/D");
  });

  it("0 returns '0' (not N/D — falsy but valid)", () => {
    const result = formatNumber(0);
    expect(result).toBe("0");
    expect(result).not.toBe("N/D");
  });

  it("negative number formats correctly", () => {
    const result = formatNumber(-1234);
    expect(result).toContain("1");
    expect(result).toContain("234");
  });

  it("large number uses fr-CA grouping", () => {
    const result = formatNumber(37450000);
    // fr-CA uses thin space or space as separator
    expect(result.replace(/\s/g, "")).toBe("37450000");
  });
});


// ═══════════════════════════════════════════════════════════════════════
// TC-NULL-003b: formatCurrency null handling
// ═══════════════════════════════════════════════════════════════════════

describe("TC-NULL-003: formatCurrency null handling", () => {
  it("null returns 'N/D'", () => {
    expect(formatCurrency(null)).toBe("N/D");
  });

  it("undefined returns 'N/D'", () => {
    expect(formatCurrency(undefined)).toBe("N/D");
  });

  it("0 returns a currency string (not N/D)", () => {
    const result = formatCurrency(0);
    expect(result).not.toBe("N/D");
    expect(result).toContain("$");
  });

  it("valid amount includes $ and formatted number", () => {
    const result = formatCurrency(37450000);
    expect(result).toContain("$");
    // Should contain the digits
    expect(result.replace(/[^0-9]/g, "")).toBe("37450000");
  });
});


// ═══════════════════════════════════════════════════════════════════════
// TC-NULL-003c: calculateScore with all-null property
// ═══════════════════════════════════════════════════════════════════════

describe("TC-NULL-003: calculateScore null safety", () => {
  it("minimal (all-null) property produces valid score", () => {
    const result = calculateScore(MINIMAL_PROPERTY);
    expect(typeof result.score).toBe("number");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("minimal property score is base 50 (no modifiers)", () => {
    // All nullable fields are null -> no adjustments applied
    const result = calculateScore(MINIMAL_PROPERTY);
    expect(result.score).toBe(50);
  });

  it("minimal property color is yellow (50 is between 40-69)", () => {
    const result = calculateScore(MINIMAL_PROPERTY);
    expect(result.color).toBe("yellow");
  });

  it("minimal property has no factors (nothing triggered)", () => {
    const result = calculateScore(MINIMAL_PROPERTY);
    expect(result.factors.length).toBe(0);
  });

  it("minimal property has valid label and emoji", () => {
    const result = calculateScore(MINIMAL_PROPERTY);
    expect(result.label).toBeTruthy();
    expect(result.emoji).toBeTruthy();
  });

  it("score result always has all required fields", () => {
    const result = calculateScore(MINIMAL_PROPERTY);
    expect(result).toHaveProperty("score");
    expect(result).toHaveProperty("factors");
    expect(result).toHaveProperty("color");
    expect(result).toHaveProperty("emoji");
    expect(result).toHaveProperty("label");
  });
});


// ═══════════════════════════════════════════════════════════════════════
// TC-NULL-003d: getAvailableModules null safety
// ═══════════════════════════════════════════════════════════════════════

describe("TC-NULL-003: getAvailableModules null safety", () => {
  it("all-null property returns all modules false", () => {
    const modules = getAvailableModules(MINIMAL_PROPERTY);
    for (const [key, value] of Object.entries(modules)) {
      expect(value).toBe(false);
    }
  });

  it("all-null modules count = base 8", () => {
    const modules = getAvailableModules(MINIMAL_PROPERTY);
    expect(countAvailableAnalyses(modules)).toBe(8);
  });

  it("single non-null field enables only that module", () => {
    const withZoning = { ...MINIMAL_PROPERTY, zonage: "H-100" };
    const modules = getAvailableModules(withZoning);
    expect(modules.zoning).toBe(true);
    expect(modules.lidar).toBe(false);
    expect(modules.contamination).toBe(false);
  });
});


// ═══════════════════════════════════════════════════════════════════════
// TC-NULL-003e: PropertyPreview nullable fields contract
// ═══════════════════════════════════════════════════════════════════════

describe("TC-NULL-003: PropertyPreview nullable fields", () => {
  const nullableFields = [
    "latitude", "longitude", "zonage", "superficie",
    "evaluation_fonciere", "pente_moyenne_pct",
    "lidar_match_method", "lidar_match_distance_m",
    "contamination", "zone_inondable", "densite_max", "hauteur_max",
  ] as const;

  it("MINIMAL_PROPERTY has all nullable fields as null", () => {
    for (const field of nullableFields) {
      expect(MINIMAL_PROPERTY[field]).toBeNull();
    }
  });

  it("MINIMAL_PROPERTY required string fields are non-null", () => {
    expect(MINIMAL_PROPERTY.id).toBeTruthy();
    expect(MINIMAL_PROPERTY.matricule).toBeTruthy();
    expect(MINIMAL_PROPERTY.adresse).toBeTruthy();
    expect(MINIMAL_PROPERTY.municipalite).toBeTruthy();
    expect(MINIMAL_PROPERTY.code_municipalite).toBeTruthy();
  });
});

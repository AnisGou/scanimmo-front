/**
 * __tests__/utils.test.ts — Canary tests for utility functions
 */
import { describe, it, expect } from "vitest";
import { formatNumber, formatCurrency } from "@/lib/utils";

describe("formatNumber", () => {
  it("should format large numbers with fr-CA grouping", () => {
    const result = formatNumber(37450000);
    // fr-CA uses non-breaking space as thousands separator
    expect(result).toContain("37");
    expect(result).toContain("450");
    expect(result).toContain("000");
  });

  it("should return N/D for null", () => {
    expect(formatNumber(null)).toBe("N/D");
    expect(formatNumber(undefined)).toBe("N/D");
  });
});

describe("formatCurrency", () => {
  it("should format as CAD currency", () => {
    const result = formatCurrency(37450000);
    expect(result).toContain("$");
    expect(result).toContain("37");
  });

  it("should return N/D for null", () => {
    expect(formatCurrency(null)).toBe("N/D");
  });
});

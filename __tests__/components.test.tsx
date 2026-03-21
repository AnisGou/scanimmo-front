/**
 * __tests__/components.test.tsx — Tests pure display components
 *
 * TC-FE-001: ScoreCard renders score, factors, colors correctly
 * TC-FE-002: LidarStatus renders correct messages per method
 * TC-FE-001b: TrustBlock renders trust indicators
 * TC-FE-002b: SourcesDisclaimer renders sources with/without LiDAR
 *
 * Adapted from original tabs.test.tsx spec — no tab components exist
 * in this codebase. Tests cover the pure display components instead.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { ScoreCard } from "@/components/ScoreCard";
import { LidarStatus } from "@/components/LidarStatus";
import { TrustBlock } from "@/components/TrustBlock";
import { SourcesDisclaimer } from "@/components/SourcesDisclaimer";
import { scoreStyles } from "@/lib/score-styles";


// ═══════════════════════════════════════════════════════════════════════
// TC-FE-001: ScoreCard
// ═══════════════════════════════════════════════════════════════════════

describe("TC-FE-001: ScoreCard", () => {
  const greenProps = {
    score: 75,
    factors: ["Pente faible", "Hors zone inondable", "Zonage favorable"],
    color: "green" as const,
    emoji: "\uD83D\uDFE2",
    label: "Projet favorable",
  };

  it("renders score with /100 format", () => {
    render(<ScoreCard {...greenProps} />);
    expect(screen.getByText("75/100")).toBeInTheDocument();
  });

  it("renders label text", () => {
    render(<ScoreCard {...greenProps} />);
    expect(screen.getByText("Projet favorable")).toBeInTheDocument();
  });

  it("renders emoji", () => {
    render(<ScoreCard {...greenProps} />);
    expect(screen.getByText("\uD83D\uDFE2")).toBeInTheDocument();
  });

  it("renders all factors in 'Pourquoi ce score?' section", () => {
    render(<ScoreCard {...greenProps} />);
    expect(screen.getByText("Pourquoi ce score?")).toBeInTheDocument();
    expect(screen.getByText("Pente faible")).toBeInTheDocument();
    expect(screen.getByText("Hors zone inondable")).toBeInTheDocument();
    expect(screen.getByText("Zonage favorable")).toBeInTheDocument();
  });

  it("hides factors section when no factors provided", () => {
    render(<ScoreCard {...greenProps} factors={[]} />);
    expect(screen.queryByText("Pourquoi ce score?")).not.toBeInTheDocument();
  });

  it("renders disclaimer text", () => {
    render(<ScoreCard {...greenProps} />);
    expect(screen.getByText(/score est indicatif/)).toBeInTheDocument();
  });

  it("applies green styles for green color", () => {
    const { container } = render(<ScoreCard {...greenProps} />);
    const card = container.firstElementChild!;
    expect(card.className).toContain(scoreStyles.green.border);
    expect(card.className).toContain(scoreStyles.green.bg);
  });

  it("applies yellow styles for yellow color", () => {
    const yellowProps = { ...greenProps, color: "yellow" as const, score: 50 };
    const { container } = render(<ScoreCard {...yellowProps} />);
    const card = container.firstElementChild!;
    expect(card.className).toContain(scoreStyles.yellow.border);
    expect(card.className).toContain(scoreStyles.yellow.bg);
  });

  it("applies red styles for red color", () => {
    const redProps = { ...greenProps, color: "red" as const, score: 20 };
    const { container } = render(<ScoreCard {...redProps} />);
    const card = container.firstElementChild!;
    expect(card.className).toContain(scoreStyles.red.border);
    expect(card.className).toContain(scoreStyles.red.bg);
  });

  it("renders progress bar with correct width", () => {
    const { container } = render(<ScoreCard {...greenProps} />);
    const bar = container.querySelector("[style*='width']") as HTMLElement;
    expect(bar).not.toBeNull();
    expect(bar.style.width).toBe("75%");
  });
});


// ═══════════════════════════════════════════════════════════════════════
// TC-FE-002: LidarStatus
// ═══════════════════════════════════════════════════════════════════════

describe("TC-FE-002: LidarStatus", () => {
  it("WITHIN: shows haute precision message in green", () => {
    const { container } = render(<LidarStatus method="WITHIN" />);
    expect(screen.getByText(/haute pr.cision/i)).toBeInTheDocument();
    // Green background
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain("bg-green-50");
  });

  it("NEAREST_OK: shows LiDAR incluse message", () => {
    render(<LidarStatus method="NEAREST_OK" />);
    expect(screen.getByText(/LiDAR incluse/i)).toBeInTheDocument();
    expect(screen.getByText(/tuile.*proche/i)).toBeInTheDocument();
  });

  it("NEAREST_OK with distance: shows rounded distance", () => {
    render(<LidarStatus method="NEAREST_OK" distance={42.7} />);
    expect(screen.getByText(/43m/)).toBeInTheDocument();
  });

  it("NEAREST_OK distance=0: uses typeof check (not falsy)", () => {
    render(<LidarStatus method="NEAREST_OK" distance={0} />);
    // distance=0 should show "(0m)" because typeof 0 === "number"
    expect(screen.getByText(/0m/)).toBeInTheDocument();
  });

  it("OUTSIDE_COVERAGE: shows info block in blue", () => {
    const { container } = render(<LidarStatus method="OUTSIDE_COVERAGE" />);
    expect(screen.getByText(/non disponible/i)).toBeInTheDocument();
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain("bg-blue-50");
  });

  it("OUTSIDE_COVERAGE: still mentions reglementaire and contamination", () => {
    render(<LidarStatus method="OUTSIDE_COVERAGE" />);
    expect(screen.getByText(/r.glementaire.*incluse/i)).toBeInTheDocument();
    expect(screen.getByText(/contamination.*incluse/i)).toBeInTheDocument();
  });

  it("null method: shows OUTSIDE_COVERAGE fallback", () => {
    const { container } = render(<LidarStatus method={null as any} />);
    expect(screen.getByText(/non disponible/i)).toBeInTheDocument();
    expect(container.firstElementChild!.className).toContain("bg-blue-50");
  });
});


// ═══════════════════════════════════════════════════════════════════════
// TC-FE-001b: TrustBlock
// ═══════════════════════════════════════════════════════════════════════

describe("TC-FE-001b: TrustBlock", () => {
  it("renders 3 trust indicators", () => {
    render(<TrustBlock />);
    expect(screen.getByText(/Paiement s.curis. Stripe/)).toBeInTheDocument();
    expect(screen.getByText(/PDF disponible 30 jours/)).toBeInTheDocument();
    expect(screen.getByText(/Rembours. 24h/)).toBeInTheDocument();
  });
});


// ═══════════════════════════════════════════════════════════════════════
// TC-FE-002b: SourcesDisclaimer
// ═══════════════════════════════════════════════════════════════════════

describe("TC-FE-002b: SourcesDisclaimer", () => {
  it("renders municipality name", () => {
    render(<SourcesDisclaimer hasLidar={false} municipality="Quebec" />);
    expect(screen.getByText(/Quebec/)).toBeInTheDocument();
  });

  it("shows LiDAR in sources when available", () => {
    render(<SourcesDisclaimer hasLidar={true} municipality="Quebec" />);
    expect(screen.getByText(/LiDAR/)).toBeInTheDocument();
  });

  it("omits LiDAR from sources when unavailable", () => {
    const { container } = render(<SourcesDisclaimer hasLidar={false} municipality="Montreal" />);
    // The text "LiDAR" should not appear standalone (Donnees ouvertes Quebec is present)
    const sourcesParagraph = container.querySelector("p")!;
    expect(sourcesParagraph.textContent).not.toContain("LiDAR");
  });

  it("includes professional disclaimer", () => {
    render(<SourcesDisclaimer hasLidar={false} municipality="Quebec" />);
    expect(screen.getByText(/ne constituent pas un avis professionnel/)).toBeInTheDocument();
  });
});

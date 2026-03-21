/**
 * SOURCE UNIQUE DE VERITE — presentation visuelle du score
 * Seuils alignes sur regles_rapport.py:55-56 (backend)
 * Importe par : page.tsx (score DB) + calculate-score.ts (fallback)
 */

export interface ScorePresentation {
  color: "green" | "yellow" | "red";
  emoji: string;
  label: string;
}

export const SCORE_SEUILS = { OPPORTUNITE: 70, ACCEPTABLE: 40 } as const;

export function scoreToPresentation(score: number): ScorePresentation {
  if (score >= SCORE_SEUILS.OPPORTUNITE) {
    return { color: "green", emoji: "\u{1F7E2}", label: "Opportunit\u00e9" };
  }
  if (score >= SCORE_SEUILS.ACCEPTABLE) {
    return { color: "yellow", emoji: "\u{1F7E1}", label: "Acceptable" };
  }
  return { color: "red", emoji: "\u{1F534}", label: "Risque" };
}

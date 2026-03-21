import type { PropertyPreview, ScoreResult } from "./types";
import { calculateScore } from "./calculate-score";
import { scoreToPresentation } from "./score-presentation";

export function resolveScore(
  preview: PropertyPreview,
  propertyScore: number | null | undefined,
): ScoreResult {
  const fallback = calculateScore(preview);

  if (propertyScore == null || !Number.isFinite(propertyScore)) {
    return fallback;
  }

  const normalized = Math.round(propertyScore * 10) / 10;
  const presentation = scoreToPresentation(normalized);

  return {
    score: normalized,
    factors: fallback.factors,
    color: presentation.color,
    emoji: presentation.emoji,
    label: presentation.label,
  };
}

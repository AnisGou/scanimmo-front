/**
 * Logique de Calcul du Score
 * @description Analyse de faisabilite basee sur les donnees disponibles
 *
 * Seuils alignes sur regles_rapport.py:55-56 via scoreToPresentation().
 */

import type { PropertyPreview, ScoreResult } from "./types";
import { scoreToPresentation } from "./score-presentation";

type Factor = { text: string; impact: number };

// ── Constantes de module — codes de zonage favorables/defavorables ────
// Habitation, mixte residentiel, commercial
const CODES_FAVORABLES = new Set([
  "H", "HA", "HB", "HC", "HD",
  "M", "MA", "MB", "MC", "MR", "MX", "MH",
  "C", "CA", "CB", "CE", "CG", "CR",
  "R", "RA", "RB", "RC", "RD",
]);

// Industriel
const CODES_DEFAVORABLES = new Set([
  "I", "IA", "IB", "IC", "IL", "IM",
]);

/**
 * Extrait la dominante de zonage depuis un code zone brut.
 * Formats supportes :
 *   - Ville de Quebec : numerique + suffixe lettres  "33204Mc" -> "MC"
 *   - Autres villes   : prefixe lettres + chiffres   "H2", "CA3" -> "H", "CA"
 *   - Numerique pur   : "33204" -> null
 */
export function extractDominante(code: string | null | undefined): string | null {
  if (!code) return null;

  // Format Ville de Quebec : chiffres en tete, lettres en fin
  const numericPrefixMatch = code.match(/^\d+([A-Za-z]+)$/);
  if (numericPrefixMatch) return numericPrefixMatch[1].toUpperCase();

  // Autres villes : lettres en tete
  const letterPrefixMatch = code.match(/^([A-Za-z]+)/);
  if (letterPrefixMatch) return letterPrefixMatch[1].toUpperCase();

  return null;
}

export function calculateScore(data: PropertyPreview): ScoreResult {
  let score = 50; // Score de base neutre
  const factors: Factor[] = [];

  // ========================================================================
  // ZONAGE (+15 ou -10)
  // Priorite 1: champ qc_dominante (DB). Priorite 2: extraction depuis zone_code.
  // ========================================================================
  const dom = (data.zonage_dominante ?? extractDominante(data.zonage))?.toUpperCase() ?? null;

  if (dom !== null && CODES_FAVORABLES.has(dom)) {
    score += 15;
    factors.push({ text: "Zonage favorable", impact: 15 });
  } else if (dom !== null && CODES_DEFAVORABLES.has(dom)) {
    score -= 10;
    factors.push({ text: "Zonage industriel", impact: 10 });
  }

  // ========================================================================
  // PENTE (donnees LiDAR)
  // ========================================================================
  if (data.pente_moyenne_pct !== null) {
    if (data.pente_moyenne_pct < 5) {
      score += 10;
      factors.push({ text: "Pente faible", impact: 10 });
    } else if (data.pente_moyenne_pct < 10) {
      score += 5;
      factors.push({ text: "Pente mod\u00e9r\u00e9e", impact: 5 });
    } else {
      score -= 15;
      factors.push({ text: "Pente forte", impact: 15 });
    }
  }

  // ========================================================================
  // LiDAR INDISPONIBLE (-3)
  // ========================================================================
  if (data.lidar_match_method === "OUTSIDE_COVERAGE") {
    score -= 3;
    factors.push({ text: "Donn\u00e9e pente indisponible", impact: 3 });
  }

  // ========================================================================
  // CONTAMINATION (-20 / +5 / 0 si null)
  // null = donnee non disponible -> contribution 0 (neutre)
  // ========================================================================
  if (data.contamination === true) {
    score -= 20;
    factors.push({ text: "Site r\u00e9pertori\u00e9 \u00e0 proximit\u00e9", impact: 20 });
  } else if (data.contamination === false) {
    score += 5;
    factors.push({
      text: "Aucun site r\u00e9pertori\u00e9 dans les donn\u00e9es publiques",
      impact: 5
    });
  }
  // contamination === null -> aucune branche -> contribution = 0

  // ========================================================================
  // ZONE INONDABLE (-15 / +5 / 0 si null)
  // ========================================================================
  if (data.zone_inondable === true) {
    score -= 15;
    factors.push({ text: "Zone inondable identifi\u00e9e", impact: 15 });
  } else if (data.zone_inondable === false) {
    score += 5;
    factors.push({ text: "Hors zone inondable r\u00e9pertori\u00e9e", impact: 5 });
  }

  // ========================================================================
  // DENSITE ELEVEE (+10)
  // ========================================================================
  if (data.densite_max != null && data.densite_max > 2) {
    score += 10;
    factors.push({ text: "Densit\u00e9 \u00e9lev\u00e9e permise", impact: 10 });
  }

  // ========================================================================
  // CLAMP 0-100
  // ========================================================================
  score = Math.max(0, Math.min(100, score));

  // ========================================================================
  // TOP 3 FACTEURS (tries par impact decroissant)
  // ========================================================================
  const topFactors = Array.from(new Set(
    factors
      .sort((a, b) => b.impact - a.impact)
      .map(f => f.text)
  )).slice(0, 3);

  // ========================================================================
  // INTERPRETATION — seuils delegues a scoreToPresentation()
  // ========================================================================
  const pres = scoreToPresentation(score);

  return {
    score,
    factors: topFactors,
    color: pres.color,
    emoji: pres.emoji,
    label: pres.label,
  };
}

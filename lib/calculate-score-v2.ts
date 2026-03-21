/**
 * Logique de Calcul du Score V2
 * @description Score amélioré avec plus de diversité
 */

import type { PropertyPreview, ScoreResult } from "./types";

type Factor = { text: string; impact: number };

export function calculateScore(data: PropertyPreview): ScoreResult {
  let score = 50;
  const factors: Factor[] = [];

  // ========================================================================
  // ZONAGE (variable selon le code)
  // ========================================================================
  if (data.zonage) {
    const zone = data.zonage.toUpperCase();

    // Zonages résidentiels favorables
    if (zone.startsWith("H") || zone.startsWith("R")) {
      score += 15;
      factors.push({ text: "Zonage résidentiel favorable", impact: 15 });
    }
    // Zonages commerciaux
    else if (zone.startsWith("C")) {
      score += 12;
      factors.push({ text: "Zonage commercial", impact: 12 });
    }
    // Zonages mixtes
    else if (zone.startsWith("M")) {
      score += 10;
      factors.push({ text: "Zonage mixte", impact: 10 });
    }
    // Zonages industriels
    else if (zone.startsWith("I")) {
      score -= 10;
      factors.push({ text: "Zonage industriel", impact: 10 });
    }
    // Zonages non-standards (comme 66xxx)
    else {
      score += 5;
      factors.push({ text: "Zonage spécifique", impact: 5 });
    }
  }

  // ========================================================================
  // SUPERFICIE (important pour potentiel)
  // ========================================================================
  if (data.superficie) {
    if (data.superficie >= 10000) {
      score += 15;
      factors.push({ text: "Grande superficie (10000+ mètres carrés)", impact: 15 });
    } else if (data.superficie >= 5000) {
      score += 10;
      factors.push({ text: "Bonne superficie (5000+ mètres carrés)", impact: 10 });
    } else if (data.superficie >= 2000) {
      score += 5;
      factors.push({ text: "Superficie moyenne (2000+ mètres carrés)", impact: 5 });
    } else if (data.superficie < 1000) {
      score -= 5;
      factors.push({ text: "Petite superficie (< 1000 mètres carrés)", impact: 5 });
    }
  }

  // ========================================================================
  // PENTE (données LiDAR si disponibles)
  // ========================================================================
  if (data.pente_moyenne_pct !== null) {
    if (data.pente_moyenne_pct < 5) {
      score += 10;
      factors.push({ text: "Terrain plat (pente < 5%)", impact: 10 });
    } else if (data.pente_moyenne_pct < 10) {
      score += 5;
      factors.push({ text: "Pente modérée (5-10%)", impact: 5 });
    } else if (data.pente_moyenne_pct < 15) {
      score -= 5;
      factors.push({ text: "Pente notable (10-15%)", impact: 5 });
    } else {
      score -= 15;
      factors.push({ text: "Pente forte (> 15%)", impact: 15 });
    }
  }

  // ========================================================================
  // LiDAR INDISPONIBLE (pénalité légère)
  // ========================================================================
  if (data.lidar_match_method === "OUTSIDE_COVERAGE") {
    score -= 3;
    factors.push({ text: "Données topographiques limitées", impact: 3 });
  } else if (data.lidar_match_method === "WITHIN") {
    score += 3;
    factors.push({ text: "Données topographiques précises", impact: 3 });
  }

  // ========================================================================
  // CONTAMINATION
  // ========================================================================
  if (data.contamination === true) {
    score -= 20;
    factors.push({ text: "Site contaminé répertorié", impact: 20 });
  } else if (data.contamination === false) {
    score += 5;
    factors.push({ text: "Aucun site contaminé répertorié", impact: 5 });
  }

  // ========================================================================
  // ZONE INONDABLE
  // ========================================================================
  if (data.zone_inondable === true) {
    score -= 15;
    factors.push({ text: "Zone inondable 0-20 ans", impact: 15 });
  } else if (data.zone_inondable === false) {
    score += 5;
    factors.push({ text: "Hors zone inondable", impact: 5 });
  }

  // ========================================================================
  // DENSITÉ (cos_max)
  // ========================================================================
  if (data.densite_max !== null) {
    if (data.densite_max >= 3) {
      score += 15;
      factors.push({ text: "Haute densité autorisée (COS ≥ 3)", impact: 15 });
    } else if (data.densite_max >= 2) {
      score += 10;
      factors.push({ text: "Bonne densité autorisée (COS ≥ 2)", impact: 10 });
    } else if (data.densite_max >= 1) {
      score += 5;
      factors.push({ text: "Densité moyenne (COS ≥ 1)", impact: 5 });
    } else {
      score -= 5;
      factors.push({ text: "Faible densité (COS < 1)", impact: 5 });
    }
  }

  // ========================================================================
  // HAUTEUR
  // ========================================================================
  if (data.hauteur_max !== null) {
    if (data.hauteur_max >= 15) {
      score += 10;
      factors.push({ text: "Hauteur élevée permise (≥ 15m)", impact: 10 });
    } else if (data.hauteur_max >= 10) {
      score += 5;
      factors.push({ text: "Hauteur moyenne permise (≥ 10m)", impact: 5 });
    } else if (data.hauteur_max < 8) {
      score -= 5;
      factors.push({ text: "Hauteur limitée (< 8m)", impact: 5 });
    }
  }

  // ========================================================================
  // VALEUR FONCIÈRE (relatif au potentiel)
  // ========================================================================
  if (data.evaluation_fonciere && data.superficie) {
    const prixM2 = data.evaluation_fonciere / data.superficie;

    if (prixM2 < 50) {
      score += 8;
      factors.push({ text: "Prix au mètres carrés avantageux (< 50$/mètres carrés)", impact: 8 });
    } else if (prixM2 > 200) {
      score -= 8;
      factors.push({ text: "Prix au mètres carrés élevé (> 200$/mètres carrés)", impact: 8 });
    }
  }

  // ========================================================================
  // CLAMP 0-100
  // ========================================================================
  score = Math.max(0, Math.min(100, score));

  // ========================================================================
  // TOP 3 FACTEURS
  // ========================================================================
  const topFactors = Array.from(new Set(
    factors
      .sort((a, b) => b.impact - a.impact)
      .map(f => f.text)
  )).slice(0, 3);

  // ========================================================================
  // INTERPRÉTATION
  // ========================================================================
  let color: "green" | "yellow" | "red";
  let emoji: string;
  let label: string;

  if (score >= 70) {
    color = "green";
    emoji = "🟢";
    label = "Potentiel constructible élevé";
  } else if (score >= 50) {
    color = "yellow";
    emoji = "🟡";
    label = "Potentiel modéré avec contraintes";
  } else {
    color = "red";
    emoji = "🔴";
    label = "Potentiel limité";
  }

  return {
    score,
    factors: topFactors,
    color,
    emoji,
    label
  };
}

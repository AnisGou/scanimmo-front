/**
 * Composant LidarStatus
 * @description Affiche le statut de disponibilité des données LiDAR
 *
 * Props: method: LidarMethod, distance?: number
 *
 * Messages:
 * - WITHIN: "✓ Analyse terrain LiDAR haute précision incluse" (vert)
 * - NEAREST_OK: "✓ Analyse terrain LiDAR incluse (estimé à partir de la tuile la plus proche)" (vert)
 *   + si distance: afficher "(Xm)" avec typeof distance === "number" (pas distance &&)
 * - OUTSIDE_COVERAGE: bloc bleu info
 */

import type { LidarMethod } from "@/lib/types";

interface LidarStatusProps {
  method: LidarMethod;
  distance?: number | null;
}

export function LidarStatus({ method, distance }: LidarStatusProps) {
  // Aucune donnée LiDAR
  if (!method || method === "OUTSIDE_COVERAGE") {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <span className="text-2xl">ℹ️</span>
          <div className="flex-1">
            <p className="font-semibold text-blue-900 mb-2">
              LiDAR non disponible pour ce secteur
            </p>
            <ul className="space-y-1 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">✓</span>
                <span>Analyse réglementaire complète incluse</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">✓</span>
                <span>Vérification contamination incluse</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // LiDAR disponible
  const isHighPrecision = method === "WITHIN";
  const distanceText = typeof distance === "number" ? ` (${Math.round(distance)}m)` : "";

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-start gap-2">
        <span className="text-green-600 mt-0.5 font-bold">✓</span>
        <div>
          <p className="text-sm font-semibold text-green-900">
            {isHighPrecision
              ? "Analyse terrain LiDAR haute précision incluse"
              : `Analyse terrain LiDAR incluse${distanceText}`}
          </p>
          {!isHighPrecision && (
            <p className="text-xs text-green-700 mt-1">
              Estimé à partir de la tuile LiDAR la plus proche
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

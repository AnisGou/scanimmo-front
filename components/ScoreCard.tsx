/**
 * Composant ScoreCard
 * @description Affiche le score de faisabilité avec barre de progression
 *
 * Props: score: number, factors: string[], color: ScoreColor
 *
 * Affiche:
 * - Score X/100 avec barre de progression
 * - Emoji + label ("🟢 Projet favorable")
 * - Section "Pourquoi ce score?" avec les 3 facteurs
 *
 * ⚠️ UTILISER scoreStyles[color].bg, etc. (pas de template strings)
 */

import { scoreStyles, type ScoreColor } from "@/lib/score-styles";

interface ScoreCardProps {
  score: number;
  factors: string[];
  color: ScoreColor;
  emoji: string;
  label: string;
}

export function ScoreCard({ score, factors, color, emoji, label }: ScoreCardProps) {
  const styles = scoreStyles[color];

  return (
    <div className={`rounded-lg border-2 ${styles.border} ${styles.bg} p-6`}>
      {/* En-tête avec score */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-4xl font-bold flex items-center gap-2">
            <span>{emoji}</span>
            <span className={styles.text}>{score}/100</span>
          </div>
          <p className={`text-sm font-medium mt-1 ${styles.text}`}>
            {label}
          </p>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
        <div
          className={`${styles.bar} h-3 rounded-full transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Facteurs explicatifs */}
      {factors.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-300">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            Pourquoi ce score?
          </p>
          <ul className="space-y-1">
            {factors.map((factor, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-500 mt-4 italic">
        Ce score est indicatif et basé sur les données publiques disponibles.
        Le rapport PDF inclut une analyse détaillée.
      </p>
    </div>
  );
}

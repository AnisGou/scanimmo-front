/**
 * Styles Tailwind pour le Score
 * @description Classes statiques (JAMAIS de template strings)
 *
 * ⚠️ CRITIQUE: Ne JAMAIS utiliser bg-${color}-50
 * Tailwind ne compile pas les classes dynamiques.
 */

export const scoreStyles = {
  green: {
    bg: "bg-green-50",
    bar: "bg-green-500",
    text: "text-green-700",
    border: "border-green-200",
    ring: "ring-green-500"
  },
  yellow: {
    bg: "bg-yellow-50",
    bar: "bg-yellow-500",
    text: "text-yellow-700",
    border: "border-yellow-200",
    ring: "ring-yellow-500"
  },
  red: {
    bg: "bg-red-50",
    bar: "bg-red-500",
    text: "text-red-700",
    border: "border-red-200",
    ring: "ring-red-500"
  },
} as const;

export type ScoreColor = keyof typeof scoreStyles;

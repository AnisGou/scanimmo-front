/**
 * Utilitaires généraux
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return "N/D";
  return new Intl.NumberFormat("fr-CA").format(num);
}

export function formatCurrency(num: number | null | undefined): string {
  if (num === null || num === undefined) return "N/D";
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/** Extract municipality name from address like "1616 Rue Sud, Drummondville, QC" */
export function extractMunicipality(adresse: string | null): string {
  if (!adresse) return "Québec";
  const parts = adresse.split(",").map(s => s.trim());
  if (parts.length >= 2) {
    const candidate = parts[parts.length - 2] || parts[parts.length - 1];
    if (candidate && candidate !== "QC" && candidate !== "Qc") return candidate;
  }
  return "Québec";
}

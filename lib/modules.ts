/**
 * Logique des Modules Disponibles
 * @description Détermine quels modules d'analyse sont disponibles selon les données
 */

import type { PropertyPreview, AvailableModules } from "./types";

export function getAvailableModules(data: PropertyPreview): AvailableModules {
  return {
    zoning: !!data.zonage,
    lidar: data.lidar_match_method !== "OUTSIDE_COVERAGE" && data.lidar_match_method !== null,
    contamination: data.contamination !== null,
    flood: data.zone_inondable !== null,
    density: data.densite_max !== null,
    height: data.hauteur_max !== null,
  };
}

export function countAvailableAnalyses(modules: AvailableModules): number {
  const base = 8; // Analyses de base toujours incluses
  const optional = Object.values(modules).filter(Boolean).length * 3;
  return base + optional;
}

export const MODULE_LABELS: Record<keyof AvailableModules, string> = {
  zoning: "Analyse zonage et usages",
  lidar: "Analyse terrain LiDAR",
  contamination: "Vérification contamination",
  flood: "Risque inondation",
  density: "Calcul densité constructible",
  height: "Hauteur maximale",
};

export const MODULE_DESCRIPTIONS: Record<keyof AvailableModules, string> = {
  zoning: "Usages autorisés, restrictions, règlements applicables",
  lidar: "Pente, dénivelé, élévation, analyse topographique détaillée",
  contamination: "Vérification dans le registre des terrains contaminés",
  flood: "Zones inondables 20-100 ans selon données officielles",
  density: "Nombre de logements/hectare, potentiel de densification",
  height: "Hauteur maximale en étages et mètres selon règlements",
};

export const PRICING_TIERS = [
  {
    id: "essentiel" as const,
    name: "Essentiel",
    price: 1900, // Cents CAD
    priceCAD: "19$",
    headline: "Savoir si ça vaut la peine",
    features: [
      "Analyse zonage et usages",
      "Évaluation foncière",
      "Superficie et dimensions",
      "Vérification contamination"
    ],
  },
  {
    id: "complet" as const,
    name: "Complet",
    price: 4900,
    priceCAD: "49$",
    headline: "Prendre une décision d'achat éclairée",
    features: [
      "Tout de l'Essentiel",
      "Analyse terrain LiDAR (si dispo)",
      "Densité constructible",
      "Hauteur maximale",
      "Zone inondable",
      "Score de faisabilité"
    ],
    isPopular: true,
  },
  {
    id: "promoteur" as const,
    name: "Promoteur",
    price: 14900,
    priceCAD: "149$",
    headline: "Monter un dossier de financement",
    features: [
      "Tout du Complet",
      "Analyse financière détaillée",
      "Calcul ROI multi-scénarios",
      "Valeur marché estimée",
      "Revenus locatifs potentiels",
      "Format adapté banques/investisseurs"
    ],
  },
] as const;

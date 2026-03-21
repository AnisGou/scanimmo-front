/**
 * Types TypeScript - Scanimmo Front-End
 * @description Définitions de types pour toute l'application
 */

export type Tier = "essentiel" | "complet" | "promoteur";

export type LidarMethod = "WITHIN" | "NEAREST_OK" | "OUTSIDE_COVERAGE" | null;

export interface PropertyPreview {
  id: string;                          // ID opaque (pour URLs)
  matricule: string;                   // Affiché à l'utilisateur
  adresse: string;
  municipalite: string;
  code_municipalite: string;
  latitude: number | null;
  longitude: number | null;
  zonage: string | null;
  zonage_dominante: string | null;     // qc_dominante DB — priorite sur extraction
  superficie: number | null;
  evaluation_fonciere: number | null;
  pente_moyenne_pct: number | null;
  lidar_match_method: LidarMethod;
  lidar_match_distance_m: number | null;
  contamination: boolean | null;
  zone_inondable: boolean | null;
  densite_max: number | null;
  hauteur_max: number | null;
}

export interface ScoreResult {
  score: number;
  factors: string[];
  color: "green" | "yellow" | "red";
  emoji: string;
  label: string;
}

export interface AvailableModules {
  zoning: boolean;
  lidar: boolean;
  contamination: boolean;
  flood: boolean;
  density: boolean;
  height: boolean;
}

export interface PricingTier {
  id: Tier;
  name: string;
  price: number;
  priceCAD: string;
  headline: string;
  features: string[];
  isPopular?: boolean;
}

export interface ReportToken {
  id: string;
  token: string;
  property_id: string;
  matricule: string;
  tier: Tier;
  email: string;
  filename: string;
  created_at: string;
  expires_at: string;
  downloaded: boolean;
}

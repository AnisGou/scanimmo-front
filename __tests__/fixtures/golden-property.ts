/**
 * Golden property fixtures for Scanimmo tests
 * Source: matricule 438188918610000000 (2860 Gabriel-Le Prevost, Quebec)
 */
import type { PropertyPreview } from "@/lib/types";

export const GOLDEN_PROPERTY: PropertyPreview = {
  id: "6ba7fe72-d8da-41bc-bf08-4c1970667407",
  matricule: "438188918610000000",
  adresse: "2860 RUE GABRIEL-LE PREVOST, Quebec, QC",
  municipalite: "Quebec",
  code_municipalite: "23027",
  latitude: 46.77374759029,
  longitude: -71.2975392756845,
  zonage: "33204Mc",
  zonage_dominante: "Mc",              // qc_dominante from DB
  superficie: 2601.4,
  evaluation_fonciere: 37450000,
  pente_moyenne_pct: 3.46,
  lidar_match_method: "WITHIN",
  lidar_match_distance_m: 0.0,
  contamination: false,
  zone_inondable: false,
  densite_max: null,
  hauteur_max: null,
};

export const MINIMAL_PROPERTY: PropertyPreview = {
  id: "00000000-0000-0000-0000-000000000000",
  matricule: "000000000000000000",
  adresse: "Test Address",
  municipalite: "Test",
  code_municipalite: "00000",
  latitude: null,
  longitude: null,
  zonage: null,
  zonage_dominante: null,
  superficie: null,
  evaluation_fonciere: null,
  pente_moyenne_pct: null,
  lidar_match_method: null,
  lidar_match_distance_m: null,
  contamination: null,
  zone_inondable: null,
  densite_max: null,
  hauteur_max: null,
};

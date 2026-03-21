/**
 * Liste explicite des champs Supabase nécessaires au PDF.
 * PRODUCTION : toujours utiliser cette liste, jamais select('*').
 * Mettre à jour cette liste quand on ajoute un champ au rapport.
 */
export const PDF_PROPERTY_FIELDS = [
  // Identification
  'id', 'matricule', 'adresse', 'code_municipalite', 'latitude', 'longitude',
  // Foncier
  'zone_code', 'annee_construction', 'nb_etages', 'nb_logements', 'nb_batiments',
  'superficie_m2', 'superficie_batiment_m2', 'front_m', 'ces_reel',
  'valeur_totale', 'valeur_terrain', 'valeur_batiment', 'valeur_anterieure',
  // Réglementation / Zonage
  'cos_max', 'hauteur_max_etages', 'aire_verte_min_pct', 'surface_constructible_pct',
  'qc_code_zone', 'qc_dominante', 'qc_dominante_label', 'qc_type_milieu',
  'qc_hauteur_max_m', 'qc_densite_min_logha',
  'zone_municipal_code', 'zone_source',
  // Topographie / LiDAR
  'pente_moyenne_pct', 'denivele_moyen_m', 'elevation_min_m', 'elevation_max_m',
  'lidar_match_method', 'lidar_match_distance_m', 'lidar_source', 'lidar_year', 'lidar_obsolete',
  // Contraintes environnementales
  'contamination_statut',
  'zone_inondable_0_20', 'zone_inondable_20_100',
  'mh_intersecte', 'mh_distance_m',
  // Score
  'score_scanimmo',
] as const;

// Usage: .select(PDF_PROPERTY_FIELDS.join(', '))

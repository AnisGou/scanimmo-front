/**
 * API /api/property-data/[matricule]
 * @description Retourne toutes les données d'une propriété pour le preview interactif.
 *              Agrège properties + properties_access + properties_analysis.
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const PROPERTY_FIELDS = [
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
  'contamination_statut', 'gtc_id', 'distance_gtc_m',
  'zone_inondable_0_20', 'zone_inondable_20_100',
  'mh_intersecte', 'mh_distance_m',
  // Agricole
  'est_agricole',
  // Score
  'score_scanimmo',
  // Extra
  'numero_lot',
];

export async function GET(
  request: Request,
  { params }: { params: { matricule: string } }
) {
  try {
    const { matricule } = params;

    // 1. Propriété principale (bloquant — les appels suivants dépendent de property.id)
    const { data: rawProperty, error } = await supabaseAdmin
      .from("properties")
      .select(PROPERTY_FIELDS.join(', '))
      .eq("matricule", matricule)
      .single();

    if (error || !rawProperty) {
      return NextResponse.json(
        { error: "Propriété non trouvée" },
        { status: 404 }
      );
    }

    const property = rawProperty as Record<string, any>;

    // 2-6. Appels non-bloquants en parallèle via Promise.allSettled
    const [proxResult, analResult, permResult, contResult, defavResult] = await Promise.allSettled([
      // 2. Proximité
      supabaseAdmin
        .from("properties_access")
        .select("idx_transit, idx_epicerie, idx_sante, idx_parcs, idx_educpri, idx_garderie, idx_pharma, idx_emp, idx_educsec, idx_bibl, access_score_0_100")
        .eq("property_id", property.id)
        .single()
        .then(({ data }) => data),

      // 3. Analyse terrain
      supabaseAdmin
        .from("properties_analysis")
        .select("type_terrain, prix_terrain_pi2, est_exploitable, exclusion_reason")
        .eq("property_id", property.id)
        .single()
        .then(({ data }) => data),

      // 4. Permis de construction dans un rayon de 200m
      (property.latitude && property.longitude)
        ? supabaseAdmin
            .rpc("get_permis_nearby", {
              p_lat: property.latitude,
              p_lng: property.longitude,
              p_radius_m: 200,
            })
            .then(({ data }) => data ?? [])
        : Promise.resolve([]),

      // 5. Détails du site contaminé le plus proche
      (property.contamination_statut && property.contamination_statut !== "NON" && property.latitude && property.longitude)
        ? supabaseAdmin
            .rpc("get_nearest_contamination_site", {
              p_lat: property.latitude,
              p_lng: property.longitude,
              p_radius_m: 100,
            })
            .then(({ data }) => { const arr = data as unknown as Record<string, unknown>[] | null; return (arr && arr.length > 0) ? arr[0] : null; })
        : Promise.resolve(null),

      // 6. Défavorisation INSPQ 2021
      supabaseAdmin
        .rpc("get_property_defavorisation", { p_property_id: property.id })
        .then(({ data }) => data),
    ]);

    const proximity = proxResult.status === "fulfilled" ? proxResult.value : null;
    const analysis = analResult.status === "fulfilled" ? analResult.value : null;
    const permits = permResult.status === "fulfilled" ? (permResult.value ?? []) : [];
    const contamination_site = contResult.status === "fulfilled" ? contResult.value : null;
    const defavorisation = defavResult.status === "fulfilled" ? defavResult.value : null;

    return NextResponse.json({ property, proximity, analysis, permits, contamination_site, defavorisation });

  } catch (err: unknown) {
    console.error("[property-data] Erreur:", err);
    return NextResponse.json(
      { error: "Une erreur interne est survenue." },
      { status: 500 }
    );
  }
}

/**
 * API GET /api/preview?id=...
 * @description Récupère les données preview + score pour une propriété
 *
 * Output: {
 *   property: PropertyPreview,
 *   score: ScoreResult,
 *   modules: AvailableModules,
 *   analysesCount: number
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { calculateScore } from "@/lib/calculate-score";
import { getAvailableModules, countAvailableAnalyses } from "@/lib/modules";
import type { PropertyPreview, LidarMethod } from "@/lib/types";
import { extractMunicipality } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID manquant" },
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    // ========================================================================
    // RÉCUPÉRER LES DONNÉES DE LA PROPRIÉTÉ
    // ========================================================================
    const { data, error } = await supabase
      .from("properties")
      .select(`
          id,
  matricule,
  adresse,
  code_municipalite,
  latitude,
  longitude,
  zone_code,
  superficie_m2,
  valeur_totale,
  pente_moyenne_pct,
  lidar_match_method,
  lidar_match_distance_m,
  contamination_statut,
  zone_inondable_0_20,
  hauteur_max_etages,
  cos_max,
  qc_dominante
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error("Erreur Supabase:", error);
      return NextResponse.json(
        { error: "Propriété non trouvée" },
        { status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    // ========================================================================
    // MAPPER LES DONNÉES VERS PropertyPreview
    // ========================================================================
    const property: PropertyPreview = {
      id: data.id,
      matricule: data.matricule,
      adresse: data.adresse || "Adresse non disponible",
      municipalite: extractMunicipality(data.adresse),
      code_municipalite: data.code_municipalite || "24",
      latitude: data.latitude,
      longitude: data.longitude,
      zonage: data.zone_code,
      superficie: data.superficie_m2,
      evaluation_fonciere: data.valeur_totale,
      pente_moyenne_pct: data.pente_moyenne_pct,
      lidar_match_method: data.lidar_match_method as LidarMethod,
      lidar_match_distance_m: data.lidar_match_distance_m,
      contamination: data.contamination_statut === "OUI"
        ? true
        : data.contamination_statut === "NON"
          ? false
          : null,  // NULL, REHABILITE, undefined → neutre (0 pts)
      zone_inondable: data.zone_inondable_0_20 === true
        ? true
        : data.zone_inondable_0_20 === false
          ? false
          : null,  // NULL, undefined → neutre (0 pts)
      densite_max: data.cos_max,
      hauteur_max: data.hauteur_max_etages,
      zonage_dominante: data.qc_dominante ?? null,
    };

    // ========================================================================
    // CALCULER LE SCORE
    // ========================================================================
    const score = calculateScore(property);

    // ========================================================================
    // DÉTERMINER LES MODULES DISPONIBLES
    // ========================================================================
    const modules = getAvailableModules(property);
    const analysesCount = countAvailableAnalyses(modules);

    // ========================================================================
    // RETOURNER LA RÉPONSE
    // ========================================================================
    return NextResponse.json({
      property,
      score,
      modules,
      analysesCount,
    }, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });

  } catch (error) {
    console.error("Erreur API /api/preview:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }
}

/**
 * Generation PDF - Version complete
 * @description Genere un PDF professionnel avec Puppeteer (texte/tableaux, noir/blanc/gris)
 */

import type { Tier } from "./types";
import { supabaseAdmin } from "./supabase-admin";
import { generateReportHTML } from "./generate-pdf-v2";
import type { ReportData } from "./generate-pdf-v2";
import { convertHtmlToPdf } from "./html-to-pdf";
import { PDF_PROPERTY_FIELDS } from "./pdf-fields";
import { resolveScore } from "./resolve-score";

interface GenerateInput {
  matricule: string;
  tier: Tier;
  adresse?: string;
  municipalite?: string;
}

interface ProximityData {
  idx_transit: number | null;
  idx_epicerie: number | null;
  idx_sante: number | null;
  idx_parcs: number | null;
  idx_educpri: number | null;
  idx_garderie: number | null;
  idx_pharma: number | null;
  idx_emp: number | null;
  idx_educsec: number | null;
  idx_bibl: number | null;
  access_score_0_100: number | null;
}

// ========================================================================
// MAIN PDF GENERATION
// ========================================================================

export async function generatePlaceholderPDF(data: GenerateInput): Promise<Buffer> {
  try {
    console.log(`[pdf] Generation PDF pour ${data.matricule} (tier: ${data.tier})`);

    // ETAPE 1: RECUPERER LES DONNEES COMPLETES
    const { data: rawProperty, error } = await supabaseAdmin
      .from("properties")
      .select(PDF_PROPERTY_FIELDS.join(', '))
      .eq("matricule", data.matricule)
      .single();

    if (error || !rawProperty) {
      console.error("[pdf] Erreur recuperation donnees:", error);
      throw new Error(`Propriete ${data.matricule} non trouvee`);
    }

    const property = rawProperty as Record<string, any>;

    // ETAPE 2: CALCULER LE SCORE
    const scoreData = {
      id: property.id,
      matricule: property.matricule,
      adresse: property.adresse || "Adresse non disponible",
      municipalite: data.municipalite || "Quebec",
      code_municipalite: property.code_municipalite || "24",
      latitude: property.latitude,
      longitude: property.longitude,
      zonage: property.zone_code,
      superficie: property.superficie_m2,
      evaluation_fonciere: property.valeur_totale,
      pente_moyenne_pct: property.pente_moyenne_pct,
      lidar_match_method: property.lidar_match_method,
      lidar_match_distance_m: property.lidar_match_distance_m,
      contamination: property.contamination_statut === "OUI" || property.contamination_statut === true,
      zone_inondable: property.zone_inondable_0_20 === "OUI" || property.zone_inondable_0_20 === true,
      densite_max: property.cos_max,
      hauteur_max: property.hauteur_max_etages,
      zonage_dominante: property.qc_dominante ?? null,
    };

    const score = resolveScore(scoreData, property.score_scanimmo);

    // ETAPE 2B: RECUPERER LES DONNEES DE PROXIMITE
    let proximity: ProximityData = {
      idx_transit: null, idx_epicerie: null, idx_sante: null, idx_parcs: null,
      idx_educpri: null, idx_garderie: null, idx_pharma: null, idx_emp: null,
      idx_educsec: null, idx_bibl: null, access_score_0_100: null,
    };
    try {
      const { data: proxRow } = await supabaseAdmin
        .from("properties_access")
        .select("idx_transit, idx_epicerie, idx_sante, idx_parcs, idx_educpri, idx_garderie, idx_pharma, idx_emp, idx_educsec, idx_bibl, access_score_0_100")
        .eq("property_id", property.id)
        .single();
      if (proxRow) {
        proximity = proxRow as ProximityData;
        console.log(`[pdf] Proximite trouvee: score=${proxRow.access_score_0_100}`);
      }
    } catch (e) {
      console.warn("[pdf] Proximite non disponible (non-bloquant)");
    }

    // ETAPE 2C: RECUPERER LES DONNEES DE DEFAVORISATION
    let defavorisation: ReportData["defavorisation"] = null;
    try {
      const { data: defavData } = await supabaseAdmin
        .rpc("get_property_defavorisation", { p_property_id: property.id });
      if (defavData != null) {
        defavorisation = defavData as ReportData["defavorisation"];
        console.log(`[pdf] Defavorisation trouvee: com=${(defavData as Record<string, unknown>).com}`);
      }
    } catch {
      console.warn("[pdf] Defavorisation non disponible (non-bloquant)");
    }

    // ETAPE 2D: RECUPERER LES PERMIS DE CONSTRUCTION (rayon 200m)
    let permits: ReportData["permits"] = [];
    try {
      if (property.latitude && property.longitude) {
        const { data: permRows } = await supabaseAdmin
          .rpc("get_permis_nearby", {
            p_lat: property.latitude,
            p_lng: property.longitude,
            p_radius_m: 200,
          });
        if (permRows) {
          permits = permRows as ReportData["permits"];
          console.log(`[pdf] Permis trouves: ${(permRows as unknown[]).length}`);
        }
      }
    } catch {
      console.warn("[pdf] Permis non disponibles (non-bloquant)");
    }

    // ETAPE 3: PREPARER LES DONNEES DU RAPPORT
    const reportData: ReportData = {
      matricule: property.matricule,
      adresse: property.adresse || "Adresse non disponible",
      municipalite: data.municipalite || "Quebec",
      tier: data.tier,
      // FICHE PROPRIETE
      zone_code: property.zone_code || "N/D",
      superficie_m2: property.superficie_m2 || 0,
      valeur_totale: property.valeur_totale || 0,
      valeur_terrain: property.valeur_terrain || 0,
      valeur_batiment: property.valeur_batiment || 0,
      annee_construction: property.annee_construction,
      nb_etages: property.nb_etages,
      nb_logements: property.nb_logements,
      superficie_batiment_m2: property.superficie_batiment_m2,
      // REGLEMENTATION
      cos_max: property.cos_max,
      hauteur_max_etages: property.hauteur_max_etages,
      aire_verte_min_pct: property.aire_verte_min_pct,
      qc_hauteur_max_m: property.qc_hauteur_max_m,
      qc_dominante_label: property.qc_dominante_label,
      qc_type_milieu: property.qc_type_milieu,
      // TOPOGRAPHIE
      pente_moyenne_pct: property.pente_moyenne_pct,
      denivele_moyen_m: property.denivele_moyen_m,
      elevation_min_m: property.elevation_min_m,
      elevation_max_m: property.elevation_max_m,
      lidar_match_method: property.lidar_match_method,
      lidar_source: property.lidar_source,
      // CONTRAINTES
      zone_inondable_0_20: property.zone_inondable_0_20 === "OUI" || property.zone_inondable_0_20 === true,
      zone_inondable_20_100: property.zone_inondable_20_100 === "OUI" || property.zone_inondable_20_100 === true,
      contamination_statut: property.contamination_statut,
      mh_intersecte: property.mh_intersecte,
      // SCORE
      score: score.score,
      score_color: score.color,
      score_label: score.label,
      score_factors: score.factors,
      // PROXIMITE
      idx_transit: proximity.idx_transit,
      idx_epicerie: proximity.idx_epicerie,
      idx_sante: proximity.idx_sante,
      idx_parcs: proximity.idx_parcs,
      idx_educpri: proximity.idx_educpri,
      idx_garderie: proximity.idx_garderie,
      idx_pharma: proximity.idx_pharma,
      idx_emp: proximity.idx_emp,
      idx_educsec: proximity.idx_educsec,
      idx_bibl: proximity.idx_bibl,
      access_score_0_100: proximity.access_score_0_100,
      // DEFAVORISATION
      defavorisation,
      // PERMIS
      permits,
    };

    // ETAPE 4: GENERER LE HTML
    console.log("[pdf] Generation du HTML...");
    const html = generateReportHTML(reportData);

    // ETAPE 5: CONVERTIR HTML -> PDF
    console.log("[pdf] Conversion HTML -> PDF...");
    const pdfBuffer = await convertHtmlToPdf(html);

    console.log(`[pdf] PDF genere avec succes (${pdfBuffer.length} bytes)`);
    return pdfBuffer;

  } catch (error) {
    console.error("[pdf] Erreur generation PDF:", error);
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Impossible de generer le PDF: ${msg}`);
  }
}

export function generatePDFFilename(matricule: string, tier: Tier): string {
  const timestamp = Date.now();
  const sanitized = matricule.replace(/[^a-zA-Z0-9]/g, "");
  return `scanimmo_${tier}_${sanitized}_${timestamp}.pdf`;
}

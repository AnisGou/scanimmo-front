/**
 * API POST /api/generate-free
 * @description Génère un rapport PDF gratuit (tier essentiel) pour un matricule.
 *
 * Flow:
 * 1. Valider matricule
 * 2. Vérifier que la propriété existe
 * 3. Générer le PDF via Puppeteer
 * 4. Upload dans Supabase Storage
 * 5. Créer un report + token de téléchargement (30 jours)
 * 6. Retourner {token, matricule}
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generatePlaceholderPDF, generatePDFFilename } from "@/lib/generate-pdf";
import type { Tier } from "@/lib/types";
import { extractMunicipality } from "@/lib/utils";

const FREE_TIER: Tier = "essentiel";
const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matricule, force } = body as { matricule?: string; force?: boolean };

    // ====================================================================
    // VALIDATION
    // ====================================================================
    if (!matricule || typeof matricule !== "string" || matricule.length < 10) {
      return NextResponse.json(
        { error: "Matricule requis (18 chiffres)" },
        { status: 400, headers: JSON_HEADERS },
      );
    }

    // ====================================================================
    // VÉRIFIER QUE LA PROPRIÉTÉ EXISTE
    // ====================================================================
    const { data: property, error: propError } = await supabaseAdmin
      .from("properties")
      .select("id, matricule, adresse, code_municipalite")
      .eq("matricule", matricule)
      .single();

    if (propError || !property) {
      return NextResponse.json(
        { error: "Propriété introuvable" },
        { status: 404, headers: JSON_HEADERS },
      );
    }

    // ====================================================================
    // IDEMPOTENCE : vérifier si un rapport gratuit existe déjà
    // ====================================================================
    const { data: existingToken } = await supabaseAdmin
      .from("report_tokens")
      .select("token, expires_at")
      .eq("matricule", matricule)
      .eq("tier", FREE_TIER)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!force && existingToken && new Date(existingToken.expires_at) > new Date()) {
      // Token encore valide — retourner directement
      return NextResponse.json(
        { token: existingToken.token, matricule },
        { headers: JSON_HEADERS },
      );
    }

    // ====================================================================
    // GÉNÉRER LE PDF
    // ====================================================================
    console.log(`📄 [generate-free] Génération PDF gratuit pour ${matricule}`);

    const pdfBuffer = await generatePlaceholderPDF({
      matricule,
      tier: FREE_TIER,
      adresse: property.adresse ?? undefined,
      municipalite: extractMunicipality(property.adresse),
    });

    const filename = generatePDFFilename(matricule, FREE_TIER);
    const storagePath = `reports/${filename}`;

    // ====================================================================
    // UPLOAD PDF DANS SUPABASE STORAGE
    // ====================================================================
    const { error: uploadError } = await supabaseAdmin.storage
      .from("reports")
      .upload(storagePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("❌ [generate-free] Erreur upload PDF:", uploadError);
      return NextResponse.json(
        { error: "Erreur lors de la sauvegarde du PDF" },
        { status: 500, headers: JSON_HEADERS },
      );
    }

    // ====================================================================
    // CRÉER REPORT (status: ready, gratuit)
    // stripe_session_id + customer_email are NOT NULL in schema,
    // so we use synthetic values for free reports.
    // ====================================================================
    const freeSessionId = `free_${matricule}_${Date.now()}`;
    const { data: report, error: reportError } = await supabaseAdmin
      .from("reports")
      .insert({
        matricule,
        property_id: property.id,
        code_municipalite: property.code_municipalite,
        tier: FREE_TIER,
        stripe_session_id: freeSessionId,
        amount_cents: 0,
        customer_email: "gratuit@scanimmo.ca",
        status: "ready",
        paid_at: new Date().toISOString(),
        ready_at: new Date().toISOString(),
        pdf_filename: filename,
        pdf_storage_path: storagePath,
      })
      .select()
      .single();

    if (reportError || !report) {
      console.error("❌ [generate-free] Erreur création report:", reportError);
      return NextResponse.json(
        { error: "Erreur lors de la création du rapport" },
        { status: 500, headers: JSON_HEADERS },
      );
    }

    // ====================================================================
    // CRÉER TOKEN DE TÉLÉCHARGEMENT (30 jours)
    // ====================================================================
    const { data: tokenRecord } = await supabaseAdmin.rpc("generate_secure_token");
    const token = tokenRecord as unknown as string;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { error: tokenError } = await supabaseAdmin
      .from("report_tokens")
      .insert({
        token,
        report_id: report.id,
        matricule,
        tier: FREE_TIER,
        customer_email: "gratuit@scanimmo.ca",
        pdf_filename: filename,
        pdf_storage_path: storagePath,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error("❌ [generate-free] Erreur création token:", tokenError);
      return NextResponse.json(
        { error: "Erreur lors de la création du lien de téléchargement" },
        { status: 500, headers: JSON_HEADERS },
      );
    }

    console.log(`✅ [generate-free] PDF prêt: ${filename} | token: ${token}`);

    return NextResponse.json(
      { token, matricule },
      { headers: JSON_HEADERS },
    );

  } catch (error: unknown) {
    console.error("❌ [generate-free] Erreur:", error);
    return NextResponse.json(
      { error: "Une erreur interne est survenue." },
      { status: 500, headers: JSON_HEADERS },
    );
  }
}

/**
 * API POST /api/generate-free
 * @description Genere un rapport PDF gratuit (tier essentiel) pour un matricule.
 *
 * Flow:
 * 1. Valider matricule
 * 2. Verifier que la propriete existe
 * 3. Generer le PDF via Puppeteer
 * 4. Upload dans Supabase Storage
 * 5. Creer un report + token de telechargement (30 jours)
 * 6. Retourner {token, matricule}
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generatePlaceholderPDF, generatePDFFilename } from "@/lib/generate-pdf";
import type { Tier } from "@/lib/types";
import { extractMunicipality } from "@/lib/utils";

const FREE_TIER: Tier = "essentiel";
const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function logStep(step: string, details?: Record<string, unknown>) {
  if (details) {
    console.log(`[generate-free] ${step}`, details);
    return;
  }
  console.log(`[generate-free] ${step}`);
}

function sanitizeHeaderValue(value: string): string {
  return value.replace(/[^a-zA-Z0-9:_-]/g, "_").slice(0, 120);
}

export async function POST(request: NextRequest) {
  let stage = "request_parse";

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

    logStep("start", { matricule, force: Boolean(force) });

    // ====================================================================
    // VERIFIER QUE LA PROPRIETE EXISTE
    // ====================================================================
    stage = "property_fetch";
    logStep("property_fetch:start", { matricule });
    const { data: property, error: propError } = await supabaseAdmin
      .from("properties")
      .select("id, matricule, adresse, code_municipalite")
      .eq("matricule", matricule)
      .single();
    logStep("property_fetch:done", {
      matricule,
      found: Boolean(property),
      error: propError?.message ?? null,
    });

    if (propError || !property) {
      return NextResponse.json(
        { error: "Propriete introuvable" },
        { status: 404, headers: JSON_HEADERS },
      );
    }

    // ====================================================================
    // IDEMPOTENCE : verifier si un rapport gratuit existe deja
    // ====================================================================
    stage = "token_lookup";
    logStep("token_lookup:start", { matricule });
    const { data: existingToken, error: existingTokenError } = await supabaseAdmin
      .from("report_tokens")
      .select("token, expires_at")
      .eq("matricule", matricule)
      .eq("tier", FREE_TIER)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    logStep("token_lookup:done", {
      matricule,
      found: Boolean(existingToken),
      error: existingTokenError?.message ?? null,
    });

    if (!force && existingToken && new Date(existingToken.expires_at) > new Date()) {
      return NextResponse.json(
        { token: existingToken.token, matricule },
        { headers: JSON_HEADERS },
      );
    }

    // ====================================================================
    // GENERER LE PDF
    // ====================================================================
    const municipalite = extractMunicipality(property.adresse);
    stage = "pdf_render";
    logStep("pdf_render:start", { matricule, municipalite });
    const pdfBuffer = await generatePlaceholderPDF({
      matricule,
      tier: FREE_TIER,
      adresse: property.adresse ?? undefined,
      municipalite,
    });
    logStep("pdf_render:done", { matricule, bytes: pdfBuffer.length });

    const filename = generatePDFFilename(matricule, FREE_TIER);
    const storagePath = `reports/${filename}`;

    // ====================================================================
    // UPLOAD PDF DANS SUPABASE STORAGE
    // ====================================================================
    stage = "storage_upload";
    logStep("storage_upload:start", { matricule, storagePath });
    const { error: uploadError } = await supabaseAdmin.storage
      .from("reports")
      .upload(storagePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });
    logStep("storage_upload:done", {
      matricule,
      storagePath,
      error: uploadError?.message ?? null,
    });

    if (uploadError) {
      console.error("[generate-free] storage_upload:error", uploadError);
      return NextResponse.json(
        { error: "Erreur lors de la sauvegarde du PDF" },
        { status: 500, headers: JSON_HEADERS },
      );
    }

    // ====================================================================
    // CREER REPORT (status: ready, gratuit)
    // stripe_session_id + customer_email are NOT NULL in schema,
    // so we use synthetic values for free reports.
    // ====================================================================
    const freeSessionId = `free_${matricule}_${Date.now()}`;
    stage = "report_insert";
    logStep("report_insert:start", { matricule, storagePath });
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
    logStep("report_insert:done", {
      matricule,
      reportId: report?.id ?? null,
      error: reportError?.message ?? null,
    });

    if (reportError || !report) {
      console.error("[generate-free] report_insert:error", reportError);
      return NextResponse.json(
        { error: "Erreur lors de la creation du rapport" },
        { status: 500, headers: JSON_HEADERS },
      );
    }

    // ====================================================================
    // CREER TOKEN DE TELECHARGEMENT (30 jours)
    // ====================================================================
    stage = "secure_token";
    logStep("secure_token:start", { matricule, reportId: report.id });
    const { data: tokenRecord, error: secureTokenError } = await supabaseAdmin.rpc("generate_secure_token");
    logStep("secure_token:done", {
      matricule,
      tokenLength: typeof tokenRecord === "string" ? tokenRecord.length : null,
      error: secureTokenError?.message ?? null,
    });

    if (secureTokenError || typeof tokenRecord !== "string") {
      console.error("[generate-free] secure_token:error", secureTokenError);
      return NextResponse.json(
        { error: "Erreur lors de la creation du lien de telechargement" },
        { status: 500, headers: JSON_HEADERS },
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    stage = "token_insert";
    logStep("token_insert:start", { matricule, reportId: report.id });
    const { error: tokenError } = await supabaseAdmin
      .from("report_tokens")
      .insert({
        token: tokenRecord,
        report_id: report.id,
        matricule,
        tier: FREE_TIER,
        customer_email: "gratuit@scanimmo.ca",
        pdf_filename: filename,
        pdf_storage_path: storagePath,
        expires_at: expiresAt.toISOString(),
      });
    logStep("token_insert:done", {
      matricule,
      reportId: report.id,
      error: tokenError?.message ?? null,
    });

    if (tokenError) {
      console.error("[generate-free] token_insert:error", tokenError);
      return NextResponse.json(
        { error: "Erreur lors de la creation du lien de telechargement" },
        { status: 500, headers: JSON_HEADERS },
      );
    }

    logStep("success", { matricule, filename });
    stage = "done";

    return NextResponse.json(
      { token: tokenRecord, matricule },
      { headers: JSON_HEADERS },
    );
  } catch (error: unknown) {
    console.error("[generate-free] unhandled:error", { stage, error });
    return NextResponse.json(
      { error: "Une erreur interne est survenue." },
      {
        status: 500,
        headers: {
          ...JSON_HEADERS,
          "X-Scanimmo-Failure-Stage": stage,
          "X-Scanimmo-Failure-Reason": sanitizeHeaderValue(
            error instanceof Error ? error.message : "unknown",
          ),
        },
      },
    );
  }
}

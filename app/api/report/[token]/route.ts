/**
 * API GET /api/report/[token]
 * @description Télécharge le PDF via token sécurisé
 *
 * Logique:
 * 1. Vérifier token + expiration (410 si expiré)
 * 2. Incrémenter download_count (+ downloaded_at si premier)
 * 3. Stream le PDF depuis Supabase Storage
 *
 * ✅ Critère: lien token télécharge un PDF
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json({ error: "Token manquant" }, { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    // ========================================================================
    // ÉTAPE 1: VÉRIFIER TOKEN + EXPIRATION
    // ========================================================================
    const { data: tokenRecord, error: tokenError } = await supabaseAdmin
      .from("report_tokens")
      .select("token, expires_at, download_count, downloaded_at, pdf_storage_path, pdf_filename")
      .eq("token", token)
      .single();

    if (tokenError || !tokenRecord) {
      return NextResponse.json(
        { error: "Token invalide" },
        { status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    // Vérifier expiration
    const expiresAt = new Date(tokenRecord.expires_at);
    const now = new Date();

    if (now > expiresAt) {
      return NextResponse.json(
        {
          error: "Token expiré",
          message: "Ce lien de téléchargement a expiré (30 jours max). Contactez support@scanimmo.ca",
        },
        { status: 410, headers: { 'Content-Type': 'application/json; charset=utf-8' } } // 410 Gone
      );
    }

    // ========================================================================
    // ÉTAPE 2: INCRÉMENTER DOWNLOAD COUNT
    // ========================================================================
    const isFirstDownload = tokenRecord.download_count === 0;

    await supabaseAdmin
      .from("report_tokens")
      .update({
        download_count: (tokenRecord.download_count ?? 0) + 1,
        downloaded_at: isFirstDownload ? new Date().toISOString() : tokenRecord.downloaded_at,
        last_downloaded_at: new Date().toISOString(),
      })
      .eq("token", token);

    // ========================================================================
    // ÉTAPE 3: TÉLÉCHARGER PDF DEPUIS STORAGE
    // ========================================================================
    const { data: pdfData, error: downloadError } = await supabaseAdmin.storage
      .from("reports")
      .download(tokenRecord.pdf_storage_path);

    if (downloadError || !pdfData) {
      console.error("❌ Erreur téléchargement PDF:", downloadError);
      return NextResponse.json(
        { error: "Erreur téléchargement PDF" },
        { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    // ========================================================================
    // ÉTAPE 4: STREAM LE PDF
    // ========================================================================
    const buffer = await pdfData.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${tokenRecord.pdf_filename}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });

  } catch (error) {
    console.error("❌ Erreur API /api/report/[token]:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }
}

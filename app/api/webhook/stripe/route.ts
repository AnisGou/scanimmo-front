/**
 * API POST /api/webhook/stripe
 * @description Webhook Stripe pour traiter les paiements
 *
 * Sur checkout.session.completed:
 * 1. Vérifier signature (idempotence)
 * 2. Upsert reports (status: paid)
 * 3. Générer PDF placeholder
 * 4. Upload dans Supabase Storage (bucket reports, privé)
 * 5. Créer report_token (30 jours)
 * 6. Passer report en ready
 * 7. Retourner 200 rapidement
 *
 * ⚠️ Email: utiliser session.customer_details.email (vérité Stripe)
 */

import { NextRequest, NextResponse } from "next/server";
import { getStripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generatePlaceholderPDF, generatePDFFilename } from "@/lib/generate-pdf";
import type { Tier } from "@/lib/types";
import type { Json } from "@/lib/database.types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      console.error("❌ Webhook Stripe: signature manquante");
      return NextResponse.json({ error: "Signature manquante" }, { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    // ========================================================================
    // VÉRIFIER SIGNATURE STRIPE
    // ========================================================================
    let event;
    try {
      if (!STRIPE_WEBHOOK_SECRET) {
        throw new Error("STRIPE_WEBHOOK_SECRET manquante");
      }
      event = getStripe().webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error("❌ Webhook Stripe: signature invalide", err.message);
      return NextResponse.json({ error: "Signature invalide" }, { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    // ========================================================================
    // IDEMPOTENCE: Vérifier si événement déjà traité
    // ========================================================================
    const { data: existingEvent } = await supabaseAdmin
      .from("stripe_events")
      .select("id, processed")
      .eq("stripe_event_id", event.id)
      .single();

    if (existingEvent?.processed) {
      console.log(`✅ Événement ${event.id} déjà traité, skip`);
      return NextResponse.json({ received: true }, {
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    // Enregistrer l'événement
    await supabaseAdmin.from("stripe_events").upsert({
      stripe_event_id: event.id,
      event_type: event.type,
      event_data: event.data as unknown as Json,
      processed: false,
    });

    // ========================================================================
    // TRAITER checkout.session.completed
    // ========================================================================
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;

      const {
        id: sessionId,
        payment_intent: paymentIntent,
        customer: customerId,
        customer_details,
        metadata,
        amount_total,
      } = session;

      const customerEmail = customer_details?.email;
      const { matricule, tier, property_id, code_municipalite, municipalite } = metadata;

      if (!customerEmail || !matricule || !tier) {
        console.error("❌ Metadata incomplète:", metadata);
        return NextResponse.json({ error: "Metadata manquante" }, { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
      }

      // ======================================================================
      // ÉTAPE 1: UPSERT REPORT (status: paid)
      // ======================================================================
      const { data: report, error: reportError } = await supabaseAdmin
        .from("reports")
        .upsert({
          stripe_session_id: sessionId,
          stripe_payment_intent: paymentIntent,
          stripe_customer_id: customerId,
          matricule,
          property_id,
          code_municipalite,
          municipalite,
          tier,
          amount_cents: amount_total,
          customer_email: customerEmail,
          status: "paid",
          paid_at: new Date().toISOString(),
        }, {
          onConflict: "stripe_session_id",
          ignoreDuplicates: false,
        })
        .select()
        .single();

      if (reportError || !report) {
        console.error("❌ Erreur upsert report:", reportError);
        throw new Error("Erreur création report");
      }

      console.log(`✅ Report créé/mis à jour: ${report.id}`);

      // ======================================================================
      // ÉTAPE 2: GÉNÉRER PDF PLACEHOLDER
      // ======================================================================
      const pdfBuffer = await generatePlaceholderPDF({
        matricule,
        tier: tier as Tier,
        adresse: metadata.adresse,
        municipalite,
      });

      const filename = generatePDFFilename(matricule, tier as Tier);
      const storagePath = `reports/${filename}`;

      // ======================================================================
      // ÉTAPE 3: UPLOAD PDF DANS SUPABASE STORAGE (bucket privé)
      // ======================================================================
      const { error: uploadError } = await supabaseAdmin.storage
        .from("reports")
        .upload(storagePath, pdfBuffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) {
        console.error("❌ Erreur upload PDF:", uploadError);
        throw new Error("Erreur upload PDF");
      }

      console.log(`✅ PDF uploadé: ${storagePath}`);

      // ======================================================================
      // ÉTAPE 4: CRÉER TOKEN DOWNLOAD (30 jours)
      // ======================================================================
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
          tier,
          customer_email: customerEmail,
          pdf_filename: filename,
          pdf_storage_path: storagePath,
          expires_at: expiresAt.toISOString(),
        });

      if (tokenError) {
        console.error("❌ Erreur création token:", tokenError);
        throw new Error("Erreur création token");
      }

      console.log(`✅ Token créé: ${token}`);

      // ======================================================================
      // ÉTAPE 5: PASSER REPORT EN READY
      // ======================================================================
      await supabaseAdmin
        .from("reports")
        .update({
          status: "ready",
          ready_at: new Date().toISOString(),
          pdf_filename: filename,
          pdf_storage_path: storagePath,
        })
        .eq("id", report.id);

      console.log(`✅ Report ${report.id} prêt`);

      // ======================================================================
      // ÉTAPE 6: MARQUER ÉVÉNEMENT COMME TRAITÉ
      // ======================================================================
      await supabaseAdmin
        .from("stripe_events")
        .update({
          processed: true,
          processed_at: new Date().toISOString(),
        })
        .eq("stripe_event_id", event.id);

      // TODO: Envoyer email avec lien de téléchargement
      // const downloadUrl = `${APP_URL}/api/report/${token}`;
      // await sendEmail(customerEmail, downloadUrl);
    }

    // ========================================================================
    // RETOURNER 200 RAPIDEMENT
    // ========================================================================
    return NextResponse.json({ received: true }, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });

  } catch (error) {
    console.error("❌ Erreur webhook Stripe:", error);
    return NextResponse.json(
      { error: "Erreur traitement webhook" },
      { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }
}

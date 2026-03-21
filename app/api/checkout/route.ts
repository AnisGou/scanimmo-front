/**
 * API POST /api/checkout
 * @description Créer une session Stripe Checkout
 *
 * Input: {
 *   matricule: string,
 *   tier: "essentiel" | "complet" | "promoteur",
 *   email?: string (optionnel pour préremplir)
 * }
 *
 * Output: { url: string } // URL Stripe Checkout
 *
 * ⚠️ SÉCURITÉ:
 * - Prix JAMAIS accepté côté client
 * - Serveur applique: 19/49/149 CAD (en cents)
 * - Metadata Stripe: matricule, tier, code_municipalite, property_id
 */

import { NextRequest, NextResponse } from "next/server";
import { stripe, PRICES } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";
import type { Tier } from "@/lib/types";
import { extractMunicipality } from "@/lib/utils";
import { getPublicBaseUrl } from "@/lib/app-url";

function getAppUrl(request: NextRequest): string {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");

  if (host) {
    return `${forwardedProto || "https"}://${host}`;
  }

  return getPublicBaseUrl();
}

export async function POST(request: NextRequest) {
  try {
    const { matricule, tier, email } = await request.json();
    const appUrl = getAppUrl(request);

    // ========================================================================
    // VALIDATION INPUT
    // ========================================================================
    if (!matricule || !tier) {
      return NextResponse.json(
        { error: "Matricule et tier requis" },
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    if (!["essentiel", "complet", "promoteur"].includes(tier)) {
      return NextResponse.json(
        { error: "Tier invalide" },
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    const validTier = tier as Tier;

    // ========================================================================
    // RÉCUPÉRER DONNÉES PROPRIÉTÉ (pour metadata)
    // ========================================================================
    const { data: property } = await supabase
      .from("properties")
      .select("id, matricule, code_municipalite, adresse")
      .eq("matricule", matricule)
      .single();

    if (!property) {
      return NextResponse.json(
        { error: "Propriété non trouvée" },
        { status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    // ========================================================================
    // PRIX FIXE (serveur uniquement, JAMAIS côté client)
    // ========================================================================
    const priceInCents = PRICES[validTier];

    // ========================================================================
    // CRÉER SESSION STRIPE CHECKOUT
    // ========================================================================
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      currency: "cad",
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: {
              name: `Rapport Scanimmo - ${validTier.charAt(0).toUpperCase() + validTier.slice(1)}`,
              description: `Analyse immobilière pour ${property.adresse || property.matricule}`,
              metadata: {
                tier: validTier,
                matricule: property.matricule,
              },
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      customer_email: email || undefined,
      metadata: {
        matricule: property.matricule,
        tier: validTier,
        property_id: property.id,
        code_municipalite: property.code_municipalite || "",
        municipalite: extractMunicipality(property.adresse),
      },
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/preview/${property.matricule}`,
    });

    // ========================================================================
    // RETOURNER URL CHECKOUT
    // ========================================================================
    return NextResponse.json({ url: session.url }, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });

  } catch (error) {
    console.error("❌ Erreur API /api/checkout:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la session de paiement" },
      { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }
}

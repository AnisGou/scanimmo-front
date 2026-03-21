/**
 * Configuration Stripe
 * @description Gestion des paiements (checkout, webhooks)
 *
 * Lazy init: le client Stripe n'est cree qu'au premier acces,
 * ce qui evite un crash `next build` si STRIPE_SECRET_KEY est absente.
 */

import Stripe from "stripe";
import type { Tier } from "./types";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY manquante dans .env.local");
    }
    _stripe = new Stripe(key, {
      apiVersion: "2023-10-16",
      typescript: true,
    });
  }
  return _stripe;
}

/** @deprecated Utiliser getStripe() — garde pour compat import existant */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as any)[prop];
  },
});

/**
 * Prix en centimes CAD (FIXE par tier)
 */
export const PRICES: Record<Tier, number> = {
  essentiel: 1900,   // 19$ CAD
  complet: 4900,     // 49$ CAD
  promoteur: 14900,  // 149$ CAD
};

/**
 * Cles publishables pour client-side
 */
export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

/**
 * Webhook secret pour verifier les signatures
 */
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

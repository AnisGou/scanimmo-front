/**
 * Supabase Admin Client (SERVICE ROLE)
 * @description Client serveur avec privileges admin
 *
 * REGLES STRICTES:
 * - Utilise UNIQUEMENT cote serveur (API routes)
 * - JAMAIS importer dans un composant client
 * - Pour: webhook Stripe, generation PDF, writes DB sensibles
 *
 * Lazy init: le client n'est cree qu'au premier acces,
 * ce qui evite un crash `next build` si les env vars sont absentes.
 *
 * vs lib/supabase.ts (client public, lecture preview uniquement)
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

let _admin: SupabaseClient<Database> | null = null;

export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "Variables d'environnement Supabase admin manquantes! " +
        "Verifier NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.local"
      );
    }
    _admin = createClient<Database>(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        fetch: (url, options = {}) =>
          fetch(url, { ...options, cache: "no-store" as RequestCache }),
      },
    });
  }
  return _admin;
}

/** @deprecated Utiliser getSupabaseAdmin() — garde pour compat import existant */
export const supabaseAdmin = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    return (getSupabaseAdmin() as any)[prop];
  },
});

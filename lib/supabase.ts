/**
 * Configuration Supabase Client
 * @description Client serveur pour accéder à la base de données 3.7M propriétés
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Variables d'environnement Supabase manquantes. " +
    "Creer .env.local avec NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

let _supabase: SupabaseClient<Database> | null = null;

export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    if (!_supabase) {
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Variables d'environnement Supabase manquantes");
      }
      _supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
    }
    return (_supabase as any)[prop];
  },
});

/**
 * Client Supabase serveur (avec service_role key pour admin)
 * Utilisé pour les opérations sensibles (webhook, génération rapport)
 */
export function getSupabaseServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY manquante pour opérations admin");
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

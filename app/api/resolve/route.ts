/**
 * API POST /api/resolve
 * @description Recherche une propriété par adresse ou matricule
 *
 * Input:  { query: string }
 * Output: { id, matricule, adresse, latitude, longitude }
 *
 * Logique:
 * 1. Chercher par matricule exact
 * 2. Sinon chercher par adresse (ILIKE, espaces → % pour tolérer doubles espaces)
 * 3. Retourner 404 si non trouvé
 *
 * Utilise anon client (properties est public via RLS).
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || query.trim().length < 3) {
      return NextResponse.json(
        { error: "Recherche trop courte (minimum 3 caractères)" },
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    const cleanQuery = query.trim();
    const sb = supabase;

    // ========================================================================
    // ÉTAPE 1: Chercher par matricule exact (18 chiffres)
    // ========================================================================
    if (/^\d{18}$/.test(cleanQuery)) {
      const { data, error } = await sb
        .from("properties")
        .select("id, matricule, adresse, latitude, longitude")
        .eq("matricule", cleanQuery)
        .maybeSingle();

      if (data && !error) {
        return NextResponse.json(data, {
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
      }
    }

    // ========================================================================
    // ÉTAPE 2: Chercher par adresse (ILIKE)
    // Espaces → % pour tolérer les doubles espaces en DB
    // Utilise le GIN trigram index idx_properties_adresse_trgm
    // ========================================================================
    const searchPattern = cleanQuery.replace(/\s+/g, "%");
    const { data, error } = await sb
      .from("properties")
      .select("id, matricule, adresse, latitude, longitude")
      .ilike("adresse", `%${searchPattern}%`)
      .limit(5);

    if (error) {
      console.error("Erreur Supabase:", error.message);
      return NextResponse.json(
        { error: "Erreur de recherche" },
        { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Aucune propriété trouvée" },
        { status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    // Retourner le premier résultat (ou liste si plusieurs)
    if (data.length === 1) {
      return NextResponse.json(data[0], {
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    // Plusieurs résultats: retourner liste
    return NextResponse.json({ results: data }, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });

  } catch (error) {
    console.error("Erreur API /api/resolve:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }
}

-- ============================================================================
-- SCANIMMO - Fonction RPC autocomplétion recherche propriétés
-- Date: 2026-02-27 (updated 2026-03-08: perf fix + matricule column)
-- ============================================================================
-- Schema inspection results (2026-02-27):
--   Table: public.properties (3.7M rows)
--   PK: id (uuid, gen_random_uuid())
--   Columns used:
--     adresse            text
--     code_municipalite  text     (nom_municipalite does NOT exist)
--     matricule          text
--     latitude           float8
--     longitude          float8
--   Extensions: pg_trgm available, unaccent available
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ─────────────────────────────────────────────────────────────────
-- Index trigram (performance ILIKE sur 3.7M lignes)
-- ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_properties_adresse_trgm
  ON public.properties USING gin (adresse gin_trgm_ops);

-- ─────────────────────────────────────────────────────────────────
-- Fonction RPC
--
-- SECURITY DEFINER : exposer via anon PostgREST
-- plpgsql + EXECUTE : force custom plan per-call (avoids generic plan seq scan)
-- Spaces → % : tolerates double spaces in DB addresses
-- Range-based matricule : uses B-tree index (LIKE can't on non-C locales)
-- ─────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.search_properties_autocomplete(text, int);

CREATE OR REPLACE FUNCTION public.search_properties_autocomplete(
  q        text,
  limit_n  int DEFAULT 6
)
RETURNS TABLE (
  property_id      uuid,
  matricule        text,
  adresse          text,
  nom_municipalite text,
  latitude         float8,
  longitude        float8
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_q text := trim(q);
  pattern text;
  lim int := LEAST(GREATEST(limit_n, 1), 10);
BEGIN
  IF length(clean_q) < 2 THEN
    RETURN;
  END IF;

  -- Matricule prefix search (all digits) — range-based for B-tree index usage
  IF clean_q ~ '^\d+$' THEN
    RETURN QUERY
      SELECT p.id, p.matricule, p.adresse, p.code_municipalite, p.latitude, p.longitude
      FROM public.properties p
      WHERE p.matricule >= clean_q AND p.matricule < clean_q || 'Z'
      ORDER BY p.matricule
      LIMIT lim;
    RETURN;
  END IF;

  -- Address search: spaces → % to tolerate double spaces in DB
  pattern := '%' || replace(clean_q, ' ', '%') || '%';

  RETURN QUERY EXECUTE
    'SELECT p.id, p.matricule, p.adresse, p.code_municipalite, p.latitude, p.longitude
     FROM public.properties p
     WHERE p.adresse ILIKE $1
     LIMIT $2'
    USING pattern, lim;
END;
$$;

-- ─────────────────────────────────────────────────────────────────
-- Exposition PostgREST
-- anon autorisé : champs publics uniquement
-- ─────────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.search_properties_autocomplete(text, int) TO anon, authenticated;

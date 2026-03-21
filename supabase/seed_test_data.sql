-- =====================================================================
-- SEED TEST DATA - Propriétés de test pour Scanimmo
-- =====================================================================
-- À exécuter dans Supabase SQL Editor
--
-- Ce script insère 5 propriétés de test couvrant différents cas:
-- 1. Propriété recherchée (258895642910000000)
-- 2. Bon terrain (faible pente, bon zonage)
-- 3. Terrain avec contraintes (contamination, inondation)
-- 4. Terrain sans couverture LiDAR
-- 5. Petit terrain urbain
--
-- =====================================================================

-- Vérifier que la table existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'properties') THEN
        RAISE EXCEPTION 'Table "properties" n''existe pas. Exécuter d''abord 001_create_reports_tables.sql';
    END IF;
END $$;

-- Nettoyer les données de test existantes (optionnel)
-- DELETE FROM public.properties WHERE matricule IN (
--   '258895642910000000',
--   '418112899450000000',
--   '790659588000000000',
--   '651234567890000000',
--   '234567890123456789'
-- );

-- =====================================================================
-- INSERTION DES PROPRIÉTÉS DE TEST
-- =====================================================================

INSERT INTO public.properties (
  matricule,
  adresse,
  municipalite,
  code_municipalite,
  latitude,
  longitude,
  zonage,
  superficie_m2,
  evaluation_fonciere,
  pente_moyenne_pct,
  lidar_match_method,
  lidar_match_distance_m,
  contamination,
  zone_inondable,
  densite_max,
  hauteur_max
) VALUES

-- 1️⃣ PROPRIÉTÉ RECHERCHÉE (258895642910000000)
-- Bon terrain résidentiel, pente acceptable, sans contraintes
(
  '258895642910000000',
  '1234 Rue Example, Québec, QC',
  'Québec',
  '24',
  46.8139,
  -71.2080,
  'H1',                    -- Zonage résidentiel unifamilial
  5000.0,                  -- 5000 m²
  450000.0,                -- 450k$ évaluation
  8.5,                     -- 8.5% pente (acceptable)
  'WITHIN',                -- Couverture LiDAR directe
  0.0,                     -- Match exact
  false,                   -- Pas de contamination
  false,                   -- Pas en zone inondable
  2.0,                     -- Densité max 2 logements
  12.0                     -- Hauteur max 12m
),

-- 2️⃣ BON TERRAIN (418112899450000000)
-- Excellent terrain: faible pente, bon zonage, grande superficie
(
  '418112899450000000',
  '5678 Boulevard du Parc, Québec, QC',
  'Québec',
  '24',
  46.8200,
  -71.2150,
  'H2',                    -- Zonage résidentiel bifamilial
  6250.0,                  -- 6250 m²
  625000.0,
  4.2,                     -- Faible pente (excellent)
  'WITHIN',
  0.0,
  false,
  false,
  3.0,                     -- Densité max 3 logements
  15.0
),

-- 3️⃣ TERRAIN AVEC CONTRAINTES (790659588000000000)
-- Pente forte + contamination (score bas attendu)
(
  '790659588000000000',
  '9012 Avenue Industrielle, Québec, QC',
  'Québec',
  '24',
  46.8050,
  -71.1980,
  'C1',                    -- Zonage commercial
  3500.0,
  380000.0,
  15.8,                    -- Pente forte (problématique)
  'OUTSIDE_COVERAGE',      -- Pas de données LiDAR
  NULL,
  true,                    -- ⚠️ CONTAMINATION
  false,
  4.0,
  18.0
),

-- 4️⃣ TERRAIN ZONE INONDABLE (651234567890000000)
-- Bon zonage mais en zone inondable
(
  '651234567890000000',
  '456 Chemin du Fleuve, Québec, QC',
  'Québec',
  '24',
  46.7950,
  -71.2200,
  'H3',                    -- Zonage multifamilial
  4800.0,
  520000.0,
  6.3,
  'NEAREST_OK',            -- Match LiDAR proche (< 50m)
  35.0,
  false,
  true,                    -- ⚠️ ZONE INONDABLE
  5.0,
  20.0
),

-- 5️⃣ PETIT TERRAIN URBAIN (234567890123456789)
-- Petit terrain, haute densité, centre-ville
(
  '234567890123456789',
  '789 Rue Saint-Jean, Québec, QC',
  'Québec',
  '24',
  46.8110,
  -71.2070,
  'H4',                    -- Haute densité
  2200.0,                  -- Petit terrain
  680000.0,                -- Valeur élevée (urbain)
  3.1,                     -- Terrain plat
  'WITHIN',
  0.0,
  false,
  false,
  8.0,                     -- Densité élevée (8 logements)
  25.0                     -- Hauteur élevée (25m)
)

ON CONFLICT (matricule) DO NOTHING;  -- Éviter les doublons

-- =====================================================================
-- VÉRIFICATION
-- =====================================================================

-- Afficher les propriétés insérées
SELECT
  matricule,
  adresse,
  zonage,
  superficie_m2,
  pente_moyenne_pct,
  lidar_match_method,
  contamination,
  zone_inondable
FROM public.properties
WHERE matricule IN (
  '258895642910000000',
  '418112899450000000',
  '790659588000000000',
  '651234567890000000',
  '234567890123456789'
)
ORDER BY matricule;

-- Compter le total de propriétés
SELECT COUNT(*) as total_properties FROM public.properties;

-- =====================================================================
-- TESTS RECOMMANDÉS APRÈS INSERTION
-- =====================================================================
--
-- 1. Tester recherche par matricule:
--    http://localhost:3000
--    Chercher: 258895642910000000
--    Devrait → /preview/258895642910000000
--
-- 2. Tester preview avec bon score:
--    http://localhost:3000/preview/418112899450000000
--    Score attendu: 70-85 (vert)
--
-- 3. Tester preview avec mauvais score:
--    http://localhost:3000/preview/790659588000000000
--    Score attendu: 30-45 (rouge) - contamination + pente forte
--
-- 4. Tester checkout complet:
--    Sur n'importe quelle preview → "Générer mon rapport — 49$"
--    Stripe test: 4242 4242 4242 4242
--    Vérifier /success affiche lien download
--
-- =====================================================================

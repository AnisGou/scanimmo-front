## Scanimmo Homepage Fix Report — v2.1

### Tache 1 — Boutons supprimes
- [x] Bouton "DEMANDER DEMO" supprime (page.tsx ligne 18-20, ancien)
- [x] Bouton "Connexion" : non present dans le code (page.tsx n'avait qu'un seul bouton "DEMANDER DEMO")
- Note : fichier reel = `scanimmo-front/app/page.tsx` (Next.js App Router, pas scanimmo_home_v2.jsx)

### Tache 2 — Migration RPC

**Inspection schema**
- Methode utilisee : psql direct via psycopg2 (Python 3.12)
- Table reelle : `public.properties` (3,728,267 rows estimees)
- Colonnes mappees :
  - `id` (uuid) -> `property_id`
  - `adresse` (text) -> `adresse` (direct)
  - `code_municipalite` (text) -> `nom_municipalite` (alias — `nom_municipalite` n'existe PAS)
  - `latitude` (float8) -> direct
  - `longitude` (float8) -> direct
- Colonne matricule presente : **oui** (text) — predicat LIKE prefix conserve
- Extensions disponibles : pg_trgm **oui** (installe 1.6) · unaccent **oui** (installe 1.1)
  - Les deux etaient disponibles mais non installees — installees par la migration

**Migration**
- Fichier cree : `supabase/migrations/20260227120000_fn_search_properties_autocomplete.sql`
- Appliquee avec succes : **oui** (via psycopg2 autocommit)
- Index trigram cree : `idx_properties_adresse_trgm` (GIN gin_trgm_ops sur adresse)
- Fonction creee : `search_properties_autocomplete(text, int)` SECURITY DEFINER + SET search_path
- GRANT : anon + authenticated

**Tests**

| Test | Attendu | Resultat | Status |
|---|---|---|---|
| 1 — "Prevost" (accents) | >= 1 resultat | 3 lignes | PASS |
| 2 — "Prevost" (sans accent) | = Test 1 | 3 lignes (IDs identiques) | PASS |
| 3 — q="" | 0 | 0 | PASS |
| 4 — q="a" | 0 | 0 | PASS |
| 5 — limit_n=999 | <= 10 | 10 | PASS |
| 6 — psql direct "Gabriel" | sans erreur, colonnes correctes | 3 lignes (property_id, adresse, nom_municipalite) | PASS |

Accent folding : Test 1 et Test 2 retournent les **memes 3 IDs** — unaccent fonctionne.

### Tache 3 — Front sync
- [x] Champs mappes correctement :
  - `s.adresse` dans HighlightMatch
  - `s.property_id` comme key React
  - `s.nom_municipalite` affiche (= code_municipalite via alias SQL)
  - `s.latitude`, `s.longitude` disponibles dans le type Suggestion
- [x] `query.trim().length < 3` confirme : oui (ligne guard dans useEffect + handleSearch)
- [x] Debounce >= 200ms confirme : oui (250ms)
- [x] console.debug ajoute : oui (ligne "temporaire — retirer apres validation QA")
- [ ] console.debug retire apres validation : **en attente QA**

### Architecture notes
- SearchInput appelle le RPC `search_properties_autocomplete` directement via `supabase.rpc()` (cote client, anon key)
- La soumission du formulaire continue d'utiliser `/api/resolve` (route serveur) pour la navigation vers `/preview/[matricule]`
- Dropdown autocomplete avec HighlightMatch, close-on-outside-click, debounce 250ms

### Blocages / TODO restants
- `nom_municipalite` : colonne absente de `properties`. Le SQL retourne `code_municipalite AS nom_municipalite`. Pour afficher le nom reel, il faudrait un JOIN sur une table de reference des municipalites ou enrichir la colonne.
- console.debug a retirer avant merge en production
- Pas de "Connexion" button trouve dans le code actuel (seulement "DEMANDER DEMO" existait)

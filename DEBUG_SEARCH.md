# 🔍 Debug Recherche 404

## Problème: Recherche par matricule renvoie 404

### Étape 1: Vérifier que Supabase est configuré

```bash
# Vérifier .env.local
cat .env.local | grep SUPABASE

# Doit afficher:
# NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

Si vide ou absent → **Configurer .env.local** (voir README.md)

---

### Étape 2: Vérifier que la table `properties` existe

1. Aller sur https://app.supabase.com
2. Sélectionner votre projet
3. Table Editor > Chercher "properties"

**Si la table n'existe pas:**
```sql
-- Créer table minimale pour tests
CREATE TABLE IF NOT EXISTS public.properties (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  matricule text UNIQUE NOT NULL,
  adresse text,
  municipalite text,
  code_municipalite text,
  latitude numeric,
  longitude numeric,
  zonage text,
  superficie_m2 numeric,
  evaluation_fonciere numeric,
  pente_moyenne_pct numeric,
  lidar_match_method text,
  lidar_match_distance_m numeric,
  contamination boolean,
  zone_inondable boolean,
  densite_max numeric,
  hauteur_max numeric
);

-- Index pour recherche rapide
CREATE INDEX idx_properties_matricule ON public.properties(matricule);
```

---

### Étape 3: Vérifier que le matricule existe dans la table

```sql
-- Dans Supabase SQL Editor
SELECT * FROM public.properties
WHERE matricule = '258895642910000000';
```

**Si aucun résultat** → Le matricule n'existe pas dans votre base

---

### Étape 4: Ajouter des données de test

#### Option A: Insérer manuellement (quick test)

```sql
-- Dans Supabase SQL Editor
INSERT INTO public.properties (
  matricule,
  adresse,
  municipalite,
  code_municipalite,
  zonage,
  superficie_m2,
  evaluation_fonciere,
  pente_moyenne_pct,
  lidar_match_method,
  contamination,
  zone_inondable,
  densite_max,
  hauteur_max
) VALUES (
  '258895642910000000',
  '1234 Rue Example, Québec',
  'Québec',
  '24',
  'H1',
  5000,
  450000,
  8.5,
  'WITHIN',
  false,
  false,
  2.0,
  12
);

-- Vérifier insertion
SELECT * FROM public.properties WHERE matricule = '258895642910000000';
```

#### Option B: Importer depuis votre backend Python

Vous avez déjà **3.7M propriétés** dans votre backend Python (scanimmo_v41_complet).

**Import rapide:**

```bash
# 1. Se connecter au backend Python
cd ../scanimmo_v41_complet

# 2. Exporter quelques propriétés vers CSV
python3 -c "
from supabase_connector import SupabaseConnector
sb = SupabaseConnector()

# Exporter 100 propriétés pour tests
props = sb.get_proprietes_analysables(limit=100)

import csv
with open('export_test.csv', 'w', newline='', encoding='utf-8') as f:
    if props:
        writer = csv.DictWriter(f, fieldnames=props[0].keys())
        writer.writeheader()
        writer.writerows(props)
        print(f'✅ Exporté {len(props)} propriétés vers export_test.csv')
"

# 3. Importer dans Supabase via Dashboard
# Supabase > Table Editor > properties > Import data > Choisir export_test.csv
```

---

### Étape 5: Tester la recherche API directement

```bash
# Terminal
curl -X POST http://localhost:3000/api/resolve \
  -H "Content-Type: application/json" \
  -d '{"query":"258895642910000000"}'

# Résultat attendu si matricule existe:
# {
#   "id": "xxx",
#   "matricule": "258895642910000000",
#   "adresse": "...",
#   "latitude": 46.xx,
#   "longitude": -71.xx
# }

# Si matricule n'existe pas:
# {"error":"Aucune propriété trouvée"}
```

---

### Étape 6: Debug avec logs Supabase

Si la requête ne trouve rien malgré les données:

```typescript
// Modifier temporairement app/api/resolve/route.ts

// Ajouter avant le .eq()
console.log("🔍 Recherche matricule:", cleanQuery);

const { data, error } = await supabase
  .from("properties")
  .select("id, matricule, adresse, latitude, longitude")
  .eq("matricule", cleanQuery)
  .single();

console.log("📊 Résultat Supabase:", { data, error });
```

Relancer et vérifier les logs dans le terminal où `npm run dev` tourne.

---

### Étape 7: Vérifier Row Level Security (RLS)

Si Supabase bloque les requêtes:

```sql
-- Vérifier si RLS activé
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'properties';

-- Si rowsecurity = true, désactiver temporairement
ALTER TABLE public.properties DISABLE ROW LEVEL SECURITY;

-- Re-tester la recherche
```

---

## ✅ Solution Rapide (Pour Tester)

Si vous voulez juste **tester le flux complet** sans importer 3.7M propriétés:

```sql
-- Insérer 3 propriétés de test
INSERT INTO public.properties (matricule, adresse, municipalite, zonage, superficie_m2, evaluation_fonciere, pente_moyenne_pct, lidar_match_method, contamination, zone_inondable, densite_max, hauteur_max) VALUES
('258895642910000000', '1234 Rue Example, Québec', 'Québec', 'H1', 5000, 450000, 8.5, 'WITHIN', false, false, 2.0, 12),
('418112899450000000', '5678 Boul Test, Québec', 'Québec', 'H2', 6250, 625000, 4.2, 'WITHIN', false, false, 1.5, 8),
('790659588000000000', '9012 Ave Demo, Québec', 'Québec', 'C1', 3500, 380000, 12.3, 'OUTSIDE_COVERAGE', true, false, 3.0, 15);

-- Vérifier
SELECT matricule, adresse FROM public.properties;
```

Puis tester:
1. http://localhost:3000
2. Chercher "258895642910000000"
3. Devrait rediriger vers /preview/258895642910000000

---

## 🔧 Checklist Debug

- [ ] `.env.local` configuré avec clés Supabase
- [ ] Table `properties` existe dans Supabase
- [ ] Table contient au moins 1 propriété
- [ ] Matricule recherché existe dans la table
- [ ] RLS désactivé (ou politique configurée)
- [ ] Logs API /api/resolve affichent la requête
- [ ] Pas d'erreur dans console navigateur (F12)

---

## 🆘 Si Rien ne Fonctionne

**Mode debug complet:**

```typescript
// app/api/resolve/route.ts - Version debug
export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    console.log("1️⃣ Query reçue:", query);

    const cleanQuery = query.trim();
    console.log("2️⃣ Query nettoyée:", cleanQuery);
    console.log("3️⃣ Test regex 18 chiffres:", /^\d{18}$/.test(cleanQuery));

    if (/^\d{18}$/.test(cleanQuery)) {
      console.log("4️⃣ Recherche par matricule exact...");

      const { data, error } = await supabase
        .from("properties")
        .select("id, matricule, adresse, latitude, longitude")
        .eq("matricule", cleanQuery)
        .single();

      console.log("5️⃣ Résultat Supabase:", {
        found: !!data,
        error: error?.message,
        data: data ? "OK" : null
      });

      if (data && !error) {
        console.log("6️⃣ ✅ Propriété trouvée, retour");
        return NextResponse.json(data);
      }

      console.log("7️⃣ ⚠️ Pas trouvé par matricule, essai par adresse...");
    }

    // ... reste du code
  } catch (error) {
    console.error("❌ Erreur globale:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
```

Relancer et copier-coller les logs ici pour analyse.

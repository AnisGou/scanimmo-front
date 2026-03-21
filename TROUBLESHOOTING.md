# 🔧 Troubleshooting Scanimmo

## ✅ FIX: Page /preview/[matricule] affiche "Propriété non trouvée"

### 🐛 Problème

La page `/preview/[matricule]` affichait systématiquement "Propriété non trouvée" même avec un matricule valide.

### 🔍 Cause Racine

**Server Component faisant des fetch HTTP vers ses propres API routes.**

```typescript
// ❌ AVANT (ne fonctionnait pas)
async function getPropertyPreview(matricule: string) {
  const resolveRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: matricule }),
  });

  // ...
}
```

**Pourquoi ça échoue:**

1. `process.env.NEXT_PUBLIC_APP_URL` peut être `undefined` en développement
2. Server Components (Next.js 14) ne peuvent pas faire de fetch vers localhost de manière fiable
3. C'est une mauvaise pratique: appel HTTP pour exécuter son propre code
4. Erreurs silencieuses: le fetch échoue mais retourne null

### ✅ Solution Appliquée

**Importer directement la logique métier au lieu de faire des fetch HTTP:**

```typescript
// ✅ APRÈS (fonctionne)
import { supabase } from "@/lib/supabase";
import { calculateScore } from "@/lib/calculate-score";
import { getAvailableModules } from "@/lib/modules";

async function getPropertyPreview(matricule: string) {
  const { data: propertyData, error } = await supabase
    .from("properties")
    .select("...")
    .eq("matricule", matricule)
    .single();

  const property = { /* mapper */ };
  const score = calculateScore(property);
  const modules = getAvailableModules(property);

  return { property, score, modules };
}
```

**Avantages:**
- ✅ Pas de dépendance à `NEXT_PUBLIC_APP_URL`
- ✅ Fonctionne en dev et prod
- ✅ Plus rapide (pas de HTTP overhead)
- ✅ Meilleure gestion d'erreurs
- ✅ Type-safety complète

### 📋 Fichiers Modifiés

- [app/preview/[matricule]/page.tsx](app/preview/[matricule]/page.tsx) - Réécrit pour importer directement Supabase

### 🧪 Comment Tester

```bash
# 1. Vérifier que .env.local existe avec SUPABASE_URL et SUPABASE_ANON_KEY
cat .env.local

# 2. Lancer le serveur
npm run dev

# 3. Tester avec un matricule valide
# Ouvrir: http://localhost:3000/preview/418112899450000000

# 4. Devrait afficher la page avec score, pas "Propriété non trouvée"
```

### 🔄 Pattern à Suivre

**Règle générale Next.js 14 App Router:**

| Contexte | Méthode | ✅ / ❌ |
|----------|---------|---------|
| **Server Component** → API route interne | `fetch(NEXT_PUBLIC_APP_URL/api/...)` | ❌ Éviter |
| **Server Component** → Logique métier | Import direct (Supabase, fonctions) | ✅ Recommandé |
| **Client Component** → API route interne | `fetch("/api/...")` (URL relative) | ✅ OK |
| **Client Component** → Supabase | `supabase.from(...)` | ✅ OK (si RLS configuré) |

### 📝 Exemples Corrects

#### ✅ Server Component (page.tsx)

```typescript
import { supabase } from "@/lib/supabase";

export default async function Page() {
  // ✅ Direct import
  const { data } = await supabase.from("properties").select("*");

  return <div>{/* ... */}</div>;
}
```

#### ✅ Client Component (SearchInput.tsx)

```typescript
"use client";

export function SearchInput() {
  const handleSearch = async () => {
    // ✅ Fetch relatif (côté client)
    const res = await fetch("/api/resolve", { /* ... */ });
  };
}
```

---

## 🐛 Autres Problèmes Courants

### Problème: "Module not found: Can't resolve '@/lib/...'"

**Cause:** Alias `@/` non configuré dans tsconfig.json

**Solution:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Problème: "Error: Invariant: headers() expects to have requestAsyncStorage"

**Cause:** Utilisation de `headers()` ou `cookies()` dans un composant non async

**Solution:** Ajouter `async` au composant ou utiliser un Client Component

### Problème: Stripe webhook "Signature invalide"

**Cause:** `STRIPE_WEBHOOK_SECRET` incorrect

**Solution:**
```bash
# En local, utiliser Stripe CLI
stripe listen --forward-to localhost:3000/api/webhook/stripe

# Copier le webhook secret affiché (whsec_...)
# Mettre dans .env.local
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Problème: "Supabase query returns null"

**Causes possibles:**
1. Table "properties" n'existe pas
2. Matricule n'existe pas dans la table
3. RLS (Row Level Security) bloque la requête

**Debug:**
```bash
# Tester dans Supabase SQL Editor
SELECT * FROM public.properties WHERE matricule = '418112899450000000';

# Vérifier RLS
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'properties';
```

**Solution:** Désactiver RLS temporairement pour debug
```sql
ALTER TABLE public.properties DISABLE ROW LEVEL SECURITY;
```

### Problème: Token download expiré (410)

**Cause:** Tokens expirent après 30 jours

**Solution:** Acheter un nouveau rapport ou prolonger manuellement:
```sql
UPDATE public.report_tokens
SET expires_at = now() + interval '30 days'
WHERE token = 'YOUR_TOKEN';
```

---

## 📞 Support

Si le problème persiste:

1. **Vérifier logs console navigateur** (F12 > Console)
2. **Vérifier logs serveur** (terminal où `npm run dev` tourne)
3. **Vérifier logs Supabase** (Dashboard > Logs)
4. **Vérifier logs Stripe** (Dashboard > Developers > Logs)

Pour toute assistance: support@scanimmo.ca

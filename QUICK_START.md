# 🚀 Quick Start - Tester le flux complet en 5 minutes

## ✅ Checklist Pré-requis

- [ ] `.env.local` existe avec `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Migration `001_create_reports_tables.sql` appliquée (table `properties` existe)
- [ ] Serveur dev lancé (`npm run dev`)

---

## 🎯 Étape 1: Insérer des données de test (2 min)

### Dans Supabase Dashboard

1. **Aller sur** https://app.supabase.com
2. **Sélectionner** votre projet
3. **SQL Editor** (menu gauche) → **New query**
4. **Copier-coller** tout le contenu de [`supabase/seed_test_data.sql`](supabase/seed_test_data.sql)
5. **Exécuter** (Run / F5)

### Vérification

Vous devriez voir dans les résultats:

```
✅ 5 rows inserted
✅ SELECT affiche 5 propriétés
```

**Si erreur "Table does not exist":**
→ Exécuter d'abord `supabase/migrations/001_create_reports_tables.sql`

---

## 🧪 Étape 2: Tester la recherche (1 min)

### Dans le navigateur

1. **Ouvrir** http://localhost:3000
2. **Taper** dans la barre de recherche:
   ```
   258895642910000000
   ```
3. **Cliquer** "Analyser ce terrain"

### Résultat attendu

✅ **Redirection vers** `/preview/258895642910000000`

✅ **Affichage:**
- Score (couleur verte/jaune/rouge)
- Adresse: "1234 Rue Example, Québec, QC"
- Aperçu gratuit (zonage H1, superficie 5000 m², pente 8.5%)
- Boutons "Générer mon rapport — XX$"

**Si 404 Not Found:**
→ Vérifier que les données sont bien dans Supabase:
```sql
SELECT * FROM public.properties WHERE matricule = '258895642910000000';
```

---

## 💳 Étape 3: Tester le paiement (2 min)

### Configuration Stripe (si pas déjà fait)

1. **Créer compte** https://dashboard.stripe.com
2. **Mode Test** activé (toggle en haut)
3. **Copier les clés** dans `.env.local`:
   ```bash
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   ```
4. **Redémarrer** le serveur dev

### Dans le navigateur

1. **Sur la page preview** → Cliquer **"Générer mon rapport — 49$"** (tier Complet)
2. **Stripe Checkout** s'ouvre
3. **Remplir** avec carte de test:
   - Email: `test@example.com`
   - Numéro carte: `4242 4242 4242 4242`
   - Date expiration: `12/34`
   - CVC: `123`
4. **Payer**

### Résultat attendu

✅ **Redirection vers** `/success?session_id=cs_test_...`

✅ **Affichage:**
- "✅ Paiement confirmé!"
- "Votre rapport est en cours de génération..."

**Si "pending":**
→ Le webhook n'a pas encore été reçu (voir Étape 4)

---

## 🔗 Étape 4: Configurer le webhook Stripe (local)

### Terminal 1 (serveur dev)
```bash
npm run dev
```

### Terminal 2 (Stripe CLI)

```bash
# Installer Stripe CLI si pas déjà fait
# https://docs.stripe.com/stripe-cli

stripe login

# Écouter les webhooks
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

**Copier le webhook secret** affiché (commence par `whsec_...`)

### Ajouter dans .env.local

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Redémarrer le serveur dev** (Ctrl+C puis `npm run dev`)

---

## 📥 Étape 5: Télécharger le rapport

### Après paiement

1. **Sur la page `/success`** → Cliquer **"Télécharger mon rapport PDF"**
2. **PDF téléchargé** (actuellement placeholder avec texte simple)

### Vérifier dans Supabase

```sql
-- Vérifier le rapport créé
SELECT * FROM public.reports WHERE status = 'ready' ORDER BY created_at DESC LIMIT 1;

-- Vérifier le token
SELECT * FROM public.report_tokens ORDER BY created_at DESC LIMIT 1;

-- Vérifier le fichier PDF
SELECT name FROM storage.objects WHERE bucket_id = 'reports' ORDER BY created_at DESC LIMIT 1;
```

---

## 🐛 Dépannage Rapide

### Problème: "Propriété non trouvée" sur /preview

**Cause:** Base de données vide

**Solution:**
```sql
-- Vérifier dans Supabase SQL Editor
SELECT COUNT(*) FROM public.properties;
-- Si 0 → Exécuter seed_test_data.sql
```

---

### Problème: "Signature verification failed" (webhook)

**Cause:** `STRIPE_WEBHOOK_SECRET` invalide ou absent

**Solution:**
1. Vérifier que `stripe listen` tourne
2. Copier le `whsec_...` affiché
3. Mettre dans `.env.local`
4. Redémarrer `npm run dev`

---

### Problème: "Bucket not found: reports"

**Cause:** Storage bucket pas créé

**Solution:**
1. Supabase Dashboard → **Storage** → **New bucket**
2. Name: `reports`
3. **Private** (décoché "Public bucket")
4. Create

---

### Problème: Checkout redirige vers 404

**Cause:** URL de succès mal configurée

**Solution:**
Vérifier dans `.env.local`:
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## ✅ Validation Finale

Si tout fonctionne:

- [x] Recherche par matricule → Preview
- [x] Preview affiche score + données
- [x] Checkout → Stripe Checkout
- [x] Paiement → Redirection /success
- [x] Success → Lien download
- [x] Download → PDF téléchargé

**🎉 Le flux complet est fonctionnel!**

---

## 🚀 Prochaines Étapes

1. **Importer vraies données** depuis votre backend Python (3.7M propriétés)
2. **Implémenter génération PDF complète** (remplacer placeholder)
3. **Ajouter rate limiting** (Upstash Redis)
4. **Déployer sur Vercel**

Voir [CHECKLIST_DEPLOYMENT.md](CHECKLIST_DEPLOYMENT.md) pour la suite.

---

## 📞 Support

- **Debug recherche:** [DEBUG_SEARCH.md](DEBUG_SEARCH.md)
- **Troubleshooting général:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Déploiement:** [CHECKLIST_DEPLOYMENT.md](CHECKLIST_DEPLOYMENT.md)
- **Documentation complète:** [README.md](README.md)

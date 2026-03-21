# Scanimmo Front-End

Plateforme de vente de rapports d'analyse immobilière au Québec.

## 🚀 Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **Paiement:** Stripe Checkout
- **Base de données:** Supabase (PostgreSQL + PostGIS)
- **Storage:** Supabase Storage (bucket privé)
- **Hosting:** Vercel

## 📋 Prérequis

- Node.js 18+
- Compte Supabase (gratuit)
- Compte Stripe (mode test)

## ⚙️ Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Copier .env.example vers .env.local
cp .env.local.example .env.local

# 3. Compléter les variables d'environnement (voir ci-dessous)

# 4. Appliquer les migrations Supabase (voir supabase/README.md)

# 5. Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## 🔑 Variables d'Environnement

Créer `.env.local` avec:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Obtenir les clés Supabase

1. Aller sur https://app.supabase.com
2. Créer un projet (ou utiliser existant)
3. Settings > API
   - `NEXT_PUBLIC_SUPABASE_URL`: Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY`: service_role key ⚠️ PRIVÉE

### Obtenir les clés Stripe

1. Aller sur https://dashboard.stripe.com
2. Developers > API keys
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Publishable key (test)
   - `STRIPE_SECRET_KEY`: Secret key (test)
3. Developers > Webhooks > Add endpoint
   - URL: `https://your-domain.com/api/webhook/stripe`
   - Events: `checkout.session.completed`
   - Copier `STRIPE_WEBHOOK_SECRET`

## 🗄️ Setup Base de Données

### 1. Appliquer les migrations

Voir [supabase/README.md](supabase/README.md)

```bash
# Via Supabase Dashboard (SQL Editor)
# Copier-coller le contenu de supabase/migrations/001_create_reports_tables.sql
```

### 2. Créer le bucket Storage

Dans Supabase Dashboard > Storage:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', false);
```

### 3. Vérifier les tables

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('reports', 'report_tokens', 'stripe_events');
```

## 🔄 Flux Complet (Testing)

### 1. Test Recherche

```
1. Ouvrir http://localhost:3000
2. Entrer une adresse ou matricule (ex: "418112899450000000")
3. Cliquer "Analyser"
```

### 2. Test Preview + Score

```
1. Vérifier affichage score
2. Vérifier données preview (zonage, superficie, pente, évaluation)
3. Vérifier statut LiDAR
```

### 3. Test Checkout Stripe

```
1. Cliquer "Générer mon rapport — 49$"
2. Redirection vers Stripe Checkout (mode test)
3. Utiliser carte test: 4242 4242 4242 4242
4. Date: n'importe quelle date future
5. CVC: n'importe quel 3 chiffres
```

### 4. Test Webhook (en local avec Stripe CLI)

```bash
# Installer Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks vers localhost
stripe listen --forward-to localhost:3000/api/webhook/stripe

# Dans un autre terminal, trigger un événement test
stripe trigger checkout.session.completed
```

### 5. Test Success + Download

```
1. Après paiement test, redirection vers /success?session_id=...
2. Vérifier affichage "Rapport généré!"
3. Cliquer "Télécharger mon rapport PDF"
4. Vérifier téléchargement du PDF placeholder
```

## 🐛 Debugging

### Logs Webhook Stripe

```bash
# Console navigateur > Network > webhook/stripe
# Vérifier status 200

# Supabase Dashboard > Database > reports
# Vérifier ligne créée avec status = "ready"

# Supabase Dashboard > Storage > reports
# Vérifier fichier PDF uploadé
```

### Erreurs Communes

**"Signature invalide" (webhook)**
- Vérifier `STRIPE_WEBHOOK_SECRET` correct
- En local: utiliser `stripe listen` pour obtenir le secret

**"Propriété non trouvée"**
- Vérifier table `properties` dans Supabase
- Vérifier matricule existe

**"Token expiré"**
- Les tokens expirent après 30 jours
- Générer un nouveau rapport

## 📦 Structure du Code

```
scanimmo-front/
├── app/
│   ├── api/
│   │   ├── resolve/route.ts         # POST - recherche adresse/matricule
│   │   ├── preview/route.ts         # GET - données preview + score
│   │   ├── checkout/route.ts        # POST - Stripe checkout session
│   │   ├── webhook/stripe/route.ts  # POST - webhook Stripe
│   │   └── report/[token]/route.ts  # GET - download PDF
│   ├── preview/[matricule]/page.tsx # Page preview
│   ├── success/page.tsx             # Page confirmation
│   └── page.tsx                     # Landing
├── components/
│   ├── ScoreCard.tsx
│   ├── LidarStatus.tsx
│   ├── TrustBlock.tsx
│   ├── CheckoutButton.tsx
│   └── ...
├── lib/
│   ├── supabase.ts                  # Client public (lecture)
│   ├── supabase-admin.ts            # Client admin (writes)
│   ├── stripe.ts
│   ├── calculate-score.ts
│   └── generate-pdf.ts
└── supabase/
    └── migrations/
        └── 001_create_reports_tables.sql
```

## 🔒 Sécurité

### Séparation Client/Admin Supabase

**RÈGLE STRICTE:**

- `lib/supabase.ts` → Client public (anon key)
  - Utilisé dans composants client
  - Lecture preview uniquement
  - Aucun privilège write

- `lib/supabase-admin.ts` → Client admin (service_role key)
  - Utilisé UNIQUEMENT côté serveur (API routes)
  - JAMAIS importer dans composants client
  - Pour: webhook, génération PDF, writes DB

### Prix Côté Serveur

- ✅ Prix JAMAIS accepté depuis le client
- ✅ Serveur applique: `PRICES[tier]` (19/49/149 CAD)
- ✅ Metadata Stripe validée côté serveur

### Idempotence Webhook

- ✅ Table `stripe_events` stocke chaque event_id
- ✅ Évite double traitement si webhook rejoué

## 🚀 Déploiement Vercel

```bash
# 1. Installer Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Configurer variables d'environnement
# Vercel Dashboard > Settings > Environment Variables
# Ajouter toutes les variables de .env.production.example

# 4. Configurer webhook Stripe
# URL: https://your-app.vercel.app/api/webhook/stripe
```

## 📝 TODO

- [ ] Rate limiting (Upstash Redis)
- [ ] Génération PDF complète (ReportLab Python ou PDFKit)
- [ ] Email envoi lien download (Resend ou SendGrid)
- [ ] Composants UI polish (ActionButtons, ModulesList, PricingSection)
- [ ] Tests E2E (Playwright)
- [ ] Analytics (Posthog ou Plausible)

## 📞 Support

- **Email:** support@scanimmo.ca
- **Documentation Stripe:** https://stripe.com/docs/webhooks
- **Documentation Supabase:** https://supabase.com/docs

## 📜 Licence

Propriétaire - Scanimmo Inc. © 2026

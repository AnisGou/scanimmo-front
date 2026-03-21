# ✅ Checklist Déploiement Scanimmo

## 🎯 Critères d'Acceptation (OBLIGATOIRES)

### 1️⃣ API Checkout
- [x] Endpoint POST /api/checkout créé
- [ ] Test: Clic "Générer mon rapport — XX$" → Redirection Stripe test OK
- [ ] Prix serveur (19/49/149 CAD) jamais côté client
- [ ] Metadata Stripe: matricule, tier, code_municipalite, property_id
- [ ] success_url et cancel_url configurées

**Test:**
```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"matricule":"418112899450000000","tier":"complet","email":"test@test.com"}'
```

### 2️⃣ Tables Supabase
- [ ] Migration 001_create_reports_tables.sql appliquée
- [ ] Tables créées: reports, report_tokens, stripe_events
- [ ] Index sur matricule, stripe_session_id, token
- [ ] Contraintes uniques OK (pas de doublons)
- [ ] Bucket Storage "reports" créé (privé)

**Test:**
```sql
-- Dans Supabase SQL Editor
SELECT COUNT(*) FROM public.reports;
SELECT COUNT(*) FROM public.report_tokens;
SELECT COUNT(*) FROM public.stripe_events;

-- Vérifier bucket
SELECT * FROM storage.buckets WHERE id = 'reports';
```

### 3️⃣ Webhook Stripe
- [ ] Endpoint POST /api/webhook/stripe créé
- [ ] Signature STRIPE_WEBHOOK_SECRET vérifiée
- [ ] Sur checkout.session.completed: upsert reports
- [ ] Génération PDF placeholder
- [ ] Upload dans Storage bucket "reports"
- [ ] Création report_token (30 jours)
- [ ] Report status = "ready"
- [ ] Idempotence via stripe_events

**Test (avec Stripe CLI):**
```bash
stripe listen --forward-to localhost:3000/api/webhook/stripe
stripe trigger checkout.session.completed
```

**Vérification:**
```sql
-- Après webhook
SELECT * FROM public.reports WHERE status = 'ready' ORDER BY created_at DESC LIMIT 1;
SELECT * FROM public.report_tokens ORDER BY created_at DESC LIMIT 1;

-- Vérifier fichier PDF
SELECT name FROM storage.objects WHERE bucket_id = 'reports' ORDER BY created_at DESC LIMIT 1;
```

### 4️⃣ Download Rapport
- [ ] Endpoint GET /api/report/[token] créé
- [ ] Token vérifié + expiration (410 si expiré)
- [ ] download_count incrémenté
- [ ] PDF streamé depuis Storage
- [ ] Headers Content-Disposition correctes

**Test:**
```bash
# Récupérer un token depuis DB
# psql: SELECT token FROM public.report_tokens LIMIT 1;

curl -I http://localhost:3000/api/report/YOUR_TOKEN_HERE

# Doit retourner 200 + Content-Type: application/pdf
```

### 5️⃣ Flux Complet
- [ ] Landing (/) → SearchInput fonctionnel
- [ ] Recherche → Redirection /preview/[matricule]
- [ ] Preview → ScoreCard + données preview + LidarStatus
- [ ] Preview → CheckoutButton → Stripe Checkout
- [ ] Paiement test → Webhook → Report créé
- [ ] Success → Affichage lien download
- [ ] Download → PDF téléchargé

**Test E2E:**
```
1. http://localhost:3000
2. Chercher "418112899450000000" (ou adresse)
3. Cliquer "Analyser"
4. Vérifier /preview/[matricule] affiche score
5. Cliquer "Générer mon rapport — 49$"
6. Stripe test: 4242 4242 4242 4242
7. Vérifier /success affiche "Rapport généré!"
8. Cliquer "Télécharger mon rapport PDF"
9. Vérifier PDF téléchargé
```

## 🔧 Configuration Environnement

### Variables .env.local
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY ⚠️
- [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- [ ] STRIPE_SECRET_KEY ⚠️
- [ ] STRIPE_WEBHOOK_SECRET ⚠️
- [ ] NEXT_PUBLIC_APP_URL

### Supabase Setup
- [ ] Projet créé
- [ ] Tables créées (migration SQL)
- [ ] Bucket "reports" créé (privé)
- [ ] RLS désactivé sur tables internes (ou politiques configurées)

### Stripe Setup
- [ ] Mode test activé
- [ ] Webhook endpoint configuré
- [ ] Events: checkout.session.completed

## 🛡️ Sécurité

- [ ] Séparation supabase.ts (client) vs supabase-admin.ts (admin)
- [ ] supabase-admin.ts JAMAIS importé côté client
- [ ] Prix JAMAIS accepté côté client (serveur applique PRICES[tier])
- [ ] Idempotence webhook (table stripe_events)
- [ ] Bucket Storage privé (pas public)
- [ ] Email depuis session.customer_details (vérité Stripe)

## 📝 Disclaimer

- [ ] Disclaimer dans PDF:
  "Ce rapport constitue un indicateur d'aide à la décision basé sur les données publiques disponibles. Il ne constitue ni une garantie, ni un avis professionnel ou réglementaire."

## ⚡ Performance & Limites

- [ ] Rate limiting sur /api/resolve (à implémenter avec Upstash)
- [ ] Rate limiting sur /api/preview (à implémenter)
- [ ] Cleanup tokens expirés (cron job Supabase)

```sql
-- Créer cron job (Supabase Dashboard > Database > Cron)
SELECT cron.schedule(
  'cleanup-expired-tokens',
  '0 3 * * *',
  $$ SELECT cleanup_expired_tokens(); $$
);
```

## 🚀 Déploiement Vercel

- [ ] Push code sur GitHub
- [ ] Connecter repo Vercel
- [ ] Configurer variables d'environnement
- [ ] Déployer
- [ ] Configurer webhook Stripe avec URL prod
- [ ] Tester flux complet en prod

### Post-Déploiement

- [ ] Test paiement réel (mode live Stripe)
- [ ] Vérifier emails reçus
- [ ] Vérifier PDF générés OK
- [ ] Monitoring erreurs (Vercel Analytics)

## 📊 Monitoring

### Métriques à suivre

- [ ] Taux conversion (preview → checkout)
- [ ] Taux abandon panier Stripe
- [ ] Temps génération PDF
- [ ] Erreurs webhook (logs Vercel)
- [ ] Tokens expirés non utilisés

### Logs à monitorer

```bash
# Vercel CLI
vercel logs

# Filtrer erreurs webhook
vercel logs --filter="api/webhook/stripe"
```

## 🐛 Debugging

### Problèmes Courants

**Webhook "Signature invalide"**
```
→ Vérifier STRIPE_WEBHOOK_SECRET
→ En local: utiliser stripe listen
→ En prod: copier secret depuis Stripe Dashboard
```

**"Token expiré"**
```
→ Tokens expirent après 30 jours
→ Générer nouveau rapport
```

**"PDF non trouvé"**
```sql
-- Vérifier Storage
SELECT name FROM storage.objects WHERE bucket_id = 'reports';

-- Vérifier report_tokens
SELECT pdf_storage_path FROM report_tokens WHERE token = 'XXX';
```

**"Report status = paid mais pas ready"**
```
→ Webhook pas déclenché ou échoué
→ Vérifier logs Vercel
→ Re-trigger manuellement: stripe trigger checkout.session.completed
```

## ✅ Validation Finale

### Avant Mise en Production

1. [ ] Tous les critères d'acceptation validés
2. [ ] Tests E2E passent
3. [ ] Pas d'erreurs console navigateur
4. [ ] Pas d'erreurs logs serveur
5. [ ] Variables prod configurées
6. [ ] Webhook Stripe prod configuré
7. [ ] Monitoring activé
8. [ ] Documentation à jour

### Test Smoke Production

```
1. Ouvrir https://your-domain.com
2. Rechercher un terrain
3. Payer avec vraie carte (ou mode test Stripe)
4. Télécharger PDF
5. Vérifier email reçu
```

## 📞 Support

En cas de problème:
- Logs Vercel: https://vercel.com/dashboard
- Logs Stripe: https://dashboard.stripe.com/logs
- Logs Supabase: https://app.supabase.com > Logs
- Documentation: [README.md](README.md)

---

**Dernière mise à jour:** 2026-02-07
**Version:** 1.0.0 (MVP)

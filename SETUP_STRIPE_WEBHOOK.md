# 🔗 Configuration Webhook Stripe (Local)

## ⚠️ Problème Actuel

Le rapport reste en "Génération en cours..." car **le webhook Stripe n'a pas été reçu**.

En développement local, Stripe ne peut pas envoyer de webhooks directement à `localhost:3000`. Vous devez utiliser **Stripe CLI** pour transférer les webhooks.

---

## ✅ Solution: Stripe CLI

### 1️⃣ Installer Stripe CLI

**Option A: Chocolatey (Windows)**
```powershell
choco install stripe-cli
```

**Option B: Téléchargement direct**
1. Aller sur https://github.com/stripe/stripe-cli/releases
2. Télécharger `stripe_X.X.X_windows_x86_64.zip`
3. Extraire et ajouter au PATH

**Vérifier installation:**
```powershell
stripe --version
```

---

### 2️⃣ Connecter à votre compte Stripe

```powershell
stripe login
```

→ Une page s'ouvre dans le navigateur
→ Cliquer "Allow access"
→ Retourner au terminal

---

### 3️⃣ Lancer l'écoute des webhooks

**Terminal 1 (serveur dev):**
```powershell
cd c:\Users\goues\OneDrive\Desktop\scanimmo-zonage\scanimmo-front
npm run dev
```

**Terminal 2 (Stripe CLI):**
```powershell
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

**Résultat attendu:**
```
> Ready! You are using Stripe API Version [2023-10-16]. Your webhook signing secret is whsec_xxx...
```

---

### 4️⃣ Copier le webhook secret

Dans le terminal Stripe CLI, **copier** le secret qui commence par `whsec_...`

**Exemple:**
```
Your webhook signing secret is whsec_a1b2c3d4e5f6g7h8i9j0...
```

---

### 5️⃣ Ajouter le secret dans .env.local

```bash
# Dans .env.local
STRIPE_WEBHOOK_SECRET=whsec_a1b2c3d4e5f6g7h8i9j0...
```

⚠️ **IMPORTANT:** Redémarrer le serveur dev après modification `.env.local`

**Dans Terminal 1:**
```powershell
# Ctrl+C pour arrêter
npm run dev
```

---

### 6️⃣ Tester le flux complet

1. **Ouvrir** http://localhost:3000
2. **Chercher** `258895642910000000`
3. **Cliquer** "Générer mon rapport — 49$"
4. **Payer** avec carte test: `4242 4242 4242 4242`

**Dans Terminal 2 (Stripe CLI), vous devriez voir:**
```
→ POST   /api/webhook/stripe [200]
  evt_test_xxx  checkout.session.completed
```

5. **Redirection** vers `/success`
6. **Devrait afficher** "Rapport généré!" avec bouton télécharger

---

## 🧪 Tester le webhook manuellement

Si le flux ne fonctionne pas, testez le webhook directement:

```powershell
# Dans Terminal 3
stripe trigger checkout.session.completed
```

**Vérifier dans Terminal 2:**
```
→ POST   /api/webhook/stripe [200]
```

**Vérifier dans Terminal 1 (logs serveur):**
```
✅ Report created: report-xxx-xxx
✅ PDF generated: reports/report-xxx.pdf
✅ Token created: tok_xxx
```

---

## 🔍 Debug si ça ne fonctionne pas

### Vérifier les logs serveur (Terminal 1)

Si erreur 500 dans Stripe CLI, regarder Terminal 1 pour voir:
```
❌ Erreur webhook: ...
```

### Vérifier la base de données

```sql
-- Dans Supabase SQL Editor
SELECT * FROM public.reports ORDER BY created_at DESC LIMIT 5;
SELECT * FROM public.report_tokens ORDER BY created_at DESC LIMIT 5;
SELECT * FROM public.stripe_events ORDER BY created_at DESC LIMIT 5;
```

**Résultat attendu:**
- `reports.status = 'ready'`
- `report_tokens.token` existe
- `stripe_events.event_id` enregistré

### Vérifier Storage

```sql
SELECT name, created_at FROM storage.objects
WHERE bucket_id = 'reports'
ORDER BY created_at DESC
LIMIT 5;
```

**Si bucket n'existe pas:**
1. Supabase Dashboard → **Storage** → **New bucket**
2. Name: `reports`
3. **Private** (décoché "Public bucket")
4. Create

---

## ⚡ Mode Production (Vercel)

Après déploiement sur Vercel:

1. **Stripe Dashboard** → Developers → Webhooks
2. **Add endpoint**
3. URL: `https://your-domain.vercel.app/api/webhook/stripe`
4. Events: `checkout.session.completed`
5. **Copier** le webhook secret (commence par `whsec_`)
6. **Vercel** → Settings → Environment Variables
7. Ajouter `STRIPE_WEBHOOK_SECRET=whsec_...`
8. Redeploy

---

## 📋 Checklist Configuration Webhook

- [ ] Stripe CLI installé (`stripe --version`)
- [ ] Connecté à Stripe (`stripe login`)
- [ ] Terminal 1: `npm run dev` en cours
- [ ] Terminal 2: `stripe listen --forward-to localhost:3000/api/webhook/stripe` en cours
- [ ] `STRIPE_WEBHOOK_SECRET` copié dans `.env.local`
- [ ] Serveur dev redémarré après ajout secret
- [ ] Test paiement → Terminal 2 affiche `[200]`
- [ ] `/success` affiche "Rapport généré!"

---

## 🆘 Problèmes Courants

### "Error: No such webhook endpoint"
→ Vérifier que `stripe listen` pointe vers le bon port (3000)

### "Signature verification failed"
→ `STRIPE_WEBHOOK_SECRET` incorrect ou absent dans `.env.local`
→ Redémarrer le serveur après modification

### "Bucket not found: reports"
→ Créer le bucket dans Supabase Storage (voir ci-dessus)

### Webhook reçu mais rapport reste "pending"
→ Vérifier logs serveur (Terminal 1) pour erreur
→ Vérifier que `supabaseAdmin` est configuré avec `SUPABASE_SERVICE_ROLE_KEY`

---

## ✅ Validation

Si tout fonctionne:
1. Terminal 2 affiche `[200]` après paiement
2. `/success` affiche "Rapport généré!" (pas "en cours...")
3. Clic sur "Télécharger" → PDF téléchargé

**🎉 Le flux complet est opérationnel!**

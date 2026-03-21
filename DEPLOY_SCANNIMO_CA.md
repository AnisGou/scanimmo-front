# Deploy `scanimmo.ca`

## Etat deja traite cote code

- Frontend `Next.js` buildable en production
- Suite `Vitest` verte
- URL publique unifiee via `NEXT_PUBLIC_BASE_URL` / `NEXT_PUBLIC_APP_URL`
- `checkout` calcule correctement ses URLs sur Vercel
- Route `api/preview` marquee dynamique pour eviter le warning Next
- Exemple de variables prod ajoute dans `.env.production.example`

## Variables a renseigner dans Vercel

Copier les cles de `.env.production.example`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_MAPBOX_TOKEN`
- `NEXT_PUBLIC_BASE_URL=https://scanimmo.ca`
- `NEXT_PUBLIC_APP_URL=https://scanimmo.ca`

## Ordre recommande

1. Connecter ce repo a Vercel
2. Ajouter les variables d'environnement
3. Deployer une premiere fois sur l'URL Vercel
4. Ajouter le domaine `scanimmo.ca` dans Vercel
5. Configurer les DNS chez le registrar
6. Mettre a jour le webhook Stripe avec l'URL prod
7. Refaire un smoke test complet

## DNS a preparer chez le registrar

Les valeurs exactes affichees dans Vercel font foi. En pratique, le schema classique est:

- apex `scanimmo.ca` vers Vercel
- `www.scanimmo.ca` en alias/CNAME vers Vercel

Une fois le domaine ajoute dans Vercel, recopier exactement les enregistrements proposes par Vercel.

## Smoke test final

1. Ouvrir `https://scanimmo.ca`
2. Chercher une propriete
3. Ouvrir la page preview
4. Lancer un checkout Stripe
5. Verifier la page success
6. Verifier le telechargement du PDF
7. Verifier les logs Vercel, Supabase et Stripe

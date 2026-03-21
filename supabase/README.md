# Migrations Supabase - Scanimmo

## Appliquer les migrations

### Option 1: Via Supabase Dashboard (SQL Editor)

1. Aller sur https://app.supabase.com
2. Sélectionner votre projet
3. Aller dans SQL Editor
4. Copier-coller le contenu de `migrations/001_create_reports_tables.sql`
5. Exécuter (Run)

### Option 2: Via CLI Supabase

```bash
# Installer Supabase CLI
npm install -g supabase

# Login
supabase login

# Link au projet
supabase link --project-ref your-project-ref

# Appliquer migration
supabase db push

# Ou directement via psql
psql -h db.your-project.supabase.co -U postgres -d postgres -f migrations/001_create_reports_tables.sql
```

## Configurer Storage Bucket

### Créer bucket `reports` (privé)

```sql
-- Dans SQL Editor Supabase
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', false);
```

### Politique d'accès (RLS)

```sql
-- Seuls les tokens valides peuvent télécharger
CREATE POLICY "Download with valid token"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'reports' AND
  EXISTS (
    SELECT 1 FROM public.report_tokens
    WHERE pdf_storage_path = storage.objects.name
    AND expires_at > now()
  )
);
```

## Vérifier les tables

```sql
-- Lister les tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('reports', 'report_tokens', 'stripe_events');

-- Compter les enregistrements
SELECT
  (SELECT COUNT(*) FROM public.reports) as reports_count,
  (SELECT COUNT(*) FROM public.report_tokens) as tokens_count,
  (SELECT COUNT(*) FROM public.stripe_events) as events_count;
```

## Cleanup automatique (Cron)

Configurer un cron job pour nettoyer les tokens expirés:

```sql
-- Dans Supabase Dashboard > Database > Cron Jobs
SELECT cron.schedule(
  'cleanup-expired-tokens',
  '0 3 * * *', -- Tous les jours à 3h du matin
  $$ SELECT cleanup_expired_tokens(); $$
);
```

-- ============================================================================
-- SCANIMMO - TABLES REPORTS & TOKENS
-- ============================================================================
-- Description: Tables pour audit commercial, traçabilité et livraison PDF
-- Date: 2026-02-07
-- ============================================================================

-- ============================================================================
-- TABLE: reports (audit/traçabilité commerciale)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identifiants
  matricule text NOT NULL,
  property_id text,
  code_municipalite text,
  municipalite text,

  -- Tier acheté
  tier text NOT NULL CHECK (tier IN ('essentiel', 'complet', 'promoteur')),

  -- Stripe
  stripe_session_id text UNIQUE NOT NULL,
  stripe_payment_intent text,
  stripe_customer_id text,

  -- Statuts
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'paid', 'ready', 'failed', 'refunded')
  ),

  -- Montants (en cents CAD)
  amount_cents integer NOT NULL,

  -- Client
  customer_email text NOT NULL,

  -- Fichier PDF
  pdf_filename text,
  pdf_storage_path text,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  paid_at timestamptz,
  ready_at timestamptz,

  -- Métadonnées
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_reports_matricule ON public.reports(matricule);
CREATE INDEX IF NOT EXISTS idx_reports_stripe_session ON public.reports(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_customer_email ON public.reports(customer_email);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);

COMMENT ON TABLE public.reports IS
'Audit et traçabilité de tous les rapports générés. Une ligne par paiement.';

-- ============================================================================
-- TABLE: report_tokens (tokens download expirant 30 jours)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.report_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Token unique (URL-safe)
  token text UNIQUE NOT NULL,

  -- Lien vers report
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,

  -- Identifiants (dénormalisés pour query rapide)
  matricule text NOT NULL,
  tier text NOT NULL,
  customer_email text NOT NULL,

  -- Fichier PDF
  pdf_filename text NOT NULL,
  pdf_storage_path text NOT NULL,

  -- Expiration (30 jours)
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,

  -- Tracking downloads
  download_count integer DEFAULT 0,
  downloaded_at timestamptz,
  last_downloaded_at timestamptz
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_report_tokens_token ON public.report_tokens(token);
CREATE INDEX IF NOT EXISTS idx_report_tokens_report_id ON public.report_tokens(report_id);
CREATE INDEX IF NOT EXISTS idx_report_tokens_matricule ON public.report_tokens(matricule);
CREATE INDEX IF NOT EXISTS idx_report_tokens_expires_at ON public.report_tokens(expires_at);

COMMENT ON TABLE public.report_tokens IS
'Tokens de téléchargement avec expiration 30 jours. Un token par rapport.';

-- ============================================================================
-- TABLE: stripe_events (idempotence webhook)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event ID Stripe (unique)
  stripe_event_id text UNIQUE NOT NULL,

  -- Type d'événement
  event_type text NOT NULL,

  -- Données complètes
  event_data jsonb NOT NULL,

  -- Traitement
  processed boolean DEFAULT false,
  processed_at timestamptz,

  -- Timestamps
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stripe_events_event_id ON public.stripe_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed ON public.stripe_events(processed);

COMMENT ON TABLE public.stripe_events IS
'Événements Stripe pour garantir idempotence (éviter double traitement).';

-- ============================================================================
-- FONCTION: Générer token sécurisé
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_secure_token()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..32 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FONCTION: Cleanup tokens expirés (à scheduler)
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.report_tokens
  WHERE expires_at < now();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_tokens IS
'Nettoie les tokens expirés. À scheduler quotidiennement.';

-- ============================================================================
-- VÉRIFICATIONS
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Tables créées: reports, report_tokens, stripe_events';
  RAISE NOTICE '✅ Index créés pour performance';
  RAISE NOTICE '✅ Fonctions utilitaires créées';
END $$;

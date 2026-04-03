-- Add workspace preference fields to profiles so dashboard controls persist
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS workspace_name text,
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'Owner',
  ADD COLUMN IF NOT EXISTS plan text DEFAULT 'Pro',
  ADD COLUMN IF NOT EXISTS compact_dashboard boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS upload_suggestions boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS weekly_digest boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS two_factor_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS suspicious_activity_alerts boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS protected_share_links boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS wifi_only_uploads boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sync_window_minutes integer NOT NULL DEFAULT 15;

UPDATE public.profiles
SET
  workspace_name = COALESCE(NULLIF(workspace_name, ''), display_name, 'Clever Vault'),
  role = COALESCE(NULLIF(role, ''), 'Owner'),
  plan = COALESCE(NULLIF(plan, ''), 'Pro');

ALTER TABLE public.profiles
  ALTER COLUMN workspace_name SET DEFAULT 'Clever Vault';

ALTER TABLE public.profiles REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;

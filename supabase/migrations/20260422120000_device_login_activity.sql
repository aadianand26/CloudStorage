-- Track user devices and login activity for the Settings dashboard.
CREATE TABLE IF NOT EXISTS public.user_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint text NOT NULL,
  device_name text NOT NULL,
  browser text,
  os text,
  user_agent text,
  first_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  last_active_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, device_fingerprint)
);

CREATE TABLE IF NOT EXISTS public.login_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id uuid REFERENCES public.user_devices(id) ON DELETE SET NULL,
  event_type text NOT NULL DEFAULT 'login',
  status text NOT NULL DEFAULT 'successful',
  device_name text NOT NULL,
  browser text,
  os text,
  location text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_devices_user_last_active
  ON public.user_devices(user_id, last_active_at DESC);

CREATE INDEX IF NOT EXISTS idx_login_activity_user_created
  ON public.login_activity(user_id, created_at DESC);

ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their devices" ON public.user_devices;
CREATE POLICY "Users can view their devices"
  ON public.user_devices FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their devices" ON public.user_devices;
CREATE POLICY "Users can insert their devices"
  ON public.user_devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their devices" ON public.user_devices;
CREATE POLICY "Users can update their devices"
  ON public.user_devices FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their devices" ON public.user_devices;
CREATE POLICY "Users can remove their devices"
  ON public.user_devices FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their login activity" ON public.login_activity;
CREATE POLICY "Users can view their login activity"
  ON public.login_activity FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their login activity" ON public.login_activity;
CREATE POLICY "Users can insert their login activity"
  ON public.login_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.user_devices REPLICA IDENTITY FULL;
ALTER TABLE public.login_activity REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'user_devices'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_devices;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'login_activity'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.login_activity;
  END IF;
END $$;

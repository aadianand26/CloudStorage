-- Add missing columns used by the app and enable realtime for the files table
-- 1) Add columns if they don't exist
ALTER TABLE public.files
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS is_starred boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_shared boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_accessed_at timestamptz NOT NULL DEFAULT now();

-- 2) Ensure updated_at is maintained automatically on updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_files_updated_at'
  ) THEN
    CREATE TRIGGER update_files_updated_at
    BEFORE UPDATE ON public.files
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 3) Improve common query performance
CREATE INDEX IF NOT EXISTS idx_files_user_id ON public.files(user_id);

-- 4) Enable full row data for realtime
ALTER TABLE public.files REPLICA IDENTITY FULL;

-- 5) Add table to the supabase_realtime publication (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'files'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.files;
  END IF;
END $$;

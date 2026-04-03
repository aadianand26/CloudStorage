-- Add share_token column to files table for public sharing
ALTER TABLE public.files 
ADD COLUMN IF NOT EXISTS share_token uuid DEFAULT gen_random_uuid();

-- Create index for faster lookups by share token
CREATE INDEX IF NOT EXISTS idx_files_share_token ON public.files(share_token) WHERE is_shared = true;

-- Create a public view function to get shared file info
CREATE OR REPLACE FUNCTION public.get_shared_file(token uuid)
RETURNS TABLE (
  id uuid,
  name text,
  type text,
  size bigint,
  storage_path text,
  created_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, type, size, storage_path, created_at
  FROM public.files
  WHERE share_token = token AND is_shared = true AND is_deleted = false;
$$;
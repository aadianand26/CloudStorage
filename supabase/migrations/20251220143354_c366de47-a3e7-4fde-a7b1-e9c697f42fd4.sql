-- Add share_password column for password-protected sharing
ALTER TABLE public.files ADD COLUMN share_password text DEFAULT NULL;
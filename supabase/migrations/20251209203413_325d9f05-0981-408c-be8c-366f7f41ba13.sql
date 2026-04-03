-- Add share_expires_at column to files table
ALTER TABLE public.files 
ADD COLUMN share_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
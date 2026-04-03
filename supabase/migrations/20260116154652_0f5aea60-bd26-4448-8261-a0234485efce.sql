-- Add content column to files table for storing extracted text
ALTER TABLE public.files ADD COLUMN content TEXT;
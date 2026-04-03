-- Enable real-time for files table
ALTER TABLE public.files REPLICA IDENTITY FULL;

-- Add files table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.files;
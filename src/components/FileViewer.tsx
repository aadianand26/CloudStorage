import { Button } from '@/components/ui/button';
import { Download, X, Share2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PDFViewer } from './PDFViewer';

interface FileViewerProps {
  file: {
    id: string;
    name: string;
    type: string;
    storage_path: string;
    size: number;
  } | null;
  open: boolean;
  onClose: () => void;
  onDownload: () => void;
  onShare: () => void;
}

export const FileViewer = ({ file, open, onClose, onDownload, onShare }: FileViewerProps) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mimeType, setMimeType] = useState<string>('');
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const lastLoadedIdRef = useRef<string | null>(null);
  const currentUrlRef = useRef<string | null>(null);
  const trackedAccessRef = useRef<string | null>(null);

  useEffect(() => {
    let createdUrl: string | null = null;

    const loadFile = async () => {
      if (!file || !open) {
        // Closing or no file: revoke any existing URL once
        if (currentUrlRef.current) {
          URL.revokeObjectURL(currentUrlRef.current);
          currentUrlRef.current = null;
        }
        setFileUrl(null);
        setTextContent(null);
        setMimeType('');
        setSignedUrl(null);
        lastLoadedIdRef.current = null;
        trackedAccessRef.current = null;
        return;
      }

      // If already loaded this file and URL exists, avoid reloading
      if (lastLoadedIdRef.current === file.id && currentUrlRef.current) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Try direct download first; fallback to signed URL fetch to avoid CORS/storage policy edge cases
        let blob: Blob | null = null;

        const dl = await supabase.storage
          .from('user-files')
          .download(file.storage_path);

        if (dl.error) {
          console.warn('Storage download error, attempting signed URL fallback:', dl.error);
        } else {
          blob = dl.data as Blob;
        }

        if (!blob) {
          const signed = await supabase.storage
            .from('user-files')
            .createSignedUrl(file.storage_path, 3600);

          if (signed.error || !signed.data?.signedUrl) {
            throw signed.error || new Error('No signed URL returned');
          }

          const resp = await fetch(signed.data.signedUrl);
          if (!resp.ok) throw new Error(`Failed to fetch signed URL: ${resp.status}`);
          blob = await resp.blob();
        }

        // Ensure correct MIME for PDF to enable inline preview
        const isPdfByName = file.name.toLowerCase().endsWith('.pdf');
        if (isPdfByName && blob.type !== 'application/pdf') {
          blob = new Blob([blob], { type: 'application/pdf' });
        }

        createdUrl = URL.createObjectURL(blob);
        if (currentUrlRef.current && currentUrlRef.current !== createdUrl) {
          URL.revokeObjectURL(currentUrlRef.current);
        }
        currentUrlRef.current = createdUrl;
        setFileUrl(createdUrl);

        // Prepare detected mime and optional text preview
        const mime = (blob.type || file.type || '').toLowerCase();
        setMimeType(mime);
        if (mime.startsWith('text/') || ['application/json','application/xml','text/csv','application/csv','application/javascript','application/x-javascript','application/x-httpd-php'].includes(mime)) {
          try {
            const text = await blob.text();
            setTextContent(text);
          } catch (e) {
            console.warn('Failed to parse text preview:', e);
            setTextContent(null);
          }
        } else {
          setTextContent(null);
        }

        // Prepare a signed URL for external open in new tab
        try {
          const signedForOpen = await supabase.storage
            .from('user-files')
            .createSignedUrl(file.storage_path, 3600);
          if (signedForOpen.data?.signedUrl) setSignedUrl(signedForOpen.data.signedUrl);
        } catch (e) {
          console.warn('Failed to create signed URL for external open:', e);
        }

        // Update last_accessed_at once per open (non-blocking)
        if (trackedAccessRef.current !== file.id) {
          const { error: updateError } = await supabase
            .from('files')
            .update({ last_accessed_at: new Date().toISOString() })
            .eq('id', file.id);
          if (updateError) {
            console.error('Error updating last_accessed_at:', updateError);
          }
          trackedAccessRef.current = file.id;
        }
        lastLoadedIdRef.current = file.id;
      } catch (error) {
        console.error('Error loading file:', error);
        toast({
          title: "Preview error",
          description: error instanceof Error ? error.message : "Failed to load file preview",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadFile();

    // Cleanup handled on close; avoid revoking while viewing to prevent flicker
    return () => {};
  }, [open, file?.id]);

  if (!file) return null;

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!fileUrl) {
      return (
        <div className="flex items-center justify-center h-96 text-muted-foreground">
          Preview not available
        </div>
      );
    }

    const effectiveType = ((mimeType && mimeType !== 'application/octet-stream') ? mimeType : (file.type || '')).toLowerCase();
    if (effectiveType.startsWith('image/')) {
      return (
        <img 
          src={fileUrl} 
          alt={file.name} 
          className="max-h-full max-w-full object-contain"
        />
      );
    }

    if (effectiveType.startsWith('video/')) {
      return (
        <video 
          src={fileUrl} 
          controls 
          className="max-h-full max-w-full"
        >
          Your browser does not support the video tag.
        </video>
      );
    }

    if (effectiveType.includes('pdf') || file.name.toLowerCase().endsWith('.pdf')) {
      return (
        <div className="w-full h-full">
          <PDFViewer fileUrl={fileUrl} fileName={file.name} />
        </div>
      );
    }

    if (effectiveType.startsWith('text/') || ['application/json','application/xml','text/csv','application/csv'].includes(effectiveType)) {
      return (
        <div className="h-full w-full max-w-5xl overflow-auto rounded-lg bg-background p-4 md:p-8">
          {textContent ? (
            <pre className="whitespace-pre-wrap text-sm font-mono">{textContent}</pre>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
              <a href={signedUrl || fileUrl} target="_blank" rel="noopener noreferrer" className="underline">Open text file in a new tab</a>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-96 text-muted-foreground space-y-4">
        <p>Preview not available for this file type</p>
        <Button onClick={onDownload} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download to view
        </Button>
      </div>
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Top toolbar */}
      <div className="min-h-16 border-b bg-background/95 px-2 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-semibold">{file.name}</h2>
            <p className="text-sm text-muted-foreground">
              {file.type} • {(file.size / 1024).toFixed(2)} KB
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:flex sm:shrink-0 sm:items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onShare}
            className="w-full sm:w-auto"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { const url = signedUrl || fileUrl; if (url) window.open(url, '_blank', 'noopener,noreferrer'); }}
            disabled={!fileUrl && !signedUrl}
            className="w-full sm:w-auto"
          >
            <span className="hidden sm:inline">Open in new tab</span>
            <span className="sm:hidden">Open</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDownload}
            className="w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
        </div>
      </div>

      {/* Preview area */}
      <div className="h-[calc(100svh-7.5rem)] overflow-auto bg-muted/20 sm:h-[calc(100svh-4rem)]">
        <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
          {renderPreview()}
        </div>
      </div>
    </div>
  );
};

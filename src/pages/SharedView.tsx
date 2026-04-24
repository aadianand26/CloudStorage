import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Download, Home, Loader2, Image, Video, FileCode, Clock, Lock } from 'lucide-react';
import { PDFViewer } from '@/components/PDFViewer';
import { useToast } from '@/hooks/use-toast';
import { supabaseUrl } from '@/integrations/supabase/client';
import { BrandLogo } from '@/components/BrandLogo';

interface SharedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  created_at: string;
  url: string;
}

const SharedView = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [file, setFile] = useState<SharedFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!token) {
      setError('Invalid share link');
      setLoading(false);
      return;
    }

    fetchSharedFile();
  }, [token]);

  const fetchSharedFile = async (enteredPassword?: string) => {
    try {
      setLoading(true);
      setError(null);
      setPasswordError(false);
      
      const functionUrl = `${supabaseUrl}/functions/v1/get-shared-file`;
      
      console.log('Fetching shared file via POST');
      
      // Use POST with body to avoid exposing password in URL
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: enteredPassword || undefined,
        }),
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        
        if (response.status === 429) {
          setError('Too many requests. Please try again later.');
          return;
        }
        
        if (errorData.expired) {
          setIsExpired(true);
          throw new Error(errorData.error || 'Link expired');
        }
        
        if (errorData.password_required) {
          setPasswordRequired(true);
          if (errorData.file_name) {
            setFileName(errorData.file_name);
          }
          if (enteredPassword) {
            setPasswordError(true);
          }
          setLoading(false);
          return;
        }
        
        throw new Error(errorData.error || 'Failed to fetch file');
      }

      const data = await response.json();
      console.log('Received data:', data);

      if (data?.file) {
        setFile(data.file);
        setPasswordRequired(false);
      } else {
        setError('File not found or no longer shared');
      }
    } catch (err: unknown) {
      console.error('Error fetching shared file:', err);
      const message = err instanceof Error ? err.message : 'Failed to load shared file';
      if (!passwordRequired) {
        setError(message);
        toast({
          title: 'Error',
          description: message || 'Could not load the shared file',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      fetchSharedFile(password.trim());
    }
  };

  const handleDownload = () => {
    if (file?.url) {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <BrandLogo className="justify-center" showText={false} imageClassName="h-12 w-12" />
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading shared file...</p>
        </div>
      </div>
    );
  }

  // Password entry screen
  if (passwordRequired && !file) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md space-y-6 p-5 sm:p-8">
          <div className="text-center space-y-4">
            <BrandLogo className="justify-center" showText={false} imageClassName="h-14 w-14" />
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Password Protected</h1>
              {fileName && (
                <p className="text-sm text-muted-foreground truncate">
                  {fileName}
                </p>
              )}
              <p className="text-muted-foreground">
                This file is protected. Enter the password to continue.
              </p>
            </div>
          </div>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(false);
                }}
                className={passwordError ? 'border-destructive' : ''}
                autoFocus
              />
              {passwordError && (
                <p className="text-sm text-destructive">
                  Incorrect password. Please try again.
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={!password.trim()}>
              Access File
            </Button>
          </form>
          
          <div className="text-center">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Go to Home
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md space-y-6 p-5 text-center sm:p-8">
          <BrandLogo className="justify-center" showText={false} imageClassName="h-14 w-14" />
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${isExpired ? 'bg-warning/10' : 'bg-destructive/10'}`}>
            {isExpired ? (
              <Clock className="h-8 w-8 text-warning" />
            ) : (
              <FileText className="h-8 w-8 text-destructive" />
            )}
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">
              {isExpired ? 'Link Expired' : 'File Not Found'}
            </h1>
            <p className="text-muted-foreground">
              {isExpired 
                ? 'This share link has expired. Please request a new link from the file owner.'
                : (error || 'This file may have been removed or is no longer shared.')}
            </p>
          </div>
          <Button asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Go to Home
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  const isPDF = file.type === 'application/pdf';
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  const isText = file.type.startsWith('text/') || 
    ['application/json', 'application/javascript', 'application/xml'].includes(file.type);

  const renderPreview = () => {
    if (isPDF) {
      return <PDFViewer fileUrl={file.url} fileName={file.name} />;
    }

    if (isImage) {
      return (
        <Card className="p-4 flex items-center justify-center bg-muted/30">
          <img
            src={file.url}
            alt={file.name}
            className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
          />
        </Card>
      );
    }

    if (isVideo) {
      return (
        <Card className="p-4 bg-muted/30">
          <video
            src={file.url}
            controls
            className="w-full max-h-[70vh] rounded-lg"
          >
            Your browser does not support the video tag.
          </video>
        </Card>
      );
    }

    // Default: show download card
    return (
      <Card className="p-8 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          {isText ? (
            <FileCode className="h-10 w-10 text-primary" />
          ) : (
            <FileText className="h-10 w-10 text-primary" />
          )}
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{file.name}</h2>
          <p className="text-muted-foreground">
            Preview not available for this file type. Click download to view the file.
          </p>
        </div>
        <Button onClick={handleDownload} size="lg">
          <Download className="mr-2 h-5 w-5" />
          Download File
        </Button>
      </Card>
    );
  };

  const getFileIcon = () => {
    if (isImage) return <Image className="h-6 w-6 text-primary" />;
    if (isVideo) return <Video className="h-6 w-6 text-primary" />;
    return <FileText className="h-6 w-6 text-primary" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto flex min-h-16 items-center justify-between gap-3 px-3 py-2 sm:px-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <BrandLogo showText={false} imageClassName="h-9 w-9" />
            {getFileIcon()}
            <div className="min-w-0 flex-1">
              <h1 className="font-semibold truncate text-sm md:text-base">{file.name}</h1>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <Home className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6">
        {renderPreview()}
      </main>
    </div>
  );
};

export default SharedView;

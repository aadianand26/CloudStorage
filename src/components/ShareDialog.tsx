import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Check, Clock, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ShareDialogProps {
  file: {
    id: string;
    name: string;
    storage_path: string;
    is_shared?: boolean;
    share_expires_at?: string | null;
    share_password?: string | null;
  } | null;
  open: boolean;
  onClose: () => void;
}

const EXPIRATION_OPTIONS = [
  { value: 'never', label: 'Never expires' },
  { value: '1h', label: '1 hour' },
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
];

// Hash password using Web Crypto API (SHA-256)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const ShareDialog = ({ file, open, onClose }: ShareDialogProps) => {
  const [isShared, setIsShared] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expiration, setExpiration] = useState('never');
  const [currentExpiry, setCurrentExpiry] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [isPasswordEnabled, setIsPasswordEnabled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (file) {
      setIsShared(file.is_shared || false);
      setCurrentExpiry(file.share_expires_at || null);
      setIsPasswordEnabled(!!file.share_password);
      // Don't show the hashed password - keep empty for new entry
      setPassword('');
      if (file.is_shared) {
        generateShareUrl();
      }
    }
  }, [file]);

  const generateShareUrl = async () => {
    if (!file) return;

    try {
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .select('share_token, share_expires_at, share_password')
        .eq('id', file.id)
        .single();

      if (fileError) throw fileError;

      const baseUrl = window.location.origin;
      const shareLink = `${baseUrl}/share?token=${fileData.share_token}`;
      setShareUrl(shareLink);
      setCurrentExpiry(fileData.share_expires_at);
      setIsPasswordEnabled(!!fileData.share_password);
      setPassword(fileData.share_password || '');
    } catch (error) {
      console.error('Error generating share URL:', error);
      toast({
        title: "Error",
        description: "Failed to generate share link",
        variant: "destructive",
      });
    }
  };

  const getExpirationDate = (value: string): string | null => {
    if (value === 'never') return null;
    
    const now = new Date();
    switch (value) {
      case '1h':
        return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
      case '24h':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return null;
    }
  };

  const toggleShare = async (nextShared: boolean) => {
    if (!file) return;

    const prev = {
      isShared,
      shareUrl,
      currentExpiry,
      isPasswordEnabled,
      password,
    };

    // Optimistic UI for a snappy toggle
    setIsShared(nextShared);
    setLoading(true);

    try {
      const expiresAt = nextShared ? getExpirationDate(expiration) : null;
      // Hash password before storing
      const sharePassword = nextShared && isPasswordEnabled && password.trim() 
        ? await hashPassword(password.trim()) 
        : null;

      const { error } = await supabase
        .from('files')
        .update({
          is_shared: nextShared,
          share_expires_at: expiresAt,
          share_password: nextShared ? sharePassword : null,
        })
        .eq('id', file.id);

      if (error) throw error;

      if (nextShared) {
        setCurrentExpiry(expiresAt);
        await generateShareUrl();
        toast({
          title: 'Sharing enabled',
          description: expiresAt
            ? `File is shareable until ${new Date(expiresAt).toLocaleString()}`
            : 'File is now shareable via link',
        });
      } else {
        setShareUrl('');
        setCurrentExpiry(null);
        setPassword('');
        setIsPasswordEnabled(false);
        setExpiration('never');
        toast({
          title: 'Sharing disabled',
          description: 'Share link has been revoked',
        });
      }
    } catch (error) {
      console.error('Error toggling share:', error);
      setIsShared(prev.isShared);
      setShareUrl(prev.shareUrl);
      setCurrentExpiry(prev.currentExpiry);
      setIsPasswordEnabled(prev.isPasswordEnabled);
      setPassword(prev.password);
      toast({
        title: 'Error',
        description: 'Failed to update sharing settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateExpiration = async (value: string) => {
    if (!file || !isShared) return;

    setLoading(true);
    setExpiration(value);
    
    try {
      const expiresAt = getExpirationDate(value);
      
      const { error } = await supabase
        .from('files')
        .update({ share_expires_at: expiresAt })
        .eq('id', file.id);

      if (error) throw error;

      setCurrentExpiry(expiresAt);
      toast({
        title: "Expiration updated",
        description: expiresAt 
          ? `Link expires ${new Date(expiresAt).toLocaleString()}`
          : "Link never expires",
      });
    } catch (error) {
      console.error('Error updating expiration:', error);
      toast({
        title: "Error",
        description: "Failed to update expiration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordProtection = async () => {
    if (!file || !isShared) return;

    const newPasswordEnabled = !isPasswordEnabled;
    setIsPasswordEnabled(newPasswordEnabled);

    if (!newPasswordEnabled) {
      // Remove password protection
      setLoading(true);
      try {
        const { error } = await supabase
          .from('files')
          .update({ share_password: null })
          .eq('id', file.id);

        if (error) throw error;

        setPassword('');
        toast({
          title: "Password removed",
          description: "Anyone with the link can now access the file",
        });
      } catch (error) {
        console.error('Error removing password:', error);
        setIsPasswordEnabled(true);
        toast({
          title: "Error",
          description: "Failed to remove password",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const savePassword = async () => {
    if (!file || !isShared || !password.trim()) return;

    setLoading(true);
    try {
      // Hash password before storing
      const hashedPassword = await hashPassword(password.trim());
      
      const { error } = await supabase
        .from('files')
        .update({ share_password: hashedPassword })
        .eq('id', file.id);

      if (error) throw error;

      toast({
        title: "Password set",
        description: "The share link is now password protected",
      });
    } catch (error) {
      console.error('Error setting password:', error);
      toast({
        title: "Error",
        description: "Failed to set password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Share link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const formatExpiry = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    if (date < new Date()) return 'Expired';
    return date.toLocaleString();
  };

  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share File</DialogTitle>
          <DialogDescription>
            Share "{file.name}" with others via a secure link
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="share-toggle">Enable sharing</Label>
              <p className="text-sm text-muted-foreground">
                Generate a shareable link for this file
              </p>
            </div>
            <Switch
              id="share-toggle"
              checked={isShared}
              onCheckedChange={toggleShare}
              disabled={loading}
            />
          </div>

          {!isShared && (
            <>
              <div className="space-y-2">
                <Label>Link expiration</Label>
                <Select value={expiration} onValueChange={setExpiration}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select expiration" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRATION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="password-toggle">Password protection</Label>
                  <p className="text-sm text-muted-foreground">
                    Require a password to access
                  </p>
                </div>
                <Switch
                  id="password-toggle"
                  checked={isPasswordEnabled}
                  onCheckedChange={setIsPasswordEnabled}
                />
              </div>

              {isPasswordEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="password-input">Password</Label>
                  <Input
                    id="password-input"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              )}
            </>
          )}

          {isShared && shareUrl && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="share-url">Share Link</Label>
                <div className="flex space-x-2">
                  <Input
                    id="share-url"
                    value={shareUrl}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Link expiration</Label>
                <Select value={expiration} onValueChange={updateExpiration} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select expiration" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRATION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Expires: {formatExpiry(currentExpiry)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="password-toggle-active" className="flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5" />
                      Password protection
                    </Label>
                  </div>
                  <Switch
                    id="password-toggle-active"
                    checked={isPasswordEnabled}
                    onCheckedChange={togglePasswordProtection}
                    disabled={loading}
                  />
                </div>

                {isPasswordEnabled && (
                  <div className="flex space-x-2">
                    <Input
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={savePassword}
                      disabled={loading || !password.trim()}
                    >
                      Save
                    </Button>
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                {isPasswordEnabled 
                  ? "Anyone with this link and the password can view and download the file"
                  : "Anyone with this link can view and download the file"}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
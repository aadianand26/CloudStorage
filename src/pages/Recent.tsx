import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, FileIcon, Eye, Download, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { FileViewer } from "@/components/FileViewer";
import { ShareDialog } from "@/components/ShareDialog";

interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  storage_path: string;
  last_accessed_at: string;
  url: string | null;
  is_shared?: boolean;
}

const Recent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerFile, setViewerFile] = useState<StoredFile | null>(null);
  const [shareFile, setShareFile] = useState<StoredFile | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchRecentFiles = async () => {
      // Only get files accessed in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await (supabase
        .from('files') as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .gte('last_accessed_at', thirtyDaysAgo.toISOString())
        .order('last_accessed_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching recent files:', error);
        toast.error('Failed to load recent files');
      } else {
        setFiles(data || []);
      }
      setLoading(false);
    };

    fetchRecentFiles();

    const channel = supabase
      .channel('recent-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'files',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Avoid refetch loops while preview is open
          if (!viewerFile) {
            fetchRecentFiles();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, viewerFile]);

  const downloadFile = async (file: StoredFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('user-files')
        .download(file.storage_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`${file.name} is downloading`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <DashboardLayout onSearch={setSearchTerm}>
        <FileViewer
          file={viewerFile}
          open={!!viewerFile}
          onClose={() => setViewerFile(null)}
          onDownload={() => {
            if (viewerFile) downloadFile(viewerFile);
          }}
          onShare={() => {
            setShareFile(viewerFile);
            setViewerFile(null);
          }}
        />

        <ShareDialog
          file={shareFile}
          open={!!shareFile}
          onClose={() => setShareFile(null)}
        />

        <section className="px-6 pt-6 pb-12">
          <div className="max-w-7xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recently Accessed Files
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Files you've opened in the last 30 days
                </p>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : filteredFiles.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No recent files. Open a file to see it here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredFiles.map((file) => (
                        <Card
                          key={file.id}
                          className="p-4 hover:border-primary/30 transition-colors cursor-pointer"
                          role="button"
                          tabIndex={0}
                          onClick={() => setViewerFile(file)}
                          onKeyDown={(e) => { if (e.key === 'Enter') setViewerFile(file); }}
                        >
                        <div className="flex items-start gap-3">
                          <FileIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate mb-1">{file.name}</p>
                            <p className="text-sm text-muted-foreground mb-2">
                              {(file.size / 1024).toFixed(2)} KB
                            </p>
                            <p className="text-xs text-muted-foreground mb-3">
                              Accessed: {new Date(file.last_accessed_at).toLocaleDateString()}
                            </p>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setViewerFile(file); }}
                                className="h-7 px-2"
                                aria-label="Preview file"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShareFile(file); }}
                        className="h-7 w-7 p-0"
                      >
                        <Share2 className="h-3 w-3" />
                              </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); downloadFile(file); }}
                        className="h-7 w-7 p-0"
                      >
                        <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default Recent;

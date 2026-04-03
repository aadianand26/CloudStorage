import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2, FileIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  created_at: string;
  url: string | null;
}

const Shared = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchSharedFiles = async () => {
      const { data, error } = await (supabase
        .from('files') as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('is_shared', true)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching shared files:', error);
        toast.error('Failed to load shared files');
      } else {
        setFiles(data || []);
      }
      setLoading(false);
    };

    fetchSharedFiles();

    const channel = supabase
      .channel('shared-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'files',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchSharedFiles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleUnshare = async (fileId: string) => {
    const { error } = await (supabase
      .from('files') as any)
      .update({ is_shared: false })
      .eq('id', fileId);

    if (error) {
      toast.error('Failed to unshare file');
    } else {
      toast.success('File unshared');
    }
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <DashboardLayout onSearch={setSearchTerm}>
        <section className="px-6 pt-6 pb-12">
          <div className="max-w-7xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Shared Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : filteredFiles.length === 0 ? (
                  <p className="text-muted-foreground">No shared files yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredFiles.map((file) => (
                      <Card key={file.id} className="p-4">
                        <div className="flex items-start gap-3">
                          <FileIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{file.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(file.size / 1024).toFixed(2)} KB
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(file.created_at).toLocaleDateString()}
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-3"
                              onClick={() => handleUnshare(file.id)}
                            >
                              <Share2 className="h-3 w-3 mr-1" />
                              Unshare
                            </Button>
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

export default Shared;

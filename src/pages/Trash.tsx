import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, FileIcon, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type StoredFile = Tables<"files">;

const Trash = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchDeletedFiles = async () => {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', true)
        .order('deleted_at', { ascending: false });

      if (error) {
        console.error('Error fetching deleted files:', error);
        toast.error('Failed to load deleted files');
      } else {
        setFiles(data || []);
      }
      setLoading(false);
    };

    fetchDeletedFiles();

    const channel = supabase
      .channel('trash-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'files',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchDeletedFiles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleRestore = async (fileId: string) => {
    const { error } = await supabase
      .from('files')
      .update({ is_deleted: false, deleted_at: null })
      .eq('id', fileId);

    if (error) {
      toast.error('Failed to restore file');
    } else {
      toast.success('File restored successfully');
    }
  };

  const handlePermanentDelete = async (fileId: string) => {
    const { error } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId);

    if (error) {
      toast.error('Failed to delete file permanently');
    } else {
      toast.success('File deleted permanently');
    }
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <DashboardLayout onSearch={setSearchTerm}>
        <section className="page-shell">
          <div className="page-container">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Trash
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : filteredFiles.length === 0 ? (
                  <p className="text-muted-foreground">No deleted files.</p>
                ) : (
                  <div className="responsive-card-grid">
                    {filteredFiles.map((file) => (
                      <Card key={file.id} className="min-w-0 p-4">
                        <div className="flex items-start gap-3">
                          <FileIcon className="h-8 w-8 flex-shrink-0 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="break-words font-medium">{file.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(file.size / 1024).toFixed(2)} KB
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Deleted: {new Date(file.deleted_at).toLocaleDateString()}
                            </p>
                            <div className="mt-3 grid gap-2 sm:flex">
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() => handleRestore(file.id)}
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Restore
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="w-full sm:w-auto"
                                onClick={() => handlePermanentDelete(file.id)}
                              >
                                Delete
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

export default Trash;

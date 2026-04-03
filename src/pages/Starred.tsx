import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, FileIcon } from "lucide-react";
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

const Starred = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchStarredFiles = async () => {
      const { data, error } = await (supabase
        .from('files') as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('is_starred', true)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching starred files:', error);
        toast.error('Failed to load starred files');
      } else {
        setFiles(data || []);
      }
      setLoading(false);
    };

    fetchStarredFiles();

    const channel = supabase
      .channel('starred-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'files',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchStarredFiles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleUnstar = async (fileId: string) => {
    const { error } = await (supabase
      .from('files') as any)
      .update({ is_starred: false })
      .eq('id', fileId);

    if (error) {
      toast.error('Failed to unstar file');
    } else {
      toast.success('File unstarred');
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
                  <Star className="h-5 w-5" />
                  Starred Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : filteredFiles.length === 0 ? (
                  <p className="text-muted-foreground">No starred files yet.</p>
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
                              onClick={() => handleUnstar(file.id)}
                            >
                              <Star className="h-3 w-3 mr-1" />
                              Unstar
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

export default Starred;

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DuplicateGroup {
  name: string;
  files: Array<{
    id: string;
    name: string;
    size: number;
    created_at: string;
  }>;
  totalSize: number;
}

export const DuplicateDetection = () => {
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const detectDuplicates = async () => {
    if (!user) return;

    try {
      const { data: files, error } = await supabase
        .from('files')
        .select('id, name, size, created_at')
        .eq('user_id', user.id)
        .eq('is_deleted', false);

      if (error) throw error;

      // Group files by name
      const fileGroups: Record<string, typeof files> = {};
      files.forEach(file => {
        if (!fileGroups[file.name]) {
          fileGroups[file.name] = [];
        }
        fileGroups[file.name].push(file);
      });

      // Find duplicates (files with same name)
      const duplicateGroups: DuplicateGroup[] = Object.entries(fileGroups)
        .filter(([_, files]) => files.length > 1)
        .map(([name, files]) => ({
          name,
          files: files.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          ),
          totalSize: files.reduce((sum, f) => sum + f.size, 0)
        }));

      setDuplicates(duplicateGroups);
    } catch (error) {
      console.error('Error detecting duplicates:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (fileId: string, fileName: string) => {
    try {
      const { error } = await supabase
        .from('files')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', fileId);

      if (error) throw error;

      toast({
        title: "Moved to Trash",
        description: `${fileName} has been moved to Trash.`,
      });

      // Refresh duplicates
      detectDuplicates();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete file. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    detectDuplicates();
  }, [user]);

  const totalWastedSpace = duplicates.reduce((sum, group) => {
    // Calculate wasted space (total size minus the size of one file)
    return sum + (group.totalSize - group.files[0].size);
  }, 0);

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center space-x-2">
            <Copy className="h-5 w-5 text-orange-500" />
            <span>Duplicate Detection</span>
          </CardTitle>
          {duplicates.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {duplicates.length} duplicate{duplicates.length > 1 ? 's' : ''} found
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Scanning for duplicates...</p>
          </div>
        ) : duplicates.length === 0 ? (
          <div className="text-center py-6">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-semibold mb-2">No Duplicates Found</h3>
            <p className="text-sm text-muted-foreground">
              Your files are well organized. No duplicate files detected.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center space-x-2 text-orange-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  You can save {formatFileSize(totalWastedSpace)} by removing duplicates
                </span>
              </div>
            </div>

            {duplicates.map((group, index) => (
              <div key={index} className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-sm">{group.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {group.files.length} copies • {formatFileSize(group.totalSize)} total
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {group.files.map((file, fileIndex) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs"
                    >
                      <div>
                        <span className={fileIndex === 0 ? "font-medium" : ""}>
                          {fileIndex === 0 ? "Latest" : `Copy ${fileIndex}`}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          {new Date(file.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {fileIndex > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteFile(file.id, file.name)}
                          className="h-6 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

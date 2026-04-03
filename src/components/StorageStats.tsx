import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { HardDrive, FileText, Image, Video } from 'lucide-react';

interface StorageData {
  totalFiles: number;
  totalSize: number;
  fileTypes: {
    documents: number;
    images: number;
    videos: number;
    others: number;
  };
}

export const StorageStats = () => {
  const [storageData, setStorageData] = useState<StorageData>({
    totalFiles: 0,
    totalSize: 0,
    fileTypes: { documents: 0, images: 0, videos: 0, others: 0 }
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const fetchStorageStats = async () => {
    if (!user) return;

    try {
      const { data: files, error } = await supabase
        .from('files')
        .select('size, type')
        .eq('user_id', user.id)
        .eq('is_deleted', false);

      if (error) throw error;

      let totalSize = 0;
      const fileTypes = { documents: 0, images: 0, videos: 0, others: 0 };

      files.forEach(file => {
        totalSize += file.size;
        
        if (file.type.startsWith('image/')) {
          fileTypes.images += 1;
        } else if (file.type.startsWith('video/')) {
          fileTypes.videos += 1;
        } else if (file.type.includes('document') || file.type.includes('text') || file.type.includes('pdf')) {
          fileTypes.documents += 1;
        } else {
          fileTypes.others += 1;
        }
      });

      setStorageData({
        totalFiles: files.length,
        totalSize,
        fileTypes
      });
    } catch (error) {
      console.error('Error fetching storage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorageStats();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('storage-stats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'files',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          console.log('Storage stats updated');
          fetchStorageStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const stats = [
    {
      title: 'Total Storage',
      value: loading ? 'Loading...' : formatFileSize(storageData.totalSize),
      icon: <HardDrive className="h-6 w-6 text-blue-500" />,
      description: `${storageData.totalFiles} files`
    },
    {
      title: 'Documents',
      value: loading ? '-' : storageData.fileTypes.documents.toString(),
      icon: <FileText className="h-6 w-6 text-green-500" />,
      description: 'PDF, DOC, TXT files'
    },
    {
      title: 'Images',
      value: loading ? '-' : storageData.fileTypes.images.toString(),
      icon: <Image className="h-6 w-6 text-purple-500" />,
      description: 'JPG, PNG, GIF files'
    },
    {
      title: 'Videos',
      value: loading ? '-' : storageData.fileTypes.videos.toString(),
      icon: <Video className="h-6 w-6 text-red-500" />,
      description: 'MP4, AVI, MOV files'
    }
  ];

  return (
    <>
      {stats.map((stat, index) => (
        <Card key={index} className="glass-card hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                {stat.icon}
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
};
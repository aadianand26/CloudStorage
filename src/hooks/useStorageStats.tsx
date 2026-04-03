import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const useStorageStats = () => {
  const [totalSize, setTotalSize] = useState(0);
  const [fileCount, setFileCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const STORAGE_LIMIT = 5 * 1024 * 1024; // 5 MB in bytes
  const WARNING_THRESHOLD = 80; // 80%

  const fetchStorageStats = useCallback(async () => {
    if (!user) return;

    try {
      const { data: files, error } = await supabase
        .from('files')
        .select('size')
        .eq('user_id', user.id)
        .eq('is_deleted', false);

      if (error) throw error;

      const total = files.reduce((acc, file) => acc + file.size, 0);
      setTotalSize(total);
      setFileCount(files.length);
    } catch (error) {
      console.error('Error fetching storage stats:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStorageStats();
    
    if (!user?.id) return;

    const channel = supabase
      .channel('storage-stats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'files',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchStorageStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchStorageStats]);

  const percentage = Math.min(Math.round((totalSize / STORAGE_LIMIT) * 100), 100);
  const usedFormatted = formatBytes(totalSize);
  const limitFormatted = formatBytes(STORAGE_LIMIT);
  const isWarning = percentage >= WARNING_THRESHOLD;

  return { 
    totalSize, 
    percentage, 
    loading, 
    usedFormatted, 
    limitFormatted, 
    fileCount,
    storageLimit: STORAGE_LIMIT,
    isWarning
  };
};

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";
import { formatBytes, isDocumentFile, isImageFile, isVideoFile } from "@/lib/file-utils";

type WorkspaceFile = Tables<"files">;

export const useWorkspaceFiles = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFiles = useCallback(async () => {
    if (!user) {
      setFiles([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setFiles(data ?? []);
    } catch (error) {
      console.error("Error loading workspace files:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFiles();

    if (!user?.id) return;

    const channel = supabase
      .channel(`workspace-files-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "files",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchFiles();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchFiles, user]);

  const metrics = useMemo(() => {
    const activeFiles = files.filter((file) => !file.is_deleted);
    const deletedFiles = files.filter((file) => file.is_deleted);
    const sharedFiles = activeFiles.filter((file) => file.is_shared);
    const starredFiles = activeFiles.filter((file) => file.is_starred);
    const documents = activeFiles.filter((file) => isDocumentFile(file.type));
    const images = activeFiles.filter((file) => isImageFile(file.type));
    const videos = activeFiles.filter((file) => isVideoFile(file.type));
    const totalSize = activeFiles.reduce((sum, file) => sum + file.size, 0);
    const recentFiles = activeFiles.filter((file) => {
      const diff = Date.now() - new Date(file.created_at).getTime();
      return diff <= 7 * 24 * 60 * 60 * 1000;
    });
    const recentlyViewed = activeFiles.filter((file) => {
      const diff = Date.now() - new Date(file.last_accessed_at).getTime();
      return diff <= 7 * 24 * 60 * 60 * 1000;
    });
    const protectedShares = sharedFiles.filter((file) => !!file.share_password || !!file.share_expires_at);

    return {
      activeFiles,
      deletedFiles,
      sharedFiles,
      starredFiles,
      documents,
      images,
      videos,
      recentFiles,
      recentlyViewed,
      protectedShares,
      totalSize,
      totalSizeLabel: formatBytes(totalSize),
    };
  }, [files]);

  return {
    files,
    loading,
    refetch: fetchFiles,
    ...metrics,
  };
};

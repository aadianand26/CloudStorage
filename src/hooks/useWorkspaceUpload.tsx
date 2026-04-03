import { useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { extractPdfText, isUsableText } from "@/lib/pdfText";

export interface UploadingFile {
  file: File;
  progress: number;
  uploaded: boolean;
  id?: string;
}

export const ACCEPT_STRING = ".pdf,image/*";

export const useWorkspaceUpload = () => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const isValidFileType = useCallback((file: File) => {
    return file.type === "application/pdf" || file.type.startsWith("image/");
  }, []);

  const uploadFile = useCallback(
    async (file: File): Promise<string | null> => {
      if (!user) return null;

      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from("user-files").upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data, error: dbError } = await supabase
        .from("files")
        .insert({
          user_id: user.id,
          name: file.name,
          size: file.size,
          type: file.type,
          storage_path: filePath,
        })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      if (file.type === "application/pdf") {
        void (async () => {
          try {
            const buffer = await file.arrayBuffer();
            const extracted = await extractPdfText(buffer, { maxPages: 12 });
            if (!isUsableText(extracted)) return;

            const content = extracted.length > 50_000 ? extracted.slice(0, 50_000) : extracted;

            const { error: updateError } = await supabase
              .from("files")
              .update({ content })
              .eq("id", data.id);

            if (updateError) {
              console.error("PDF text save error:", updateError);
            }
          } catch (error) {
            console.error("PDF text extraction failed:", error);
          }
        })();
      } else if (file.type.startsWith("image/")) {
        try {
          supabase.functions
            .invoke("extract-text", {
              body: {
                fileId: data.id,
                storagePath: filePath,
                fileType: file.type,
              },
            })
            .catch((error) => {
              console.error("Text extraction failed:", error);
            });
        } catch (error) {
          console.error("Failed to trigger text extraction:", error);
        }
      }

      return data.id;
    },
    [user],
  );

  const handleFiles = useCallback(
    async (incomingFiles: FileList | File[]) => {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to upload files.",
          variant: "destructive",
        });
        return;
      }

      const fileArray = Array.from(incomingFiles);
      const validFiles = fileArray.filter(isValidFileType);
      const invalidFiles = fileArray.filter((file) => !isValidFileType(file));

      if (invalidFiles.length > 0) {
        toast({
          title: "Invalid file type",
          description: `Only PDF and image files are allowed. ${invalidFiles.length} file(s) skipped.`,
          variant: "destructive",
        });
      }

      if (validFiles.length === 0) return;

      const newUploadingFiles: UploadingFile[] = validFiles.map((file) => ({
        file,
        progress: 0,
        uploaded: false,
      }));

      setUploadingFiles((previous) => [...previous, ...newUploadingFiles]);

      for (const fileData of newUploadingFiles) {
        try {
          const progressInterval = setInterval(() => {
            setUploadingFiles((previous) =>
              previous.map((currentFile) =>
                currentFile.file === fileData.file && !currentFile.uploaded
                  ? { ...currentFile, progress: Math.min(currentFile.progress + 10, 90) }
                  : currentFile,
              ),
            );
          }, 100);

          const fileId = await uploadFile(fileData.file);

          clearInterval(progressInterval);

          setUploadingFiles((previous) =>
            previous.map((currentFile) =>
              currentFile.file === fileData.file
                ? { ...currentFile, progress: 100, uploaded: true, id: fileId || undefined }
                : currentFile,
            ),
          );

          toast({
            title: "Upload successful",
            description: `${fileData.file.name} has been uploaded.`,
          });
        } catch (error) {
          console.error("Upload error:", error);
          setUploadingFiles((previous) => previous.filter((currentFile) => currentFile.file !== fileData.file));

          toast({
            title: "Upload failed",
            description: `Failed to upload ${fileData.file.name}. Please try again.`,
            variant: "destructive",
          });
        }
      }

      setTimeout(() => {
        setUploadingFiles((previous) => previous.filter((file) => !file.uploaded));
      }, 3000);
    },
    [isValidFileType, toast, uploadFile, user],
  );

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files) {
        void handleFiles(event.target.files);
      }
      event.target.value = "";
    },
    [handleFiles],
  );

  return {
    uploadingFiles,
    handleFiles,
    handleFileSelect,
    isValidFileType,
  };
};

import type { Tables } from "@/integrations/supabase/types";

export type WorkspaceFile = Tables<"files">;
export type WorkspaceProfile = Tables<"profiles">;

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;

  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

export const isDocumentFile = (type: string) =>
  type.includes("document") ||
  type.includes("pdf") ||
  type.includes("text") ||
  type.includes("word") ||
  type.includes("excel") ||
  type.includes("powerpoint");

export const isImageFile = (type: string) => type.startsWith("image/");

export const isVideoFile = (type: string) => type.startsWith("video/");

export const getFileKindLabel = (type: string) => {
  if (isImageFile(type)) return "Image";
  if (isVideoFile(type)) return "Video";
  if (type.includes("pdf")) return "PDF";
  if (isDocumentFile(type)) return "Document";
  return "File";
};

export const buildWorkspaceContext = (files: WorkspaceFile[], limit = 12) => {
  if (files.length === 0) {
    return "No files are currently stored in this workspace.";
  }

  return files
    .slice(0, limit)
    .map((file) => {
      const accessedAt = file.last_accessed_at
        ? new Date(file.last_accessed_at).toLocaleDateString()
        : "never";

      return [
        `Name: ${file.name}`,
        `Type: ${file.type}`,
        `Size: ${formatBytes(file.size)}`,
        `Uploaded: ${new Date(file.created_at).toLocaleDateString()}`,
        `Last accessed: ${accessedAt}`,
        file.content ? `Content preview: ${file.content.slice(0, 320)}` : null,
      ]
        .filter(Boolean)
        .join(" | ");
    })
    .join("\n");
};

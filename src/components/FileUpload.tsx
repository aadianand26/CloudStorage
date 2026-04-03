import { useCallback, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, FileText, Image, Upload } from 'lucide-react';
import { ACCEPT_STRING, useWorkspaceUpload } from '@/hooks/useWorkspaceUpload';

export const FileUpload = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  const { uploadingFiles, handleFiles, handleFileSelect, isValidFileType } = useWorkspaceUpload();

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-8 w-8 text-blue-500" />;
    if (file.type === 'application/pdf') return <FileText className="h-8 w-8 text-red-500" />;
    return <FileText className="h-8 w-8 text-muted-foreground" />;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      void handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  return (
    <Card className="glass-card">
      <CardContent className="p-2 md:p-3">
        <div
          className={`upload-zone px-3 py-3 md:px-4 ${
            isDragOver ? 'border-primary bg-accent/20' : ''
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Drop files here or <span className="font-medium text-foreground">browse from your device</span>
              </span>
            </div>

            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              accept={ACCEPT_STRING}
            />

            <Button asChild size="sm" className="h-9 w-full px-4 text-xs sm:h-8 sm:w-auto">
              <label htmlFor="file-upload" className="cursor-pointer">
                Browse
              </label>
            </Button>
          </div>
        </div>

        {uploadingFiles.length > 0 && (
          <div className="mt-4 space-y-3 md:mt-6 md:space-y-4">
            <h4 className="font-semibold">Uploading Files</h4>
            {uploadingFiles.map((uploadFile, index) => (
              <div key={index} className="flex flex-col gap-3 rounded-lg bg-muted/30 p-3 sm:flex-row sm:items-center sm:space-x-3 sm:gap-0">
                {uploadFile.uploaded ? (
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
                ) : (
                  getFileIcon(uploadFile.file)
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{uploadFile.file.name}</p>
                  <div className="mt-1">
                    <Progress value={uploadFile.progress} className="h-2" />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground sm:text-right">
                  {uploadFile.uploaded ? 'Complete' : `${uploadFile.progress}%`}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

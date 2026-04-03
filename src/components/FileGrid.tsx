import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { extractPdfText, isUsableText } from '@/lib/pdfText';
import { 
  FileText, 
  Image, 
  File, 
  Download, 
  Trash2, 
  Eye,
  Brain,
  FileIcon,
  Star,
  Share2,
  ArrowUpDown,
  LayoutGrid,
  List
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FileViewer } from './FileViewer';
import { ShareDialog } from './ShareDialog';

// AI summary cache and cooldown to avoid rate limits
const summaryCache = new Map<string, { text: string; ts: number }>();
let SUMMARY_COOLDOWN_UNTIL = 0;
const SUMMARY_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

interface FileData {
  id: string;
  name: string;
  size: number;
  type: string;
  storage_path: string;
  created_at: string;
  last_accessed_at?: string;
  summary?: string;
  is_starred?: boolean;
  is_shared?: boolean;
  is_deleted?: boolean;
  content?: string;
}

interface FileGridProps {
  searchTerm?: string;
  activeTab?: string;
}

type SortOption = 'name' | 'size' | 'created_at' | 'last_accessed_at';
type SortDirection = 'asc' | 'desc';
type FilterOption = 'all' | 'documents' | 'images';

export const FileGrid = ({ searchTerm: propSearchTerm = '', activeTab: propActiveTab = 'all' }: FileGridProps) => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [fileSummaries, setFileSummaries] = useState<Record<string, string>>({});
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [viewerFile, setViewerFile] = useState<FileData | null>(null);
  const [shareFile, setShareFile] = useState<FileData | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterType, setFilterType] = useState<FilterOption>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const { user } = useAuth();
  const { toast } = useToast();

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-6 w-6 text-blue-500" />;
    if (type.includes('pdf')) return <FileText className="h-6 w-6 text-red-500" />;
    if (type.includes('text') || type.includes('document')) return <FileText className="h-6 w-6 text-green-500" />;
    return <File className="h-6 w-6 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeLabel = (type: string) => {
    if (type.startsWith('image/')) return 'Image';
    if (type.startsWith('video/')) return 'Video';
    if (type.includes('pdf')) return 'PDF';
    if (type.includes('document') || type.includes('text')) return 'Document';
    return 'File';
  };

  const fetchFiles = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: "Error",
        description: "Failed to load files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (file: FileData) => {
    try {
      const { data, error } = await supabase.storage
        .from('user-files')
        .download(file.storage_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: `${file.name} is downloading.`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Failed to download file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteFile = async (file: FileData) => {
    try {
      const { error: dbError } = await supabase
        .from('files')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', file.id);

      if (dbError) throw dbError;

      setFiles(prev => prev.filter(f => f.id !== file.id));
      
      toast({
        title: "Moved to Trash",
        description: `${file.name} has been moved to Trash.`,
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleStar = async (file: FileData) => {
    try {
      const { error } = await supabase
        .from('files')
        .update({ is_starred: !file.is_starred })
        .eq('id', file.id);

      if (error) throw error;

      toast({
        title: file.is_starred ? "Unstarred" : "Starred",
        description: `${file.name} ${file.is_starred ? 'removed from' : 'added to'} starred files.`,
      });
    } catch (error) {
      console.error('Star toggle error:', error);
      toast({
        title: "Action failed",
        description: "Failed to update file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const generateSummary = async (file: FileData) => {
    if (fileSummaries[file.id]) {
      // Remove summary if already exists
      setFileSummaries(prev => {
        const newSummaries = { ...prev };
        delete newSummaries[file.id];
        return newSummaries;
      });
      return;
    }

    // Global cooldown check
    if (Date.now() < SUMMARY_COOLDOWN_UNTIL) {
      toast({
        title: 'Please wait',
        description: 'AI is cooling down due to rate limits. Try again shortly.',
      });
      return;
    }

    // Cache check
    const cached = summaryCache.get(file.id);
    if (cached && Date.now() - cached.ts < SUMMARY_CACHE_DURATION) {
      setFileSummaries(prev => ({ ...prev, [file.id]: cached.text }));
      return;
    }

    try {
      setFileSummaries(prev => ({
        ...prev,
        [file.id]: 'loading'
      }));

      // Self-heal: if a PDF has missing/garbled text, extract real text client-side first
      // (and store only text in the DB; never store file/binary content).
      // Start with file content only if it's actually usable text
      let effectiveContent: string | null = isUsableText(file.content) ? file.content! : null;

      // Self-heal: if a PDF has missing/garbled text, extract real text client-side
      if (file.type === 'application/pdf' && !effectiveContent) {
        try {
          const { data: blob, error: dlError } = await supabase.storage
            .from('user-files')
            .download(file.storage_path);
          if (dlError) throw dlError;

          const buffer = await blob.arrayBuffer();
          const extracted = await extractPdfText(buffer, { maxPages: 12 });

          if (isUsableText(extracted)) {
            const content = extracted.length > 50_000 ? extracted.slice(0, 50_000) : extracted;
            effectiveContent = content;

            // Persist extracted text for future search + summaries
            await supabase
              .from('files')
              .update({ content })
              .eq('id', file.id);

            setFiles(prev => prev.map(f => (f.id === file.id ? { ...f, content } : f)));
          }
        } catch (e) {
          console.error('PDF self-heal extraction failed:', e);
        }
      }

      // For images without content, try server-side OCR extraction
      if (file.type.startsWith('image/') && !effectiveContent) {
        try {
          const { data: extractData } = await supabase.functions.invoke('extract-text', {
            body: { fileId: file.id, storagePath: file.storage_path, fileType: file.type }
          });
          if (extractData?.content && isUsableText(extractData.content)) {
            effectiveContent = extractData.content;
          }
        } catch (e) {
          console.error('Image OCR extraction failed:', e);
        }
      }

      const { data, error } = await supabase.functions.invoke('ai-analyze', {
        body: { 
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileContent: effectiveContent,
          analysisType: 'summary'
        }
      });

      if (error) throw error;

      const summaryText = String(data.analysis || '').trim();

      // Save result to cache
      summaryCache.set(file.id, { text: summaryText, ts: Date.now() });

      setFileSummaries(prev => ({
        ...prev,
        [file.id]: summaryText
      }));
    } catch (error: any) {
      console.error('AI summary error:', error);
      // If rate limited, set 1-minute cooldown to avoid repeated failures
      if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
        SUMMARY_COOLDOWN_UNTIL = Date.now() + 60_000;
        toast({
          title: 'Rate limit reached',
          description: 'Please wait a minute before trying summaries again.',
        });
      } else {
        toast({
          title: 'Summary failed',
          description: 'Failed to generate AI summary. Please try again.',
          variant: 'destructive',
        });
      }
      setFileSummaries(prev => {
        const newSummaries = { ...prev };
        delete newSummaries[file.id];
        return newSummaries;
      });
    }
  };

  // Fetch thumbnails for image files
  const fetchThumbnails = async (fileList: FileData[]) => {
    const imageFiles = fileList.filter(f => f.type.startsWith('image/'));
    const newThumbnails: Record<string, string> = {};

    for (const file of imageFiles) {
      if (thumbnails[file.id]) continue; // Skip if already loaded
      
      try {
        const { data } = await supabase.storage
          .from('user-files')
          .createSignedUrl(file.storage_path, 3600); // 1 hour expiry

        if (data?.signedUrl) {
          newThumbnails[file.id] = data.signedUrl;
        }
      } catch (error) {
        console.error('Thumbnail fetch error:', error);
      }
    }

    if (Object.keys(newThumbnails).length > 0) {
      setThumbnails(prev => ({ ...prev, ...newThumbnails }));
    }
  };

  useEffect(() => {
    fetchFiles();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('files-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'files',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          const newFile = payload.new as FileData;
          if (!newFile.is_deleted) {
            setFiles(prev => [newFile, ...prev]);
            // Fetch thumbnail for new image
            if (newFile.type.startsWith('image/')) {
              fetchThumbnails([newFile]);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'files',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          const updated = payload.new as FileData & { is_deleted?: boolean };
          setFiles(prev => {
            if (updated.is_deleted) {
              return prev.filter(f => f.id !== updated.id);
            }
            return prev.map(f => (f.id === updated.id ? { ...f, ...updated } : f));
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'files',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          const deleted = payload.old as { id: string };
          setFiles(prev => prev.filter(f => f.id !== deleted.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Fetch thumbnails when files change
  useEffect(() => {
    if (files.length > 0) {
      fetchThumbnails(files);
    }
  }, [files]);

  const filterFilesByType = (type: FilterOption) => {
    switch (type) {
      case 'documents':
        return files.filter(file => 
          file.type.includes('document') || 
          file.type.includes('pdf') || 
          file.type.includes('text') ||
          file.type.includes('word') ||
          file.type.includes('excel') ||
          file.type.includes('powerpoint')
        );
      case 'images':
        return files.filter(file => file.type.startsWith('image/'));
      default:
        return files;
    }
  };

  const sortFiles = (filesToSort: FileData[]) => {
    return [...filesToSort].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'last_accessed_at':
          const aTime = a.last_accessed_at ? new Date(a.last_accessed_at).getTime() : 0;
          const bTime = b.last_accessed_at ? new Date(b.last_accessed_at).getTime() : 0;
          comparison = aTime - bTime;
          break;
      }
      
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  };

  const filteredFiles = useMemo(() => {
    let result = filterFilesByType(filterType);
    
    if (propSearchTerm.trim()) {
      const searchLower = propSearchTerm.toLowerCase();
      result = result.filter(file =>
        file.name.toLowerCase().includes(searchLower) ||
        file.type.toLowerCase().includes(searchLower) ||
        (file.content && file.content.toLowerCase().includes(searchLower))
      );
    }
    
    return sortFiles(result);
  }, [files, filterType, propSearchTerm, sortBy, sortDirection]);

  const getFilterCounts = () => {
    return {
      all: files.length,
      documents: filterFilesByType('documents').length,
      images: filterFilesByType('images').length
    };
  };

  const filterCounts = getFilterCounts();

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  if (loading) {
    return (
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your files...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* File Viewer */}
      <FileViewer
        file={viewerFile}
        open={!!viewerFile}
        onClose={() => setViewerFile(null)}
        onDownload={() => {
          if (viewerFile) downloadFile(viewerFile);
        }}
        onShare={() => {
          setShareFile(viewerFile);
          setViewerFile(null);
        }}
      />

      {/* Share Dialog */}
      <ShareDialog
        file={shareFile}
        open={!!shareFile}
        onClose={() => setShareFile(null)}
      />

      {/* File Categories */}
      <Card className="glass-card">
        <CardContent className="p-3 md:p-6">
          {/* Filter and Sort Controls */}
          <div className="mb-4 flex flex-col gap-3 md:mb-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto">
              {/* File Type Filter Dropdown */}
              <Select value={filterType} onValueChange={(value: FilterOption) => setFilterType(value)}>
                <SelectTrigger className="w-full min-w-0 bg-background sm:w-[160px]">
                  <div className="flex items-center gap-2">
                    <FileIcon className="h-4 w-4" />
                    <SelectValue placeholder="Filter" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  <SelectItem value="all">
                    <span className="flex items-center gap-2">
                      All Files ({filterCounts.all})
                    </span>
                  </SelectItem>
                  <SelectItem value="documents">
                    <span className="flex items-center gap-2">
                      Documents ({filterCounts.documents})
                    </span>
                  </SelectItem>
                  <SelectItem value="images">
                    <span className="flex items-center gap-2">
                      Images ({filterCounts.images})
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="w-full min-w-0 bg-background sm:w-[180px]">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    <SelectValue placeholder="Sort by" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="size">Size</SelectItem>
                  <SelectItem value="created_at">Upload Date</SelectItem>
                  <SelectItem value="last_accessed_at">Last Accessed</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Direction Toggle */}
              <Button
                variant="outline"
                size="icon"
                onClick={toggleSortDirection}
                className="h-10 w-full shrink-0 sm:w-10"
                title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
              >
                <ArrowUpDown className={`h-4 w-4 transition-transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
              </Button>
            </div>

            <Badge variant="secondary" className="self-start text-xs md:text-sm lg:self-auto">{filteredFiles.length} files</Badge>
          </div>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold md:text-xl">
              {filterType === 'all' ? 'All Files' : 
               filterType === 'documents' ? 'Documents' : 'Images'}
            </h2>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 self-start rounded-lg bg-muted p-1 sm:self-auto">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 w-8 p-0"
                title="List view"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 w-8 p-0"
                title="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>

              {filteredFiles.length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <File className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-base md:text-lg font-semibold mb-2">
                    {files.length === 0 ? 'No files yet' : propSearchTerm ? 'No matching files' : `No ${propActiveTab} found`}
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground px-4">
                    {files.length === 0 
                      ? 'Upload some files to get started with AI-powered organization.'
                      : propSearchTerm 
                        ? 'Try adjusting your search terms.'
                        : `No ${propActiveTab} have been uploaded yet.`
                    }
                  </p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 md:gap-4">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className="file-item group flex h-full min-w-0 flex-col rounded-lg border border-border bg-card p-3 transition-colors cursor-pointer hover:border-primary/30"
                      role="button"
                      tabIndex={0}
                      onClick={() => setViewerFile(file)}
                      onKeyDown={(e) => { if (e.key === 'Enter') setViewerFile(file); }}
                    >
                      {/* Thumbnail / Icon */}
                      <div className="aspect-square w-full mb-3 rounded-lg overflow-hidden bg-muted/50 flex items-center justify-center">
                        {file.type.startsWith('image/') && thumbnails[file.id] ? (
                          <img 
                            src={thumbnails[file.id]} 
                            alt={file.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full">
                            {getFileIcon(file.type)}
                          </div>
                        )}
                      </div>
                      
                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate mb-1" title={file.name}>{file.name}</h3>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                        <Button
                          size="sm"
                          variant={file.is_starred ? "default" : "ghost"}
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleStar(file); }}
                          className="h-7 w-7 p-0"
                          title={file.is_starred ? "Unstar" : "Star"}
                        >
                          <Star className={`h-3 w-3 ${file.is_starred ? 'fill-current' : ''}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); downloadFile(file); }}
                          className="h-7 w-7 p-0"
                          title="Download"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteFile(file); }}
                          className="h-7 w-7 p-0 hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                    {filteredFiles.map((file) => (
                      <div
                        key={file.id}
                        className="file-item group cursor-pointer rounded-lg border border-border p-3 transition-colors hover:border-primary/30 md:p-4"
                        role="button"
                        tabIndex={0}
                        onClick={() => setViewerFile(file)}
                        onKeyDown={(e) => { if (e.key === 'Enter') setViewerFile(file); }}
                      >
                      <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center">
                        {/* Thumbnail */}
                        <div className="flex shrink-0 items-start gap-3 sm:gap-4 2xl:block">
                          {file.type.startsWith('image/') && thumbnails[file.id] ? (
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden bg-muted">
                              <img 
                                src={thumbnails[file.id]} 
                                alt={file.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-muted/50 flex items-center justify-center">
                              {getFileIcon(file.type)}
                            </div>
                          )}
                        </div>
                        
                        {/* File Info - takes remaining space */}
                        <div className="min-w-0 flex-1">
                          <h3 className="mb-1 break-words pr-1 text-sm font-medium md:text-base">{file.name}</h3>
                          <div className="grid gap-1 text-xs text-muted-foreground md:flex md:flex-wrap md:items-center md:gap-2">
                            <Badge variant="outline" className="w-fit text-xs">
                              {getFileTypeLabel(file.type)}
                            </Badge>
                            <span>{formatFileSize(file.size)}</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="hidden sm:inline">
                              Uploaded: {new Date(file.created_at).toLocaleDateString()}
                            </span>
                            {file.last_accessed_at && (
                              <>
                                <span className="hidden md:inline">•</span>
                                <span className="hidden md:inline">
                                  Last viewed: {new Date(file.last_accessed_at).toLocaleDateString()}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* Actions - fixed on right */}
                        <div className="flex w-full flex-shrink-0 flex-wrap items-center gap-1 border-t border-border/70 pt-3 sm:justify-end sm:border-t-0 sm:pt-0 2xl:ml-auto 2xl:w-auto">
                          <Button
                            size="sm"
                            variant={file.is_starred ? "default" : "ghost"}
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleStar(file); }}
                            className="h-7 w-7 md:h-8 md:w-8 p-0"
                            title={file.is_starred ? "Unstar" : "Star"}
                          >
                            <Star className={`h-3 w-3 md:h-4 md:w-4 ${file.is_starred ? 'fill-current' : ''}`} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setViewerFile(file); }}
                            className="h-7 w-7 md:h-8 md:w-8 p-0"
                            title="Preview"
                            aria-label="Preview file"
                          >
                            <Eye className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShareFile(file); }}
                            className="h-7 w-7 md:h-8 md:w-8 p-0"
                            title="Share"
                          >
                            <Share2 className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={fileSummaries[file.id] ? "default" : "ghost"}
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); generateSummary(file); }}
                            className="h-7 min-w-[80px] px-2 text-xs md:h-8 md:px-3"
                            title={fileSummaries[file.id] ? "Remove AI Summary" : "Generate AI Summary"}
                          >
                            <Brain className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                            <span className="sm:hidden">{fileSummaries[file.id] ? "Hide" : "AI"}</span>
                            <span className="hidden sm:inline">{fileSummaries[file.id] ? "Hide" : "Summary"}</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); downloadFile(file); }}
                            className="h-7 w-7 md:h-8 md:w-8 p-0"
                            title="Download"
                          >
                            <Download className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteFile(file); }}
                            className="h-7 w-7 md:h-8 md:w-8 p-0 hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* AI Summary Display */}
                      {fileSummaries[file.id] && (
                        <div className="mt-3 p-3 bg-accent/10 rounded-lg border border-accent/20">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="flex items-center space-x-2">
                              <Brain className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">AI Summary</span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => generateSummary(file)}
                              className="h-6 w-6 p-0"
                            >
                              ×
                            </Button>
                          </div>
                          {fileSummaries[file.id] === 'loading' ? (
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                              <span className="text-sm text-muted-foreground">Analyzing...</span>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              {fileSummaries[file.id]}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
        </CardContent>
      </Card>
    </div>
  );
};

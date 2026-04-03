import { useState, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Search, PanelLeft, Maximize, Minimize } from 'lucide-react';
import { cn } from '@/lib/utils';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
}

export const PDFViewer = ({ fileUrl, fileName }: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [searchText, setSearchText] = useState<string>('');
  const [showThumbnails, setShowThumbnails] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => {
      const newPage = prevPageNumber + offset;
      return Math.max(1, Math.min(newPage, numPages));
    });
  };

  const zoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.25, 3.0));
  };

  const zoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.25, 0.5));
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  const goToPage = (page: number) => {
    setPageNumber(page);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full w-full bg-background">
      {/* PDF Controls */}
      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-2 md:p-4 bg-background border-b">
        {/* Top Row on Mobile / Left Side on Desktop */}
        <div className="flex items-center justify-between md:justify-start gap-2 flex-wrap">
          {/* Thumbnail Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowThumbnails(!showThumbnails)}
            title="Toggle thumbnails"
            className="shrink-0 h-8 w-8 md:h-10 md:w-10"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={previousPage}
              disabled={pageNumber <= 1}
              className="h-8 w-8 md:h-10 md:w-10"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs md:text-sm whitespace-nowrap">
              {pageNumber}/{numPages || '?'}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={nextPage}
              disabled={pageNumber >= numPages}
              className="h-8 w-8 md:h-10 md:w-10"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={zoomOut}
              disabled={scale <= 0.5}
              className="h-8 w-8 md:h-10 md:w-10"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs md:text-sm whitespace-nowrap">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={zoomIn}
              disabled={scale >= 3.0}
              className="h-8 w-8 md:h-10 md:w-10"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* Fullscreen Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            className="h-8 w-8 md:h-10 md:w-10 shrink-0"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>

        {/* Search - Full Width on Mobile / Right Side on Desktop */}
        <div className="flex items-center gap-2 flex-1 md:max-w-xs">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="flex-1 h-8 md:h-10 text-sm"
          />
        </div>
      </div>

      {/* PDF Document with Thumbnails */}
      <div className="flex-1 flex overflow-hidden">
        {/* Thumbnail Sidebar */}
        {showThumbnails && (
          <div className="w-24 md:w-48 border-r bg-background overflow-y-auto p-1 md:p-2 space-y-2">
            <Document
              file={fileUrl}
              loading={null}
              error={null}
            >
              {Array.from(new Array(numPages), (_, index) => (
                <button
                  key={`thumb_${index + 1}`}
                  onClick={() => goToPage(index + 1)}
                  className={cn(
                    "w-full border rounded p-1 transition-all hover:border-primary",
                    pageNumber === index + 1 ? "border-primary ring-2 ring-primary" : "border-border"
                  )}
                >
                  <Page
                    pageNumber={index + 1}
                    width={window.innerWidth < 768 ? 80 : 160}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    loading={
                      <div className="flex items-center justify-center h-16 md:h-24 bg-muted">
                        <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-primary"></div>
                      </div>
                    }
                  />
                  <p className="text-xs text-center mt-1 text-muted-foreground">
                    {index + 1}
                  </p>
                </button>
              ))}
            </Document>
          </div>
        )}

        {/* Main PDF Viewer */}
        <div className="flex-1 overflow-auto bg-muted/20 flex items-start justify-center p-2 md:p-4">
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => console.error('Error loading PDF:', error)}
            loading={
              <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            }
            error={
              <div className="flex flex-col items-center justify-center h-96 text-muted-foreground space-y-2">
                <p className="text-sm md:text-base">Failed to load PDF</p>
                <p className="text-xs md:text-sm">The PDF might be corrupted or in an unsupported format</p>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              width={window.innerWidth < 768 ? window.innerWidth - (showThumbnails ? 120 : 60) : undefined}
              loading={
                <div className="flex items-center justify-center h-96">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              }
              className="shadow-lg"
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>
        </div>
      </div>
    </div>
  );
};

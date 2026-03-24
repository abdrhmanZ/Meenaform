"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  Maximize2,
  Loader2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

// ✅ Cache لتذكر الملفات اللي اتحملت قبل كده + عدد صفحاتها
const loadedPDFs = new Map<string, number>();

interface PDFViewerProps {
  fileUrl: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  onTotalPagesChange: (total: number) => void;
  scale: number;
  onScaleChange: (scale: number) => void;
  onPageClick?: (x: number, y: number, pageWidth: number, pageHeight: number) => void;
  className?: string;
  children?: React.ReactNode; // For overlay elements like signature fields
}

export default function PDFViewer({
  fileUrl,
  currentPage,
  onPageChange,
  onTotalPagesChange,
  scale,
  onScaleChange,
  onPageClick,
  className,
  children,
}: PDFViewerProps) {
  const cachedPages = loadedPDFs.get(fileUrl);
  const [totalPages, setTotalPages] = useState(cachedPages || 0);
  const [isLoading, setIsLoading] = useState(!cachedPages);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // ✅ لو الملف اتحمل قبل كده، نبلّغ الـ parent بعدد الصفحات فوراً
  useEffect(() => {
    if (cachedPages) {
      onTotalPagesChange(cachedPages);
    }
  }, [cachedPages, onTotalPagesChange]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    loadedPDFs.set(fileUrl, numPages);
    setTotalPages(numPages);
    onTotalPagesChange(numPages);
    setIsLoading(false);
    setError(null);
  }, [onTotalPagesChange, fileUrl]);

  const onDocumentLoadError = useCallback((err: Error) => {
    console.error("PDF load error:", err);
    setError("فشل في تحميل الملف. يرجى المحاولة مرة أخرى.");
    setIsLoading(false);
  }, []);

  const onPageLoadSuccess = useCallback(({ width, height }: { width: number; height: number }) => {
    setPageSize({ width, height });
  }, []);

  const handlePageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!onPageClick || !pageRef.current) return;

    const rect = pageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert to percentage (0-100)
    const percentX = (x / rect.width) * 100;
    const percentY = (y / rect.height) * 100;

    onPageClick(percentX, percentY, rect.width, rect.height);
  }, [onPageClick]);

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const zoomIn = () => {
    if (scale < 2) {
      onScaleChange(Math.min(scale + 0.25, 2));
    }
  };

  const zoomOut = () => {
    if (scale > 0.5) {
      onScaleChange(Math.max(scale - 0.25, 0.5));
    }
  };

  const resetZoom = () => {
    onScaleChange(1);
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b rounded-t-lg">
        {/* Page Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPreviousPage}
            disabled={currentPage <= 1 || isLoading}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[80px] text-center">
            {isLoading ? "..." : `${currentPage} / ${totalPages}`}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage >= totalPages || isLoading}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomOut}
            disabled={scale <= 0.5 || isLoading}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomIn}
            disabled={scale >= 2 || isLoading}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetZoom}
            disabled={isLoading}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-200 flex justify-center p-4"
      >
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-3 text-gray-600">
            <Loader2 className="w-10 h-10 animate-spin" />
            <p>جاري تحميل الملف...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center gap-3 text-red-600">
            <p>{error}</p>
          </div>
        )}

        {/* PDF Document */}
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={null}
          className={cn(isLoading && "hidden")}
        >
          <div
            ref={pageRef}
            className="relative shadow-xl cursor-crosshair"
            onClick={handlePageClick}
          >
            <Page
              pageNumber={currentPage}
              scale={scale}
              onLoadSuccess={onPageLoadSuccess}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="bg-white"
            />
            {/* Overlay for signature fields */}
            {children && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  width: pageSize.width * scale,
                  height: pageSize.height * scale
                }}
              >
                {children}
              </div>
            )}
          </div>
        </Document>
      </div>
    </div>
  );
}


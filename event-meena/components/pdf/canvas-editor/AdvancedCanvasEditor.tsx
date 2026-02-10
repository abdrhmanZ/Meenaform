/**
 * Advanced Canvas Editor Component
 * 
 * Professional PDF editor using Fabric.js for interactive editing.
 * Replaces the old InteractivePDFRenderer with a more powerful solution.
 * 
 * Features:
 * - Drag & drop elements
 * - Resize elements
 * - Snap to grid
 * - Guidelines
 * - Undo/Redo
 * - Layers management
 * - Full Arabic support
 * 
 * @version 5.0.0 - Advanced Canvas Editor
 * @date 2025-11-12
 */

"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { usePDFEditor } from '@/contexts/PDFEditorContext';
import { PDFEditorSettings } from '@/types/pdf-editor';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';
import { CanvasToolbar } from './CanvasToolbar';
import { CanvasLayersPanel } from './CanvasLayersPanel';
import { CanvasPropertiesPanel } from './CanvasPropertiesPanel';
import { useCanvasEditor } from '@/hooks/useCanvasEditor';
import { createArabicText, setupGrid, setupGuidelines, generateTableHTML, convertTableHTMLToImage } from './utils/fabricHelpers';

interface AdvancedCanvasEditorProps {
  /** PDF editor settings */
  settings: PDFEditorSettings;
  
  /** Sample data for preview */
  sampleData?: {
    eventTitle: string;
    tables: Array<{
      title: string;
      headers: string[];
      rows: Array<Record<string, string>>;
    }>;
  };
  
  /** Zoom level */
  zoom?: number;
}

export function AdvancedCanvasEditor({
  settings,
  sampleData,
  zoom: externalZoom = 1.0,
}: AdvancedCanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<any | null>(null);

  // Internal zoom state for canvas editor
  const [internalZoom, setInternalZoom] = useState(0.5); // Start at 50% for better visibility

  const { state } = usePDFEditor();
  const {
    canvas,
    initCanvas,
    addText,
    addTable,
    elements,
    selectedElement,
    selectElement,
    deselectElement,
    undo,
    redo,
    canUndo,
    canRedo,
    gridEnabled,
    snapEnabled,
    toggleGrid,
    toggleSnap,
  } = useCanvasEditor();
  
  // Default sample data
  const defaultSampleData = {
    eventTitle: 'مؤتمر التقنية 2024',
    tables: [
      {
        title: 'جدول الحضور',
        headers: ['الاسم', 'البريد الإلكتروني', 'الهاتف', 'المدينة'],
        rows: [
          { 'الاسم': 'أحمد محمد', 'البريد الإلكتروني': 'ahmed@example.com', 'الهاتف': '0501234567', 'المدينة': 'الرياض' },
          { 'الاسم': 'فاطمة علي', 'البريد الإلكتروني': 'fatima@example.com', 'الهاتف': '0507654321', 'المدينة': 'جدة' },
        ],
      },
    ],
  };
  
  const data = sampleData || defaultSampleData;
  
  // Calculate dimensions (A4 in pixels at 300 DPI for high quality)
  // A4 at 300 DPI: 2480 x 3508 pixels (portrait), 3508 x 2480 (landscape)
  const pageWidth = settings.page.orientation === 'landscape' ? 3508 : 2480;
  const pageHeight = settings.page.orientation === 'landscape' ? 2480 : 3508;
  
  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: pageWidth,
      height: pageHeight,
      backgroundColor: settings.page.backgroundColor || '#ffffff',
      selection: true,
      preserveObjectStacking: true,
      renderOnAddRemove: true,
    });

    fabricCanvasRef.current = fabricCanvas;
    initCanvas(fabricCanvas);

    // Setup grid
    if (gridEnabled) {
      setupGrid(fabricCanvas, 10);
    }

    // Setup snap to grid
    fabricCanvas.on('object:moving', (e) => {
      if (!snapEnabled || !e.target) return;

      const obj = e.target;
      const gridSize = 10;

      obj.set({
        left: Math.round((obj.left || 0) / gridSize) * gridSize,
        top: Math.round((obj.top || 0) / gridSize) * gridSize,
      });

      obj.setCoords();
    });

    // Setup guidelines
    setupGuidelines(fabricCanvas);

    // Add initial content from settings (async)
    addInitialContent(fabricCanvas).catch(error => {
      console.error('❌ Error adding initial content:', error);
    });

    // Cleanup
    return () => {
      fabricCanvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z / Cmd+Z - Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Ctrl+Shift+Z / Cmd+Shift+Z - Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }

      // Delete / Backspace - Delete selected object
      if ((e.key === 'Delete' || e.key === 'Backspace') && fabricCanvasRef.current) {
        const activeObject = fabricCanvasRef.current.getActiveObject();
        if (activeObject) {
          e.preventDefault();
          fabricCanvasRef.current.remove(activeObject);
          fabricCanvasRef.current.renderAll();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);
  
  // Add initial content (header, tables, custom overlays)
  const addInitialContent = useCallback(async (canvas: any) => {
    // Convert margins from mm to pixels
    const mmToPx = 3.7795;
    const margins = {
      top: settings.page.margins.top * mmToPx,
      right: settings.page.margins.right * mmToPx,
      bottom: settings.page.margins.bottom * mmToPx,
      left: settings.page.margins.left * mmToPx,
    };

    let currentY = margins.top;

    // Add event title
    const titleText = createArabicText(data.eventTitle, {
      left: pageWidth / 2,
      top: currentY,
      fontSize: settings.fonts.sizes.eventTitle || 24,
      fontWeight: settings.fonts.weights.eventTitle || 'bold',
      fill: settings.colors.eventTitleText || '#000000',
      fontFamily: settings.fonts.family || 'Cairo',
      textAlign: 'center',
      originX: 'center',
      originY: 'top',
    });

    canvas.add(titleText);
    const eventTitleMargin = settings.spacing?.titleMargins?.eventTitle || 30;
    currentY += (settings.fonts.sizes.eventTitle || 24) + eventTitleMargin;

    // Add tables
    for (let index = 0; index < data.tables.length; index++) {
      const table = data.tables[index];
      try {
        // Generate HTML for table (same as preview)
        const tableHTML = generateTableHTML(table, settings);

        // Convert HTML to image
        const tableImageURL = await convertTableHTMLToImage(tableHTML, settings);

        // Add image to canvas
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';

          img.onload = () => {
            const fabricImg = new fabric.Image(img, {
              left: margins.left,
              top: currentY,
              selectable: true,
              hasControls: true,
            });

            const tableWidth = pageWidth - margins.left - margins.right;
            const scale = tableWidth / (fabricImg.width || 1);

            fabricImg.set({
              scaleX: scale,
              scaleY: scale,
            });

            // Set unique ID for table
            (fabricImg as any).id = `table-${index}`;
            (fabricImg as any).name = table.title;
            (fabricImg as any).type = 'table-image';

            canvas.add(fabricImg);
            canvas.renderAll();

            // Update currentY for next element
            const tableHeight = (fabricImg.height || 0) * scale;
            currentY += tableHeight + (settings.spacing?.tableSeparation || 30);

            resolve();
          };

          img.onerror = (error) => {
            console.error('❌ Failed to load image:', error);
            reject(new Error('Failed to load image'));
          };

          img.src = tableImageURL;
        });
      } catch (error) {
        console.error(`❌ Error adding table ${index}:`, error);
      }
    }

    canvas.renderAll();

    // Add custom text overlays
    settings.customTextOverlays?.forEach((overlay) => {
      if (overlay.visible === false) return;

      const overlayText = createArabicText(overlay.content, {
        left: overlay.position.x * mmToPx,
        top: overlay.position.y * mmToPx,
        fontSize: overlay.fontSize || 14,
        fontWeight: overlay.fontWeight || 'normal',
        fill: overlay.color || '#000000',
        fontFamily: overlay.fontFamily || settings.fonts?.family || 'Cairo',
        textAlign: overlay.textAlign || 'right',
        backgroundColor: overlay.backgroundColor,
      });

      canvas.add(overlayText);
    });
    
    canvas.renderAll();
  }, [settings, data, pageWidth]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setInternalZoom(prev => Math.min(prev + 0.1, 2.0)); // Max 200%
  }, []);

  const handleZoomOut = useCallback(() => {
    setInternalZoom(prev => Math.max(prev - 0.1, 0.1)); // Min 10%
  }, []);

  const handleZoomReset = useCallback(() => {
    setInternalZoom(0.5); // Reset to 50%
  }, []);

  const handleZoomFit = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current.parentElement;
    if (!container) return;

    const containerWidth = container.clientWidth - 64; // Subtract padding
    const containerHeight = container.clientHeight - 64;

    const scaleX = containerWidth / pageWidth;
    const scaleY = containerHeight / pageHeight;

    setInternalZoom(Math.min(scaleX, scaleY));
  }, [pageWidth, pageHeight]);

  // Update zoom
  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.style.transform = `scale(${internalZoom})`;
    containerRef.current.style.transformOrigin = 'top left';
  }, [internalZoom]);

  // Auto-fit on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (containerRef.current && containerRef.current.parentElement) {
        const container = containerRef.current.parentElement;
        const containerWidth = container.clientWidth - 64;
        const containerHeight = container.clientHeight - 64;

        const scaleX = containerWidth / pageWidth;
        const scaleY = containerHeight / pageHeight;

        const fitZoom = Math.min(scaleX, scaleY, 1.0); // Max 100%
        if (fitZoom > 0.1 && fitZoom < internalZoom) {
          setInternalZoom(fitZoom);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [pageWidth, pageHeight]);
  
  return (
    <div className="flex flex-col h-full w-full bg-gray-50">
      {/* Toolbar */}
      <CanvasToolbar
        onAddText={() => addText('نص جديد')}
        onAddTable={() => addTable()}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        gridEnabled={gridEnabled}
        snapEnabled={snapEnabled}
        onToggleGrid={toggleGrid}
        onToggleSnap={toggleSnap}
      />
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas Area - Full width, canvas starts from left */}
        <div className="flex-1 overflow-auto p-4 flex items-start relative bg-gray-100">
          {/* Zoom Controls - Fixed Position */}
          <div className="absolute bottom-8 left-8 z-10 flex items-center gap-2 bg-white rounded-lg shadow-lg border p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={internalZoom <= 0.1}
              title="تصغير (Zoom Out)"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>

            <div className="px-3 py-1 text-sm font-medium min-w-[60px] text-center">
              {Math.round(internalZoom * 100)}%
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={internalZoom >= 2.0}
              title="تكبير (Zoom In)"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomFit}
              title="ملء الشاشة (Fit to Screen)"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomReset}
              title="إعادة تعيين (Reset)"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          <div
            ref={containerRef}
            className="relative bg-white shadow-2xl rounded-lg overflow-visible transition-transform duration-200"
            style={{
              width: `${pageWidth}px`,
              height: `${pageHeight}px`,
              maxWidth: '100%',
              border: '2px solid #e5e7eb',
            }}
          >
            <canvas ref={canvasRef} />

            {/* Watermark */}
            <div className="absolute top-4 right-4 bg-purple-500 text-white px-3 py-1 rounded text-xs font-medium pointer-events-none z-10">
              🎨 محرر متقدم
            </div>

            {/* Canvas Size Indicator */}
            <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-xs font-medium pointer-events-none z-10">
              {pageWidth} × {pageHeight} px (A4 @ 300 DPI)
            </div>
          </div>
        </div>

        {/* Right Sidebar - Hidden to maximize canvas space */}
        {/* Uncomment if you need Layers & Properties panels
        <div className="w-64 border-l bg-white flex flex-col shrink-0">
          <div className="flex-1 overflow-auto border-b">
            <CanvasLayersPanel
              elements={elements}
              selectedElement={selectedElement}
              onSelectElement={selectElement}
            />
          </div>

          <div className="h-64 overflow-auto">
            <CanvasPropertiesPanel
              selectedElement={selectedElement}
              canvas={canvas}
            />
          </div>
        </div>
        */}
      </div>
    </div>
  );
}


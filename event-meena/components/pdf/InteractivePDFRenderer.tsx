/**
 * Interactive PDF Renderer Component
 * 
 * Renders PDF content as interactive HTML instead of static image.
 * Allows direct manipulation of elements (drag, resize, color change, etc.)
 * 
 * @version 4.0.0 - Interactive Visual PDF Editor
 * @date 2025-11-12
 */

"use client";

import React, { useMemo, useCallback, useState, useRef } from 'react';
import Draggable, { DraggableEvent, DraggableData } from 'react-draggable';
import { Resizable, ResizeCallbackData } from 'react-resizable';
import { usePDFEditor } from '@/contexts/PDFEditorContext';
import { PDFEditorSettings } from '@/types/pdf-editor';
import { cn } from '@/lib/utils';

interface InteractivePDFRendererProps {
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

export function InteractivePDFRenderer({
  settings,
  sampleData,
  zoom = 1.0,
}: InteractivePDFRendererProps) {
  const { state, selectElement, deselectElement, updateCustomTextOverlay } = usePDFEditor();

  // State for inline editing
  const [editingOverlayId, setEditingOverlayId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const [editingHeader, setEditingHeader] = useState(false);
  const [headerContent, setHeaderContent] = useState('');
  const editableRef = useRef<HTMLDivElement>(null);
  const headerEditableRef = useRef<HTMLDivElement>(null);
  
  // Default sample data if none provided
  const defaultSampleData = useMemo(() => ({
    eventTitle: 'مؤتمر التقنية 2024',
    tables: [
      {
        title: 'جدول الحضور',
        headers: ['الاسم', 'البريد الإلكتروني', 'الهاتف', 'المدينة'],
        rows: [
          { 'الاسم': 'أحمد محمد', 'البريد الإلكتروني': 'ahmed@example.com', 'الهاتف': '0501234567', 'المدينة': 'الرياض' },
          { 'الاسم': 'فاطمة علي', 'البريد الإلكتروني': 'fatima@example.com', 'الهاتف': '0507654321', 'المدينة': 'جدة' },
          { 'الاسم': 'محمد سعيد', 'البريد الإلكتروني': 'mohammed@example.com', 'الهاتف': '0509876543', 'المدينة': 'الدمام' },
        ],
      },
    ],
  }), []);
  
  const data = sampleData || defaultSampleData;
  
  // Calculate dimensions (A4 landscape in pixels at 96 DPI)
  const pageWidth = settings.page.orientation === 'landscape' ? 1122 : 794;
  const pageHeight = settings.page.orientation === 'landscape' ? 794 : 1122;
  
  // Convert margins from mm to pixels (1mm ≈ 3.7795px at 96 DPI)
  const mmToPx = 3.7795;
  const margins = {
    top: settings.page.margins.top * mmToPx,
    right: settings.page.margins.right * mmToPx,
    bottom: settings.page.margins.bottom * mmToPx,
    left: settings.page.margins.left * mmToPx,
  };
  
  // Content area dimensions
  const contentWidth = pageWidth - margins.left - margins.right;
  const contentHeight = pageHeight - margins.top - margins.bottom;
  
  // Handle element click
  const handleElementClick = (
    e: React.MouseEvent,
    type: 'header' | 'table' | 'customTextOverlay',
    id: string
  ) => {
    e.stopPropagation();
    selectElement({
      type,
      id,
      metadata: {},
    });
  };
  
  // Handle background click (deselect)
  const handleBackgroundClick = () => {
    deselectElement();
  };
  
  // Check if element is selected
  const isSelected = (type: string, id: string) => {
    return state.selectedElement?.type === type && state.selectedElement?.id === id;
  };

  /**
   * Handle drag stop for custom text overlays
   */
  const handleDragStop = useCallback((
    overlayId: string,
    e: DraggableEvent,
    data: DraggableData
  ) => {
    // Update the overlay position in context
    const overlay = settings.customTextOverlays?.find(o => o.id === overlayId);
    if (overlay) {
      updateCustomTextOverlay(overlayId, {
        ...overlay,
        position: {
          x: data.x,
          y: data.y,
        },
      });
    }
  }, [settings.customTextOverlays, updateCustomTextOverlay]);

  /**
   * Handle resize stop for custom text overlays
   */
  const handleResizeStop = useCallback((
    overlayId: string,
    e: React.SyntheticEvent,
    data: ResizeCallbackData
  ) => {
    // Update the overlay size in context
    const overlay = settings.customTextOverlays?.find(o => o.id === overlayId);
    if (overlay) {
      updateCustomTextOverlay(overlayId, {
        ...overlay,
        width: data.size.width,
        height: data.size.height,
      });
    }
  }, [settings.customTextOverlays, updateCustomTextOverlay]);

  /**
   * Handle double click to start editing
   */
  const handleDoubleClick = useCallback((overlayId: string, content: string) => {
    if (state.previewMode === 'edit') {
      setEditingOverlayId(overlayId);
      setEditingContent(content);
      // Focus the editable element after state update
      setTimeout(() => {
        if (editableRef.current) {
          editableRef.current.focus();
          // Select all text
          const range = document.createRange();
          range.selectNodeContents(editableRef.current);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }, 0);
    }
  }, [state.previewMode]);

  /**
   * Handle blur to save editing
   */
  const handleBlur = useCallback((overlayId: string) => {
    if (editingOverlayId === overlayId) {
      const overlay = settings.customTextOverlays?.find(o => o.id === overlayId);
      if (overlay && editingContent !== overlay.content) {
        updateCustomTextOverlay(overlayId, {
          ...overlay,
          content: editingContent,
        });
      }
      setEditingOverlayId(null);
      setEditingContent('');
    }
  }, [editingOverlayId, editingContent, settings.customTextOverlays, updateCustomTextOverlay]);

  /**
   * Handle key press in editable element
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent, overlayId: string) => {
    if (e.key === 'Escape') {
      // Cancel editing
      setEditingOverlayId(null);
      setEditingContent('');
    } else if (e.key === 'Enter' && e.ctrlKey) {
      // Save on Ctrl+Enter
      handleBlur(overlayId);
    }
  }, [handleBlur]);

  /**
   * Handle double click on header to start editing
   */
  const handleHeaderDoubleClick = useCallback(() => {
    if (state.previewMode === 'edit' && sampleData) {
      setEditingHeader(true);
      setHeaderContent(sampleData.eventTitle);
      setTimeout(() => {
        if (headerEditableRef.current) {
          headerEditableRef.current.focus();
          const range = document.createRange();
          range.selectNodeContents(headerEditableRef.current);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }, 0);
    }
  }, [state.previewMode, sampleData]);

  /**
   * Handle blur on header to save editing
   */
  const handleHeaderBlur = useCallback(() => {
    if (editingHeader && sampleData) {
      // Note: In a real app, you would update the event title in the parent component
      // For now, we just close the editing mode
    }
    setEditingHeader(false);
    setHeaderContent('');
  }, [editingHeader, headerContent, sampleData]);

  /**
   * Handle key press in header editable element
   */
  const handleHeaderKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditingHeader(false);
      setHeaderContent('');
    } else if (e.key === 'Enter' && e.ctrlKey) {
      handleHeaderBlur();
    }
  }, [handleHeaderBlur]);

  return (
    <div
      className="relative bg-white shadow-2xl rounded-lg overflow-hidden mx-auto"
      style={{
        width: `${pageWidth}px`,
        height: `${pageHeight}px`,
        transform: `scale(${zoom})`,
        transformOrigin: 'top center',
        transition: 'transform 0.2s ease-in-out',
        fontFamily: settings.fonts.family,
        direction: 'rtl',
      }}
      onClick={handleBackgroundClick}
    >
      {/* Background Color */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: '#ffffff',
        }}
      />
      
      {/* Content Area */}
      <div
        className="absolute"
        style={{
          top: `${margins.top}px`,
          right: `${margins.right}px`,
          width: `${contentWidth}px`,
          height: `${contentHeight}px`,
        }}
      >
        {/* Header */}
        <div
          className={cn(
            "relative cursor-pointer transition-all duration-200",
            isSelected('header', 'main-header') && "ring-4 ring-blue-500 ring-offset-2",
            editingHeader && "ring-4 ring-green-500"
          )}
          onClick={(e) => handleElementClick(e, 'header', 'main-header')}
          onDoubleClick={handleHeaderDoubleClick}
          style={{
            textAlign: 'center',
            marginBottom: `${settings.spacing.titleMargins.eventTitle}px`,
            padding: '12px',
            borderRadius: '8px',
          }}
        >
          {editingHeader ? (
            <div
              ref={headerEditableRef}
              contentEditable
              suppressContentEditableWarning
              onBlur={handleHeaderBlur}
              onKeyDown={handleHeaderKeyDown}
              onInput={(e) => setHeaderContent(e.currentTarget.textContent || '')}
              className="outline-none"
              style={{
                fontSize: `${settings.fonts.sizes.eventTitle}px`,
                fontWeight: settings.fonts.weights.eventTitle,
                color: settings.colors.eventTitleText,
                margin: 0,
                lineHeight: 1.4,
                cursor: 'text',
              }}
            >
              {headerContent}
            </div>
          ) : (
            <h1
              style={{
                fontSize: `${settings.fonts.sizes.eventTitle}px`,
                fontWeight: settings.fonts.weights.eventTitle,
                color: settings.colors.eventTitleText,
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              {data.eventTitle}
            </h1>
          )}

          {/* Selection indicator */}
          {isSelected('header', 'main-header') && !editingHeader && (
            <div className="absolute -top-8 left-0 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
              العنوان الرئيسي • انقر مرتين للتحرير
            </div>
          )}

          {/* Editing indicator */}
          {editingHeader && (
            <div className="absolute -top-8 left-0 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
              جاري تحرير العنوان • Ctrl+Enter للحفظ • Esc للإلغاء
            </div>
          )}
        </div>
        
        {/* Tables */}
        <div className="space-y-4">
          {data.tables.map((table, tableIndex) => (
            <div
              key={tableIndex}
              className={cn(
                "relative cursor-pointer transition-all duration-200",
                isSelected('table', `table-${tableIndex}`) && "ring-4 ring-green-500 ring-offset-2"
              )}
              onClick={(e) => handleElementClick(e, 'table', `table-${tableIndex}`)}
              style={{
                marginBottom: `${settings.spacing.tableSeparation}px`,
                padding: '8px',
                borderRadius: '8px',
              }}
            >
              {/* Table Title */}
              <h2
                style={{
                  fontSize: `${settings.fonts.sizes.tableTitle}px`,
                  fontWeight: settings.fonts.weights.tableTitle,
                  color: settings.colors.tableTitleText,
                  marginBottom: `${settings.spacing.titleMargins.tableTitle}px`,
                  textAlign: 'right',
                }}
              >
                {table.title}
              </h2>
              
              {/* Table */}
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  border: settings.table.border.width > 0 ? `${settings.table.border.width}px ${settings.table.border.style} ${settings.colors.border}` : 'none',
                }}
              >
                {/* Table Header */}
                <thead>
                  <tr
                    style={{
                      backgroundColor: settings.colors.headerBg,
                    }}
                  >
                    {table.headers.map((header, headerIndex) => (
                      <th
                        key={headerIndex}
                        style={{
                          padding: `${settings.spacing.cellPadding.vertical}px ${settings.spacing.cellPadding.horizontal}px`,
                          fontSize: `${settings.fonts.sizes.header}px`,
                          fontWeight: settings.fonts.weights.header,
                          color: settings.colors.headerText,
                          textAlign: 'right',
                          border: settings.table.border.width > 0 ? `${settings.table.border.width}px ${settings.table.border.style} ${settings.colors.border}` : 'none',
                        }}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                
                {/* Table Body */}
                <tbody>
                  {table.rows.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      style={{
                        backgroundColor: settings.table.zebraStriping && rowIndex % 2 === 1
                          ? settings.colors.alternateRowBg || '#f8fafc'
                          : 'transparent',
                      }}
                    >
                      {table.headers.map((header, cellIndex) => {
                        const cellValue = (row as Record<string, string>)[header] || '';
                        const isSignature = cellValue.startsWith?.('data:image');
                        return (
                          <td
                            key={cellIndex}
                            style={{
                              padding: `${settings.spacing.cellPadding.vertical}px ${settings.spacing.cellPadding.horizontal}px`,
                              fontSize: `${settings.fonts.sizes.content}px`,
                              fontWeight: settings.fonts.weights.content,
                              color: settings.colors.text,
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              border: settings.table.border.width > 0 ? `${settings.table.border.width}px ${settings.table.border.style} ${settings.colors.border}` : 'none',
                            }}
                          >
                            {isSignature ? (
                              <img
                                src={cellValue}
                                alt="توقيع"
                                style={{ maxWidth: '120px', maxHeight: '50px', objectFit: 'contain', display: 'block', margin: '0 auto' }}
                              />
                            ) : (
                              cellValue
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Selection indicator */}
              {isSelected('table', `table-${tableIndex}`) && (
                <div className="absolute -top-8 left-0 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                  جدول {tableIndex + 1}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Custom Text Overlays - Draggable & Resizable */}
        {settings.customTextOverlays?.map((overlay, index) => {
          if (overlay.visible === false) return null;

          const overlayId = overlay.id || `overlay-${index}`;
          const width = overlay.width || 200;
          const height = overlay.height || 50;

          return (
            <Draggable
              key={overlayId}
              position={{ x: overlay.position.x * mmToPx, y: overlay.position.y * mmToPx }}
              onStop={(e, data) => handleDragStop(overlayId, e, data)}
              bounds="parent"
              disabled={state.previewMode !== 'edit'}
            >
              <div className="absolute">
                <Resizable
                  width={width}
                  height={height}
                  onResizeStop={(e, data) => handleResizeStop(overlayId, e, data)}
                  resizeHandles={state.previewMode === 'edit' ? ['se', 'sw', 'ne', 'nw'] : []}
                  minConstraints={[50, 20]}
                  maxConstraints={[600, 400]}
                >
                  <div
                    className={cn(
                      "cursor-move transition-all duration-200 relative",
                      isSelected('customTextOverlay', overlayId) && "ring-4 ring-purple-500 ring-offset-2",
                      state.previewMode === 'edit' && "hover:ring-2 hover:ring-purple-300",
                      editingOverlayId === overlayId && "ring-4 ring-blue-500"
                    )}
                    onClick={(e) => handleElementClick(e, 'customTextOverlay', overlayId)}
                    onDoubleClick={() => handleDoubleClick(overlayId, overlay.content)}
                    style={{
                      width: `${width}px`,
                      height: `${height}px`,
                      fontSize: `${overlay.fontSize}px`,
                      color: overlay.color,
                      fontWeight: overlay.fontWeight,
                      textAlign: overlay.textAlign,
                      fontFamily: overlay.fontFamily || settings.fonts.family,
                      transform: overlay.rotation ? `rotate(${overlay.rotation}deg)` : undefined,
                      transformOrigin: 'top right',
                      opacity: overlay.opacity ?? 1,
                      backgroundColor: overlay.backgroundColor,
                      padding: overlay.backgroundColor ? '8px 12px' : '4px',
                      borderRadius: overlay.backgroundColor ? '4px' : undefined,
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.6,
                      zIndex: overlay.zIndex || 0,
                      overflow: 'hidden',
                    }}
                  >
                    {editingOverlayId === overlayId ? (
                      <div
                        ref={editableRef}
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={() => handleBlur(overlayId)}
                        onKeyDown={(e) => handleKeyDown(e, overlayId)}
                        onInput={(e) => setEditingContent(e.currentTarget.textContent || '')}
                        className="outline-none w-full h-full"
                        style={{
                          cursor: 'text',
                        }}
                      >
                        {editingContent}
                      </div>
                    ) : (
                      overlay.content
                    )}

                    {/* Selection indicator */}
                    {isSelected('customTextOverlay', overlayId) && !editingOverlayId && (
                      <div className="absolute -top-8 left-0 bg-purple-500 text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap z-10">
                        نص حر {index + 1} • انقر مرتين للتحرير • اسحب لتحريك
                      </div>
                    )}

                    {/* Editing indicator */}
                    {editingOverlayId === overlayId && (
                      <div className="absolute -top-8 left-0 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap z-10">
                        جاري التحرير • Ctrl+Enter للحفظ • Esc للإلغاء
                      </div>
                    )}

                    {/* Drag handle indicator (only in edit mode) */}
                    {state.previewMode === 'edit' && !isSelected('customTextOverlay', overlayId) && !editingOverlayId && (
                      <div className="absolute -top-2 -right-2 bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                        ⋮⋮
                      </div>
                    )}
                  </div>
                </Resizable>
              </div>
            </Draggable>
          );
        })}
      </div>
      
      {/* Edit Mode Watermark */}
      <div className="absolute top-4 right-4 bg-purple-500 text-white px-3 py-1 rounded text-xs font-medium">
        🎨 وضع التحرير
      </div>
    </div>
  );
}


/**
 * Enhanced HTML-Based PDF Editor
 *
 * A high-performance, interactive PDF editor using HTML/CSS instead of Canvas.
 * Features draggable/resizable tables, inline editing, and professional UI.
 *
 * @version 5.0.1 - Enhanced HTML Editor - Fixed TypeScript errors
 * @date 2025-11-16
 */

"use client";

import React, { useState, useCallback, useRef, useMemo, useEffect, createRef } from 'react';
import Draggable, { DraggableEvent, DraggableData } from 'react-draggable';
import { Resizable, ResizeCallbackData } from 'react-resizable';
import { PDFEditorSettings } from '@/types/pdf-editor';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Grid3x3,
  Magnet,
  Type,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Download,
  Palette,
  Layers,
  Trash2,
  Eye,
  EyeOff,
  Move,
  FlipHorizontal,
  FlipVertical,
  RotateCw,
  Settings2,
  Copy,
  Clipboard,
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  ArrowLeftRight,
  ArrowUpDown,
  Group,
  Ungroup,
  Plus,
  ChevronLeft,
  ChevronRight,
  FileText,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Minus,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  Menu,
  PanelLeft,
  FileStack,
  X,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import 'react-resizable/css/styles.css';
import './enhanced-html-editor.css';
import { BackgroundSettingsPanel } from './BackgroundSettingsPanel';
import { TransformControlPanel } from './TransformControlPanel';
import { RotationHandle } from './RotationHandle';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Internal Editor Settings (Independent from external PDFEditorSettings)
 */
interface EditorSettings {
  page: {
    size: 'a4' | 'letter' | 'custom';
    orientation: 'portrait' | 'landscape';
    width: number; // in pixels at 96 DPI
    height: number; // in pixels at 96 DPI
    margins: {
      top: number; // in mm
      right: number; // in mm
      bottom: number; // in mm
      left: number; // in mm
    };
  };
  colors: {
    eventTitleText: string;
    headerBg: string;
    headerText: string;
    rowBg: string;
    rowText: string;
    borderColor: string;
  };
  fonts: {
    family: string;
    sizes: {
      eventTitle: number;
      tableTitle: number;
      tableHeader: number;
      tableCell: number;
    };
    weights: {
      eventTitle: number;
      tableTitle: number;
      tableHeader: number;
      tableCell: number;
    };
  };
}

/**
 * Default Editor Settings
 */
const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  page: {
    size: 'a4',
    orientation: 'portrait',
    width: 1400, // Increased from 794px for larger working area
    height: 1980, // Increased from 1122px for larger working area (maintains A4 ratio)
    margins: {
      top: 40,
      right: 40,
      bottom: 40,
      left: 40,
    },
  },
  colors: {
    eventTitleText: '#ffffff',
    headerBg: '#1e293b',
    headerText: '#ffffff',
    rowBg: '#ffffff',
    rowText: '#1f2937',
    borderColor: '#e5e7eb',
  },
  fonts: {
    family: "'Cairo', 'Amiri', 'Tajawal', 'Tahoma', 'Arial', sans-serif",
    sizes: {
      eventTitle: 32,
      tableTitle: 18,
      tableHeader: 14,
      tableCell: 12,
    },
    weights: {
      eventTitle: 700,
      tableTitle: 600,
      tableHeader: 600,
      tableCell: 400,
    },
  },
};

/**
 * Transform state for element transformations (rotation, flip, scale)
 */
interface TransformState {
  rotation: number; // 0-360 degrees
  flipHorizontal: boolean;
  flipVertical: boolean;
  scale: { x: number; y: number }; // 1 = 100%
  lockAspectRatio: boolean;
}

/**
 * Default transform state
 */
const DEFAULT_TRANSFORM: TransformState = {
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
  scale: { x: 1, y: 1 },
  lockAspectRatio: false,
};

/**
 * Phase 7: Page Interface
 */
interface Page {
  id: string;
  name: string; // e.g., "صفحة 1", "صفحة الغلاف"
  order: number; // 0-based index for ordering
}

interface TableElement {
  id: string;
  type: 'table';
  headers: string[];
  rows: Array<Record<string, string>>;
  position: { x: number; y: number };
  size: { width: number; height: number };
  visible: boolean;
  locked: boolean;
  zIndex: number;
  transform: TransformState;
  pageId: string; // Phase 7: Which page this element belongs to
}

interface TableTitleElement {
  id: string;
  type: 'table-title';
  content: string;
  linkedTableId: string | null; // ID of the table it belongs to (null if unlinked)
  position: { x: number; y: number };
  size: { width: number; height: number };
  visible: boolean;
  locked: boolean;
  zIndex: number;
  transform: TransformState;
  pageId: string; // Phase 7: Which page this element belongs to
  style: {
    fontSize: number;
    fontWeight: number;
    color: string;
    textAlign: 'left' | 'center' | 'right';
  };
}

interface TextElement {
  id: string;
  type: 'text';
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  fontSize: number;
  color: string;
  fontWeight?: 'normal' | 'bold'; // Text formatting
  fontStyle?: 'normal' | 'italic'; // Text formatting
  textDecoration?: 'none' | 'underline'; // Text formatting
  textAlign?: 'left' | 'center' | 'right' | 'justify'; // Text alignment
  visible: boolean;
  locked: boolean;
  zIndex: number;
  transform: TransformState;
  pageId: string; // Phase 7: Which page this element belongs to
}

interface ImageElement {
  id: string;
  type: 'image';
  src: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  visible: boolean;
  locked: boolean;
  zIndex: number;
  transform: TransformState;
  pageId: string; // Phase 7: Which page this element belongs to
}

interface TitleBackgroundStyle {
  type: 'none' | 'solid' | 'gradient' | 'semi-transparent';
  solidColor?: string;
  opacity?: number; // 0-1
  gradient?: {
    type: 'linear' | 'radial';
    angle?: number; // 0-360
    startColor: string;
    endColor: string;
  };
  border?: {
    width: number;
    color: string;
    radius: number;
    style: 'solid' | 'dashed' | 'dotted' | 'none';
  };
  shadow?: {
    enabled: boolean;
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
}

interface TitleElement {
  id: string;
  type: 'title';
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  visible: boolean;
  locked: boolean;
  zIndex: number;
  transform: TransformState;
  pageId: string; // Phase 7: Which page this element belongs to
  style: {
    fontSize: number;
    fontWeight: number;
    color: string;
    textAlign: 'left' | 'center' | 'right';
    background: TitleBackgroundStyle;
  };
}

/**
 * Phase 6: Group Element
 * A group is a container for multiple elements that can be moved together
 */
interface GroupElement {
  id: string;
  type: 'group';
  name: string; // User-defined name for the group
  elementIds: string[]; // IDs of elements in this group
  position: { x: number; y: number }; // Top-left corner of the bounding box
  size: { width: number; height: number }; // Size of the bounding box
  visible: boolean;
  locked: boolean;
  zIndex: number;
  transform: TransformState;
  pageId: string; // Phase 7: Which page this element belongs to
}

type EditorElement = TableElement | TextElement | ImageElement | TitleElement | TableTitleElement | GroupElement;

interface HistoryState {
  elements: EditorElement[];
  timestamp: number;
}

export interface EnhancedHTMLEditorProps {
  settings?: PDFEditorSettings; // Optional - will use DEFAULT_EDITOR_SETTINGS if not provided
  sampleData?: {
    eventTitle: string;
    tables: Array<{
      title: string;
      headers: string[];
      rows: Array<Record<string, string>>;
    }>;
  };
  zoom?: number;
  onExport?: (pdf: Blob) => void;
  onBack?: () => void; // Callback to return to preview mode
}

// ============================================================================
// Title Component (React.memo removed to allow local state updates during resize)
// ============================================================================

const DraggableTitle = ({
  element,
  isSelected,
  isExporting,
  snapEnabled,
  GRID_SIZE,
  pageWidth,
  pageHeight,
  margins,
  onDrag,
  onDragStop,
  onResizeStop,
  onSelect,
  onUpdateElement,
  isOutOfBounds,
  isOutOfPrintArea,
}: {
  element: TitleElement;
  isSelected: boolean;
  isExporting?: boolean;
  snapEnabled: boolean;
  GRID_SIZE: number;
  pageWidth: number;
  pageHeight: number;
  margins: { top: number; right: number; bottom: number; left: number };
  onDrag?: (id: string, e: DraggableEvent, data: DraggableData) => void;
  onDragStop: (id: string, e: DraggableEvent, data: DraggableData) => void;
  onResizeStop: (id: string, e: React.SyntheticEvent, data: ResizeCallbackData) => void;
  onSelect: (id: string, ctrlKey?: boolean) => void;
  onUpdateElement: (id: string, updates: Partial<EditorElement>) => void;
  isOutOfBounds?: boolean;
  isOutOfPrintArea?: boolean;
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizingSize, setResizingSize] = useState({ width: 0, height: 0 });

  // Track current position during drag for real-time warning updates
  const [currentPosition, setCurrentPosition] = useState(element.position);
  const [isDragging, setIsDragging] = useState(false);



  // Calculate warnings based on current position (during drag) or element position (static)
  const activePosition = isDragging ? currentPosition : element.position;
  const currentIsOutOfBounds =
    activePosition.x < 0 ||
    activePosition.x + element.size.width > pageWidth ||
    activePosition.y < 0 ||
    activePosition.y + element.size.height > pageHeight;

  const currentIsOutOfPrintArea = !currentIsOutOfBounds && (
    activePosition.x < margins.left ||
    activePosition.x + element.size.width > pageWidth - margins.right ||
    activePosition.y < margins.top ||
    activePosition.y + element.size.height > pageHeight - margins.bottom
  );

  return (
    <Draggable
      nodeRef={nodeRef}
      defaultPosition={element.position}
      onDrag={(e, data) => {
        setIsDragging(true);
        setCurrentPosition({ x: data.x, y: data.y });
        if (onDrag) onDrag(element.id, e, data);
      }}
      onStop={(e, data) => {
        setIsDragging(false);
        setCurrentPosition({ x: data.x, y: data.y });
        onDragStop(element.id, e, data);
      }}
      bounds="parent"
      disabled={element.locked || isEditing}
      grid={snapEnabled ? [GRID_SIZE, GRID_SIZE] : undefined}
      cancel=".react-resizable-handle"
    >
      <div ref={nodeRef} className="absolute cursor-default" style={{ zIndex: element.zIndex }}>
        {/* Out of Bounds Warning */}
        {!isExporting && currentIsOutOfBounds && (
          <div className="absolute -top-8 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none z-[10000] whitespace-nowrap">
            ⚠️ خارج حدود الصفحة
          </div>
        )}
        {/* Out of Print Area Warning */}
        {!isExporting && currentIsOutOfPrintArea && (
          <div className="absolute -top-8 left-0 bg-yellow-500 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none z-[10000] whitespace-nowrap">
            ⚠️ خارج منطقة الطباعة
          </div>
        )}
        {/* Border wrapper with element-selected class */}
        <div
          className={cn(
            "relative",
            isSelected && !isExporting && "ring-4 ring-purple-500 ring-offset-2 element-selected"
          )}
          style={{
            overflow: 'visible',
            contain: 'none',
          }}
        >
            <Resizable
              width={isResizing ? resizingSize.width : element.size.width}
              height={isResizing ? resizingSize.height : element.size.height}
              onResize={(e, {size}) => {
                setIsResizing(true);
                // Apply grid snapping for smoother, faster resize (10px increments)
                const snappedWidth = Math.round(size.width / 10) * 10;
                const snappedHeight = Math.round(size.height / 10) * 10;
                setResizingSize({ width: snappedWidth, height: snappedHeight });
              }}
              onResizeStart={() => {}}
              onResizeStop={(e, data) => {
                setIsResizing(false);
                // Apply grid snapping to final size
                const snappedWidth = Math.round(data.size.width / 10) * 10;
                const snappedHeight = Math.round(data.size.height / 10) * 10;
                onResizeStop(element.id, e, { ...data, size: { width: snappedWidth, height: snappedHeight } });
              }}
              resizeHandles={['se', 'sw', 'ne', 'nw']}
              minConstraints={[300, 60]}
              maxConstraints={[pageWidth - margins.left - margins.right, 300]}
            >
              <div
                style={{
                  width: isResizing ? resizingSize.width : element.size.width,
                  height: isResizing ? resizingSize.height : element.size.height,
                  overflow: 'visible',
                  contain: 'none',
                  background: (() => {
                const bg = element.style.background;
                if (bg.type === 'none') return 'transparent';

                // For solid color - apply opacity directly in the color if specified
                if (bg.type === 'solid') {
                  const color = bg.solidColor || '#1e293b';
                  const opacity = bg.opacity ?? 1;
                  if (opacity < 1) {
                    // Convert hex to rgba with opacity
                    const r = parseInt(color.slice(1, 3), 16);
                    const g = parseInt(color.slice(3, 5), 16);
                    const b = parseInt(color.slice(5, 7), 16);
                    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
                  }
                  return color; // Return exact color without modification
                }

                if (bg.type === 'semi-transparent') {
                  const color = bg.solidColor || '#1e293b';
                  const opacity = bg.opacity ?? 0.9;
                  // Convert hex to rgba
                  const r = parseInt(color.slice(1, 3), 16);
                  const g = parseInt(color.slice(3, 5), 16);
                  const b = parseInt(color.slice(5, 7), 16);
                  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
                }

                if (bg.type === 'gradient' && bg.gradient) {
                  const { type, angle, startColor, endColor } = bg.gradient;
                  const opacity = bg.opacity ?? 1;

                  if (type === 'radial') {
                    const gradient = `radial-gradient(circle, ${startColor} 0%, ${endColor} 100%)`;
                    // If opacity < 1, we need to apply it differently
                    return gradient;
                  }
                  return `linear-gradient(${angle || 135}deg, ${startColor} 0%, ${endColor} 100%)`;
                }
                return 'transparent';
              })(),
              // Only apply opacity to the container if background type is 'none' or opacity is 1
              // This prevents double opacity application
              opacity: element.style.background.type === 'none' ? 1 : (element.style.background.type === 'gradient' ? (element.style.background.opacity ?? 1) : 1),
              borderWidth: element.style.background.type === 'none' ? 0 : (element.style.background.border?.width || 0),
              borderColor: element.style.background.type === 'none' ? 'transparent' : (element.style.background.border?.color || 'transparent'),
              borderStyle: element.style.background.type === 'none' ? 'none' : (element.style.background.border?.style || 'none'),
              borderRadius: element.style.background.type === 'none' ? 0 : `${element.style.background.border?.radius || 12}px`,
              boxShadow: (element.style.background.type === 'none' || !element.style.background.shadow?.enabled)
                ? 'none'
                : `${element.style.background.shadow.offsetX}px ${element.style.background.shadow.offsetY}px ${element.style.background.shadow.blur}px ${element.style.background.shadow.color}`,
              // Apply CSS transforms
              transform: `
                rotate(${element.transform.rotation}deg)
                scaleX(${element.transform.flipHorizontal ? -1 : 1})
                scaleY(${element.transform.flipVertical ? -1 : 1})
                scale(${element.transform.scale.x}, ${element.transform.scale.y})
              `,
              transformOrigin: 'center center',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(element.id, e.ctrlKey);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            <div
              className="w-full flex justify-center"
              style={{
                textAlign: element.style.textAlign,
                paddingTop: '48px',
                paddingBottom: '48px',
                paddingLeft: '24px',
                paddingRight: '24px',
                overflow: 'visible',
                contain: 'none',
                minHeight: '100%',
              }}
            >
              {isEditing ? (
                <input
                  type="text"
                  value={element.content}
                  onChange={(e) => {
                    onUpdateElement(element.id, {
                      content: e.target.value
                    } as Partial<TitleElement>);
                  }}
                  onBlur={() => setIsEditing(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsEditing(false);
                    }
                  }}
                  autoFocus
                  className="w-full bg-transparent border-2 border-white/50 rounded px-4 py-2 text-center outline-none"
                  style={{
                    fontSize: `${element.style.fontSize}px`,
                    fontWeight: element.style.fontWeight,
                    color: element.style.color,
                    direction: 'rtl',
                  }}
                />
              ) : (
                <h1
                  className="font-bold select-none"
                  style={{
                    fontSize: `${element.style.fontSize}px`,
                    fontWeight: element.style.fontWeight,
                    color: element.style.color,
                    direction: 'rtl',
                    lineHeight: 2.2,
                    wordBreak: 'break-word',
                    fontFamily: "'Cairo', 'Amiri', 'Tajawal', 'Tahoma', 'Arial', sans-serif",
                    textRendering: 'optimizeLegibility',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                    paddingTop: '0',
                    paddingBottom: '0',
                    marginTop: '0',
                    marginBottom: '0',
                    whiteSpace: 'normal',
                    overflow: 'visible',
                    contain: 'none',
                    display: 'block',
                    width: '100%',
                    boxSizing: 'content-box',
                  }}
                >
                  {element.content}
                </h1>
              )}
            </div>

            {/* Resize Tooltip - Shows during resizing */}
            {isResizing && (
              <div className="resize-tooltip absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap z-50 shadow-2xl border-2 border-white">
                <div className="flex items-center gap-2">
                  <span className="text-purple-100">📏</span>
                  <span>{Math.round(resizingSize.width)} × {Math.round(resizingSize.height)} px</span>
                </div>
              </div>
            )}

            {/* Rotation Handle (shown when selected, hidden during export) */}
            {isSelected && !isExporting && (
              <RotationHandle
                rotation={element.transform.rotation}
                onRotate={(rotation) => {
                  onUpdateElement(element.id, {
                    transform: { ...element.transform, rotation }
                  } as Partial<TitleElement>);
                }}
                elementRef={nodeRef}
                snapToAngles={true}
              />
            )}
              </div>
            </Resizable>
          </div>
      </div>
    </Draggable>
  );
};

// ============================================================================
// Table Title Component (React.memo removed to allow local state updates during resize)
// ============================================================================

const DraggableTableTitle = ({
  element,
  isSelected,
  isExporting,
  editorSettings,
  snapEnabled,
  GRID_SIZE,
  pageWidth,
  pageHeight,
  margins,
  onDrag,
  onDragStop,
  onResizeStop,
  onSelect,
  onUpdateElement,
  onToggleLink,
  isOutOfBounds,
  isOutOfPrintArea,
}: {
  element: TableTitleElement;
  isSelected: boolean;
  isExporting?: boolean;
  editorSettings: EditorSettings;
  snapEnabled: boolean;
  GRID_SIZE: number;
  pageWidth: number;
  pageHeight: number;
  margins: { top: number; right: number; bottom: number; left: number };
  onDrag?: (id: string, e: DraggableEvent, data: DraggableData) => void;
  onDragStop: (id: string, e: DraggableEvent, data: DraggableData) => void;
  onResizeStop: (id: string, e: React.SyntheticEvent, data: ResizeCallbackData) => void;
  onSelect: (id: string, ctrlKey?: boolean) => void;
  onUpdateElement: (id: string, updates: Partial<EditorElement>) => void;
  onToggleLink?: (titleId: string, tableId: string | null) => void;
  isOutOfBounds?: boolean;
  isOutOfPrintArea?: boolean;
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(element.content);
  const [isResizing, setIsResizing] = useState(false);
  const [resizingSize, setResizingSize] = useState({ width: 0, height: 0 });

  // Track current position during drag for real-time warning updates
  const [currentPosition, setCurrentPosition] = useState(element.position);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate warnings based on current position (during drag) or element position (static)
  const activePosition = isDragging ? currentPosition : element.position;
  const currentIsOutOfBounds =
    activePosition.x < 0 ||
    activePosition.x + element.size.width > pageWidth ||
    activePosition.y < 0 ||
    activePosition.y + element.size.height > pageHeight;

  const currentIsOutOfPrintArea = !currentIsOutOfBounds && (
    activePosition.x < margins.left ||
    activePosition.x + element.size.width > pageWidth - margins.right ||
    activePosition.y < margins.top ||
    activePosition.y + element.size.height > pageHeight - margins.bottom
  );

  const handleDoubleClick = () => {
    if (!element.locked && !isExporting) {
      setIsEditing(true);
      setEditedContent(element.content);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editedContent !== element.content) {
      onUpdateElement(element.id, { content: editedContent } as Partial<TableTitleElement>);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditedContent(element.content);
    }
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      defaultPosition={element.position}
      onDrag={(e, data) => {
        setIsDragging(true);
        setCurrentPosition({ x: data.x, y: data.y });
        if (onDrag) onDrag(element.id, e, data);
      }}
      onStop={(e, data) => {
        setIsDragging(false);
        setCurrentPosition({ x: data.x, y: data.y });
        onDragStop(element.id, e, data);
      }}
      bounds="parent"
      disabled={element.locked || isEditing}
      grid={snapEnabled ? [GRID_SIZE, GRID_SIZE] : undefined}
      cancel=".react-resizable-handle"
    >
      <div ref={nodeRef} className="absolute cursor-default" style={{ zIndex: element.zIndex }}>
        {/* Out of Bounds Warning */}
        {!isExporting && currentIsOutOfBounds && (
          <div className="absolute -top-8 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none z-[10000] whitespace-nowrap">
            ⚠️ خارج حدود الصفحة
          </div>
        )}
        {/* Out of Print Area Warning */}
        {!isExporting && currentIsOutOfPrintArea && (
          <div className="absolute -top-8 left-0 bg-yellow-500 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none z-[10000] whitespace-nowrap">
            ⚠️ خارج منطقة الطباعة
          </div>
        )}
        {/* Border wrapper with element-selected class */}
        <div
          className={cn(
            "relative transition-all duration-200",
            isSelected && !isExporting && "ring-4 ring-blue-500 ring-offset-2 element-selected"
          )}
          style={{
            overflow: 'visible',
            transform: `
              rotate(${element.transform.rotation}deg)
              scaleX(${element.transform.flipHorizontal ? -1 : 1})
              scaleY(${element.transform.flipVertical ? -1 : 1})
            `,
            transformOrigin: 'center center',
          }}
          onClick={(e) => {
            e.stopPropagation();
            // Phase 4: Support Ctrl+Click for multi-selection
            onSelect(element.id, e.ctrlKey);
          }}
          onDoubleClick={handleDoubleClick}
        >
          <Resizable
            width={isResizing ? resizingSize.width : element.size.width}
            height={isResizing ? resizingSize.height : element.size.height}
            onResize={(e, {size}) => {
              setIsResizing(true);
              // Apply grid snapping for smoother, faster resize (10px increments)
              const snappedWidth = Math.round(size.width / 10) * 10;
              const snappedHeight = Math.round(size.height / 10) * 10;
              setResizingSize({ width: snappedWidth, height: snappedHeight });
            }}
            onResizeStop={(e, data) => {
              setIsResizing(false);
              // Apply grid snapping to final size
              const snappedWidth = Math.round(data.size.width / 10) * 10;
              const snappedHeight = Math.round(data.size.height / 10) * 10;
              onResizeStop(element.id, e, { ...data, size: { width: snappedWidth, height: snappedHeight } });
            }}
            resizeHandles={['e', 'w']}
            minConstraints={[200, 40]}
            maxConstraints={[pageWidth - margins.left - margins.right, 80]}
          >
            <div
              style={{
                width: isResizing ? resizingSize.width : element.size.width,
                height: isResizing ? resizingSize.height : element.size.height,
              }}
            >
            <div
              className="w-full h-full flex items-center px-4"
              style={{
                textAlign: element.style.textAlign,
                transform: `scale(${(isResizing ? resizingSize.width : element.size.width) / element.size.width})`,
                transformOrigin: element.style.textAlign === 'right' ? 'right center' : element.style.textAlign === 'left' ? 'left center' : 'center center',
              }}
            >
              {isEditing ? (
                <input
                  type="text"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="w-full bg-white border-2 border-blue-500 rounded px-2 py-1 text-center"
                  style={{
                    fontSize: `${element.style.fontSize}px`,
                    fontWeight: element.style.fontWeight,
                    color: element.style.color,
                    direction: 'rtl',
                    fontFamily: editorSettings.fonts.family,
                  }}
                />
              ) : (
                <h3
                  className="font-semibold select-none w-full"
                  style={{
                    fontSize: `${element.style.fontSize}px`,
                    fontWeight: element.style.fontWeight,
                    color: element.style.color,
                    direction: 'rtl',
                    lineHeight: 1.5,
                    wordBreak: 'break-word',
                    fontFamily: editorSettings.fonts.family,
                    textRendering: 'optimizeLegibility',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                  }}
                >
                  {element.content}
                </h3>
              )}
            </div>

            {/* Link/Unlink Button */}
            {isSelected && !isExporting && onToggleLink && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLink(element.id, element.linkedTableId);
                }}
                className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs shadow-lg transition-colors"
                title={element.linkedTableId ? 'فك ربط العنوان من الجدول' : 'ربط العنوان بالجدول'}
              >
                {element.linkedTableId ? '🔗 مربوط' : '🔓 غير مربوط'}
              </button>
            )}

            {/* Rotation Handle */}
            {isSelected && !isExporting && (
              <RotationHandle
                rotation={element.transform.rotation}
                onRotate={(rotation) => {
                  onUpdateElement(element.id, {
                    transform: { ...element.transform, rotation }
                  } as Partial<TableTitleElement>);
                }}
                elementRef={nodeRef}
                snapToAngles={true}
              />
            )}
            </div>
          </Resizable>
        </div>
      </div>
    </Draggable>
  );
};

// ============================================================================
// Table Component (React.memo removed to allow local state updates during resize)
// ============================================================================

const DraggableTable = ({
  element,
  isSelected,
  isExporting,
  editorSettings,
  snapEnabled,
  GRID_SIZE,
  pageWidth,
  pageHeight,
  margins,
  onDrag,
  onDragStop,
  onResizeStop,
  onSelect,
  onUpdateElement,
  isOutOfBounds,
  isOutOfPrintArea,
}: {
  element: TableElement;
  isSelected: boolean;
  isExporting?: boolean;
  editorSettings: EditorSettings;
  snapEnabled: boolean;
  GRID_SIZE: number;
  pageWidth: number;
  pageHeight: number;
  margins: { top: number; right: number; bottom: number; left: number };
  onDrag?: (id: string, e: DraggableEvent, data: DraggableData) => void;
  onDragStop: (id: string, e: DraggableEvent, data: DraggableData) => void;
  onResizeStop: (id: string, e: React.SyntheticEvent, data: ResizeCallbackData) => void;
  onSelect: (id: string, ctrlKey?: boolean) => void;
  onUpdateElement: (id: string, updates: Partial<EditorElement>) => void;
  isOutOfBounds?: boolean;
  isOutOfPrintArea?: boolean;
}) => {
  // Create ref for React 19 compatibility (avoid findDOMNode)
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizingSize, setResizingSize] = useState({ width: 0, height: 0 });

  // Track current position during drag for real-time warning updates
  const [currentPosition, setCurrentPosition] = useState(element.position);
  const [isDragging, setIsDragging] = useState(false);

  // Column reordering functions
  const moveColumnLeft = (idx: number) => {
    if (idx >= element.headers.length - 1) return; // Can't move last column left (RTL)
    const newHeaders = [...element.headers];
    // Swap with next column (in RTL, "left" means higher index)
    [newHeaders[idx], newHeaders[idx + 1]] = [newHeaders[idx + 1], newHeaders[idx]];
    onUpdateElement(element.id, { headers: newHeaders });
  };

  const moveColumnRight = (idx: number) => {
    if (idx <= 0) return; // Can't move first column right (RTL)
    const newHeaders = [...element.headers];
    // Swap with previous column (in RTL, "right" means lower index)
    [newHeaders[idx], newHeaders[idx - 1]] = [newHeaders[idx - 1], newHeaders[idx]];
    onUpdateElement(element.id, { headers: newHeaders });
  };

  // Row reordering functions
  const moveRowUp = (rowIdx: number) => {
    if (rowIdx <= 0) return; // Can't move first row up
    const newRows = [...element.rows];
    [newRows[rowIdx], newRows[rowIdx - 1]] = [newRows[rowIdx - 1], newRows[rowIdx]];
    onUpdateElement(element.id, { rows: newRows });
  };

  const moveRowDown = (rowIdx: number) => {
    if (rowIdx >= element.rows.length - 1) return; // Can't move last row down
    const newRows = [...element.rows];
    [newRows[rowIdx], newRows[rowIdx + 1]] = [newRows[rowIdx + 1], newRows[rowIdx]];
    onUpdateElement(element.id, { rows: newRows });
  };

  // Calculate warnings based on current position (during drag) or element position (static)
  const activePosition = isDragging ? currentPosition : element.position;
  const currentIsOutOfBounds =
    activePosition.x < 0 ||
    activePosition.x + element.size.width > pageWidth ||
    activePosition.y < 0 ||
    activePosition.y + element.size.height > pageHeight;

  const currentIsOutOfPrintArea = !currentIsOutOfBounds && (
    activePosition.x < margins.left ||
    activePosition.x + element.size.width > pageWidth - margins.right ||
    activePosition.y < margins.top ||
    activePosition.y + element.size.height > pageHeight - margins.bottom
  );

  return (
    <Draggable
      nodeRef={nodeRef}
      defaultPosition={element.position}
      onDrag={(e, data) => {
        setIsDragging(true);
        setCurrentPosition({ x: data.x, y: data.y });
        if (onDrag) onDrag(element.id, e, data);
      }}
      onStop={(e, data) => {
        setIsDragging(false);
        setCurrentPosition({ x: data.x, y: data.y });
        onDragStop(element.id, e, data);
      }}
      bounds="parent"
      disabled={element.locked}
      grid={snapEnabled ? [GRID_SIZE, GRID_SIZE] : undefined}
      cancel=".react-resizable-handle"
    >
      <div ref={nodeRef} className="absolute cursor-default" style={{ zIndex: element.zIndex }}>
        {/* Out of Bounds Warning */}
        {!isExporting && currentIsOutOfBounds && (
          <div className="absolute -top-8 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none z-[10000] whitespace-nowrap">
            ⚠️ خارج حدود الصفحة
          </div>
        )}
        {/* Out of Print Area Warning */}
        {!isExporting && currentIsOutOfPrintArea && (
          <div className="absolute -top-8 left-0 bg-yellow-500 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none z-[10000] whitespace-nowrap">
            ⚠️ خارج منطقة الطباعة
          </div>
        )}
        {/* Border wrapper with element-selected class */}
        <div
          className={cn(
            "relative transition-all duration-200",
            isSelected && !isExporting && "ring-4 ring-blue-500 ring-offset-2 element-selected"
          )}
          style={{
            // Apply CSS transforms
            transform: `
              rotate(${element.transform.rotation}deg)
              scaleX(${element.transform.flipHorizontal ? -1 : 1})
              scaleY(${element.transform.flipVertical ? -1 : 1})
              scale(${element.transform.scale.x}, ${element.transform.scale.y})
            `,
            transformOrigin: 'center center',
          }}
          onClick={(e) => {
            e.stopPropagation();
            // Phase 4: Support Ctrl+Click for multi-selection
            onSelect(element.id, e.ctrlKey);
          }}
        >
          <Resizable
            width={isResizing ? resizingSize.width : element.size.width}
            height={isResizing ? resizingSize.height : element.size.height}
            onResize={(e, {size}) => {
              setIsResizing(true);
              // Apply grid snapping for smoother, faster resize (10px increments)
              const snappedWidth = Math.round(size.width / 10) * 10;
              const snappedHeight = Math.round(size.height / 10) * 10;
              setResizingSize({ width: snappedWidth, height: snappedHeight });
            }}
            onResizeStop={(e, data) => {
              setIsResizing(false);
              // Apply grid snapping to final size
              const snappedWidth = Math.round(data.size.width / 10) * 10;
              const snappedHeight = Math.round(data.size.height / 10) * 10;
              onResizeStop(element.id, e, { ...data, size: { width: snappedWidth, height: snappedHeight } });
            }}
            resizeHandles={['se', 'sw', 'ne', 'nw']}
            minConstraints={[200, 100]}
            maxConstraints={[pageWidth - margins.left - margins.right, pageHeight - margins.top - margins.bottom]}
          >
            <div
              style={{
                width: isResizing ? resizingSize.width : element.size.width,
                height: isResizing ? resizingSize.height : element.size.height,
              }}
            >
            {/* Table title removed - now handled by separate TableTitleElement */}

            <div
              className="overflow-auto"
              style={{
                maxHeight: isExporting ? 'none' : element.size.height,
                height: isExporting ? 'auto' : undefined,
                borderRadius: '8px',
              }}
            >
              <table
                className="w-full"
                dir="rtl"
                style={{
                  borderCollapse: 'separate',
                  borderSpacing: 0,
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                }}
              >
                <thead>
                  <tr>
                    {element.headers.map((header, idx) => (
                      <th
                        key={idx}
                        style={{
                          backgroundColor: editorSettings.colors.headerBg,
                          color: editorSettings.colors.headerText,
                          fontSize: `${editorSettings.fonts.sizes.tableHeader}px`,
                          fontWeight: editorSettings.fonts.weights.tableHeader,
                          fontFamily: editorSettings.fonts.family,
                          direction: 'rtl',
                          unicodeBidi: 'bidi-override',
                          textRendering: 'optimizeLegibility',
                          WebkitFontSmoothing: 'antialiased',
                          MozOsxFontSmoothing: 'grayscale',
                          padding: isSelected ? '6px 8px' : '14px 16px',
                          textAlign: 'center',
                          borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
                          borderLeft: idx !== element.headers.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                          whiteSpace: 'nowrap',
                          lineHeight: '1.5',
                        }}
                      >
                        {/* Column reorder arrows - only show when selected */}
                        {isSelected && !isExporting && (
                          <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '2px',
                            marginBottom: '4px'
                          }}>
                            {/* Move Right Arrow (in RTL, right = lower index) */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveColumnRight(idx);
                              }}
                              disabled={idx <= 0}
                              style={{
                                background: idx <= 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.25)',
                                border: 'none',
                                borderRadius: '3px',
                                padding: '2px 6px',
                                cursor: idx <= 0 ? 'not-allowed' : 'pointer',
                                color: idx <= 0 ? 'rgba(255,255,255,0.3)' : 'white',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                transition: 'all 0.15s ease',
                              }}
                              title="نقل العمود لليمين"
                            >
                              →
                            </button>
                            {/* Move Left Arrow (in RTL, left = higher index) */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveColumnLeft(idx);
                              }}
                              disabled={idx >= element.headers.length - 1}
                              style={{
                                background: idx >= element.headers.length - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.25)',
                                border: 'none',
                                borderRadius: '3px',
                                padding: '2px 6px',
                                cursor: idx >= element.headers.length - 1 ? 'not-allowed' : 'pointer',
                                color: idx >= element.headers.length - 1 ? 'rgba(255,255,255,0.3)' : 'white',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                transition: 'all 0.15s ease',
                              }}
                              title="نقل العمود لليسار"
                            >
                              ←
                            </button>
                          </div>
                        )}
                        {/* Editable header text */}
                        <span
                          contentEditable={isSelected}
                          suppressContentEditableWarning
                          style={{
                            display: 'block',
                            cursor: isSelected ? 'text' : 'default',
                            outline: 'none',
                            minWidth: '40px',
                          }}
                          onBlur={(e) => {
                            const newValue = e.currentTarget.textContent?.trim() || header;
                            if (newValue !== header) {
                              const newHeaders = [...element.headers];
                              const oldHeader = newHeaders[idx];
                              newHeaders[idx] = newValue;

                              // Update rows to use new header key
                              const newRows = element.rows.map(row => {
                                const newRow = { ...row };
                                if (oldHeader !== newValue) {
                                  newRow[newValue] = row[oldHeader];
                                  delete newRow[oldHeader];
                                }
                                return newRow;
                              });

                              onUpdateElement(element.id, { headers: newHeaders, rows: newRows });
                            }
                          }}
                        >
                          {header}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {element.rows.map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      style={{
                        backgroundColor: rowIdx % 2 === 0 ? '#ffffff' : '#f8fafc',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {element.headers.map((header, cellIdx) => (
                        <td
                          key={cellIdx}
                          style={{
                            fontSize: `${editorSettings.fonts.sizes.tableCell}px`,
                            color: editorSettings.colors.rowText,
                            fontFamily: editorSettings.fonts.family,
                            direction: 'rtl',
                            unicodeBidi: 'bidi-override',
                            textRendering: 'optimizeLegibility',
                            WebkitFontSmoothing: 'antialiased',
                            MozOsxFontSmoothing: 'grayscale',
                            padding: '12px 16px',
                            textAlign: 'center',
                            borderBottom: rowIdx !== element.rows.length - 1 ? '1px solid #e2e8f0' : 'none',
                            borderLeft: cellIdx !== element.headers.length - 1 ? '1px solid #e2e8f0' : 'none',
                            lineHeight: '1.6',
                            minHeight: '44px',
                            verticalAlign: 'middle',
                            position: 'relative',
                          }}
                        >
                          {/* Row reorder arrows - only show on first cell when selected */}
                          {cellIdx === 0 && isSelected && !isExporting && (
                            <div style={{
                              position: 'absolute',
                              right: '4px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px',
                              zIndex: 10,
                            }}>
                              {/* Move Up Arrow */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveRowUp(rowIdx);
                                }}
                                disabled={rowIdx <= 0}
                                style={{
                                  background: rowIdx <= 0 ? 'rgba(0,0,0,0.15)' : 'rgba(59,130,246,0.9)',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '4px 8px',
                                  cursor: rowIdx <= 0 ? 'not-allowed' : 'pointer',
                                  color: rowIdx <= 0 ? 'rgba(0,0,0,0.3)' : 'white',
                                  fontSize: '14px',
                                  fontWeight: 'bold',
                                  transition: 'all 0.15s ease',
                                  lineHeight: 1,
                                  minWidth: '24px',
                                  minHeight: '20px',
                                }}
                                title="نقل لأعلى"
                              >
                                ↑
                              </button>
                              {/* Move Down Arrow */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveRowDown(rowIdx);
                                }}
                                disabled={rowIdx >= element.rows.length - 1}
                                style={{
                                  background: rowIdx >= element.rows.length - 1 ? 'rgba(0,0,0,0.15)' : 'rgba(59,130,246,0.9)',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '4px 8px',
                                  cursor: rowIdx >= element.rows.length - 1 ? 'not-allowed' : 'pointer',
                                  color: rowIdx >= element.rows.length - 1 ? 'rgba(0,0,0,0.3)' : 'white',
                                  fontSize: '14px',
                                  fontWeight: 'bold',
                                  transition: 'all 0.15s ease',
                                  lineHeight: 1,
                                  minWidth: '24px',
                                  minHeight: '20px',
                                }}
                                title="نقل لأسفل"
                              >
                                ↓
                              </button>
                            </div>
                          )}
                          {/* Cell content - check if signature (base64 image) or text */}
                          {row[header]?.startsWith?.('data:image') ? (
                            // Signature cell - render as image (larger size when exporting for better print quality)
                            <div style={{
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              paddingRight: isSelected && !isExporting && cellIdx === 0 ? '24px' : '0',
                            }}>
                              <img
                                src={row[header]}
                                alt="توقيع"
                                style={{
                                  maxWidth: isExporting ? '180px' : '120px',
                                  maxHeight: isExporting ? '70px' : '50px',
                                  objectFit: 'contain',
                                }}
                              />
                            </div>
                          ) : (
                            // Regular cell - editable text
                            <span
                              contentEditable={isSelected}
                              suppressContentEditableWarning
                              style={{
                                display: 'block',
                                outline: 'none',
                                paddingRight: isSelected && !isExporting && cellIdx === 0 ? '24px' : '0',
                              }}
                              onBlur={(e) => {
                                const newRows = [...element.rows];
                                newRows[rowIdx][header] = e.currentTarget.textContent || '';
                                onUpdateElement(element.id, { rows: newRows });
                              }}
                            >
                              {row[header] || '-'}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Resize Tooltip - Shows during resizing */}
            {isResizing && (
              <div className="resize-tooltip absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap z-50 shadow-2xl border-2 border-white">
                <div className="flex items-center gap-2">
                  <span className="text-blue-100">📏</span>
                  <span>{Math.round(resizingSize.width)} × {Math.round(resizingSize.height)} px</span>
                </div>
              </div>
            )}

            {isSelected && !isExporting && (
              <>
                <div className="absolute -top-8 left-0 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap z-10">
                  جدول • {Math.round(element.size.width)}×{Math.round(element.size.height)}px
                </div>
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
                <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
                <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />

                {/* Rotation Handle */}
                <RotationHandle
                  rotation={element.transform.rotation}
                  onRotate={(rotation) => {
                    onUpdateElement(element.id, {
                      transform: { ...element.transform, rotation }
                    } as Partial<TableElement>);
                  }}
                  elementRef={nodeRef}
                  snapToAngles={true}
                />
              </>
            )}
            </div>
          </Resizable>
        </div>
      </div>
    </Draggable>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export function EnhancedHTMLEditor({
  settings: externalSettings,
  sampleData,
  zoom: externalZoom = 1.0,
  onExport,
  onBack,
}: EnhancedHTMLEditorProps) {
  // ============================================================================
  // State Management
  // ============================================================================

  // Internal editor settings (independent from external settings)
  const [editorSettings, setEditorSettings] = useState<EditorSettings>(() => {
    // If external settings provided, convert them to EditorSettings format
    if (externalSettings) {
      return {
        page: {
          size: 'a4',
          orientation: externalSettings.page.orientation,
          width: externalSettings.page.orientation === 'landscape' ? 1980 : 1400,
          height: externalSettings.page.orientation === 'landscape' ? 1400 : 1980,
          margins: externalSettings.page.margins,
        },
        colors: {
          eventTitleText: externalSettings.colors.eventTitleText,
          headerBg: externalSettings.colors.headerBg,
          headerText: externalSettings.colors.headerText,
          rowBg: externalSettings.colors.secondary,
          rowText: externalSettings.colors.text,
          borderColor: externalSettings.colors.border,
        },
        fonts: {
          family: externalSettings.fonts.family,
          sizes: {
            eventTitle: externalSettings.fonts.sizes.eventTitle,
            tableTitle: externalSettings.fonts.sizes.tableTitle,
            tableHeader: externalSettings.fonts.sizes.header,
            tableCell: externalSettings.fonts.sizes.content,
          },
          weights: {
            eventTitle: externalSettings.fonts.weights.eventTitle,
            tableTitle: externalSettings.fonts.weights.tableTitle,
            tableHeader: externalSettings.fonts.weights.header,
            tableCell: externalSettings.fonts.weights.content,
          },
        },
      };
    }
    // Otherwise use default settings
    return DEFAULT_EDITOR_SETTINGS;
  });

  // Phase 7: Pages state
  const [pages, setPages] = useState<Page[]>([
    { id: 'page-1', name: 'صفحة 1', order: 0 }
  ]);
  const [currentPageId, setCurrentPageId] = useState<string>('page-1');

  const [elements, setElements] = useState<EditorElement[]>([]);
  // Phase 4: Multi-selection support - changed from single ID to array of IDs
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);

  // Responsive zoom: 25% on mobile, 40% on desktop
  const getInitialZoom = () => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024 ? 0.25 : 0.4;
    }
    return 0.4;
  };
  const [zoom, setZoom] = useState(getInitialZoom);

  const [gridEnabled, setGridEnabled] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [showLayers, setShowLayers] = useState(true);

  // Mobile responsive states
  const [mobileLayersOpen, setMobileLayersOpen] = useState(false);
  const [mobilePagesOpen, setMobilePagesOpen] = useState(false);
  const [editingCellId, setEditingCellId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showBackgroundPanel, setShowBackgroundPanel] = useState(false);
  const [showTransformPanel, setShowTransformPanel] = useState(false);

  // Track resizing state for all elements
  const [resizingElements, setResizingElements] = useState<Record<string, {
    width: number;
    height: number;
    originalFontSize?: number;
    originalWidth?: number;
  }>>({});

  // Phase 4: Clipboard for copy/paste
  const [clipboard, setClipboard] = useState<EditorElement[]>([]);

  // Track which text element is being edited
  const [editingTextElementId, setEditingTextElementId] = useState<string | null>(null);

  // Alignment guides state (Phase 2)
  const [alignmentGuides, setAlignmentGuides] = useState<{
    vertical: number[];   // X positions for vertical lines
    horizontal: number[]; // Y positions for horizontal lines
  }>({ vertical: [], horizontal: [] });
  const [isDragging, setIsDragging] = useState(false);
  const [alignmentType, setAlignmentType] = useState<string>(''); // Type of alignment (center, margin, element)

  // History for undo/redo
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // ============================================================================
  // Constants
  // ============================================================================
  
  const GRID_SIZE = 20;
  const SNAP_THRESHOLD = 10;
  
  // Page dimensions from editor settings
  const pageWidth = editorSettings.page.width;
  const pageHeight = editorSettings.page.height;

  // Convert margins from mm to pixels
  const mmToPx = 3.7795;
  const margins = useMemo(() => ({
    top: editorSettings.page.margins.top * mmToPx,
    right: editorSettings.page.margins.right * mmToPx,
    bottom: editorSettings.page.margins.bottom * mmToPx,
    left: editorSettings.page.margins.left * mmToPx,
  }), [editorSettings.page.margins]);

  // ============================================================================
  // History Management (Moved before useEffect)
  // ============================================================================

  const saveToHistory = useCallback((newElements: EditorElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      elements: JSON.parse(JSON.stringify(newElements)),
      timestamp: Date.now(),
    });

    // Limit history to 50 states
    if (newHistory.length > 50) {
      newHistory.shift();
    }

    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // ============================================================================
  // Initialize Elements from Sample Data (with error handling)
  // ============================================================================

  useEffect(() => {
    if (sampleData && elements.length === 0) {
      try {
        const initialElements: EditorElement[] = [];

        // Add Event Title as first element (if exists)
        if (sampleData.eventTitle) {
          const titleElement: TitleElement = {
            id: 'event-title',
            type: 'title',
            content: sampleData.eventTitle,
            pageId: 'page-1', // Phase 7: Assign to first page
            position: {
              x: margins.left,
              y: margins.top
            },
            size: {
              width: pageWidth - margins.left - margins.right,
              height: 260
            },
            visible: true,
            locked: false,
            zIndex: 1000, // High z-index to keep on top
            transform: { ...DEFAULT_TRANSFORM },
            style: {
              fontSize: editorSettings.fonts.sizes.eventTitle,
              fontWeight: editorSettings.fonts.weights.eventTitle,
              color: editorSettings.colors.eventTitleText,
              textAlign: 'center',
              background: {
                type: 'gradient',
                opacity: 1,
                gradient: {
                  type: 'linear',
                  angle: 135,
                  startColor: '#1e293b',
                  endColor: '#334155',
                },
                border: {
                  width: 0,
                  color: '#e5e7eb',
                  radius: 12,
                  style: 'none',
                },
                shadow: {
                  enabled: true,
                  color: 'rgba(0, 0, 0, 0.1)',
                  blur: 12,
                  offsetX: 0,
                  offsetY: 4,
                },
              },
            },
          };
          initialElements.push(titleElement);
        }

        // Add Tables with separate Table Titles
        sampleData.tables.forEach((table, index) => {
          // Validate table data
          if (!table.title || !table.headers || !Array.isArray(table.rows)) {
            console.warn(`Invalid table data at index ${index}`, table);
            return;
          }

          // Calculate Y position: start after event title (if exists) + spacing
          const eventTitleHeight = sampleData.eventTitle ? 260 : 0; // Match actual title height
          const startY = margins.top + eventTitleHeight + 150; // 150px spacing after title for clear separation
          const tableTitleHeight = 50; // Height for table title
          const tableSpacing = 50; // Spacing between title and table
          const tableGroupHeight = 350; // Total height for title + table + spacing

          const tableId = `table-${index}`;
          const tableTitleId = `table-title-${index}`;

          // Create Table Title Element (separate from table)
          const tableTitleElement: TableTitleElement = {
            id: tableTitleId,
            type: 'table-title',
            content: table.title,
            linkedTableId: tableId, // Initially linked to the table
            pageId: 'page-1', // Phase 7: Assign to first page
            position: {
              x: margins.left,
              y: startY + (index * tableGroupHeight)
            },
            size: {
              width: pageWidth - margins.left - margins.right,
              height: tableTitleHeight
            },
            visible: true,
            locked: false,
            zIndex: 100 + (index * 2), // Higher z-index than table
            transform: { ...DEFAULT_TRANSFORM },
            style: {
              fontSize: editorSettings.fonts.sizes.tableTitle,
              fontWeight: editorSettings.fonts.weights.tableTitle,
              color: editorSettings.colors.rowText,
              textAlign: 'right',
            },
          };

          // Create Table Element (without title)
          const tableElement: TableElement = {
            id: tableId,
            type: 'table',
            headers: table.headers,
            rows: table.rows,
            pageId: 'page-1', // Phase 7: Assign to first page
            position: {
              x: margins.left,
              y: startY + (index * tableGroupHeight) + tableTitleHeight + tableSpacing
            },
            size: {
              width: pageWidth - margins.left - margins.right,
              height: 250
            },
            visible: true,
            locked: false,
            zIndex: 100 + (index * 2) - 1, // Lower z-index than title
            transform: { ...DEFAULT_TRANSFORM },
          };

          initialElements.push(tableTitleElement, tableElement);
        });

        if (initialElements.length > 0) {
          setElements(initialElements);
          saveToHistory(initialElements);
        }
      } catch (error) {
        console.error('Failed to initialize elements:', error);
      }
    }
  }, [sampleData, elements.length, margins, pageWidth, saveToHistory]);
  
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(JSON.parse(JSON.stringify(history[historyIndex - 1].elements)));
    }
  }, [history, historyIndex]);
  
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(JSON.parse(JSON.stringify(history[historyIndex + 1].elements)));
    }
  }, [history, historyIndex]);
  
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // ============================================================================
  // Phase 7.2: Clear selection if selected elements are not on current page
  // ============================================================================

  useEffect(() => {
    // Filter out any selected elements that are not on the current page
    const validSelectedIds = selectedElementIds.filter(id => {
      const element = elements.find(el => el.id === id);
      return element && element.pageId === currentPageId;
    });

    // If some elements were filtered out, update the selection
    if (validSelectedIds.length !== selectedElementIds.length) {
      setSelectedElementIds(validSelectedIds);
    }
  }, [currentPageId, selectedElementIds, elements]);

  // ============================================================================
  // Phase 4: Keyboard Shortcuts (moved to after all functions are defined)
  // ============================================================================

  // ============================================================================
  // Zoom Controls
  // ============================================================================
  
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.1, 2.0));
  }, []);
  
  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.1, 0.1));
  }, []);
  
  const handleZoomFit = useCallback(() => {
    if (canvasRef.current && canvasRef.current.parentElement) {
      const container = canvasRef.current.parentElement;
      const containerWidth = container.clientWidth - 64;
      const containerHeight = container.clientHeight - 64;
      
      const scaleX = containerWidth / pageWidth;
      const scaleY = containerHeight / pageHeight;
      
      const fitZoom = Math.min(scaleX, scaleY, 1.0);
      setZoom(fitZoom);
    }
  }, [pageWidth, pageHeight]);
  
  const handleZoomReset = useCallback(() => {
    // Reset to appropriate zoom based on screen size
    const isMobile = window.innerWidth < 1024;
    setZoom(isMobile ? 0.25 : 0.4);
  }, []);
  
  // ============================================================================
  // Snap to Grid Helper
  // ============================================================================

  const snapToGrid = useCallback((value: number) => {
    if (!snapEnabled) return value;
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }, [snapEnabled]);

  // ============================================================================
  // Element Manipulation (Optimized with debouncing)
  // ============================================================================

  const updateElementDebounced = useRef<NodeJS.Timeout | null>(null);

  const updateElement = useCallback((id: string, updates: Partial<Omit<EditorElement, 'type'>>) => {
    setElements(prev => {
      const newElements = prev.map(el =>
        el.id === id ? { ...el, ...updates } : el
      );

      // Debounce history save to avoid too many history entries during drag
      if (updateElementDebounced.current) {
        clearTimeout(updateElementDebounced.current);
      }

      updateElementDebounced.current = setTimeout(() => {
        saveToHistory(newElements);
      }, 300);

      return newElements;
    });
  }, [saveToHistory]);

  const deleteElement = useCallback((id: string) => {
    setElements(prev => {
      const newElements = prev.filter(el => el.id !== id);
      saveToHistory(newElements);
      return newElements;
    });
    // Phase 4: Update to handle multi-selection
    setSelectedElementIds(prev => prev.filter(selectedId => selectedId !== id));
  }, [saveToHistory]);

  const toggleElementVisibility = useCallback((id: string) => {
    setElements(prev =>
      prev.map(el =>
        el.id === id ? { ...el, visible: !el.visible } : el
      )
    );
  }, []);

  // ============================================================================
  // Layer Ordering Functions (Z-Index Management)
  // ============================================================================

  /**
   * Bring element one layer forward (increase z-index)
   * Swaps z-index with the element that has the next higher z-index
   */
  const bringForward = useCallback((id: string) => {
    setElements(prev => {
      const currentElement = prev.find(el => el.id === id);
      if (!currentElement) return prev;

      // Get elements on the same page, sorted by z-index
      const pageElements = prev
        .filter(el => el.pageId === currentElement.pageId)
        .sort((a, b) => a.zIndex - b.zIndex);

      // Find the element with the next higher z-index
      const currentIndex = pageElements.findIndex(el => el.id === id);
      if (currentIndex === pageElements.length - 1) return prev; // Already at top

      const nextElement = pageElements[currentIndex + 1];

      // Swap z-indices
      const newElements = prev.map(el => {
        if (el.id === id) {
          return { ...el, zIndex: nextElement.zIndex };
        }
        if (el.id === nextElement.id) {
          return { ...el, zIndex: currentElement.zIndex };
        }
        return el;
      });

      saveToHistory(newElements);
      return newElements;
    });
  }, [saveToHistory]);

  /**
   * Send element one layer backward (decrease z-index)
   * Swaps z-index with the element that has the next lower z-index
   */
  const sendBackward = useCallback((id: string) => {
    setElements(prev => {
      const currentElement = prev.find(el => el.id === id);
      if (!currentElement) return prev;

      // Get elements on the same page, sorted by z-index
      const pageElements = prev
        .filter(el => el.pageId === currentElement.pageId)
        .sort((a, b) => a.zIndex - b.zIndex);

      // Find the element with the next lower z-index
      const currentIndex = pageElements.findIndex(el => el.id === id);
      if (currentIndex === 0) return prev; // Already at bottom

      const prevElement = pageElements[currentIndex - 1];

      // Swap z-indices
      const newElements = prev.map(el => {
        if (el.id === id) {
          return { ...el, zIndex: prevElement.zIndex };
        }
        if (el.id === prevElement.id) {
          return { ...el, zIndex: currentElement.zIndex };
        }
        return el;
      });

      saveToHistory(newElements);
      return newElements;
    });
  }, [saveToHistory]);

  // ============================================================================
  // Phase 4: Multi-Selection Functions
  // ============================================================================

  // Helper: Get the primary selected element (for backward compatibility)
  const selectedElementId = selectedElementIds.length > 0 ? selectedElementIds[0] : null;

  // Helper: Set single selected element (for backward compatibility)
  const setSelectedElementId = useCallback((id: string | null) => {
    if (id === null) {
      setSelectedElementIds([]);
    } else {
      setSelectedElementIds([id]);
    }
  }, []);

  const handleElementSelect = useCallback((elementId: string, ctrlKey: boolean = false) => {
    // Phase 7.2: Only allow selection of elements on current page
    const element = elements.find(el => el.id === elementId);
    if (!element || element.pageId !== currentPageId) return;

    if (ctrlKey) {
      // Multi-selection with Ctrl
      setSelectedElementIds(prev => {
        if (prev.includes(elementId)) {
          // Deselect if already selected
          return prev.filter(id => id !== elementId);
        } else {
          // Add to selection
          return [...prev, elementId];
        }
      });
    } else {
      // Single selection (replace current selection)
      setSelectedElementIds([elementId]);
    }
  }, [elements, currentPageId]);

  const clearSelection = useCallback(() => {
    setSelectedElementIds([]);
  }, []);

  const selectAll = useCallback(() => {
    // Phase 7: Select only elements on current page
    const currentPageElements = elements.filter(el => el.pageId === currentPageId);
    setSelectedElementIds(currentPageElements.map(el => el.id));
  }, [elements, currentPageId]);

  // ============================================================================
  // Phase 7: Page Management Functions
  // ============================================================================

  const addPage = useCallback(() => {
    const newPageNumber = pages.length + 1;
    const newPage: Page = {
      id: `page-${Date.now()}`,
      name: `صفحة ${newPageNumber}`,
      order: pages.length,
    };
    setPages(prev => [...prev, newPage]);
    setCurrentPageId(newPage.id); // Switch to new page
  }, [pages]);

  const deletePage = useCallback((pageId: string) => {
    // Don't allow deleting the last page
    if (pages.length === 1) {
      alert('لا يمكن حذف الصفحة الأخيرة');
      return;
    }

    // Check if page has elements
    const pageElements = elements.filter(el => el.pageId === pageId);
    if (pageElements.length > 0) {
      const confirmed = confirm(`هذه الصفحة تحتوي على ${pageElements.length} عنصر. هل تريد حذفها؟`);
      if (!confirmed) return;
    }

    // Delete page and its elements
    setPages(prev => prev.filter(p => p.id !== pageId).map((p, index) => ({ ...p, order: index })));
    setElements(prev => prev.filter(el => el.pageId !== pageId));

    // Switch to first page if current page was deleted
    if (currentPageId === pageId) {
      setCurrentPageId(pages[0].id);
    }
  }, [pages, elements, currentPageId]);

  const goToPage = useCallback((pageId: string) => {
    setCurrentPageId(pageId);
    setSelectedElementIds([]); // Clear selection when switching pages
  }, []);

  const getCurrentPage = useCallback(() => {
    return pages.find(p => p.id === currentPageId) || pages[0];
  }, [pages, currentPageId]);

  const getCurrentPageElements = useCallback(() => {
    return elements.filter(el => el.pageId === currentPageId);
  }, [elements, currentPageId]);

  const moveElementsToPage = useCallback((elementIds: string[], targetPageId: string) => {
    if (elementIds.length === 0) return;

    setElements(prev => {
      const updated = prev.map(el => {
        if (elementIds.includes(el.id)) {
          return { ...el, pageId: targetPageId };
        }
        return el;
      });
      saveToHistory(updated);
      return updated;
    });

    // Clear selection after moving
    setSelectedElementIds([]);
  }, [saveToHistory]);

  // ============================================================================
  // Phase 7: End of Page Management Functions
  // ============================================================================

  const deleteSelectedElements = useCallback(() => {
    if (selectedElementIds.length === 0) return;

    setElements(prev => {
      const newElements = prev.filter(el => !selectedElementIds.includes(el.id));
      saveToHistory(newElements);
      return newElements;
    });
    setSelectedElementIds([]);
  }, [selectedElementIds, saveToHistory]);

  // Copy selected elements to clipboard
  const copySelectedElements = useCallback(() => {
    if (selectedElementIds.length === 0) return;

    const elementsToCopy = elements.filter(el => selectedElementIds.includes(el.id));
    setClipboard(JSON.parse(JSON.stringify(elementsToCopy))); // Deep copy
  }, [selectedElementIds, elements]);

  // Paste elements from clipboard
  const pasteElements = useCallback(() => {
    if (clipboard.length === 0) return;

    const newElements = clipboard.map(el => ({
      ...el,
      id: `${el.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      pageId: currentPageId, // Phase 7: Paste to current page
      position: {
        x: el.position.x + 20, // Offset by 20px
        y: el.position.y + 20,
      },
    }));

    setElements(prev => {
      const updated = [...prev, ...newElements];
      saveToHistory(updated);
      return updated;
    });

    // Select the newly pasted elements
    setSelectedElementIds(newElements.map(el => el.id));
  }, [clipboard, saveToHistory, currentPageId]);

  // ============================================================================
  // Element Bounds Checking
  // ============================================================================

  const isElementOutOfBounds = useCallback((element: EditorElement): boolean => {
    const { position, size } = element;

    // Check if element is outside page bounds
    const isOutLeft = position.x < 0;
    const isOutRight = position.x + size.width > pageWidth;
    const isOutTop = position.y < 0;
    const isOutBottom = position.y + size.height > pageHeight;

    return isOutLeft || isOutRight || isOutTop || isOutBottom;
  }, [pageWidth, pageHeight]);

  const isElementOutOfPrintArea = useCallback((element: EditorElement): boolean => {
    const { position, size } = element;

    // Check if element is outside print margins
    const isOutLeft = position.x < margins.left;
    const isOutRight = position.x + size.width > pageWidth - margins.right;
    const isOutTop = position.y < margins.top;
    const isOutBottom = position.y + size.height > pageHeight - margins.bottom;

    return isOutLeft || isOutRight || isOutTop || isOutBottom;
  }, [pageWidth, pageHeight, margins]);

  const fitElementToPage = useCallback((elementId: string) => {
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    let newX = element.position.x;
    let newY = element.position.y;

    // Constrain to page bounds
    if (newX < margins.left) newX = margins.left;
    if (newX + element.size.width > pageWidth - margins.right) {
      newX = pageWidth - margins.right - element.size.width;
    }
    if (newY < margins.top) newY = margins.top;
    if (newY + element.size.height > pageHeight - margins.bottom) {
      newY = pageHeight - margins.bottom - element.size.height;
    }

    updateElement(elementId, {
      position: { x: newX, y: newY }
    });
  }, [elements, pageWidth, pageHeight, margins, updateElement]);

  const fitAllElementsToPage = useCallback(() => {
    elements.forEach(element => {
      if (isElementOutOfBounds(element) || isElementOutOfPrintArea(element)) {
        fitElementToPage(element.id);
      }
    });
  }, [elements, isElementOutOfBounds, isElementOutOfPrintArea, fitElementToPage]);

  // ============================================================================
  // Phase 5: Alignment Functions
  // ============================================================================

  // Align selected elements to the left
  const alignLeft = useCallback(() => {
    if (selectedElementIds.length < 2) return;

    const selectedElements = elements.filter(el => selectedElementIds.includes(el.id));
    const leftMost = Math.min(...selectedElements.map(el => el.position.x));

    setElements(prev => {
      const updated = prev.map(el => {
        if (selectedElementIds.includes(el.id)) {
          return { ...el, position: { ...el.position, x: leftMost } };
        }
        return el;
      });
      saveToHistory(updated);
      return updated;
    });
  }, [selectedElementIds, elements, saveToHistory]);

  // Align selected elements to the center horizontally
  const alignCenterHorizontal = useCallback(() => {
    if (selectedElementIds.length < 2) return;

    const selectedElements = elements.filter(el => selectedElementIds.includes(el.id));
    const leftMost = Math.min(...selectedElements.map(el => el.position.x));
    const rightMost = Math.max(...selectedElements.map(el => el.position.x + el.size.width));
    const centerX = (leftMost + rightMost) / 2;

    setElements(prev => {
      const updated = prev.map(el => {
        if (selectedElementIds.includes(el.id)) {
          return { ...el, position: { ...el.position, x: centerX - el.size.width / 2 } };
        }
        return el;
      });
      saveToHistory(updated);
      return updated;
    });
  }, [selectedElementIds, elements, saveToHistory]);

  // Align selected elements to the right
  const alignRight = useCallback(() => {
    if (selectedElementIds.length < 2) return;

    const selectedElements = elements.filter(el => selectedElementIds.includes(el.id));
    const rightMost = Math.max(...selectedElements.map(el => el.position.x + el.size.width));

    setElements(prev => {
      const updated = prev.map(el => {
        if (selectedElementIds.includes(el.id)) {
          return { ...el, position: { ...el.position, x: rightMost - el.size.width } };
        }
        return el;
      });
      saveToHistory(updated);
      return updated;
    });
  }, [selectedElementIds, elements, saveToHistory]);

  // Align selected elements to the top
  const alignTop = useCallback(() => {
    if (selectedElementIds.length < 2) return;

    const selectedElements = elements.filter(el => selectedElementIds.includes(el.id));
    const topMost = Math.min(...selectedElements.map(el => el.position.y));

    setElements(prev => {
      const updated = prev.map(el => {
        if (selectedElementIds.includes(el.id)) {
          return { ...el, position: { ...el.position, y: topMost } };
        }
        return el;
      });
      saveToHistory(updated);
      return updated;
    });
  }, [selectedElementIds, elements, saveToHistory]);

  // Align selected elements to the middle vertically
  const alignMiddleVertical = useCallback(() => {
    if (selectedElementIds.length < 2) return;

    const selectedElements = elements.filter(el => selectedElementIds.includes(el.id));
    const topMost = Math.min(...selectedElements.map(el => el.position.y));
    const bottomMost = Math.max(...selectedElements.map(el => el.position.y + el.size.height));
    const centerY = (topMost + bottomMost) / 2;

    setElements(prev => {
      const updated = prev.map(el => {
        if (selectedElementIds.includes(el.id)) {
          return { ...el, position: { ...el.position, y: centerY - el.size.height / 2 } };
        }
        return el;
      });
      saveToHistory(updated);
      return updated;
    });
  }, [selectedElementIds, elements, saveToHistory]);

  // Align selected elements to the bottom
  const alignBottom = useCallback(() => {
    if (selectedElementIds.length < 2) return;

    const selectedElements = elements.filter(el => selectedElementIds.includes(el.id));
    const bottomMost = Math.max(...selectedElements.map(el => el.position.y + el.size.height));

    setElements(prev => {
      const updated = prev.map(el => {
        if (selectedElementIds.includes(el.id)) {
          return { ...el, position: { ...el.position, y: bottomMost - el.size.height } };
        }
        return el;
      });
      saveToHistory(updated);
      return updated;
    });
  }, [selectedElementIds, elements, saveToHistory]);

  // Distribute selected elements horizontally with equal spacing
  const distributeHorizontal = useCallback(() => {
    if (selectedElementIds.length < 3) return;

    const selectedElements = elements.filter(el => selectedElementIds.includes(el.id));
    // Sort by x position
    const sorted = [...selectedElements].sort((a, b) => a.position.x - b.position.x);

    const leftMost = sorted[0].position.x;
    const rightMost = sorted[sorted.length - 1].position.x + sorted[sorted.length - 1].size.width;
    const totalWidth = sorted.reduce((sum, el) => sum + el.size.width, 0);
    const spacing = (rightMost - leftMost - totalWidth) / (sorted.length - 1);

    let currentX = leftMost;
    const updates: { [key: string]: { x: number } } = {};

    sorted.forEach(el => {
      updates[el.id] = { x: currentX };
      currentX += el.size.width + spacing;
    });

    setElements(prev => {
      const updated = prev.map(el => {
        if (updates[el.id]) {
          return { ...el, position: { ...el.position, x: updates[el.id].x } };
        }
        return el;
      });
      saveToHistory(updated);
      return updated;
    });
  }, [selectedElementIds, elements, saveToHistory]);

  // Distribute selected elements vertically with equal spacing
  const distributeVertical = useCallback(() => {
    if (selectedElementIds.length < 3) return;

    const selectedElements = elements.filter(el => selectedElementIds.includes(el.id));
    // Sort by y position
    const sorted = [...selectedElements].sort((a, b) => a.position.y - b.position.y);

    const topMost = sorted[0].position.y;
    const bottomMost = sorted[sorted.length - 1].position.y + sorted[sorted.length - 1].size.height;
    const totalHeight = sorted.reduce((sum, el) => sum + el.size.height, 0);
    const spacing = (bottomMost - topMost - totalHeight) / (sorted.length - 1);

    let currentY = topMost;
    const updates: { [key: string]: { y: number } } = {};

    sorted.forEach(el => {
      updates[el.id] = { y: currentY };
      currentY += el.size.height + spacing;
    });

    setElements(prev => {
      const updated = prev.map(el => {
        if (updates[el.id]) {
          return { ...el, position: { ...el.position, y: updates[el.id].y } };
        }
        return el;
      });
      saveToHistory(updated);
      return updated;
    });
  }, [selectedElementIds, elements, saveToHistory]);

  // ============================================================================
  // Phase 6: Grouping Functions
  // ============================================================================

  // Create a group from selected elements
  const createGroup = useCallback(() => {
    if (selectedElementIds.length < 2) return;

    const selectedElements = elements.filter(el => selectedElementIds.includes(el.id));

    // Phase 7.2: Verify all elements are on the same page
    const pageIds = new Set(selectedElements.map(el => el.pageId));
    if (pageIds.size > 1) {
      alert('لا يمكن تجميع عناصر من صفحات مختلفة');
      return;
    }

    // Calculate bounding box for the group
    const minX = Math.min(...selectedElements.map(el => el.position.x));
    const minY = Math.min(...selectedElements.map(el => el.position.y));
    const maxX = Math.max(...selectedElements.map(el => el.position.x + el.size.width));
    const maxY = Math.max(...selectedElements.map(el => el.position.y + el.size.height));

    const groupId = `group-${Date.now()}`;
    const newGroup: GroupElement = {
      id: groupId,
      type: 'group',
      name: `مجموعة ${Date.now()}`,
      elementIds: selectedElementIds,
      pageId: currentPageId, // Phase 7: Assign to current page
      position: { x: minX, y: minY },
      size: { width: maxX - minX, height: maxY - minY },
      visible: true,
      locked: false,
      zIndex: Math.max(...selectedElements.map(el => el.zIndex)) + 1,
      transform: DEFAULT_TRANSFORM,
    };

    setElements(prev => {
      const updated = [...prev, newGroup];
      saveToHistory(updated);
      return updated;
    });

    // Select the new group
    setSelectedElementIds([groupId]);
  }, [selectedElementIds, elements, saveToHistory, currentPageId]);

  // Ungroup a group element
  const ungroupGroup = useCallback((groupId: string) => {
    const group = elements.find(el => el.id === groupId && el.type === 'group') as GroupElement | undefined;
    if (!group) return;

    // Remove the group and select its child elements
    setElements(prev => {
      const updated = prev.filter(el => el.id !== groupId);
      saveToHistory(updated);
      return updated;
    });

    // Select the elements that were in the group
    setSelectedElementIds(group.elementIds);
  }, [elements, saveToHistory]);

  // Check if an element is part of a group
  const getElementGroup = useCallback((elementId: string): GroupElement | null => {
    const group = elements.find(el =>
      el.type === 'group' && (el as GroupElement).elementIds.includes(elementId)
    ) as GroupElement | undefined;
    return group || null;
  }, [elements]);

  // ============================================================================
  // Table Title Link/Unlink
  // ============================================================================

  const handleToggleTableTitleLink = useCallback((titleId: string, currentLinkedTableId: string | null) => {
    setElements(prev => {
      return prev.map(el => {
        if (el.id === titleId && el.type === 'table-title') {
          const titleElement = el as TableTitleElement;
          // Toggle link: if linked, unlink; if unlinked, try to find nearest table
          if (currentLinkedTableId) {
            // Unlink
            return { ...titleElement, linkedTableId: null };
          } else {
            // Link to nearest table
            const tables = prev.filter(e => e.type === 'table') as TableElement[];

            if (tables.length === 0) return el;

            // Find nearest table by distance
            let nearestTable: TableElement = tables[0];
            let minDistance = Infinity;

            tables.forEach((table: TableElement) => {
              const distance = Math.sqrt(
                Math.pow(table.position.x - titleElement.position.x, 2) +
                Math.pow(table.position.y - titleElement.position.y, 2)
              );
              if (distance < minDistance) {
                minDistance = distance;
                nearestTable = table;
              }
            });

            return { ...titleElement, linkedTableId: nearestTable.id };
          }
        }
        return el;
      });
    });
  }, []);

  // ============================================================================
  // Alignment Guides (Phase 2)
  // ============================================================================

  const SNAP_DISTANCE = 5; // Distance in pixels to snap to guides

  const calculateAlignmentGuides = useCallback((
    draggedElement: EditorElement,
    currentX: number,
    currentY: number
  ) => {
    const guides: { vertical: number[]; horizontal: number[] } = {
      vertical: [],
      horizontal: [],
    };

    // Calculate dragged element bounds
    const draggedLeft = currentX;
    const draggedRight = currentX + draggedElement.size.width;
    const draggedTop = currentY;
    const draggedBottom = currentY + draggedElement.size.height;
    const draggedCenterX = currentX + draggedElement.size.width / 2;
    const draggedCenterY = currentY + draggedElement.size.height / 2;

    // Page center and edges
    const pageCenterX = pageWidth / 2;
    const pageCenterY = pageHeight / 2;

    // Check alignment with page center
    if (Math.abs(draggedCenterX - pageCenterX) < SNAP_DISTANCE) {
      guides.vertical.push(pageCenterX);
    }
    if (Math.abs(draggedCenterY - pageCenterY) < SNAP_DISTANCE) {
      guides.horizontal.push(pageCenterY);
    }

    // Check alignment with page edges and margins
    if (Math.abs(draggedLeft - margins.left) < SNAP_DISTANCE) {
      guides.vertical.push(margins.left);
    }
    if (Math.abs(draggedRight - (pageWidth - margins.right)) < SNAP_DISTANCE) {
      guides.vertical.push(pageWidth - margins.right);
    }
    if (Math.abs(draggedTop - margins.top) < SNAP_DISTANCE) {
      guides.horizontal.push(margins.top);
    }
    if (Math.abs(draggedBottom - (pageHeight - margins.bottom)) < SNAP_DISTANCE) {
      guides.horizontal.push(pageHeight - margins.bottom);
    }

    // Check alignment with other elements
    elements.forEach(element => {
      if (element.id === draggedElement.id || !element.visible) return;

      const elLeft = element.position.x;
      const elRight = element.position.x + element.size.width;
      const elTop = element.position.y;
      const elBottom = element.position.y + element.size.height;
      const elCenterX = element.position.x + element.size.width / 2;
      const elCenterY = element.position.y + element.size.height / 2;

      // Vertical alignment (left, center, right)
      if (Math.abs(draggedLeft - elLeft) < SNAP_DISTANCE) {
        guides.vertical.push(elLeft);
      }
      if (Math.abs(draggedRight - elRight) < SNAP_DISTANCE) {
        guides.vertical.push(elRight);
      }
      if (Math.abs(draggedCenterX - elCenterX) < SNAP_DISTANCE) {
        guides.vertical.push(elCenterX);
      }

      // Horizontal alignment (top, center, bottom)
      if (Math.abs(draggedTop - elTop) < SNAP_DISTANCE) {
        guides.horizontal.push(elTop);
      }
      if (Math.abs(draggedBottom - elBottom) < SNAP_DISTANCE) {
        guides.horizontal.push(elBottom);
      }
      if (Math.abs(draggedCenterY - elCenterY) < SNAP_DISTANCE) {
        guides.horizontal.push(elCenterY);
      }
    });

    return guides;
  }, [elements, pageWidth, pageHeight, margins]);

  // ============================================================================
  // Drag & Drop Handlers
  // ============================================================================

  const handleDrag = useCallback((
    elementId: string,
    e: DraggableEvent,
    data: DraggableData
  ) => {
    setIsDragging(true);

    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    // Auto-scroll when dragging near edges
    if (canvasRef.current) {
      const scrollContainer = canvasRef.current.parentElement;
      if (scrollContainer) {
        const rect = scrollContainer.getBoundingClientRect();
        const mouseY = (e as MouseEvent).clientY;
        const mouseX = (e as MouseEvent).clientX;

        const SCROLL_THRESHOLD = 50; // pixels from edge to trigger scroll
        const SCROLL_SPEED = 10; // pixels to scroll per frame

        // Scroll down when near bottom
        if (mouseY > rect.bottom - SCROLL_THRESHOLD) {
          scrollContainer.scrollTop += SCROLL_SPEED;
        }
        // Scroll up when near top
        else if (mouseY < rect.top + SCROLL_THRESHOLD) {
          scrollContainer.scrollTop -= SCROLL_SPEED;
        }

        // Scroll right when near right edge
        if (mouseX > rect.right - SCROLL_THRESHOLD) {
          scrollContainer.scrollLeft += SCROLL_SPEED;
        }
        // Scroll left when near left edge
        else if (mouseX < rect.left + SCROLL_THRESHOLD) {
          scrollContainer.scrollLeft -= SCROLL_SPEED;
        }
      }
    }

    let snappedX = data.x;
    let snappedY = data.y;

    // Calculate dragged element bounds
    const draggedLeft = data.x;
    const draggedRight = data.x + element.size.width;
    const draggedTop = data.y;
    const draggedBottom = data.y + element.size.height;
    const draggedCenterX = data.x + element.size.width / 2;
    const draggedCenterY = data.y + element.size.height / 2;

    // Page center
    const pageCenterX = pageWidth / 2;
    const pageCenterY = pageHeight / 2;

    const guides: { vertical: number[]; horizontal: number[] } = {
      vertical: [],
      horizontal: [],
    };

    let alignType = '';

    // Snap to page center
    if (Math.abs(draggedCenterX - pageCenterX) < SNAP_DISTANCE) {
      snappedX = pageCenterX - element.size.width / 2;
      guides.vertical.push(pageCenterX);
      alignType = 'مركز الصفحة';
    }
    if (Math.abs(draggedCenterY - pageCenterY) < SNAP_DISTANCE) {
      snappedY = pageCenterY - element.size.height / 2;
      guides.horizontal.push(pageCenterY);
      alignType = alignType ? alignType + ' + مركز الصفحة' : 'مركز الصفحة';
    }

    // Snap to page edges and margins
    if (Math.abs(draggedLeft - margins.left) < SNAP_DISTANCE) {
      snappedX = margins.left;
      guides.vertical.push(margins.left);
      alignType = alignType || 'هامش الصفحة';
    }
    if (Math.abs(draggedRight - (pageWidth - margins.right)) < SNAP_DISTANCE) {
      snappedX = pageWidth - margins.right - element.size.width;
      guides.vertical.push(pageWidth - margins.right);
      alignType = alignType || 'هامش الصفحة';
    }
    if (Math.abs(draggedTop - margins.top) < SNAP_DISTANCE) {
      snappedY = margins.top;
      guides.horizontal.push(margins.top);
      alignType = alignType || 'هامش الصفحة';
    }
    if (Math.abs(draggedBottom - (pageHeight - margins.bottom)) < SNAP_DISTANCE) {
      snappedY = pageHeight - margins.bottom - element.size.height;
      guides.horizontal.push(pageHeight - margins.bottom);
      alignType = alignType || 'هامش الصفحة';
    }

    // Snap to other elements
    elements.forEach(el => {
      if (el.id === elementId || !el.visible) return;

      const elLeft = el.position.x;
      const elRight = el.position.x + el.size.width;
      const elTop = el.position.y;
      const elBottom = el.position.y + el.size.height;
      const elCenterX = el.position.x + el.size.width / 2;
      const elCenterY = el.position.y + el.size.height / 2;

      // Vertical snapping
      if (Math.abs(draggedLeft - elLeft) < SNAP_DISTANCE) {
        snappedX = elLeft;
        guides.vertical.push(elLeft);
        alignType = alignType || 'محاذاة مع عنصر';
      } else if (Math.abs(draggedRight - elRight) < SNAP_DISTANCE) {
        snappedX = elRight - element.size.width;
        guides.vertical.push(elRight);
        alignType = alignType || 'محاذاة مع عنصر';
      } else if (Math.abs(draggedCenterX - elCenterX) < SNAP_DISTANCE) {
        snappedX = elCenterX - element.size.width / 2;
        guides.vertical.push(elCenterX);
        alignType = alignType || 'محاذاة مع عنصر';
      }

      // Horizontal snapping
      if (Math.abs(draggedTop - elTop) < SNAP_DISTANCE) {
        snappedY = elTop;
        guides.horizontal.push(elTop);
        alignType = alignType || 'محاذاة مع عنصر';
      } else if (Math.abs(draggedBottom - elBottom) < SNAP_DISTANCE) {
        snappedY = elBottom - element.size.height;
        guides.horizontal.push(elBottom);
        alignType = alignType || 'محاذاة مع عنصر';
      } else if (Math.abs(draggedCenterY - elCenterY) < SNAP_DISTANCE) {
        snappedY = elCenterY - element.size.height / 2;
        guides.horizontal.push(elCenterY);
        alignType = alignType || 'محاذاة مع عنصر';
      }
    });

    setAlignmentGuides(guides);
    setAlignmentType(alignType);

    // DON'T update element position during drag
    // Let Draggable handle the position internally
    // Position will be updated only in handleDragStop
  }, [elements, pageWidth, pageHeight, margins]);

  const handleDragStop = useCallback((
    elementId: string,
    e: DraggableEvent,
    data: DraggableData
  ) => {
    setIsDragging(false);
    setAlignmentGuides({ vertical: [], horizontal: [] });
    setAlignmentType('');

    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    // Phase 6: Multi-Element Drag
    // If multiple elements are selected and this element is one of them, move all selected elements
    const isMultiDrag = selectedElementIds.length > 1 && selectedElementIds.includes(elementId);

    if (isMultiDrag) {
      // Calculate the delta (how much the dragged element moved)
      const deltaX = data.x - element.position.x;
      const deltaY = data.y - element.position.y;

      // Move all selected elements by the same delta
      setElements(prev => {
        const updated = prev.map(el => {
          if (selectedElementIds.includes(el.id)) {
            return {
              ...el,
              position: {
                x: el.position.x + deltaX,
                y: el.position.y + deltaY,
              }
            };
          }
          return el;
        });
        saveToHistory(updated);
        return updated;
      });
      return; // Exit early, no need for snapping in multi-drag
    }

    // Single element drag (original behavior with snapping)
    let finalX = data.x;
    let finalY = data.y;

    // Apply alignment snapping first (higher priority)
    const SNAP_DISTANCE = 5;

    // Calculate dragged element bounds
    const draggedLeft = data.x;
    const draggedRight = data.x + element.size.width;
    const draggedTop = data.y;
    const draggedBottom = data.y + element.size.height;
    const draggedCenterX = data.x + element.size.width / 2;
    const draggedCenterY = data.y + element.size.height / 2;

    // Page center
    const pageCenterX = pageWidth / 2;
    const pageCenterY = pageHeight / 2;

    // Snap to page center
    if (Math.abs(draggedCenterX - pageCenterX) < SNAP_DISTANCE) {
      finalX = pageCenterX - element.size.width / 2;
    }
    if (Math.abs(draggedCenterY - pageCenterY) < SNAP_DISTANCE) {
      finalY = pageCenterY - element.size.height / 2;
    }

    // Snap to page edges and margins
    if (Math.abs(draggedLeft - margins.left) < SNAP_DISTANCE) {
      finalX = margins.left;
    }
    if (Math.abs(draggedRight - (pageWidth - margins.right)) < SNAP_DISTANCE) {
      finalX = pageWidth - margins.right - element.size.width;
    }
    if (Math.abs(draggedTop - margins.top) < SNAP_DISTANCE) {
      finalY = margins.top;
    }
    if (Math.abs(draggedBottom - (pageHeight - margins.bottom)) < SNAP_DISTANCE) {
      finalY = pageHeight - margins.bottom - element.size.height;
    }

    // Snap to other elements
    elements.forEach(el => {
      if (el.id === elementId || !el.visible) return;

      const elLeft = el.position.x;
      const elRight = el.position.x + el.size.width;
      const elTop = el.position.y;
      const elBottom = el.position.y + el.size.height;
      const elCenterX = el.position.x + el.size.width / 2;
      const elCenterY = el.position.y + el.size.height / 2;

      // Vertical snapping
      if (Math.abs(draggedLeft - elLeft) < SNAP_DISTANCE) {
        finalX = elLeft;
      } else if (Math.abs(draggedRight - elRight) < SNAP_DISTANCE) {
        finalX = elRight - element.size.width;
      } else if (Math.abs(draggedCenterX - elCenterX) < SNAP_DISTANCE) {
        finalX = elCenterX - element.size.width / 2;
      }

      // Horizontal snapping
      if (Math.abs(draggedTop - elTop) < SNAP_DISTANCE) {
        finalY = elTop;
      } else if (Math.abs(draggedBottom - elBottom) < SNAP_DISTANCE) {
        finalY = elBottom - element.size.height;
      } else if (Math.abs(draggedCenterY - elCenterY) < SNAP_DISTANCE) {
        finalY = elCenterY - element.size.height / 2;
      }
    });

    // Apply grid snapping if no alignment snapping occurred
    if (finalX === data.x) {
      finalX = snapToGrid(data.x);
    }
    if (finalY === data.y) {
      finalY = snapToGrid(data.y);
    }

    updateElement(elementId, {
      position: { x: finalX, y: finalY }
    });
  }, [elements, selectedElementIds, pageWidth, pageHeight, margins, snapToGrid, updateElement, saveToHistory]);

  const handleResize = useCallback((
    elementId: string,
    e: React.SyntheticEvent,
    data: ResizeCallbackData
  ) => {
    // Apply grid snapping for smoother, faster resize (10px increments)
    const snappedWidth = Math.round(data.size.width / 10) * 10;
    const snappedHeight = Math.round(data.size.height / 10) * 10;

    // Update resizing state for real-time visual feedback
    setResizingElements(prev => ({
      ...prev,
      [elementId]: { width: snappedWidth, height: snappedHeight }
    }));
  }, []);

  const handleResizeStop = useCallback((
    elementId: string,
    e: React.SyntheticEvent,
    data: ResizeCallbackData
  ) => {
    // Apply grid snapping to final size (10px increments)
    const snappedWidth = Math.round(data.size.width / 10) * 10;
    const snappedHeight = Math.round(data.size.height / 10) * 10;

    // Clear resizing state
    setResizingElements(prev => {
      const newState = { ...prev };
      delete newState[elementId];
      return newState;
    });

    // Update element size with snapped values
    const updatedElements = elements.map(el =>
      el.id === elementId
        ? { ...el, size: { width: snappedWidth, height: snappedHeight } }
        : el
    );

    setElements(updatedElements);

    // Save to history for undo/redo
    saveToHistory(updatedElements);
  }, [elements, saveToHistory]);

  // ============================================================================
  // Export to PDF
  // ============================================================================

  const handleExport = useCallback(async () => {
    if (!canvasRef.current) return;

    setIsExporting(true);

    try {
      // Step 1: Deselect all elements to hide UI controls
      const originalSelectedId = selectedElementId;
      setSelectedElementId(null);

      // Step 2: Temporarily disable grid
      const originalGridEnabled = gridEnabled;
      setGridEnabled(false);

      // Step 3: Temporarily set zoom to 1 for export
      const originalZoom = zoom;
      setZoom(1);

      // Step 4: Store current page
      const originalPageId = currentPageId;

      // Step 5: Wait for re-render (longer wait to ensure all changes applied)
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 6: Create PDF
      const pdf = new jsPDF({
        orientation: editorSettings.page.orientation === 'landscape' ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Step 7: Sort pages by order
      const sortedPages = [...pages].sort((a, b) => a.order - b.order);

      // Step 8: Loop through all pages and capture each one
      for (let i = 0; i < sortedPages.length; i++) {
        const page = sortedPages[i];

        // Switch to this page
        setCurrentPageId(page.id);

        // Wait for page to render and fonts to load
        await new Promise(resolve => setTimeout(resolve, 500));

        // Ensure fonts are fully loaded before capture
        if (document.fonts) {
          await document.fonts.ready;
        }

        // Capture this page as image with enhanced quality
        const canvas = await html2canvas(canvasRef.current, {
          scale: 2, // Reduced to 2 for optimal Arabic text rendering without clipping
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          imageTimeout: 0, // No timeout for images
          removeContainer: true, // Clean up after rendering
          scrollY: -window.scrollY,
          scrollX: -window.scrollX,
          windowWidth: canvasRef.current.scrollWidth,
          windowHeight: canvasRef.current.scrollHeight,
          foreignObjectRendering: false, // Disable for better text rendering
          ignoreElements: (element) => {
            // Ignore rotation handles, resize handles, and other UI elements
            return element.classList.contains('rotation-handle') ||
                   element.classList.contains('react-resizable-handle') ||
                   element.classList.contains('selection-ring') ||
                   element.classList.contains('resize-tooltip');
          },
          onclone: (clonedDoc) => {
            // Apply enhanced rendering to all elements in the cloned document
            const allElements = clonedDoc.querySelectorAll('*');
            allElements.forEach((el: Element) => {
              if (el instanceof HTMLElement && el.style) {
                // Enhanced text rendering for Arabic
                el.style.setProperty('text-rendering', 'optimizeLegibility', 'important');
                el.style.setProperty('-webkit-font-smoothing', 'antialiased', 'important');
                el.style.setProperty('-moz-osx-font-smoothing', 'grayscale', 'important');
                el.style.setProperty('font-smooth', 'always', 'important');

                // Critical: Ensure overflow is visible for Arabic text
                el.style.setProperty('overflow', 'visible', 'important');
                el.style.setProperty('contain', 'none', 'important');
                el.style.setProperty('clip-path', 'none', 'important');
                el.style.setProperty('mask', 'none', 'important');

                // Ensure proper letter spacing for Arabic
                el.style.setProperty('letter-spacing', 'normal', 'important');
                el.style.setProperty('word-spacing', 'normal', 'important');
              }
            });

            // Special handling for h1 elements (titles)
            const titleElements = clonedDoc.querySelectorAll('h1');
            titleElements.forEach((el: Element) => {
              if (el instanceof HTMLElement && el.style) {
                el.style.setProperty('line-height', '2.2', 'important');
                el.style.setProperty('padding-top', '0', 'important');
                el.style.setProperty('padding-bottom', '0', 'important');
                el.style.setProperty('margin-top', '0', 'important');
                el.style.setProperty('margin-bottom', '0', 'important');
                el.style.setProperty('overflow', 'visible', 'important');
                el.style.setProperty('contain', 'none', 'important');
                el.style.setProperty('box-sizing', 'content-box', 'important');
                el.style.setProperty('clip-path', 'none', 'important');
                el.style.setProperty('mask', 'none', 'important');
              }
            });

            // Remove height constraints from title containers
            const titleContainers = clonedDoc.querySelectorAll('[class*="transition-all"]');
            titleContainers.forEach((el: Element) => {
              if (el instanceof HTMLElement && el.style) {
                const currentHeight = el.style.height;
                if (currentHeight) {
                  el.style.setProperty('min-height', currentHeight, 'important');
                  el.style.setProperty('height', 'auto', 'important');
                }
              }
            });
          },
        });

        // Add page to PDF (add new page if not first)
        if (i > 0) {
          pdf.addPage();
        }

        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }

      // Step 9: Download
      pdf.save(`${sampleData?.eventTitle || 'document'}-edited.pdf`);

      // Step 10: Restore original state
      setCurrentPageId(originalPageId);
      setZoom(originalZoom);
      setGridEnabled(originalGridEnabled);
      setSelectedElementId(originalSelectedId);

      if (onExport) {
        const blob = pdf.output('blob');
        onExport(blob);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('فشل التصدير. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsExporting(false);
    }
  }, [zoom, editorSettings, sampleData, onExport, selectedElementId, gridEnabled, currentPageId, pages, setSelectedElementId]);

  // ============================================================================
  // Keyboard Shortcuts
  // ============================================================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is editing text in an input, textarea, or contentEditable element
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      // Phase 4: Delete selected elements (single or multiple)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementIds.length > 0) {
          e.preventDefault();
          deleteSelectedElements();
        }
      }

      // Undo/Redo
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if (e.key === 'z' && e.shiftKey || e.key === 'y') {
          e.preventDefault();
          redo();
        }
      }

      // Transform shortcuts (only when element is selected)
      if (selectedElementId) {
        // Use functional update to avoid dependency on elements
        setElements((prevElements) => {
          const selectedElement = prevElements.find(el => el.id === selectedElementId);
          if (!selectedElement || !('transform' in selectedElement)) {
            return prevElements;
          }

          const element = selectedElement as TableElement | TitleElement;
          let newTransform = { ...element.transform };
          let shouldUpdate = false;

          // R - Rotate 90° clockwise
          if (e.key === 'r' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            newTransform = { ...newTransform, rotation: (element.transform.rotation + 90) % 360 };
            shouldUpdate = true;
          }

          // Shift+R - Rotate 90° counter-clockwise
          if (e.key === 'R' && e.shiftKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            newTransform = { ...newTransform, rotation: (element.transform.rotation - 90 + 360) % 360 };
            shouldUpdate = true;
          }

          // H - Flip horizontal
          if (e.key === 'h' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            newTransform = { ...newTransform, flipHorizontal: !element.transform.flipHorizontal };
            shouldUpdate = true;
          }

          // V - Flip vertical
          if (e.key === 'v' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            newTransform = { ...newTransform, flipVertical: !element.transform.flipVertical };
            shouldUpdate = true;
          }

          if (!shouldUpdate) {
            return prevElements;
          }

          const newElements = prevElements.map(el =>
            el.id === selectedElementId
              ? { ...el, transform: newTransform }
              : el
          );

          // Save to history
          saveToHistory(newElements);

          return newElements;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, selectedElementIds, deleteSelectedElements, undo, redo, saveToHistory]);

  // ============================================================================
  // Phase 4: Multi-Selection Keyboard Shortcuts
  // ============================================================================

  useEffect(() => {
    const handleMultiSelectionKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl+C: Copy
      if (e.ctrlKey && e.key === 'c' && selectedElementIds.length > 0) {
        e.preventDefault();
        copySelectedElements();
      }

      // Ctrl+V: Paste
      if (e.ctrlKey && e.key === 'v' && clipboard.length > 0) {
        e.preventDefault();
        pasteElements();
      }

      // Ctrl+X: Cut
      if (e.ctrlKey && e.key === 'x' && selectedElementIds.length > 0) {
        e.preventDefault();
        copySelectedElements();
        deleteSelectedElements();
      }

      // Ctrl+A: Select All
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        selectAll();
      }

      // Escape: Clear selection
      if (e.key === 'Escape' && selectedElementIds.length > 0) {
        e.preventDefault();
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleMultiSelectionKeyDown);
    return () => window.removeEventListener('keydown', handleMultiSelectionKeyDown);
  }, [selectedElementIds, clipboard, copySelectedElements, pasteElements, deleteSelectedElements, selectAll, clearSelection]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="flex flex-col h-full w-full bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b">
        <div className="p-2 flex items-center gap-1 flex-wrap">
        {/* Back to Preview Button */}
        {onBack && (
          <Button
            onClick={onBack}
            variant="outline"
            size="sm"
            className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
            title="العودة للمعاينة"
          >
            <ArrowRight className="w-4 h-4" />
            <span className="hidden sm:inline">العودة للمعاينة</span>
          </Button>
        )}

        {onBack && <Separator orientation="vertical" className="h-6 mx-0.5" />}

        {/* Export PDF - Icon Only */}
        <Button
          onClick={handleExport}
          disabled={isExporting}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white"
          title="تصدير PDF"
        >
          <Download className="w-4 h-4" />
        </Button>

        {/* Fit to Page - Icon Only */}
        {elements.some(el => isElementOutOfBounds(el) || isElementOutOfPrintArea(el)) && (
          <Button
            variant="outline"
            size="sm"
            onClick={fitAllElementsToPage}
            className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
            title="إرجاع جميع العناصر داخل حدود الطباعة"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        )}

        <Separator orientation="vertical" className="h-6 mx-0.5" />

        {/* Zoom Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 min-w-[70px]" title="التكبير/التصغير">
              <ZoomIn className="w-3.5 h-3.5" />
              <span className="text-xs">{Math.round(zoom * 100)}%</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[180px] p-2 bg-white opacity-100 border shadow-lg">
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 0.1}
                className="justify-start gap-2"
              >
                <ZoomOut className="w-4 h-4" />
                <span>تصغير</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 2.0}
                className="justify-start gap-2"
              >
                <ZoomIn className="w-4 h-4" />
                <span>تكبير</span>
              </Button>
              <DropdownMenuSeparator />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomFit}
                className="justify-start gap-2"
              >
                <Maximize2 className="w-4 h-4" />
                <span>ملء الشاشة</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomReset}
                className="justify-start gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة تعيين (100%)</span>
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6 mx-0.5" />

        {/* Page Navigation Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 min-w-[60px]" title="الصفحات">
              <FileText className="w-3.5 h-3.5" />
              <span className="text-xs">{pages.findIndex(p => p.id === currentPageId) + 1}/{pages.length}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px] p-2 bg-white opacity-100 border shadow-lg">
            <div className="flex flex-col gap-1">
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentIndex = pages.findIndex(p => p.id === currentPageId);
                    if (currentIndex > 0) {
                      goToPage(pages[currentIndex - 1].id);
                    }
                  }}
                  disabled={pages.findIndex(p => p.id === currentPageId) === 0}
                  className="flex-1"
                  title="الصفحة السابقة"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentIndex = pages.findIndex(p => p.id === currentPageId);
                    if (currentIndex < pages.length - 1) {
                      goToPage(pages[currentIndex + 1].id);
                    }
                  }}
                  disabled={pages.findIndex(p => p.id === currentPageId) === pages.length - 1}
                  className="flex-1"
                  title="الصفحة التالية"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
              <DropdownMenuSeparator />
              <Button
                variant="ghost"
                size="sm"
                onClick={addPage}
                className="justify-start gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة صفحة</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deletePage(currentPageId)}
                disabled={pages.length === 1}
                className="justify-start gap-2 text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف الصفحة</span>
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6 mx-0.5" />

        {/* Add Elements Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1" title="إضافة عنصر">
              <Plus className="w-3.5 h-3.5" />
              <span className="text-xs">إضافة</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[160px] p-2 bg-white opacity-100 border shadow-lg">
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const titleElement = elements.find(el => el.type === 'title');
                  const startY = titleElement
                    ? titleElement.position.y + titleElement.size.height + 80
                    : margins.top + 80;

                  const newTextElement: TextElement = {
                    id: `text-${Date.now()}`,
                    type: 'text',
                    content: 'انقر مرتين للتحرير',
                    position: { x: margins.left + 50, y: startY },
                    size: { width: 200, height: 100 },
                    fontSize: 16,
                    color: '#000000',
                    fontWeight: 'normal',
                    fontStyle: 'normal',
                    textDecoration: 'none',
                    textAlign: 'right',
                    visible: true,
                    locked: false,
                    zIndex: elements.length,
                    transform: { ...DEFAULT_TRANSFORM },
                    pageId: currentPageId,
                  };
                  setElements(prev => {
                    const updated = [...prev, newTextElement];
                    saveToHistory(updated);
                    return updated;
                  });
                }}
                className="justify-start gap-2"
              >
                <Type className="w-4 h-4" />
                <span>نص</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const titleElement = elements.find(el => el.type === 'title');
                        const startY = titleElement
                          ? titleElement.position.y + titleElement.size.height + 80
                          : margins.top + 80;

                        const newImageElement: ImageElement = {
                          id: `image-${Date.now()}`,
                          type: 'image',
                          src: event.target?.result as string,
                          position: { x: margins.left + 100, y: startY },
                          size: { width: 200, height: 200 },
                          visible: true,
                          locked: false,
                          zIndex: elements.length,
                          transform: { ...DEFAULT_TRANSFORM },
                          pageId: currentPageId,
                        };
                        setElements(prev => {
                          const updated = [...prev, newImageElement];
                          saveToHistory(updated);
                          return updated;
                        });
                      };
                      reader.readAsDataURL(file);
                    }
                  };
                  input.click();
                }}
                className="justify-start gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                <span>صورة</span>
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6 mx-0.5" />

        {/* Grid & Snap */}
        <div className="flex items-center gap-1">
          <Button
            variant={gridEnabled ? "default" : "ghost"}
            size="sm"
            onClick={() => setGridEnabled(!gridEnabled)}
            title="شبكة"
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>

          <Button
            variant={snapEnabled ? "default" : "ghost"}
            size="sm"
            onClick={() => setSnapEnabled(!snapEnabled)}
            title="التصاق"
          >
            <Magnet className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 mx-0.5" />

        {/* Text Formatting Dropdown - Show when text element is selected */}
        {selectedElementId && elements.find(el => el.id === selectedElementId && el.type === 'text') && (() => {
          const textElement = elements.find(el => el.id === selectedElementId && el.type === 'text') as TextElement;

          return (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1" title="تنسيق النص">
                    <Type className="w-3.5 h-3.5" />
                    <span className="text-xs">نص</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[300px] p-4 bg-white opacity-100 border shadow-lg">
                  <DropdownMenuLabel className="text-sm font-semibold mb-2">تنسيق النص</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Font Size Controls */}
                  <div className="py-2">
                    <div className="text-xs text-gray-600 mb-2">حجم الخط</div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          updateElement(selectedElementId, {
                            fontSize: Math.max(8, textElement.fontSize - 2)
                          } as any);
                        }}
                        title="تصغير الخط"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>

                      <div className="px-3 py-1.5 text-sm font-medium min-w-[50px] text-center bg-gray-100 rounded">
                        {textElement.fontSize}px
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          updateElement(selectedElementId, {
                            fontSize: Math.min(72, textElement.fontSize + 2)
                          } as any);
                        }}
                        title="تكبير الخط"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  {/* Text Style Toggles */}
                  <div className="py-2">
                    <div className="text-xs text-gray-600 mb-2">نمط النص</div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={textElement.fontWeight === 'bold' ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          updateElement(selectedElementId, {
                            fontWeight: textElement.fontWeight === 'bold' ? 'normal' : 'bold'
                          } as any);
                        }}
                        title="عريض"
                        className="flex-1"
                      >
                        <Bold className="w-4 h-4 mr-1" />
                        <span className="text-xs">عريض</span>
                      </Button>

                      <Button
                        variant={textElement.fontStyle === 'italic' ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          updateElement(selectedElementId, {
                            fontStyle: textElement.fontStyle === 'italic' ? 'normal' : 'italic'
                          } as any);
                        }}
                        title="مائل"
                        className="flex-1"
                      >
                        <Italic className="w-4 h-4 mr-1" />
                        <span className="text-xs">مائل</span>
                      </Button>

                      <Button
                        variant={textElement.textDecoration === 'underline' ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          updateElement(selectedElementId, {
                            textDecoration: textElement.textDecoration === 'underline' ? 'none' : 'underline'
                          } as any);
                        }}
                        title="تسطير"
                        className="flex-1"
                      >
                        <Underline className="w-4 h-4 mr-1" />
                        <span className="text-xs">تسطير</span>
                      </Button>
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  {/* Text Alignment */}
                  <div className="py-2">
                    <div className="text-xs text-gray-600 mb-2">المحاذاة</div>
                    <div className="grid grid-cols-4 gap-2">
                      <Button
                        variant={textElement.textAlign === 'left' ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          updateElement(selectedElementId, { textAlign: 'left' } as any);
                        }}
                        title="محاذاة لليسار"
                      >
                        <AlignLeft className="w-4 h-4" />
                      </Button>

                      <Button
                        variant={textElement.textAlign === 'center' ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          updateElement(selectedElementId, { textAlign: 'center' } as any);
                        }}
                        title="محاذاة للوسط"
                      >
                        <AlignCenter className="w-4 h-4" />
                      </Button>

                      <Button
                        variant={textElement.textAlign === 'right' ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          updateElement(selectedElementId, { textAlign: 'right' } as any);
                        }}
                        title="محاذاة لليمين"
                      >
                        <AlignRight className="w-4 h-4" />
                      </Button>

                      <Button
                        variant={textElement.textAlign === 'justify' ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          updateElement(selectedElementId, { textAlign: 'justify' } as any);
                        }}
                        title="ضبط"
                      >
                        <AlignJustify className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  {/* Color Picker */}
                  <div className="py-2">
                    <div className="text-xs text-gray-600 mb-2">لون النص</div>
                    <input
                      type="color"
                      value={textElement.color}
                      onChange={(e) => {
                        updateElement(selectedElementId, { color: e.target.value } as any);
                      }}
                      className="w-full h-10 rounded cursor-pointer border-2 border-gray-300"
                      title="لون النص"
                    />
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <Separator orientation="vertical" className="h-6 mx-0.5" />
            </>
          );
        })()}

        {/* Phase 4: Multi-Selection Actions */}
        {selectedElementIds.length > 0 && (
          <>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={copySelectedElements}
                title="نسخ (Ctrl+C)"
              >
                <Copy className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={pasteElements}
                disabled={clipboard.length === 0}
                title="لصق (Ctrl+V)"
              >
                <Clipboard className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={deleteSelectedElements}
                title="حذف (Delete)"
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6 mx-0.5" />

            {/* Grouping Actions (show only when 2+ elements selected) */}
            {selectedElementIds.length >= 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={createGroup}
                title="تجميع العناصر المحددة"
              >
                <Group className="w-4 h-4" />
              </Button>
            )}

            {/* Ungroup Action (show only when a single group is selected) */}
            {selectedElementIds.length === 1 && elements.find(el => el.id === selectedElementIds[0])?.type === 'group' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => ungroupGroup(selectedElementIds[0])}
                title="فك تجميع المجموعة"
              >
                <Ungroup className="w-4 h-4" />
              </Button>
            )}

            {/* Alignment & Distribution Dropdown (show only when 2+ elements selected) */}
            {selectedElementIds.length >= 2 && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1" title="المحاذاة">
                      <AlignHorizontalJustifyCenter className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[280px] p-3 bg-white opacity-100 border shadow-lg">
                    <DropdownMenuLabel className="text-sm font-semibold mb-2">المحاذاة والتوزيع</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {/* Horizontal Alignment */}
                    <div className="py-2">
                      <div className="text-xs text-gray-600 mb-2">المحاذاة الأفقية</div>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={alignLeft}
                          title="محاذاة لليسار"
                        >
                          <AlignHorizontalJustifyStart className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={alignCenterHorizontal}
                          title="محاذاة للوسط أفقياً"
                        >
                          <AlignHorizontalJustifyCenter className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={alignRight}
                          title="محاذاة لليمين"
                        >
                          <AlignHorizontalJustifyEnd className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <DropdownMenuSeparator />

                    {/* Vertical Alignment */}
                    <div className="py-2">
                      <div className="text-xs text-gray-600 mb-2">المحاذاة العمودية</div>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={alignTop}
                          title="محاذاة للأعلى"
                        >
                          <AlignVerticalJustifyStart className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={alignMiddleVertical}
                          title="محاذاة للوسط عمودياً"
                        >
                          <AlignVerticalJustifyCenter className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={alignBottom}
                          title="محاذاة للأسفل"
                        >
                          <AlignVerticalJustifyEnd className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Distribution (show only when 3+ elements selected) */}
                    {selectedElementIds.length >= 3 && (
                      <>
                        <DropdownMenuSeparator />
                        <div className="py-2">
                          <div className="text-xs text-gray-600 mb-2">التوزيع</div>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={distributeHorizontal}
                              title="توزيع أفقي متساوي"
                              className="gap-2"
                            >
                              <ArrowLeftRight className="w-4 h-4" />
                              <span className="text-xs">أفقي</span>
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={distributeVertical}
                              title="توزيع عمودي متساوي"
                              className="gap-2"
                            >
                              <ArrowUpDown className="w-4 h-4" />
                              <span className="text-xs">عمودي</span>
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Separator orientation="vertical" className="h-6 mx-0.5" />
              </>
            )}

            {/* Selection Info - Compact */}
            <div className="text-[10px] px-1">
              <div className="flex items-center gap-0.5">
                <span className="text-gray-600">{selectedElementIds.length}</span>
                {selectedElementIds.length > 1 && (
                  <span className="text-blue-600 text-[9px] bg-blue-50 px-1 py-0.5 rounded">
                    متعدد
                  </span>
                )}
              </div>
            </div>

            <Separator orientation="vertical" className="h-6 mx-0.5" />

            {/* Move to Page (show only when elements are selected and there are multiple pages) */}
            {selectedElementIds.length > 0 && pages.length > 1 && (
              <>
                <select
                  className="text-[10px] border rounded px-1.5 py-0.5 bg-white hover:bg-gray-50 cursor-pointer"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      moveElementsToPage(selectedElementIds, e.target.value);
                    }
                  }}
                  title="نقل إلى صفحة"
                >
                  <option value="">نقل...</option>
                  {pages
                    .filter(p => p.id !== currentPageId)
                    .sort((a, b) => a.order - b.order)
                    .map(page => (
                      <option key={page.id} value={page.id}>
                        {page.name}
                      </option>
                    ))}
                </select>

                <Separator orientation="vertical" className="h-6 mx-0.5" />
              </>
            )}
          </>
        )}

        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={!canUndo}
          title="تراجع (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={redo}
          disabled={!canRedo}
          title="إعادة (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-0.5" />

        {/* Transform Controls Dropdown (when element is selected) */}
        {selectedElementId && (() => {
          const selectedElement = elements.find(el => el.id === selectedElementId);
          if (!selectedElement || !('transform' in selectedElement)) return null;

          const element = selectedElement as TableElement | TitleElement;

          return (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1" title="التحويلات">
                    <Settings2 className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[250px] p-3 bg-white opacity-100 border shadow-lg">
                  <DropdownMenuLabel className="text-sm font-semibold mb-2">التحويلات</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Flip Horizontal */}
                  <div className="py-2">
                    <Button
                      variant={element.transform.flipHorizontal ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        updateElement(element.id, {
                          transform: {
                            ...element.transform,
                            flipHorizontal: !element.transform.flipHorizontal
                          }
                        } as Partial<EditorElement>);
                      }}
                      className="w-full justify-start gap-2"
                    >
                      <FlipHorizontal className="w-4 h-4" />
                      <span>قلب أفقي</span>
                    </Button>
                  </div>

                  <DropdownMenuSeparator />

                  {/* Transform Panel Toggle */}
                  <div className="py-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTransformPanel(!showTransformPanel)}
                      className="w-full justify-start gap-2"
                    >
                      <Settings2 className="w-4 h-4" />
                      <span>إعدادات التحويلات المتقدمة</span>
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <Separator orientation="vertical" className="h-6 mx-0.5" />

              {/* Color Picker for Tables - Icon Only */}
              {element.type === 'table' && (
                <Button
                  variant="ghost"
                  size="sm"
                  title="تغيير لون الجدول"
                >
                  <Palette className="w-4 h-4" />
                </Button>
              )}
            </>
          );
        })()}

        {/* Title Controls (when title is selected) */}
        {selectedElementId === 'event-title' && (() => {
          const titleElement = elements.find(el => el.id === 'event-title') as TitleElement | undefined;
          if (!titleElement) return null;

          return (
            <>
              <div className="flex items-center gap-1">
                <Button
                  variant={showBackgroundPanel ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setShowBackgroundPanel(!showBackgroundPanel)}
                  title="إعدادات الخلفية"
                >
                  <Palette className="w-4 h-4" />
                </Button>

                <input
                  type="color"
                  value={titleElement.style.color}
                  onChange={(e) => {
                    updateElement('event-title', {
                      style: {
                        ...titleElement.style,
                        color: e.target.value
                      }
                    } as Partial<TitleElement>);
                  }}
                  className="w-8 h-8 rounded cursor-pointer"
                  title="لون النص"
                />
              </div>

              <Separator orientation="vertical" className="h-8" />
            </>
          );
        })()}

        {/* Layers Toggle */}
        <Button
          variant={showLayers ? "default" : "ghost"}
          size="sm"
          onClick={() => setShowLayers(!showLayers)}
          title="الطبقات"
        >
          <Layers className="w-4 h-4" />
        </Button>
        </div>
      </div>

      {/* Background Settings Panel */}
      {showBackgroundPanel && selectedElementId === 'event-title' && (() => {
        const titleElement = elements.find(el => el.id === 'event-title') as TitleElement | undefined;
        if (!titleElement) return null;

        return (
          <BackgroundSettingsPanel
            background={titleElement.style.background}
            onUpdate={(background) => {
              updateElement('event-title', {
                style: {
                  ...titleElement.style,
                  background
                }
              } as Partial<TitleElement>);
            }}
            onClose={() => setShowBackgroundPanel(false)}
            tableHeaderColor={editorSettings.colors.headerBg}
          />
        );
      })()}

      {/* Transform Control Panel */}
      {showTransformPanel && selectedElementId && (() => {
        const selectedElement = elements.find(el => el.id === selectedElementId);
        if (!selectedElement || !('transform' in selectedElement)) return null;

        const element = selectedElement as TableElement | TitleElement;

        return (
          <TransformControlPanel
            position={element.position}
            size={element.size}
            transform={element.transform}
            onUpdatePosition={(position) => {
              updateElement(element.id, { position } as Partial<EditorElement>);
            }}
            onUpdateSize={(size) => {
              updateElement(element.id, { size } as Partial<EditorElement>);
            }}
            onUpdateTransform={(transform) => {
              updateElement(element.id, {
                transform: { ...element.transform, ...transform }
              } as Partial<EditorElement>);
            }}
            onClose={() => setShowTransformPanel(false)}
          />
        );
      })()}

      {/* Main Content */}
      <div className="flex-1 flex relative" dir="ltr" style={{ minHeight: 0, minWidth: 0 }}>
        {/* Layers Panel - Desktop Only */}
        {showLayers && (
          <div className="hidden lg:flex w-64 border-r bg-white overflow-hidden flex-col shrink-0">
            <div className="p-3 border-b">
              <h3 className="font-semibold text-sm">الطبقات (الصفحة الحالية)</h3>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {getCurrentPageElements().length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">
                    لا توجد طبقات في هذه الصفحة
                  </p>
                ) : (
                  getCurrentPageElements()
                    .sort((a, b) => b.zIndex - a.zIndex)
                    .map(element => (
                      <div
                        key={element.id}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100 transition-colors",
                          selectedElementIds.includes(element.id) && "bg-blue-100 hover:bg-blue-200"
                        )}
                        onClick={(e) => handleElementSelect(element.id, e.ctrlKey)}
                      >
                        <Move className="w-4 h-4 text-gray-400" />

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {element.type === 'title' && '🎯 عنوان الحدث'}
                            {element.type === 'table-title' && `📝 ${(element as TableTitleElement).content}`}
                            {element.type === 'table' && '📊 جدول'}
                            {element.type === 'text' && 'نص حر'}
                            {element.type === 'image' && 'صورة'}
                            {element.type === 'group' && '📦 مجموعة'}
                          </p>
                        </div>

                        {/* Layer Order Buttons */}
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-blue-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              bringForward(element.id);
                            }}
                            title="رفع طبقة للأعلى"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-blue-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              sendBackward(element.id);
                            }}
                            title="إنزال طبقة للأسفل"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleElementVisibility(element.id);
                          }}
                          title={element.visible ? "إخفاء" : "إظهار"}
                        >
                          {element.visible ? (
                            <Eye className="w-3 h-3" />
                          ) : (
                            <EyeOff className="w-3 h-3" />
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteElement(element.id);
                          }}
                          title="حذف"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Pages Sidebar - Desktop Only */}
        <div className="hidden lg:flex w-48 border-r bg-white overflow-hidden flex-col shrink-0">
          <div className="p-3 border-b">
            <h3 className="font-semibold text-sm">الصفحات</h3>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {pages.sort((a, b) => a.order - b.order).map((page) => {
                const pageElements = elements.filter(el => el.pageId === page.id);
                const isCurrentPage = page.id === currentPageId;

                return (
                  <div
                    key={page.id}
                    className={cn(
                      "border rounded-lg p-2 cursor-pointer transition-all hover:shadow-md",
                      isCurrentPage ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => goToPage(page.id)}
                  >
                    {/* Page Preview Placeholder */}
                    <div className={cn(
                      "w-full aspect-[794/1122] bg-white border rounded mb-2 flex items-center justify-center",
                      isCurrentPage ? "border-blue-400" : "border-gray-300"
                    )}>
                      <FileText className={cn(
                        "w-8 h-8",
                        isCurrentPage ? "text-blue-500" : "text-gray-400"
                      )} />
                    </div>

                    {/* Page Info */}
                    <div className="text-xs">
                      <div className={cn(
                        "font-medium mb-1",
                        isCurrentPage ? "text-blue-700" : "text-gray-700"
                      )}>
                        {page.name}
                      </div>
                      <div className="text-gray-500">
                        {pageElements.length} عنصر
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Canvas Area - RIGHT SIDE (third in LTR) */}
        <div className="flex-1 relative bg-gray-100 scrollbar-visible"
          style={{
            overflow: 'scroll',
            scrollbarWidth: 'auto',
            scrollbarColor: '#a0a0a0 #f0f0f0',
            minHeight: 0,
            minWidth: 0,
          }}
        >
          {/* Wrapper div with actual scaled dimensions for proper scrolling */}
          <div
            style={{
              width: `${Math.max(pageWidth * zoom + 64, 100)}px`,
              height: `${Math.max(pageHeight * zoom + 64, 100)}px`,
              padding: '32px',
              boxSizing: 'border-box',
              display: 'inline-block',
            }}
          >
            <div
              ref={canvasRef}
              className="relative bg-white shadow-2xl rounded-lg"
              style={{
                width: `${pageWidth}px`,
                height: `${pageHeight}px`,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                border: '2px solid #e5e7eb',
              }}
              onClick={() => setSelectedElementId(null)}
            >
            {/* Grid Background */}
            {gridEnabled && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                    linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                  `,
                  backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
                }}
              />
            )}

            {/* Print Area Boundaries (Visual Guide) */}
            {!isExporting && (
              <div
                className="absolute pointer-events-none border-2 border-dashed border-green-400 opacity-30"
                style={{
                  left: `${margins.left}px`,
                  top: `${margins.top}px`,
                  width: `${pageWidth - margins.left - margins.right}px`,
                  height: `${pageHeight - margins.top - margins.bottom}px`,
                }}
              />
            )}

            {/* Content Container */}
            <div className="absolute inset-0">
              {/* Render Elements */}
              {elements.map(element => {
                // Phase 7: Only render elements on current page
                if (!element.visible || element.pageId !== currentPageId) return null;

                // Phase 4: Check if element is in multi-selection
                const isSelected = selectedElementIds.includes(element.id);
                const isOutOfBounds = isElementOutOfBounds(element);
                const isOutOfPrintArea = isElementOutOfPrintArea(element);

                // Render Title Element
                if (element.type === 'title') {
                  return (
                    <DraggableTitle
                      key={element.id}
                      element={element as TitleElement}
                      isSelected={isSelected}
                      isExporting={isExporting}
                      snapEnabled={snapEnabled}
                      GRID_SIZE={GRID_SIZE}
                      pageWidth={pageWidth}
                      pageHeight={pageHeight}
                      margins={margins}
                      onDrag={handleDrag}
                      onDragStop={handleDragStop}
                      onResizeStop={handleResizeStop}
                      onSelect={handleElementSelect}
                      onUpdateElement={updateElement}
                      isOutOfBounds={isOutOfBounds}
                      isOutOfPrintArea={isOutOfPrintArea}
                    />
                  );
                }

                // Render Table Title Element
                if (element.type === 'table-title') {
                  return (
                    <DraggableTableTitle
                      key={element.id}
                      element={element as TableTitleElement}
                      isSelected={isSelected}
                      isExporting={isExporting}
                      editorSettings={editorSettings}
                      snapEnabled={snapEnabled}
                      GRID_SIZE={GRID_SIZE}
                      pageWidth={pageWidth}
                      pageHeight={pageHeight}
                      margins={margins}
                      onDrag={handleDrag}
                      onDragStop={handleDragStop}
                      onResizeStop={handleResizeStop}
                      onSelect={handleElementSelect}
                      onUpdateElement={updateElement}
                      onToggleLink={handleToggleTableTitleLink}
                      isOutOfBounds={isOutOfBounds}
                      isOutOfPrintArea={isOutOfPrintArea}
                    />
                  );
                }

                // Render Table Element (Optimized)
                if (element.type === 'table') {
                  return (
                    <DraggableTable
                      key={element.id}
                      element={element as TableElement}
                      isSelected={isSelected}
                      isExporting={isExporting}
                      editorSettings={editorSettings}
                      snapEnabled={snapEnabled}
                      GRID_SIZE={GRID_SIZE}
                      pageWidth={pageWidth}
                      pageHeight={pageHeight}
                      margins={margins}
                      onDrag={handleDrag}
                      onDragStop={handleDragStop}
                      onResizeStop={handleResizeStop}
                      onSelect={handleElementSelect}
                      onUpdateElement={updateElement}
                      isOutOfBounds={isOutOfBounds}
                      isOutOfPrintArea={isOutOfPrintArea}
                    />
                  );
                }

                // Render Text Element - With Resize Handles for Font Size Control
                if (element.type === 'text') {
                  const textElement = element as TextElement;
                  const textNodeRef = createRef<HTMLDivElement>();
                  const isEditing = editingTextElementId === element.id;
                  const isEmpty = !textElement.content || textElement.content.trim() === '' || textElement.content === 'انقر مرتين للتحرير';

                  return (
                    <Draggable
                      key={element.id}
                      nodeRef={textNodeRef}
                      defaultPosition={element.position}
                      onDrag={(e, data) => handleDrag(element.id, e, data)}
                      onStop={(e, data) => handleDragStop(element.id, e, data)}
                      bounds="parent"
                      disabled={element.locked || isEditing}
                      grid={snapEnabled ? [GRID_SIZE, GRID_SIZE] : undefined}
                      cancel=".react-resizable-handle"
                    >
                      <div
                        ref={textNodeRef}
                        className={cn(
                          "absolute",
                          isSelected && !isExporting && "element-selected"
                        )}
                        style={{
                          zIndex: element.zIndex,
                        }}
                      >
                        <Resizable
                          width={resizingElements[element.id]?.width ?? element.size.width}
                          height={resizingElements[element.id]?.height ?? element.size.height}
                          onResizeStart={(e, {size}) => {
                            // Store original font size and width at the start of resize
                            setResizingElements(prev => ({
                              ...prev,
                              [element.id]: {
                                width: size.width,
                                height: size.height,
                                originalFontSize: textElement.fontSize,
                                originalWidth: size.width,
                              }
                            }));
                          }}
                          onResize={(e, {size}) => {
                            // Get the original values from resizingElements
                            const resizeData = resizingElements[element.id];
                            const originalFontSize = resizeData?.originalFontSize ?? textElement.fontSize;
                            const originalWidth = resizeData?.originalWidth ?? element.size.width;

                            // Calculate new font size based on original values
                            const scaleFactor = size.width / originalWidth;
                            const newFontSize = Math.round(originalFontSize * scaleFactor);
                            const clampedFontSize = Math.max(12, Math.min(72, newFontSize));

                            handleResize(element.id, e, {
                              size: { width: size.width, height: size.height },
                              node: e.target as HTMLElement,
                              handle: 'se'
                            });

                            // ✅ Update font size immediately during resize for smooth feedback
                            setElements(prev => prev.map(el =>
                              el.id === element.id && el.type === 'text'
                                ? { ...el, fontSize: clampedFontSize }
                                : el
                            ));
                          }}
                          onResizeStop={(e, data) => {
                            // Get the original values from resizingElements
                            const resizeData = resizingElements[element.id];
                            const originalFontSize = resizeData?.originalFontSize ?? textElement.fontSize;
                            const originalWidth = resizeData?.originalWidth ?? element.size.width;

                            // Calculate final font size based on original values
                            const scaleFactor = data.size.width / originalWidth;
                            const newFontSize = Math.round(originalFontSize * scaleFactor);
                            const clampedFontSize = Math.max(12, Math.min(72, newFontSize));

                            handleResizeStop(element.id, e, data);

                            // Update font size and keep the new size (don't reset!)
                            setElements(prev => prev.map(el =>
                              el.id === element.id && el.type === 'text'
                                ? {
                                    ...el,
                                    fontSize: clampedFontSize,
                                    size: data.size // Keep the new size instead of resetting
                                  }
                                : el
                            ));

                            // Clear resizing data
                            setResizingElements(prev => {
                              const newState = { ...prev };
                              delete newState[element.id];
                              return newState;
                            });
                          }}
                          resizeHandles={['se', 'sw', 'ne', 'nw']}
                          minConstraints={[100, 24]}
                          maxConstraints={[600, 400]}
                        >
                          {/* Border wrapper - auto-fits content naturally */}
                          <div
                            style={{
                              display: 'inline-block',
                              border: isSelected ? '2px solid #8b5cf6' : '2px solid transparent',
                              borderRadius: '2px',
                              padding: '8px',
                              background: 'transparent',
                              transition: 'border-color 0.15s ease',
                              cursor: isEditing ? 'text' : 'move',
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isSelected) {
                                setSelectedElementId(element.id);
                              }
                            }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              const target = e.currentTarget;
                              setEditingTextElementId(element.id);

                              requestAnimationFrame(() => {
                                const editableDiv = target?.querySelector('.text-content-editable') as HTMLDivElement;
                                if (editableDiv) {
                                  editableDiv.focus();

                                  if (isEmpty) {
                                    try {
                                      const range = document.createRange();
                                      range.selectNodeContents(editableDiv);
                                      const sel = window.getSelection();
                                      sel?.removeAllRanges();
                                      sel?.addRange(range);
                                    } catch {
                                      // Ignore selection errors
                                    }
                                  }
                                }
                              });
                            }}
                          >
                          <div
                            className="text-content-editable"
                            contentEditable={isEditing}
                            suppressContentEditableWarning
                            style={{
                              minWidth: '100px',
                              maxWidth: '600px',
                              fontSize: `${textElement.fontSize}px`,
                              color: isEmpty && !isEditing ? '#9ca3af' : textElement.color,
                              fontWeight: textElement.fontWeight ?? 'normal',
                              fontStyle: isEmpty && !isEditing ? 'italic' : (textElement.fontStyle ?? 'normal'),
                              textDecoration: textElement.textDecoration ?? 'none',
                              textAlign: textElement.textAlign ?? 'right',
                              outline: 'none',
                              wordWrap: 'break-word',
                              whiteSpace: 'pre-wrap',
                              minHeight: '24px',
                              lineHeight: '1.5',
                            }}
                            onFocus={(e) => {
                              setEditingTextElementId(element.id);
                              if (isEmpty) {
                                e.currentTarget.textContent = '';
                              }
                            }}
                            onBlur={(e) => {
                              setEditingTextElementId(null);
                              const newContent = e.currentTarget.textContent?.trim() || '';

                              setElements(prev => prev.map(el =>
                                el.id === element.id && el.type === 'text'
                                  ? { ...el, content: newContent || 'انقر مرتين للتحرير' }
                                  : el
                              ));

                              if (!newContent) {
                                e.currentTarget.textContent = 'انقر مرتين للتحرير';
                              }
                            }}
                            onKeyDown={(e) => {
                              e.stopPropagation();
                              if (e.key === 'Escape') {
                                e.currentTarget.blur();
                              }
                            }}
                          >
                            {isEmpty && !isEditing ? 'انقر مرتين للتحرير' : textElement.content}
                          </div>
                        </div>
                        </Resizable>
                      </div>
                    </Draggable>
                  );
                }

                // Render Image Element
                if (element.type === 'image') {
                  const imageElement = element as ImageElement;
                  const imageNodeRef = createRef<HTMLDivElement>();

                  return (
                    <Draggable
                      key={element.id}
                      nodeRef={imageNodeRef}
                      defaultPosition={element.position}
                      onDrag={(e, data) => handleDrag(element.id, e, data)}
                      onStop={(e, data) => handleDragStop(element.id, e, data)}
                      bounds="parent"
                      disabled={element.locked}
                      grid={snapEnabled ? [GRID_SIZE, GRID_SIZE] : undefined}
                      cancel=".react-resizable-handle"
                    >
                      <div ref={imageNodeRef} className="absolute cursor-default" style={{ zIndex: element.zIndex }}>
                        {/* Border wrapper with element-selected class */}
                        <div
                          className={cn(
                            "relative transition-all duration-200",
                            isSelected && "ring-4 ring-green-500 ring-offset-2 element-selected"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedElementId(element.id);
                          }}
                        >
                          <Resizable
                            width={resizingElements[element.id]?.width ?? element.size.width}
                            height={resizingElements[element.id]?.height ?? element.size.height}
                            onResize={(e, {size, node, handle}) => {
                              // Apply grid snapping for smoother, faster resize (10px increments)
                              const snappedWidth = Math.round(size.width / 10) * 10;
                              const snappedHeight = Math.round(size.height / 10) * 10;
                              handleResize(element.id, e, { node, size: { width: snappedWidth, height: snappedHeight }, handle });
                            }}
                            onResizeStop={(e, data) => {
                              // Apply grid snapping to final size
                              const snappedWidth = Math.round(data.size.width / 10) * 10;
                              const snappedHeight = Math.round(data.size.height / 10) * 10;
                              handleResizeStop(element.id, e, { ...data, size: { width: snappedWidth, height: snappedHeight } });
                            }}
                            resizeHandles={['se', 'sw', 'ne', 'nw']}
                            minConstraints={[50, 50]}
                            maxConstraints={[800, 800]}
                          >
                            <div
                              style={{
                                width: resizingElements[element.id]?.width ?? element.size.width,
                                height: resizingElements[element.id]?.height ?? element.size.height,
                              }}
                            >
                              <img
                                src={imageElement.src}
                                alt="Element"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </Resizable>
                        </div>
                      </div>
                    </Draggable>
                  );
                }

                // Phase 6: Render Group Element
                if (element.type === 'group') {
                  const groupElement = element as GroupElement;
                  const groupNodeRef = createRef<HTMLDivElement>();

                  // Get all elements in the group
                  const groupElements = elements.filter(el => groupElement.elementIds.includes(el.id));

                  // Calculate bounding box
                  if (groupElements.length === 0) return null;

                  const minX = Math.min(...groupElements.map(el => el.position.x));
                  const minY = Math.min(...groupElements.map(el => el.position.y));
                  const maxX = Math.max(...groupElements.map(el => el.position.x + el.size.width));
                  const maxY = Math.max(...groupElements.map(el => el.position.y + el.size.height));

                  return (
                    <Draggable
                      key={element.id}
                      nodeRef={groupNodeRef}
                      defaultPosition={{ x: minX, y: minY }}
                      onStop={(_e, data) => {
                        // Calculate delta from original position
                        const deltaX = data.x - minX;
                        const deltaY = data.y - minY;

                        // Move all elements in the group
                        setElements(prev => {
                          const updated = prev.map(el => {
                            if (groupElement.elementIds.includes(el.id)) {
                              return {
                                ...el,
                                position: {
                                  x: el.position.x + deltaX,
                                  y: el.position.y + deltaY,
                                }
                              };
                            }
                            return el;
                          });
                          saveToHistory(updated);
                          return updated;
                        });
                      }}
                      bounds="parent"
                      disabled={element.locked}
                      grid={snapEnabled ? [GRID_SIZE, GRID_SIZE] : undefined}
                    >
                      <div
                        ref={groupNodeRef}
                        className="absolute cursor-move"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleElementSelect(element.id, e.ctrlKey);
                        }}
                      >
                        {/* Group Bounding Box */}
                        <div
                          className={cn(
                            "relative border-2 border-dashed transition-all duration-200",
                            isSelected
                              ? "border-blue-500 bg-blue-50/10"
                              : "border-gray-400 bg-gray-50/5"
                          )}
                          style={{
                            width: maxX - minX,
                            height: maxY - minY,
                            pointerEvents: 'none', // Allow clicking through to elements
                          }}
                        >
                          {/* Group Label */}
                          {!isExporting && (
                            <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-0.5 rounded shadow-sm pointer-events-auto">
                              {groupElement.name} ({groupElement.elementIds.length} عناصر)
                            </div>
                          )}
                        </div>
                      </div>
                    </Draggable>
                  );
                }

                return null;
              })}

              {/* Empty State */}
              {elements.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400">لا توجد عناصر</p>
                </div>
              )}

              {/* Alignment Guides (Phase 2) */}
              {isDragging && !isExporting && (
                <>
                  {/* Alignment Type Tooltip */}
                  {alignmentType && (
                    <div
                      className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-none z-[10000]"
                    >
                      <div className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg animate-in fade-in duration-150">
                        {alignmentType}
                      </div>
                    </div>
                  )}

                  {/* Vertical guides */}
                  {alignmentGuides.vertical.map((x, index) => {
                    // Check if this is a center guide
                    const isCenter = Math.abs(x - pageWidth / 2) < 1;
                    const isMargin = Math.abs(x - margins.left) < 1 || Math.abs(x - (pageWidth - margins.right)) < 1;

                    return (
                      <div
                        key={`v-${index}`}
                        className="absolute top-0 bottom-0 pointer-events-none animate-in fade-in duration-150"
                        style={{
                          left: `${x}px`,
                          width: isCenter ? '2px' : '1px',
                          backgroundColor: isCenter ? '#3b82f6' : isMargin ? '#10b981' : '#ef4444', // blue for center, green for margins, red for elements
                          boxShadow: isCenter
                            ? '0 0 8px rgba(59, 130, 246, 0.6)'
                            : isMargin
                            ? '0 0 6px rgba(16, 185, 129, 0.5)'
                            : '0 0 4px rgba(239, 68, 68, 0.5)',
                          zIndex: 9999,
                        }}
                      />
                    );
                  })}

                  {/* Horizontal guides */}
                  {alignmentGuides.horizontal.map((y, index) => {
                    // Check if this is a center guide
                    const isCenter = Math.abs(y - pageHeight / 2) < 1;
                    const isMargin = Math.abs(y - margins.top) < 1 || Math.abs(y - (pageHeight - margins.bottom)) < 1;

                    return (
                      <div
                        key={`h-${index}`}
                        className="absolute left-0 right-0 pointer-events-none animate-in fade-in duration-150"
                        style={{
                          top: `${y}px`,
                          height: isCenter ? '2px' : '1px',
                          backgroundColor: isCenter ? '#3b82f6' : isMargin ? '#10b981' : '#ef4444', // blue for center, green for margins, red for elements
                          boxShadow: isCenter
                            ? '0 0 8px rgba(59, 130, 246, 0.6)'
                            : isMargin
                            ? '0 0 6px rgba(16, 185, 129, 0.5)'
                            : '0 0 4px rgba(239, 68, 68, 0.5)',
                          zIndex: 9999,
                        }}
                      />
                    );
                  })}
                </>
              )}
            </div>
          </div>
          </div>
        </div>

        {/* Mobile Layers Overlay Panel */}
        {mobileLayersOpen && (
          <div className="lg:hidden absolute inset-0 z-40 flex">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setMobileLayersOpen(false)}
            />
            {/* Panel */}
            <div className="relative w-72 max-w-[80vw] bg-white shadow-xl flex flex-col animate-in slide-in-from-left duration-200">
              <div className="p-3 border-b flex items-center justify-between">
                <h3 className="font-semibold text-sm">الطبقات (الصفحة الحالية)</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileLayersOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {getCurrentPageElements().length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">
                      لا توجد طبقات في هذه الصفحة
                    </p>
                  ) : (
                    getCurrentPageElements()
                      .sort((a, b) => b.zIndex - a.zIndex)
                      .map(element => (
                        <div
                          key={element.id}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100 transition-colors",
                            selectedElementIds.includes(element.id) && "bg-blue-100 hover:bg-blue-200"
                          )}
                          onClick={(e) => {
                            handleElementSelect(element.id, e.ctrlKey);
                            setMobileLayersOpen(false);
                          }}
                        >
                          <Move className="w-4 h-4 text-gray-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">
                              {element.type === 'title' && '🎯 عنوان الحدث'}
                              {element.type === 'table-title' && `📝 ${(element as TableTitleElement).content}`}
                              {element.type === 'table' && '📊 جدول'}
                              {element.type === 'text' && 'نص حر'}
                              {element.type === 'image' && 'صورة'}
                              {element.type === 'group' && '📦 مجموعة'}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleElementVisibility(element.id);
                            }}
                            title={element.visible ? "إخفاء" : "إظهار"}
                          >
                            {element.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteElement(element.id);
                            }}
                            title="حذف"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        {/* Mobile Pages Overlay Panel */}
        {mobilePagesOpen && (
          <div className="lg:hidden absolute inset-0 z-40 flex">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setMobilePagesOpen(false)}
            />
            {/* Panel */}
            <div className="relative w-56 max-w-[70vw] bg-white shadow-xl flex flex-col animate-in slide-in-from-left duration-200">
              <div className="p-3 border-b flex items-center justify-between">
                <h3 className="font-semibold text-sm">الصفحات</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobilePagesOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-2">
                  {pages.sort((a, b) => a.order - b.order).map((page) => {
                    const pageElements = elements.filter(el => el.pageId === page.id);
                    const isCurrentPage = page.id === currentPageId;
                    return (
                      <div
                        key={page.id}
                        className={cn(
                          "border rounded-lg p-2 cursor-pointer transition-all hover:shadow-md",
                          isCurrentPage ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                        )}
                        onClick={() => {
                          goToPage(page.id);
                          setMobilePagesOpen(false);
                        }}
                      >
                        <div className={cn(
                          "w-full aspect-[794/1122] bg-white border rounded mb-2 flex items-center justify-center",
                          isCurrentPage ? "border-blue-400" : "border-gray-300"
                        )}>
                          <FileText className={cn(
                            "w-8 h-8",
                            isCurrentPage ? "text-blue-500" : "text-gray-400"
                          )} />
                        </div>
                        <div className="text-xs">
                          <div className={cn(
                            "font-medium mb-1",
                            isCurrentPage ? "text-blue-700" : "text-gray-700"
                          )}>
                            {page.name}
                          </div>
                          <div className="text-gray-500">
                            {pageElements.length} عنصر
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        {/* Mobile Floating Action Buttons */}
        <div className="lg:hidden absolute bottom-4 left-4 right-4 flex justify-center gap-3 z-50">
          <Button
            variant={mobileLayersOpen ? "default" : "secondary"}
            size="sm"
            onClick={() => {
              setMobileLayersOpen(!mobileLayersOpen);
              setMobilePagesOpen(false);
            }}
            className="shadow-lg gap-2"
          >
            <Layers className="w-4 h-4" />
            الطبقات
          </Button>
          <Button
            variant={mobilePagesOpen ? "default" : "secondary"}
            size="sm"
            onClick={() => {
              setMobilePagesOpen(!mobilePagesOpen);
              setMobileLayersOpen(false);
            }}
            className="shadow-lg gap-2"
          >
            <FileStack className="w-4 h-4" />
            الصفحات
          </Button>
        </div>
      </div>
    </div>
  );
}

// Default export for dynamic imports
export default EnhancedHTMLEditor;

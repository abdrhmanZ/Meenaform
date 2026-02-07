"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  PenTool,
  Type,
  Calendar,
  CheckSquare,
  X,
  GripVertical,
  Settings,
  Trash2,
  Mail
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SignatureField, SignatureFieldType } from "@/types/document-signing";

interface SignatureFieldItemProps {
  field: SignatureField;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<SignatureField>) => void;
  onDelete: () => void;
  onOpenSettings: () => void;
  containerWidth: number;
  containerHeight: number;
  scale: number;
}

const fieldTypeConfig: Record<SignatureFieldType, { icon: any; label: string; color: string; bgColor: string }> = {
  signature: { icon: PenTool, label: "توقيع", color: "text-teal-600", bgColor: "bg-teal-50 border-teal-300" },
  initials: { icon: PenTool, label: "أحرف أولى", color: "text-blue-600", bgColor: "bg-blue-50 border-blue-300" },
  date: { icon: Calendar, label: "تاريخ", color: "text-purple-600", bgColor: "bg-purple-50 border-purple-300" },
  text: { icon: Type, label: "نص", color: "text-orange-600", bgColor: "bg-orange-50 border-orange-300" },
  checkbox: { icon: CheckSquare, label: "اختيار", color: "text-green-600", bgColor: "bg-green-50 border-green-300" },
};

export default function SignatureFieldItem({
  field,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onOpenSettings,
  containerWidth,
  containerHeight,
  scale,
}: SignatureFieldItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fieldRef = useRef<HTMLDivElement>(null);

  const config = fieldTypeConfig[field.fieldType];
  const Icon = config.icon;

  // Calculate actual pixel positions from percentages
  const pixelX = (field.positionX / 100) * containerWidth;
  const pixelY = (field.positionY / 100) * containerHeight;
  const pixelWidth = (field.width / 100) * containerWidth;
  const pixelHeight = (field.height / 100) * containerHeight;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pixelX, y: e.clientY - pixelY });
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(containerWidth - pixelWidth, e.clientX - dragStart.x));
        const newY = Math.max(0, Math.min(containerHeight - pixelHeight, e.clientY - dragStart.y));
        
        onUpdate({
          positionX: (newX / containerWidth) * 100,
          positionY: (newY / containerHeight) * 100,
        });
      } else if (isResizing) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        const newWidth = Math.max(50, pixelWidth + deltaX);
        const newHeight = Math.max(30, pixelHeight + deltaY);
        
        onUpdate({
          width: Math.min((newWidth / containerWidth) * 100, 100 - field.positionX),
          height: Math.min((newHeight / containerHeight) * 100, 100 - field.positionY),
        });
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, containerWidth, containerHeight, pixelWidth, pixelHeight, field.positionX, field.positionY, onUpdate]);

  return (
    <div
      ref={fieldRef}
      className={cn(
        "absolute border-2 rounded-lg cursor-move transition-shadow pointer-events-auto",
        config.bgColor,
        isSelected 
          ? "ring-2 ring-primary ring-offset-1 shadow-lg z-20" 
          : "hover:shadow-md z-10",
        isDragging && "opacity-80"
      )}
      style={{
        left: pixelX,
        top: pixelY,
        width: pixelWidth,
        height: pixelHeight,
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Field Content */}
      <div className="flex flex-col items-center justify-center h-full gap-0.5 px-2">
        <div className="flex items-center gap-1">
          <Icon className={cn("w-4 h-4 flex-shrink-0", config.color)} />
          <span className={cn("text-xs font-medium truncate", config.color)}>
            {field.label}
          </span>
          {field.isRequired && (
            <span className="text-red-500 text-xs">*</span>
          )}
        </div>
        {/* Show assigned email in multi-signer mode */}
        {field.assignedEmail && (
          <div className="flex items-center gap-0.5 text-[10px] text-purple-600 truncate max-w-full">
            <Mail className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{field.assignedEmail}</span>
          </div>
        )}
      </div>

      {/* Selected Actions */}
      {isSelected && (
        <>
          {/* Action Buttons */}
          <div className="absolute -top-8 left-0 flex items-center gap-1 bg-white rounded-lg shadow-md p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onOpenSettings();
              }}
            >
              <Settings className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>

          {/* Resize Handle */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-primary rounded-br-lg rounded-tl-lg flex items-center justify-center"
            onMouseDown={handleResizeMouseDown}
          >
            <GripVertical className="w-2 h-2 text-white rotate-45" />
          </div>
        </>
      )}

      {/* Order Badge */}
      <div className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
        {field.order}
      </div>
    </div>
  );
}


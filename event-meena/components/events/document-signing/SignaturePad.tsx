"use client";

import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import SignaturePadLib from "signature_pad";
import { Button } from "@/components/ui/button";
import { Eraser, Undo2, Download } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SignaturePadRef {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: (type?: string) => string;
  fromDataURL: (dataUrl: string) => void;
}

interface SignaturePadProps {
  width?: number;
  height?: number;
  className?: string;
  penColor?: string;
  backgroundColor?: string;
  onBegin?: () => void;
  onEnd?: () => void;
  onChange?: (isEmpty: boolean) => void;
  disabled?: boolean;
}

const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(
  (
    {
      width = 400,
      height = 200,
      className,
      penColor = "#000000",
      backgroundColor = "#ffffff",
      onBegin,
      onEnd,
      onChange,
      disabled = false,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const signaturePadRef = useRef<SignaturePadLib | null>(null);
    const [isEmpty, setIsEmpty] = useState(true);

    // Initialize signature pad
    useEffect(() => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      
      // Set canvas dimensions
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(ratio, ratio);
      }

      // Initialize SignaturePad
      signaturePadRef.current = new SignaturePadLib(canvas, {
        penColor,
        backgroundColor,
        minWidth: 1,
        maxWidth: 3,
      });

      // Fill background
      if (ctx) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Event handlers
      signaturePadRef.current.addEventListener("beginStroke", () => {
        onBegin?.();
      });

      signaturePadRef.current.addEventListener("endStroke", () => {
        const empty = signaturePadRef.current?.isEmpty() ?? true;
        setIsEmpty(empty);
        onChange?.(empty);
        onEnd?.();
      });

      return () => {
        signaturePadRef.current?.off();
      };
    }, [width, height, penColor, backgroundColor, onBegin, onEnd, onChange]);

    // Handle disabled state
    useEffect(() => {
      if (signaturePadRef.current) {
        if (disabled) {
          signaturePadRef.current.off();
        } else {
          signaturePadRef.current.on();
        }
      }
    }, [disabled]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      clear: () => {
        signaturePadRef.current?.clear();
        // Refill background after clear
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx && canvasRef.current) {
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
        setIsEmpty(true);
        onChange?.(true);
      },
      isEmpty: () => signaturePadRef.current?.isEmpty() ?? true,
      toDataURL: (type = "image/png") => {
        return signaturePadRef.current?.toDataURL(type) ?? "";
      },
      fromDataURL: (dataUrl: string) => {
        signaturePadRef.current?.fromDataURL(dataUrl);
        setIsEmpty(false);
        onChange?.(false);
      },
    }));

    const handleClear = () => {
      signaturePadRef.current?.clear();
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx && canvasRef.current) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      setIsEmpty(true);
      onChange?.(true);
    };

    const handleUndo = () => {
      const data = signaturePadRef.current?.toData();
      if (data && data.length > 0) {
        data.pop();
        signaturePadRef.current?.fromData(data);
        const empty = signaturePadRef.current?.isEmpty() ?? true;
        setIsEmpty(empty);
        onChange?.(empty);
      }
    };

    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <div className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            className={cn(
              "touch-none cursor-crosshair",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          />
          {isEmpty && !disabled && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-gray-400 text-sm">وقّع هنا</p>
            </div>
          )}
        </div>
      </div>
    );
  }
);

SignaturePad.displayName = "SignaturePad";

export default SignaturePad;


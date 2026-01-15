"use client";

import { Component } from "@/types/component";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Pen, Trash2 } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { filesService } from "@/lib/api/services";

interface SignatureComponentProps {
  component: Component;
  value: any;
  onChange: (value: any) => void;
  index: number;
}

export default function SignatureComponent({
  component,
  value,
  onChange,
  index,
}: SignatureComponentProps) {
  const settings = component.settings as any;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = 200;

    // Set drawing style
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Load existing signature if any
    if (value) {
      const img = new Image();
      img.crossOrigin = "anonymous"; // منع خطأ Tainted Canvas
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setIsEmpty(false);
      };
      img.onerror = () => {
        // في حالة فشل التحميل مع crossOrigin، نحاول بدونه (للـ base64)
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          ctx.drawImage(fallbackImg, 0, 0);
          setIsEmpty(false);
        };
        if (typeof value === "string" && value.startsWith("data:")) {
          fallbackImg.src = value;
        } else if (value.signatureData) {
          fallbackImg.src = value.signatureData;
        }
      };
      // Handle different formats: URL (new), base64 (old), or object
      if (typeof value === "string") {
        img.src = value.startsWith("data:") ? value : filesService.getFullFileUrl(value);
      } else if (value.signatureUrl) {
        img.src = filesService.getFullFileUrl(value.signatureUrl);
      } else if (value.signatureData) {
        img.src = value.signatureData;
      }
    }
  }, [value]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setIsEmpty(false);

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = async () => {
    if (!isDrawing) return;

    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    // رفع التوقيع كملف صورة
    setIsUploading(true);
    setUploadError(null);

    try {
      const dataUrl = canvas.toDataURL("image/png");

      // تحويل Base64 إلى File
      const file = filesService.base64ToFile(
        dataUrl,
        `signature_${Date.now()}.png`,
        "image/png"
      );

      // رفع الملف
      const result = await filesService.uploadFile(file, "signature");

      onChange({
        signatureUrl: result.fileUrl,
        signatureData: dataUrl, // نحتفظ بالـ base64 للعرض المحلي
        signedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error uploading signature:", error);
      setUploadError(error instanceof Error ? error.message : "فشل رفع التوقيع");
      // في حالة الفشل، نحفظ Base64 مؤقتاً
      const dataUrl = canvas.toDataURL("image/png");
      onChange({
        signatureData: dataUrl,
        signedAt: new Date().toISOString(),
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    setUploadError(null);
    onChange(null);
  };

  return (
    <div className="space-y-4">
      {/* Label */}
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm">
          {index + 1}
        </span>
        <div className="flex-1">
          <Label className="text-xl font-semibold text-gray-900 leading-relaxed">
            {settings.label || "التوقيع"}
            {settings.required && <span className="text-red-500 mr-1">*</span>}
          </Label>
          {settings.description && (
            <p className="text-gray-600 mt-2 text-base leading-relaxed">
              {settings.description}
            </p>
          )}
        </div>
      </div>

      {/* Signature Canvas */}
      <div className="pr-11 space-y-3">
        {/* Error Message */}
        {uploadError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
            {uploadError}
          </div>
        )}

        <div className="border-2 border-gray-300 rounded-xl overflow-hidden bg-white relative">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full touch-none cursor-crosshair"
            style={{ height: "200px" }}
          />
        </div>

        {/* Instructions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Pen className="w-4 h-4" />
            <span>وقّع في المربع أعلاه</span>
          </div>

          {/* Clear Button */}
          {!isEmpty && !isUploading && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearSignature}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              مسح التوقيع
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}


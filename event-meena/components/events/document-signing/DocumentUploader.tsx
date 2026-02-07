"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  FileText, 
  X, 
  Loader2, 
  CheckCircle2,
  AlertCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { filesService } from "@/lib/api/services";

interface DocumentUploaderProps {
  onUploadComplete: (fileUrl: string, fileName: string) => void;
  currentFileUrl?: string;
  currentFileName?: string;
  onRemove?: () => void;
  maxSizeMB?: number;
  disabled?: boolean;
}

export default function DocumentUploader({
  onUploadComplete,
  currentFileUrl,
  currentFileName,
  onRemove,
  maxSizeMB = 20,
  disabled = false,
}: DocumentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File | null) => {
    if (!file) return;

    // Validate file type
    if (file.type !== "application/pdf") {
      setError("يرجى رفع ملف PDF فقط");
      return;
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`حجم الملف يجب أن لا يتجاوز ${maxSizeMB} ميجابايت`);
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const result = await filesService.uploadFile(
        file,
        "pdf",
        (progress) => setUploadProgress(progress)
      );

      onUploadComplete(result.fileUrl, result.fileName);
    } catch (err) {
      console.error("Error uploading file:", err);
      setError(err instanceof Error ? err.message : "فشل رفع الملف");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled && !isUploading) {
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Show uploaded file
  if (currentFileUrl && currentFileName) {
    return (
      <div className="w-full">
        <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="font-semibold text-green-800 truncate">{currentFileName}</p>
            </div>
            <p className="text-sm text-green-600 mt-1">تم رفع الملف بنجاح</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            disabled={disabled}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-sm text-gray-600 text-center">جاري الرفع... {uploadProgress}%</p>
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && !disabled && fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
          isDragging
            ? "border-teal-500 bg-teal-50"
            : "border-gray-300 bg-gray-50 hover:border-teal-400 hover:bg-teal-50/50",
          (isUploading || disabled) && "cursor-not-allowed opacity-60"
        )}
      >
        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center transition-colors",
            isDragging ? "bg-teal-100" : "bg-teal-50"
          )}>
            {isUploading ? (
              <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
            ) : (
              <Upload className="w-10 h-10 text-teal-600" />
            )}
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900 mb-2">
              {isUploading ? "جاري رفع الملف..." : "اسحب ملف PDF هنا أو انقر للاختيار"}
            </p>
            <p className="text-sm text-gray-500">
              ملفات PDF فقط • الحد الأقصى {maxSizeMB} ميجابايت
            </p>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
        className="hidden"
        disabled={disabled || isUploading}
      />
    </div>
  );
}


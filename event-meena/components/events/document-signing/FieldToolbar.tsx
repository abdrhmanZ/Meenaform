"use client";

import { Button } from "@/components/ui/button";
import { PenTool, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { SignatureFieldType } from "@/types/document-signing";

interface FieldToolbarProps {
  onAddField: (type: SignatureFieldType) => void;
  disabled?: boolean;
}

export default function FieldToolbar({ onAddField, disabled = false }: FieldToolbarProps) {
  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Plus className="w-4 h-4 text-gray-600" />
        <h3 className="font-semibold text-gray-800">إضافة توقيع</h3>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        انقر على الزر ثم انقر على المستند لوضع مكان التوقيع
      </p>

      <Button
        variant="ghost"
        className={cn(
          "w-full h-auto py-4 px-4 flex flex-col items-center gap-2 transition-all",
          "bg-teal-50 hover:bg-teal-100",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !disabled && onAddField("signature")}
        disabled={disabled}
      >
        <PenTool className="w-6 h-6 text-teal-600" />
        <span className="text-sm font-medium text-teal-600">
          إضافة مكان توقيع
        </span>
      </Button>

      <div className="mt-4 pt-3 border-t">
        <p className="text-xs text-gray-400 text-center">
          يمكنك سحب التوقيع وتغيير حجمه بعد إضافته
        </p>
      </div>
    </div>
  );
}


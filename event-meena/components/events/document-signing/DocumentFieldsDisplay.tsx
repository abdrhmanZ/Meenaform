"use client";

import { SignatureField } from "@/types/document-signing";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PenTool,
  FileText,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface DocumentFieldsDisplayProps {
  fields: SignatureField[];
  documentFileName?: string;
}

export default function DocumentFieldsDisplay({
  fields,
  documentFileName,
}: DocumentFieldsDisplayProps) {
  if (!fields || fields.length === 0) {
    return (
      <Card className="p-6 md:p-8 text-center">
        <div className="inline-flex p-3 md:p-4 rounded-full bg-amber-100 mb-3 md:mb-4">
          <AlertCircle className="w-6 h-6 md:w-8 md:h-8 text-amber-500" />
        </div>
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
          لا توجد حقول توقيع
        </h3>
        <p className="text-xs md:text-sm text-gray-500">
          لم يتم إضافة أي حقول توقيع لهذه الوثيقة
        </p>
      </Card>
    );
  }

  // تجميع الحقول حسب رقم الصفحة
  const fieldsByPage = fields.reduce((acc, field) => {
    const page = field.pageNumber;
    if (!acc[page]) {
      acc[page] = [];
    }
    acc[page].push(field);
    return acc;
  }, {} as Record<number, SignatureField[]>);

  const pageNumbers = Object.keys(fieldsByPage).map(Number).sort((a, b) => a - b);

  return (
    <Card className="p-4 md:p-6">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="p-1.5 md:p-2 rounded-lg bg-teal-100 flex-shrink-0">
            <PenTool className="w-4 h-4 md:w-5 md:h-5 text-teal-600" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900">
              حقول التوقيع
            </h3>
            <p className="text-xs md:text-sm text-gray-500">
              {fields.length} حقل في {pageNumbers.length} صفحة
            </p>
          </div>
        </div>
        {documentFileName && (
          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500 bg-gray-50 px-2 md:px-3 py-1.5 md:py-2 rounded-lg self-start sm:self-auto">
            <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
            <span className="max-w-[150px] md:max-w-[200px] truncate">{documentFileName}</span>
          </div>
        )}
      </div>

      <div className="space-y-3 md:space-y-4">
        {pageNumbers.map((pageNum) => (
          <div key={pageNum} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Page Header */}
            <div className="bg-gray-50 px-3 md:px-4 py-2 border-b border-gray-200 flex items-center justify-between">
              <span className="text-xs md:text-sm font-semibold text-gray-700">
                الصفحة {pageNum}
              </span>
              <Badge variant="secondary" className="text-[10px] md:text-xs">
                {fieldsByPage[pageNum].length} حقل
              </Badge>
            </div>

            {/* Fields */}
            <div className="divide-y divide-gray-100">
              {fieldsByPage[pageNum].map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between px-3 md:px-4 py-2.5 md:py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <div className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full bg-teal-100 text-teal-600 text-xs md:text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm md:text-base truncate">{field.label}</p>
                      <p className="text-[10px] md:text-xs text-gray-500 hidden sm:block">
                        الموقع: ({Math.round(field.positionX)}%, {Math.round(field.positionY)}%)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                    {field.isRequired ? (
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-[10px] md:text-xs px-1.5 md:px-2">
                        <CheckCircle className="w-2.5 h-2.5 md:w-3 md:h-3 ml-0.5 md:ml-1" />
                        <span className="hidden sm:inline">إجباري</span>
                        <span className="sm:hidden">!</span>
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-500 text-[10px] md:text-xs px-1.5 md:px-2">
                        <span className="hidden sm:inline">اختياري</span>
                        <span className="sm:hidden">-</span>
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ملخص */}
      <div className="mt-4 md:mt-6 p-3 md:p-4 bg-teal-50 rounded-lg border border-teal-100">
        <div className="flex items-center gap-2 text-teal-700">
          <CheckCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
          <span className="font-medium text-xs md:text-sm">
            {fields.filter(f => f.isRequired).length} حقل إجباري من أصل {fields.length}
          </span>
        </div>
      </div>
    </Card>
  );
}


"use client";

import { DisplaySettings } from "@/types/component";
import { Label } from "@/components/ui/label";
import { FileText, Download, ExternalLink } from "lucide-react";
// Using <img> instead of Next.js <Image> for user-uploaded content
import { getFullFileUrl } from "@/lib/api/services/filesService";

interface DisplayPreviewProps {
  settings: DisplaySettings;
}

export default function DisplayPreview({ settings }: DisplayPreviewProps) {
  const renderDisplay = () => {
    switch (settings.displayType) {
      case "image":
        if (settings.imageUrl) {
          return (
            <div className="relative w-full max-w-2xl mx-auto rounded-lg overflow-hidden border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getFullFileUrl(settings.imageUrl)}
                alt={settings.imageAlt || settings.label}
                className="w-full h-auto object-contain"
              />
            </div>
          );
        } else {
          return (
            <div className="w-full max-w-2xl mx-auto p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-center">
              <p className="text-gray-500">لم يتم رفع صورة</p>
            </div>
          );
        }

      case "pdf":
        const pdfFileName = settings.pdfFileName || "ملف PDF";
        const hasPdf = settings.pdfUrl;

        return (
          <div className="w-full max-w-2xl mx-auto">
            <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {pdfFileName}
                </p>
                <p className="text-xs text-gray-500">ملف PDF</p>
              </div>
              {hasPdf && settings.allowDownload && (
                <button
                  disabled
                  className="flex-shrink-0 p-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download className="w-5 h-5" />
                </button>
              )}
            </div>
            {!hasPdf && (
              <p className="text-sm text-gray-500 text-center mt-2">لم يتم رفع ملف PDF</p>
            )}
          </div>
        );

      case "link":
        const linkText = settings.linkText || settings.linkUrl || "رابط";
        const hasLink = settings.linkUrl;

        return (
          <div className="w-full max-w-2xl mx-auto">
            {hasLink ? (
              <a
                href={settings.linkUrl}
                target={settings.openInNewTab ? "_blank" : "_self"}
                rel={settings.openInNewTab ? "noopener noreferrer" : undefined}
                className="inline-flex items-center gap-2 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                <span>{linkText}</span>
                {settings.openInNewTab && <ExternalLink className="w-4 h-4" />}
              </a>
            ) : (
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-center">
                <p className="text-gray-500">لم يتم إضافة رابط</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Label */}
      <div>
        <Label className="text-base font-semibold text-gray-900">
          {settings.label}
        </Label>
        {settings.description && (
          <p className="text-sm text-gray-600 mt-1">{settings.description}</p>
        )}
      </div>

      {/* Display Content */}
      <div>{renderDisplay()}</div>
    </div>
  );
}



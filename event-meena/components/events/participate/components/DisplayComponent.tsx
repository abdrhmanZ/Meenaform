"use client";

import { Component } from "@/types/component";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download, FileText, Play } from "lucide-react";
// Using <img> instead of Next.js <Image> for user-uploaded content
// Next.js Image blocks private IPs and requires domain whitelisting
import { getFullFileUrl } from "@/lib/api/services/filesService";

interface DisplayComponentProps {
  component: Component;
}

export default function DisplayComponent({ component }: DisplayComponentProps) {
  const settings = component.settings;

  const renderContent = () => {
    // Handle different component types
    if (component.type === "text") {
      return (
        <div className="prose prose-lg max-w-none">
          <div
            className="text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: (settings as any).content || "" }}
          />
        </div>
      );
    }

    // For "display" type, check displayType setting
    const displayType = component.type === "display" ? (settings as any).displayType : component.type;

    switch (displayType) {
      case "image":
        const imageSettings = settings as any;
        return (
          <div className="space-y-4">
            {imageSettings.imageUrl && (
              <div className="relative w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getFullFileUrl(imageSettings.imageUrl)}
                  alt={imageSettings.altText || imageSettings.imageAlt || "صورة"}
                  className="w-full h-auto object-contain"
                  style={{ maxHeight: "600px" }}
                />
              </div>
            )}
            {imageSettings.caption && (
              <p className="text-center text-gray-600 text-sm italic">
                {imageSettings.caption}
              </p>
            )}
          </div>
        );

      case "video":
        const videoSettings = settings as any;
        return (
          <div className="space-y-4">
            {videoSettings.videoUrl && (
              <div className="relative w-full rounded-xl overflow-hidden border border-gray-200 bg-black">
                {videoSettings.videoUrl.includes("youtube.com") ||
                videoSettings.videoUrl.includes("youtu.be") ? (
                  // YouTube embed
                  <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                    <iframe
                      src={getYouTubeEmbedUrl(videoSettings.videoUrl)}
                      className="absolute top-0 left-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  // Direct video
                  <video
                    src={videoSettings.videoUrl}
                    controls
                    className="w-full"
                    style={{ maxHeight: "600px" }}
                  >
                    متصفحك لا يدعم تشغيل الفيديو
                  </video>
                )}
              </div>
            )}
            {videoSettings.caption && (
              <p className="text-center text-gray-600 text-sm italic">
                {videoSettings.caption}
              </p>
            )}
          </div>
        );

      case "pdf":
        const pdfSettings = settings as any;
        return (
          <div className="space-y-4">
            {pdfSettings.pdfUrl && (
              <div className="border-2 border-gray-200 rounded-xl p-6 bg-gray-50">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-8 h-8 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {pdfSettings.fileName || pdfSettings.pdfFileName || "ملف PDF"}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {pdfSettings.description || "اضغط لعرض أو تحميل الملف"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button asChild className="flex-1">
                    <a
                      href={getFullFileUrl(pdfSettings.pdfUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      عرض الملف
                    </a>
                  </Button>
                  <Button variant="outline" asChild className="flex-1">
                    <a href={getFullFileUrl(pdfSettings.pdfUrl)} download>
                      <Download className="w-4 h-4 mr-2" />
                      تحميل
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      case "link":
        const linkSettings = settings as any;
        return (
          <div className="space-y-4">
            {(linkSettings.url || linkSettings.linkUrl) && (
              <div className="border-2 border-primary/20 rounded-xl p-6 bg-blue-50/50 hover:bg-blue-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ExternalLink className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-lg mb-1">
                      {linkSettings.linkText || "رابط خارجي"}
                    </h3>
                    {linkSettings.description && (
                      <p className="text-gray-600 text-sm mb-3">
                        {linkSettings.description}
                      </p>
                    )}
                    <Button asChild>
                      <a
                        href={linkSettings.url || linkSettings.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        فتح الرابط
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    )?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  const anySettings = settings as any;

  return (
    <div className="space-y-4">
      {/* Label (if exists) */}
      {anySettings.label && (
        <div>
          <Label className="text-xl font-semibold text-gray-900 leading-relaxed">
            {anySettings.label}
          </Label>
          {anySettings.description && component.type !== "link" && (
            <p className="text-gray-600 mt-2 text-base leading-relaxed">
              {anySettings.description}
            </p>
          )}
        </div>
      )}

      {/* Content */}
      <div>{renderContent()}</div>
    </div>
  );
}


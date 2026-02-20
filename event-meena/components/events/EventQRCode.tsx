"use client";

import { useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Download, QrCode } from "lucide-react";

interface EventQRCodeProps {
  shareCode: string;
  eventTitle: string;
}

export default function EventQRCode({
  shareCode,
  eventTitle,
}: EventQRCodeProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  // Generate public event URL using shareCode
  const eventUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/e/${shareCode}`
      : `https://events.meena.sa/e/${shareCode}`;

  const handleDownload = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    // Convert SVG to canvas
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      // Download as PNG
      canvas.toBlob((blob) => {
        if (!blob) return;
        const link = document.createElement("a");
        link.download = `qr-code-${shareCode}.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
      });
    };

    img.src = url;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <QrCode className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">رمز QR للحدث</h3>
      </div>

      <div className="text-center">
        {/* QR Code */}
        <div
          ref={qrRef}
          className="inline-flex p-6 bg-white rounded-xl border-2 border-gray-200 mb-4"
        >
          <QRCodeSVG
            value={eventUrl}
            size={200}
            level="H"
            includeMargin={false}
            fgColor="#1a56db"
          />
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4">
          امسح رمز QR للوصول المباشر إلى الحدث
        </p>

        {/* Download Button */}
        <Button
          onClick={handleDownload}
          variant="outline"
          className="w-full hover:bg-primary/5 hover:border-primary"
        >
          <Download className="w-4 h-4 ml-2" />
          تحميل رمز QR
        </Button>
      </div>
    </Card>
  );
}


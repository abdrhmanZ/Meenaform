"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link2, Copy, Check, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EventPublicLinkProps {
  shareCode: string;
}

export default function EventPublicLink({ shareCode }: EventPublicLinkProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Generate public event URL using shareCode
  const eventUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/e/${shareCode}`
      : `https://events.meena.sa/e/${shareCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      setCopied(true);
      toast({
        title: "تم النسخ!",
        description: "تم نسخ رابط الحدث إلى الحافظة",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل نسخ الرابط",
        variant: "destructive",
      });
    }
  };

  const handleOpenInNewTab = () => {
    window.open(eventUrl, "_blank");
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-green-50">
          <Link2 className="w-5 h-5 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">رابط الحدث العام</h3>
      </div>

      <div className="space-y-4">
        {/* URL Input */}
        <div className="flex gap-2">
          <Input
            value={eventUrl}
            readOnly
            className="flex-1 bg-gray-50 font-mono text-sm"
            dir="ltr"
          />
          <Button
            onClick={handleCopy}
            variant="outline"
            className={`px-4 ${copied
                ? "bg-green-50 border-green-500 text-green-600"
                : "hover:bg-primary/5 hover:border-primary"
              }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 ml-2" />
                تم النسخ
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 ml-2" />
                نسخ
              </>
            )}
          </Button>
        </div>

        {/* Open in New Tab Button */}
        <Button
          onClick={handleOpenInNewTab}
          variant="outline"
          className="w-full hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600"
        >
          <ExternalLink className="w-4 h-4 ml-2" />
          فتح في نافذة جديدة
        </Button>

        {/* Info */}
        <p className="text-xs text-gray-500 text-center">
          شارك هذا الرابط مع المشاركين للوصول إلى الحدث
        </p>
      </div>
    </Card>
  );
}


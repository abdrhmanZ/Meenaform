"use client";

import { DocumentSigningEvent } from "@/types/document-signing";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Calendar,
  FileText,
  PenTool,
  Lock,
  Unlock,
  Users,
  User,
  CheckCircle,
  XCircle,
  MousePointerClick,
  FileSignature,
  Mail,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface DocumentInfoCardProps {
  event: DocumentSigningEvent;
}

export default function DocumentInfoCard({ event }: DocumentInfoCardProps) {
  const signatureDisplayModeLabel = event.signatureDisplayMode === "outside"
    ? "خارج الوثيقة"
    : "داخل الوثيقة";

  const signatureDisplayModeDescription = event.signatureDisplayMode === "outside"
    ? "المشارك يقرأ الوثيقة ثم يوقع في خانة منفصلة"
    : "المشارك ينقر على مكان التوقيع داخل الوثيقة";

  // معلومات نوع التوقيع
  const isMultiSigner = event.signingMode === "multi";
  const signingModeLabel = isMultiSigner ? "أكثر من موقّع" : "موقّع واحد";
  const signingModeDescription = isMultiSigner
    ? "عدة أشخاص يوقّعون على نفس الوثيقة"
    : "شخص واحد فقط يوقّع على الوثيقة";

  // استخراج قائمة الموقعين (للوضع multi-signer)
  const signerEmails = isMultiSigner
    ? [...new Set(
        event.signatureFields
          ?.filter(f => f.assignedEmail)
          .map(f => f.assignedEmail!) || []
      )]
    : [];

  const infoItems = [
    {
      icon: Calendar,
      label: "تاريخ الإنشاء",
      value: format(new Date(event.createdAt), "d MMMM yyyy", { locale: ar }),
    },
    {
      icon: FileText,
      label: "اسم الوثيقة",
      value: event.documentFileName || "غير محدد",
      highlight: true,
    },
    {
      icon: PenTool,
      label: "عدد حقول التوقيع",
      value: `${event.signatureFields?.length || 0} حقل`,
      highlight: true,
    },
    {
      icon: isMultiSigner ? Users : User,
      label: "نوع التوقيع",
      value: signingModeLabel,
      description: signingModeDescription,
      highlight: true,
      isMultiSigner: isMultiSigner,
    },
    {
      icon: event.signatureDisplayMode === "outside" ? FileSignature : MousePointerClick,
      label: "طريقة التوقيع",
      value: signatureDisplayModeLabel,
      description: signatureDisplayModeDescription,
      highlight: true,
    },
  ];

  const accessItems = [
    {
      icon: event.settings?.requireAuth ? Lock : Unlock,
      label: "يتطلب تسجيل دخول",
      value: event.settings?.requireAuth ? "نعم" : "لا",
      icon2: event.settings?.requireAuth ? CheckCircle : XCircle,
      color: event.settings?.requireAuth ? "text-green-600" : "text-gray-400",
    },
    {
      icon: Users,
      label: "حدث خاص",
      value: event.settings?.isPrivate ? "نعم" : "لا",
      icon2: event.settings?.isPrivate ? CheckCircle : XCircle,
      color: event.settings?.isPrivate ? "text-green-600" : "text-gray-400",
    },
  ];

  return (
    <Card className="p-4 md:p-6">
      <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2">
        <FileSignature className="w-4 h-4 md:w-5 md:h-5 text-teal-600" />
        معلومات الوثيقة
      </h3>

      <div className="space-y-3 md:space-y-4">
        {/* معلومات الوثيقة */}
        {infoItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className={cn(
                "flex flex-col sm:flex-row sm:items-center sm:justify-between py-2.5 md:py-3 border-b border-gray-100 last:border-0 gap-2 sm:gap-0",
                item.highlight && "bg-teal-50/50 -mx-2 px-2 rounded-lg"
              )}
            >
              <div className="flex items-center gap-2 md:gap-3">
                <div className={cn(
                  "p-1.5 md:p-2 rounded-lg flex-shrink-0",
                  item.highlight ? "bg-teal-100" : "bg-gray-50"
                )}>
                  <Icon className={cn(
                    "w-4 h-4 md:w-5 md:h-5",
                    item.highlight ? "text-teal-600" : "text-gray-600"
                  )} />
                </div>
                <div className="min-w-0">
                  <span className="text-xs md:text-sm text-gray-600">{item.label}</span>
                  {item.description && (
                    <p className="text-[10px] md:text-xs text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>
                  )}
                </div>
              </div>
              <span className={cn(
                "text-xs md:text-sm font-semibold pr-8 sm:pr-0 truncate",
                item.highlight ? "text-teal-700" : "text-gray-900"
              )}>
                {item.value}
              </span>
            </div>
          );
        })}

        {/* قائمة الموقعين - للوضع multi-signer فقط */}
        {isMultiSigner && signerEmails.length > 0 && (
          <>
            <div className="border-t border-gray-200 my-3 md:my-4" />
            <div className="bg-purple-50 -mx-2 px-3 py-3 md:py-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs md:text-sm font-semibold text-purple-700 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  الموقّعون المحددون
                </h4>
                <Badge className="bg-purple-100 text-purple-700 text-xs">
                  {signerEmails.length} موقّع
                </Badge>
              </div>
              <div className="space-y-2">
                {signerEmails.map((email, index) => {
                  const fieldsCount = event.signatureFields?.filter(
                    f => f.assignedEmail?.toLowerCase() === email.toLowerCase()
                  ).length || 0;
                  return (
                    <div
                      key={email}
                      className="flex items-center justify-between bg-white p-2 md:p-2.5 rounded-lg border border-purple-100"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold text-xs flex-shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-xs md:text-sm text-gray-700 truncate flex items-center gap-1">
                          <Mail className="w-3 h-3 flex-shrink-0 text-gray-400" />
                          {email}
                        </span>
                      </div>
                      <span className="text-[10px] md:text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full flex-shrink-0">
                        {fieldsCount} حقل
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* فاصل */}
        <div className="border-t border-gray-200 my-3 md:my-4" />

        {/* إعدادات الوصول - للوضع single فقط */}
        {!isMultiSigner && (
          <>
            <h4 className="text-xs md:text-sm font-semibold text-gray-500 mb-2 md:mb-3">إعدادات الوصول</h4>
            {accessItems.map((item, index) => {
              const Icon = item.icon;
              const Icon2 = item.icon2;
              return (
                <div
                  key={index}
                  className="flex items-center justify-between py-2.5 md:py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 rounded-lg bg-gray-50 flex-shrink-0">
                      <Icon className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                    </div>
                    <span className="text-xs md:text-sm text-gray-600">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <span className="text-xs md:text-sm font-semibold text-gray-900">{item.value}</span>
                    {Icon2 && <Icon2 className={cn("w-3.5 h-3.5 md:w-4 md:h-4", item.color)} />}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ملاحظة للوضع multi-signer */}
        {isMultiSigner && (
          <div className="bg-blue-50 -mx-2 px-3 py-2.5 rounded-lg">
            <p className="text-xs md:text-sm text-blue-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>كل موقّع سيتلقى رابط خاص به ويرى فقط الحقول المخصصة له</span>
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}


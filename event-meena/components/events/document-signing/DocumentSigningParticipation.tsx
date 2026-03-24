"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ChevronRight,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  Loader2,
  Check,
  PenTool,
  Send,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SignatureField, DocumentSigningEvent } from "@/types/document-signing";
import { filesService } from "@/lib/api/services";
import SignaturePad, { SignaturePadRef } from "./SignaturePad";
import { useMediaQuery } from "@/hooks/useMediaQuery";

// Set PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

interface SignatureData {
  fieldId: string;
  signatureData?: string;
  textValue?: string;
  checked?: boolean;
}

interface DocumentSigningParticipationProps {
  event: DocumentSigningEvent;
  onSubmit: (signatures: SignatureData[]) => Promise<void>;
  isSubmitting?: boolean;
  participantEmail?: string; // إيميل المشارك الحالي (للفلترة في multi-signer)
}

export default function DocumentSigningParticipation({
  event,
  onSubmit,
  isSubmitting = false,
  participantEmail,
}: DocumentSigningParticipationProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [pageWidth, setPageWidth] = useState(0);
  const [pageHeight, setPageHeight] = useState(0);
  const [signatures, setSignatures] = useState<SignatureData[]>([]);
  const [activeField, setActiveField] = useState<SignatureField | null>(null);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const signaturePadRef = useRef<SignaturePadRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const signatureDialogRef = useRef<HTMLDivElement>(null);

  // Responsive hooks
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");

  // Dynamic signature pad dimensions based on screen size
  const signaturePadWidth = isMobile ? 280 : isTablet ? 320 : 350;
  const signaturePadHeight = isMobile ? 120 : 150;

  // فلترة الحقول حسب إيميل المشارك في وضع multi-signer
  const filteredFields = useMemo(() => {
    if (!event.signatureFields) return [];

    // في وضع multi-signer، نعرض فقط الحقول المخصصة لهذا المشارك
    if (event.signingMode === "multi" && participantEmail) {
      return event.signatureFields.filter(
        (field) => field.assignedEmail?.toLowerCase() === participantEmail.toLowerCase()
      );
    }

    // في وضع single-signer، نعرض كل الحقول
    return event.signatureFields;
  }, [event.signatureFields, event.signingMode, participantEmail]);

  // Initialize signatures state - فقط للحقول المفلترة
  useEffect(() => {
    if (filteredFields.length > 0) {
      setSignatures(
        filteredFields.map((field) => ({
          fieldId: field.id,
          signatureData: undefined,
          textValue: undefined,
          checked: undefined,
        }))
      );
    }
  }, [filteredFields]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const onPageLoadSuccess = ({ width, height }: { width: number; height: number }) => {
    setPageWidth(width);
    setPageHeight(height);
  };

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 2));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));

  const handleFieldClick = (field: SignatureField) => {
    if (isSubmitting) return;
    setActiveField(field);
    if (field.fieldType === "signature" || field.fieldType === "initials") {
      setShowSignatureDialog(true);
    }
  };

  const handleSignatureComplete = () => {
    if (!activeField || !signaturePadRef.current) return;

    const dataUrl = signaturePadRef.current.toDataURL();
    setSignatures((prev) =>
      prev.map((sig) =>
        sig.fieldId === activeField.id ? { ...sig, signatureData: dataUrl } : sig
      )
    );
    setShowSignatureDialog(false);
    setActiveField(null);
  };

  // للوضع الخارجي - فتح نافذة التوقيع مباشرة
  const handleOpenExternalSignature = () => {
    if (isSubmitting) return;
    // نستخدم أول حقل توقيع كحقل نشط
    const signatureField = event.signatureFields?.find(f => f.fieldType === "signature");
    if (signatureField) {
      setActiveField(signatureField);
      setShowSignatureDialog(true);
    }
  };

  // للوضع الخارجي - حفظ التوقيع لجميع الحقول
  const handleExternalSignatureComplete = () => {
    if (!signaturePadRef.current) return;

    const dataUrl = signaturePadRef.current.toDataURL();
    // تطبيق التوقيع على جميع حقول التوقيع
    setSignatures((prev) =>
      prev.map((sig) => {
        const field = event.signatureFields?.find(f => f.id === sig.fieldId);
        if (field?.fieldType === "signature") {
          return { ...sig, signatureData: dataUrl };
        }
        return sig;
      })
    );
    setShowSignatureDialog(false);
    setActiveField(null);
  };

  // التحقق من وجود توقيع (للوضع الخارجي)
  const hasExternalSignature = () => {
    return signatures.some(sig => sig.signatureData);
  };

  // الحصول على التوقيع الخارجي
  const getExternalSignature = () => {
    return signatures.find(sig => sig.signatureData)?.signatureData;
  };

  const isFieldSigned = (fieldId: string) => {
    const sig = signatures.find((s) => s.fieldId === fieldId);
    if (!sig) return false;
    return sig.signatureData || sig.textValue || sig.checked !== undefined;
  };

  const getRequiredFieldsCount = () => {
    return filteredFields.filter((f) => f.isRequired).length;
  };

  const getSignedRequiredFieldsCount = () => {
    return filteredFields.filter(
      (f) => f.isRequired && isFieldSigned(f.id)
    ).length;
  };

  const canSubmit = () => {
    // للوضع الخارجي - نتحقق فقط من وجود توقيع
    if (event.signatureDisplayMode === "outside") {
      return hasExternalSignature();
    }
    // للوضع الداخلي - نتحقق من جميع الحقول المطلوبة (المفلترة)
    const requiredFields = filteredFields.filter((f) => f.isRequired);
    return requiredFields.every((f) => isFieldSigned(f.id));
  };

  const handleSubmit = async () => {
    if (!canSubmit() || isSubmitting) return;
    await onSubmit(signatures);
  };

  // Get fields for current page (من الحقول المفلترة)
  const currentPageFields = filteredFields.filter(
    (f) => f.pageNumber === currentPage
  );

  // Get full URL for PDF viewing (Backend static files)
  const fullDocumentUrl = useMemo(() => {
    return filesService.getFullFileUrl(event.documentUrl);
  }, [event.documentUrl]);

  // تحديد الوضع
  const isOutsideMode = event.signatureDisplayMode === "outside";

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Multi-Signer Info Banner */}
      {event.signingMode === "multi" && participantEmail && (
        <Card className="p-3 md:p-4 bg-purple-50 border-purple-200">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <PenTool className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm md:text-base font-medium text-purple-900">
                مرحباً، أنت تقوم بالتوقيع كـ
              </p>
              <p className="text-xs md:text-sm text-purple-700 truncate">{participantEmail}</p>
            </div>
            <div className="text-xs md:text-sm text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
              {filteredFields.length} حقل
            </div>
          </div>
        </Card>
      )}

      {/* Progress Bar - للوضع الداخلي فقط */}
      {!isOutsideMode && (
        <Card className="p-3 md:p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs md:text-sm font-medium text-gray-700">
              تقدم التوقيع
            </span>
            <span className="text-xs md:text-sm text-gray-500">
              {getSignedRequiredFieldsCount()} / {getRequiredFieldsCount()} حقول مطلوبة
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 md:h-2.5">
            <div
              className="bg-primary h-2 md:h-2.5 rounded-full transition-all duration-300"
              style={{
                width: `${(getSignedRequiredFieldsCount() / Math.max(getRequiredFieldsCount(), 1)) * 100}%`,
              }}
            />
          </div>
        </Card>
      )}

      {/* PDF Viewer */}
      <Card className="p-2 md:p-4">
        {/* Controls - Responsive layout */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3 md:mb-4 pb-3 md:pb-4 border-b">
          {/* Page Navigation - First on mobile for better UX */}
          <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
            <Button
              variant="outline"
              size={isMobile ? "default" : "sm"}
              className={cn(isMobile && "h-10 w-10 p-0")}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              <ChevronRight className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
            </Button>
            <span className="text-sm md:text-base text-gray-600 min-w-[70px] md:min-w-[80px] text-center font-medium">
              {currentPage} / {numPages}
            </span>
            <Button
              variant="outline"
              size={isMobile ? "default" : "sm"}
              className={cn(isMobile && "h-10 w-10 p-0")}
              onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
              disabled={currentPage >= numPages}
            >
              <ChevronLeft className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
            </Button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 sm:gap-2 order-2 sm:order-1">
            <Button
              variant="outline"
              size={isMobile ? "default" : "sm"}
              className={cn(isMobile && "h-10 w-10 p-0")}
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
            >
              <ZoomOut className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
            </Button>
            <span className="text-sm text-gray-600 min-w-[50px] md:min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="outline"
              size={isMobile ? "default" : "sm"}
              className={cn(isMobile && "h-10 w-10 p-0")}
              onClick={handleZoomIn}
              disabled={scale >= 2}
            >
              <ZoomIn className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
            </Button>
          </div>
        </div>

        {/* PDF Document - Responsive container */}
        <div
          ref={containerRef}
          className="relative overflow-auto bg-gray-100 rounded-lg"
          style={{ maxHeight: isMobile ? "55vh" : isTablet ? "60vh" : "70vh" }}
        >
          <div className="flex justify-center p-2 md:p-4">
            <div className="relative">
              <Document
                file={fullDocumentUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="flex items-center justify-center h-64 md:h-96">
                    <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
                  </div>
                }
                error={
                  <div className="flex flex-col items-center justify-center h-64 md:h-96 text-red-500 gap-2 p-4">
                    <FileText className="h-10 w-10 md:h-12 md:w-12 text-red-300" />
                    <span className="text-sm md:text-base text-center">فشل في تحميل المستند</span>
                  </div>
                }
              >
                <Page
                  pageNumber={currentPage}
                  scale={scale}
                  onLoadSuccess={onPageLoadSuccess}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>

              {/* Signature Fields Overlay - للوضع الداخلي فقط */}
              {!isOutsideMode && currentPageFields.map((field) => {
                const isSigned = isFieldSigned(field.id);
                const signature = signatures.find((s) => s.fieldId === field.id);

                return (
                  <div
                    key={field.id}
                    className={cn(
                      "absolute border-2 rounded cursor-pointer transition-all",
                      isSigned
                        ? "border-green-500 bg-green-50/80"
                        : field.isRequired
                        ? "border-red-400 bg-red-50/80 animate-pulse"
                        : "border-blue-400 bg-blue-50/80",
                      isSubmitting && "pointer-events-none opacity-50"
                    )}
                    style={{
                      left: `${(field.positionX / 100) * pageWidth * scale}px`,
                      top: `${(field.positionY / 100) * pageHeight * scale}px`,
                      width: `${(field.width / 100) * pageWidth * scale}px`,
                      height: `${(field.height / 100) * pageHeight * scale}px`,
                    }}
                    onClick={() => handleFieldClick(field)}
                  >
                    {/* Field Content */}
                    <div className="absolute inset-0 flex items-center justify-center p-0.5 md:p-1">
                      {isSigned && signature?.signatureData ? (
                        <img
                          src={signature.signatureData}
                          alt="توقيع"
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-0.5 md:gap-1">
                          <PenTool className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
                          <span className="text-[8px] md:text-[10px] text-gray-500 text-center line-clamp-1">
                            {field.label || "اضغط للتوقيع"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Status indicator */}
                    {isSigned && (
                      <div className="absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 w-4 h-4 md:w-5 md:h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 md:h-3 md:w-3 text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* External Signature Section - للوضع الخارجي فقط */}
      {isOutsideMode && (
        <Card className="p-4 md:p-6">
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <div className="p-1.5 md:p-2 rounded-lg bg-teal-100">
              <PenTool className="w-4 h-4 md:w-5 md:h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold text-gray-900">التوقيع</h3>
              <p className="text-xs md:text-sm text-gray-600">وقّع في الخانة أدناه بعد قراءة الوثيقة</p>
            </div>
          </div>

          {/* Signature Area - Responsive */}
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-4 md:p-6 text-center transition-all cursor-pointer active:scale-[0.99]",
              hasExternalSignature()
                ? "border-green-400 bg-green-50"
                : "border-gray-300 bg-gray-50 hover:border-teal-400 hover:bg-teal-50/30"
            )}
            onClick={handleOpenExternalSignature}
          >
            {hasExternalSignature() ? (
              <div className="space-y-2 md:space-y-3">
                <div className="flex justify-center">
                  <div className="relative">
                    <img
                      src={getExternalSignature()}
                      alt="توقيعك"
                      className="max-h-16 md:max-h-24 object-contain border border-green-200 rounded-lg bg-white p-1.5 md:p-2"
                    />
                    <div className="absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 w-5 h-5 md:w-6 md:h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 md:h-4 md:w-4 text-white" />
                    </div>
                  </div>
                </div>
                <p className="text-xs md:text-sm text-green-700 font-medium">تم التوقيع ✓</p>
                <Button
                  variant="outline"
                  size={isMobile ? "sm" : "sm"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenExternalSignature();
                  }}
                  className="text-teal-600 border-teal-300 hover:bg-teal-50"
                >
                  تعديل التوقيع
                </Button>
              </div>
            ) : (
              <div className="space-y-2 md:space-y-3 py-2 md:py-4">
                <div className="w-12 h-12 md:w-16 md:h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
                  <PenTool className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm md:text-base text-gray-700 font-medium">اضغط هنا للتوقيع</p>
                  <p className="text-xs md:text-sm text-gray-500 mt-1">سيتم إضافة توقيعك للوثيقة</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Submit Button - Full width on mobile */}
      <div className="flex justify-center px-2 md:px-0">
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={!canSubmit() || isSubmitting}
          className={cn(
            "min-w-[200px] h-12 md:h-11 text-base",
            isMobile && "w-full"
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin ml-2" />
              جاري الإرسال...
            </>
          ) : (
            <>
              <Send className="h-5 w-5 ml-2" />
              إرسال التوقيعات
            </>
          )}
        </Button>
      </div>

      {/* Signature Dialog - Responsive */}
      <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
        <DialogContent
          ref={signatureDialogRef}
          className={cn(
            "p-4 md:p-6",
            isMobile
              ? "w-[95vw] max-w-[95vw] rounded-xl"
              : "sm:max-w-md"
          )}
        >
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">
              {isOutsideMode ? "وقّع هنا" : (activeField?.fieldType === "initials" ? "الأحرف الأولى" : "التوقيع")}
            </DialogTitle>
          </DialogHeader>
          <div className="py-3 md:py-4">
            <div className="flex justify-center">
              <SignaturePad
                ref={signaturePadRef}
                width={signaturePadWidth}
                height={signaturePadHeight}
                className="mx-auto border rounded-lg"
              />
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              ارسم توقيعك في المربع أعلاه
            </p>
          </div>
          <DialogFooter className="flex flex-row gap-2 sm:gap-2">
            <Button
              variant="outline"
              size={isMobile ? "default" : "default"}
              className={cn(isMobile && "flex-1")}
              onClick={() => signaturePadRef.current?.clear()}
            >
              مسح
            </Button>
            <Button
              size={isMobile ? "default" : "default"}
              className={cn(isMobile && "flex-1")}
              onClick={isOutsideMode ? handleExternalSignatureComplete : handleSignatureComplete}
            >
              تأكيد التوقيع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


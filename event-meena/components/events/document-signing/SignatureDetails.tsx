"use client";

import { useState, useEffect, useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { DocumentSigningEvent, DocumentSignature, SignatureField } from "@/types/document-signing";
import { documentSigningService, filesService } from "@/lib/api/services";
import { downloadSignedPdf } from "@/lib/utils/pdfWithSignatures";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Mail,
  Calendar,
  Download,
  FileSignature,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

// Set PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

interface SignatureDetailsProps {
  event: DocumentSigningEvent;
  responseId: string;
}

export default function SignatureDetails({ event, responseId }: SignatureDetailsProps) {
  const { toast } = useToast();
  const [signatures, setSignatures] = useState<DocumentSignature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PDF State
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);

  // جلب التوقيعات
  useEffect(() => {
    const fetchSignatures = async () => {
      try {
        setIsLoading(true);
        const data = await documentSigningService.getResponseSignatures(responseId);
        setSignatures(data);
      } catch (err) {
        console.error("Error fetching signatures:", err);
        setError("فشل في تحميل التوقيعات");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSignatures();
  }, [responseId]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  // معلومات الموقّع
  const signerInfo = signatures[0] || null;

  // تحميل PDF
  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      const fileName = `${event.title}_${signerInfo?.signerName || "signed"}.pdf`;
      await downloadSignedPdf(event, signatures, fileName);
      toast({
        title: "تم التحميل",
        description: "تم تحميل الوثيقة الموقعة بنجاح",
      });
    } catch (err) {
      console.error("Error downloading PDF:", err);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الوثيقة الموقعة",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // إنشاء خريطة للحقول
  const fieldsMap = new Map<string, SignatureField>();
  event.signatureFields.forEach((field) => {
    fieldsMap.set(field.id, field);
  });

  // الحقول في الصفحة الحالية
  const currentPageFields = event.signatureFields.filter(
    (f) => f.pageNumber === pageNumber
  );

  // التوقيعات حسب الحقل
  const signaturesByField = new Map<string, DocumentSignature>();
  signatures.forEach((sig) => {
    signaturesByField.set(sig.signatureFieldId, sig);
  });

  // Get full URL for PDF viewing (Backend static files)
  const fullDocumentUrl = useMemo(() => {
    return filesService.getFullFileUrl(event.documentUrl);
  }, [event.documentUrl]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="mr-2 text-gray-600">جاري تحميل التوقيعات...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-red-600">{error}</p>
      </Card>
    );
  }

  const requiredFields = event.signatureFields.filter((f) => f.isRequired).length;
  const completedFields = signatures.length;
  const isComplete = completedFields >= requiredFields;

  return (
    <div className="space-y-6">
      {/* Signer Info Card */}
      {signerInfo && (
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                {signerInfo.signerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{signerInfo.signerName}</h2>
                <p className="text-gray-600">{signerInfo.signerEmail}</p>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(signerInfo.signedAt), "d MMMM yyyy - h:mm a", { locale: ar })}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={isComplete ? "default" : "secondary"} className={isComplete ? "bg-green-100 text-green-700" : ""}>
                {isComplete ? "✅ مكتمل" : "⏳ جزئي"}
              </Badge>
              <Button onClick={handleDownloadPdf} disabled={isDownloading || !isComplete}>
                {isDownloading ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Download className="w-4 h-4 ml-2" />}
                تحميل PDF
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Signatures List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileSignature className="w-5 h-5 text-primary" />
          التوقيعات ({completedFields}/{requiredFields})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {event.signatureFields.map((field) => {
            const sig = signaturesByField.get(field.id);
            return (
              <div key={field.id} className={`p-4 rounded-lg border ${sig ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{field.label}</span>
                  {sig ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  صفحة {field.pageNumber} • {field.fieldType === "signature" ? "توقيع" : field.fieldType === "initials" ? "أحرف أولى" : field.fieldType === "date" ? "تاريخ" : field.fieldType === "text" ? "نص" : "موافقة"}
                </p>
                {sig && sig.signatureData && (
                  <div className="mt-2 bg-white rounded border p-2">
                    <img src={sig.signatureData} alt="التوقيع" className="max-h-16 mx-auto" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* PDF Preview with Signatures */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">معاينة الوثيقة مع التوقيعات</h3>

        {/* PDF Controls */}
        <div className="flex items-center justify-between mb-4 bg-gray-100 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPageNumber(Math.max(1, pageNumber - 1))} disabled={pageNumber <= 1}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <span className="text-sm">صفحة {pageNumber} من {numPages || "?"}</span>
            <Button variant="outline" size="sm" onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))} disabled={pageNumber >= numPages}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setScale(Math.max(0.5, scale - 0.1))}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm w-16 text-center">{Math.round(scale * 100)}%</span>
            <Button variant="outline" size="sm" onClick={() => setScale(Math.min(2, scale + 0.1))}>
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="relative border rounded-lg overflow-auto bg-gray-200 flex justify-center" style={{ maxHeight: "600px" }}>
          <Document file={fullDocumentUrl} onLoadSuccess={onDocumentLoadSuccess} loading={<div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <div className="relative">
              <Page pageNumber={pageNumber} scale={scale} renderTextLayer={false} renderAnnotationLayer={false} />
              {/* Overlay signatures on current page */}
              {currentPageFields.map((field) => {
                const sig = signaturesByField.get(field.id);
                return (
                  <div
                    key={field.id}
                    className="absolute border-2 rounded"
                    style={{
                      left: `${field.positionX}%`,
                      top: `${field.positionY}%`,
                      width: `${field.width}%`,
                      height: `${field.height}%`,
                      borderColor: sig ? "#22c55e" : "#9ca3af",
                      backgroundColor: sig ? "rgba(34, 197, 94, 0.1)" : "rgba(156, 163, 175, 0.1)",
                    }}
                  >
                    {sig && sig.signatureData && (
                      <img src={sig.signatureData} alt="التوقيع" className="w-full h-full object-contain" />
                    )}
                  </div>
                );
              })}
            </div>
          </Document>
        </div>
      </Card>
    </div>
  );
}


"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ArrowRight,
  ArrowLeft,
  FileText,
  Loader2,
  Settings,
  CheckCircle2,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SignatureField, SignatureFieldType } from "@/types/document-signing";
import { filesService } from "@/lib/api/services";
import { useDocumentSigningBuilderStore } from "@/store/documentSigningBuilderStore";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import DocumentUploader from "./DocumentUploader";
import PDFViewer from "./PDFViewer";
import SignatureFieldItem from "./SignatureFieldItem";
import SignatureFieldSettings from "./SignatureFieldSettings";
import FieldToolbar from "./FieldToolbar";

interface DocumentSigningBuilderProps {
  initialTitle?: string;
  initialDescription?: string;
  initialDocumentUrl?: string;
  initialDocumentFileName?: string;
  initialFields?: SignatureField[];
  onCancel: () => void;
  onBackToModeChoice?: () => void;
}

export default function DocumentSigningBuilder({
  initialTitle = "",
  initialDescription = "",
  initialDocumentUrl = "",
  initialDocumentFileName = "",
  initialFields = [],
  onCancel,
  onBackToModeChoice,
}: DocumentSigningBuilderProps) {
  const router = useRouter();
  const { setStep1Data, signingMode } = useDocumentSigningBuilderStore();

  // Responsive hooks
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");

  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Basic info
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);

  // Document
  const [documentUrl, setDocumentUrl] = useState(initialDocumentUrl);
  const [documentFileName, setDocumentFileName] = useState(initialDocumentFileName);

  // PDF viewer state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1);

  // Fields
  const [fields, setFields] = useState<SignatureField[]>(initialFields);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [pendingFieldType, setPendingFieldType] = useState<SignatureFieldType | null>(null);

  // Field Settings Dialog
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingField, setEditingField] = useState<SignatureField | null>(null);

  // PDF container ref for sizing
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Get full URL for PDF viewing (Backend static files)
  const fullDocumentUrl = useMemo(() => {
    return filesService.getFullFileUrl(documentUrl);
  }, [documentUrl]);

  const handleDocumentUpload = (fileUrl: string, fileName: string) => {
    setDocumentUrl(fileUrl);
    setDocumentFileName(fileName);
    setFields([]);
    setCurrentPage(1);
  };

  const handleRemoveDocument = () => {
    setDocumentUrl("");
    setDocumentFileName("");
    setFields([]);
  };

  const handleAddFieldClick = (type: SignatureFieldType) => {
    setPendingFieldType(type);
  };

  const handlePDFClick = useCallback((x: number, y: number, pageWidth: number, pageHeight: number) => {
    if (!pendingFieldType) return;

    // Update container size
    setContainerSize({ width: pageWidth, height: pageHeight });

    const newField: SignatureField = {
      id: uuidv4(),
      eventId: "",
      label: getDefaultLabel(pendingFieldType, fields.length + 1),
      fieldType: pendingFieldType,
      pageNumber: currentPage,
      positionX: Math.max(0, Math.min(x - 10, 80)), // Center the field on click
      positionY: Math.max(0, Math.min(y - 3, 90)),
      width: 20,
      height: 6,
      isRequired: true,
      order: fields.length + 1,
      includeDate: false,
      includeName: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
    setPendingFieldType(null);
  }, [pendingFieldType, currentPage, fields]);

  const getDefaultLabel = (type: SignatureFieldType, order: number): string => {
    const labels: Record<SignatureFieldType, string> = {
      signature: `توقيع ${order}`,
      initials: `أحرف أولى ${order}`,
      date: `تاريخ ${order}`,
      text: `نص ${order}`,
      checkbox: `موافقة ${order}`,
    };
    return labels[type];
  };

  const handleUpdateField = (fieldId: string, updates: Partial<SignatureField>) => {
    setFields(fields.map(f => 
      f.id === fieldId ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f
    ));
  };

  const handleDeleteField = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId));
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  };

  const handleOpenSettings = (field: SignatureField) => {
    setEditingField(field);
    setSettingsOpen(true);
  };

  const handleSaveFieldSettings = (updates: Partial<SignatureField>) => {
    if (editingField) {
      handleUpdateField(editingField.id, updates);
    }
  };

  // الانتقال للخطوة التالية (صفحة الإعدادات)
  const handleNext = () => {
    if (!title.trim() || !documentUrl) return;

    // حفظ البيانات في Store
    setStep1Data({
      title: title.trim(),
      description: description.trim(),
      documentUrl,
      documentFileName,
      fields,
    });

    // الانتقال لصفحة الإعدادات
    router.push("/dashboard/events/new/document-signing/settings");
  };

  // التحقق من إمكانية المتابعة
  const canProceed = title.trim() !== "" && documentUrl !== "";

  const currentPageFields = fields.filter(f => f.pageNumber === currentPage);

  // Sidebar content - JSX variable instead of function to prevent re-mounting on each render
  const sidebarContent = (
    <div className="space-y-4">
      {/* Basic Info Card */}
      <Card className="p-3 md:p-4 space-y-3 md:space-y-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm md:text-base">
          <Settings className="w-4 h-4" />
          معلومات الحدث
        </h3>

        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm">عنوان الحدث *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: عقد توظيف"
            className="text-right text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm">الوصف</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="وصف اختياري..."
            className="text-right text-sm"
          />
        </div>
      </Card>

      {/* Document Upload Card */}
      <Card className="p-3 md:p-4 space-y-3 md:space-y-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm md:text-base">
          <FileText className="w-4 h-4" />
          الوثيقة
        </h3>

        <DocumentUploader
          currentFileUrl={documentUrl}
          currentFileName={documentFileName}
          onUploadComplete={handleDocumentUpload}
          onRemove={handleRemoveDocument}
        />
      </Card>

      {/* Fields Toolbar */}
      {documentUrl && (
        <FieldToolbar
          onAddField={(type) => {
            handleAddFieldClick(type);
            if (isMobile) setSidebarOpen(false);
          }}
          disabled={!documentUrl}
        />
      )}

      {/* Completion Status */}
      {documentUrl && (
        <Card className="p-3 md:p-4 space-y-2 md:space-y-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm md:text-base">
            <CheckCircle2 className="w-4 h-4" />
            حالة الإكمال
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs md:text-sm">
              <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center text-xs ${title.trim() ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                {title.trim() ? '✓' : '○'}
              </div>
              <span className={title.trim() ? 'text-green-700' : 'text-gray-500'}>
                عنوان الحدث
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm">
              <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center text-xs ${documentUrl ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                {documentUrl ? '✓' : '○'}
              </div>
              <span className={documentUrl ? 'text-green-700' : 'text-gray-500'}>
                رفع الوثيقة
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm">
              <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center text-xs ${fields.length > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                {fields.length > 0 ? '✓' : '○'}
              </div>
              <span className={fields.length > 0 ? 'text-green-700' : 'text-gray-500'}>
                حقول التوقيع ({fields.length})
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Fields List */}
      {fields.length > 0 && (
        <Card className="p-3 md:p-4 space-y-2 md:space-y-3">
          <h3 className="font-semibold text-gray-800 text-sm md:text-base">
            الحقول ({fields.length})
          </h3>
          <div className="space-y-2 max-h-40 md:max-h-60 overflow-y-auto">
            {fields.map((field) => (
              <div
                key={field.id}
                onClick={() => {
                  setSelectedFieldId(field.id);
                  setCurrentPage(field.pageNumber);
                  if (isMobile) setSidebarOpen(false);
                }}
                className={cn(
                  "p-2 rounded-lg border cursor-pointer transition-all text-xs md:text-sm",
                  selectedFieldId === field.id
                    ? "border-teal-500 bg-teal-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{field.label}</span>
                  <span className="text-xs text-gray-500">ص {field.pageNumber}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header - Responsive */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-2 md:px-4 py-2 md:py-3 flex items-center justify-between gap-2">
          {/* Right side - Back button and title */}
          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="ghost"
              size={isMobile ? "sm" : "sm"}
              onClick={onBackToModeChoice || onCancel}
              className={cn(isMobile && "px-2")}
            >
              <ArrowRight className="w-4 h-4 md:ml-2" />
              <span className="hidden md:inline">رجوع</span>
            </Button>
            <div className="hidden md:block h-6 w-px bg-gray-300" />
            <div className="flex items-center gap-1.5 md:gap-2">
              <FileText className="w-4 h-4 md:w-5 md:h-5 text-teal-600" />
              <span className="font-semibold text-gray-800 text-sm md:text-base">
                توقيع وثيقة {signingMode === "multi" && <span className="text-purple-600">(متعدد)</span>}
              </span>
            </div>
          </div>

          {/* Steps Indicator - Compact on mobile */}
          <div className="hidden sm:flex items-center gap-2 md:gap-3">
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full bg-teal-600 text-white text-xs md:text-sm font-medium">
                1
              </div>
              <span className="hidden md:inline text-sm font-medium text-teal-600">بناء الوثيقة</span>
            </div>
            <div className="w-4 md:w-8 h-0.5 bg-gray-300" />
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full bg-gray-300 text-gray-500 text-xs md:text-sm font-medium">
                2
              </div>
              <span className="hidden md:inline text-sm text-gray-500">الإعدادات</span>
            </div>
          </div>

          {/* Left side - Action buttons */}
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant="outline"
              size={isMobile ? "sm" : "default"}
              onClick={onCancel}
              className="hidden sm:flex"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed}
              size={isMobile ? "sm" : "default"}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <span className="hidden sm:inline">التالي</span>
              <span className="sm:hidden">التالي</span>
              <ArrowLeft className="w-4 h-4 mr-1 md:mr-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Responsive */}
      <div className="max-w-7xl mx-auto p-2 md:p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          {/* Desktop Sidebar - Hidden on mobile */}
          <div className="hidden lg:block lg:col-span-3 space-y-4">
            {sidebarContent}
          </div>

          {/* PDF Viewer - Full width on mobile */}
          <div className="col-span-1 lg:col-span-9">
            {!documentUrl ? (
              <Card className="h-[400px] md:h-[600px] flex items-center justify-center">
                <div className="text-center text-gray-500 p-4">
                  <FileText className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-gray-300" />
                  <p className="text-base md:text-lg font-medium">لم يتم رفع وثيقة بعد</p>
                  <p className="text-xs md:text-sm mt-2">
                    {isMobile ? "اضغط على زر الإعدادات لرفع ملف PDF" : "قم برفع ملف PDF من القائمة الجانبية"}
                  </p>
                  {/* Mobile: Show upload button directly */}
                  {isMobile && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setSidebarOpen(true)}
                    >
                      <Settings className="w-4 h-4 ml-2" />
                      فتح الإعدادات
                    </Button>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="overflow-hidden">
                <div
                  className={cn(
                    "relative",
                    isMobile ? "h-[calc(100vh-180px)]" : isTablet ? "h-[600px]" : "h-[700px]"
                  )}
                  ref={pdfContainerRef}
                >
                  {/* Pending field indicator */}
                  {pendingFieldType && (
                    <div className="absolute top-2 left-2 right-2 md:left-2 md:right-auto z-20 bg-teal-600 text-white px-3 py-1.5 rounded-full text-xs md:text-sm text-center">
                      انقر على المستند لوضع الحقل
                    </div>
                  )}

                  <PDFViewer
                    fileUrl={fullDocumentUrl}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    onTotalPagesChange={setTotalPages}
                    scale={scale}
                    onScaleChange={setScale}
                    onPageClick={handlePDFClick}
                    className="h-full"
                  >
                    {/* Signature Fields Overlay */}
                    {currentPageFields.map((field) => (
                      <SignatureFieldItem
                        key={field.id}
                        field={field}
                        isSelected={selectedFieldId === field.id}
                        onSelect={() => setSelectedFieldId(field.id)}
                        onUpdate={(updates) => handleUpdateField(field.id, updates)}
                        onDelete={() => handleDeleteField(field.id)}
                        onOpenSettings={() => handleOpenSettings(field)}
                        containerWidth={containerSize.width || 600}
                        containerHeight={containerSize.height || 800}
                        scale={scale}
                      />
                    ))}
                  </PDFViewer>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Floating Action Button */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button
              className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg bg-teal-600 hover:bg-teal-700"
              size="icon"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85vw] sm:w-[400px] overflow-y-auto bg-white">
            <SheetHeader className="mb-4">
              <SheetTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-teal-600" />
                إعدادات الوثيقة
              </SheetTitle>
            </SheetHeader>
            {sidebarContent}

            {/* Mobile: Next button at bottom of sheet */}
            {canProceed && (
              <div className="sticky bottom-0 pt-4 pb-2 bg-white border-t mt-4">
                <Button
                  onClick={() => {
                    setSidebarOpen(false);
                    handleNext();
                  }}
                  className="w-full bg-teal-600 hover:bg-teal-700 h-12"
                >
                  <span>متابعة للإعدادات</span>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                </Button>
              </div>
            )}
          </SheetContent>
        </Sheet>
      )}

      {/* Mobile: Bottom status bar */}
      {isMobile && documentUrl && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-3 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <div className={cn(
                "w-2 h-2 rounded-full",
                canProceed ? "bg-green-500" : "bg-yellow-500"
              )} />
              <span className="text-gray-600">
                {fields.length} حقل • صفحة {currentPage}/{totalPages}
              </span>
            </div>
            <Button
              onClick={handleNext}
              disabled={!canProceed}
              size="sm"
              className="bg-teal-600 hover:bg-teal-700"
            >
              التالي
              <ArrowLeft className="w-4 h-4 mr-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Field Settings Dialog */}
      <SignatureFieldSettings
        open={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          setEditingField(null);
        }}
        field={editingField}
        onSave={handleSaveFieldSettings}
        signingMode={signingMode}
      />
    </div>
  );
}


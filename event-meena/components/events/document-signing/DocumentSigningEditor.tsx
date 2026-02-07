"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  ArrowRight,
  FileText,
  Loader2,
  Settings,
  Save,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SignatureField, SignatureFieldType, DocumentSigningEvent } from "@/types/document-signing";
import { filesService, documentSigningService } from "@/lib/api/services";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import DocumentUploader from "./DocumentUploader";
import PDFViewer from "./PDFViewer";
import SignatureFieldItem from "./SignatureFieldItem";
import SignatureFieldSettings from "./SignatureFieldSettings";
import FieldToolbar from "./FieldToolbar";

interface DocumentSigningEditorProps {
  event: DocumentSigningEvent;
  onCancel: () => void;
  onSave: () => void;
}

export default function DocumentSigningEditor({
  event,
  onCancel,
  onSave,
}: DocumentSigningEditorProps) {
  // Responsive hooks
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");

  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Basic info
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description);

  // Document
  const [documentUrl, setDocumentUrl] = useState(event.documentUrl);
  const [documentFileName, setDocumentFileName] = useState(event.documentFileName);

  // Settings
  const [requireLogin, setRequireLogin] = useState(event.settings?.requireAuth ?? true);
  const [isPrivate, setIsPrivate] = useState(event.settings?.isPrivate ?? true);
  const [allowedEmails, setAllowedEmails] = useState<string[]>(event.settings?.allowedEmails || []);
  const [newEmail, setNewEmail] = useState("");
  const [signatureDisplayMode, setSignatureDisplayMode] = useState<"inside" | "outside">(
    event.signatureDisplayMode || "inside"
  );

  // PDF viewer state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1);

  // Fields
  const [fields, setFields] = useState<SignatureField[]>(event.signatureFields || []);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [pendingFieldType, setPendingFieldType] = useState<SignatureFieldType | null>(null);

  // Field Settings Dialog
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingField, setEditingField] = useState<SignatureField | null>(null);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  // PDF container ref for sizing
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Get full URL for PDF viewing
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

    setContainerSize({ width: pageWidth, height: pageHeight });

    const newField: SignatureField = {
      id: uuidv4(),
      eventId: event.id,
      label: getDefaultLabel(pendingFieldType, fields.length + 1),
      fieldType: pendingFieldType,
      pageNumber: currentPage,
      positionX: Math.max(0, Math.min(x - 10, 80)),
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
  }, [pendingFieldType, currentPage, fields, event.id]);

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

  // Email management for private events
  const handleAddEmail = () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("يرجى إدخال بريد إلكتروني صحيح");
      return;
    }

    if (allowedEmails.includes(email)) {
      toast.error("هذا البريد مضاف مسبقاً");
      return;
    }

    setAllowedEmails([...allowedEmails, email]);
    setNewEmail("");
  };

  const handleRemoveEmail = (email: string) => {
    setAllowedEmails(allowedEmails.filter(e => e !== email));
  };

  // Save changes
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("يرجى إدخال عنوان الحدث");
      return;
    }

    setIsSaving(true);
    try {
      // Prepare signature fields for API (fieldType as string)
      const signatureFieldsForApi = fields.map(field => ({
        id: field.id,
        label: field.label,
        pageNumber: field.pageNumber,
        positionX: field.positionX,
        positionY: field.positionY,
        width: field.width,
        height: field.height,
        isRequired: field.isRequired,
        order: field.order,
        fieldType: field.fieldType, // string: "signature", "initials", "date", "text", "checkbox"
        includeDate: field.includeDate || false,
        includeName: field.includeName || false,
      }));

      const updateData = {
        title: title.trim(),
        description: description.trim() || undefined,
        requireLogin,
        allowAnonymous: !requireLogin,
        isPrivate,
        allowedEmails: isPrivate ? allowedEmails : undefined,
        signatureDisplayMode,
        signatureFields: signatureFieldsForApi,
      };

      await documentSigningService.updateDocumentEvent(event.id, updateData);

      toast.success("تم حفظ التغييرات بنجاح");
      onSave();
    } catch (error) {
      console.error("Error saving document event:", error);
      toast.error("حدث خطأ أثناء حفظ التغييرات");
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = title.trim() !== "" && documentUrl !== "";
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

      {/* Access Settings Card */}
      <Card className="p-3 md:p-4 space-y-3 md:space-y-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm md:text-base">
          <Settings className="w-4 h-4" />
          إعدادات الوصول
        </h3>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="requireLogin"
              checked={requireLogin}
              onCheckedChange={(checked) => setRequireLogin(checked === true)}
            />
            <Label htmlFor="requireLogin" className="text-xs md:text-sm cursor-pointer">يتطلب تسجيل دخول</Label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="isPrivate"
                checked={isPrivate}
                onCheckedChange={(checked) => setIsPrivate(checked === true)}
              />
              <Label htmlFor="isPrivate" className="text-xs md:text-sm cursor-pointer">حدث خاص</Label>
            </div>

            {/* Allowed Emails - shown when isPrivate is true */}
            {isPrivate && (
              <div className="mr-4 md:mr-6 mt-2 p-2 md:p-3 bg-gray-50 rounded-lg border space-y-2 md:space-y-3">
                <p className="text-xs text-gray-600">
                  أضف البريد الإلكتروني للأشخاص المسموح لهم بالوصول
                </p>

                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddEmail())}
                    placeholder="example@email.com"
                    className="text-left text-xs md:text-sm h-8"
                    dir="ltr"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddEmail}
                    className="bg-teal-600 hover:bg-teal-700 h-8 px-2 md:px-3 text-xs"
                  >
                    إضافة
                  </Button>
                </div>

                {allowedEmails.length > 0 && (
                  <div className="space-y-1.5 max-h-24 md:max-h-32 overflow-y-auto">
                    {allowedEmails.map((email) => (
                      <div
                        key={email}
                        className="flex items-center justify-between bg-white px-2 py-1.5 rounded border text-xs md:text-sm"
                      >
                        <span className="text-gray-700 truncate" dir="ltr">{email}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEmail(email)}
                          className="text-red-500 hover:text-red-700 text-xs mr-2"
                        >
                          حذف
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {allowedEmails.length === 0 && (
                  <p className="text-xs text-amber-600">
                    ⚠️ لم تتم إضافة أي بريد إلكتروني بعد
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t">
          <Label className="text-xs md:text-sm">طريقة عرض التوقيع</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={signatureDisplayMode === "inside" ? "default" : "outline"}
              size="sm"
              onClick={() => setSignatureDisplayMode("inside")}
              className={cn(
                "text-xs",
                signatureDisplayMode === "inside" ? "bg-teal-600 hover:bg-teal-700" : ""
              )}
            >
              داخل الوثيقة
            </Button>
            <Button
              type="button"
              variant={signatureDisplayMode === "outside" ? "default" : "outline"}
              size="sm"
              onClick={() => setSignatureDisplayMode("outside")}
              className={cn(
                "text-xs",
                signatureDisplayMode === "outside" ? "bg-teal-600 hover:bg-teal-700" : ""
              )}
            >
              خارج الوثيقة
            </Button>
          </div>
        </div>
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
              size="sm"
              onClick={onCancel}
              className={cn(isMobile && "px-2")}
            >
              <ArrowRight className="w-4 h-4 md:ml-2" />
              <span className="hidden md:inline">رجوع</span>
            </Button>
            <div className="hidden md:block h-6 w-px bg-gray-300" />
            <div className="flex items-center gap-1.5 md:gap-2">
              <FileText className="w-4 h-4 md:w-5 md:h-5 text-teal-600" />
              <span className="font-semibold text-gray-800 text-sm md:text-base">تعديل الوثيقة</span>
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
              onClick={handleSave}
              disabled={!canSave || isSaving}
              size={isMobile ? "sm" : "default"}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 ml-1 md:ml-2 animate-spin" />
                  <span className="hidden sm:inline">جاري الحفظ...</span>
                  <span className="sm:hidden">حفظ...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 ml-1 md:ml-2" />
                  <span className="hidden sm:inline">حفظ التغييرات</span>
                  <span className="sm:hidden">حفظ</span>
                </>
              )}
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

            {/* Mobile: Save button at bottom of sheet */}
            {canSave && (
              <div className="sticky bottom-0 pt-4 pb-2 bg-white border-t mt-4">
                <Button
                  onClick={() => {
                    setSidebarOpen(false);
                    handleSave();
                  }}
                  disabled={isSaving}
                  className="w-full bg-teal-600 hover:bg-teal-700 h-12"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 ml-2" />
                      حفظ التغييرات
                    </>
                  )}
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
                canSave ? "bg-green-500" : "bg-yellow-500"
              )} />
              <span className="text-gray-600">
                {fields.length} حقل • صفحة {currentPage}/{totalPages}
              </span>
            </div>
            <Button
              onClick={handleSave}
              disabled={!canSave || isSaving}
              size="sm"
              className="bg-teal-600 hover:bg-teal-700"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  حفظ
                </>
              )}
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
      />
    </div>
  );
}


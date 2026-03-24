"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DisplaySettings as DisplaySettingsType, DisplayType } from "@/types/component";
import { Image, FileText, Link as LinkIcon, Upload, X, Loader2 } from "lucide-react";
import { uploadFileSimple } from "@/lib/api/services/filesService";
import { getFullFileUrl } from "@/lib/api/services/filesService";

interface DisplaySettingsProps {
  open: boolean;
  onClose: () => void;
  onSave: (settings: DisplaySettingsType) => void;
  initialSettings?: Partial<DisplaySettingsType>;
}

export default function DisplaySettings({
  open,
  onClose,
  onSave,
  initialSettings,
}: DisplaySettingsProps) {
  const [label, setLabel] = useState(initialSettings?.label || "");
  const [description, setDescription] = useState(initialSettings?.description || "");
  const [displayType, setDisplayType] = useState<DisplayType>(
    initialSettings?.displayType || "image"
  );

  // Image settings
  const [imageUrl, setImageUrl] = useState(initialSettings?.imageUrl || "");
  const [imageFile, setImageFile] = useState<File | undefined>(initialSettings?.imageFile);
  const [imageAlt, setImageAlt] = useState(initialSettings?.imageAlt || "");

  // PDF settings
  const [pdfUrl, setPdfUrl] = useState(initialSettings?.pdfUrl || "");
  const [pdfFile, setPdfFile] = useState<File | undefined>(initialSettings?.pdfFile);
  const [pdfFileName, setPdfFileName] = useState(initialSettings?.pdfFileName || "");
  const [allowDownload, setAllowDownload] = useState(initialSettings?.allowDownload ?? true);

  // Link settings
  const [linkUrl, setLinkUrl] = useState(initialSettings?.linkUrl || "");
  const [linkText, setLinkText] = useState(initialSettings?.linkText || "");
  const [openInNewTab, setOpenInNewTab] = useState(initialSettings?.openInNewTab ?? true);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleSave = () => {
    if (!label.trim()) {
      alert("يرجى إدخال عنوان العرض");
      return;
    }

    // Validation based on display type
    if (displayType === "image" && !imageUrl) {
      alert("يرجى رفع صورة");
      return;
    }

    if (displayType === "pdf" && !pdfUrl) {
      alert("يرجى رفع ملف PDF");
      return;
    }

    if (displayType === "link" && !linkUrl.trim()) {
      alert("يرجى إدخال رابط URL");
      return;
    }

    const settings: DisplaySettingsType = {
      type: "display",
      label: label.trim(),
      description: description.trim() || undefined,
      displayType,
      ...(displayType === "image" && {
        imageUrl,
        imageAlt: imageAlt.trim() || undefined,
      }),
      ...(displayType === "pdf" && {
        pdfUrl,
        pdfFileName: pdfFileName.trim() || undefined,
        allowDownload,
      }),
      ...(displayType === "link" && {
        linkUrl: linkUrl.trim(),
        linkText: linkText.trim() || undefined,
        openInNewTab,
      }),
    };

    onSave(settings);
    onClose();
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("يرجى اختيار ملف صورة صالح");
        return;
      }

      setImageFile(file);
      setIsUploading(true);
      setUploadError(null);

      try {
        // رفع الصورة إلى السيرفر والحصول على رابط حقيقي
        const result = await uploadFileSimple(file, "image");
        setImageUrl(result.fileUrl); // رابط حقيقي من السيرفر مثل /uploads/images/xxx.jpg
      } catch (error) {
        console.error("فشل رفع الصورة:", error);
        setUploadError("فشل رفع الصورة. يرجى المحاولة مرة أخرى.");
        setImageFile(undefined);
        setImageUrl("");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handlePdfFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        alert("يرجى اختيار ملف PDF صالح");
        return;
      }

      setPdfFile(file);
      setPdfFileName(file.name);
      setIsUploading(true);
      setUploadError(null);

      try {
        // رفع ملف PDF إلى السيرفر والحصول على رابط حقيقي
        const result = await uploadFileSimple(file, "pdf");
        setPdfUrl(result.fileUrl); // رابط حقيقي من السيرفر مثل /uploads/pdfs/xxx.pdf
      } catch (error) {
        console.error("فشل رفع ملف PDF:", error);
        setUploadError("فشل رفع ملف PDF. يرجى المحاولة مرة أخرى.");
        setPdfFile(undefined);
        setPdfUrl("");
        setPdfFileName("");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const clearImageFile = () => {
    setImageFile(undefined);
    setImageUrl("");
    setUploadError(null);
  };

  const clearPdfFile = () => {
    setPdfFile(undefined);
    setPdfUrl("");
    setPdfFileName("");
    setUploadError(null);
  };

  // Helper to get display URL for preview (convert relative server path to full URL)
  const getPreviewUrl = (url: string) => {
    if (!url) return "";
    // blob: URLs and http(s): URLs can be used directly
    if (url.startsWith("blob:") || url.startsWith("http")) return url;
    // Relative server paths need to be converted to full URLs
    return getFullFileUrl(url);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إعدادات العرض</DialogTitle>
          <DialogDescription>
            قم بإعداد محتوى العرض الذي سيراه المشاركون
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Display Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="displayType">نوع العرض *</Label>
            <Select value={displayType} onValueChange={(value: DisplayType) => setDisplayType(value)}>
              <SelectTrigger id="displayType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image">
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    <span>عرض صورة</span>
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>عرض PDF</span>
                  </div>
                </SelectItem>
                <SelectItem value="link">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    <span>عرض رابط</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor="label">عنوان العرض *</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="مثال: صورة توضيحية، ملف الشروط والأحكام، رابط الموقع"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">وصف اختياري</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف إضافي للمحتوى المعروض"
              rows={2}
            />
          </div>

          {/* Upload Error Message */}
          {uploadError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {uploadError}
            </div>
          )}

          {/* Image Display Settings */}
          {displayType === "image" && (
            <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800 font-semibold">
                <Image className="w-5 h-5" />
                <span>إعدادات عرض الصورة</span>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="imageFile">رفع صورة</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="imageFile"
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="flex-1"
                      disabled={isUploading}
                    />
                    {isUploading && (
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    )}
                    {imageFile && !isUploading && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={clearImageFile}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {isUploading && (
                    <p className="text-xs text-blue-600">جاري رفع الصورة إلى السيرفر...</p>
                  )}
                </div>

                {imageUrl && !isUploading && (
                  <div className="space-y-2">
                    <Label>معاينة الصورة</Label>
                    <div className="border rounded-lg p-2 bg-white">
                      <img
                        src={getPreviewUrl(imageUrl)}
                        alt={imageAlt || "Preview"}
                        className="max-w-full h-auto max-h-64 mx-auto rounded"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="imageAlt">نص بديل للصورة (Alt Text)</Label>
                  <Input
                    id="imageAlt"
                    value={imageAlt}
                    onChange={(e) => setImageAlt(e.target.value)}
                    placeholder="وصف الصورة للمستخدمين الذين لا يمكنهم رؤيتها"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PDF Display Settings */}
          {displayType === "pdf" && (
            <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 font-semibold">
                <FileText className="w-5 h-5" />
                <span>إعدادات عرض PDF</span>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="pdfFile">رفع ملف PDF</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="pdfFile"
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handlePdfFileChange}
                      className="flex-1"
                      disabled={isUploading}
                    />
                    {isUploading && (
                      <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                    )}
                    {pdfFile && !isUploading && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={clearPdfFile}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {isUploading && (
                    <p className="text-xs text-green-600">جاري رفع الملف إلى السيرفر...</p>
                  )}
                </div>

                {pdfFileName && !isUploading && (
                  <div className="p-3 bg-white border rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-green-600" />
                      <span className="font-medium">{pdfFileName}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <Label className="text-sm">السماح بالتحميل</Label>
                    <p className="text-xs text-gray-600">المشاركون يمكنهم تحميل الملف</p>
                  </div>
                  <Checkbox
                    checked={allowDownload}
                    onCheckedChange={(checked) => setAllowDownload(checked === true)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Link Display Settings */}
          {displayType === "link" && (
            <div className="space-y-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 text-purple-800 font-semibold">
                <LinkIcon className="w-5 h-5" />
                <span>إعدادات عرض الرابط</span>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="linkUrl">رابط URL *</Label>
                  <Input
                    id="linkUrl"
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkText">نص الرابط</Label>
                  <Input
                    id="linkText"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    placeholder="اضغط هنا للمزيد من المعلومات"
                  />
                  <p className="text-xs text-gray-600">
                    إذا تركته فارغاً، سيتم عرض الرابط نفسه
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <Label className="text-sm">فتح في نافذة جديدة</Label>
                    <p className="text-xs text-gray-600">فتح الرابط في تبويب جديد</p>
                  </div>
                  <Checkbox
                    checked={openInNewTab}
                    onCheckedChange={(checked) => setOpenInNewTab(checked === true)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
                جاري الرفع...
              </>
            ) : (
              "حفظ"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


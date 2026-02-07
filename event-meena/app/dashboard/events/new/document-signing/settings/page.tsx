"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowRight,
  ArrowLeft,
  FileText,
  Loader2,
  Lock,
  Shield,
  Mail,
  X,
  Plus,
  Users,
  UserPlus,
  Search,
  Phone,
  Settings,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useDocumentSigningBuilderStore } from "@/store/documentSigningBuilderStore";
import { useContactsStore } from "@/store/contactsStore";
import { documentSigningService } from "@/lib/api/services/documentSigningService";
import { toast } from "sonner";
import { Contact, Group } from "@/types/contact";

export default function DocumentSigningSettingsPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // لمنع redirect بعد النجاح
  const [showAuthWarning, setShowAuthWarning] = useState(false);
  const [showPrivateDialog, setShowPrivateDialog] = useState(false);
  const [showContactsDialog, setShowContactsDialog] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"contacts" | "groups">("contacts");

  // Responsive hooks
  const isMobile = useMediaQuery("(max-width: 767px)");

  // Store
  const {
    title,
    description,
    documentUrl,
    documentFileName,
    fields,
    isStep1Complete,
    requireLogin,
    isPrivate,
    allowedEmails,
    signatureDisplayMode,
    signingMode,
    setRequireLogin,
    setIsPrivate,
    addAllowedEmail,
    removeAllowedEmail,
    setAllowedEmails,
    setSignatureDisplayMode,
    reset,
  } = useDocumentSigningBuilderStore();

  // في وضع multi-signer، نستخرج الإيميلات من الحقول تلقائياً
  const multiSignerEmails = signingMode === "multi"
    ? [...new Set(fields.filter(f => f.assignedEmail).map(f => f.assignedEmail!.toLowerCase()))]
    : [];

  // Contacts store
  const { contacts, groups, fetchContacts, fetchGroups } = useContactsStore();

  // Fetch contacts on mount
  useEffect(() => {
    fetchContacts();
    fetchGroups();
  }, [fetchContacts, fetchGroups]);

  // Redirect if step 1 not complete (only if not success)
  useEffect(() => {
    if (!isStep1Complete && !isSuccess) {
      router.push("/dashboard/events/new/document-signing");
    }
  }, [isStep1Complete, isSuccess, router]);

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Add email handler
  const handleAddEmail = () => {
    const trimmedEmail = emailInput.trim().toLowerCase();
    if (!trimmedEmail) return;

    if (!validateEmail(trimmedEmail)) {
      setEmailError("يرجى إدخال بريد إلكتروني صحيح");
      return;
    }

    if (allowedEmails.includes(trimmedEmail)) {
      setEmailError("هذا البريد مضاف مسبقاً");
      return;
    }

    addAllowedEmail(trimmedEmail);
    setEmailInput("");
    setEmailError("");
  };

  // Handle key press (Enter to add)
  const handleEmailKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddEmail();
    }
  };

  // Filter contacts/groups based on search
  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle contact selection
  const toggleContactSelection = (contact: Contact) => {
    const isSelected = selectedContactIds.includes(contact.id);
    if (isSelected) {
      setSelectedContactIds((prev) => prev.filter((id) => id !== contact.id));
    } else {
      setSelectedContactIds((prev) => [...prev, contact.id]);
    }
  };

  // Toggle group selection
  const toggleGroupSelection = (group: Group) => {
    const isSelected = selectedGroupIds.includes(group.id);
    if (isSelected) {
      setSelectedGroupIds((prev) => prev.filter((id) => id !== group.id));
    } else {
      setSelectedGroupIds((prev) => [...prev, group.id]);
    }
  };

  // Add selected contacts/groups to allowed emails
  const handleAddFromContacts = () => {
    const newEmails: string[] = [];

    // Add selected contacts' emails
    selectedContactIds.forEach((contactId) => {
      const contact = contacts.find((c) => c.id === contactId);
      if (contact && contact.email && !allowedEmails.includes(contact.email.toLowerCase())) {
        newEmails.push(contact.email.toLowerCase());
      }
    });

    // Add selected groups' members' emails
    selectedGroupIds.forEach((groupId) => {
      const group = groups.find((g) => g.id === groupId);
      if (group) {
        group.contactIds.forEach((contactId) => {
          const contact = contacts.find((c) => c.id === contactId);
          if (contact && contact.email && !allowedEmails.includes(contact.email.toLowerCase()) && !newEmails.includes(contact.email.toLowerCase())) {
            newEmails.push(contact.email.toLowerCase());
          }
        });
      }
    });

    setAllowedEmails([...allowedEmails, ...newEmails]);
    setShowContactsDialog(false);
    setSelectedContactIds([]);
    setSelectedGroupIds([]);
    setSearchQuery("");
  };

  // Handle private toggle
  const handlePrivateToggle = (value: boolean) => {
    if (value && !requireLogin) {
      setShowPrivateDialog(true);
    } else {
      setIsPrivate(value);
    }
  };

  // Confirm enabling private event
  const confirmEnablePrivate = () => {
    setIsPrivate(true);
    setShowPrivateDialog(false);
  };

  // Handle create event
  const handleCreateEvent = async () => {
    if (!title || !documentUrl) return;

    setIsCreating(true);
    try {
      // تحويل الحقول إلى التنسيق المطلوب للـ API
      const signatureFields = fields.map((field, index) => ({
        label: field.label,
        fieldType: field.fieldType,
        pageNumber: field.pageNumber,
        positionX: field.positionX,
        positionY: field.positionY,
        width: field.width,
        height: field.height,
        isRequired: field.isRequired,
        order: index + 1,
        includeDate: field.includeDate,
        includeName: field.includeName,
        assignedEmail: field.assignedEmail,
      }));

      // في وضع multi-signer، نستخدم الإيميلات من الحقول كـ allowedEmails
      const finalAllowedEmails = signingMode === "multi" ? multiSignerEmails : allowedEmails;

      const result = await documentSigningService.createDocumentEventWithUrl({
        title,
        description,
        documentUrl,
        documentFileName,
        signatureFields,
        requireLogin: signingMode === "multi" ? true : requireLogin, // multi-signer يتطلب تسجيل دخول دائماً
        isPrivate: signingMode === "multi" ? true : isPrivate, // multi-signer خاص دائماً
        allowedEmails: finalAllowedEmails,
        signatureDisplayMode,
        signingMode,
      });

      toast.success("تم إنشاء حدث التوقيع بنجاح!");

      // تعيين النجاح أولاً لمنع redirect غير مرغوب
      setIsSuccess(true);

      // الانتقال لصفحة تفاصيل الحدث (result هو DocumentSigningEvent الذي يحتوي على id)
      router.push(`/dashboard/events/${result.id}`);

      // تأخير reset لضمان اكتمال التنقل
      setTimeout(() => {
        reset();
      }, 500);
    } catch (error) {
      console.error("Error creating document signing event:", error);
      toast.error("حدث خطأ أثناء إنشاء الحدث");
    } finally {
      setIsCreating(false);
    }
  };

  // Go back to builder
  const handleBack = () => {
    router.push("/dashboard/events/new/document-signing");
  };

  if (!isStep1Complete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20 md:pb-0">
      {/* Header - Responsive */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-2 md:px-4 py-2 md:py-3 flex items-center justify-between gap-2">
          {/* Right side - Back button and title */}
          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className={cn(isMobile && "px-2")}
            >
              <ArrowRight className="w-4 h-4 md:ml-2" />
              <span className="hidden md:inline">رجوع</span>
            </Button>
            <div className="hidden md:block h-6 w-px bg-gray-300" />
            <div className="flex items-center gap-1.5 md:gap-2">
              <FileText className="w-4 h-4 md:w-5 md:h-5 text-teal-600" />
              <span className="font-semibold text-gray-800 text-sm md:text-base">إعدادات الحدث</span>
            </div>
          </div>

          {/* Steps Indicator - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-600 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-sm text-green-600">بناء الوثيقة</span>
            </div>
            <div className="w-8 h-0.5 bg-teal-600" />
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-teal-600 text-white text-sm font-medium">
                2
              </div>
              <span className="text-sm font-medium text-teal-600">الإعدادات</span>
            </div>
          </div>

          {/* Mobile Steps Indicator */}
          {isMobile && (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="w-4 h-0.5 bg-teal-600" />
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-medium">
                2
              </div>
            </div>
          )}

          {/* Action buttons - Hidden on mobile (shown in bottom bar) */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="outline" onClick={handleBack} disabled={isCreating}>
              السابق
            </Button>
            <Button
              onClick={handleCreateEvent}
              disabled={isCreating}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                  إنشاء الحدث
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Responsive */}
      <div className="max-w-4xl mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
        {/* Document Summary */}
        <Card className="p-4 md:p-6 bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 md:w-6 md:h-6 text-teal-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg md:text-xl font-bold text-teal-900 truncate">{title}</h2>
              {description && (
                <p className="text-teal-700 mt-1 text-sm md:text-base line-clamp-2">{description}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2 md:mt-3 text-xs md:text-sm text-teal-600">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="truncate max-w-[120px] md:max-w-none">{documentFileName}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Settings className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  {fields.length} حقل توقيع
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Multi-Signer Info Card - يظهر فقط في وضع multi-signer */}
        {signingMode === "multi" && (
          <Card className="p-4 md:p-6 border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="p-1.5 md:p-2 rounded-lg bg-purple-100">
                <Users className="w-4 h-4 md:w-5 md:h-5 text-purple-700" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold text-gray-900">الموقّعون المحددون</h3>
                <p className="text-xs md:text-sm text-gray-600">قائمة الموقّعين المخصصين لحقول التوقيع</p>
              </div>
            </div>

            {/* Signers List */}
            <div className="space-y-3">
              {multiSignerEmails.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-1.5 md:gap-2 p-3 md:p-4 bg-white rounded-lg border border-purple-200">
                    {multiSignerEmails.map((email, index) => {
                      const signerFields = fields.filter(f => f.assignedEmail?.toLowerCase() === email);
                      return (
                        <div
                          key={email}
                          className="flex items-center gap-2 py-1.5 md:py-2 px-3 md:px-4 bg-purple-100 rounded-lg"
                        >
                          <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs md:text-sm font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs md:text-sm font-medium text-purple-900 truncate">{email}</p>
                            <p className="text-[10px] md:text-xs text-purple-600">{signerFields.length} حقل</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Info Box */}
                  <div className="bg-purple-100/50 border border-purple-200 rounded-lg p-3 md:p-4">
                    <p className="text-xs md:text-sm text-purple-800 flex items-start gap-2">
                      <span className="text-purple-600 text-base md:text-lg">ℹ️</span>
                      <span>
                        كل موقّع سيرى فقط الحقول المخصصة له. سيتم إرسال رابط المشاركة لكل موقّع على حدة.
                        يتطلب تسجيل الدخول بنفس البريد الإلكتروني المحدد.
                      </span>
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 md:py-8 bg-white rounded-lg border border-purple-200">
                  <Users className="w-10 h-10 md:w-12 md:h-12 text-purple-300 mx-auto mb-2 md:mb-3" />
                  <p className="text-sm md:text-base text-purple-600 font-medium">لم يتم تحديد موقّعين</p>
                  <p className="text-xs md:text-sm text-gray-500 mt-1">
                    يرجى العودة وتحديد إيميل لكل حقل توقيع
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Access Settings - يظهر فقط في وضع single-signer */}
        {signingMode === "single" && (
          <Card className={cn(
            "p-4 md:p-6 transition-all",
            isPrivate && "border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50"
          )}>
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className={cn("p-1.5 md:p-2 rounded-lg", isPrivate ? "bg-purple-100" : "bg-gray-100")}>
                <Lock className={cn("w-4 h-4 md:w-5 md:h-5", isPrivate ? "text-purple-700" : "text-gray-600")} />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold text-gray-900">إعدادات الوصول</h3>
                <p className="text-xs md:text-sm text-gray-600">تحكم في من يمكنه الوصول للوثيقة والتوقيع عليها</p>
              </div>
            </div>

            <div className="space-y-3 md:space-y-4">
              {/* Require Login */}
              <div className="flex items-center justify-between p-3 md:p-4 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors">
                <div className="flex items-start gap-2 md:gap-3">
                  <Lock className="w-4 h-4 md:w-5 md:h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <Label htmlFor="requireLogin" className="text-sm md:text-base font-semibold cursor-pointer">
                      يتطلب تسجيل دخول
                    </Label>
                    <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1">
                      الموقّعون يجب أن يسجلوا الدخول قبل التوقيع
                    </p>
                  </div>
                </div>
                <Checkbox
                  id="requireLogin"
                  checked={requireLogin}
                  onCheckedChange={(checked) => {
                    if (checked === false && requireLogin === true) {
                      setShowAuthWarning(true);
                    } else {
                      setRequireLogin(true);
                    }
                  }}
                />
              </div>

              {/* Private Event */}
              <div className={cn(
                "p-3 md:p-4 rounded-lg border transition-all",
                isPrivate ? "border-purple-300 bg-white/50" : "border-gray-200 hover:border-purple-300"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-2 md:gap-3">
                    <Shield className="w-4 h-4 md:w-5 md:h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <Label htmlFor="isPrivate" className="text-sm md:text-base font-semibold cursor-pointer">
                        حدث خاص
                      </Label>
                      <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1">
                        فقط أشخاص محددين يمكنهم الوصول والتوقيع
                      </p>
                    </div>
                  </div>
                  <Checkbox
                    id="isPrivate"
                    checked={isPrivate}
                    onCheckedChange={(checked) => handlePrivateToggle(checked === true)}
                  />
                </div>

                {/* Allowed Emails Section */}
                {isPrivate && (
                  <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-purple-200 space-y-3 md:space-y-4">
                    {/* Email Input */}
                    <div className="space-y-2">
                      <Label className="text-sm md:text-base font-semibold">إضافة بريد إلكتروني</Label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1 relative">
                          <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            type="email"
                            placeholder="أدخل البريد الإلكتروني..."
                            value={emailInput}
                            onChange={(e) => {
                              setEmailInput(e.target.value);
                              setEmailError("");
                            }}
                            onKeyPress={handleEmailKeyPress}
                            className={cn("pr-10 text-sm", emailError && "border-red-500")}
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={handleAddEmail}
                          variant="outline"
                          className="w-full sm:w-auto"
                        >
                          <Plus className="w-4 h-4 ml-2" />
                          إضافة
                        </Button>
                      </div>
                      {emailError && <p className="text-xs md:text-sm text-red-500">{emailError}</p>}
                    </div>

                    {/* Select from Contacts Button */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowContactsDialog(true)}
                      className="w-full gap-2 border-dashed border-purple-300 text-purple-700 hover:bg-purple-50 text-sm"
                    >
                      <Users className="w-4 h-4" />
                      اختر من جهات الاتصال
                    </Button>

                    {/* Allowed Emails List */}
                    {allowedEmails.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm md:text-base font-semibold">
                            المسموح لهم ({allowedEmails.length})
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setAllowedEmails([])}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs md:text-sm"
                          >
                            مسح الكل
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 md:gap-2 p-2 md:p-3 bg-white rounded-lg border border-purple-200 max-h-32 md:max-h-40 overflow-y-auto">
                          {allowedEmails.map((email) => (
                            <Badge
                              key={email}
                              variant="secondary"
                              className="gap-1 py-1 md:py-1.5 px-2 md:px-3 bg-purple-100 text-purple-800 hover:bg-purple-200 text-xs md:text-sm"
                            >
                              <span className="truncate max-w-[150px] md:max-w-none">{email}</span>
                              <button
                                type="button"
                                onClick={() => removeAllowedEmail(email)}
                                className="mr-1 hover:text-red-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Info Box */}
                    <div className="bg-purple-100/50 border border-purple-200 rounded-lg p-3 md:p-4">
                      <p className="text-xs md:text-sm text-purple-800 flex items-start gap-2">
                        <span className="text-purple-600 text-base md:text-lg">ℹ️</span>
                        <span>
                          فقط الأشخاص في هذه القائمة سيتمكنون من الوصول للوثيقة والتوقيع عليها.
                          سيُطلب منهم تسجيل الدخول بنفس البريد الإلكتروني.
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Signature Display Mode */}
        <Card className="p-4 md:p-6">
          <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
            <div className="p-1.5 md:p-2 rounded-lg bg-teal-100">
              <FileText className="w-4 h-4 md:w-5 md:h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold text-gray-900">طريقة التوقيع</h3>
              <p className="text-xs md:text-sm text-gray-600">اختر كيف سيوقع المشارك على الوثيقة</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {/* Option 1: Inside PDF */}
            <div
              onClick={() => setSignatureDisplayMode("inside")}
              className={cn(
                "relative p-4 md:p-5 rounded-xl border-2 cursor-pointer transition-all",
                signatureDisplayMode === "inside"
                  ? "border-teal-500 bg-teal-50/50 shadow-md"
                  : "border-gray-200 hover:border-teal-300 hover:bg-gray-50"
              )}
            >
              {signatureDisplayMode === "inside" && (
                <div className="absolute top-2 md:top-3 left-2 md:left-3">
                  <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-teal-600" />
                </div>
              )}
              <div className="flex flex-col items-center text-center">
                <div className={cn(
                  "w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center mb-3 md:mb-4",
                  signatureDisplayMode === "inside" ? "bg-teal-100" : "bg-gray-100"
                )}>
                  <svg className={cn("w-6 h-6 md:w-8 md:h-8", signatureDisplayMode === "inside" ? "text-teal-600" : "text-gray-500")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M7 15l3-3 2 2 5-5" />
                    <rect x="12" y="14" width="6" height="4" rx="1" strokeDasharray="2 1" />
                  </svg>
                </div>
                <h4 className={cn("font-bold mb-1 md:mb-2 text-sm md:text-base", signatureDisplayMode === "inside" ? "text-teal-900" : "text-gray-800")}>
                  التوقيع داخل الوثيقة
                </h4>
                <p className="text-xs md:text-sm text-gray-600">
                  المشارك ينقر على مكان التوقيع المحدد داخل الـ PDF ويوقع مباشرة
                </p>
              </div>
            </div>

            {/* Option 2: Outside PDF */}
            <div
              onClick={() => setSignatureDisplayMode("outside")}
              className={cn(
                "relative p-4 md:p-5 rounded-xl border-2 cursor-pointer transition-all",
                signatureDisplayMode === "outside"
                  ? "border-teal-500 bg-teal-50/50 shadow-md"
                  : "border-gray-200 hover:border-teal-300 hover:bg-gray-50"
              )}
            >
              {signatureDisplayMode === "outside" && (
                <div className="absolute top-2 md:top-3 left-2 md:left-3">
                  <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-teal-600" />
                </div>
              )}
              <div className="flex flex-col items-center text-center">
                <div className={cn(
                  "w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center mb-3 md:mb-4",
                  signatureDisplayMode === "outside" ? "bg-teal-100" : "bg-gray-100"
                )}>
                  <svg className={cn("w-6 h-6 md:w-8 md:h-8", signatureDisplayMode === "outside" ? "text-teal-600" : "text-gray-500")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="2" width="18" height="14" rx="2" />
                    <path d="M7 9l3-3 2 2 5-5" />
                    <rect x="3" y="18" width="18" height="4" rx="1" />
                    <path d="M7 20h10" strokeDasharray="2 1" />
                  </svg>
                </div>
                <h4 className={cn("font-bold mb-1 md:mb-2 text-sm md:text-base", signatureDisplayMode === "outside" ? "text-teal-900" : "text-gray-800")}>
                  التوقيع خارج الوثيقة
                </h4>
                <p className="text-xs md:text-sm text-gray-600">
                  المشارك يقرأ الوثيقة ثم يوقع في خانة منفصلة أسفلها
                </p>
              </div>
            </div>
          </div>

          {/* Info based on selection */}
          <div className={cn(
            signatureDisplayMode === "inside"
              ? "bg-teal-50 border border-teal-200"
              : "bg-blue-50 border border-blue-200"
          )}>
            <p className={cn(
              "text-xs md:text-sm flex items-start gap-2",
              signatureDisplayMode === "inside" ? "text-teal-800" : "text-blue-800"
            )}>
              <span className="text-base md:text-lg">💡</span>
              <span>
                {signatureDisplayMode === "inside"
                  ? "التوقيع سيظهر في المكان المحدد داخل الوثيقة. مناسب للعقود والوثائق الرسمية."
                  : "المشارك سيرى الوثيقة كاملة للقراءة، ثم يوقع في خانة منفصلة. مناسب للإقرارات والموافقات."
                }
              </span>
            </p>
          </div>
        </Card>
      </div>

      {/* Mobile: Fixed Bottom Bar */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-3 z-30">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isCreating}
              className="flex-shrink-0"
            >
              السابق
            </Button>
            <Button
              onClick={handleCreateEvent}
              disabled={isCreating}
              className="flex-1 bg-teal-600 hover:bg-teal-700 h-11"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                  إنشاء الحدث
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Auth Warning Dialog - Responsive */}
      <AlertDialog open={showAuthWarning} onOpenChange={setShowAuthWarning}>
        <AlertDialogContent className="w-[95vw] max-w-lg bg-white mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-orange-600 text-lg md:text-xl">
              <AlertTriangle className="w-5 h-5 md:w-6 md:h-6" />
              تحذير: إلغاء تسجيل الدخول
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 md:space-y-4 text-sm md:text-base text-gray-700" asChild>
              <div>
                <p className="font-semibold text-gray-900">
                  إلغاء تسجيل الدخول للتوقيع قد يؤدي إلى:
                </p>
                <ul className="list-disc pr-5 md:pr-6 space-y-1.5 md:space-y-2 text-gray-700 text-sm">
                  <li>عدم القدرة على التحقق من هوية الموقّع</li>
                  <li>صعوبة تتبع التوقيعات</li>
                  <li>مشاكل قانونية محتملة في صحة التوقيع</li>
                </ul>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 md:p-4">
                  <p className="font-semibold text-orange-700 flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    توصية
                  </p>
                  <p className="text-xs md:text-sm text-orange-800 mt-1">
                    من الأفضل الإبقاء على تسجيل الدخول مفعّلاً لضمان صحة التوقيعات وتتبعها.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 text-gray-900 w-full sm:w-auto">
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setRequireLogin(false);
                setIsPrivate(false);
                setShowAuthWarning(false);
              }}
              className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto"
            >
              إلغاء تسجيل الدخول
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Private Event Confirmation Dialog - Responsive */}
      <AlertDialog open={showPrivateDialog} onOpenChange={setShowPrivateDialog}>
        <AlertDialogContent className="w-[95vw] max-w-lg bg-white mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-purple-600 text-lg md:text-xl">
              <Shield className="w-5 h-5 md:w-6 md:h-6" />
              تفعيل الحدث الخاص
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 md:space-y-4 text-sm md:text-base text-gray-700" asChild>
              <div>
                <p className="font-semibold text-gray-900">
                  لتفعيل الحدث الخاص:
                </p>
                <ul className="list-disc pr-5 md:pr-6 space-y-1.5 md:space-y-2 text-gray-700 text-sm">
                  <li>سيتم تفعيل <span className="font-semibold text-gray-900">&quot;يتطلب تسجيل دخول&quot;</span> تلقائياً</li>
                  <li>فقط الأشخاص في قائمة المسموح لهم سيتمكنون من التوقيع</li>
                  <li>سيُطلب من الموقّعين إدخال بريدهم للتحقق</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 text-gray-900 w-full sm:w-auto">
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmEnablePrivate}
              className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
            >
              تفعيل الحدث الخاص
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Contacts Selection Dialog - Responsive */}
      <Dialog open={showContactsDialog} onOpenChange={setShowContactsDialog}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] md:max-h-[80vh] !flex !flex-col overflow-hidden mx-auto">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-lg md:text-xl">اختر من جهات الاتصال</DialogTitle>
            <p className="text-xs md:text-sm text-gray-600 mt-1 md:mt-2">
              اختر جهات الاتصال أو المجموعات لإضافتهم للموقّعين المسموح لهم
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3 md:space-y-4 min-h-0">
            {/* Tabs */}
            <div className="flex gap-1 md:gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setActiveTab("contacts")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1 md:gap-2 py-2 px-2 md:px-4 rounded-md text-xs md:text-sm font-medium transition-all",
                  activeTab === "contacts"
                    ? "bg-white text-purple-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <UserPlus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline">جهات الاتصال</span>
                <span className="sm:hidden">جهات</span>
                {selectedContactIds.length > 0 && (
                  <span className="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {selectedContactIds.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("groups")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1 md:gap-2 py-2 px-2 md:px-4 rounded-md text-xs md:text-sm font-medium transition-all",
                  activeTab === "groups"
                    ? "bg-white text-purple-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <Users className="w-3.5 h-3.5 md:w-4 md:h-4" />
                المجموعات
                {selectedGroupIds.length > 0 && (
                  <span className="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {selectedGroupIds.length}
                  </span>
                )}
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
              <Input
                placeholder={`ابحث عن ${activeTab === "contacts" ? "جهة اتصال" : "مجموعة"}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 text-sm"
              />
            </div>

            {/* List */}
            <ScrollArea className="h-[200px] md:h-[300px] border rounded-lg">
              <div className="p-2 md:p-4 space-y-2">
                {activeTab === "contacts" ? (
                  filteredContacts.length > 0 ? (
                    filteredContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={cn(
                          "flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-50",
                          selectedContactIds.includes(contact.id)
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200"
                        )}
                        onClick={() => toggleContactSelection(contact)}
                      >
                        <Checkbox
                          checked={selectedContactIds.includes(contact.id)}
                          onCheckedChange={() => toggleContactSelection(contact)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm md:text-base truncate">{contact.name}</p>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1">
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{contact.email}</span>
                            </span>
                            {contact.phone && (
                              <span className="hidden sm:flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {contact.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 md:py-12">
                      <Users className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
                      <p className="text-gray-500 text-sm">لا توجد جهات اتصال</p>
                    </div>
                  )
                ) : filteredGroups.length > 0 ? (
                  filteredGroups.map((group) => (
                    <div
                      key={group.id}
                      className={cn(
                        "flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-50",
                        selectedGroupIds.includes(group.id)
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200"
                      )}
                      onClick={() => toggleGroupSelection(group)}
                    >
                      <Checkbox
                        checked={selectedGroupIds.includes(group.id)}
                        onCheckedChange={() => toggleGroupSelection(group)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div
                        className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm md:text-base flex-shrink-0"
                        style={{ backgroundColor: group.color }}
                      >
                        {group.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm md:text-base truncate">{group.name}</p>
                        <p className="text-xs md:text-sm text-gray-600 truncate">
                          {group.contactIds.length} عضو
                          {group.description && ` • ${group.description}`}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 md:py-12">
                    <Users className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
                    <p className="text-gray-500 text-sm">لا توجد مجموعات</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Summary */}
            {(selectedContactIds.length > 0 || selectedGroupIds.length > 0) && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-purple-900 text-sm md:text-base">
                      تم اختيار {selectedContactIds.length + selectedGroupIds.length} عنصر
                    </p>
                    <p className="text-xs md:text-sm text-purple-700">
                      {selectedContactIds.length > 0 && `${selectedContactIds.length} جهة اتصال`}
                      {selectedContactIds.length > 0 && selectedGroupIds.length > 0 && " • "}
                      {selectedGroupIds.length > 0 && `${selectedGroupIds.length} مجموعة`}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-shrink-0 border-t pt-3 md:pt-4 flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowContactsDialog(false);
                setSelectedContactIds([]);
                setSelectedGroupIds([]);
                setSearchQuery("");
              }}
              className="w-full sm:w-auto"
            >
              إلغاء
            </Button>
            {(selectedContactIds.length > 0 || selectedGroupIds.length > 0) && (
              <Button onClick={handleAddFromContacts} className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto">
                <Plus className="w-4 h-4 ml-2" />
                إضافة للقائمة
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

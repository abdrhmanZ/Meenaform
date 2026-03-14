"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Share2,
    Link2,
    Mail,
    Trash2,
    Plus,
    Copy,
    Check,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { eventsService } from "@/lib/api/services";
import { Event } from "@/types/event";

interface ShareResultsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    event: Event;
    onUpdated?: () => void;
}

export default function ShareResultsDialog({
    open,
    onOpenChange,
    event,
    onUpdated,
}: ShareResultsDialogProps) {
    const [isEnabled, setIsEnabled] = useState(false);
    const [emails, setEmails] = useState<string[]>([]);
    const [newEmail, setNewEmail] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [emailError, setEmailError] = useState("");
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState("");
    // token محلي يتحدث مباشرة بعد الحفظ بدون انتظار refetch
    const [localToken, setLocalToken] = useState<string | null>(null);

    useEffect(() => {
        if (open && event) {
            setIsEnabled(event.settings?.isResultsShared || false);
            setEmails(event.settings?.resultsSharedEmails || []);
            setLocalToken(event.settings?.resultsShareToken || null);
            setSaveError("");
            setSaveSuccess(false);
        }
    }, [open, event]);

    const shareLink = localToken
        ? `${typeof window !== "undefined" ? window.location.origin : ""}/results/shared/${localToken}`
        : "";

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const addEmail = () => {
        const email = newEmail.trim().toLowerCase();
        setEmailError("");

        if (!email) return;

        if (!validateEmail(email)) {
            setEmailError("البريد الإلكتروني غير صالح");
            return;
        }

        if (emails.includes(email)) {
            setEmailError("هذا البريد مضاف بالفعل");
            return;
        }

        setEmails([...emails, email]);
        setNewEmail("");
    };

    const removeEmail = (emailToRemove: string) => {
        setEmails(emails.filter((e) => e !== emailToRemove));
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addEmail();
        }
    };

    const copyLink = async () => {
        if (shareLink) {
            await navigator.clipboard.writeText(shareLink);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const handleSave = async () => {
        setSaveError("");
        setSaveSuccess(false);

        // تحقق: لا يمكن تفعيل المشاركة بدون إيميلات
        if (isEnabled && emails.length === 0) {
            setSaveError("يجب إضافة إيميل واحد على الأقل قبل تفعيل المشاركة");
            return;
        }

        setIsSaving(true);
        try {
            const returnedToken = await eventsService.updateResultsSharing(event.id, {
                isEnabled,
                allowedEmails: emails,
                permissions: { allowExport: false, allowDraw: false },
            });

            // تحديث الـ token المحلي فوراً → الرابط يظهر بدون تأخير
            if (returnedToken) {
                setLocalToken(returnedToken);
            }

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);

            // تحديث الحدث في الخلفية
            onUpdated?.();
        } catch (error: any) {
            setSaveError(error.message || "فشل حفظ إعدادات المشاركة. حاول مرة أخرى.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader className="sr-only">
                    <DialogTitle>مشاركة النتائج</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-2">
                    {/* تفعيل/إيقاف المشاركة */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Link2 className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <Label className="font-semibold text-gray-900">تفعيل المشاركة</Label>
                                <p className="text-xs text-gray-500 mt-0.5">السماح للآخرين بعرض نتائج هذا الحدث</p>
                            </div>
                        </div>
                        <Checkbox checked={isEnabled} onCheckedChange={(v) => setIsEnabled(!!v)} />
                    </div>

                    {isEnabled && (
                        <>
                            {/* رابط المشاركة */}
                            {shareLink ? (
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">رابط المشاركة</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={shareLink}
                                            readOnly
                                            className="text-sm bg-gray-50 text-gray-600 font-mono text-xs"
                                            dir="ltr"
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={copyLink}
                                            className="shrink-0 gap-1.5"
                                        >
                                            {isCopied ? (
                                                <>
                                                    <Check className="w-3.5 h-3.5 text-green-600" />
                                                    <span className="text-green-600">تم</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-3.5 h-3.5" />
                                                    نسخ
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-sm text-blue-700">
                                    سيتم توليد رابط المشاركة تلقائياً بعد الحفظ
                                </div>
                            )}


                            {/* الإيميلات المسموح لها */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-500" />
                                    <Label className="text-sm font-semibold text-gray-900">الإيميلات المسموح لها</Label>
                                </div>

                                <div className="flex gap-2">
                                    <Input
                                        type="email"
                                        placeholder="أدخل البريد الإلكتروني..."
                                        value={newEmail}
                                        onChange={(e) => {
                                            setNewEmail(e.target.value);
                                            setEmailError("");
                                        }}
                                        onKeyDown={handleKeyPress}
                                        className="text-sm"
                                        dir="ltr"
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={addEmail}
                                        className="shrink-0 gap-1"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        إضافة
                                    </Button>
                                </div>

                                {emailError && (
                                    <p className="text-xs text-red-500 pr-1">{emailError}</p>
                                )}

                                {emails.length > 0 && (
                                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                        {emails.map((email) => (
                                            <div
                                                key={email}
                                                className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 group hover:border-red-200 transition-colors"
                                            >
                                                <span className="text-sm text-gray-700 font-mono" dir="ltr">
                                                    {email}
                                                </span>
                                                <button
                                                    onClick={() => removeEmail(email)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {emails.length === 0 && (
                                    <p className="text-xs text-gray-400 pr-1">
                                        لم يتم إضافة أي إيميل بعد. أضف إيميلاً واحداً على الأقل.
                                    </p>
                                )}
                            </div>
                        </>
                    )}

                    {/* رسالة خطأ */}
                    {saveError && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                            <p className="text-sm text-red-600">{saveError}</p>
                        </div>
                    )}

                    {/* زر الحفظ */}
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full gap-2"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                جاري الحفظ...
                            </>
                        ) : saveSuccess ? (
                            <>
                                <Check className="w-4 h-4" />
                                تم الحفظ بنجاح
                            </>
                        ) : (
                            "حفظ إعدادات المشاركة"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

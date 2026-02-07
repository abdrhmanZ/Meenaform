"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, Mail, AlertCircle } from "lucide-react";
import { SignatureField, SigningMode } from "@/types/document-signing";

interface SignatureFieldSettingsProps {
  open: boolean;
  onClose: () => void;
  field: SignatureField | null;
  onSave: (updates: Partial<SignatureField>) => void;
  signingMode?: SigningMode;
}

export default function SignatureFieldSettings({
  open,
  onClose,
  field,
  onSave,
  signingMode = "single",
}: SignatureFieldSettingsProps) {
  const [label, setLabel] = useState("");
  const [isRequired, setIsRequired] = useState(true);
  const [assignedEmail, setAssignedEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    if (field) {
      setLabel(field.label);
      setIsRequired(field.isRequired);
      setAssignedEmail(field.assignedEmail || "");
      setEmailError("");
    }
  }, [field]);

  // التحقق من صحة الإيميل
  const validateEmail = (email: string): boolean => {
    if (!email) return true; // فارغ مسموح في single mode
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSave = () => {
    if (!label.trim()) {
      return;
    }

    // في وضع multi-signer، الإيميل إجباري
    if (signingMode === "multi") {
      if (!assignedEmail.trim()) {
        setEmailError("الإيميل مطلوب في وضع التوقيع المتعدد");
        return;
      }
      if (!validateEmail(assignedEmail)) {
        setEmailError("الرجاء إدخال إيميل صحيح");
        return;
      }
    }

    onSave({
      label: label.trim(),
      fieldType: "signature",
      isRequired,
      includeDate: false,
      includeName: false,
      assignedEmail: signingMode === "multi" ? assignedEmail.trim().toLowerCase() : undefined,
    });

    onClose();
  };

  if (!field) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-600" />
            إعدادات الحقل
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Field Label */}
          <div className="space-y-2">
            <Label htmlFor="fieldLabel">عنوان الحقل *</Label>
            <Input
              id="fieldLabel"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="مثال: توقيع الموظف"
              className="text-right"
            />
          </div>

          {/* Assigned Email - Only in multi-signer mode */}
          {signingMode === "multi" && (
            <div className="space-y-2">
              <Label htmlFor="assignedEmail" className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-purple-600" />
                إيميل الموقّع *
              </Label>
              <Input
                id="assignedEmail"
                type="email"
                value={assignedEmail}
                onChange={(e) => {
                  setAssignedEmail(e.target.value);
                  setEmailError("");
                }}
                placeholder="example@email.com"
                className={`text-left ${emailError ? "border-red-500" : ""}`}
                dir="ltr"
              />
              {emailError && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {emailError}
                </p>
              )}
              <p className="text-xs text-gray-500">
                هذا الحقل سيظهر فقط للموقّع صاحب هذا الإيميل
              </p>
            </div>
          )}

          {/* Required Checkbox */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border">
            <Checkbox
              id="required"
              checked={isRequired}
              onCheckedChange={(checked) => setIsRequired(checked === true)}
              className="data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500 h-5 w-5"
            />
            <Label htmlFor="required" className="cursor-pointer font-medium">
              حقل إجباري
            </Label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button
            onClick={handleSave}
            disabled={!label.trim() || (signingMode === "multi" && !assignedEmail.trim())}
            className="bg-teal-600 hover:bg-teal-700"
          >
            حفظ التغييرات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


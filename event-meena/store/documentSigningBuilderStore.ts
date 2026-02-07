/**
 * Zustand Store لبناء حدث توقيع الوثيقة
 * يحفظ البيانات بين صفحة البناء وصفحة الإعدادات
 */

import { create } from "zustand";
import { SignatureField, SignatureDisplayMode, SigningMode } from "@/types/document-signing";

interface DocumentSigningBuilderState {
  // الخطوة الحالية (1 = بناء الوثيقة، 2 = الإعدادات)
  currentStep: 1 | 2;

  // نوع التوقيع (single = موقّع واحد، multi = أكثر من موقّع)
  signingMode: SigningMode;

  // بيانات الوثيقة (الخطوة 1)
  title: string;
  description: string;
  documentUrl: string;
  documentFileName: string;
  fields: SignatureField[];

  // إعدادات الوصول (الخطوة 2)
  requireLogin: boolean;
  isPrivate: boolean;
  allowedEmails: string[];

  // إعدادات التوقيع (الخطوة 2)
  allowDownloadAfterSigning: boolean;
  sendCopyToSigner: boolean;

  // طريقة عرض التوقيع للمشارك
  signatureDisplayMode: SignatureDisplayMode;

  // حالة الإكمال
  isStep1Complete: boolean;

  // وظائف التنقل
  nextStep: () => void;
  previousStep: () => void;
  setCurrentStep: (step: 1 | 2) => void;

  // وظائف نوع التوقيع
  setSigningMode: (mode: SigningMode) => void;

  // وظائف الخطوة 1 (بيانات الوثيقة)
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setDocumentUrl: (url: string) => void;
  setDocumentFileName: (fileName: string) => void;
  setFields: (fields: SignatureField[]) => void;
  setStep1Data: (data: {
    title: string;
    description: string;
    documentUrl: string;
    documentFileName: string;
    fields: SignatureField[];
  }) => void;

  // وظائف الخطوة 2 (الإعدادات)
  setRequireLogin: (value: boolean) => void;
  setIsPrivate: (value: boolean) => void;
  setAllowedEmails: (emails: string[]) => void;
  addAllowedEmail: (email: string) => void;
  removeAllowedEmail: (email: string) => void;
  setAllowDownloadAfterSigning: (value: boolean) => void;
  setSendCopyToSigner: (value: boolean) => void;
  setSignatureDisplayMode: (mode: SignatureDisplayMode) => void;

  // التحقق من الإكمال
  validateStep1: () => boolean;

  // إعادة التعيين
  reset: () => void;
}

const initialState = {
  currentStep: 1 as const,
  signingMode: "single" as SigningMode,
  title: "",
  description: "",
  documentUrl: "",
  documentFileName: "",
  fields: [] as SignatureField[],
  requireLogin: true,
  isPrivate: true,
  allowedEmails: [] as string[],
  allowDownloadAfterSigning: true,
  sendCopyToSigner: true,
  signatureDisplayMode: "inside" as SignatureDisplayMode,
  isStep1Complete: false,
};

export const useDocumentSigningBuilderStore = create<DocumentSigningBuilderState>((set, get) => ({
  ...initialState,

  // التنقل
  nextStep: () => {
    const state = get();
    if (state.currentStep === 1 && state.validateStep1()) {
      set({ currentStep: 2, isStep1Complete: true });
    }
  },

  previousStep: () => {
    set({ currentStep: 1 });
  },

  setCurrentStep: (step) => set({ currentStep: step }),

  // نوع التوقيع
  setSigningMode: (mode) => set({ signingMode: mode }),

  // بيانات الوثيقة
  setTitle: (title) => set({ title }),
  setDescription: (description) => set({ description }),
  setDocumentUrl: (url) => set({ documentUrl: url }),
  setDocumentFileName: (fileName) => set({ documentFileName: fileName }),
  setFields: (fields) => set({ fields }),

  setStep1Data: (data) => set({
    title: data.title,
    description: data.description,
    documentUrl: data.documentUrl,
    documentFileName: data.documentFileName,
    fields: data.fields,
    isStep1Complete: true,
  }),

  // الإعدادات
  setRequireLogin: (value) => {
    set({ requireLogin: value });
    // إذا تم إلغاء تسجيل الدخول، يجب إلغاء الحدث الخاص أيضاً
    if (!value) {
      set({ isPrivate: false });
    }
  },

  setIsPrivate: (value) => {
    set({ isPrivate: value });
    // إذا تم تفعيل الحدث الخاص، يجب تفعيل تسجيل الدخول
    if (value) {
      set({ requireLogin: true });
    }
  },

  setAllowedEmails: (emails) => set({ allowedEmails: emails }),

  addAllowedEmail: (email) => {
    const { allowedEmails } = get();
    if (!allowedEmails.includes(email.toLowerCase())) {
      set({ allowedEmails: [...allowedEmails, email.toLowerCase()] });
    }
  },

  removeAllowedEmail: (email) => {
    const { allowedEmails } = get();
    set({ allowedEmails: allowedEmails.filter((e) => e !== email) });
  },

  setAllowDownloadAfterSigning: (value) => set({ allowDownloadAfterSigning: value }),
  setSendCopyToSigner: (value) => set({ sendCopyToSigner: value }),
  setSignatureDisplayMode: (mode) => set({ signatureDisplayMode: mode }),

  // التحقق
  validateStep1: () => {
    const { title, documentUrl } = get();
    return title.trim() !== "" && documentUrl !== "";
  },

  // إعادة التعيين
  reset: () => set(initialState),
}));


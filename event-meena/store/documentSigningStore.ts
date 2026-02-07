/**
 * Zustand Store لإدارة توقيع الوثائق
 * مربوط بـ Backend API
 */

import { create } from "zustand";
import {
  DocumentSigningState,
  DocumentSigningEvent,
  SignatureField,
  DocumentSignature,
  CreateSignatureFieldRequest,
  UpdateSignatureFieldRequest,
  SubmitSignatureRequest,
  SubmitAllSignaturesRequest,
} from "@/types/document-signing";
import { documentSigningService } from "@/lib/api/services/documentSigningService";

// الحالة الافتراضية
const initialState = {
  currentEvent: null as DocumentSigningEvent | null,
  signatureFields: [] as SignatureField[],
  signatures: [] as DocumentSignature[],
  isLoading: false,
  isSubmitting: false,
  error: null as string | null,
  currentPage: 1,
  totalPages: 1,
  scale: 1.0,
  selectedFieldId: null as string | null,
};

export const useDocumentSigningStore = create<DocumentSigningState>((set, get) => ({
  ...initialState,

  // جلب حدث توقيع بواسطة ID
  fetchDocumentEvent: async (eventId: string) => {
    set({ isLoading: true, error: null });
    try {
      const event = await documentSigningService.getDocumentEvent(eventId);
      set({
        currentEvent: event,
        signatureFields: event.signatureFields || [],
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ أثناء جلب الحدث";
      set({ error: errorMessage, isLoading: false });
    }
  },

  // جلب حدث توقيع برمز المشاركة (للمشاركين)
  fetchDocumentEventByShareCode: async (shareCode: string) => {
    set({ isLoading: true, error: null });
    try {
      const event = await documentSigningService.getDocumentEventByShareCode(shareCode);
      set({
        currentEvent: event,
        signatureFields: event.signatureFields || [],
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ أثناء جلب الحدث";
      set({ error: errorMessage, isLoading: false });
    }
  },

  // إضافة حقل توقيع
  addSignatureField: async (eventId: string, field: CreateSignatureFieldRequest) => {
    set({ isLoading: true, error: null });
    try {
      const newField = await documentSigningService.addSignatureField(eventId, field);
      set((state) => ({
        signatureFields: [...state.signatureFields, newField],
        isLoading: false,
      }));
      return newField;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "فشل إضافة حقل التوقيع";
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  // تحديث حقل توقيع
  updateSignatureField: async (fieldId: string, data: UpdateSignatureFieldRequest) => {
    set({ isLoading: true, error: null });
    try {
      const updatedField = await documentSigningService.updateSignatureField(fieldId, data);
      set((state) => ({
        signatureFields: state.signatureFields.map((f) =>
          f.id === fieldId ? updatedField : f
        ),
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "فشل تحديث حقل التوقيع";
      set({ error: errorMessage, isLoading: false });
    }
  },

  // حذف حقل توقيع
  deleteSignatureField: async (fieldId: string) => {
    set({ isLoading: true, error: null });
    try {
      await documentSigningService.deleteSignatureField(fieldId);
      set((state) => ({
        signatureFields: state.signatureFields.filter((f) => f.id !== fieldId),
        selectedFieldId: state.selectedFieldId === fieldId ? null : state.selectedFieldId,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "فشل حذف حقل التوقيع";
      set({ error: errorMessage, isLoading: false });
    }
  },

  // إرسال توقيع واحد
  submitSignature: async (responseId: string, request: SubmitSignatureRequest) => {
    set({ isSubmitting: true, error: null });
    try {
      const signature = await documentSigningService.submitSignature(responseId, request);
      set((state) => ({
        signatures: [...state.signatures, signature],
        isSubmitting: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "فشل إرسال التوقيع";
      set({ error: errorMessage, isSubmitting: false });
      throw error;
    }
  },

  // إرسال جميع التوقيعات
  submitAllSignatures: async (request: SubmitAllSignaturesRequest) => {
    set({ isSubmitting: true, error: null });
    try {
      const signatures = await documentSigningService.submitAllSignatures(request);
      set((state) => ({
        signatures: [...state.signatures, ...signatures],
        isSubmitting: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "فشل إرسال التوقيعات";
      set({ error: errorMessage, isSubmitting: false });
      throw error;
    }
  },

  // PDF Navigation
  setCurrentPage: (page: number) => set({ currentPage: page }),
  setTotalPages: (total: number) => set({ totalPages: total }),
  setScale: (scale: number) => set({ scale }),

  // تحديد حقل
  selectField: (fieldId: string | null) => set({ selectedFieldId: fieldId }),

  // مسح الحالة
  reset: () => set(initialState),
}));

export default useDocumentSigningStore;


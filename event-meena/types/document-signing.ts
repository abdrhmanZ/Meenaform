// types/document-signing.ts
// تعريفات TypeScript لتوقيع الوثائق (Document Signing)

import { Event, EventSettings } from "./event";

/**
 * نوع حقل التوقيع
 */
export type SignatureFieldType =
  | "signature"     // توقيع
  | "initials"      // أحرف أولى
  | "date"          // تاريخ
  | "text"          // نص
  | "checkbox";     // موافقة

/**
 * طريقة عرض التوقيع للمشارك
 */
export type SignatureDisplayMode =
  | "inside"   // التوقيع داخل الـ PDF (الوضع الحالي)
  | "outside"; // التوقيع خارج الـ PDF (في خانة منفصلة أسفله)

/**
 * نوع التوقيع
 */
export type SigningMode =
  | "single"   // موقّع واحد (النظام الحالي)
  | "multi";   // أكثر من موقّع (كل حقل مخصص لإيميل معين)

/**
 * حقل التوقيع - موقع التوقيع على الوثيقة
 */
export interface SignatureField {
  id: string;
  eventId: string;
  
  // معلومات الحقل
  label: string;
  fieldType: SignatureFieldType;
  
  // الموقع على الصفحة (نسبة مئوية 0-100)
  pageNumber: number;
  positionX: number;  // من اليسار
  positionY: number;  // من الأعلى
  width: number;
  height: number;
  
  // الإعدادات
  isRequired: boolean;
  order: number;
  
  // حقول إضافية
  includeDate: boolean;   // إضافة التاريخ تلقائياً
  includeName: boolean;   // إضافة الاسم تلقائياً

  // إيميل الموقّع المخصص (يُستخدم فقط في وضع multi-signer)
  assignedEmail?: string;

  // التواريخ
  createdAt: string;
  updatedAt: string;
}

/**
 * التوقيع الفعلي - توقيع المشارك
 */
export interface DocumentSignature {
  id: string;
  signatureFieldId: string;
  responseId: string;
  
  // معلومات الموقّع
  signerName: string;
  signerEmail: string;
  signerPhone?: string;
  
  // بيانات التوقيع (Base64)
  signatureData: string;
  
  // معلومات التوقيع
  signedAt: string;
  ipAddress?: string;
  userAgent?: string;
  
  // معلومات إضافية من الحقل
  fieldLabel?: string;
  pageNumber?: number;
}

/**
 * حدث توقيع الوثيقة مع الحقول
 */
export interface DocumentSigningEvent extends Event {
  // معلومات الوثيقة
  documentUrl: string;
  documentFileName: string;

  // حقول التوقيع
  signatureFields: SignatureField[];

  // إعدادات خاصة بتوقيع الوثائق
  allowDownloadAfterSigning: boolean;
  sendCopyToSigner: boolean;

  // طريقة عرض التوقيع للمشارك
  signatureDisplayMode: SignatureDisplayMode;

  // نوع التوقيع: single = موقّع واحد، multi = أكثر من موقّع
  signingMode: SigningMode;
}

/**
 * DTO لإنشاء حدث توقيع
 */
export interface CreateDocumentEventRequest {
  title: string;
  description?: string;
  allowDownloadAfterSigning?: boolean;
  sendCopyToSigner?: boolean;
  settings?: Partial<EventSettings>;
}

/**
 * DTO لإنشاء حدث توقيع مع URL الوثيقة (بعد رفعها مسبقاً)
 */
export interface CreateDocumentEventWithUrlRequest {
  title: string;
  description?: string;
  documentUrl: string;
  documentFileName: string;
  signatureFields: CreateSignatureFieldRequest[];
  // إعدادات الوصول (مفعّلة تلقائياً للتوقيعات)
  requireLogin?: boolean;
  isPrivate?: boolean;
  allowedEmails?: string[];
  // إعدادات التوقيع
  allowDownloadAfterSigning?: boolean;
  sendCopyToSigner?: boolean;
  // طريقة عرض التوقيع للمشارك
  signatureDisplayMode?: SignatureDisplayMode;
  // نوع التوقيع
  signingMode?: SigningMode;
}

/**
 * DTO لتحديث حدث توقيع
 */
export interface UpdateDocumentEventRequest {
  title: string;
  description?: string;
  coverImage?: string;
  themeColor?: string;
  language?: string;
  startDate?: string;
  endDate?: string;
  requireLogin?: boolean;
  allowAnonymous?: boolean;
  maxResponses?: number;
  allowMultipleResponses?: boolean;
  isPrivate?: boolean;
  allowedEmails?: string[];
  allowDownloadAfterSigning?: boolean;
  sendCopyToSigner?: boolean;
  thankYouMessage?: string;
  signatureDisplayMode?: "inside" | "outside";
  signingMode?: SigningMode;
  signatureFields: {
    id?: string;
    label: string;
    pageNumber: number;
    positionX: number;
    positionY: number;
    width: number;
    height: number;
    isRequired: boolean;
    order: number;
    fieldType: string;
    includeDate: boolean;
    includeName: boolean;
    assignedEmail?: string;
  }[];
}

/**
 * DTO لإنشاء حقل توقيع
 */
export interface CreateSignatureFieldRequest {
  label: string;
  fieldType?: SignatureFieldType;
  pageNumber: number;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  isRequired?: boolean;
  order?: number;
  includeDate?: boolean;
  includeName?: boolean;
  // إيميل الموقّع المخصص (يُستخدم فقط في وضع multi-signer)
  assignedEmail?: string;
}

/**
 * DTO لتحديث حقل توقيع
 */
export interface UpdateSignatureFieldRequest {
  label?: string;
  fieldType?: SignatureFieldType;
  pageNumber?: number;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  isRequired?: boolean;
  order?: number;
  includeDate?: boolean;
  includeName?: boolean;
}

/**
 * DTO لإرسال توقيع واحد
 */
export interface SubmitSignatureRequest {
  signatureFieldId: string;
  signerName: string;
  signerEmail: string;
  signerPhone?: string;
  signatureData: string;
}

/**
 * DTO لإرسال جميع التوقيعات
 */
export interface SubmitAllSignaturesRequest {
  eventId: string;
  responseId?: string;
  signerName: string;
  signerEmail?: string;
  signerPhone?: string;
  signatures: SignatureDataItem[];
}

/**
 * عنصر توقيع فردي
 */
export interface SignatureDataItem {
  fieldId: string;
  signatureData?: string;
  textValue?: string;
  checked?: boolean;
}

/**
 * حالة Store توقيع الوثائق
 */
export interface DocumentSigningState {
  // الحدث الحالي
  currentEvent: DocumentSigningEvent | null;

  // حقول التوقيع
  signatureFields: SignatureField[];

  // التوقيعات
  signatures: DocumentSignature[];

  // حالة التحميل
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  // PDF Viewer State
  currentPage: number;
  totalPages: number;
  scale: number;

  // الحقل المحدد للتعديل
  selectedFieldId: string | null;

  // الوظائف
  fetchDocumentEvent: (eventId: string) => Promise<void>;
  fetchDocumentEventByShareCode: (shareCode: string) => Promise<void>;

  // إدارة حقول التوقيع
  addSignatureField: (eventId: string, field: CreateSignatureFieldRequest) => Promise<SignatureField | null>;
  updateSignatureField: (fieldId: string, data: UpdateSignatureFieldRequest) => Promise<void>;
  deleteSignatureField: (fieldId: string) => Promise<void>;

  // إرسال التوقيعات
  submitSignature: (responseId: string, request: SubmitSignatureRequest) => Promise<void>;
  submitAllSignatures: (request: SubmitAllSignaturesRequest) => Promise<void>;

  // PDF Navigation
  setCurrentPage: (page: number) => void;
  setTotalPages: (total: number) => void;
  setScale: (scale: number) => void;

  // تحديد حقل
  selectField: (fieldId: string | null) => void;

  // مسح الحالة
  reset: () => void;
}


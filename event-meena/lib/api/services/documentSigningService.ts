/**
 * Document Signing Service - خدمة توقيع الوثائق
 * الاتصال بـ Backend API لتوقيع الوثائق
 */

import { apiClient, ApiResponse } from "../client";
import {
  DocumentSigningEvent,
  SignatureField,
  DocumentSignature,
  CreateDocumentEventRequest,
  CreateDocumentEventWithUrlRequest,
  UpdateDocumentEventRequest,
  CreateSignatureFieldRequest,
  UpdateSignatureFieldRequest,
  SubmitSignatureRequest,
  SubmitAllSignaturesRequest,
} from "@/types/document-signing";

// ============================================================
// Backend DTOs
// ============================================================

interface BackendSignatureFieldDto {
  id: string;
  eventId: string;
  label: string;
  pageNumber: number;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  isRequired: boolean;
  order: number;
  fieldType: number; // 1=Signature, 2=Initials, 3=Date, 4=Text, 5=Checkbox
  includeDate: boolean;
  includeName: boolean;
  assignedEmail: string | null; // إيميل الموقّع المخصص (multi-signer)
  createdAt: string;
  updatedAt: string;
}

interface BackendDocumentSignatureDto {
  id: string;
  signatureFieldId: string;
  responseId: string;
  signerName: string;
  signerEmail: string;
  signerPhone: string | null;
  signatureData: string;
  signedAt: string;
  fieldLabel: string | null;
  pageNumber: number | null;
}

interface BackendEventWithSignatureFieldsDto {
  id: string;
  title: string;
  description: string | null;
  type: number;
  status: number;
  shareCode: string;
  documentUrl: string | null;
  documentFileName: string | null;
  allowDownloadAfterSigning: boolean;
  sendCopyToSigner: boolean;
  signatureDisplayMode: string;
  signingMode: string; // نوع التوقيع: single أو multi
  signatureFields: BackendSignatureFieldDto[];
  // إعدادات الوصول
  requireLogin: boolean;
  isPrivate: boolean;
  allowedEmails: string[] | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Mappers
// ============================================================

const fieldTypeMap: Record<number, SignatureField["fieldType"]> = {
  1: "signature",
  2: "initials",
  3: "date",
  4: "text",
  5: "checkbox",
};

const mapSignatureField = (backend: BackendSignatureFieldDto): SignatureField => ({
  id: backend.id,
  eventId: backend.eventId,
  label: backend.label,
  fieldType: fieldTypeMap[backend.fieldType] || "signature",
  pageNumber: backend.pageNumber,
  positionX: backend.positionX,
  positionY: backend.positionY,
  width: backend.width,
  height: backend.height,
  isRequired: backend.isRequired,
  order: backend.order,
  includeDate: backend.includeDate,
  includeName: backend.includeName,
  assignedEmail: backend.assignedEmail || undefined,
  createdAt: backend.createdAt,
  updatedAt: backend.updatedAt,
});

const mapDocumentSignature = (backend: BackendDocumentSignatureDto): DocumentSignature => ({
  id: backend.id,
  signatureFieldId: backend.signatureFieldId,
  responseId: backend.responseId,
  signerName: backend.signerName,
  signerEmail: backend.signerEmail,
  signerPhone: backend.signerPhone || undefined,
  signatureData: backend.signatureData,
  signedAt: backend.signedAt,
  fieldLabel: backend.fieldLabel || undefined,
  pageNumber: backend.pageNumber || undefined,
});

const mapDocumentSigningEvent = (backend: BackendEventWithSignatureFieldsDto): DocumentSigningEvent => ({
  id: backend.id,
  title: backend.title,
  description: backend.description || "",
  type: "document_signing",
  status: backend.status === 1 ? "draft" : backend.status === 2 ? "active" : "archived",
  shareCode: backend.shareCode,
  shareLink: `/e/${backend.shareCode}`,
  documentUrl: backend.documentUrl || "",
  documentFileName: backend.documentFileName || "",
  allowDownloadAfterSigning: backend.allowDownloadAfterSigning,
  sendCopyToSigner: backend.sendCopyToSigner,
  signatureDisplayMode: (backend.signatureDisplayMode as "inside" | "outside") || "inside",
  signingMode: (backend.signingMode as "single" | "multi") || "single",
  signatureFields: backend.signatureFields.map(mapSignatureField),
  sections: [],
  settings: {
    requireAuth: backend.requireLogin,
    isPrivate: backend.isPrivate,
    allowedEmails: backend.allowedEmails || undefined,
    allowAnonymous: !backend.requireLogin,
    allowMultipleResponses: false,
    showProgressBar: false,
    shuffleQuestions: false,
  },
  stats: {
    totalResponses: 0,
    completedResponses: 0,
    inProgressResponses: 0,
    completionRate: 0,
    averageTime: 0,
  },
  createdAt: backend.createdAt,
  updatedAt: backend.updatedAt,
});

// ============================================================
// API Functions
// ============================================================

/**
 * إنشاء حدث توقيع وثيقة جديد
 */
export async function createDocumentEvent(
  document: File,
  data: CreateDocumentEventRequest
): Promise<DocumentSigningEvent> {
  const formData = new FormData();
  formData.append("document", document);
  formData.append("title", data.title);
  if (data.description) formData.append("description", data.description);
  if (data.allowDownloadAfterSigning !== undefined) {
    formData.append("allowDownloadAfterSigning", String(data.allowDownloadAfterSigning));
  }
  if (data.sendCopyToSigner !== undefined) {
    formData.append("sendCopyToSigner", String(data.sendCopyToSigner));
  }

  const response = await apiClient.post<ApiResponse<BackendEventWithSignatureFieldsDto>>(
    "/DocumentSigning",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || "فشل إنشاء الحدث");
  }

  return mapDocumentSigningEvent(response.data.data);
}

/**
 * إنشاء حدث توقيع وثيقة جديد مع URL الوثيقة (بعد رفعها مسبقاً)
 */
export async function createDocumentEventWithUrl(
  data: CreateDocumentEventWithUrlRequest
): Promise<DocumentSigningEvent> {
  const response = await apiClient.post<ApiResponse<BackendEventWithSignatureFieldsDto>>(
    "/DocumentSigning/with-url",
    {
      title: data.title,
      description: data.description,
      documentUrl: data.documentUrl,
      documentFileName: data.documentFileName,
      signatureFields: data.signatureFields,
      // إعدادات الوصول (مفعّلة تلقائياً إذا لم تُحدد)
      requireLogin: data.requireLogin ?? true,
      isPrivate: data.isPrivate ?? true,
      allowedEmails: data.allowedEmails ?? [],
      // إعدادات التوقيع
      allowDownloadAfterSigning: data.allowDownloadAfterSigning,
      sendCopyToSigner: data.sendCopyToSigner,
      // طريقة عرض التوقيع للمشارك
      signatureDisplayMode: data.signatureDisplayMode ?? "inside",
      // نوع التوقيع
      signingMode: data.signingMode ?? "single",
    }
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || "فشل إنشاء الحدث");
  }

  return mapDocumentSigningEvent(response.data.data);
}

/**
 * تحديث حدث توقيع
 */
export async function updateDocumentEvent(
  eventId: string,
  data: UpdateDocumentEventRequest
): Promise<DocumentSigningEvent> {
  const response = await apiClient.put<ApiResponse<BackendEventWithSignatureFieldsDto>>(
    `/DocumentSigning/${eventId}`,
    data
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || "فشل تحديث الحدث");
  }

  return mapDocumentSigningEvent(response.data.data);
}

/**
 * الحصول على حدث توقيع
 */
export async function getDocumentEvent(eventId: string): Promise<DocumentSigningEvent> {
  const response = await apiClient.get<ApiResponse<BackendEventWithSignatureFieldsDto>>(
    `/DocumentSigning/${eventId}`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || "الحدث غير موجود");
  }

  return mapDocumentSigningEvent(response.data.data);
}

/**
 * الحصول على حدث توقيع برمز المشاركة (Public)
 */
export async function getDocumentEventByShareCode(shareCode: string): Promise<DocumentSigningEvent> {
  const response = await apiClient.get<ApiResponse<BackendEventWithSignatureFieldsDto>>(
    `/DocumentSigning/public/${shareCode}`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || "الحدث غير موجود");
  }

  return mapDocumentSigningEvent(response.data.data);
}

/**
 * تحديث ملف الوثيقة
 */
export async function updateDocument(eventId: string, document: File): Promise<void> {
  const formData = new FormData();
  formData.append("document", document);

  const response = await apiClient.put<ApiResponse<null>>(
    `/DocumentSigning/${eventId}/document`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  if (!response.data.success) {
    throw new Error(response.data.message || "فشل تحديث الوثيقة");
  }
}

// ============================================================
// Signature Fields
// ============================================================

/**
 * إضافة حقل توقيع
 */
export async function addSignatureField(
  eventId: string,
  data: CreateSignatureFieldRequest
): Promise<SignatureField> {
  const response = await apiClient.post<ApiResponse<BackendSignatureFieldDto>>(
    `/DocumentSigning/${eventId}/fields`,
    data
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || "فشل إضافة حقل التوقيع");
  }

  return mapSignatureField(response.data.data);
}

/**
 * تحديث حقل توقيع
 */
export async function updateSignatureField(
  fieldId: string,
  data: UpdateSignatureFieldRequest
): Promise<SignatureField> {
  const response = await apiClient.put<ApiResponse<BackendSignatureFieldDto>>(
    `/DocumentSigning/fields/${fieldId}`,
    data
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || "فشل تحديث حقل التوقيع");
  }

  return mapSignatureField(response.data.data);
}

/**
 * حذف حقل توقيع
 */
export async function deleteSignatureField(fieldId: string): Promise<void> {
  const response = await apiClient.delete<ApiResponse<null>>(
    `/DocumentSigning/fields/${fieldId}`
  );

  if (!response.data.success) {
    throw new Error(response.data.message || "فشل حذف حقل التوقيع");
  }
}

/**
 * الحصول على حقول التوقيع لحدث
 */
export async function getSignatureFields(eventId: string): Promise<SignatureField[]> {
  const response = await apiClient.get<ApiResponse<BackendSignatureFieldDto[]>>(
    `/DocumentSigning/${eventId}/fields`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || "فشل جلب حقول التوقيع");
  }

  return response.data.data.map(mapSignatureField);
}

// ============================================================
// Signatures
// ============================================================

/**
 * إرسال توقيع واحد
 */
export async function submitSignature(
  responseId: string,
  data: SubmitSignatureRequest
): Promise<DocumentSignature> {
  const response = await apiClient.post<ApiResponse<BackendDocumentSignatureDto>>(
    `/DocumentSigning/responses/${responseId}/sign`,
    data
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || "فشل إرسال التوقيع");
  }

  return mapDocumentSignature(response.data.data);
}

/**
 * إرسال جميع التوقيعات مرة واحدة
 */
export async function submitAllSignatures(
  data: SubmitAllSignaturesRequest
): Promise<DocumentSignature[]> {
  // تحويل البيانات لتتوافق مع Backend
  // إذا لم يكن هناك responseId، نرسل Guid.Empty وسيقوم Backend بإنشاء Response جديد
  const backendData = {
    eventId: data.eventId,
    responseId: data.responseId || "00000000-0000-0000-0000-000000000000",
    signerName: data.signerName,
    signerEmail: data.signerEmail || "",
    signerPhone: data.signerPhone,
    signatures: data.signatures.map((sig) => ({
      signatureFieldId: sig.fieldId, // تحويل fieldId إلى signatureFieldId
      signatureData: sig.signatureData || "",
    })),
  };

  const response = await apiClient.post<ApiResponse<BackendDocumentSignatureDto[]>>(
    "/DocumentSigning/sign-all",
    backendData
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || "فشل إرسال التوقيعات");
  }

  return response.data.data.map(mapDocumentSignature);
}

/**
 * الحصول على توقيعات حدث
 */
export async function getEventSignatures(eventId: string): Promise<DocumentSignature[]> {
  const response = await apiClient.get<ApiResponse<BackendDocumentSignatureDto[]>>(
    `/DocumentSigning/${eventId}/signatures`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || "فشل جلب التوقيعات");
  }

  return response.data.data.map(mapDocumentSignature);
}

/**
 * الحصول على توقيعات رد معين
 */
export async function getResponseSignatures(responseId: string): Promise<DocumentSignature[]> {
  const response = await apiClient.get<ApiResponse<BackendDocumentSignatureDto[]>>(
    `/DocumentSigning/responses/${responseId}/signatures`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || "فشل جلب التوقيعات");
  }

  return response.data.data.map(mapDocumentSignature);
}

// ============================================================
// Export Service Object
// ============================================================

export const documentSigningService = {
  // Event operations
  createDocumentEvent,
  createDocumentEventWithUrl,
  updateDocumentEvent,
  getDocumentEvent,
  getDocumentEventByShareCode,
  updateDocument,

  // Signature fields
  addSignatureField,
  updateSignatureField,
  deleteSignatureField,
  getSignatureFields,

  // Signatures
  submitSignature,
  submitAllSignatures,
  getEventSignatures,
  getResponseSignatures,
};


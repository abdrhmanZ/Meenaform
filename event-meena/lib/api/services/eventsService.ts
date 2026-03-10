/**
 * Events Service - خدمة الأحداث
 * الاتصال بـ Backend API للأحداث
 */

import { apiClient, ApiResponse } from "../client";
import {
  BackendEventDto,
  BackendEventListItemDto,
  BackendEventWithFullDetailsDto,
  BackendPagedResult,
  mapEvent,
  mapEventListItem,
  mapEventWithFullDetails,
  mapEventFormToBackend,
  mapEventWithSectionsToBackend,
  mapEventStatusToNumber
} from "../mappers";
import { Event, EventFormData, EventStatus, EventType } from "@/types/event";

// ============================================================
// أنواع إضافية
// ============================================================

interface SendEventRequest {
  contactIds?: string[];
  groupIds?: string[];
  sendMethod: "email" | "sms" | "both";
  customMessage?: string;
}

interface SendEventResponse {
  totalRecipients: number;
  // Backend يرسل SuccessCount و FailureCount
  successCount?: number;
  failureCount?: number;
  // للتوافق مع الأسماء القديمة
  successfulSends?: number;
  failedSends?: number;
  errors?: string[] | null;
  sentAt?: string;
}

// DTO للإحصائيات اليومية
export interface DailyStats {
  date: string;
  events: number;
  responses: number;
}

// DTO لإحصائيات لوحة التحكم
export interface DashboardStats {
  totalEvents: number;
  activeEvents: number;
  totalResponses: number;
  totalViews: number;
  averageCompletionRate: number;
  eventsChange: number;
  activeEventsChange: number;
  responsesChange: number;
  viewsChange: number;
  completionRateChange: number;
  dailyStats: DailyStats[];
}

// ============================================================
// خدمة الأحداث
// ============================================================

export const eventsService = {
  /**
   * جلب جميع الأحداث (مع Pagination)
   * Backend يُرجع PagedResult<EventListItemDto>
   */
  getAll: async (): Promise<Event[]> => {
    const response = await apiClient.get<ApiResponse<BackendPagedResult<BackendEventListItemDto>>>("/Events");

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "فشل جلب الأحداث");
    }

    // استخراج الـ items من الاستجابة المُرقّمة
    const events = response.data.data.items.map(mapEventListItem);

    return events;
  },

  /**
   * جلب حدث بواسطة ID
   */
  getById: async (id: string): Promise<Event> => {
    const response = await apiClient.get<ApiResponse<BackendEventDto>>(`/Events/${id}`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "الحدث غير موجود");
    }

    return mapEvent(response.data.data);
  },

  /**
   * جلب حدث مع التفاصيل الكاملة (sections و components)
   */
  getFullDetails: async (id: string): Promise<Event> => {
    const response = await apiClient.get<ApiResponse<BackendEventWithFullDetailsDto>>(
      `/Events/${id}/full`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "الحدث غير موجود");
    }

    return mapEventWithFullDetails(response.data.data);
  },

  /**
   * جلب حدث بواسطة رمز المشاركة (Public - لا يحتاج تسجيل دخول)
   * يُرجع الحدث مع التفاصيل الكاملة (sections و components)
   */
  getByShareCode: async (shareCode: string): Promise<Event> => {
    const response = await apiClient.get<ApiResponse<BackendEventWithFullDetailsDto>>(
      `/Public/events/${shareCode}`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "الحدث غير موجود");
    }

    return mapEventWithFullDetails(response.data.data);
  },

  /**
   * جلب حدث للمعاينة (Public - لا يحتاج تسجيل دخول - بدون التحقق من الحالة)
   * يُرجع الحدث مع التفاصيل الكاملة (sections و components)
   */
  getForPreview: async (id: string): Promise<Event> => {
    const response = await apiClient.get<ApiResponse<BackendEventWithFullDetailsDto>>(
      `/Public/events/${id}/preview`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "الحدث غير موجود");
    }

    return mapEventWithFullDetails(response.data.data);
  },

  /**
   * جلب الأحداث حسب الحالة
   * Backend Enum: Draft=1, Published=2, Closed=3, Archived=4
   * Backend يُرجع List<EventListItemDto>
   */
  getByStatus: async (status: EventStatus): Promise<Event[]> => {
    const statusNumber = { draft: 1, active: 2, archived: 4 }[status];
    const response = await apiClient.get<ApiResponse<BackendEventListItemDto[]>>(
      `/Events/by-status/${statusNumber}`
    );

    if (!response.data.success || !response.data.data) {
      return [];
    }

    return response.data.data.map(mapEventListItem);
  },

  /**
   * جلب الأحداث حسب النوع
   * Backend Enum: Survey=1, Quiz=2, Form=3, Event=4
   * Backend يُرجع List<EventListItemDto>
   */
  getByType: async (type: EventType): Promise<Event[]> => {
    const typeNumber = { survey: 1, quiz: 2, form: 3, poll: 4, document_signing: 5, competition: 6 }[type];
    const response = await apiClient.get<ApiResponse<BackendEventListItemDto[]>>(
      `/Events/by-type/${typeNumber}`
    );

    if (!response.data.success || !response.data.data) {
      return [];
    }

    return response.data.data.map(mapEventListItem);
  },

  /**
   * إنشاء حدث جديد (بدون أقسام)
   */
  create: async (data: EventFormData): Promise<Event> => {
    const backendData = mapEventFormToBackend(data);

    const response = await apiClient.post<ApiResponse<BackendEventDto>>(
      "/Events",
      backendData
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "فشل إنشاء الحدث");
    }

    return mapEvent(response.data.data);
  },

  /**
   * إنشاء حدث كامل مع الأقسام والمكونات
   * يُستخدم عند حفظ الحدث من Event Builder
   */
  createWithSections: async (event: Event): Promise<Event> => {
    const backendData = mapEventWithSectionsToBackend(event);

    const response = await apiClient.post<ApiResponse<BackendEventWithFullDetailsDto>>(
      "/Events/with-sections",
      backendData
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "فشل إنشاء الحدث");
    }

    return mapEventWithFullDetails(response.data.data);
  },

  /**
   * تحديث حدث
   */
  update: async (id: string, data: Partial<EventFormData>): Promise<Event> => {
    const response = await apiClient.put<ApiResponse<BackendEventDto>>(
      `/Events/${id}`,
      mapEventFormToBackend(data as EventFormData)
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "فشل تحديث الحدث");
    }

    return mapEvent(response.data.data);
  },

  /**
   * تحديث حدث كامل مع الأقسام والمكونات
   * يُستخدم عند تعديل الحدث من Event Builder
   */
  updateWithSections: async (id: string, event: Event): Promise<Event> => {
    const backendData = mapEventWithSectionsToBackend(event);

    const response = await apiClient.put<ApiResponse<BackendEventWithFullDetailsDto>>(
      `/Events/${id}/with-sections`,
      backendData
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "فشل تحديث الحدث");
    }

    return mapEventWithFullDetails(response.data.data);
  },

  /**
   * تحديث حالة الحدث فقط (بدون تغيير البيانات الأخرى)
   */
  updateStatus: async (id: string, status: EventStatus): Promise<Event> => {
    const statusNumber = mapEventStatusToNumber(status);
    const response = await apiClient.patch<ApiResponse<BackendEventDto>>(
      `/Events/${id}/status`,
      { status: statusNumber }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "فشل تحديث حالة الحدث");
    }

    return mapEvent(response.data.data);
  },

  /**
   * حذف حدث
   */
  delete: async (id: string): Promise<void> => {
    const response = await apiClient.delete<ApiResponse<null>>(`/Events/${id}`);

    if (!response.data.success) {
      throw new Error(response.data.message || "فشل حذف الحدث");
    }
  },

  /**
   * نشر حدث
   */
  publish: async (id: string): Promise<Event> => {
    const response = await apiClient.post<ApiResponse<BackendEventDto>>(
      `/Events/${id}/publish`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "فشل نشر الحدث");
    }

    return mapEvent(response.data.data);
  },

  /**
   * إغلاق حدث (تحويل إلى مسودة)
   */
  close: async (id: string): Promise<Event> => {
    const response = await apiClient.post<ApiResponse<BackendEventDto>>(
      `/Events/${id}/close`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "فشل إغلاق الحدث");
    }

    return mapEvent(response.data.data);
  },

  /**
   * نسخ حدث
   */
  duplicate: async (id: string): Promise<Event> => {
    const response = await apiClient.post<ApiResponse<BackendEventDto>>(
      `/Events/${id}/duplicate`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "فشل نسخ الحدث");
    }

    return mapEvent(response.data.data);
  },

  /**
   * إرسال حدث لجهات الاتصال
   */
  send: async (id: string, data: SendEventRequest): Promise<SendEventResponse> => {
    const response = await apiClient.post<ApiResponse<SendEventResponse>>(
      `/Events/${id}/send`,
      {
        contactIds: data.contactIds || [],
        groupIds: data.groupIds || [],
        sendMethod: data.sendMethod === "email" ? 0 : data.sendMethod === "sms" ? 1 : 2,
        customMessage: data.customMessage || null,
      }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "فشل إرسال الحدث");
    }

    return response.data.data;
  },

  /**
   * إرسال تذكير
   */
  sendReminder: async (id: string, contactIds: string[]): Promise<SendEventResponse> => {
    const response = await apiClient.post<ApiResponse<SendEventResponse>>(
      `/Events/${id}/send-reminder`,
      { contactIds }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "فشل إرسال التذكير");
    }

    return response.data.data;
  },

  /**
   * جلب سجل الإرسال
   */
  getSendHistory: async (
    id: string
  ): Promise<
    Array<{
      id: string;
      contactId: string;
      contactName: string;
      contactEmail: string;
      sentAt: string;
      status: string;
      openedAt?: string;
      respondedAt?: string;
    }>
  > => {
    const response = await apiClient.get<
      ApiResponse<
        Array<{
          id: string;
          contactId: string;
          contactName: string;
          contactEmail: string;
          sentAt: string;
          status: string;
          openedAt: string | null;
          respondedAt: string | null;
        }>
      >
    >(`/Events/${id}/send-history`);

    if (!response.data.success || !response.data.data) {
      return [];
    }

    return response.data.data.map((item) => ({
      ...item,
      openedAt: item.openedAt || undefined,
      respondedAt: item.respondedAt || undefined,
    }));
  },

  /**
   * زيادة عدد مشاهدات الحدث (Public - لا يحتاج تسجيل دخول)
   */
  incrementViewCount: async (eventId: string): Promise<void> => {
    try {
      await apiClient.post(`/Public/events/${eventId}/view`);
    } catch (error) {
      // لا نريد إيقاف تحميل الصفحة إذا فشل تسجيل المشاهدة
      console.warn("Failed to increment view count:", error);
    }
  },

  /**
   * جلب إحصائيات لوحة التحكم
   */
  getDashboardStats: async (): Promise<DashboardStats | null> => {
    try {
      const response = await apiClient.get<ApiResponse<DashboardStats>>(
        "/Events/dashboard-stats"
      );

      if (!response.data.success || !response.data.data) {
        return null;
      }

      return response.data.data;
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      return null;
    }
  },

  /**
   * إجراء السحب العشوائي للفائزين في مسابقة
   */
  drawWinners: async (eventId: string, winnersCount: number, winnerResponseIds?: string[]): Promise<{
    winners: Array<{ responseId: string; participantName: string; participantEmail?: string; rank: number; score?: number }>;
    totalParticipants: number;
    qualifiedCount: number;
  }> => {
    const response = await apiClient.post<ApiResponse<{
      winners: Array<{ responseId: string; participantName: string; participantEmail?: string; rank: number; score?: number }>;
      totalParticipants: number;
      qualifiedCount: number;
    }>>(`/Events/${eventId}/draw`, { winnersCount, winnerResponseIds: winnerResponseIds || null });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "فشل إجراء السحب");
    }

    return response.data.data;
  },

  /**
   * تحديث إعدادات مشاركة النتائج
   */
  updateResultsSharing: async (eventId: string, data: {
    isEnabled: boolean;
    allowedEmails: string[];
    permissions: { allowExport: boolean; allowDraw: boolean };
  }): Promise<string> => {
    const response = await apiClient.put<ApiResponse<string>>(
      `/Events/${eventId}/share-results`,
      data
    );

    if (!response.data.success) {
      throw new Error(response.data.message || "فشل تحديث إعدادات المشاركة");
    }

    return response.data.data!;
  },

  /**
   * الوصول للنتائج المشاركة (Public - بدون تسجيل دخول)
   */
  accessSharedResults: async (token: string, email: string): Promise<{
    event: any;
    responses: any[];
    permissions: { allowExport: boolean; allowDraw: boolean };
  }> => {
    const response = await apiClient.post<ApiResponse<{
      event: any;
      responses: any[];
      permissions: { allowExport: boolean; allowDraw: boolean };
    }>>(`/Public/shared-results/${token}/access`, { email });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "فشل الوصول للنتائج");
    }

    return response.data.data;
  },
};

export default eventsService;


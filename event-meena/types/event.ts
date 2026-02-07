// types/event.ts
// تعريفات TypeScript للأحداث (Events) - محدّثة لدعم الأقسام والمكونات

import { Section } from "./section";

/**
 * أنواع الأحداث
 */
export type EventType = "survey" | "poll" | "form" | "quiz" | "document_signing";

/**
 * حالات الأحداث
 */
export type EventStatus = "draft" | "active" | "archived";

/**
 * طريقة المشاركة
 */
export type SharingMethod =
  | "public_link"       // رابط عام
  | "specific_contacts" // جهات اتصال محددة
  | "specific_groups";  // مجموعات محددة

/**
 * الحدث (Event) - البنية الجديدة
 */
export interface Event {
  id: string;
  userId?: string;

  // المعلومات الأساسية
  title: string;
  description: string;
  type: EventType;
  status: EventStatus;
  coverImage?: string;

  // المشاركة
  shareCode?: string;
  shareLink?: string;

  // الأقسام (Sections) - البنية الجديدة
  sections: Section[];

  // عداد الأقسام والمكونات (للقوائم - يأتي من EventListItemDto)
  sectionsCount?: number;
  componentsCount?: number;

  // عداد حقول التوقيع والتوقيعات (لأحداث توقيع الوثائق)
  signatureFieldsCount?: number;
  signaturesCount?: number;

  // الإعدادات
  settings: EventSettings;

  // الإحصائيات
  stats: EventStats;

  // التواريخ
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * إعدادات الحدث
 */
export interface EventSettings {
  // المشاركة
  sharingMethod?: SharingMethod;
  publicLink?: string;
  contactIds?: string[];
  groupIds?: string[];

  // الصلاحية
  startDate?: string;
  endDate?: string;

  // القيود
  allowMultipleResponses: boolean;
  requireAuth?: boolean; // إضافة requireAuth
  requireLogin?: boolean;
  singleAttempt?: boolean;

  // العرض
  showResults?: boolean; // إضافة showResults
  showResultsToParticipants?: boolean;
  showProgressBar: boolean;

  // الأمان
  enableCaptcha?: boolean;
  requireEmailVerification?: boolean;

  // الإشعارات
  sendEmailNotifications?: boolean;
  sendSMSNotifications?: boolean;

  // رسالة الشكر
  thankYouMessage?: string;

  // رسائل النتائج (للاختبارات)
  successMessage?: string;
  goodMessage?: string;
  improvementMessage?: string;

  // للاختبارات
  isQuiz?: boolean;
  passingScore?: number;
  showCorrectAnswers?: boolean;
  showScoreImmediately?: boolean;

  // متقدم
  allowEdit?: boolean; // إضافة allowEdit
  allowSaveDraft?: boolean;
  allowBackNavigation?: boolean;
  allowAnonymous?: boolean; // إضافة allowAnonymous
  shuffleQuestions?: boolean; // إضافة shuffleQuestions
  shuffleOptions?: boolean; // خلط خيارات الإجابات
  randomizeQuestions?: boolean;
  timeLimit?: number; // بالدقائق
  maxResponses?: number; // الحد الأقصى للاستجابات

  // المظهر
  themeColor?: string; // لون السمة
  language?: string; // اللغة

  // الحدث الخاص (Private Event)
  isPrivate?: boolean; // هل الحدث خاص؟
  allowedEmails?: string[]; // قائمة الإيميلات المسموح لها بالدخول
}

/**
 * إحصائيات الحدث
 */
export interface EventStats {
  totalResponses: number;
  completedResponses: number;
  inProgressResponses: number;
  completionRate: number;
  averageTime: number; // بالثواني
  lastResponseAt?: string;
  views?: number; // عدد المشاهدات

  // للاختبارات
  averageScore?: number;
  highestScore?: number;
  lowestScore?: number;
  passRate?: number;
}

/**
 * بيانات نموذج إنشاء/تعديل الحدث
 */
export interface EventFormData {
  title: string;
  description: string;
  type: EventType;
  status: EventStatus;
  coverImage?: string;
  settings: Partial<EventSettings>;
}

/**
 * بيانات إنشاء حدث من الصفر
 */
export interface CreateEventFromScratchData {
  title: string;
  description: string;
  type: EventType;
  coverImage?: string;
  sectionsCount: number; // عدد الأقسام المطلوبة
}

/**
 * حالة Store الأحداث
 */
export interface EventsState {
  events: Event[];
  currentEvent: Event | null;
  isLoading: boolean;
  error: string | null;

  // الفلاتر
  filters: {
    search: string;
    status: EventStatus | "all";
    type: EventType | "all";
    sortBy: "createdAt" | "updatedAt" | "title" | "responses";
    sortOrder: "asc" | "desc";
  };

  // الوظائف
  fetchEvents: () => Promise<void>;
  fetchEventById: (id: string) => Promise<void>;
  fetchEventByShareCode: (shareCode: string) => Promise<void>;
  fetchEventForPreview: (id: string) => Promise<void>;
  createEvent: (data: Event | EventFormData) => Promise<Event>;
  createEventFromScratch: (data: CreateEventFromScratchData) => Promise<Event>;
  updateEvent: (id: string, data: Partial<EventFormData>) => Promise<void>;
  updateEventSettings: (id: string, settings: Partial<EventSettings>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  duplicateEvent: (id: string) => Promise<Event>;
  archiveEvent: (id: string) => Promise<void>;
  publishEvent: (id: string) => Promise<void>;
  updateEventStatus: (id: string, status: EventStatus) => Promise<void>;

  // الفلاتر
  setSearch: (search: string) => void;
  setStatusFilter: (status: EventStatus | "all") => void;
  setTypeFilter: (type: EventType | "all") => void;
  setSortBy: (sortBy: "createdAt" | "updatedAt" | "title" | "responses") => void;
  setSortOrder: (sortOrder: "asc" | "desc") => void;
  clearFilters: () => void;

  // الحصول على الأحداث المفلترة
  getFilteredEvents: () => Event[];
}

/**
 * معلومات نوع الحدث
 */
export interface EventTypeInfo {
  value: EventType;
  label: string;
  labelAr: string;
  icon: string;
  description: string;
  descriptionAr: string;
  color: string;
}

/**
 * معلومات حالة الحدث
 */
export interface EventStatusInfo {
  value: EventStatus;
  label: string;
  labelAr: string;
  icon: string;
  description: string;
  descriptionAr: string;
  color: string;
  bgColor: string;
}

/**
 * القيم الافتراضية لإعدادات الحدث
 */
export const defaultEventSettings: EventSettings = {
  sharingMethod: "public_link",
  allowMultipleResponses: false,
  requireAuth: false,
  requireLogin: false,
  singleAttempt: true,
  showResults: false,
  showResultsToParticipants: false,
  showProgressBar: true,
  enableCaptcha: false,
  requireEmailVerification: false,
  sendEmailNotifications: true,
  sendSMSNotifications: false,
  thankYouMessage: "شكراً لمشاركتك! تم استلام إجاباتك بنجاح.",
  isQuiz: false,
  allowEdit: false,
  allowSaveDraft: true,
  allowBackNavigation: true,
  allowAnonymous: true,
  shuffleQuestions: false,
  randomizeQuestions: false,

  // الحدث الخاص (Private Event)
  isPrivate: false,
  allowedEmails: [],
};


/**
 * Data Mappers - تحويل البيانات بين Frontend و Backend
 * 
 * Backend يستخدم PascalCase:
 *   - FullName, ProfileImage, AccessToken
 *   - Guid IDs
 * 
 * Frontend يستخدم camelCase:
 *   - name, avatar, token
 *   - string IDs
 */

import { User } from "@/types/auth";
import { Contact, ContactFormData, Group, GroupFormData } from "@/types/contact";
import { Event, EventFormData, EventStatus, EventType, EventSettings, EventStats, Collaborator, CollaboratorRole, UserSearchResult, SharedEvent } from "@/types/event";

// ============================================================
// أنواع Backend DTOs (ما يأتي من الـ API)
// ============================================================

/** استجابة المصادقة من Backend */
export interface BackendAuthResponse {
  userId: string;
  fullName: string;
  email: string;
  profileImage: string | null;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

/** بيانات المستخدم من Backend */
export interface BackendUserDto {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  profileImage: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

/** الاستجابة المُرقّمة من Backend */
export interface BackendPagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

/** عنصر قائمة الحدث من Backend (للقوائم) */
export interface BackendEventListItemDto {
  id: string;
  title: string;
  description: string | null;
  type: number;
  status: number;
  coverImage: string | null;
  shareCode: string;
  viewCount: number;
  responseCount: number;
  completedResponseCount: number;
  sectionsCount: number;
  componentsCount: number;
  completionRate: number;
  createdAt: string;
  // خاص بأحداث توقيع الوثائق
  signatureFieldsCount: number;
  signaturesCount: number;
}

/** جهة الاتصال من Backend */
export interface BackendContactDto {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  jobTitle: string | null;
  notes: string | null;
  tags: string[];
  groupIds: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  stats: {
    eventsSent: number;
    eventsCompleted: number;
    responseRate: number;
    lastInteraction: string | null;
  } | null;
}

/** المجموعة من Backend */
export interface BackendGroupDto {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  isActive: boolean;
  contactCount: number;
  contactIds: string[];
  createdAt: string;
  updatedAt: string | null;
  stats: {
    eventsSent: number;
    averageResponseRate: number;
    lastEventSent: string | null;
  } | null;
}

/** الحدث من Backend */
export interface BackendEventDto {
  id: string;
  title: string;
  description: string | null;
  type: number; // Enum as number
  status: number; // Enum as number
  coverImage: string | null;
  themeColor: string | null;
  language: string | null;
  startDate: string | null;
  endDate: string | null;
  timeLimitMinutes: number | null;
  shareCode: string;
  shareLink: string | null;
  requireLogin: boolean;
  allowAnonymous: boolean;
  maxResponses: number | null;
  allowMultipleResponses: boolean;
  allowEditResponses: boolean;
  showResults: boolean;
  showCorrectAnswers: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  passingScore: number | null;
  thankYouMessage: string | null;
  successMessage: string | null;
  goodMessage: string | null;
  improvementMessage: string | null;
  // إعدادات الحدث الخاص
  isPrivate: boolean;
  allowedEmails: string[] | null;
  // إعدادات المسابقة
  competitionMode: string | null;
  winnersCount: number;
  qualifyingScore: number | null;
  drawCompleted: boolean;
  winnersJson: string | null;
  // مشاركة النتائج
  resultsShareToken: string | null;
  isResultsShared: boolean;
  resultsSharedEmails: string[] | null;
  resultsSharePermissions: { allowExport: boolean; allowDraw: boolean } | null;
  viewCount: number;
  responseCount: number;
  createdAt: string;
  updatedAt: string | null;
}

/** المكون من Backend */
export interface BackendComponentDto {
  id: string;
  type: number; // ComponentType enum
  order: number;
  title: string | null;
  description: string | null;
  placeholder: string | null;
  isRequired: boolean;
  isVisible: boolean;
  optionsJson: string | null;
  validationJson: string | null;
  correctAnswerJson: string | null;
  points: number | null;
  explanation: string | null;
  minValue: number | null;
  maxValue: number | null;
  minLabel: string | null;
  maxLabel: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  styleJson: string | null;
  sectionId: string;
  createdAt: string;
  updatedAt: string | null;
}

/** القسم مع المكونات من Backend */
export interface BackendSectionWithComponentsDto {
  id: string;
  title: string;
  description: string | null;
  order: number;
  isVisible: boolean;
  eventId: string;
  createdAt: string;
  components: BackendComponentDto[];
}

/** الحدث مع التفاصيل الكاملة من Backend */
export interface BackendEventWithFullDetailsDto extends BackendEventDto {
  sections: BackendSectionWithComponentsDto[];
}

// ============================================================
// Mappers: Backend → Frontend
// ============================================================

/**
 * تحويل استجابة المصادقة
 */
export const mapAuthResponse = (backend: BackendAuthResponse): {
  user: User;
  token: string;
  refreshToken: string;
} => ({
  user: {
    id: backend.userId,
    name: backend.fullName,
    email: backend.email,
    phone: "", // سيتم جلبه لاحقاً من /me
    avatar: backend.profileImage || undefined,
    createdAt: new Date().toISOString(),
  },
  token: backend.accessToken,
  refreshToken: backend.refreshToken,
});

/**
 * تحويل بيانات المستخدم
 */
export const mapUser = (backend: BackendUserDto): User => ({
  id: backend.id,
  name: backend.fullName,
  email: backend.email,
  phone: backend.phone || "",
  avatar: backend.profileImage || undefined,
  createdAt: backend.createdAt,
});

/**
 * تحويل جهة الاتصال
 */
export const mapContact = (backend: BackendContactDto): Contact => ({
  id: backend.id,
  userId: "", // سيتم ملؤه من السياق
  name: backend.name,
  email: backend.email || "",
  phone: backend.phone || "",
  company: backend.company || undefined,
  jobTitle: backend.jobTitle || undefined,
  notes: backend.notes || undefined,
  tags: backend.tags || [],
  groupIds: backend.groupIds || [],
  stats: backend.stats ? {
    eventsSent: backend.stats.eventsSent,
    eventsCompleted: backend.stats.eventsCompleted,
    responseRate: backend.stats.responseRate,
    lastInteraction: backend.stats.lastInteraction || undefined,
  } : {
    eventsSent: 0,
    eventsCompleted: 0,
    responseRate: 0,
  },
  createdAt: backend.createdAt,
  updatedAt: backend.updatedAt || backend.createdAt,
});

/**
 * تحويل المجموعة
 */
export const mapGroup = (backend: BackendGroupDto): Group => ({
  id: backend.id,
  userId: "", // سيتم ملؤه من السياق
  name: backend.name,
  description: backend.description || undefined,
  color: backend.color || "#1a56db",
  icon: backend.icon || undefined,
  contactIds: backend.contactIds || [],
  membersCount: backend.contactCount,
  stats: backend.stats ? {
    eventsSent: backend.stats.eventsSent,
    averageResponseRate: backend.stats.averageResponseRate,
    lastEventSent: backend.stats.lastEventSent || undefined,
  } : {
    eventsSent: 0,
    averageResponseRate: 0,
  },
  createdAt: backend.createdAt,
  updatedAt: backend.updatedAt || backend.createdAt,
});

/**
 * تحويل نوع الحدث من رقم إلى نص
 * Backend Enum: Survey=1, Quiz=2, Form=3, Event=4, DocumentSigning=5
 * Frontend Type: "survey" | "poll" | "form" | "quiz" | "document_signing"
 */
const mapEventType = (type: number): EventType => {
  const types: Record<number, EventType> = {
    1: "survey",            // Survey = 1
    2: "quiz",              // Quiz = 2
    3: "form",              // Form = 3
    4: "poll",              // Event = 4
    5: "document_signing",  // DocumentSigning = 5
    6: "competition",       // Competition = 6
  };
  return types[type] || "survey";
};

/**
 * تحويل حالة الحدث من رقم إلى نص
 * Backend Enum: Draft=1, Published=2, Closed=3, Archived=4
 * Frontend Status: "draft" | "active" | "archived"
 */
const mapEventStatus = (status: number): EventStatus => {
  const statuses: Record<number, EventStatus> = {
    1: "draft",     // Draft = 1
    2: "active",    // Published = 2 (active في الـ Frontend)
    3: "archived",  // Closed = 3 (نعتبره archived)
    4: "archived",  // Archived = 4
  };
  return statuses[status] || "draft";
};

/**
 * تحويل الحدث
 */
export const mapEvent = (backend: BackendEventDto): Event => ({
  id: backend.id,
  userId: "", // سيتم ملؤه من السياق
  title: backend.title,
  description: backend.description || "",
  type: mapEventType(backend.type),
  status: mapEventStatus(backend.status),
  coverImage: backend.coverImage || undefined,
  shareCode: backend.shareCode || undefined,
  shareLink: backend.shareLink || `${typeof window !== "undefined" ? window.location.origin : ""}/e/${backend.shareCode}`,
  sections: [], // سيتم جلبها بشكل منفصل
  settings: {
    sharingMethod: "public_link",
    publicLink: backend.shareLink || undefined,
    startDate: backend.startDate || undefined,
    endDate: backend.endDate || undefined,
    allowMultipleResponses: backend.allowMultipleResponses,
    allowEdit: backend.allowEditResponses,
    requireAuth: backend.requireLogin,
    requireLogin: backend.requireLogin,
    showResults: backend.showResults,
    showProgressBar: true,
    showCorrectAnswers: backend.showCorrectAnswers,
    shuffleQuestions: backend.shuffleQuestions,
    allowAnonymous: backend.allowAnonymous,
    timeLimit: backend.timeLimitMinutes || undefined,
    passingScore: backend.passingScore || undefined,
    thankYouMessage: backend.thankYouMessage || undefined,
    successMessage: backend.successMessage || undefined,
    goodMessage: backend.goodMessage || undefined,
    improvementMessage: backend.improvementMessage || undefined,
    // إعدادات الحدث الخاص
    isPrivate: backend.isPrivate || false,
    allowedEmails: backend.allowedEmails || [],
    // إعدادات المسابقة
    competitionMode: (backend.competitionMode as "quiz_draw" | "random_draw" | undefined) || undefined,
    winnersCount: backend.winnersCount || 1,
    qualifyingScore: backend.qualifyingScore || undefined,
    drawCompleted: backend.drawCompleted || false,
    winners: backend.winnersJson ? (() => { try { return JSON.parse(backend.winnersJson!); } catch { return []; } })() : undefined,
    // مشاركة النتائج
    resultsShareToken: backend.resultsShareToken || undefined,
    isResultsShared: backend.isResultsShared || false,
    resultsSharedEmails: backend.resultsSharedEmails || [],
    resultsSharePermissions: backend.resultsSharePermissions || { allowExport: false, allowDraw: false },
  },
  stats: {
    totalResponses: backend.responseCount,
    completedResponses: backend.responseCount,
    inProgressResponses: 0,
    completionRate: backend.responseCount > 0 ? 100 : 0,
    averageTime: 0,
    views: backend.viewCount,
  },
  createdAt: backend.createdAt,
  updatedAt: backend.updatedAt || backend.createdAt,
  publishedAt: backend.status === 2 ? backend.createdAt : undefined, // 2 = Published
  startDate: backend.startDate || undefined,
  endDate: backend.endDate || undefined,
});

/**
 * تحويل عنصر قائمة الحدث من Backend إلى Frontend
 */
export const mapEventListItem = (backend: BackendEventListItemDto): Event & { signatureFieldsCount?: number; signaturesCount?: number } => ({
  id: backend.id,
  title: backend.title,
  description: backend.description || "",
  type: mapEventType(backend.type),
  status: mapEventStatus(backend.status),
  shareCode: backend.shareCode,
  shareLink: `${typeof window !== "undefined" ? window.location.origin : ""}/e/${backend.shareCode}`,
  sections: [],
  sectionsCount: backend.sectionsCount,
  componentsCount: backend.componentsCount,
  signatureFieldsCount: backend.signatureFieldsCount || 0,
  signaturesCount: backend.signaturesCount || 0,
  settings: {
    requireAuth: false,
    allowAnonymous: true,
    allowMultipleResponses: false,
    showProgressBar: true,
    shuffleQuestions: false,
  },
  stats: {
    totalResponses: backend.responseCount,
    completedResponses: backend.completedResponseCount,
    inProgressResponses: backend.responseCount - backend.completedResponseCount,
    completionRate: backend.completionRate,
    averageTime: 0,
    views: backend.viewCount,
  },
  createdAt: backend.createdAt,
  updatedAt: backend.createdAt,
  publishedAt: backend.status === 2 ? backend.createdAt : undefined, // 2 = Published
  coverImage: backend.coverImage || undefined,
});

/**
 * تحويل نوع المكون من رقم إلى معلومات النوع
 * Backend ComponentType Enum → Frontend ComponentType + QuestionType
 *
 * Backend Enum:
 * - أسئلة (1-14): SingleChoice=1, MultipleChoice=2, ShortText=3, LongText=4, Rating=5, LinearScale=6, Date=7, Time=8, Number=9, Dropdown=10, YesNo=11, Email=12, Phone=13, ChoiceGrid=14
 * - عرض (20-26): Heading=20, Paragraph=21, DisplayImage=22, DisplayVideo=23, Divider=24, DisplayLink=25, DisplayPdf=26
 * - تفاعلية (30-32): WordCloud=30, QA=31, Poll=32
 * - رفع ملفات (40-43): FileUpload=40, PdfUpload=41, ImageUpload=42, VideoUpload=43
 * - خاصة (50-52): Signature=50, Table=51, Link=52
 */
interface ComponentTypeInfo {
  componentType: import("@/types/component").ComponentType;
  questionType?: import("@/types/component").QuestionType;
  displayType?: import("@/types/component").DisplayType;
  ratingType?: import("@/types/component").RatingType;
}

const mapComponentType = (type: number): ComponentTypeInfo => {
  // أسئلة (1-14)
  if (type >= 1 && type <= 14) {
    // Rating هو component منفصل في Frontend
    if (type === 5) {
      return { componentType: "rating" };
    }

    const questionTypes: Record<number, import("@/types/component").QuestionType> = {
      1: "single_choice",
      2: "multiple_choice",
      3: "short_text",
      4: "long_text",
      // 5 = Rating (معالج أعلاه)
      6: "linear_scale",
      7: "date",
      8: "time",
      9: "number",
      10: "dropdown",
      11: "yes_no",
      12: "email",
      13: "phone",
      14: "choice_grid",
    };

    return {
      componentType: "question",
      questionType: questionTypes[type] || "short_text"
    };
  }

  // عناصر عرض (20-26)
  if (type >= 20 && type <= 26) {
    // Paragraph/Text
    if (type === 21) {
      return { componentType: "text" };
    }
    // DisplayImage
    if (type === 22) {
      return { componentType: "display", displayType: "image" };
    }
    // DisplayVideo
    if (type === 23) {
      return { componentType: "display", displayType: "link" }; // video يُعرض كـ link
    }
    // DisplayLink
    if (type === 25) {
      return { componentType: "display", displayType: "link" };
    }
    // DisplayPdf
    if (type === 26) {
      return { componentType: "display", displayType: "pdf" };
    }
    // Heading, Divider
    return { componentType: "text" };
  }

  // رفع ملفات (40-43)
  if (type === 40) return { componentType: "pdf_upload" }; // FileUpload عام → pdf_upload
  if (type === 41) return { componentType: "pdf_upload" };
  if (type === 42) return { componentType: "image_upload" };
  if (type === 43) return { componentType: "video_upload" };

  // عناصر خاصة (50-52)
  if (type === 50) return { componentType: "signature" };
  if (type === 51) return { componentType: "table" };
  if (type === 52) return { componentType: "link" };

  // Default: question مع short_text
  return { componentType: "question", questionType: "short_text" };
};

/**
 * تحويل المكون من Backend إلى Frontend
 * يدعم جميع أنواع المكونات: question, rating, signature, file uploads, table, display, text, link
 */
export const mapComponent = (backend: BackendComponentDto): import("@/types/component").Component => {
  // Parse JSON fields
  let options: any[] = [];
  let correctAnswer: any = null;
  let styleData: any = {};

  if (backend.optionsJson) {
    try {
      options = JSON.parse(backend.optionsJson);
    } catch (e) {
      console.warn("Failed to parse optionsJson:", e);
    }
  }

  if (backend.correctAnswerJson) {
    try {
      correctAnswer = JSON.parse(backend.correctAnswerJson);
    } catch (e) {
      console.warn("Failed to parse correctAnswerJson:", e);
    }
  }

  if (backend.styleJson) {
    try {
      styleData = JSON.parse(backend.styleJson);
    } catch (e) {
      console.warn("Failed to parse styleJson:", e);
    }
  }

  // الحصول على معلومات النوع
  const typeInfo = mapComponentType(backend.type);

  // بناء Settings حسب نوع المكون
  let settings: import("@/types/component").ComponentSettings;

  switch (typeInfo.componentType) {
    case "question":
      settings = {
        type: "question",
        label: backend.title || "",
        description: backend.description || "",
        questionType: typeInfo.questionType || "short_text",
        placeholder: backend.placeholder || "",
        required: backend.isRequired,
        choices: options.map((opt: any, index: number) => ({
          id: opt.id || `choice-${index}`,
          label: opt.label || opt.text || opt,
          value: opt.value || opt.label || opt,
          isCorrect: correctAnswer === opt.id || (Array.isArray(correctAnswer) && correctAnswer.includes(opt.id)),
        })),
        scaleMin: backend.minValue || undefined,
        scaleMax: backend.maxValue || undefined,
        scaleMinLabel: backend.minLabel || undefined,
        scaleMaxLabel: backend.maxLabel || undefined,
        points: backend.points || undefined,
        correctAnswer: correctAnswer || undefined,
      };
      break;

    case "rating":
      settings = {
        type: "rating",
        label: backend.title || "تقييم",
        description: backend.description || "",
        ratingType: (styleData.ratingType as any) || "stars",
        required: backend.isRequired,
        maxRating: backend.maxValue || 5,
      };
      break;

    case "signature":
      settings = {
        type: "signature",
        label: backend.title || "التوقيع",
        description: backend.description || "",
        required: backend.isRequired,
        width: styleData.width || 500,
        height: styleData.height || 200,
        penColor: styleData.penColor || "#000000",
        penWidth: styleData.penWidth || 2,
      };
      break;

    case "pdf_upload":
    case "image_upload":
    case "video_upload":
      settings = {
        type: typeInfo.componentType,
        label: backend.title || "رفع ملف",
        description: backend.description || "",
        required: backend.isRequired,
        maxFileSize: styleData.maxFileSize || 10,
        acceptedFileTypes: styleData.acceptedFileTypes || [],
        allowMultiple: styleData.allowMultiple || false,
        maxFiles: styleData.maxFiles || 1,
      };
      break;

    case "table":
      settings = {
        type: "table",
        label: backend.title || "جدول",
        description: backend.description || "",
        tableType: (styleData.tableType as any) || "simple",
        columns: styleData.columns || [],
        rowCount: styleData.rowCount || 3,
        tableData: styleData.tableData || {},
        calculations: styleData.calculations || [],
      };
      break;

    case "link":
      settings = {
        type: "link",
        label: backend.title || "رابط",
        description: backend.description || "",
        required: backend.isRequired,
        placeholder: backend.placeholder || "https://",
        validateUrl: true,
      };
      break;

    case "text":
      settings = {
        type: "text",
        content: backend.description || styleData.content || "",
        fontSize: styleData.fontSize || "medium",
        textAlign: styleData.textAlign || "right",
        textColor: styleData.textColor,
        backgroundColor: styleData.backgroundColor,
      };
      break;

    case "display":
      settings = {
        type: "display",
        label: backend.title || "",
        description: backend.description || "",
        displayType: typeInfo.displayType || "image",
        imageUrl: backend.mediaUrl || styleData.imageUrl,
        imageAlt: styleData.imageAlt,
        pdfUrl: backend.mediaUrl || styleData.pdfUrl,
        pdfFileName: styleData.pdfFileName,
        linkUrl: backend.mediaUrl || styleData.linkUrl,
        linkText: styleData.linkText,
        openInNewTab: styleData.openInNewTab ?? true,
      };
      break;

    default:
      // Fallback to question
      settings = {
        type: "question",
        label: backend.title || "",
        description: backend.description || "",
        questionType: "short_text",
        placeholder: backend.placeholder || "",
        required: backend.isRequired,
      };
  }

  return {
    id: backend.id,
    sectionId: backend.sectionId,
    type: typeInfo.componentType, // ✅ النوع الفعلي بدلاً من "question" الثابت
    order: backend.order,
    settings,
    createdAt: backend.createdAt,
    updatedAt: backend.updatedAt || backend.createdAt,
  };
};

/**
 * تحويل القسم مع المكونات من Backend إلى Frontend
 */
export const mapSectionWithComponents = (backend: BackendSectionWithComponentsDto): import("@/types/section").Section => ({
  id: backend.id,
  eventId: backend.eventId,
  title: backend.title,
  description: backend.description || undefined,
  order: backend.order,
  components: backend.components?.map(mapComponent) || [],
  settings: {
    visible: backend.isVisible,
    skippable: false,
    showProgress: true,
    allowBackNavigation: true,
  },
  createdAt: backend.createdAt,
  updatedAt: backend.createdAt,
});

/**
 * تحويل الحدث مع التفاصيل الكاملة
 */
export const mapEventWithFullDetails = (backend: BackendEventWithFullDetailsDto): Event => ({
  ...mapEvent(backend),
  sections: backend.sections?.map(mapSectionWithComponents) || [],
});

// ============================================================
// Mappers: Frontend → Backend
// ============================================================

/**
 * تحويل نوع الحدث من نص إلى رقم
 * Frontend Type: "survey" | "poll" | "form" | "quiz"
 * Backend Enum: Survey=1, Quiz=2, Form=3, Event=4
 */
const mapEventTypeToNumber = (type: EventType): number => {
  const types: Record<EventType, number> = {
    survey: 1,
    quiz: 2,
    form: 3,
    poll: 4,
    document_signing: 5,
    competition: 6,
  };
  return types[type] ?? 1;
};

/**
 * تحويل حالة الحدث من نص إلى رقم
 * Frontend Status: "draft" | "active" | "archived"
 * Backend Enum: Draft=1, Published=2, Closed=3, Archived=4
 */
export const mapEventStatusToNumber = (status: EventStatus): number => {
  const statuses: Record<EventStatus, number> = {
    draft: 1,     // Draft = 1
    active: 2,    // Published = 2
    archived: 4,  // Archived = 4
  };
  return statuses[status] ?? 1; // Default: Draft
};

/**
 * تحويل بيانات إنشاء/تحديث جهة اتصال
 */
export const mapContactFormToBackend = (data: ContactFormData) => ({
  name: data.name,
  email: data.email || null,
  phone: data.phone || null,
  company: data.company || null,
  jobTitle: data.jobTitle || null,
  notes: data.notes || null,
  tags: data.tags || [],
  groupIds: data.groupIds || [],
});

/**
 * تحويل بيانات إنشاء/تحديث مجموعة
 */
export const mapGroupFormToBackend = (data: GroupFormData) => ({
  name: data.name,
  description: data.description || null,
  color: data.color || "#1a56db",
  icon: data.icon || null,
  contactIds: data.contactIds || [],
});

/**
 * تحويل بيانات إنشاء/تحديث حدث
 */
export const mapEventFormToBackend = (data: EventFormData) => ({
  title: data.title,
  description: data.description || null,
  type: mapEventTypeToNumber(data.type),
  status: mapEventStatusToNumber(data.status),
  coverImage: data.coverImage || null,
  requireLogin: data.settings?.requireAuth || data.settings?.requireLogin || false,
  allowAnonymous: data.settings?.allowAnonymous ?? true,
  allowMultipleResponses: data.settings?.allowMultipleResponses || false,
  allowEditResponses: data.settings?.allowEdit || false,
  showResults: data.settings?.showResults || false,
  showCorrectAnswers: data.settings?.showCorrectAnswers || false,
  shuffleQuestions: data.settings?.shuffleQuestions || false,
  timeLimitMinutes: data.settings?.timeLimit || null,
  passingScore: data.settings?.passingScore || null,
  startDate: data.settings?.startDate || null,
  endDate: data.settings?.endDate || null,
  // إعدادات المسابقة
  competitionMode: data.settings?.competitionMode || null,
  winnersCount: data.settings?.winnersCount || 1,
  qualifyingScore: data.settings?.qualifyingScore || null,
});

/**
 * تحويل نوع السؤال من نص إلى رقم
 * Frontend QuestionType → Backend ComponentType Enum
 *
 * Backend Enum الجديد:
 * - SingleChoice=1, MultipleChoice=2, ShortText=3, LongText=4, Rating=5
 * - LinearScale=6, Date=7, Time=8, Number=9, Dropdown=10, YesNo=11
 * - Email=12, Phone=13, ChoiceGrid=14
 */
const mapQuestionTypeToNumber = (questionType: string): number => {
  const types: Record<string, number> = {
    "single_choice": 1,
    "multiple_choice": 2,
    "short_text": 3,
    "long_text": 4,
    // Rating handled separately as component type
    "linear_scale": 6,
    "date": 7,
    "time": 8,
    "number": 9,
    "dropdown": 10,
    "yes_no": 11,
    "email": 12,
    "phone": 13,
    "choice_grid": 14,
  };
  return types[questionType] || 3; // Default to short_text
};

/**
 * تحويل نوع المكون (Component Type) من Frontend إلى Backend
 * يشمل جميع أنواع المكونات وليس فقط الأسئلة
 */
const mapComponentTypeToNumber = (component: import("@/types/component").Component): number => {
  const settings = component.settings as any;

  switch (component.type) {
    case "question":
      return mapQuestionTypeToNumber(settings.questionType || "short_text");

    case "rating":
      return 5; // Rating = 5

    case "pdf_upload":
      return 41; // PdfUpload = 41

    case "image_upload":
      return 42; // ImageUpload = 42

    case "video_upload":
      return 43; // VideoUpload = 43

    case "signature":
      return 50; // Signature = 50

    case "table":
      return 51; // Table = 51

    case "link":
      return 52; // Link = 52

    case "text":
      return 21; // Paragraph = 21

    case "display":
      // Display type depends on displayType setting
      const displayType = settings.displayType;
      if (displayType === "image") return 22; // DisplayImage = 22
      if (displayType === "pdf") return 26; // DisplayPdf = 26
      if (displayType === "link") return 25; // DisplayLink = 25
      return 22; // Default to DisplayImage

    default:
      return 3; // Default to ShortText
  }
};

/**
 * تحويل المكون من Frontend إلى Backend
 * يدعم جميع أنواع المكونات مع حفظ الإعدادات الخاصة بكل نوع في styleJson
 */
export const mapComponentToBackend = (component: import("@/types/component").Component, order: number) => {
  const settings = component.settings as any;

  // القيم الأساسية المشتركة
  let optionsJson: string | null = null;
  let correctAnswerJson: string | null = null;
  let styleJson: string | null = null;
  let mediaUrl: string | null = null;
  let mediaType: string | null = null;
  let minValue: number | null = null;
  let maxValue: number | null = null;

  // معالجة حسب نوع المكون
  switch (component.type) {
    case "question":
      // تحويل الخيارات
      if (settings.choices && settings.choices.length > 0) {
        optionsJson = JSON.stringify(settings.choices.map((c: any) => ({
          id: c.id,
          label: c.label,
          value: c.value,
        })));
      }
      // تحويل الإجابة الصحيحة
      if (settings.correctAnswer !== undefined) {
        correctAnswerJson = JSON.stringify(settings.correctAnswer);
      }
      // للمقياس الخطي
      minValue = settings.scaleMin || null;
      maxValue = settings.scaleMax || null;
      break;

    case "rating":
      maxValue = settings.maxRating || 5;
      styleJson = JSON.stringify({
        ratingType: settings.ratingType || "stars",
        emojiSet: settings.emojiSet,
      });
      break;

    case "signature":
      styleJson = JSON.stringify({
        width: settings.width || 500,
        height: settings.height || 200,
        penColor: settings.penColor || "#000000",
        penWidth: settings.penWidth || 2,
      });
      break;

    case "pdf_upload":
    case "image_upload":
    case "video_upload":
      styleJson = JSON.stringify({
        maxFileSize: settings.maxFileSize || 10,
        acceptedFileTypes: settings.acceptedFileTypes || [],
        allowMultiple: settings.allowMultiple || false,
        maxFiles: settings.maxFiles || 1,
      });
      break;

    case "table":
      styleJson = JSON.stringify({
        tableType: settings.tableType || "simple",
        columns: settings.columns || [],
        rowCount: settings.rowCount || 3,
        tableData: settings.tableData || {},
        calculations: settings.calculations || [],
      });
      break;

    case "link":
      styleJson = JSON.stringify({
        validateUrl: settings.validateUrl ?? true,
      });
      break;

    case "text":
      styleJson = JSON.stringify({
        content: settings.content || "",
        fontSize: settings.fontSize || "medium",
        textAlign: settings.textAlign || "right",
        textColor: settings.textColor,
        backgroundColor: settings.backgroundColor,
      });
      break;

    case "display":
      mediaUrl = settings.imageUrl || settings.pdfUrl || settings.linkUrl || null;
      mediaType = settings.displayType || "image";
      styleJson = JSON.stringify({
        displayType: settings.displayType,
        imageUrl: settings.imageUrl,
        imageAlt: settings.imageAlt,
        pdfUrl: settings.pdfUrl,
        pdfFileName: settings.pdfFileName,
        linkUrl: settings.linkUrl,
        linkText: settings.linkText,
        openInNewTab: settings.openInNewTab,
      });
      break;
  }

  return {
    type: mapComponentTypeToNumber(component),
    order: order,
    title: settings.label || settings.content?.substring(0, 100) || null,
    description: settings.description || null,
    placeholder: settings.placeholder || null,
    isRequired: settings.required || false,
    isVisible: true,
    optionsJson: optionsJson,
    validationJson: null,
    correctAnswerJson: correctAnswerJson,
    points: settings.points || null,
    explanation: null,
    minValue: minValue,
    maxValue: maxValue,
    minLabel: settings.scaleMinLabel || settings.minLabel || null,
    maxLabel: settings.scaleMaxLabel || settings.maxLabel || null,
    mediaUrl: mediaUrl,
    mediaType: mediaType,
    styleJson: styleJson,
  };
};

/**
 * تحويل القسم من Frontend إلى Backend
 */
export const mapSectionToBackend = (section: import("@/types/section").Section, order: number) => ({
  title: section.title,
  description: section.description || null,
  order: order,
  isVisible: section.settings?.visible ?? true,
  components: section.components?.map((comp, idx) => mapComponentToBackend(comp, idx)) || [],
});

/**
 * تحويل الحدث الكامل مع الأقسام والمكونات للـ Backend
 * يُستخدم مع endpoint /Events/with-sections
 */
export const mapEventWithSectionsToBackend = (event: Event) => ({
  title: event.title,
  description: event.description || null,
  type: mapEventTypeToNumber(event.type),
  status: mapEventStatusToNumber(event.status), // إرسال حالة الحدث للـ Backend
  coverImage: event.coverImage || null,
  themeColor: event.settings?.themeColor || null,
  language: event.settings?.language || "ar",
  startDate: event.startDate || null,
  endDate: event.endDate || null,
  timeLimitMinutes: event.settings?.timeLimit || null,
  requireLogin: event.settings?.requireAuth || event.settings?.requireLogin || false,
  allowAnonymous: event.settings?.allowAnonymous ?? true,
  maxResponses: event.settings?.maxResponses || null,
  allowMultipleResponses: event.settings?.allowMultipleResponses || false,
  allowEditResponses: event.settings?.allowEdit || false,
  showResults: event.settings?.showResults || false,
  showCorrectAnswers: event.settings?.showCorrectAnswers || false,
  shuffleQuestions: event.settings?.shuffleQuestions || false,
  shuffleOptions: event.settings?.shuffleOptions || false,
  passingScore: event.settings?.passingScore || null,
  thankYouMessage: event.settings?.thankYouMessage || null,
  successMessage: event.settings?.successMessage || null,
  goodMessage: event.settings?.goodMessage || null,
  improvementMessage: event.settings?.improvementMessage || null,
  // إعدادات الحدث الخاص
  isPrivate: event.settings?.isPrivate || false,
  allowedEmails: event.settings?.allowedEmails || null,
  // إعدادات المسابقة
  competitionMode: event.settings?.competitionMode || null,
  winnersCount: event.settings?.winnersCount || 1,
  qualifyingScore: event.settings?.qualifyingScore || null,
  sections: event.sections?.map((section, idx) => mapSectionToBackend(section, idx)) || [],
});

// ============================================================
// Response DTOs و Mappers
// ============================================================

import { Response, ComponentAnswer, ParticipantInfo, ResponseStatus } from "@/types/response";

/**
 * الرد من Backend
 */
export interface BackendResponseDto {
  id: string;
  status: number; // ResponseStatus enum: Started=1, InProgress=2, Completed=3, Abandoned=4
  respondentName: string | null;
  respondentEmail: string | null;
  respondentPhone: string | null;
  answersJson: string;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
  score: number | null;
  totalPoints: number | null;
  percentage: number | null;
  isPassed: boolean | null;
  currentSectionIndex: number;
  eventId: string;
  createdAt: string;
}

/**
 * تحويل حالة الرد من رقم إلى نص
 * Backend Enum: Started=1, InProgress=2, Completed=3, Abandoned=4
 */
const mapResponseStatus = (status: number): ResponseStatus => {
  const statuses: Record<number, ResponseStatus> = {
    1: "in_progress",   // Started - بدأ (نعتبره in_progress)
    2: "in_progress",   // InProgress - قيد التقدم
    3: "completed",     // Completed - مكتمل
    4: "abandoned",     // Abandoned - متروك
  };
  return statuses[status] || "in_progress";
};

/**
 * تحويل الرد من Backend إلى Frontend
 */
export const mapResponse = (backend: BackendResponseDto): Response => {
  // Parse answers from JSON
  let answers: ComponentAnswer[] = [];
  if (backend.answersJson) {
    try {
      const parsedAnswers = JSON.parse(backend.answersJson);
      // Transform from object { componentId: answer } to array
      if (typeof parsedAnswers === "object" && !Array.isArray(parsedAnswers)) {
        answers = Object.entries(parsedAnswers).map(([componentId, answer]) => {
          // Parse the answer if it's a JSON string (double-encoded from backend)
          let parsedAnswer = answer;
          if (typeof answer === "string") {
            try {
              parsedAnswer = JSON.parse(answer);
            } catch {
              // Not JSON, keep as string (for simple text answers)
              parsedAnswer = answer;
            }
          }

          return {
            componentId,
            componentType: "unknown", // Will be determined by UI
            answer: parsedAnswer as any,
            timeSpent: 0,
            answeredAt: backend.createdAt,
          };
        });
      } else if (Array.isArray(parsedAnswers)) {
        answers = parsedAnswers;
      }
    } catch (e) {
      console.warn("Failed to parse answersJson:", e);
    }
  }

  // Build participant info
  const participant: ParticipantInfo = {
    name: backend.respondentName || undefined,
    email: backend.respondentEmail || undefined,
    phone: backend.respondentPhone || undefined,
  };

  // Build score if available
  const score = backend.score !== null && backend.totalPoints !== null ? {
    totalPoints: backend.totalPoints,
    earnedPoints: backend.score,
    percentage: backend.percentage || 0,
    passed: backend.isPassed || false,
  } : undefined;

  // Calculate time spent
  const timeSpent = backend.durationSeconds || 0;

  return {
    id: backend.id,
    eventId: backend.eventId,
    participant,
    answers,
    status: mapResponseStatus(backend.status),
    timeSpent,
    score,
    progress: backend.status === 3 ? 100 : (backend.currentSectionIndex * 10), // Estimate progress (3 = Completed)
    metadata: {
      device: "desktop", // Default - not stored in backend
      browser: "Unknown",
      os: "Unknown",
      language: "ar",
      sessionId: backend.id,
    },
    startedAt: backend.startedAt,
    completedAt: backend.completedAt || undefined,
    lastUpdatedAt: backend.completedAt || backend.startedAt,
  };
};

/**
 * تحويل إجابات القسم من Frontend إلى Backend
 */
export const mapSectionAnswersToBackend = (answers: ComponentAnswer[]): Array<{
  componentId: string;
  answerJson: string;
}> => {
  return answers.map(answer => ({
    componentId: answer.componentId,
    answerJson: JSON.stringify(answer.answer),
  }));
};

/**
 * تحويل طلب بدء الاستجابة من Frontend إلى Backend
 */
export const mapResponseToBackendStart = (participantInfo?: ParticipantInfo) => ({
  respondentName: participantInfo?.name || null,
  respondentEmail: participantInfo?.email || null,
  respondentPhone: participantInfo?.phone || null,
});

// ============================================================
// تحويل المشاركات
// ============================================================

import { ParticipatedEvent, ParticipationDetails, ParticipationSection, ParticipationComponent } from "@/types/participation";

/** المشاركة من Backend */
export interface BackendParticipationDto {
  responseId: string;
  eventId: string;
  eventTitle: string;
  eventDescription: string | null;
  eventType: number;
  ownerName: string;
  participatedAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
  status: number;
  score: number | null;
  totalPoints: number | null;
  percentage: number | null;
  isPassed: boolean | null;
  answersJson: string;
}

/** تفاصيل المشاركة من Backend */
export interface BackendParticipationDetailsDto extends BackendParticipationDto {
  sections: BackendParticipationSectionDto[];
}

/** قسم في تفاصيل المشاركة من Backend */
export interface BackendParticipationSectionDto {
  id: string;
  title: string;
  description: string | null;
  order: number;
  components: BackendParticipationComponentDto[];
}

/** مكون في تفاصيل المشاركة من Backend */
export interface BackendParticipationComponentDto {
  id: string;
  type: number;
  order: number;
  settingsJson: string;
}

/**
 * تحويل المشاركة من Backend إلى Frontend
 */
export const mapParticipation = (backend: BackendParticipationDto): ParticipatedEvent => {
  let answers: Record<string, any> = {};
  try {
    answers = JSON.parse(backend.answersJson || "{}");
  } catch {
    answers = {};
  }

  return {
    responseId: backend.responseId,
    eventId: backend.eventId,
    eventTitle: backend.eventTitle,
    eventDescription: backend.eventDescription || undefined,
    eventType: mapEventType(backend.eventType),
    ownerName: backend.ownerName,
    participatedAt: backend.participatedAt,
    completedAt: backend.completedAt || undefined,
    durationSeconds: backend.durationSeconds || undefined,
    status: mapResponseStatusFromBackend(backend.status),
    score: backend.score || undefined,
    totalPoints: backend.totalPoints || undefined,
    percentage: backend.percentage || undefined,
    isPassed: backend.isPassed || undefined,
    answers,
  };
};

/**
 * تحويل تفاصيل المشاركة من Backend إلى Frontend
 */
export const mapParticipationDetails = (backend: BackendParticipationDetailsDto): ParticipationDetails => {
  const base = mapParticipation(backend);

  return {
    ...base,
    sections: backend.sections.map(section => ({
      id: section.id,
      title: section.title,
      description: section.description || undefined,
      order: section.order,
      components: section.components.map(comp => {
        let settings: any = {};
        try {
          settings = JSON.parse(comp.settingsJson || "{}");
        } catch {
          settings = {};
        }

        // تحويل نوع المكون من رقم إلى نص
        const typeInfo = mapComponentType(comp.type);

        return {
          id: comp.id,
          type: typeInfo.componentType,
          order: comp.order,
          settings,
        };
      }),
    })),
  };
};

/**
 * تحويل حالة الرد من Backend (number) إلى Frontend (string)
 */
const mapResponseStatusFromBackend = (status: number): "in_progress" | "completed" | "abandoned" => {
  switch (status) {
    case 1: return "in_progress";
    case 2: return "completed";
    case 3: return "abandoned";
    default: return "in_progress";
  }
};

// ============================================================
// Collaboration DTOs & Mappers
// ============================================================

/** متعاون من Backend */
export interface BackendCollaboratorDto {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userProfileImage: string | null;
  role: number;
  roleName: string;
  addedAt: string;
}

/** نتيجة بحث مستخدم من Backend */
export interface BackendUserSearchResultDto {
  id: string;
  fullName: string;
  email: string;
  profileImage: string | null;
}

/** حدث مشترك من Backend */
export interface BackendSharedEventListItemDto extends BackendEventListItemDto {
  ownerName: string;
  myRole: number;
  myRoleName: string;
}

/**
 * تحويل رقم الدور إلى نص
 */
const mapCollaboratorRole = (role: number): CollaboratorRole => {
  const roles: Record<number, CollaboratorRole> = {
    1: "viewer",
    2: "editor",
  };
  return roles[role] || "viewer";
};

/**
 * تحويل المتعاون من Backend إلى Frontend
 */
export const mapCollaborator = (backend: BackendCollaboratorDto): Collaborator => ({
  id: backend.id,
  userId: backend.userId,
  userName: backend.userName,
  userEmail: backend.userEmail,
  userProfileImage: backend.userProfileImage || undefined,
  role: mapCollaboratorRole(backend.role),
  roleName: backend.roleName,
  addedAt: backend.addedAt,
});

/**
 * تحويل نتيجة البحث عن مستخدم
 */
export const mapUserSearchResult = (backend: BackendUserSearchResultDto): UserSearchResult => ({
  id: backend.id,
  fullName: backend.fullName,
  email: backend.email,
  profileImage: backend.profileImage || undefined,
});

/**
 * تحويل حدث مشترك من Backend إلى Frontend
 */
export const mapSharedEventListItem = (backend: BackendSharedEventListItemDto): SharedEvent => ({
  ...mapEventListItem(backend),
  ownerName: backend.ownerName,
  myRole: mapCollaboratorRole(backend.myRole),
  myRoleName: backend.myRoleName,
});


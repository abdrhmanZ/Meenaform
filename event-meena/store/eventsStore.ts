/**
 * Zustand Store لإدارة الأحداث
 * مربوط بـ Backend API
 */

import { create } from "zustand";
import { Event, EventFormData, EventsState, EventStatus, EventType } from "@/types/event";
import { eventsService } from "@/lib/api/services/eventsService";
import { ApiError } from "@/lib/api/client";

// متغير خارجي لمنع الاستدعاءات المتكررة (deduplication)
let pendingFetchEvents: Promise<void> | null = null;
// ✅ flag لتتبع هل جلبنا الأحداث قبل كده ولا لأ (يشتغل حتى لو 0 أحداث)
let hasFetchedEvents = false;

export const useEventsStore = create<EventsState>((set, get) => ({
  events: [],
  currentEvent: null,
  isLoading: false,
  error: null,

  filters: {
    search: "",
    status: "all",
    type: "all",
    sortBy: "createdAt",
    sortOrder: "desc",
  },

  // جلب جميع الأحداث - متصل بـ Backend API
  // ✅ نفس نمط مشاركاتي: لو جلبنا قبل كده نرجع فوراً بدون API call
  fetchEvents: async (force?: boolean) => {
    if (hasFetchedEvents && !force) {
      return;
    }

    // لو فيه طلب شغال، ننتظره
    if (pendingFetchEvents) {
      await pendingFetchEvents;
      return;
    }

    set({ isLoading: true, error: null });

    pendingFetchEvents = (async () => {
      try {
        const events = await eventsService.getAll();
        hasFetchedEvents = true;
        set({ events, isLoading: false });
      } catch (error) {
        const errorMessage =
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : "حدث خطأ أثناء جلب الأحداث";
        set({
          error: errorMessage,
          isLoading: false,
        });
      } finally {
        pendingFetchEvents = null;
      }
    })();

    await pendingFetchEvents;
  },

  // جلب حدث بواسطة ID - متصل بـ Backend API
  // يستخدم /full endpoint لجلب الأقسام والمكونات
  fetchEventById: async (id: string) => {
    set({ isLoading: true, error: null, currentEvent: null });
    try {
      // استخدام getFullDetails بدلاً من getById لجلب الأقسام والمكونات
      const event = await eventsService.getFullDetails(id);
      set({ currentEvent: event, isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "حدث خطأ أثناء جلب الحدث";
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  // جلب حدث بواسطة رمز المشاركة (للمشاركين) - Public endpoint
  fetchEventByShareCode: async (shareCode: string) => {
    set({ isLoading: true, error: null });
    try {
      const event = await eventsService.getByShareCode(shareCode);
      set({ currentEvent: event, isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "حدث خطأ أثناء جلب الحدث";
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  // جلب حدث للمعاينة (Public - بدون التحقق من الحالة)
  fetchEventForPreview: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const event = await eventsService.getForPreview(id);
      set({ currentEvent: event, isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "حدث خطأ أثناء جلب الحدث للمعاينة";
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  // إنشاء حدث جديد - متصل بـ Backend API
  // يستخدم createWithSections لحفظ الحدث مع الأقسام والمكونات
  createEvent: async (data: Event | EventFormData) => {
    set({ isLoading: true, error: null });
    try {
      let newEvent: Event;

      // إذا كان الحدث يحتوي على أقسام، استخدم createWithSections
      if ('sections' in data && data.sections && data.sections.length > 0) {
        newEvent = await eventsService.createWithSections(data as Event);
      } else {
        // وإلا استخدم create العادي
        newEvent = await eventsService.create(data as EventFormData);
      }

      set((state) => ({
        events: [newEvent, ...state.events],
        isLoading: false,
      }));

      return newEvent;
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "حدث خطأ أثناء إنشاء الحدث";
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  // تحديث حدث - متصل بـ Backend API
  // يستخدم updateWithSections إذا كان الحدث يحتوي على أقسام
  updateEvent: async (id: string, data: Partial<EventFormData>) => {
    set({ isLoading: true, error: null });
    try {
      let updatedEvent: Event;

      // إذا كان الحدث يحتوي على أقسام، استخدم updateWithSections
      if ('sections' in data && data.sections && Array.isArray(data.sections) && data.sections.length > 0) {
        updatedEvent = await eventsService.updateWithSections(id, data as Event);
      } else {
        updatedEvent = await eventsService.update(id, data);
      }

      set((state) => ({
        events: state.events.map((e) => (e.id === id ? updatedEvent : e)),
        currentEvent:
          state.currentEvent?.id === id ? updatedEvent : state.currentEvent,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "حدث خطأ أثناء تحديث الحدث";
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  // حذف حدث - متصل بـ Backend API
  deleteEvent: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await eventsService.delete(id);

      set((state) => ({
        events: state.events.filter((e) => e.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "حدث خطأ أثناء حذف الحدث";
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  // نسخ حدث - متصل بـ Backend API
  duplicateEvent: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const duplicatedEvent = await eventsService.duplicate(id);

      set((state) => ({
        events: [duplicatedEvent, ...state.events],
        isLoading: false,
      }));

      return duplicatedEvent;
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "حدث خطأ أثناء نسخ الحدث";
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  // أرشفة حدث - متصل بـ Backend API (تحديث الحالة إلى archived)
  archiveEvent: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      // استخدام updateStatus لتغيير الحالة إلى archived دون فقدان البيانات
      const updatedEvent = await eventsService.updateStatus(id, "archived");

      set((state) => ({
        events: state.events.map((e) =>
          e.id === id ? updatedEvent : e
        ),
        currentEvent:
          state.currentEvent?.id === id ? updatedEvent : state.currentEvent,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "حدث خطأ أثناء أرشفة الحدث";
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  // تغيير حالة الحدث - متصل بـ Backend API
  // يستخدم PATCH endpoint لتحديث الحالة فقط دون المساس بالبيانات الأخرى
  updateEventStatus: async (id: string, status: EventStatus) => {
    set({ isLoading: true, error: null });
    try {
      // استخدام updateStatus بدلاً من update لتجنب فقدان البيانات
      const updatedEvent = await eventsService.updateStatus(id, status);

      set((state) => ({
        events: state.events.map((e) => (e.id === id ? updatedEvent : e)),
        currentEvent:
          state.currentEvent?.id === id ? updatedEvent : state.currentEvent,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "حدث خطأ أثناء تحديث حالة الحدث";
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  // إنشاء حدث من الصفر - يستخدم createEvent
  createEventFromScratch: async (data) => {
    // تحويل البيانات إلى EventFormData
    const eventData: EventFormData = {
      title: data.title,
      description: data.description,
      type: data.type,
      status: "draft",
      coverImage: data.coverImage,
      settings: {},
    };
    return get().createEvent(eventData);
  },

  // تحديث إعدادات الحدث - يستخدم updateEvent
  updateEventSettings: async (id: string, settings) => {
    return get().updateEvent(id, { settings });
  },

  // نشر حدث - متصل بـ Backend API
  publishEvent: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const publishedEvent = await eventsService.publish(id);

      set((state) => ({
        events: state.events.map((e) =>
          e.id === id ? publishedEvent : e
        ),
        currentEvent:
          state.currentEvent?.id === id ? publishedEvent : state.currentEvent,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "حدث خطأ أثناء نشر الحدث";
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  // تعيين البحث
  setSearch: (search: string) => {
    set((state) => ({
      filters: { ...state.filters, search },
    }));
  },

  // تعيين فلتر الحالة
  setStatusFilter: (status: EventStatus | "all") => {
    set((state) => ({
      filters: { ...state.filters, status },
    }));
  },

  // تعيين فلتر النوع
  setTypeFilter: (type: EventType | "all") => {
    set((state) => ({
      filters: { ...state.filters, type },
    }));
  },

  // تعيين الترتيب
  setSortBy: (sortBy: "createdAt" | "updatedAt" | "title" | "responses") => {
    set((state) => ({
      filters: { ...state.filters, sortBy },
    }));
  },

  // تعيين اتجاه الترتيب
  setSortOrder: (sortOrder: "asc" | "desc") => {
    set((state) => ({
      filters: { ...state.filters, sortOrder },
    }));
  },

  // مسح الفلاتر
  clearFilters: () => {
    set({
      filters: {
        search: "",
        status: "all",
        type: "all",
        sortBy: "createdAt",
        sortOrder: "desc",
      },
    });
  },

  // الحصول على الأحداث المفلترة
  getFilteredEvents: () => {
    const { events, filters } = get();

    let filtered = [...events];

    // إخفاء الأحداث المؤرشفة تلقائياً (إلا إذا طلب المستخدم عرضها بشكل صريح)
    if (filters.status !== "archived") {
      filtered = filtered.filter((e) => e.status !== "archived");
    }

    // فلترة حسب البحث
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(searchLower) ||
          e.description.toLowerCase().includes(searchLower)
      );
    }

    // فلترة حسب الحالة (بعد إخفاء المؤرشفة)
    if (filters.status !== "all" && filters.status !== "archived") {
      filtered = filtered.filter((e) => e.status === filters.status);
    }

    // فلترة حسب النوع
    if (filters.type !== "all") {
      filtered = filtered.filter((e) => e.type === filters.type);
    }

    // الترتيب
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (filters.sortBy) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "responses":
          aValue = a.stats.totalResponses;
          bValue = b.stats.totalResponses;
          break;
        case "updatedAt":
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case "createdAt":
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }

      if (filters.sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  },
}));


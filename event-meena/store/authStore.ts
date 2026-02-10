/**
 * Zustand Store لإدارة حالة المصادقة
 * مربوط بـ Backend API
 */

import { create } from "zustand";
import { AuthState, LoginData, SignupData, UpdateProfileData } from "@/types/auth";
import { authService } from "@/lib/api/services/authService";
import { tokenManager } from "@/lib/api/client";
import { ApiError } from "@/lib/api/client";

// متغير خارجي لمنع الاستدعاءات المتكررة (deduplication)
let pendingAuthCheck: Promise<void> | null = null;

// ✅ Optimistic Auth: لو التوكن موجود، نعتبر المستخدم مسجل مؤقتاً
const hasToken = typeof window !== "undefined" && !!localStorage.getItem("event_meena_access_token");

// إنشاء Store
export const useAuthStore = create<AuthState>((set, get) => ({
  // الحالة الأولية - Optimistic: لو التوكن موجود نعرض الصفحة فوراً
  user: null,
  token: hasToken ? localStorage.getItem("event_meena_access_token") : null,
  isAuthenticated: hasToken, // ✅ نثق بالتوكن مؤقتاً - لو انتهى checkAuth يصححه
  isLoading: !hasToken, // ✅ loading فقط لو ما فيه توكن أصلاً
  error: null,

  // تسجيل الدخول - متصل بـ Backend API
  login: async (data: LoginData) => {
    set({ isLoading: true, error: null });

    try {
      const result = await authService.login(data);

      set({
        user: result.user,
        token: result.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      // استخراج رسالة الخطأ
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "حدث خطأ أثناء تسجيل الدخول";

      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  // إنشاء حساب جديد - متصل بـ Backend API
  signup: async (data: SignupData) => {
    set({ isLoading: true, error: null });

    try {
      const result = await authService.register(data);

      set({
        user: result.user,
        token: result.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      // استخراج رسالة الخطأ
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "حدث خطأ أثناء إنشاء الحساب";

      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  // تسجيل الخروج - متصل بـ Backend API
  logout: async () => {
    set({ isLoading: true });

    try {
      await authService.logout();
    } finally {
      // مسح الحالة في جميع الحالات (حتى لو فشل الطلب)
      pendingAuthCheck = null;
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  // التحقق من الجلسة الحالية - متصل بـ Backend API
  // محسّن: يستخدم الـ cache لو المستخدم موجود + يمنع الاستدعاءات المتكررة
  checkAuth: async () => {
    // التحقق من وجود توكن محفوظ
    if (!tokenManager.hasValidToken()) {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      return;
    }

    // ✅ لو المستخدم موجود في الـ store، لا نحتاج API call
    const state = get();
    if (state.user && state.isAuthenticated) {
      if (state.isLoading) {
        set({ isLoading: false });
      }
      return;
    }

    // ✅ لو فيه طلب شغال، ننتظره بدل ما نرسل طلب جديد (deduplication)
    if (pendingAuthCheck) {
      await pendingAuthCheck;
      return;
    }

    // ✅ لا نغير isLoading لو isAuthenticated = true (optimistic)
    // عشان ما نسبب flash لـ "جاري التحقق من الجلسة"
    if (!get().isAuthenticated) {
      set({ isLoading: true });
    }

    // إنشاء promise واحد ومشاركته
    pendingAuthCheck = (async () => {
      try {
        // جلب بيانات المستخدم من الـ API
        const user = await authService.getCurrentUser();
        const token = tokenManager.getAccessToken();

        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch {
        // فشل التحقق - مسح التوكن والحالة
        tokenManager.clearTokens();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      } finally {
        pendingAuthCheck = null;
      }
    })();

    await pendingAuthCheck;
  },

  // تحديث الملف الشخصي - متصل بـ Backend API
  updateProfile: async (data: UpdateProfileData) => {
    set({ isLoading: true, error: null });

    try {
      const updatedUser = await authService.updateProfile(data);

      set({
        user: updatedUser,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "حدث خطأ أثناء تحديث الملف الشخصي";

      set({
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  // مسح الأخطاء
  clearError: () => {
    set({ error: null });
  },
}));

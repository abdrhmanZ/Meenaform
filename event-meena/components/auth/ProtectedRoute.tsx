"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { tokenManager } from "@/lib/api/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const hasChecked = useRef(false);

  // ✅ تحقق مباشر من localStorage - يشتغل حتى في أول render بعد SSR
  const hasToken = tokenManager.hasValidToken();

  useEffect(() => {
    // التحقق من الجلسة في الخلفية (مرة واحدة فقط)
    if (!hasChecked.current) {
      hasChecked.current = true;
      checkAuth();
    }
  }, [checkAuth]);

  useEffect(() => {
    // إعادة التوجيه إلى صفحة تسجيل الدخول إذا لم يكن مسجلاً
    if (!isLoading && !isAuthenticated && !hasToken) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, hasToken, router]);

  // ✅ Optimistic: لو التوكن موجود أو المستخدم مسجل، اعرض المحتوى فوراً
  // checkAuth يشتغل في الخلفية - لو التوكن انتهى يعمل redirect
  if (isAuthenticated || hasToken) {
    return <>{children}</>;
  }

  // ⏳ ما فيه توكن أصلاً - ننتظر checkAuth يخلص
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">جاري التحقق من الجلسة...</p>
        </div>
      </div>
    );
  }

  // في حالة عدم المصادقة وعدم التحميل (سيتم التوجيه للـ login)
  return null;
}


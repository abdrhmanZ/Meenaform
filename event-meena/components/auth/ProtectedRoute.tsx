"use client";

import { useEffect, useRef, useState } from "react";
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
  // ✅ نبدأ بـ false عشان السيرفر والـ client يكونوا متطابقين (no hydration mismatch)
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    // تحقق من التوكن فوراً على الـ client
    setHasToken(tokenManager.hasValidToken());

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
  if (isAuthenticated || hasToken) {
    return <>{children}</>;
  }

  // ⏳ ننتظر checkAuth يخلص
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
        <p className="text-gray-600">جاري التحقق من الجلسة...</p>
      </div>
    </div>
  );
}


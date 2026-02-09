"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const hasChecked = useRef(false);

  useEffect(() => {
    // التحقق من الجلسة مرة واحدة فقط عند تحميل المكون
    if (!hasChecked.current) {
      hasChecked.current = true;
      checkAuth();
    }
  }, [checkAuth]);

  useEffect(() => {
    // إعادة التوجيه إلى صفحة تسجيل الدخول إذا لم يكن مسجلاً
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // ✅ لو المستخدم مسجل دخول، اعرض المحتوى فوراً بدون loading
  if (isAuthenticated && !isLoading) {
    return <>{children}</>;
  }

  // عرض Loading أثناء التحقق الأولي فقط
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


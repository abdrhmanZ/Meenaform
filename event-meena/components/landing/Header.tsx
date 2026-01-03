"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, LayoutDashboard, ChevronDown } from "lucide-react";
import Image from "next/image";
import { useAuthStore } from "@/store/authStore";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isAuthenticated, logout, checkAuth } = useAuthStore();

  // التحقق من الجلسة عند تحميل المكون
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    router.push("/");
  };

  // تحديد ما إذا كنا في الصفحة الرئيسية أم لا
  const isHomePage = pathname === "/";

  // إنشاء الروابط بناءً على الصفحة الحالية
  const navigation = [
    { name: "الرئيسية", href: isHomePage ? "#home" : "/#home" },
    { name: "المميزات", href: isHomePage ? "#features" : "/#features" },
    { name: "كيف يعمل", href: isHomePage ? "#how-it-works" : "/#how-it-works" },
    { name: "من نحن", href: "/about" },
  ];

  return (
    <header className="fixed top-0 right-0 left-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* الشعار */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2.5 group">
              <Image
                src="/logo.png"
                alt="مينا إيفنت"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <span className="text-2xl font-bold text-gray-900">
                مينا <span className="text-[#1a56db]">إيفنت</span>
              </span>
            </Link>
          </div>

          {/* القائمة - Desktop */}
          <div className="hidden lg:flex items-center gap-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-[#1a56db] font-medium transition-colors duration-200 relative group"
              >
                {item.name}
                <span className="absolute bottom-0 right-0 w-0 h-0.5 bg-[#1a56db] group-hover:w-full transition-all duration-300"></span>
              </Link>
            ))}
          </div>

          {/* الأزرار / قائمة المستخدم - Desktop */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated && user ? (
              // قائمة المستخدم
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-[#1a56db] text-white flex items-center justify-center font-semibold">
                    {user.name.charAt(0)}
                  </div>
                  <span className="text-gray-700 font-medium">{user.name}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {/* القائمة المنسدلة */}
                {userMenuOpen && (
                  <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      <span>لوحة التحكم</span>
                    </Link>
                    <hr className="my-2 border-gray-200" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors w-full"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>تسجيل الخروج</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // أزرار تسجيل الدخول والتسجيل
              <>
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-[#1a56db] font-medium px-4 py-2 transition-colors"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/signup"
                  className="bg-[#1a56db] hover:bg-[#1648c7] text-white rounded-xl px-6 py-2.5 font-medium transition-colors duration-200"
                >
                  ابدأ الآن مجاناً
                </Link>
              </>
            )}
          </div>

          {/* زر القائمة - Mobile */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* القائمة - Mobile */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200 animate-in slide-in-from-top duration-300">
            <div className="flex flex-col gap-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 hover:text-[#1a56db] font-medium transition-colors duration-200 py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              <div className="flex flex-col gap-2 pt-4 border-t border-gray-200">
                {isAuthenticated && user ? (
                  // معلومات المستخدم وأزرار
                  <>
                    <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-[#1a56db] text-white flex items-center justify-center font-semibold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      لوحة التحكم
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      تسجيل الخروج
                    </button>
                  </>
                ) : (
                  // أزرار تسجيل الدخول والتسجيل
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      تسجيل الدخول
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center justify-center px-4 py-2.5 bg-[#1a56db] hover:bg-[#1648c7] text-white rounded-lg font-medium transition-colors"
                    >
                      ابدأ الآن مجاناً
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}


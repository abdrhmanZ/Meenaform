"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  ClipboardList,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

const navItems: NavItem[] = [
  {
    name: "الرئيسية",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "الأحداث",
    href: "/dashboard/events",
    icon: Calendar,
  },
  {
    name: "مشاركاتي",
    href: "/dashboard/participations",
    icon: ClipboardList,
  },
  {
    name: "جهات الاتصال",
    href: "/dashboard/contacts",
    icon: Users,
    badge: 0, // سيتم تحديثه لاحقاً
  },
  {
    name: "القوالب",
    href: "/dashboard/events/templates",
    icon: FileText,
  },
  {
    name: "الإعدادات",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <>
      {/* الشعار */}
      <div className="px-6 py-6 border-b border-gray-200">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image
            src="/logo.png"
            alt="مينا إيفنت"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <div>
            <span className="text-xl font-bold text-gray-900">
              مينا <span className="text-[#1a56db]">إيفنت</span>
            </span>
            <p className="text-xs text-gray-500">منصة الأحداث الذكية</p>
          </div>
        </Link>
      </div>

      {/* القائمة */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300
                ${
                  active
                    ? "bg-[#1a56db] text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100"
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="flex-1 font-medium">{item.name}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`
                  px-2 py-0.5 text-xs font-bold rounded-full
                  ${active ? "bg-white text-[#1a56db]" : "bg-[#1a56db] text-white"}
                `}
                >
                  {item.badge}
                </span>
              )}
              {active && <ChevronRight className="w-4 h-4" />}
            </Link>
          );
        })}
      </nav>

      {/* معلومات المستخدم */}
      <div className="px-4 py-4 border-t border-gray-200">
        {/* بطاقة المستخدم */}
        <div className="bg-gray-50 rounded-lg p-4 mb-3">
          <div className="flex items-center gap-3 mb-3">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 bg-[#1a56db] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {user?.name?.charAt(0) || "م"}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">
                {user?.name || "مستخدم"}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* زر تسجيل الخروج */}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full justify-start gap-3 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">تسجيل الخروج</span>
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6 text-gray-700" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 bg-white border-l border-gray-200 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Sidebar - Mobile */}
      <aside
        className={`
          lg:hidden fixed top-0 right-0 z-40 w-72 h-screen bg-white border-l border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <SidebarContent />
      </aside>
    </>
  );
}


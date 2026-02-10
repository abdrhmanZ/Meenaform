"use client";

import { useEffect, useState, useRef } from "react";
import {
  Calendar,
  BarChart3,
  TrendingUp,
  Target,
} from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useEventsStore } from "@/store/eventsStore";
import { eventsService, DashboardStats } from "@/lib/api/services/eventsService";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import WelcomeCard from "@/components/dashboard/WelcomeCard";
import StatsCard from "@/components/dashboard/StatsCard";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentEventsTable from "@/components/dashboard/RecentEventsTable";
import EventsChart from "@/components/dashboard/EventsChart";
import EventTypesChart from "@/components/dashboard/EventTypesChart";
import LoadingState from "@/components/dashboard/LoadingState";

function DashboardContent() {
  const { events, fetchEvents, isLoading } = useEventsStore();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchEvents();
      // جلب إحصائيات لوحة التحكم من الـ API
      eventsService.getDashboardStats().then((stats) => {
        setDashboardStats(stats);
        setStatsLoading(false);
      });
    }
  }, [fetchEvents]);

  // استخدام البيانات من الـ API إذا كانت متوفرة، وإلا من الـ store
  const totalEvents = dashboardStats?.totalEvents ?? events.length;
  const totalResponses = dashboardStats?.totalResponses ?? events.reduce(
    (sum, event) => sum + event.stats.totalResponses,
    0
  );
  const activeEvents = dashboardStats?.activeEvents ?? events.filter((e) => e.status === "active").length;
  const avgCompletionRate = dashboardStats?.averageCompletionRate ?? (
    events.length > 0
      ? Math.round(
          events.reduce((sum, event) => sum + event.stats.completionRate, 0) /
            events.length
        )
      : 0
  );



  // بيانات الرسم البياني - توزيع الأحداث حسب النوع
  const eventTypeData = [
    {
      name: "استبيان",
      value: events.filter((e) => e.type === "survey").length,
      color: "#1a56db",
    },
    {
      name: "استطلاع",
      value: events.filter((e) => e.type === "poll").length,
      color: "#10b981",
    },
    {
      name: "نموذج",
      value: events.filter((e) => e.type === "form").length,
      color: "#f59e0b",
    },
    {
      name: "اختبار",
      value: events.filter((e) => e.type === "quiz").length,
      color: "#8b5cf6",
    },
  ].filter((item) => item.value > 0);

  // بيانات الرسم البياني - آخر 7 أيام من الـ API أو بيانات افتراضية
  const last7Days = dashboardStats?.dailyStats?.map((day) => ({
    date: new Date(day.date).toLocaleDateString("ar-SA", {
      month: "short",
      day: "numeric",
    }),
    events: day.events,
    responses: day.responses,
  })) ?? Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toLocaleDateString("ar-SA", {
        month: "short",
        day: "numeric",
      }),
      events: 0,
      responses: 0,
    };
  });

  // ✅ اعرض loading فقط لو ما فيه بيانات أصلاً (أول مرة)
  if (isLoading && events.length === 0) {
    return (
      <DashboardLayout title="لوحة التحكم" description="نظرة عامة على أحداثك">
        <LoadingState variant="dashboard" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="لوحة التحكم" description="نظرة عامة على أحداثك">
      <div className="space-y-6">
        {/* بطاقة الترحيب */}
        <WelcomeCard />

        {/* الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="إجمالي الأحداث"
            value={totalEvents}
            icon={Calendar}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          <StatsCard
            title="الأحداث النشطة"
            value={activeEvents}
            icon={TrendingUp}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
          <StatsCard
            title="إجمالي الردود"
            value={totalResponses}
            icon={BarChart3}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
          />
          <StatsCard
            title="معدل الإكمال"
            value={`${Math.round(avgCompletionRate)}%`}
            icon={Target}
            iconColor="text-orange-600"
            iconBgColor="bg-orange-100"
          />
        </div>

        {/* الإجراءات السريعة */}
        <QuickActions />

        {/* الرسوم البيانية */}
        {events.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EventsChart data={last7Days} />
            {eventTypeData.length > 0 && (
              <EventTypesChart data={eventTypeData} />
            )}
          </div>
        )}

        {/* الأحداث الأخيرة */}
        <RecentEventsTable />
      </div>
    </DashboardLayout>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}


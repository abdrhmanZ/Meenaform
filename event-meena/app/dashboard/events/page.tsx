"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useEventsStore } from "@/store/eventsStore";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import EventsPageHeader from "@/components/events/EventsPageHeader";
import EventsFilters from "@/components/events/EventsFilters";
import EventsGrid from "@/components/events/EventsGrid";
import EventsTable from "@/components/events/EventsTable";
import ViewToggle from "@/components/events/ViewToggle";
import DeleteEventDialog from "@/components/events/DeleteEventDialog";
import LoadingState from "@/components/dashboard/LoadingState";
import EmptyState from "@/components/dashboard/EmptyState";
import { Calendar } from "lucide-react";

function EventsPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    fetchEvents,
    getFilteredEvents,
    deleteEvent,
    duplicateEvent,
    archiveEvent,
    isLoading,
    events,
  } = useEventsStore();

  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const filteredEvents = getFilteredEvents();

  const handleDeleteClick = (id: string) => {
    setEventToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;

    try {
      await deleteEvent(eventToDelete);
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const duplicated = await duplicateEvent(id);
      toast({
        title: "تم نسخ الحدث بنجاح",
        description: `تم إنشاء "${duplicated.title}"`,
      });
      // الحدث الجديد سيظهر تلقائياً في القائمة (لا حاجة للتوجيه)
    } catch (error) {
      console.error("Error duplicating event:", error);
      toast({
        title: "خطأ",
        description: "فشل في نسخ الحدث",
        variant: "destructive",
      });
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveEvent(id);
      toast({
        title: "تمت الأرشفة",
        description: "تم أرشفة الحدث بنجاح",
      });
    } catch (error) {
      console.error("Error archiving event:", error);
      toast({
        title: "خطأ",
        description: "فشل في أرشفة الحدث",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <EventsPageHeader />
        <EventsFilters />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingState variant="events" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <EventsPageHeader />

      {/* Filters */}
      <EventsFilters />

      {/* المحتوى */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredEvents.length === 0 && events.length === 0 ? (
          /* Empty State - لا توجد أحداث */
          <EmptyState
            icon={Calendar}
            title="لا توجد أحداث بعد"
            description="ابدأ بإنشاء أول حدث تفاعلي لك الآن"
            actionLabel="إنشاء حدث جديد"
            onAction={() => router.push("/dashboard/events/new")}
          />
        ) : filteredEvents.length === 0 ? (
          /* Empty State - لا توجد نتائج للفلاتر */
          <EmptyState
            icon={Calendar}
            title="لا توجد نتائج"
            description="لم نجد أي أحداث تطابق معايير البحث"
          />
        ) : (
          <>
            {/* أزرار العرض */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">
                  {filteredEvents.length}
                </span>{" "}
                حدث
              </p>
              <ViewToggle view={viewMode} onViewChange={setViewMode} />
            </div>

            {/* عرض الأحداث */}
            {viewMode === "grid" ? (
              <EventsGrid
                events={filteredEvents}
                onDelete={handleDeleteClick}
                onDuplicate={handleDuplicate}
                onArchive={handleArchive}
              />
            ) : (
              <EventsTable
                events={filteredEvents}
                onDelete={handleDeleteClick}
                onDuplicate={handleDuplicate}
                onArchive={handleArchive}
              />
            )}
          </>
        )}
      </div>

      {/* Delete Dialog */}
      <DeleteEventDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        eventTitle={
          events.find((e) => e.id === eventToDelete)?.title || ""
        }
      />
    </DashboardLayout>
  );
}

export default function EventsPage() {
  return (
    <ProtectedRoute>
      <EventsPageContent />
    </ProtectedRoute>
  );
}


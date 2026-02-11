"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useEventsStore } from "@/store/eventsStore";
import { useContactsStore } from "@/store/contactsStore";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import EventDetailsHeader from "@/components/events/EventDetailsHeader";
import EventInfoCard from "@/components/events/EventInfoCard";
import EventQRCode from "@/components/events/EventQRCode";
import EventPublicLink from "@/components/events/EventPublicLink";
import EventSectionsDisplay from "@/components/events/EventSectionsDisplay";
import DeleteEventDialog from "@/components/events/DeleteEventDialog";
import SendEventDialog from "@/components/events/create/SendEventDialog";
import SaveAsTemplateDialog from "@/components/templates/SaveAsTemplateDialog";
import LoadingState from "@/components/dashboard/LoadingState";
import { AlertTriangle, Send, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
// Document Signing Components
import DocumentInfoCard from "@/components/events/document-signing/DocumentInfoCard";
import DocumentFieldsDisplay from "@/components/events/document-signing/DocumentFieldsDisplay";
import { DocumentSigningEvent } from "@/types/document-signing";
import * as documentSigningService from "@/lib/api/services/documentSigningService";

function EventDetailsPageContent() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const eventId = params.id as string;

  const {
    currentEvent,
    fetchEventById,
    deleteEvent,
    duplicateEvent,
    archiveEvent,
    updateEventStatus,
    events,
  } = useEventsStore();

  const { fetchContacts, fetchGroups } = useContactsStore();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [saveAsTemplateDialogOpen, setSaveAsTemplateDialogOpen] = useState(false);
  const [documentSigningEvent, setDocumentSigningEvent] = useState<DocumentSigningEvent | null>(null);

  const hasFetched = useRef(false);

  // ✅ لو الحدث موجود في الـ events list، نعرضه فوراً بدون انتظار
  const cachedEvent = useMemo(
    () => events.find((e) => e.id === eventId),
    [events, eventId]
  );
  const displayEvent = currentEvent?.id === eventId ? currentEvent : cachedEvent || null;

  useEffect(() => {
    if (eventId && !hasFetched.current) {
      hasFetched.current = true;
      fetchEventById(eventId);
      fetchContacts();
      fetchGroups();
    }
  }, [eventId, fetchEventById, fetchContacts, fetchGroups]);

  // تحميل بيانات حدث التوقيع إذا كان النوع document_signing
  useEffect(() => {
    if (currentEvent?.type === "document_signing" && eventId) {
      const loadDocumentSigningEvent = async () => {
        try {
          const docEvent = await documentSigningService.getDocumentEvent(eventId);
          setDocumentSigningEvent(docEvent);
        } catch (error) {
          console.error("❌ Failed to load document signing event:", error);
        }
      };
      loadDocumentSigningEvent();
    }
  }, [currentEvent?.type, eventId]);

  const handleDelete = async () => {
    try {
      await deleteEvent(eventId);
      setDeleteDialogOpen(false);
      router.push("/dashboard/events");
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const handleDuplicate = async () => {
    try {
      const duplicated = await duplicateEvent(eventId);
      toast({
        title: "تم نسخ الحدث بنجاح",
        description: `تم إنشاء "${duplicated.title}"`,
      });
      router.push("/dashboard/events");
    } catch (error) {
      console.error("Error duplicating event:", error);
      toast({
        title: "خطأ",
        description: "فشل في نسخ الحدث",
        variant: "destructive",
      });
    }
  };

  const handleArchive = async () => {
    try {
      await archiveEvent(eventId);
      toast({
        title: "تمت الأرشفة",
        description: "تم أرشفة الحدث بنجاح",
      });
      router.push("/dashboard/events");
    } catch (error) {
      console.error("Error archiving event:", error);
      toast({
        title: "خطأ",
        description: "فشل في أرشفة الحدث",
        variant: "destructive",
      });
    }
  };

  const handlePublish = async () => {
    try {
      await updateEventStatus(eventId, "active");
      toast({
        title: "تم النشر",
        description: "تم نشر الحدث بنجاح وأصبح متاحاً للمشاركين",
      });
    } catch (error) {
      console.error("Error publishing event:", error);
      toast({
        title: "خطأ",
        description: "فشل في نشر الحدث",
        variant: "destructive",
      });
    }
  };

  const handleUnpublish = async () => {
    try {
      await updateEventStatus(eventId, "draft");
      toast({
        title: "تم التحويل",
        description: "تم تحويل الحدث إلى مسودة",
      });
    } catch (error) {
      console.error("Error unpublishing event:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحويل الحدث إلى مسودة",
        variant: "destructive",
      });
    }
  };

  const handleOpenSendDialog = () => {
    setShowSendDialog(true);
  };

  // ✅ نعرض loading بس لو ما فيه أي بيانات للحدث أبداً
  if (!displayEvent) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingState variant="details" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <EventDetailsHeader
        event={displayEvent}
        onDuplicate={handleDuplicate}
        onArchive={handleArchive}
        onDelete={() => setDeleteDialogOpen(true)}
        onShare={handleOpenSendDialog}
        onSaveAsTemplate={() => setSaveAsTemplateDialogOpen(true)}
        onPublish={handlePublish}
        onUnpublish={handleUnpublish}
      />

      {/* المحتوى */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* تنبيه المسودة */}
        {displayEvent.status === "draft" && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-800">هذا الحدث في وضع المسودة</h3>
                <p className="text-sm text-amber-700">
                  يجب نشر الحدث أو إكمال إنشائه ليظهر للمشاركين ويتمكنوا من التفاعل معه
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Event Info & Sections/Fields */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Info - مختلف حسب نوع الحدث */}
            {displayEvent.type === "document_signing" && documentSigningEvent ? (
              <>
                <DocumentInfoCard event={documentSigningEvent} />
                <DocumentFieldsDisplay
                  fields={documentSigningEvent.signatureFields}
                  documentFileName={documentSigningEvent.documentFileName}
                />
              </>
            ) : (
              <>
                <EventInfoCard event={displayEvent} />
                <EventSectionsDisplay event={displayEvent} />
              </>
            )}
          </div>

          {/* Right Column - QR Code & Public Link */}
          <div className="space-y-6">
            {/* QR Code */}
            <EventQRCode shareCode={displayEvent.shareCode || ""} eventTitle={displayEvent.title} />

            {/* Public Link */}
            <EventPublicLink shareCode={displayEvent.shareCode || ""} />
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <DeleteEventDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        eventTitle={displayEvent.title}
      />

      {/* Send Event Dialog */}
      <SendEventDialog
        open={showSendDialog}
        onClose={() => setShowSendDialog(false)}
        eventId={eventId}
        eventTitle={displayEvent.title}
        eventUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/events/${eventId}`}
      />

      {/* Save As Template Dialog */}
      <SaveAsTemplateDialog
        event={displayEvent}
        open={saveAsTemplateDialogOpen}
        onOpenChange={setSaveAsTemplateDialogOpen}
      />
    </DashboardLayout>
  );
}

export default function EventDetailsPage() {
  return (
    <ProtectedRoute>
      <EventDetailsPageContent />
    </ProtectedRoute>
  );
}


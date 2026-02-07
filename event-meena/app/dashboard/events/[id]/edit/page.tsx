"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useEventsStore } from "@/store/eventsStore";
import { useEventBuilderStore } from "@/store/eventBuilderStore";
import EventBuilderWizard from "@/components/events/create/EventBuilderWizard";
import LoadingState from "@/components/dashboard/LoadingState";
import { documentSigningService } from "@/lib/api/services";
import { DocumentSigningEvent } from "@/types/document-signing";

// Dynamic import for DocumentSigningEditor to avoid SSR issues
const DocumentSigningEditor = dynamic(
  () => import("@/components/events/document-signing/DocumentSigningEditor"),
  { ssr: false, loading: () => <LoadingState message="جاري تحميل المحرر..." /> }
);

function EditEventPageContent() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const { currentEvent, fetchEventById, updateEvent, isLoading } = useEventsStore();
  const { reset: resetBuilder, setTitle, setDescription, setType, setNumberOfSections, initializeSections, setStartDate, setEndDate, setRequireAuth, setAllowEdit, setShowResults, setAllowMultipleResponses, setIsPrivate, setAllowedEmails } = useEventBuilderStore();

  // State for document signing events
  const [documentEvent, setDocumentEvent] = useState<DocumentSigningEvent | null>(null);
  const [isDocumentSigning, setIsDocumentSigning] = useState<boolean | null>(null);

  // Fetch event and determine type
  useEffect(() => {
    if (eventId) {
      fetchEventById(eventId);
    }
  }, [eventId, fetchEventById]);

  // Check event type and load appropriate data
  useEffect(() => {
    if (currentEvent && !isLoading) {
      // Check if it's a document signing event
      if (currentEvent.type === "document_signing") {
        setIsDocumentSigning(true);
        // Fetch full document signing event data
        documentSigningService.getDocumentEvent(eventId)
          .then(docEvent => {
            setDocumentEvent(docEvent);
          })
          .catch(error => {
            console.error("Error fetching document event:", error);
          });
      } else {
        setIsDocumentSigning(false);
        // Load regular event data into builder
        resetBuilder();

        // Set basic info
        setTitle(currentEvent.title);
        setDescription(currentEvent.description);
        setType(currentEvent.type);
        setNumberOfSections(currentEvent.sections?.length || 1);

        // Set settings
        if (currentEvent.startDate) setStartDate(currentEvent.startDate);
        if (currentEvent.endDate) setEndDate(currentEvent.endDate);
        setRequireAuth(currentEvent.settings?.requireLogin || false);
        setAllowEdit(currentEvent.settings?.allowEdit || false);
        setShowResults(currentEvent.settings?.showResultsToParticipants || false);
        setAllowMultipleResponses(currentEvent.settings?.allowMultipleResponses || false);
        setIsPrivate(currentEvent.settings?.isPrivate || false);
        setAllowedEmails(currentEvent.settings?.allowedEmails || []);

        // Initialize sections with existing data
        initializeSections();

        // Load sections and components
        if (currentEvent.sections && currentEvent.sections.length > 0) {
          const builderStore = useEventBuilderStore.getState();
          builderStore.sections = currentEvent.sections.map(section => ({
            ...section,
            components: section.components || []
          }));
        }
      }
    }
  }, [currentEvent, isLoading, eventId, resetBuilder, setTitle, setDescription, setType, setNumberOfSections, setStartDate, setEndDate, setRequireAuth, setAllowEdit, setShowResults, setAllowMultipleResponses, setIsPrivate, setAllowedEmails, initializeSections]);

  const handleComplete = async () => {
    try {
      const builderStore = useEventBuilderStore.getState();

      // Don't use buildEvent() for updates as it generates a new ID
      // Instead, construct the update data manually
      const updateData = {
        title: builderStore.title,
        description: builderStore.description,
        type: builderStore.type,
        status: "active" as const, // تحويل الحدث لنشط عند حفظ التعديلات
        sections: builderStore.sections.map((s) => ({ ...s, eventId })),
        settings: {
          requireAuth: builderStore.requireAuth,
          allowEdit: builderStore.allowEdit,
          showResults: builderStore.showResults,
          allowMultipleResponses: builderStore.allowMultipleResponses,
          isPrivate: builderStore.isPrivate,
          allowedEmails: builderStore.allowedEmails,
          shuffleQuestions: false,
          showProgressBar: true,
          allowAnonymous: !builderStore.requireAuth,
        },
        startDate: builderStore.startDate,
        endDate: builderStore.endDate,
        updatedAt: new Date().toISOString(),
      };

      await updateEvent(eventId, updateData);
      router.push(`/dashboard/events/${eventId}`);
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  // Loading state
  if (isLoading || !currentEvent || isDocumentSigning === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingState message="جاري تحميل الحدث..." />
      </div>
    );
  }

  // Document signing event - show document editor
  if (isDocumentSigning) {
    if (!documentEvent) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <LoadingState message="جاري تحميل بيانات الوثيقة..." />
        </div>
      );
    }

    return (
      <DocumentSigningEditor
        event={documentEvent}
        onCancel={() => router.push(`/dashboard/events/${eventId}`)}
        onSave={() => router.push(`/dashboard/events/${eventId}`)}
      />
    );
  }

  // Regular event - show event builder wizard
  return (
    <div className="min-h-screen bg-gray-50">
      <EventBuilderWizard
        mode="edit"
        eventId={eventId}
        onComplete={handleComplete}
      />
    </div>
  );
}

export default function EditEventPage() {
  return (
    <ProtectedRoute>
      <EditEventPageContent />
    </ProtectedRoute>
  );
}


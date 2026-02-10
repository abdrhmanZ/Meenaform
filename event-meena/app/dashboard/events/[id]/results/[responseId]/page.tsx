"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useEventsStore } from "@/store/eventsStore";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import LoadingState from "@/components/dashboard/LoadingState";
import { Response } from "@/types/response";
import { DocumentSigningEvent } from "@/types/document-signing";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  User,
  Mail,
  Calendar,
  Clock,
  Trophy,
  CheckCircle,
  XCircle,
  Download,
  Monitor,
  Smartphone,
  Tablet,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import ParticipantAnswers from "@/components/dashboard/results/ParticipantAnswers";
import ExportPDFDialog from "@/components/dashboard/results/ExportPDFDialog";
import { responsesService, documentSigningService } from "@/lib/api/services";

// Dynamic import for SignatureDetails to avoid SSR issues with react-pdf
const SignatureDetails = dynamic(
  () => import("@/components/events/document-signing/SignatureDetails"),
  { ssr: false, loading: () => <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> }
);

function ParticipantDetailsPageContent() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const responseId = params.responseId as string;

  const { currentEvent, fetchEventById, isLoading, events } = useEventsStore();
  const [response, setResponse] = useState<Response | null>(null);
  const [documentSigningEvent, setDocumentSigningEvent] = useState<DocumentSigningEvent | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isLoadingResponse, setIsLoadingResponse] = useState(true);
  const hasFetched = useRef(false);

  // ✅ لو الحدث موجود في الـ events list، نعرضه فوراً
  const cachedEvent = useMemo(
    () => events.find((e) => e.id === eventId),
    [events, eventId]
  );
  const displayEvent = currentEvent?.id === eventId ? currentEvent : cachedEvent || null;

  // ✅ Parallel: نجلب الحدث + الـ response في نفس الوقت (بدل التسلسل)
  useEffect(() => {
    if (!eventId || hasFetched.current) return;
    hasFetched.current = true;

    // جلب الحدث والـ response بالتوازي
    fetchEventById(eventId);

    // جلب الـ response فوراً بدون انتظار الحدث
    const loadResponseParallel = async () => {
      setIsLoadingResponse(true);
      try {
        const apiResponse = await responsesService.getById(responseId);
        setResponse(apiResponse);
      } catch (error) {
        console.error("Failed to load response:", error);
        // Fallback: try localStorage for backward compatibility
        const allResponses = JSON.parse(localStorage.getItem("event_responses") || "[]");
        const foundResponse = allResponses.find(
          (r: Response) => r.id === responseId && r.eventId === eventId
        );
        setResponse(foundResponse || null);
      } finally {
        setIsLoadingResponse(false);
      }
    };
    loadResponseParallel();
  }, [eventId, responseId, fetchEventById]);

  // Load document signing event data when event type is known
  useEffect(() => {
    if (currentEvent?.type === "document_signing" && eventId) {
      const loadDocumentSigningEvent = async () => {
        try {
          const docEvent = await documentSigningService.getDocumentEvent(eventId);
          setDocumentSigningEvent(docEvent);
        } catch (error) {
          console.error("Failed to load document signing event:", error);
        }
      };
      loadDocumentSigningEvent();
    }
  }, [currentEvent?.type, eventId]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes} دقيقة و ${secs} ثانية`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDeviceIcon = (device?: string) => {
    if (!device) return Monitor;
    if (device === "mobile") return Smartphone;
    if (device === "tablet") return Tablet;
    return Monitor;
  };

  // Loading state - ننتظر الحدث والـ response يتحملوا بالتوازي
  if (!displayEvent || (isLoadingResponse && !response)) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingState variant="participant" />
        </div>
      </DashboardLayout>
    );
  }

  // Document Signing Event - Show SignatureDetails
  if (displayEvent.type === "document_signing") {
    return (
      <DashboardLayout>
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild className="hover:bg-gray-100">
                <Link href={`/dashboard/events/${eventId}/results`}>
                  <ArrowRight className="w-5 h-5 ml-2" />
                  العودة إلى النتائج
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">تفاصيل التوقيع</h1>
                <p className="text-gray-600 mt-1">{displayEvent.title}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="max-w-5xl mx-auto">
            {documentSigningEvent ? (
              <SignatureDetails event={documentSigningEvent} responseId={responseId} />
            ) : (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Regular event - need response
  if (!response) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingState variant="participant" />
        </div>
      </DashboardLayout>
    );
  }

  const DeviceIcon = getDeviceIcon(response.metadata.device);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Desktop Layout */}
          <div className="hidden sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hover:bg-gray-100"
              >
                <Link href={`/dashboard/events/${eventId}/results`}>
                  <ArrowRight className="w-5 h-5 ml-2" />
                  العودة إلى النتائج
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  تفاصيل المشارك
                </h1>
                <p className="text-gray-600 mt-1">{displayEvent.title}</p>
              </div>
            </div>

            {/* Export Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportDialog(true)}
            >
              <Download className="w-4 h-4 ml-2" />
              تصدير PDF
            </Button>
          </div>

          {/* Mobile Layout */}
          <div className="sm:hidden space-y-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hover:bg-gray-100"
              >
                <Link href={`/dashboard/events/${eventId}/results`}>
                  <ArrowRight className="w-5 h-5 ml-1" />
                  العودة
                </Link>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExportDialog(true)}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>

            <div>
              <h1 className="text-xl font-bold text-gray-900">
                تفاصيل المشارك
              </h1>
              <p className="text-sm text-gray-600 mt-1 truncate">{displayEvent.title}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Participant Info Card */}
          <Card className="p-4 sm:p-8">
            {/* Mobile: Avatar في المنتصف فوق */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
              {/* Avatar */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-2xl sm:text-3xl flex-shrink-0 mx-auto sm:mx-0">
                {response.participant.name?.charAt(0).toUpperCase() || "؟"}
              </div>

              {/* Info Grid */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Name */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 flex-shrink-0">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-600 mb-1">الاسم الكامل</p>
                    <p className="font-semibold text-gray-900 break-words">
                      {response.participant.name || "مشارك مجهول"}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-green-50 flex-shrink-0">
                    <Mail className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-600 mb-1">البريد الإلكتروني</p>
                    <p className="font-semibold text-gray-900 break-all text-sm sm:text-base">
                      {response.participant.email || "لا يوجد"}
                    </p>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-50 flex-shrink-0">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-600 mb-1">تاريخ المشاركة</p>
                    <p className="font-semibold text-gray-900">
                      {formatDate(response.completedAt || response.startedAt)}
                    </p>
                  </div>
                </div>

                {/* Time Spent */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-orange-50 flex-shrink-0">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-600 mb-1">الوقت المستغرق</p>
                    <p className="font-semibold text-gray-900">
                      {formatTime(response.timeSpent)}
                    </p>
                  </div>
                </div>

                {/* Device */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gray-50 flex-shrink-0">
                    <DeviceIcon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-600 mb-1">الجهاز المستخدم</p>
                    <p className="font-semibold text-gray-900">
                      {response.metadata.device === "mobile" ? "هاتف محمول" :
                       response.metadata.device === "tablet" ? "تابلت" : "كمبيوتر"}
                    </p>
                  </div>
                </div>

                {/* Score (for quizzes) */}
                {response.score && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-yellow-50 flex-shrink-0">
                      <Trophy className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-600 mb-1">الدرجة</p>
                      <p className="font-bold text-primary text-lg">
                        {response.score.earnedPoints}/{response.score.totalPoints} ({response.score.percentage}%)
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {response.score.passed ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-600">نجح</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-medium text-red-600">رسب</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Answers Section */}
          <Card className="p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                📝 الإجابات التفصيلية
              </h2>
              <p className="text-gray-600">
                جميع إجابات المشارك على أسئلة ومكونات الحدث
              </p>
            </div>

            <ParticipantAnswers
              event={displayEvent}
              response={response}
            />
          </Card>
        </div>
      </div>

      {/* Export PDF Dialog */}
      <ExportPDFDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        eventTitle={displayEvent.title}
        responses={[response]} // Single participant
        components={displayEvent.sections?.flatMap(section => section.components) ?? []}
        isSingleParticipant={true}
      />
    </DashboardLayout>
  );
}

export default function ParticipantDetailsPage() {
  return (
    <ProtectedRoute>
      <ParticipantDetailsPageContent />
    </ProtectedRoute>
  );
}


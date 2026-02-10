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
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  Download,
  FileSpreadsheet,
  FileText,
  Search,
  Filter,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import ExportPDFDialog from "@/components/dashboard/results/ExportPDFDialog";
import ExportExcelDialog from "@/components/dashboard/results/ExportExcelDialog";
import { responsesService, documentSigningService } from "@/lib/api/services";

// Dynamic import for DocumentSigningResults to avoid SSR issues
const DocumentSigningResults = dynamic(
  () => import("@/components/events/document-signing/DocumentSigningResults"),
  { ssr: false, loading: () => <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> }
);

function ResultsPageContent() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const { currentEvent, fetchEventById, isLoading, events } = useEventsStore();
  const [responses, setResponses] = useState<Response[]>([]);
  const [filteredResponses, setFilteredResponses] = useState<Response[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showExcelExportDialog, setShowExcelExportDialog] = useState(false);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);

  // Document Signing specific state
  const [documentSigningEvent, setDocumentSigningEvent] = useState<DocumentSigningEvent | null>(null);

  const hasFetched = useRef(false);

  // ✅ لو الحدث موجود في الـ events list، نعرضه فوراً
  const cachedEvent = useMemo(
    () => events.find((e) => e.id === eventId),
    [events, eventId]
  );
  const displayEvent = currentEvent?.id === eventId ? currentEvent : cachedEvent || null;

  useEffect(() => {
    if (eventId && !hasFetched.current) {
      hasFetched.current = true;
      fetchEventById(eventId);
      loadResponses();
    }
  }, [eventId, fetchEventById]);

  // Fetch document signing event data if needed
  useEffect(() => {
    const fetchDocumentSigningData = async () => {
      if (currentEvent?.type === "document_signing") {
        try {
          const docEvent = await documentSigningService.getDocumentEvent(eventId);
          setDocumentSigningEvent(docEvent);
        } catch (err) {
          console.error("Error fetching document signing event:", err);
        }
      }
    };
    fetchDocumentSigningData();
  }, [currentEvent, eventId]);

  const loadResponses = async () => {
    setIsLoadingResponses(true);
    try {
      // Load responses from API
      const apiResponses = await responsesService.getByEventId(eventId);
      // Filter to show only completed responses
      const completedResponses = apiResponses.filter(
        (r: Response) => r.status === "completed"
      );
      setResponses(completedResponses);
      setFilteredResponses(completedResponses);

    } catch (error) {
      console.error("❌ Failed to load responses from API:", error);
      // Fallback: try localStorage for backward compatibility
      const allResponses = JSON.parse(localStorage.getItem("event_responses") || "[]");
      const eventResponses = allResponses.filter(
        (r: Response) => r.eventId === eventId && r.status === "completed"
      );
      setResponses(eventResponses);
      setFilteredResponses(eventResponses);

    } finally {
      setIsLoadingResponses(false);
    }
  };

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredResponses(responses);
    } else {
      const filtered = responses.filter((response) => {
        const name = response.participant.name?.toLowerCase() || "";
        const email = response.participant.email?.toLowerCase() || "";
        const query = searchQuery.toLowerCase();
        return name.includes(query) || email.includes(query);
      });
      setFilteredResponses(filtered);
    }
  }, [searchQuery, responses]);

  // Calculate statistics
  const stats = {
    totalResponses: responses.length,
    completedResponses: responses.filter((r) => r.status === "completed").length,
    completionRate: responses.length > 0 
      ? Math.round((responses.filter((r) => r.status === "completed").length / responses.length) * 100)
      : 0,
    averageTime: responses.length > 0
      ? Math.round(responses.reduce((sum, r) => sum + r.timeSpent, 0) / responses.length)
      : 0,
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // ✅ نعرض loading بس لو ما فيه أي بيانات للحدث أبداً
  if (!displayEvent) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingState variant="results" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hover:bg-gray-100 shrink-0"
              >
                <Link href={`/dashboard/events/${eventId}`}>
                  <ArrowRight className="w-5 h-5 ml-1 sm:ml-2" />
                  <span className="hidden sm:inline">العودة</span>
                </Link>
              </Button>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                  نتائج الحدث
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1 truncate">{displayEvent.title}</p>
              </div>
            </div>

            {/* Export Buttons - Only for non-document-signing events */}
            {displayEvent.type !== "document_signing" && (
              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExcelExportDialog(true)}
                  className="flex-1 sm:flex-none"
                >
                  <FileSpreadsheet className="w-4 h-4 ml-1 sm:ml-2" />
                  <span className="hidden xs:inline">تصدير</span> Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExportDialog(true)}
                  className="flex-1 sm:flex-none"
                >
                  <FileText className="w-4 h-4 ml-1 sm:ml-2" />
                  <span className="hidden xs:inline">تصدير</span> PDF
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Document Signing Results */}
        {displayEvent.type === "document_signing" ? (
          documentSigningEvent ? (
            <DocumentSigningResults
              event={documentSigningEvent}
              onViewSignature={(responseId) =>
                router.push(`/dashboard/events/${eventId}/results/${responseId}`)
              }
            />
          ) : (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )
        ) : (
          <>
            {/* Regular Results Content */}
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-50">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mb-1">
              <p className="text-3xl font-bold text-gray-900">{stats.totalResponses}</p>
            </div>
            <p className="text-sm text-gray-600">إجمالي الردود</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-green-50">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mb-1">
              <p className="text-3xl font-bold text-gray-900">{stats.completedResponses}</p>
            </div>
            <p className="text-sm text-gray-600">ردود مكتملة</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-50">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mb-1">
              <p className="text-3xl font-bold text-gray-900">{stats.completionRate}%</p>
            </div>
            <p className="text-sm text-gray-600">نسبة الإكمال</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-orange-50">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="mb-1">
              <p className="text-3xl font-bold text-gray-900">{formatTime(stats.averageTime)}</p>
            </div>
            <p className="text-sm text-gray-600">متوسط الوقت</p>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="ابحث عن مشارك (الاسم أو البريد الإلكتروني)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 ml-2" />
              فلترة
            </Button>
          </div>
        </Card>

        {/* Participants List */}
        {filteredResponses.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              لا توجد نتائج بعد
            </h3>
            <p className="text-gray-600">
              {searchQuery ? "لم يتم العثور على نتائج مطابقة للبحث" : "لم يقم أي مشارك بإكمال هذا الحدث بعد"}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResponses.map((response) => (
              <Card
                key={response.id}
                className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-primary/50"
                onClick={() => router.push(`/dashboard/events/${eventId}/results/${response.id}`)}
              >
                {/* Participant Avatar */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                    {response.participant.name?.charAt(0).toUpperCase() || "؟"}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {response.participant.name || "مشارك مجهول"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {response.participant.email || "لا يوجد بريد"}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">التاريخ:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(response.completedAt || response.startedAt).toLocaleDateString("ar-EG")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">الوقت المستغرق:</span>
                    <span className="font-medium text-gray-900">
                      {formatTime(response.timeSpent)}
                    </span>
                  </div>
                  {response.score && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">الدرجة:</span>
                      <span className="font-bold text-primary">
                        {response.score.earnedPoints}/{response.score.totalPoints} ({response.score.percentage}%)
                      </span>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    response.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {response.status === "completed" ? "✅ مكتمل" : "⏳ قيد الإكمال"}
                  </span>
                  {response.score && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      response.score.passed
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {response.score.passed ? "✅ نجح" : "❌ رسب"}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
          </>
        )}
      </div>

      {/* Export PDF Dialog - Only for non-document-signing events */}
      {displayEvent.type !== "document_signing" && (
        <>
          <ExportPDFDialog
            open={showExportDialog}
            onOpenChange={setShowExportDialog}
            eventTitle={displayEvent.title}
            responses={responses}
            components={displayEvent.sections?.flatMap((section) => section.components) || []}
          />

          <ExportExcelDialog
            open={showExcelExportDialog}
            onOpenChange={setShowExcelExportDialog}
            eventTitle={displayEvent.title}
            responses={responses}
            components={displayEvent.sections?.flatMap((section) => section.components) || []}
            isQuiz={displayEvent.type === "quiz"}
          />
        </>
      )}
    </DashboardLayout>
  );
}

export default function ResultsPage() {
  return (
    <ProtectedRoute>
      <ResultsPageContent />
    </ProtectedRoute>
  );
}


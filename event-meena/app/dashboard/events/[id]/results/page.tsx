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
  Trophy,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import ExportPDFDialog from "@/components/dashboard/results/ExportPDFDialog";
import ExportExcelDialog from "@/components/dashboard/results/ExportExcelDialog";
import { responsesService, documentSigningService } from "@/lib/api/services";
import { calculateScore } from "@/lib/grading";

const DrawPage = dynamic(() => import("@/components/competition/DrawPage"), { ssr: false });
const CompetitionStats = dynamic(() => import("@/components/competition/CompetitionStats"), { ssr: false });
const ShareResultsDialog = dynamic(() => import("@/components/dashboard/results/ShareResultsDialog"), { ssr: false });

// Dynamic import for DocumentSigningResults to avoid SSR issues
const DocumentSigningResults = dynamic(
  () => import("@/components/events/document-signing/DocumentSigningResults"),
  { ssr: false, loading: () => <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> }
);

function ResultsPageContent() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const { currentEvent, fetchEventById, fetchEvents, events } = useEventsStore();
  const [responses, setResponses] = useState<Response[]>([]);
  const [filteredResponses, setFilteredResponses] = useState<Response[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showExcelExportDialog, setShowExcelExportDialog] = useState(false);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);
  const [isLoadingEvent, setIsLoadingEvent] = useState(false);
  const [showDrawPage, setShowDrawPage] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Document Signing specific state
  const [documentSigningEvent, setDocumentSigningEvent] = useState<DocumentSigningEvent | null>(null);


  const hasFetched = useRef(false);

  // ✅ لو الحدث موجود في الـ events list، نعرضه فوراً
  const cachedEvent = useMemo(
    () => events.find((e) => e.id === eventId),
    [events, eventId]
  );
  const displayEvent = currentEvent?.id === eventId ? currentEvent : cachedEvent || null;

  // ✅ تحميل الحدث والردود بالتوازي — يفضل يحاول لحد ما يجيبها
  const loadEventData = async (retryCount = 0) => {
    setIsLoadingEvent(true);
    try {
      await fetchEventById(eventId);
    } catch {
      // Fallback: جلب قائمة الأحداث (أخف)
      try {
        await fetchEvents(true);
      } catch {
        // يحاول تاني بتأخير متزايد
        const delay = Math.min(2000 * (retryCount + 1), 10000);
        await new Promise(r => setTimeout(r, delay));
        return loadEventData(retryCount + 1);
      }
    } finally {
      setIsLoadingEvent(false);
    }
    loadResponses();
  };

  useEffect(() => {
    if (eventId && !hasFetched.current) {
      hasFetched.current = true;
      loadEventData();
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

  const loadResponses = async (retryCount = 0) => {
    setIsLoadingResponses(true);
    try {
      const apiResponses = await responsesService.getByEventId(eventId);
      const completedResponses = apiResponses.filter(
        (r: Response) => r.status === "completed"
      );

      // حساب الدرجات محلياً لأحداث المسابقة (quiz_draw)
      // Backend لا يحسب score للأحداث من نوع competition
      const eventForScoring = currentEvent || cachedEvent;
      const isQuizDraw = eventForScoring?.type === "competition" &&
        eventForScoring?.settings?.competitionMode === "quiz_draw";

      if (isQuizDraw && eventForScoring && eventForScoring.sections?.length > 0) {
        const scoredResponses = completedResponses.map((r) => {
          if (!r.score && r.answers.length > 0) {
            const computedScore = calculateScore(eventForScoring, r.answers);
            return { ...r, score: computedScore };
          }
          return r;
        });
        setResponses(scoredResponses);
        setFilteredResponses(scoredResponses);
      } else {
        setResponses(completedResponses);
        setFilteredResponses(completedResponses);
      }
      setIsLoadingResponses(false);
    } catch (error) {
      console.error(`❌ Failed to load responses (attempt ${retryCount + 1}):`, error);
      const delay = Math.min(2000 * (retryCount + 1), 10000);
      await new Promise(r => setTimeout(r, delay));
      return loadResponses(retryCount + 1);
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

            {/* أزرار الإجراءات */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* أزرار التصدير */}
              {displayEvent.type !== "document_signing" && displayEvent.type !== "competition" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExcelExportDialog(true)}
                  >
                    <FileSpreadsheet className="w-4 h-4 ml-1.5" />
                    Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExportDialog(true)}
                  >
                    <FileText className="w-4 h-4 ml-1.5" />
                    PDF
                  </Button>
                </>
              )}

              {/* زر مشاركة النتائج - Not for document_signing */}
              {displayEvent.type !== "document_signing" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowShareDialog(true)}
                  className="gap-1.5"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">مشاركة</span>
                </Button>
              )}

              {/* زر السحب للمسابقات */}
              {displayEvent.type === "competition" && !displayEvent.settings?.drawCompleted && (
                <Button
                  size="sm"
                  onClick={() => setShowDrawPage(true)}
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-lg shadow-amber-300/30 gap-1.5"
                >
                  <Trophy className="w-4 h-4" />
                  بدء السحب
                </Button>
              )}
              {displayEvent.type === "competition" && displayEvent.settings?.drawCompleted && (
                <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg font-medium">
                  تم إجراء السحب
                </span>
              )}
            </div>
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
            {/* Competition Results */}
            {displayEvent.type === "competition" ? (
              <CompetitionStats event={displayEvent} responses={responses} />
            ) : (
              /* Regular Statistics Cards */
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
            )}

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
            {isLoadingResponses ? (
              <Card className="p-12 text-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
                <p className="text-gray-600">جاري تحميل النتائج...</p>
              </Card>
            ) : filteredResponses.length === 0 ? (
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
                {filteredResponses.map((response) => {
                  const isWinner = displayEvent.settings?.winners?.includes(response.id) || false;
                  return (
                    <Card
                      key={response.id}
                      className={`p-6 hover:shadow-lg transition-all duration-300 cursor-pointer ${isWinner
                        ? "border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-lg shadow-amber-100 hover:border-amber-500"
                        : "hover:border-primary/50"
                        }`}
                      onClick={() => router.push(`/dashboard/events/${eventId}/results/${response.id}`)}
                    >
                      {/* Winner Badge */}
                      {isWinner && (
                        <div className="flex items-center gap-1.5 mb-3">
                          <Trophy className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">فائز</span>
                        </div>
                      )}
                      {/* Participant Avatar */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${isWinner
                          ? "bg-gradient-to-br from-amber-400 to-yellow-500 shadow-md shadow-amber-200"
                          : "bg-gradient-to-br from-primary to-blue-600"
                          }`}>
                          {response.participant.name?.charAt(0).toUpperCase() || "؟"}
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-semibold ${isWinner ? "text-amber-900" : "text-gray-900"}`}>
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
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${isWinner
                          ? "bg-amber-100 text-amber-700"
                          : response.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                          }`}>
                          {isWinner ? "فائز بالسحب" : response.status === "completed" ? "مكتمل" : "قيد الإكمال"}
                        </span>
                        {response.score && (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${response.score.passed
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                            }`}>
                            {response.score.passed ? "نجح" : "رسب"}
                          </span>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Export PDF Dialog - Only for non-document-signing events */}
      {displayEvent.type !== "document_signing" && displayEvent.type !== "competition" && (
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

      {/* Draw Page Modal - للمسابقات */}
      {showDrawPage && displayEvent.type === "competition" && (
        <DrawPage
          event={displayEvent}
          responses={responses}
          onClose={() => setShowDrawPage(false)}
          onDrawSaved={() => {
            fetchEventById(eventId);
            setShowDrawPage(false);
          }}
        />
      )}

      {/* Share Results Dialog */}
      {displayEvent && (
        <ShareResultsDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          event={displayEvent}
          onUpdated={() => {
            fetchEventById(eventId);
          }}
        />
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


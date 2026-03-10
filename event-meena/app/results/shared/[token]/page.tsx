"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
    Mail,
    Lock,
    Loader2,
    Users,
    CheckCircle,
    Clock,
    TrendingUp,
    Trophy,
    Search,
    AlertCircle,
    BarChart3,
    Download,
    User,
    Calendar,
    XCircle,
    ArrowLeft,
    ArrowRight,
} from "lucide-react";
import { mapResponse, mapEventWithFullDetails, BackendResponseDto, BackendEventWithFullDetailsDto } from "@/lib/api/mappers";
import { Response as EventResponse } from "@/types/response";
import { Event } from "@/types/event";
import ParticipantAnswers from "@/components/dashboard/results/ParticipantAnswers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

// ============ Types (من الـ API) ============

interface SharedScore {
    earnedPoints: number;
    totalPoints: number;
    percentage: number;
    passed: boolean;
}

interface SharedResponseRaw {
    id: string;
    participantName: string;
    participantEmail?: string;
    status: string;
    timeSpent: number;
    startedAt: string;
    completedAt?: string;
    score?: SharedScore;
    isWinner: boolean;
    answersJson: string;
}

interface SharedResultsRaw {
    event: BackendEventWithFullDetailsDto;
    responses: SharedResponseRaw[];
    permissions: {
        allowExport: boolean;
        allowDraw: boolean;
    };
}

// ============ Main Page ============

export default function SharedResultsPage() {
    const params = useParams();
    const token = params.token as string;

    const [phase, setPhase] = useState<"email" | "results" | "error" | "details">("email");
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // البيانات المحولة
    const [event, setEvent] = useState<Event | null>(null);
    const [responses, setResponses] = useState<EventResponse[]>([]);
    const [winnerIds, setWinnerIds] = useState<string[]>([]);
    const [permissions, setPermissions] = useState({ allowExport: false, allowDraw: false });

    const [searchQuery, setSearchQuery] = useState("");
    const [isExporting, setIsExporting] = useState(false);

    // Participant details state
    const [selectedResponse, setSelectedResponse] = useState<EventResponse | null>(null);

    const handleAccess = async () => {
        const trimmedEmail = email.trim();
        if (!trimmedEmail) return;

        setIsLoading(true);
        setErrorMessage("");

        try {
            const res = await axios.post(
                `${API_BASE_URL}/Public/shared-results/${token}/access`,
                { email: trimmedEmail },
                { headers: { "Content-Type": "application/json" }, timeout: 15000 }
            );

            if (res.data.success && res.data.data) {
                const raw: SharedResultsRaw = res.data.data;

                // تحويل الحدث باستخدام mapEventWithFullDetails — يشمل sections/components
                const mappedEvent = mapEventWithFullDetails(raw.event);
                setEvent(mappedEvent);

                // جمع IDs الفائزين
                const winners: string[] = [];
                raw.responses.forEach((r) => {
                    if (r.isWinner) winners.push(r.id);
                });
                setWinnerIds(winners);

                // تحويل الردود باستخدام mapResponse — نفس ما يفعل responsesService
                const mappedResponses = raw.responses.map((r) => {
                    const statusNum =
                        r.status === "completed" ? 3 : r.status === "abandoned" ? 4 : 2;

                    const backendDto: BackendResponseDto = {
                        id: r.id,
                        status: statusNum,
                        respondentName: r.participantName,
                        respondentEmail: r.participantEmail || null,
                        respondentPhone: null,
                        answersJson: r.answersJson,
                        startedAt: r.startedAt,
                        completedAt: r.completedAt || null,
                        durationSeconds: r.timeSpent,
                        score: r.score?.earnedPoints ?? null,
                        totalPoints: r.score?.totalPoints ?? null,
                        percentage: r.score?.percentage ?? null,
                        isPassed: r.score?.passed ?? null,
                        currentSectionIndex: 0,
                        eventId: raw.event.id,
                        createdAt: r.startedAt,
                    };

                    return mapResponse(backendDto);
                });

                setResponses(mappedResponses);
                setPermissions(raw.permissions);
                setPhase("results");
            } else {
                setErrorMessage(res.data.message || "فشل الوصول للنتائج");
                setPhase("error");
            }
        } catch (error: any) {
            const msg =
                error.response?.data?.message ||
                error.response?.data?.title ||
                "فشل الوصول للنتائج. تأكد من بريدك الإلكتروني.";
            setErrorMessage(msg);
            setPhase("error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleAccess();
    };

    const formatTime = (seconds: number) => {
        if (!seconds || seconds <= 0) return "0:00";
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, "0")}`;
    };

    const formatTimeFull = (seconds: number) => {
        if (!seconds || seconds <= 0) return "0 ثانية";
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (minutes === 0) return `${secs} ثانية`;
        return `${minutes} دقيقة و ${secs} ثانية`;
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString("ar-EG", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return dateStr;
        }
    };

    const openParticipantDetails = (response: EventResponse) => {
        setSelectedResponse(response);
        setPhase("details");
    };

    const backToResults = () => {
        setSelectedResponse(null);
        setPhase("results");
    };

    const exportCSV = () => {
        if (!event) return;
        setIsExporting(true);
        try {
            const headers = ["الاسم", "البريد", "الحالة", "الوقت (ث)", "الدرجة", "النسبة", "فائز"];
            const rows = responses.map((r) => [
                r.participant.name || "",
                r.participant.email || "",
                r.status === "completed" ? "مكتمل" : "غير مكتمل",
                r.timeSpent.toString(),
                r.score ? `${r.score.earnedPoints}/${r.score.totalPoints}` : "",
                r.score ? `${r.score.percentage}%` : "",
                winnerIds.includes(r.id) ? "نعم" : "لا",
            ]);
            const csvContent = "\uFEFF" + [headers, ...rows].map((r) => r.join(",")).join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `results-${event.title}.csv`;
            link.click();
            URL.revokeObjectURL(url);
        } finally {
            setIsExporting(false);
        }
    };

    // ======== شاشة إدخال الإيميل ========
    if (phase === "email" || phase === "error") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md p-8 shadow-xl border-0">
                    <div className="text-center mb-8">
                        <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-4">
                            <BarChart3 className="w-10 h-10 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">عرض النتائج المشاركة</h1>
                        <p className="text-gray-500 text-sm">أدخل بريدك الإلكتروني للوصول إلى نتائج هذا الحدث</p>
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                type="email"
                                placeholder="أدخل بريدك الإلكتروني..."
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (phase === "error") {
                                        setPhase("email");
                                        setErrorMessage("");
                                    }
                                }}
                                onKeyDown={handleKeyPress}
                                className="pr-10 h-12 text-base"
                                dir="ltr"
                                autoFocus
                            />
                        </div>

                        {phase === "error" && errorMessage && (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                <p className="text-sm text-red-600">{errorMessage}</p>
                            </div>
                        )}

                        <Button
                            onClick={handleAccess}
                            disabled={isLoading || !email.trim()}
                            className="w-full h-12 text-base gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    جاري التحقق...
                                </>
                            ) : (
                                <>
                                    <Lock className="w-5 h-5" />
                                    الدخول لعرض النتائج
                                </>
                            )}
                        </Button>
                    </div>

                    <p className="text-center text-xs text-gray-400 mt-6">
                        يجب أن يكون بريدك الإلكتروني مضافاً في قائمة المسموح لهم
                    </p>
                </Card>
            </div>
        );
    }

    // ======== شاشة تفاصيل المشارك (بدل Sheet) ========
    if (phase === "details" && selectedResponse && event) {
        return (
            <div className="min-h-screen bg-gray-50">
                {/* Header — نفس الأصلي */}
                <div className="bg-white border-b border-gray-200">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                        {/* Desktop Layout */}
                        <div className="hidden sm:flex sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={backToResults}
                                    className="hover:bg-gray-100"
                                >
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                    العودة إلى النتائج
                                </Button>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        تفاصيل المشارك
                                    </h1>
                                    <p className="text-gray-600 mt-1">{event.title}</p>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Layout */}
                        <div className="sm:hidden space-y-3">
                            <div className="flex items-center justify-between">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={backToResults}
                                    className="hover:bg-gray-100"
                                >
                                    <ArrowRight className="w-5 h-5 ml-1" />
                                    العودة
                                </Button>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">
                                    تفاصيل المشارك
                                </h1>
                                <p className="text-sm text-gray-600 mt-1 truncate">{event.title}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content — نفس الأصلي بالضبط */}
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                    <div className="max-w-5xl mx-auto space-y-6">
                        {/* Participant Info Card */}
                        <Card className="p-4 sm:p-8">
                            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                                {/* Avatar */}
                                <div
                                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl sm:text-3xl flex-shrink-0 mx-auto sm:mx-0 ${winnerIds.includes(selectedResponse.id)
                                        ? "bg-gradient-to-br from-amber-400 to-yellow-500 shadow-md shadow-amber-200"
                                        : "bg-gradient-to-br from-primary to-blue-600"
                                        }`}
                                >
                                    {selectedResponse.participant.name?.charAt(0).toUpperCase() || "؟"}
                                </div>

                                {/* Info Grid */}
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    {/* الاسم */}
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-blue-50 flex-shrink-0">
                                            <User className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm text-gray-600 mb-1">الاسم الكامل</p>
                                            <p className="font-semibold text-gray-900 break-words">
                                                {selectedResponse.participant.name || "مشارك مجهول"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* البريد */}
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-green-50 flex-shrink-0">
                                            <Mail className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm text-gray-600 mb-1">البريد الإلكتروني</p>
                                            <p className="font-semibold text-gray-900 break-all text-sm sm:text-base">
                                                {selectedResponse.participant.email || "لا يوجد"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* التاريخ */}
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-purple-50 flex-shrink-0">
                                            <Calendar className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm text-gray-600 mb-1">تاريخ المشاركة</p>
                                            <p className="font-semibold text-gray-900">
                                                {formatDate(selectedResponse.completedAt || selectedResponse.startedAt)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* الوقت */}
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-orange-50 flex-shrink-0">
                                            <Clock className="w-5 h-5 text-orange-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm text-gray-600 mb-1">الوقت المستغرق</p>
                                            <p className="font-semibold text-gray-900">
                                                {formatTimeFull(selectedResponse.timeSpent)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* الدرجة */}
                                    {selectedResponse.score && (
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded-lg bg-yellow-50 flex-shrink-0">
                                                <Trophy className="w-5 h-5 text-yellow-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm text-gray-600 mb-1">الدرجة</p>
                                                <p className="font-bold text-primary text-lg">
                                                    {selectedResponse.score.earnedPoints}/{selectedResponse.score.totalPoints} ({selectedResponse.score.percentage}%)
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {selectedResponse.score.passed ? (
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

                        {/* Answers Section — نفس الأصلي بالضبط */}
                        <Card className="p-4 sm:p-8">
                            <div className="mb-4 sm:mb-6">
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
                                    📝 الإجابات التفصيلية
                                </h2>
                                <p className="text-sm sm:text-base text-gray-600">
                                    جميع إجابات المشارك على أسئلة ومكونات الحدث
                                </p>
                            </div>

                            <ParticipantAnswers event={event} response={selectedResponse} />
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    // ======== شاشة النتائج ========
    if (!event) return null;

    const filteredResponses = searchQuery.trim()
        ? responses.filter((r) => {
            const query = searchQuery.toLowerCase();
            return (
                r.participant.name?.toLowerCase().includes(query) ||
                r.participant.email?.toLowerCase().includes(query)
            );
        })
        : responses;

    const completedCount = responses.filter((r) => r.status === "completed").length;
    const stats = {
        totalResponses: responses.length,
        completedResponses: completedCount,
        completionRate:
            responses.length > 0 ? Math.round((completedCount / responses.length) * 100) : 0,
        averageTime:
            responses.length > 0
                ? Math.round(responses.reduce((sum, r) => sum + (r.timeSpent || 0), 0) / responses.length)
                : 0,
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">نتائج الحدث</h1>
                            <p className="text-sm sm:text-base text-gray-600 mt-1 truncate">{event.title}</p>
                        </div>

                        {permissions.allowExport && (
                            <Button variant="outline" size="sm" onClick={exportCSV} disabled={isExporting} className="shrink-0 gap-2">
                                <Download className="w-4 h-4" />
                                تصدير النتائج (CSV)
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Statistics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                    <Card className="p-4 sm:p-6">
                        <div className="p-2 sm:p-3 rounded-xl bg-blue-50 w-fit mb-3 sm:mb-4">
                            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stats.totalResponses}</p>
                        <p className="text-xs sm:text-sm text-gray-600">إجمالي الردود</p>
                    </Card>
                    <Card className="p-4 sm:p-6">
                        <div className="p-2 sm:p-3 rounded-xl bg-green-50 w-fit mb-3 sm:mb-4">
                            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stats.completedResponses}</p>
                        <p className="text-xs sm:text-sm text-gray-600">ردود مكتملة</p>
                    </Card>
                    <Card className="p-4 sm:p-6">
                        <div className="p-2 sm:p-3 rounded-xl bg-purple-50 w-fit mb-3 sm:mb-4">
                            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stats.completionRate}%</p>
                        <p className="text-xs sm:text-sm text-gray-600">نسبة الإكمال</p>
                    </Card>
                    <Card className="p-4 sm:p-6">
                        <div className="p-2 sm:p-3 rounded-xl bg-orange-50 w-fit mb-3 sm:mb-4">
                            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{formatTime(stats.averageTime)}</p>
                        <p className="text-xs sm:text-sm text-gray-600">متوسط الوقت</p>
                    </Card>
                </div>

                {/* Search */}
                <Card className="p-4 sm:p-6 mb-6">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="ابحث عن مشارك (الاسم أو البريد الإلكتروني)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pr-10"
                        />
                    </div>
                </Card>

                {/* Participants List */}
                {filteredResponses.length === 0 ? (
                    <Card className="p-12 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد نتائج</h3>
                        <p className="text-gray-600">
                            {searchQuery ? "لم يتم العثور على نتائج مطابقة" : "لم يقم أي مشارك بإكمال هذا الحدث بعد"}
                        </p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {filteredResponses.map((response) => {
                            const isWinner = winnerIds.includes(response.id);
                            return (
                                <Card
                                    key={response.id}
                                    className={`p-5 sm:p-6 transition-all duration-300 cursor-pointer ${isWinner
                                        ? "border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-lg shadow-amber-100 hover:border-amber-500"
                                        : "hover:shadow-lg hover:border-primary/50"
                                        }`}
                                    onClick={() => openParticipantDetails(response)}
                                >
                                    {isWinner && (
                                        <div className="flex items-center gap-1.5 mb-3">
                                            <Trophy className="w-4 h-4 text-amber-500" />
                                            <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">فائز</span>
                                        </div>
                                    )}

                                    <div className="flex items-start gap-3 sm:gap-4 mb-4">
                                        <div
                                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg shrink-0 ${isWinner
                                                ? "bg-gradient-to-br from-amber-400 to-yellow-500 shadow-md shadow-amber-200"
                                                : "bg-gradient-to-br from-primary to-blue-600"
                                                }`}
                                        >
                                            {response.participant.name?.charAt(0).toUpperCase() || "?"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className={`font-semibold truncate ${isWinner ? "text-amber-900" : "text-gray-900"}`}>
                                                {response.participant.name || "مشارك مجهول"}
                                            </h3>
                                            <p className="text-sm text-gray-600 truncate">{response.participant.email || "لا يوجد بريد"}</p>
                                        </div>
                                        <ArrowLeft className="w-4 h-4 text-gray-400 shrink-0 mt-1" />
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        {response.timeSpent > 0 && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">الوقت:</span>
                                                <span className="font-medium text-gray-900">{formatTime(response.timeSpent)}</span>
                                            </div>
                                        )}
                                        {response.score && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">الدرجة:</span>
                                                <span className="font-bold text-primary">
                                                    {response.score.earnedPoints}/{response.score.totalPoints} ({response.score.percentage}%)
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${isWinner
                                                ? "bg-amber-100 text-amber-700"
                                                : response.status === "completed"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-yellow-100 text-yellow-700"
                                                }`}
                                        >
                                            {isWinner ? "فائز بالسحب" : response.status === "completed" ? "مكتمل" : "قيد الإكمال"}
                                        </span>
                                        {response.score && (
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${response.score.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                                    }`}
                                            >
                                                {response.score.passed ? "نجح" : "رسب"}
                                            </span>
                                        )}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

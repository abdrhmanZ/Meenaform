"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Users, Trophy, Loader2, AlertCircle, CheckCircle, Play, RotateCcw } from "lucide-react";
import LuckyWheel from "./LuckyWheel";
import WinnersDisplay from "./WinnersDisplay";
import { Response } from "@/types/response";
import { Event } from "@/types/event";
import { eventsService } from "@/lib/api/services";

interface DrawPageProps {
    event: Event;
    responses: Response[];
    onClose: () => void;
    onDrawSaved: () => void;
}

interface Participant {
    id: string;
    name: string;
    score?: number;
}

interface FinalWinner {
    id: string;
    name: string;
    rank: number;
    score?: number;
}

export default function DrawPage({ event, responses, onClose, onDrawSaved }: DrawPageProps) {
    const [phase, setPhase] = useState<"prepare" | "wheel" | "winners">("prepare");
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [finalWinners, setFinalWinners] = useState<FinalWinner[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSaved, setIsSaved] = useState(false);
    const [savedWinnerIds, setSavedWinnerIds] = useState<string[]>([]);

    const winnersCount = event.settings.winnersCount || 1;
    const mode = event.settings.competitionMode || "random_draw";
    const qualifyingScore = event.settings.qualifyingScore || 70;

    useEffect(() => {
        // بناء قائمة المشاركين المؤهلين
        const eligible = responses
            .filter((r) => r.status === "completed")
            .filter((r) => {
                if (mode === "quiz_draw" && r.score) {
                    return r.score.percentage >= qualifyingScore;
                }
                return true;
            })
            .map((r) => ({
                id: r.id,
                name: r.participant.name || "مشارك",
                score: r.score?.percentage,
            }));
        setParticipants(eligible);
    }, [responses, mode, qualifyingScore]);

    const handleDrawComplete = async (wheelWinners: Participant[]) => {
        const mapped: FinalWinner[] = wheelWinners.map((w, i) => ({
            id: w.id,
            name: w.name,
            rank: i + 1,
            score: w.score,
        }));
        setFinalWinners(mapped);
        setPhase("winners");
        const ids = wheelWinners.map((w) => w.id);
        setSavedWinnerIds(ids);
        await saveDrawResults(ids);
    };

    const saveDrawResults = async (winnerIds: string[]) => {
        setIsSaving(true);
        setError(null);
        try {
            await eventsService.drawWinners(event.id, winnersCount, winnerIds);
            setIsSaved(true);
        } catch (err) {
            console.error("Failed to save draw:", err);
            setError("تم اختيار الفائزين لكن فشل حفظ النتائج في الخادم");
        } finally {
            setIsSaving(false);
        }
    };

    const [countdown, setCountdown] = useState<number | null>(null);

    const startCountdown = () => {
        setPhase("countdown" as any);
        setCountdown(3);
        let count = 3;
        const timer = setInterval(() => {
            count--;
            if (count > 0) {
                setCountdown(count);
            } else {
                clearInterval(timer);
                setCountdown(null);
                setPhase("wheel");
            }
        }, 800);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4 relative flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500 to-yellow-500 p-4 flex items-center justify-between flex-shrink-0 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <Trophy className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-lg">السحب العشوائي</h2>
                            <p className="text-amber-100 text-sm">{event.title}</p>
                        </div>
                    </div>
                    {phase !== "wheel" && phase !== ("countdown" as any) && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { if (isSaved) onDrawSaved(); onClose(); }}
                            className="text-white hover:bg-white/20 rounded-xl"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    )}
                </div>

                {/* Content */}
                <div className="p-5 overflow-y-auto flex-1">
                    {/* مرحلة التحضير */}
                    {phase === "prepare" && (
                        <div className="text-center space-y-6">
                            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                                <Users className="w-10 h-10 text-amber-600" />
                            </div>

                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">جاهز للسحب!</h3>
                                <p className="text-gray-600">
                                    {mode === "quiz_draw"
                                        ? `عدد المؤهلين (بدرجة ≥ ${qualifyingScore}%)`
                                        : "عدد المشاركين المسجلين"}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                                    <p className="text-3xl font-bold text-amber-600">{participants.length}</p>
                                    <p className="text-sm text-gray-600 mt-1">مشارك مؤهل</p>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                                    <p className="text-3xl font-bold text-blue-600">{winnersCount}</p>
                                    <p className="text-sm text-gray-600 mt-1">فائز مطلوب</p>
                                </div>
                            </div>

                            {participants.length === 0 ? (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                    <p className="text-red-700 text-sm">
                                        {mode === "quiz_draw"
                                            ? "لا يوجد مشاركون مؤهلون. تأكد من أن هناك إجابات بدرجة التأهل المطلوبة."
                                            : "لا يوجد مشاركون مسجلون بعد."}
                                    </p>
                                </div>
                            ) : (
                                <Button
                                    size="lg"
                                    className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-lg shadow-amber-300/40 py-4 text-lg font-bold rounded-xl"
                                    onClick={startCountdown}
                                >
                                    <Play className="w-5 h-5 ml-1" />
                                    بدء السحب العشوائي
                                </Button>
                            )}
                        </div>
                    )}

                    {/* مرحلة العداد التنازلي */}
                    {phase === ("countdown" as any) && countdown !== null && (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div
                                key={countdown}
                                className="animate-in zoom-in-50 duration-300 w-32 h-32 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-2xl shadow-amber-300/50"
                            >
                                <span className="text-6xl font-black text-white">{countdown}</span>
                            </div>
                            <p className="mt-6 text-gray-500 font-medium text-lg">استعد...</p>
                        </div>
                    )}

                    {/* مرحلة العجلة */}
                    {phase === "wheel" && (
                        <LuckyWheel
                            participants={participants}
                            winnersCount={winnersCount}
                            onWinnerSelected={() => { }}
                            onDrawComplete={handleDrawComplete}
                        />
                    )}

                    {/* مرحلة عرض الفائزين */}
                    {phase === "winners" && (
                        <div className="space-y-4">
                            {isSaving && (
                                <div className="flex items-center gap-2 text-sm text-amber-600 justify-center py-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    جاري حفظ النتائج...
                                </div>
                            )}
                            {isSaved && !error && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 flex items-center gap-2 justify-center">
                                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                    تم حفظ النتائج بنجاح
                                </div>
                            )}
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        {error}
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => saveDrawResults(savedWinnerIds)}
                                        disabled={isSaving}
                                        className="w-full gap-1.5 text-red-700 border-red-300 hover:bg-red-100"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        إعادة المحاولة
                                    </Button>
                                </div>
                            )}
                            <WinnersDisplay
                                winners={finalWinners}
                                competitionTitle={event.title}
                            />
                            <Button
                                variant="outline"
                                onClick={() => { if (isSaved) onDrawSaved(); onClose(); }}
                                className="w-full"
                            >
                                إغلاق
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

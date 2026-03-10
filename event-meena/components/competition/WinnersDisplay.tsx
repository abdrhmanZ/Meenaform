"use client";

import { useEffect } from "react";
import { Trophy, Medal, Award, Share2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

interface Winner {
    id: string;
    name: string;
    rank: number;
    score?: number;
}

interface WinnersDisplayProps {
    winners: Winner[];
    competitionTitle: string;
    onExportPDF?: () => void;
    onShare?: () => void;
}

const rankConfig: Record<number, { icon: any; color: string; bg: string; border: string; size: string; label: string }> = {
    1: { icon: Trophy, color: "text-yellow-600", bg: "bg-gradient-to-br from-yellow-50 to-amber-50", border: "border-yellow-300", size: "text-5xl", label: "الفائز الأول" },
    2: { icon: Medal, color: "text-gray-500", bg: "bg-gradient-to-br from-gray-50 to-slate-50", border: "border-gray-300", size: "text-4xl", label: "الفائز الثاني" },
    3: { icon: Award, color: "text-amber-700", bg: "bg-gradient-to-br from-orange-50 to-amber-50", border: "border-orange-300", size: "text-3xl", label: "الفائز الثالث" },
};

export default function WinnersDisplay({ winners, competitionTitle, onExportPDF, onShare }: WinnersDisplayProps) {
    useEffect(() => {
        // إطلاق confetti احتفالي
        const launchConfetti = () => {
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.4 }, colors: ["#f59e0b", "#fbbf24", "#1a56db", "#10b981"] });
            setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { y: 0.6, x: 0.2 }, colors: ["#7c3aed", "#f97316"] }), 600);
            setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { y: 0.6, x: 0.8 }, colors: ["#059669", "#dc2626"] }), 1200);
        };
        launchConfetti();
    }, []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 rounded-2xl p-8 shadow-xl text-white">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <Trophy className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-2">الفائزون!</h2>
                <p className="text-amber-100 text-lg">{competitionTitle}</p>
            </div>

            {/* Podium للمراكز الثلاثة الأولى */}
            {winners.length >= 1 && (
                <div className="flex items-end justify-center gap-4 py-4">
                    {/* المركز الثاني على اليسار */}
                    {winners[1] && (
                        <div className="flex flex-col items-center gap-2 animate-in slide-in-from-bottom duration-700 delay-300">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-2xl font-bold text-gray-700 shadow-lg">
                                {winners[1].name.charAt(0).toUpperCase()}
                            </div>
                            <p className="font-bold text-gray-900 text-center max-w-24 text-sm leading-tight">{winners[1].name}</p>
                            <div className="bg-gradient-to-b from-gray-300 to-gray-400 rounded-t-lg w-20 h-20 flex items-center justify-center shadow-lg">
                                <Medal className="w-8 h-8 text-gray-600" />
                            </div>
                        </div>
                    )}

                    {/* المركز الأول في المنتصف — الأكبر */}
                    <div className="flex flex-col items-center gap-2 animate-in zoom-in duration-700">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-300 to-amber-400 flex items-center justify-center text-3xl font-bold text-amber-900 shadow-xl border-4 border-yellow-200">
                            {winners[0].name.charAt(0).toUpperCase()}
                        </div>
                        <p className="font-bold text-gray-900 text-center max-w-28 leading-tight">{winners[0].name}</p>
                        {winners[0].score !== undefined && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{winners[0].score}%</span>
                        )}
                        <div className="bg-gradient-to-b from-yellow-400 to-amber-500 rounded-t-lg w-24 h-32 flex items-center justify-center shadow-xl">
                            <Trophy className="w-10 h-10 text-amber-900" />
                        </div>
                    </div>

                    {/* المركز الثالث على اليمين */}
                    {winners[2] && (
                        <div className="flex flex-col items-center gap-2 animate-in slide-in-from-bottom duration-700 delay-500">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-200 to-amber-300 flex items-center justify-center text-xl font-bold text-amber-800 shadow-lg">
                                {winners[2].name.charAt(0).toUpperCase()}
                            </div>
                            <p className="font-bold text-gray-900 text-center max-w-20 text-sm leading-tight">{winners[2].name}</p>
                            <div className="bg-gradient-to-b from-orange-300 to-amber-400 rounded-t-lg w-18 h-14 flex items-center justify-center shadow-lg" style={{ width: "4rem" }}>
                                <Award className="w-6 h-6 text-amber-700" />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* باقي الفائزين (المركز 4+) */}
            {winners.length > 3 && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-700 text-sm">فائزون آخرون</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {winners.slice(3).map((winner) => (
                            <div key={winner.id} className="flex items-center gap-3 px-4 py-3">
                                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0">
                                    {winner.rank}
                                </span>
                                <span className="font-medium text-gray-900 flex-1">{winner.name}</span>
                                {winner.score !== undefined && (
                                    <span className="text-sm text-gray-500">{winner.score}%</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* أزرار التصدير */}
            <div className="flex gap-3 justify-center flex-wrap">
                {onShare && (
                    <Button variant="outline" onClick={onShare} className="gap-2">
                        <Share2 className="w-4 h-4" />
                        مشاركة النتائج
                    </Button>
                )}
                {onExportPDF && (
                    <Button variant="outline" onClick={onExportPDF} className="gap-2">
                        <Download className="w-4 h-4" />
                        تصدير PDF
                    </Button>
                )}
            </div>
        </div>
    );
}

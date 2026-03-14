"use client";

import { Trophy, Medal, Award, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

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
}

export default function WinnersDisplay({ winners, competitionTitle, onExportPDF }: WinnersDisplayProps) {
    const isSingle = winners.length === 1;

    return (
        <div className="space-y-4">
            {/* Header — compact */}
            <div className="text-center bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 rounded-2xl p-5 shadow-lg text-white">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Trophy className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-1">الفائزون!</h2>
                <p className="text-amber-100 text-sm">{competitionTitle}</p>
            </div>

            {/* تصميم فائز واحد — مدمج ومحسّن */}
            {isSingle && (
                <div className="flex flex-col items-center gap-2 py-2">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-300 to-amber-400 flex items-center justify-center text-2xl font-bold text-amber-900 shadow-lg border-3 border-yellow-200">
                        {winners[0].name.charAt(0).toUpperCase()}
                    </div>
                    <p className="font-bold text-gray-900 text-lg">{winners[0].name}</p>
                    {winners[0].score !== undefined && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{winners[0].score}%</span>
                    )}
                    <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-md mt-1">
                        <Trophy className="w-4 h-4" />
                        الفائز الأول
                    </div>
                </div>
            )}

            {/* Podium للمراكز الثلاثة الأولى — فقط لأكثر من فائز */}
            {!isSingle && winners.length >= 1 && (
                <div className="flex items-end justify-center gap-3 py-2">
                    {/* المركز الثاني على اليسار */}
                    {winners[1] && (
                        <div className="flex flex-col items-center gap-1.5 animate-in slide-in-from-bottom duration-700 delay-300">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-lg font-bold text-gray-700 shadow-md">
                                {winners[1].name.charAt(0).toUpperCase()}
                            </div>
                            <p className="font-bold text-gray-900 text-center max-w-20 text-xs leading-tight">{winners[1].name}</p>
                            <div className="bg-gradient-to-b from-gray-300 to-gray-400 rounded-t-lg w-16 h-14 flex items-center justify-center shadow-md">
                                <Medal className="w-6 h-6 text-gray-600" />
                            </div>
                        </div>
                    )}

                    {/* المركز الأول في المنتصف */}
                    <div className="flex flex-col items-center gap-1.5 animate-in zoom-in duration-700">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-300 to-amber-400 flex items-center justify-center text-2xl font-bold text-amber-900 shadow-lg border-3 border-yellow-200">
                            {winners[0].name.charAt(0).toUpperCase()}
                        </div>
                        <p className="font-bold text-gray-900 text-center max-w-24 text-sm leading-tight">{winners[0].name}</p>
                        {winners[0].score !== undefined && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{winners[0].score}%</span>
                        )}
                        <div className="bg-gradient-to-b from-yellow-400 to-amber-500 rounded-t-lg w-20 h-24 flex items-center justify-center shadow-lg">
                            <Trophy className="w-8 h-8 text-amber-900" />
                        </div>
                    </div>

                    {/* المركز الثالث على اليمين */}
                    {winners[2] && (
                        <div className="flex flex-col items-center gap-1.5 animate-in slide-in-from-bottom duration-700 delay-500">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-200 to-amber-300 flex items-center justify-center text-lg font-bold text-amber-800 shadow-md">
                                {winners[2].name.charAt(0).toUpperCase()}
                            </div>
                            <p className="font-bold text-gray-900 text-center max-w-18 text-xs leading-tight">{winners[2].name}</p>
                            <div className="bg-gradient-to-b from-orange-300 to-amber-400 rounded-t-lg h-10 flex items-center justify-center shadow-md" style={{ width: "3.5rem" }}>
                                <Award className="w-5 h-5 text-amber-700" />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* باقي الفائزين (المركز 4+) */}
            {winners.length > 3 && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-700 text-xs">فائزون آخرون</h3>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-32 overflow-y-auto">
                        {winners.slice(3).map((winner) => (
                            <div key={winner.id} className="flex items-center gap-2 px-3 py-2">
                                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                                    {winner.rank}
                                </span>
                                <span className="font-medium text-gray-900 flex-1 text-sm">{winner.name}</span>
                                {winner.score !== undefined && (
                                    <span className="text-xs text-gray-500">{winner.score}%</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* زر التصدير */}
            {onExportPDF && (
                <div className="flex justify-center">
                    <Button variant="outline" size="sm" onClick={onExportPDF} className="gap-1.5 text-sm">
                        <Download className="w-3.5 h-3.5" />
                        تصدير PDF
                    </Button>
                </div>
            )}
        </div>
    );
}

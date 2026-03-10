"use client";

import { Event } from "@/types/event";
import { Response } from "@/types/response";
import { Users, Trophy, Target, CheckCircle } from "lucide-react";

interface CompetitionStatsProps {
    event: Event;
    responses: Response[];
}

export default function CompetitionStats({ event, responses }: CompetitionStatsProps) {
    const isQuizDraw = event.settings?.competitionMode === "quiz_draw";
    const qualifyingScore = event.settings?.qualifyingScore || 70;
    const winnersCount = event.settings?.winnersCount || 1;
    const drawCompleted = event.settings?.drawCompleted || false;

    // حساب المؤهلين (quiz_draw فقط)
    const qualifiedCount = isQuizDraw
        ? responses.filter((r) => {
            const s = r.score;
            if (!s) return false;
            return s.percentage >= qualifyingScore;
        }).length
        : responses.length;

    const stats = [
        {
            icon: Users,
            value: responses.length,
            label: "إجمالي المشاركين",
            color: "text-blue-600",
            bg: "bg-blue-50",
            border: "border-blue-100",
        },
        ...(isQuizDraw
            ? [
                {
                    icon: Target,
                    value: qualifiedCount,
                    label: `مؤهلون للسحب (≥${qualifyingScore}%)`,
                    color: "text-emerald-600",
                    bg: "bg-emerald-50",
                    border: "border-emerald-100",
                },
            ]
            : []),
        {
            icon: Trophy,
            value: winnersCount,
            label: "فائزون مطلوبون",
            color: "text-amber-600",
            bg: "bg-amber-50",
            border: "border-amber-100",
        },
        {
            icon: CheckCircle,
            value: drawCompleted ? "مكتمل" : "لم يبدأ",
            label: "حالة السحب",
            color: drawCompleted ? "text-green-600" : "text-gray-500",
            bg: drawCompleted ? "bg-green-50" : "bg-gray-50",
            border: drawCompleted ? "border-green-100" : "border-gray-200",
            isText: true,
        },
    ];

    return (
        <div className={`grid gap-4 mb-6 ${isQuizDraw ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-3"}`}>
            {stats.map((stat, i) => (
                <div
                    key={i}
                    className={`${stat.bg} ${stat.border} border rounded-xl p-4 text-center shadow-sm`}
                >
                    <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                    <div className={`text-2xl font-bold mb-1 ${stat.color}`}>
                        {stat.isText ? stat.value : stat.value.toLocaleString("ar-SA")}
                    </div>
                    <div className="text-xs text-gray-600 font-medium">{stat.label}</div>
                </div>
            ))}
        </div>
    );
}

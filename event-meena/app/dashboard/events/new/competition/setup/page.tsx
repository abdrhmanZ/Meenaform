"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
    Trophy,
    ArrowLeft,
    ArrowRight,
    Brain,
    Dice6,
    Users,
    Target,
    Clock,
    Loader2,
} from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useEventsStore } from "@/store/eventsStore";
import { Event } from "@/types/event";

interface FormData {
    title: string;
    description: string;
    winnersCount: number;
    qualifyingScore: number;
    timeLimit: number | null;
    allowMultipleResponses: boolean;
}

function CompetitionSetupContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = (searchParams.get("mode") || "random_draw") as "quiz_draw" | "random_draw";
    const { createEvent } = useEventsStore();

    const [form, setForm] = useState<FormData>({
        title: "",
        description: "",
        winnersCount: 1,
        qualifyingScore: 70,
        timeLimit: null,
        allowMultipleResponses: false,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

    const isQuizDraw = mode === "quiz_draw";

    const validate = () => {
        const newErrors: Partial<Record<keyof FormData, string>> = {};
        if (!form.title.trim()) newErrors.title = "العنوان مطلوب";
        if (form.winnersCount < 1) newErrors.winnersCount = "يجب أن يكون عدد الفائزين 1 على الأقل";
        if (isQuizDraw && (form.qualifyingScore < 1 || form.qualifyingScore > 100))
            newErrors.qualifyingScore = "يجب أن تكون نسبة التأهل بين 1 و 100";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setIsSubmitting(true);
        try {
            const now = new Date().toISOString();
            const eventData: Event = {
                id: "",
                title: form.title,
                description: form.description,
                type: "competition",
                status: "active",
                sections: [],
                settings: {
                    competitionMode: mode,
                    winnersCount: form.winnersCount,
                    qualifyingScore: isQuizDraw ? form.qualifyingScore : undefined,
                    allowMultipleResponses: form.allowMultipleResponses,
                    timeLimit: form.timeLimit || undefined,
                    showProgressBar: true,
                    allowAnonymous: true,
                    requireAuth: false,
                    thankYouMessage: isQuizDraw
                        ? "شكراً لمشاركتك! ترقب إعلان الفائزين."
                        : "🎉 تم تسجيلك! ترقب إعلان الفائزين.",
                },
                stats: {
                    totalResponses: 0,
                    completedResponses: 0,
                    inProgressResponses: 0,
                    completionRate: 0,
                    averageTime: 0,
                },
                createdAt: now,
                updatedAt: now,
            };

            const created = await createEvent(eventData);

            if (isQuizDraw) {
                // توجيه لبناء الأسئلة
                router.push(`/dashboard/events/${created.id}/quiz-builder`);
            } else {
                // مباشرة لصفحة التفاصيل
                router.push(`/dashboard/events/${created.id}`);
            }
        } catch (err) {
            console.error("Failed to create competition:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 p-4 sm:p-8">
            <div className="max-w-2xl mx-auto">
                {/* زر العودة */}
                <Button
                    variant="ghost"
                    onClick={() => router.push("/dashboard/events/new/competition")}
                    className="mb-6"
                >
                    <ArrowLeft className="w-4 h-4 ml-2" />
                    العودة
                </Button>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg ${isQuizDraw ? "bg-gradient-to-br from-amber-400 to-yellow-500 shadow-amber-200" : "bg-gradient-to-br from-emerald-400 to-green-500 shadow-emerald-200"}`}>
                        {isQuizDraw ? <Brain className="w-8 h-8 text-white" /> : <Dice6 className="w-8 h-8 text-white" />}
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {isQuizDraw ? "إعداد مسابقة الأسئلة" : "إعداد السحب العشوائي"}
                    </h1>
                    <p className="text-gray-600">
                        {isQuizDraw
                            ? "أدخل معلومات المسابقة ثم ستنتقل لإضافة الأسئلة"
                            : "أدخل معلومات السحب وانشره مباشرة"}
                    </p>
                </div>

                {/* النموذج */}
                <Card className="p-6 shadow-lg space-y-6">
                    {/* العنوان */}
                    <div>
                        <Label htmlFor="title" className="text-sm font-semibold text-gray-700 mb-2 block">
                            <Trophy className="w-4 h-4 inline ml-1 text-amber-500" />
                            عنوان {isQuizDraw ? "المسابقة" : "السحب"} *
                        </Label>
                        <Input
                            id="title"
                            placeholder={isQuizDraw ? "مثال: مسابقة الثقافة العامة 2025" : "مثال: سحب عيد الفطر المبارك"}
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            className={errors.title ? "border-red-400" : ""}
                        />
                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                    </div>

                    {/* الوصف */}
                    <div>
                        <Label htmlFor="description" className="text-sm font-semibold text-gray-700 mb-2 block">
                            الوصف (اختياري)
                        </Label>
                        <Textarea
                            id="description"
                            placeholder={isQuizDraw
                                ? "اكتب وصفاً مختصراً للمسابقة والجوائز..."
                                : "اكتب وصفاً مختصراً للسحب والجوائز..."}
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            rows={3}
                        />
                    </div>

                    {/* عدد الفائزين */}
                    <div>
                        <Label htmlFor="winners" className="text-sm font-semibold text-gray-700 mb-2 block">
                            <Trophy className="w-4 h-4 inline ml-1 text-amber-500" />
                            عدد الفائزين
                        </Label>
                        <div className="flex items-center gap-4">
                            <Input
                                id="winners"
                                type="number"
                                min={1}
                                max={100}
                                value={form.winnersCount}
                                onChange={(e) => setForm({ ...form, winnersCount: Math.max(1, parseInt(e.target.value) || 1) })}
                                className="w-32"
                            />
                            <span className="text-sm text-gray-500">
                                {form.winnersCount === 1 ? "فائز واحد" : `${form.winnersCount} فائزين`}
                            </span>
                        </div>
                    </div>

                    {/* نسبة التأهل (للمسابقة فقط) */}
                    {isQuizDraw && (
                        <div>
                            <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                                <Target className="w-4 h-4 inline ml-1 text-amber-500" />
                                نسبة التأهل للسحب: <span className="text-amber-600 font-bold">{form.qualifyingScore}%</span>
                            </Label>
                            <Slider
                                value={[form.qualifyingScore]}
                                onValueChange={([v]) => setForm({ ...form, qualifyingScore: v })}
                                min={10}
                                max={100}
                                step={5}
                                className="mb-2"
                            />
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>10%</span>
                                <span>المشاركون الذين يحققون هذه النسبة أو أعلى يدخلون السحب</span>
                                <span>100%</span>
                            </div>
                        </div>
                    )}

                    {/* وقت المسابقة (للمسابقة فقط) */}
                    {isQuizDraw && (
                        <div>
                            <Label htmlFor="timelimit" className="text-sm font-semibold text-gray-700 mb-2 block">
                                <Clock className="w-4 h-4 inline ml-1 text-gray-400" />
                                مدة المسابقة (اختياري)
                            </Label>
                            <div className="flex items-center gap-3">
                                <Input
                                    id="timelimit"
                                    type="number"
                                    min={1}
                                    placeholder="غير محدود"
                                    value={form.timeLimit || ""}
                                    onChange={(e) => setForm({ ...form, timeLimit: e.target.value ? parseInt(e.target.value) : null })}
                                    className="w-36"
                                />
                                <span className="text-sm text-gray-500">دقيقة</span>
                            </div>
                        </div>
                    )}

                    {/* إجمالي المشاركين (للسحب) */}
                    {!isQuizDraw && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                            <Users className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-emerald-800">تسجيل مفتوح</p>
                                <p className="text-xs text-emerald-700 mt-1">
                                    كل من يزور رابط السحب ويسجل اسمه يدخل القرعة تلقائياً. لا توجد أسئلة.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* أزرار */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => router.push("/dashboard/events/new/competition")}
                            className="flex-1"
                        >
                            إلغاء
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className={`flex-1 text-white shadow-lg font-bold ${isQuizDraw
                                ? "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 shadow-amber-200"
                                : "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-emerald-200"}`}
                        >
                            {isSubmitting ? (
                                <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جاري الإنشاء...</>
                            ) : isQuizDraw ? (
                                <><ArrowRight className="w-4 h-4 ml-2" />التالي: إضافة الأسئلة</>
                            ) : (
                                <><Trophy className="w-4 h-4 ml-2" />نشر السحب</>
                            )}
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default function CompetitionSetupPage() {
    return (
        <ProtectedRoute>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>}>
                <CompetitionSetupContent />
            </Suspense>
        </ProtectedRoute>
    );
}

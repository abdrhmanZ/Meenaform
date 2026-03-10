"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useEventsStore } from "@/store/eventsStore";
import { eventsService } from "@/lib/api/services";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import LoadingState from "@/components/dashboard/LoadingState";
import { useToast } from "@/hooks/use-toast";
import {
    ArrowRight,
    Plus,
    Trash2,
    GripVertical,
    Trophy,
    CheckCircle,
    Loader2,
    AlertCircle,
    Save,
} from "lucide-react";
import { Section } from "@/types/section";
import { Component } from "@/types/component";
import { QuestionChoice } from "@/types/component";
import { defaultSectionSettings } from "@/types/section";

// ============================================================
// أنواع محلية لحالة بناء الأسئلة
// ============================================================
interface QuizOption {
    id: string;
    text: string;
    isCorrect: boolean;
}

interface QuizQuestion {
    id: string;
    text: string;
    options: QuizOption[];
    points: number;
}

function generateId(): string {
    return `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createEmptyOption(index: number): QuizOption {
    return {
        id: `opt_${Date.now()}_${index}`,
        text: "",
        isCorrect: false,
    };
}

function createEmptyQuestion(): QuizQuestion {
    return {
        id: generateId(),
        text: "",
        options: [
            createEmptyOption(0),
            createEmptyOption(1),
            createEmptyOption(2),
            createEmptyOption(3),
        ],
        points: 1,
    };
}

// ============================================================
// المكون الرئيسي
// ============================================================
function QuizBuilderContent() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const eventId = params.id as string;

    const { currentEvent, fetchEventById, isLoading } = useEventsStore();

    const [questions, setQuestions] = useState<QuizQuestion[]>([createEmptyQuestion()]);
    const [isSaving, setIsSaving] = useState(false);
    const [hasLoadedExisting, setHasLoadedExisting] = useState(false);

    // جلب بيانات الحدث
    useEffect(() => {
        if (eventId) {
            fetchEventById(eventId);
        }
    }, [eventId, fetchEventById]);

    // تحميل الأسئلة الموجودة (إذا كان تعديل)
    useEffect(() => {
        if (currentEvent && !hasLoadedExisting && currentEvent.sections?.length > 0) {
            const existingQuestions: QuizQuestion[] = [];

            for (const section of currentEvent.sections) {
                for (const comp of section.components) {
                    if (comp.type === "question" && comp.settings.type === "question") {
                        const settings = comp.settings;
                        existingQuestions.push({
                            id: comp.id,
                            text: settings.label || "",
                            options: (settings.choices || []).map((c: QuestionChoice, i: number) => ({
                                id: c.id || `opt_${i}`,
                                text: c.label || "",
                                isCorrect: c.isCorrect || false,
                            })),
                            points: settings.points || 1,
                        });
                    }
                }
            }

            if (existingQuestions.length > 0) {
                setQuestions(existingQuestions);
            }
            setHasLoadedExisting(true);
        }
    }, [currentEvent, hasLoadedExisting]);

    // ============================================================
    // دوال تعديل الأسئلة
    // ============================================================
    const updateQuestion = useCallback((questionId: string, updates: Partial<QuizQuestion>) => {
        setQuestions((prev) =>
            prev.map((q) => (q.id === questionId ? { ...q, ...updates } : q))
        );
    }, []);

    const updateOption = useCallback((questionId: string, optionId: string, text: string) => {
        setQuestions((prev) =>
            prev.map((q) =>
                q.id === questionId
                    ? {
                        ...q,
                        options: q.options.map((o) =>
                            o.id === optionId ? { ...o, text } : o
                        ),
                    }
                    : q
            )
        );
    }, []);

    const setCorrectOption = useCallback((questionId: string, optionId: string) => {
        setQuestions((prev) =>
            prev.map((q) =>
                q.id === questionId
                    ? {
                        ...q,
                        options: q.options.map((o) => ({
                            ...o,
                            isCorrect: o.id === optionId,
                        })),
                    }
                    : q
            )
        );
    }, []);

    const addOption = useCallback((questionId: string) => {
        setQuestions((prev) =>
            prev.map((q) =>
                q.id === questionId && q.options.length < 6
                    ? { ...q, options: [...q.options, createEmptyOption(q.options.length)] }
                    : q
            )
        );
    }, []);

    const removeOption = useCallback((questionId: string, optionId: string) => {
        setQuestions((prev) =>
            prev.map((q) =>
                q.id === questionId && q.options.length > 2
                    ? {
                        ...q,
                        options: q.options.filter((o) => o.id !== optionId),
                    }
                    : q
            )
        );
    }, []);

    const addQuestion = useCallback(() => {
        setQuestions((prev) => [...prev, createEmptyQuestion()]);
    }, []);

    const removeQuestion = useCallback((questionId: string) => {
        setQuestions((prev) => {
            if (prev.length <= 1) return prev;
            return prev.filter((q) => q.id !== questionId);
        });
    }, []);

    // ============================================================
    // التحقق من صحة البيانات
    // ============================================================
    const validate = (): string | null => {
        if (questions.length === 0) return "يجب إضافة سؤال واحد على الأقل";

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.text.trim()) return `السؤال ${i + 1}: نص السؤال مطلوب`;

            const filledOptions = q.options.filter((o) => o.text.trim());
            if (filledOptions.length < 2) return `السؤال ${i + 1}: يجب ملء خيارين على الأقل`;

            const hasCorrect = q.options.some((o) => o.isCorrect && o.text.trim());
            if (!hasCorrect) return `السؤال ${i + 1}: يجب تحديد الإجابة الصحيحة`;

            if (q.points < 1) return `السؤال ${i + 1}: الدرجة يجب أن تكون 1 على الأقل`;
        }

        return null;
    };

    // ============================================================
    // حفظ ونشر
    // ============================================================
    const handleSave = async (publish: boolean) => {
        const error = validate();
        if (error) {
            toast({ title: "خطأ في البيانات", description: error, variant: "destructive" });
            return;
        }

        if (!currentEvent) return;

        setIsSaving(true);
        try {
            // بناء الـ components من الأسئلة
            const components: Component[] = questions.map((q, idx) => ({
                id: q.id,
                sectionId: "quiz_section",
                type: "question" as const,
                order: idx,
                settings: {
                    type: "question" as const,
                    label: q.text,
                    questionType: "single_choice" as const,
                    required: true,
                    choices: q.options
                        .filter((o) => o.text.trim())
                        .map((o) => ({
                            id: o.id,
                            label: o.text,
                            value: o.text,
                            isCorrect: o.isCorrect,
                        })),
                    correctAnswer: q.options.find((o) => o.isCorrect)?.text || "",
                    points: q.points,
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }));

            // بناء الـ section
            const section: Section = {
                id: currentEvent.sections?.[0]?.id || "quiz_section",
                eventId: eventId,
                title: "أسئلة المسابقة",
                description: "",
                order: 0,
                components: components,
                settings: defaultSectionSettings,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            // بناء الحدث المحدّث
            const updatedEvent = {
                ...currentEvent,
                status: publish ? ("active" as const) : currentEvent.status,
                sections: [section],
            };

            await eventsService.updateWithSections(eventId, updatedEvent);

            toast({
                title: publish ? "تم النشر" : "تم الحفظ",
                description: publish
                    ? "تم حفظ الأسئلة ونشر المسابقة بنجاح"
                    : "تم حفظ الأسئلة كمسودة",
            });

            router.push(`/dashboard/events/${eventId}`);
        } catch (err) {
            console.error("Failed to save quiz:", err);
            toast({
                title: "خطأ",
                description: "فشل حفظ الأسئلة. حاول مرة أخرى.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    // ============================================================
    // حسابات
    // ============================================================
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

    // ============================================================
    // حالة التحميل
    // ============================================================
    if (isLoading || !currentEvent) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <LoadingState variant="details" />
            </div>
        );
    }

    // ============================================================
    // العرض
    // ============================================================
    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-amber-100 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push("/dashboard/events")}
                                className="text-gray-600 hover:text-gray-900"
                            >
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900">أسئلة المسابقة</h1>
                                <p className="text-sm text-gray-500">{currentEvent.title}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* إحصائيات مختصرة */}
                            <div className="hidden sm:flex items-center gap-4 text-sm text-gray-500 ml-4">
                                <span>{questions.length} سؤال</span>
                                <span className="text-amber-600 font-medium">{totalPoints} درجة</span>
                            </div>

                            <Button
                                variant="outline"
                                onClick={() => handleSave(false)}
                                disabled={isSaving}
                                className="border-gray-300"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
                                حفظ مسودة
                            </Button>

                            <Button
                                onClick={() => handleSave(true)}
                                disabled={isSaving}
                                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-md shadow-amber-200/50"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <CheckCircle className="w-4 h-4 ml-2" />}
                                حفظ ونشر
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                {/* معلومات المسابقة */}
                <div className="mb-8 flex items-center gap-4 p-4 bg-white rounded-xl border border-amber-100">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center flex-shrink-0">
                        <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-sm text-gray-600">
                        <span className="font-medium text-gray-900">{currentEvent.title}</span>
                        {currentEvent.settings.qualifyingScore && (
                            <span className="mx-2">|</span>
                        )}
                        {currentEvent.settings.qualifyingScore && (
                            <span>درجة التأهل: {currentEvent.settings.qualifyingScore}%</span>
                        )}
                        <span className="mx-2">|</span>
                        <span>الفائزين: {currentEvent.settings.winnersCount || 1}</span>
                    </div>
                </div>

                {/* قائمة الأسئلة */}
                <div className="space-y-6">
                    {questions.map((question, qIndex) => (
                        <Card
                            key={question.id}
                            className="overflow-hidden border border-gray-200 hover:border-amber-200 transition-colors"
                        >
                            {/* رأس السؤال */}
                            <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100">
                                <GripVertical className="w-4 h-4 text-gray-300" />
                                <span className="text-sm font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-md">
                                    {qIndex + 1}
                                </span>
                                <span className="text-sm text-gray-500 flex-1">سؤال اختيار واحد</span>

                                {/* درجة السؤال */}
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-gray-500">الدرجة:</span>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={question.points}
                                        onChange={(e) =>
                                            updateQuestion(question.id, {
                                                points: Math.max(1, parseInt(e.target.value) || 1),
                                            })
                                        }
                                        className="w-16 h-7 text-center text-sm border-gray-200"
                                    />
                                </div>

                                {/* حذف السؤال */}
                                {questions.length > 1 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeQuestion(question.id)}
                                        className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                )}
                            </div>

                            {/* محتوى السؤال */}
                            <div className="p-5 space-y-4">
                                {/* نص السؤال */}
                                <Input
                                    value={question.text}
                                    onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                                    placeholder="اكتب نص السؤال هنا..."
                                    className="text-base font-medium border-gray-200 focus:border-amber-400 focus:ring-amber-400/20 h-11"
                                />

                                {/* الخيارات */}
                                <div className="space-y-2.5">
                                    {question.options.map((option, oIndex) => (
                                        <div
                                            key={option.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${option.isCorrect
                                                    ? "border-green-300 bg-green-50/50"
                                                    : "border-gray-200 hover:border-gray-300"
                                                }`}
                                        >
                                            {/* Radio للإجابة الصحيحة */}
                                            <button
                                                type="button"
                                                onClick={() => setCorrectOption(question.id, option.id)}
                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${option.isCorrect
                                                        ? "border-green-500 bg-green-500"
                                                        : "border-gray-300 hover:border-amber-400"
                                                    }`}
                                                title="تحديد كإجابة صحيحة"
                                            >
                                                {option.isCorrect && (
                                                    <CheckCircle className="w-3 h-3 text-white" />
                                                )}
                                            </button>

                                            {/* حرف الخيار */}
                                            <span className="text-sm font-medium text-gray-400 w-5 text-center">
                                                {String.fromCharCode(1571 + oIndex) /* أ ب ت ث */}
                                            </span>

                                            {/* نص الخيار */}
                                            <Input
                                                value={option.text}
                                                onChange={(e) => updateOption(question.id, option.id, e.target.value)}
                                                placeholder={`الخيار ${oIndex + 1}`}
                                                className={`flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 h-auto py-0 text-sm ${option.isCorrect ? "text-green-800 font-medium" : "text-gray-700"
                                                    }`}
                                            />

                                            {/* حذف الخيار */}
                                            {question.options.length > 2 && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeOption(question.id, option.id)}
                                                    className="h-6 w-6 text-gray-300 hover:text-red-500"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}

                                    {/* زر إضافة خيار */}
                                    {question.options.length < 6 && (
                                        <button
                                            onClick={() => addOption(question.id)}
                                            className="w-full py-2.5 text-sm text-gray-400 hover:text-amber-600 border border-dashed border-gray-200 hover:border-amber-300 rounded-lg transition-colors"
                                        >
                                            + إضافة خيار
                                        </button>
                                    )}
                                </div>

                                {/* تنبيه الإجابة الصحيحة */}
                                {!question.options.some((o) => o.isCorrect) && (
                                    <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-md">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        اضغط على الدائرة بجانب الخيار لتحديده كإجابة صحيحة
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>

                {/* زر إضافة سؤال */}
                <div className="mt-6">
                    <Button
                        variant="outline"
                        onClick={addQuestion}
                        className="w-full py-6 border-2 border-dashed border-amber-200 hover:border-amber-400 hover:bg-amber-50/50 text-amber-600 hover:text-amber-700 transition-all"
                    >
                        <Plus className="w-5 h-5 ml-2" />
                        إضافة سؤال جديد
                    </Button>
                </div>

                {/* ملخص */}
                <div className="mt-8 flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                    <div className="flex items-center gap-6 text-sm">
                        <div>
                            <span className="text-gray-500">إجمالي الأسئلة: </span>
                            <span className="font-bold text-gray-900">{questions.length}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">إجمالي الدرجات: </span>
                            <span className="font-bold text-amber-600">{totalPoints}</span>
                        </div>
                        {currentEvent.settings.qualifyingScore && (
                            <div>
                                <span className="text-gray-500">درجة التأهل: </span>
                                <span className="font-bold text-green-600">
                                    {Math.ceil(totalPoints * (currentEvent.settings.qualifyingScore / 100))}/{totalPoints}
                                </span>
                            </div>
                        )}
                    </div>

                    <Button
                        onClick={() => handleSave(true)}
                        disabled={isSaving}
                        className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-md shadow-amber-200/50"
                    >
                        {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin ml-2" />
                        ) : (
                            <CheckCircle className="w-4 h-4 ml-2" />
                        )}
                        حفظ ونشر
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// Export مع ProtectedRoute
// ============================================================
export default function QuizBuilderPage() {
    return (
        <ProtectedRoute>
            <QuizBuilderContent />
        </ProtectedRoute>
    );
}

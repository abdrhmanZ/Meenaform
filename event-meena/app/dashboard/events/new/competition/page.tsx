"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Dice6, ArrowLeft, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

function CompetitionChoicePage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 flex items-center justify-center p-4">
            <div className="w-full max-w-5xl">
                {/* زر العودة */}
                <Button
                    variant="ghost"
                    onClick={() => router.push("/dashboard/events")}
                    className="mb-8"
                >
                    <ArrowLeft className="w-4 h-4 ml-2" />
                    العودة إلى الأحداث
                </Button>

                {/* العنوان */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 shadow-xl shadow-amber-300/40 mb-6">
                        <Trophy className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        إنشاء مسابقة
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        اختر نوع المسابقة التي تريد إنشاءها — مسابقة أسئلة أو سحب عشوائي مباشر
                    </p>
                </div>

                {/* الخيارات */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                    {/* مسابقة أسئلة */}
                    <Card
                        className="p-8 hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:border-amber-300 hover:scale-105 border-2"
                        onClick={() => router.push("/dashboard/events/new/competition/setup?mode=quiz_draw")}
                    >
                        <div className="text-center">
                            <div className="inline-flex p-6 rounded-full bg-amber-50 mb-6 group-hover:bg-amber-100 transition-colors">
                                <Brain className="w-16 h-16 text-amber-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-3">
                                مسابقة أسئلة
                            </h2>
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                ضع أسئلة للمتسابقين — الناجحون يدخلون السحب العشوائي لاختيار الفائزين
                            </p>
                            <ul className="text-sm text-gray-500 space-y-2 mb-8 text-right">
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"></span>
                                    أسئلة متنوعة (اختيار، نص، تقييم...)
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"></span>
                                    درجة تأهل قابلة للتخصيص
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"></span>
                                    عجلة حظ لاختيار الفائزين
                                </li>
                            </ul>
                            <Button
                                size="lg"
                                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-lg shadow-amber-300/30"
                            >
                                إنشاء مسابقة أسئلة
                            </Button>
                        </div>
                    </Card>

                    {/* سحب عشوائي */}
                    <Card
                        className="p-8 hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:border-emerald-300 hover:scale-105 border-2"
                        onClick={() => router.push("/dashboard/events/new/competition/setup?mode=random_draw")}
                    >
                        <div className="text-center">
                            <div className="inline-flex p-6 rounded-full bg-emerald-50 mb-6 group-hover:bg-emerald-100 transition-colors">
                                <Dice6 className="w-16 h-16 text-emerald-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-3">
                                سحب عشوائي
                            </h2>
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                تسجيل مباشر بدون أسئلة — كل مشارك يدخل السحب فور تسجيله
                            </p>
                            <ul className="text-sm text-gray-500 space-y-2 mb-8 text-right">
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                                    تسجيل سريع (اسم + تواصل فقط)
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                                    بدون أسئلة أو اختبارات
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                                    عجلة حظ لاختيار الفائزين
                                </li>
                            </ul>
                            <Button
                                size="lg"
                                className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg shadow-emerald-300/30"
                            >
                                إنشاء سحب عشوائي
                            </Button>
                        </div>
                    </Card>
                </div>

                <p className="text-center text-sm text-gray-500 mt-10">
                    يمكنك تعديل إعدادات المسابقة في أي وقت بعد الإنشاء
                </p>
            </div>
        </div>
    );
}

export default function CompetitionPage() {
    return (
        <ProtectedRoute>
            <CompetitionChoicePage />
        </ProtectedRoute>
    );
}

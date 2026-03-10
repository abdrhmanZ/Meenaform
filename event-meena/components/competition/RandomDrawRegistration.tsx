"use client";

import { useState } from "react";
import { Event } from "@/types/event";
import { responsesService } from "@/lib/api/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Users, CheckCircle, Dice6, Sparkles, AlertCircle } from "lucide-react";
import ParticipateHeader from "@/components/events/participate/ParticipateHeader";
import ParticipateFooter from "@/components/events/participate/ParticipateFooter";
import confetti from "canvas-confetti";

interface Props {
    event: Event;
}

export default function RandomDrawRegistration({ event }: Props) {
    const [name, setName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [participantNumber, setParticipantNumber] = useState(0);
    const [error, setError] = useState("");

    const winnersCount = event.settings?.winnersCount || 1;
    const totalBefore = event.stats?.completedResponses || 0;

    const fireConfetti = () => {
        confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.55 },
            colors: ["#f59e0b", "#fbbf24", "#fcd34d", "#fff", "#fb923c"],
        });
        setTimeout(() => {
            confetti({
                particleCount: 60,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 0.6 },
                colors: ["#f59e0b", "#fbbf24"],
            });
            confetti({
                particleCount: 60,
                angle: 120,
                spread: 55,
                origin: { x: 1, y: 0.6 },
                colors: ["#f59e0b", "#fbbf24"],
            });
        }, 300);
    };

    const handleSubmit = async () => {
        if (!name.trim() || name.trim().length < 2) {
            setError("يرجى إدخال اسمك (حرفان على الأقل)");
            return;
        }
        setError("");
        setIsSubmitting(true);
        try {
            const response = await responsesService.startResponse(event.id, {
                name: name.trim(),
            });
            await responsesService.completeResponse(response.id, []);
            setParticipantNumber(totalBefore + 1);
            setIsRegistered(true);
            setTimeout(fireConfetti, 200);
        } catch (err: any) {
            const msg = err?.message || "";
            if (msg.includes("مسبقاً") || msg.includes("مسبق")) {
                setError("لقد سجّلت في هذا السحب مسبقاً");
            } else {
                setError("حدث خطأ أثناء التسجيل، يرجى المحاولة مرة أخرى");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // ===== شاشة النجاح =====
    if (isRegistered) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 flex flex-col">
                <ParticipateHeader creatorName={event.userId || ""} />
                <div className="flex-1 flex items-center justify-center px-4 py-12">
                    <div className="w-full max-w-md">
                        {/* بطاقة النجاح */}
                        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-amber-100">
                            {/* شريط علوي */}
                            <div className="bg-gradient-to-r from-amber-400 to-yellow-400 h-2" />

                            <div className="p-8 sm:p-10 text-center">
                                {/* أيقونة النجاح */}
                                <div className="relative inline-block mb-6">
                                    <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-xl shadow-amber-200 mx-auto">
                                        <CheckCircle className="w-12 h-12 text-white" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-amber-200">
                                        <Sparkles className="w-4 h-4 text-amber-500" />
                                    </div>
                                </div>

                                {/* العنوان */}
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                                    تم تسجيلك بنجاح!
                                </h1>
                                <p className="text-amber-600 text-lg font-semibold mb-6">
                                    مرحباً، {name}
                                </p>

                                {/* بيانات التسجيل */}
                                <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 mb-6 text-right">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-gray-500 text-sm">رقم مشاركتك</span>
                                        <span className="text-2xl font-bold text-amber-600">
                                            #{participantNumber}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-gray-500 text-sm">حدث السحب</span>
                                        <span className="font-semibold text-gray-800 text-sm max-w-[60%] text-left">
                                            {event.title}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500 text-sm">عدد الفائزين</span>
                                        <div className="flex items-center gap-1">
                                            <Trophy className="w-4 h-4 text-amber-500" />
                                            <span className="font-bold text-amber-700">{winnersCount}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* رسالة الانتظار */}
                                <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl p-4 text-white">
                                    <p className="text-sm font-medium leading-relaxed">
                                        أنت الآن في قائمة المتسابقين! ترقّب إعلان الفائزين من قِبَل المنظّم
                                    </p>
                                </div>

                                {/* Sparkles ديكور */}
                                <div className="flex items-center justify-center gap-2 mt-6 text-amber-300">
                                    <Sparkles className="w-4 h-4" />
                                    <span className="text-xs text-gray-400">بالتوفيق، نتمنى لك الفوز!</span>
                                    <Sparkles className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <ParticipateFooter />
            </div>
        );
    }

    // ===== شاشة التسجيل =====
    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 flex flex-col">
            <ParticipateHeader creatorName={event.userId || ""} />

            <div className="flex-1 px-4 py-8 sm:py-12">
                <div className="max-w-lg mx-auto space-y-5">

                    {/* بطاقة الحدث */}
                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-amber-100">
                        {/* هيدر ذهبي */}
                        <div className="bg-gradient-to-r from-amber-500 to-yellow-400 p-8 sm:p-10 text-center relative overflow-hidden">
                            {/* نمط نقطي */}
                            <div className="absolute inset-0 opacity-10"
                                style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "28px 28px" }}
                            />
                            <div className="relative z-10">
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
                                    <Dice6 className="w-8 h-8 text-white" />
                                </div>
                                <Badge className="bg-white/25 text-white border-white/40 mb-3 px-4 py-1 text-sm font-semibold">
                                    سحب عشوائي
                                </Badge>
                                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-snug">
                                    {event.title}
                                </h1>
                                {event.description && (
                                    <p className="text-white/90 text-sm sm:text-base leading-relaxed mt-2 max-w-sm mx-auto">
                                        {event.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* التفاصيل والرقم */}
                        <div className="p-5 sm:p-6 bg-gradient-to-b from-amber-50 to-white">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white rounded-2xl border-2 border-amber-100 p-4 text-center shadow-sm">
                                    <Trophy className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                                    <div className="text-2xl font-bold text-amber-600">{winnersCount}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        {winnersCount === 1 ? "فائز" : "فائزون"}
                                    </div>
                                </div>
                                <div className="bg-white rounded-2xl border-2 border-amber-100 p-4 text-center shadow-sm">
                                    <Users className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                                    <div className="text-2xl font-bold text-blue-500">{totalBefore + 1}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">مشاركك الآن</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* بطاقة التسجيل */}
                    <div className="bg-white rounded-3xl shadow-xl border border-amber-100 p-6 sm:p-8">
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <Dice6 className="w-6 h-6 text-amber-600" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">سجّل اسمك للدخول في القرعة</h2>
                            <p className="text-sm text-gray-500 mt-1">مجاني تماماً — اسمك فقط يكفي</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                                    اسمك الكامل <span className="text-amber-500">*</span>
                                </label>
                                <Input
                                    placeholder="أدخل اسمك..."
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        setError("");
                                    }}
                                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                    className={`h-13 text-base rounded-xl border-2 transition-colors ${error
                                        ? "border-red-400 focus:border-red-400"
                                        : "border-gray-200 focus:border-amber-400"
                                        }`}
                                    disabled={isSubmitting}
                                    autoFocus
                                />
                                {error && (
                                    <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                                    </p>
                                )}
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !name.trim()}
                                className="w-full h-13 text-base font-bold rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-white shadow-lg shadow-amber-200 transition-all duration-200 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                                        جاري التسجيل...
                                    </>
                                ) : (
                                    <>
                                        <Dice6 className="w-5 h-5 ml-2" />
                                        سجّل في السحب
                                    </>
                                )}
                            </Button>

                            <p className="text-center text-xs text-gray-400 pt-1">
                                بالضغط على "سجّل" توافق على مشاركة اسمك مع منشئ الحدث
                            </p>
                        </div>
                    </div>

                </div>
            </div>

            <ParticipateFooter />
        </div>
    );
}

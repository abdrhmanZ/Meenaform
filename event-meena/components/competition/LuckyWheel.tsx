"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Trophy, ChevronRight, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";

interface Participant {
    id: string;
    name: string;
}

interface LuckyWheelProps {
    participants: Participant[];
    winnersCount: number;
    onWinnerSelected: (winner: Participant) => void;
    onDrawComplete: (winners: Participant[]) => void;
}

// ألوان احترافية للشرائح
const SLICE_COLORS = [
    "#f59e0b", "#1a56db", "#7c3aed", "#059669",
    "#dc2626", "#0891b2", "#d97706", "#4f46e5",
    "#10b981", "#f97316", "#8b5cf6", "#06b6d4",
];

// تفتيح لون لصنع gradient
function lightenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.min(255, (num >> 16) + Math.round(255 * percent));
    const g = Math.min(255, ((num >> 8) & 0x00ff) + Math.round(255 * percent));
    const b = Math.min(255, (num & 0x0000ff) + Math.round(255 * percent));
    return `rgb(${r},${g},${b})`;
}

// أنيميشن elastic — تتردد العجلة قبل التوقف
function easeOutElastic(t: number): number {
    if (t === 0 || t === 1) return t;
    const p = 0.35;
    const s = p / 4;
    return Math.pow(2, -10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / p) + 1;
}

// حجم ثابت للعجلة (logical pixels)
const WHEEL_SIZE = 400;

export default function LuckyWheel({
    participants,
    winnersCount,
    onWinnerSelected,
    onDrawComplete,
}: LuckyWheelProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [remaining, setRemaining] = useState<Participant[]>(participants);
    const [isSpinning, setIsSpinning] = useState(false);
    const [winners, setWinners] = useState<Participant[]>([]);
    const [lastWinner, setLastWinner] = useState<Participant | null>(null);
    const [showWinner, setShowWinner] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
    const [canSpinAgain, setCanSpinAgain] = useState(true);
    const currentAngleRef = useRef(0);
    const animationRef = useRef<number>(0);
    const dprRef = useRef(1);

    // إعداد Canvas مع HiDPI
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        dprRef.current = dpr;
        canvas.width = WHEEL_SIZE * dpr;
        canvas.height = WHEEL_SIZE * dpr;
        canvas.style.width = `${WHEEL_SIZE}px`;
        canvas.style.height = `${WHEEL_SIZE}px`;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.scale(dpr, dpr);
    }, []);

    const drawWheel = useCallback(
        (items: Participant[], angle: number, highlightIdx: number | null = null) => {
            const canvas = canvasRef.current;
            if (!canvas || items.length === 0) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const dpr = dprRef.current;
            // Reset transform ثم أعد scale
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            const W = WHEEL_SIZE;
            const H = WHEEL_SIZE;
            const cx = W / 2;
            const cy = H / 2;
            const R = Math.min(cx, cy) - 12;
            const sliceAngle = (2 * Math.PI) / items.length;

            ctx.clearRect(0, 0, W, H);

            // ظل خارجي للعجلة
            ctx.save();
            ctx.shadowColor = "rgba(0,0,0,0.25)";
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(cx, cy, R + 4, 0, 2 * Math.PI);
            ctx.fillStyle = "#e5e7eb";
            ctx.fill();
            ctx.restore();

            // رسم الشرائح مع gradient
            items.forEach((item, i) => {
                const startA = angle + i * sliceAngle;
                const endA = startA + sliceAngle;
                const baseColor = SLICE_COLORS[i % SLICE_COLORS.length];
                const isHighlighted = highlightIdx === i;

                // Gradient على الشريحة (من الداخل للخارج)
                const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
                grad.addColorStop(0, lightenColor(baseColor, 0.15));
                grad.addColorStop(0.5, baseColor);
                grad.addColorStop(1, lightenColor(baseColor, -0.05));

                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.arc(cx, cy, R, startA, endA);
                ctx.closePath();
                ctx.fillStyle = grad;
                ctx.fill();

                // إطار الشريحة
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.arc(cx, cy, R, startA, endA);
                ctx.closePath();
                ctx.strokeStyle = "rgba(255,255,255,0.5)";
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // هايلايت الشريحة الفائزة
                if (isHighlighted) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(cx, cy);
                    ctx.arc(cx, cy, R, startA, endA);
                    ctx.closePath();
                    ctx.strokeStyle = "#fff";
                    ctx.lineWidth = 4;
                    ctx.shadowColor = "#fbbf24";
                    ctx.shadowBlur = 20;
                    ctx.stroke();
                    ctx.restore();
                }

                // النص
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(startA + sliceAngle / 2);
                ctx.textAlign = "right";
                ctx.fillStyle = "#fff";
                const fontSize = Math.max(10, Math.min(15, 180 / items.length));
                ctx.font = `bold ${fontSize}px 'Segoe UI', Tahoma, sans-serif`;
                ctx.shadowColor = "rgba(0,0,0,0.6)";
                ctx.shadowBlur = 3;
                const maxLen = items.length > 12 ? 7 : items.length > 6 ? 10 : 14;
                const displayName = item.name.length > maxLen ? item.name.substring(0, maxLen) + "…" : item.name;
                ctx.fillText(displayName, R - 20, 5);
                ctx.restore();
            });

            // حلقة خارجية
            ctx.beginPath();
            ctx.arc(cx, cy, R + 2, 0, 2 * Math.PI);
            ctx.strokeStyle = "rgba(255,255,255,0.3)";
            ctx.lineWidth = 3;
            ctx.stroke();

            // دائرة المركز — gradient ذهبي
            const centerGrad = ctx.createRadialGradient(cx, cy - 4, 2, cx, cy, 36);
            centerGrad.addColorStop(0, "#fde68a");
            centerGrad.addColorStop(0.4, "#fbbf24");
            centerGrad.addColorStop(1, "#b45309");
            ctx.save();
            ctx.shadowColor = "rgba(0,0,0,0.35)";
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(cx, cy, 36, 0, 2 * Math.PI);
            ctx.fillStyle = centerGrad;
            ctx.fill();
            ctx.restore();
            ctx.beginPath();
            ctx.arc(cx, cy, 36, 0, 2 * Math.PI);
            ctx.strokeStyle = "rgba(255,255,255,0.7)";
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // نجمة المركز
            ctx.fillStyle = "#fff";
            ctx.font = "bold 20px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.shadowColor = "rgba(0,0,0,0.3)";
            ctx.shadowBlur = 2;
            ctx.fillText("★", cx, cy);
            ctx.shadowBlur = 0;

            // المؤشر (سهم) في الأعلى — تصميم محسّن
            ctx.save();
            ctx.translate(cx, cy - R - 4);
            // ظل السهم
            ctx.shadowColor = "rgba(0,0,0,0.4)";
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(0, 4);
            ctx.lineTo(-15, -26);
            ctx.lineTo(15, -26);
            ctx.closePath();
            const arrowGrad = ctx.createLinearGradient(0, -26, 0, 4);
            arrowGrad.addColorStop(0, "#fbbf24");
            arrowGrad.addColorStop(1, "#f59e0b");
            ctx.fillStyle = arrowGrad;
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 2;
            ctx.stroke();
            // نقطة صغيرة في أسفل السهم
            ctx.beginPath();
            ctx.arc(0, 4, 4, 0, 2 * Math.PI);
            ctx.fillStyle = "#f59e0b";
            ctx.fill();
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
        },
        []
    );

    useEffect(() => {
        drawWheel(remaining, currentAngleRef.current, highlightIndex);
    }, [remaining, drawWheel, highlightIndex]);

    // ==============================
    // Confetti محسّن — 3 دفعات
    // ==============================
    const launchCelebration = useCallback(() => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.45 },
            colors: ["#f59e0b", "#fbbf24", "#1a56db", "#10b981", "#7c3aed"],
        });
        setTimeout(() => {
            confetti({
                particleCount: 70,
                spread: 55,
                origin: { y: 0.5, x: 0.25 },
                colors: ["#f97316", "#dc2626", "#059669"],
            });
        }, 400);
        setTimeout(() => {
            confetti({
                particleCount: 70,
                spread: 55,
                origin: { y: 0.5, x: 0.75 },
                colors: ["#7c3aed", "#0891b2", "#fbbf24"],
            });
        }, 800);
    }, []);

    // ==============================
    // منطق الدوران
    // ==============================
    const spin = useCallback(() => {
        if (isSpinning || remaining.length === 0 || !canSpinAgain) return;
        setIsSpinning(true);
        setShowWinner(false);
        setLastWinner(null);
        setHighlightIndex(null);

        // عدد لفات ومدة ديناميكية
        const totalRotation = (Math.random() * 4 + 8) * 2 * Math.PI; // 8-12 لفة
        const duration = Math.min(5500, 4000 + remaining.length * 50); // 4-5.5 ثانية
        const startTime = performance.now();
        const startAngle = currentAngleRef.current;

        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutElastic(progress);
            const angle = startAngle + totalRotation * eased;
            currentAngleRef.current = angle;
            drawWheel(remaining, angle);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                // === العجلة توقفت — مرحلة التشويق ===
                const sliceAngle = (2 * Math.PI) / remaining.length;
                const normalizedAngle = (((-angle - Math.PI / 2) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
                const winnerIndex = Math.floor(normalizedAngle / sliceAngle) % remaining.length;
                const winner = remaining[winnerIndex];

                // وميض الشريحة الفائزة (3 مرات) لمدة 1.5 ثانية
                let flashCount = 0;
                const flashInterval = setInterval(() => {
                    flashCount++;
                    if (flashCount % 2 === 1) {
                        setHighlightIndex(winnerIndex);
                    } else {
                        setHighlightIndex(null);
                    }
                    drawWheel(remaining, angle, flashCount % 2 === 1 ? winnerIndex : null);
                }, 250);

                // بعد 1.5 ثانية: أعلن الفائز
                setTimeout(() => {
                    clearInterval(flashInterval);
                    setHighlightIndex(winnerIndex);
                    drawWheel(remaining, angle, winnerIndex);

                    // Confetti
                    launchCelebration();

                    // عرض بطاقة الفائز
                    setLastWinner(winner);
                    setShowWinner(true);
                    setIsSpinning(false);

                    const newWinners = [...winners, winner];
                    setWinners(newWinners);
                    onWinnerSelected(winner);

                    // إذا خلّصنا كل الفائزين
                    if (newWinners.length >= winnersCount || remaining.length <= 1) {
                        setTimeout(() => onDrawComplete(newWinners), 2000);
                    } else {
                        // تأخير قبل السماح بالسحب التالي
                        setCanSpinAgain(false);
                        setTimeout(() => {
                            const newRemaining = remaining.filter((p) => p.id !== winner.id);
                            setRemaining(newRemaining);
                            setHighlightIndex(null);
                            setShowWinner(false);
                            setLastWinner(null);
                            currentAngleRef.current = angle;
                            setCanSpinAgain(true);
                        }, 2500);
                    }
                }, 1500);
            }
        };

        animationRef.current = requestAnimationFrame(animate);
    }, [isSpinning, remaining, winners, winnersCount, canSpinAgain, drawWheel, onWinnerSelected, onDrawComplete, launchCelebration]);

    useEffect(() => {
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, []);

    const isComplete = winners.length >= winnersCount || remaining.length === 0;

    return (
        <div className="flex flex-col items-center gap-5">
            {/* العجلة */}
            <div className="relative">
                <canvas
                    ref={canvasRef}
                    className="rounded-full"
                    style={{
                        width: `min(${WHEEL_SIZE}px, 88vw)`,
                        height: `min(${WHEEL_SIZE}px, 88vw)`,
                        filter: isSpinning ? "drop-shadow(0 0 24px rgba(245,158,11,0.3))" : "drop-shadow(0 8px 24px rgba(0,0,0,0.15))",
                        transition: "filter 0.5s ease",
                    }}
                />
            </div>

            {/* شاشة الفائز */}
            {showWinner && lastWinner && (
                <div className="animate-in zoom-in-75 duration-500 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-2xl p-6 text-center shadow-xl w-full max-w-sm">
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                        <Trophy className="w-7 h-7 text-amber-600" />
                    </div>
                    <p className="text-sm text-amber-700 font-medium mb-1">الفائز {winners.length}</p>
                    <h3 className="text-2xl font-bold text-gray-900">{lastWinner.name}</h3>
                    <div className="mt-3 inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-md">
                        <Trophy className="w-4 h-4" />
                        مبروك!
                    </div>
                </div>
            )}

            {/* الفائزون السابقون */}
            {winners.length > 1 && !showWinner && (
                <div className="flex flex-wrap gap-2 justify-center">
                    {winners.map((w, i) => (
                        <span key={w.id} className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm border border-amber-200">
                            #{i + 1} {w.name}
                        </span>
                    ))}
                </div>
            )}

            {/* زر السحب */}
            {!isComplete && (
                <Button
                    size="lg"
                    onClick={spin}
                    disabled={isSpinning || remaining.length === 0 || !canSpinAgain}
                    className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-lg shadow-amber-300/40 px-10 py-4 text-lg font-bold rounded-xl disabled:opacity-50 transition-all"
                >
                    {isSpinning ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            جاري السحب...
                        </span>
                    ) : !canSpinAgain ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            تحضير السحب التالي...
                        </span>
                    ) : winners.length === 0 ? (
                        <span className="flex items-center gap-2">
                            <ChevronRight className="w-5 h-5" />
                            {winnersCount > 1 ? `سحب الفائز الأول` : "بداية السحب"}
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <ChevronRight className="w-5 h-5" />
                            سحب الفائز {winners.length + 1}
                        </span>
                    )}
                </Button>
            )}

            {/* معلومات إضافية */}
            <p className="text-sm text-gray-500">
                المتبقون: <span className="font-bold text-gray-700">{remaining.length}</span> مشارك
                {winnersCount > 1 && (
                    <> &nbsp;&bull;&nbsp; الفائزون: <span className="font-bold text-amber-600">{winners.length}/{winnersCount}</span></>
                )}
            </p>
        </div>
    );
}

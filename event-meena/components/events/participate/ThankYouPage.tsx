"use client";

import { Event } from "@/types/event";
import { ComponentAnswer, ResponseScore } from "@/types/response";
import { Button } from "@/components/ui/button";
import { CheckCircle, BarChart3, RefreshCw, Home, Trophy, Target, Award, TrendingUp, Edit } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { useEffect, useState } from "react";
import { calculateScore, getScoreMessage, calculateDetailedStats } from "@/lib/grading";

interface ThankYouPageProps {
  event: Event;
  answers?: ComponentAnswer[];
  onViewResults?: () => void;
  onSubmitAnother?: () => void;
  onEditResponse?: () => void;
}

export default function ThankYouPage({
  event,
  answers = [],
  onViewResults,
  onSubmitAnother,
  onEditResponse,
}: ThankYouPageProps) {
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState<ResponseScore | null>(null);

  // حساب الدرجة إذا كان الحدث اختبار ولديه تصحيح تلقائي
  // حساب الدرجة للاختبارات والمسابقات
  const isQuizDraw = event.type === "competition" && event.settings?.competitionMode === "quiz_draw";

  useEffect(() => {
    if ((event.type === "quiz" || isQuizDraw) && answers.length > 0) {
      const calculatedScore = calculateScore(event, answers);
      setScore(calculatedScore);
    }
  }, [event, answers, isQuizDraw]);

  useEffect(() => {
    // Celebrate with confetti!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  const thankYouMessage =
    event.settings.thankYouMessage ||
    "شكراً لمشاركتك! تم استلام إجاباتك بنجاح.";

  const isQuiz = event.type === "quiz";
  const isCompetition = event.type === "competition";
  const isRandomDraw = isCompetition && event.settings?.competitionMode === "random_draw";
  const qualifyingScore = event.settings?.qualifyingScore || 70;
  const qualifiedForDraw = isCompetition && !isRandomDraw && score && score.percentage >= qualifyingScore;
  const shouldShowResults = isQuiz && event.settings.showResults && score;

  // Get custom result message based on score
  const getCustomScoreMessage = (percentage: number) => {
    const defaultMessage = getScoreMessage(percentage);

    // Use custom messages if available, otherwise use default
    if (percentage >= 80) {
      return {
        title: defaultMessage.title,
        message: event.settings.successMessage || defaultMessage.message,
      };
    } else if (percentage >= 50) {
      return {
        title: defaultMessage.title,
        message: event.settings.goodMessage || defaultMessage.message,
      };
    } else {
      return {
        title: defaultMessage.title,
        message: event.settings.improvementMessage || defaultMessage.message,
      };
    }
  };

  // عرض رسالة المسابقة
  if (isCompetition) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-amber-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 p-8 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                {qualifiedForDraw ? <Trophy className="w-8 h-8 text-white" /> : <CheckCircle className="w-8 h-8 text-white" />}
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {isRandomDraw
                  ? "تم تسجيلك بنجاح!"
                  : qualifiedForDraw
                    ? "مبروك! تأهلت للسحب"
                    : "شكراً على مشاركتك"}
              </h2>
              <p className="text-amber-100 text-sm">{event.title}</p>
            </div>

            {/* Body */}
            <div className="p-6 text-center space-y-4">
              {isRandomDraw ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-amber-800 font-semibold text-lg mb-1">انتظر إجراء السحب</p>
                  <p className="text-amber-700 text-sm">اسمك مضاف الآن في قائمة السحب. سنعلن عن الفائزين قريباً.</p>
                </div>
              ) : qualifiedForDraw ? (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-green-800 font-bold text-lg">حققت {score?.percentage}%</p>
                    <p className="text-green-700 text-sm">تأهلت للسحب العشوائي على الجوائز</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-amber-800 text-sm">سيتم إجراء السحب العشوائي من بين جميع المتأهلين لاختيار الفائزين</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-blue-800 font-bold">حصلت على {score?.percentage}%</p>
                    <p className="text-blue-700 text-sm">للتأهل للسحب تحتاج {qualifyingScore}% أو أكثر</p>
                  </div>
                  <p className="text-gray-600 text-sm">{event.settings.thankYouMessage || "شكراً لمشاركتك في المسابقة!"}</p>
                </div>
              )}

              <div className="pt-2">
                <Link href="/">
                  <Button variant="outline" className="gap-2">
                    <Home className="w-4 h-4" />
                    العودة للرئيسية
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // عرض النتائج إذا تم الضغط على الزر أو إذا كان يجب عرضها تلقائياً
  if (showResults && shouldShowResults) {
    const scoreMessage = getCustomScoreMessage(score.percentage);
    const stats = calculateDetailedStats(event, answers);

    return (
      <div className="space-y-6">
        {/* Results Header */}
        <div className="bg-gradient-to-r from-[#1a56db] to-[#0ea5e9] rounded-2xl shadow-xl p-8 md:p-12 text-center text-white">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {scoreMessage.title}
          </h1>
          <p className="text-white/95 text-lg leading-relaxed max-w-2xl mx-auto">
            {scoreMessage.message}
          </p>
        </div>

        {/* Score Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-[#1a56db] to-[#0ea5e9] text-white mb-6 shadow-lg">
              <div className="text-center">
                <div className="text-4xl font-bold">{Math.round(score.percentage)}%</div>
                <div className="text-sm opacity-90">النسبة</div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">نتيجتك النهائية</h2>
            <div className="flex items-center justify-center gap-2 text-3xl font-bold text-gray-900">
              <span className="text-[#1a56db]">{score.earnedPoints}</span>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">{score.totalPoints}</span>
            </div>
            <p className="text-gray-600 mt-2">درجة {score.grade}</p>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="text-center p-4 bg-blue-50 rounded-xl border-2 border-blue-100">
              <Target className="w-6 h-6 text-[#1a56db] mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.totalQuestions}</div>
              <div className="text-sm text-gray-600">إجمالي الأسئلة</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl border-2 border-green-100">
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{stats.correctAnswers}</div>
              <div className="text-sm text-gray-600">إجابات صحيحة</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl border-2 border-red-100">
              <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center mx-auto mb-2 text-sm font-bold">✕</div>
              <div className="text-2xl font-bold text-red-600">{stats.incorrectAnswers}</div>
              <div className="text-sm text-gray-600">إجابات خاطئة</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl border-2 border-gray-100">
              <TrendingUp className="w-6 h-6 text-gray-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.answeredQuestions}</div>
              <div className="text-sm text-gray-600">تم الإجابة</div>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`p-4 rounded-xl text-center ${score.passed ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
            <div className="flex items-center justify-center gap-2">
              {score.passed ? (
                <>
                  <Award className="w-6 h-6 text-green-600" />
                  <span className="text-lg font-bold text-green-900">ناجح ✓</span>
                </>
              ) : (
                <>
                  <span className="text-lg font-bold text-red-900">يحتاج إلى تحسين</span>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
            <Button
              size="lg"
              onClick={() => setShowResults(false)}
              className="w-full sm:w-auto bg-[#1a56db] hover:bg-[#1a56db]/90"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              رائع!
            </Button>
            {event.settings.allowMultipleResponses && onSubmitAnother && (
              <Button
                size="lg"
                variant="outline"
                onClick={onSubmitAnother}
                className="w-full sm:w-auto"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                محاولة أخرى
              </Button>
            )}
            {event.settings.allowEdit && onEditResponse && (
              <Button
                size="lg"
                variant="outline"
                onClick={onEditResponse}
                className="w-full sm:w-auto"
              >
                <Edit className="w-5 h-5 mr-2" />
                تعديل الرد
              </Button>
            )}
            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full sm:w-auto"
            >
              <Link href="/">
                <Home className="w-5 h-5 mr-2" />
                الصفحة الرئيسية
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-8 md:p-12 text-center">
      {/* Success Icon */}
      <div className="w-16 h-16 sm:w-24 sm:h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 animate-bounce">
        <CheckCircle className="w-8 h-8 sm:w-12 sm:h-12 text-green-600" />
      </div>

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
        {isQuiz ? "تم إنهاء الاختبار بنجاح!" : "تم الإرسال بنجاح!"}
      </h1>

      {/* Thank You Message */}
      <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8 max-w-2xl mx-auto">
        {thankYouMessage}
      </p>

      {/* Decorative Line */}
      <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-primary to-blue-600 rounded-full mx-auto mb-6 sm:mb-8"></div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        {/* View Results - للاختبارات */}
        {shouldShowResults && (
          <Button
            size="lg"
            onClick={() => setShowResults(true)}
            className="w-full sm:w-auto bg-[#1a56db] hover:bg-[#1a56db]/90"
          >
            <BarChart3 className="w-5 h-5 mr-2" />
            عرض النتائج
          </Button>
        )}

        {/* View Results - لغير الاختبارات */}
        {!isQuiz && event.settings.showResults && onViewResults && (
          <Button
            size="lg"
            onClick={onViewResults}
            className="w-full sm:w-auto"
          >
            <BarChart3 className="w-5 h-5 mr-2" />
            عرض الإحصائيات
          </Button>
        )}

        {/* Submit Another Response */}
        {event.settings.allowMultipleResponses && onSubmitAnother && (
          <Button
            size="lg"
            variant="outline"
            onClick={onSubmitAnother}
            className="w-full sm:w-auto"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            إرسال رد آخر
          </Button>
        )}

        {/* Edit Response */}
        {event.settings.allowEdit && onEditResponse && (
          <Button
            size="lg"
            variant="outline"
            onClick={onEditResponse}
            className="w-full sm:w-auto"
          >
            <Edit className="w-5 h-5 mr-2" />
            تعديل الرد
          </Button>
        )}

        {/* Go Home */}
        <Button
          size="lg"
          variant="outline"
          asChild
          className="w-full sm:w-auto"
        >
          <Link href="/">
            <Home className="w-5 h-5 mr-2" />
            العودة إلى الصفحة الرئيسية
          </Link>
        </Button>
      </div>

      {/* Additional Info */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          تم إرسال نسخة من إجاباتك إلى بريدك الإلكتروني (إن وُجد)
        </p>
      </div>
    </div>
  );
}


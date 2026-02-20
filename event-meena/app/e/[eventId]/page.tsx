"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useEventsStore } from "@/store/eventsStore";
import { useAuthStore } from "@/store/authStore";
import { eventsService } from "@/lib/api/services/eventsService";
import { documentSigningService } from "@/lib/api/services";
import { Event } from "@/types/event";
import { DocumentSigningEvent } from "@/types/document-signing";
import { ParticipantInfo } from "@/types/response";
import { Loader2, Calendar, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import ParticipateHeader from "@/components/events/participate/ParticipateHeader";
import ParticipateFooter from "@/components/events/participate/ParticipateFooter";
import EventInfo from "@/components/events/participate/EventInfo";
import ResponseForm from "@/components/events/participate/ResponseForm";
import ParticipantInfoForm from "@/components/events/participate/ParticipantInfoForm";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

// Dynamic import to avoid SSR issues with react-pdf
const DocumentSigningParticipation = dynamic(
  () => import("@/components/events/document-signing/DocumentSigningParticipation"),
  { ssr: false, loading: () => <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> }
);

export default function EventParticipatePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  // eventId هنا هو في الواقع shareCode (رمز المشاركة)
  const shareCode = params.eventId as string;

  const { fetchEventByShareCode, currentEvent, isLoading, error } = useEventsStore();
  const { user } = useAuthStore();

  const [isEventValid, setIsEventValid] = useState(true);
  const [validationMessage, setValidationMessage] = useState("");
  const [participantInfo, setParticipantInfo] = useState<ParticipantInfo | null>(null);
  const [showParticipantForm, setShowParticipantForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentSigningEvent, setDocumentSigningEvent] = useState<DocumentSigningEvent | null>(null);

  // لمنع تسجيل المشاهدة أكثر من مرة
  const viewCounted = useRef(false);

  useEffect(() => {
    if (shareCode) {
      // استخدام Public endpoint لجلب الحدث مع التفاصيل الكاملة
      fetchEventByShareCode(shareCode);
    }
  }, [shareCode, fetchEventByShareCode]);

  // تسجيل المشاهدة عند تحميل الحدث بنجاح
  useEffect(() => {
    if (currentEvent && !viewCounted.current) {
      viewCounted.current = true;
      // زيادة عداد المشاهدات
      eventsService.incrementViewCount(currentEvent.id);
    }
  }, [currentEvent]);

  // جلب بيانات التوقيع بالتوازي مع تحميل الحدث
  useEffect(() => {
    if (shareCode) {
      // ✅ جلب بيانات التوقيع بالتوازي — لا ننتظر currentEvent
      documentSigningService.getDocumentEventByShareCode(shareCode)
        .then(setDocumentSigningEvent)
        .catch(() => { }); // تجاهل الخطأ إذا مش حدث توقيع
    }
  }, [shareCode]);

  useEffect(() => {
    if (currentEvent) {
      // التحقق من صلاحية الحدث
      validateEvent(currentEvent);
    }
  }, [currentEvent, user]);

  // التحقق من معلومات المشارك المحفوظة
  useEffect(() => {
    // نعرض النموذج إذا كان الحدث يتطلب تسجيل أو كان خاص
    const needsAuth = currentEvent?.settings.requireAuth || currentEvent?.settings.isPrivate;

    if (needsAuth && !user) {
      const savedInfo = localStorage.getItem("participantInfo");

      if (savedInfo) {
        try {
          const info = JSON.parse(savedInfo);

          // للحدث الخاص، نتحقق أيضاً من الوصول المحفوظ
          if (currentEvent?.settings.isPrivate) {
            const savedAccess = localStorage.getItem(`privateAccess_${currentEvent.id}`);
            if (savedAccess) {
              const accessData = JSON.parse(savedAccess);
              // التحقق من أن الإيميل المحفوظ لا يزال في قائمة المسموح لهم
              if (currentEvent.settings.allowedEmails?.some(
                (email) => email.toLowerCase() === accessData.email.toLowerCase()
              )) {
                setParticipantInfo(info);
                setShowParticipantForm(false);
              } else {
                // الإيميل لم يعد مسموحاً له
                localStorage.removeItem(`privateAccess_${currentEvent.id}`);
                localStorage.removeItem("participantInfo");
                setShowParticipantForm(true);
              }
            } else {
              // لا يوجد وصول محفوظ للحدث الخاص
              setShowParticipantForm(true);
            }
          } else {
            setParticipantInfo(info);
            setShowParticipantForm(false);
          }
        } catch (e) {
          setShowParticipantForm(true);
        }
      } else {
        setShowParticipantForm(true);
      }
    } else {
      setShowParticipantForm(false);
    }
  }, [currentEvent, user]);

  const validateEvent = (event: Event) => {
    // 1. التحقق من حالة الحدث
    if (event.status !== "active") {
      setIsEventValid(false);
      if (event.status === "draft") {
        setValidationMessage("هذا الحدث لا يزال في وضع المسودة ولم يتم نشره بعد.");
      } else if (event.status === "archived") {
        setValidationMessage("هذا الحدث مؤرشف وغير متاح للمشاركة.");
      }
      return;
    }

    // 2. التحقق من تاريخ البداية
    if (event.startDate) {
      const startDate = new Date(event.startDate);
      const now = new Date();
      if (now < startDate) {
        setIsEventValid(false);
        setValidationMessage(
          `هذا الحدث سيبدأ في ${format(startDate, "PPP", { locale: ar })} الساعة ${format(startDate, "p", { locale: ar })}`
        );
        return;
      }
    }

    // 3. التحقق من تاريخ النهاية
    if (event.endDate) {
      const endDate = new Date(event.endDate);
      const now = new Date();
      if (now > endDate) {
        setIsEventValid(false);
        setValidationMessage(
          `انتهى هذا الحدث في ${format(endDate, "PPP", { locale: ar })} الساعة ${format(endDate, "p", { locale: ar })}`
        );
        return;
      }
    }

    // الحدث صالح
    setIsEventValid(true);
    setValidationMessage("");
  };

  // معالج إرسال معلومات المشارك
  const handleParticipantInfoSubmit = (info: ParticipantInfo) => {
    setParticipantInfo(info);
    setShowParticipantForm(false);
  };

  // ✅ Skeleton UI — هيكل الصفحة يظهر فوراً أثناء التحميل
  if (isLoading || (!currentEvent && !error)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="bg-white border-b border-gray-100 py-4 px-6">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* عنوان الحدث */}
            <div className="bg-white rounded-2xl shadow-lg p-8 space-y-4">
              <div className="h-8 w-3/4 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
              <div className="flex gap-4 mt-4">
                <div className="h-10 w-28 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-10 w-28 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            </div>
            {/* محتوى الحدث */}
            <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="space-y-4">
                <div className="h-12 w-full bg-gray-50 rounded-lg animate-pulse" />
                <div className="h-12 w-full bg-gray-50 rounded-lg animate-pulse" />
                <div className="h-12 w-full bg-gray-50 rounded-lg animate-pulse" />
              </div>
              <div className="h-12 w-40 bg-blue-100 rounded-lg animate-pulse mx-auto" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !currentEvent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <ParticipateHeader creatorName="Menna Event" />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                عذراً، الحدث غير موجود
              </h1>
              <p className="text-gray-600 mb-8">
                {error || "لم نتمكن من العثور على الحدث المطلوب. قد يكون الرابط غير صحيح أو تم حذف الحدث."}
              </p>
              <Button asChild>
                <Link href="/">العودة إلى الصفحة الرئيسية</Link>
              </Button>
            </div>
          </div>
        </div>
        <ParticipateFooter />
      </div>
    );
  }

  // Invalid event state (لكن ليس بسبب requireAuth)
  if (!isEventValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <ParticipateHeader creatorName={currentEvent.userId || ""} />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                {currentEvent.startDate && new Date() < new Date(currentEvent.startDate) ? (
                  <Calendar className="w-10 h-10 text-yellow-600" />
                ) : (
                  <Clock className="w-10 h-10 text-yellow-600" />
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {currentEvent.title}
              </h1>
              <p className="text-gray-600 mb-8">{validationMessage}</p>

              <Button asChild variant="outline">
                <Link href="/">العودة إلى الصفحة الرئيسية</Link>
              </Button>
            </div>
          </div>
        </div>
        <ParticipateFooter />
      </div>
    );
  }

  // إذا كان الحدث يتطلب معلومات المشارك ولم يتم إدخالها بعد
  // (سواء كان requireAuth مفعّل أو الحدث خاص)
  const needsParticipantForm =
    (currentEvent.settings.requireAuth || currentEvent.settings.isPrivate) &&
    !user &&
    showParticipantForm;

  if (needsParticipantForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <ParticipateHeader creatorName={currentEvent.userId || ""} />
        <ParticipantInfoForm
          eventTitle={currentEvent.title}
          eventId={currentEvent.id}
          isPrivateEvent={currentEvent.settings.isPrivate}
          allowedEmails={currentEvent.settings.allowedEmails || []}
          onSubmit={handleParticipantInfoSubmit}
        />
        <ParticipateFooter />
      </div>
    );
  }

  // معالج إرسال التوقيعات
  const handleDocumentSigningSubmit = async (signatures: any[]) => {
    if (!documentSigningEvent) return;

    try {
      setIsSubmitting(true);
      await documentSigningService.submitAllSignatures({
        eventId: documentSigningEvent.id,
        signerName: participantInfo?.name || user?.name || "مشارك مجهول",
        signerEmail: participantInfo?.email || user?.email,
        signatures: signatures.map((sig) => ({
          fieldId: sig.fieldId,
          signatureData: sig.signatureData,
          textValue: sig.textValue,
          checked: sig.checked,
        })),
      });

      toast({
        title: "تم إرسال التوقيعات بنجاح",
        description: "شكراً لك على التوقيع",
      });

      // Redirect to thank you or home page
      router.push("/");
    } catch (err) {
      console.error("Error submitting signatures:", err);
      toast({
        title: "خطأ",
        description: "فشل في إرسال التوقيعات. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // للأحداث من نوع توقيع الوثائق
  if (currentEvent.type === "document_signing") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <ParticipateHeader creatorName={currentEvent.userId || ""} />

        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
          <div className="max-w-5xl mx-auto">
            {/* Event Info */}
            <EventInfo event={currentEvent} />

            {/* Document Signing Form */}
            {documentSigningEvent ? (
              <DocumentSigningParticipation
                event={documentSigningEvent}
                onSubmit={handleDocumentSigningSubmit}
                isSubmitting={isSubmitting}
                participantEmail={user?.email || participantInfo?.email}
              />
            ) : (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>
        </div>

        <ParticipateFooter />
      </div>
    );
  }

  // Valid event - show participation form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <ParticipateHeader creatorName={currentEvent.userId || ""} />

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Event Info */}
          <EventInfo event={currentEvent} />

          {/* Response Form */}
          <ResponseForm event={currentEvent} participantInfo={participantInfo} />
        </div>
      </div>

      <ParticipateFooter />
    </div>
  );
}


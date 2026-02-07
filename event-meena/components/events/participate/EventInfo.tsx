"use client";

import { Event } from "@/types/event";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, FileText, HelpCircle, ClipboardList, Target, PenTool } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface EventInfoProps {
  event: Event;
}

const eventTypeConfig: Record<string, { label: string; icon: any; color: string; bgColor: string; borderColor: string; headerBg: string }> = {
  survey: {
    label: "استبيان",
    icon: FileText,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    headerBg: "bg-gradient-to-r from-blue-500 to-blue-600",
  },
  poll: {
    label: "استطلاع رأي",
    icon: HelpCircle,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    headerBg: "bg-gradient-to-r from-green-500 to-emerald-600",
  },
  form: {
    label: "نموذج",
    icon: ClipboardList,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    headerBg: "bg-gradient-to-r from-gray-600 to-gray-700",
  },
  quiz: {
    label: "اختبار",
    icon: Target,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    headerBg: "bg-gradient-to-r from-[#1a56db] to-[#0ea5e9]",
  },
  document_signing: {
    label: "توقيع وثيقة",
    icon: PenTool,
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
    headerBg: "bg-gradient-to-r from-teal-500 to-teal-600",
  },
};

export default function EventInfo({ event }: EventInfoProps) {
  const typeConfig = eventTypeConfig[event.type];
  const TypeIcon = typeConfig.icon;

  const totalComponents = event.sections.reduce(
    (sum, section) => sum + section.components.length,
    0
  );

  // Different layouts based on event type
  if (event.type === "quiz") {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden mb-6 sm:mb-8 border border-gray-200">
        {/* Quiz Header with Gradient */}
        <div className={`${typeConfig.headerBg} text-white p-4 sm:p-8 md:p-12 text-center relative overflow-hidden`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-center gap-3 mb-4 sm:mb-6">
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 shadow-lg">
                <TypeIcon className="w-7 h-7 sm:w-10 sm:h-10 text-white" />
              </div>
            </div>
            <Badge variant="secondary" className="mb-3 sm:mb-4 bg-white/20 text-white border-white/30 px-3 sm:px-4 py-1 text-xs sm:text-sm font-semibold">
              {typeConfig.label}
            </Badge>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 leading-tight">
              {event.title}
            </h1>
            {event.description && (
              <p className="text-white/95 text-sm sm:text-lg leading-relaxed max-w-3xl mx-auto">
                {event.description}
              </p>
            )}
          </div>
        </div>

        {/* Quiz Meta Info */}
        <div className="p-4 sm:p-6 md:p-8 bg-gradient-to-b from-gray-50 to-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
            <div className="text-center p-3 sm:p-5 bg-white rounded-lg sm:rounded-xl border-2 border-blue-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-2xl sm:text-3xl font-bold text-[#1a56db] mb-1">{event.sections.length}</div>
              <div className="text-xs sm:text-sm text-gray-600 font-medium">أقسام</div>
            </div>
            <div className="text-center p-3 sm:p-5 bg-white rounded-lg sm:rounded-xl border-2 border-sky-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-2xl sm:text-3xl font-bold text-[#0ea5e9] mb-1">{totalComponents}</div>
              <div className="text-xs sm:text-sm text-gray-600 font-medium">أسئلة</div>
            </div>
            {event.settings.timeLimit && (
              <div className="text-center p-3 sm:p-5 bg-white rounded-lg sm:rounded-xl border-2 border-red-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-2xl sm:text-3xl font-bold text-red-600 mb-1">{event.settings.timeLimit}</div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">دقيقة</div>
              </div>
            )}
            {event.endDate && (
              <div className="text-center p-3 sm:p-5 bg-white rounded-lg sm:rounded-xl border-2 border-orange-100 shadow-sm hover:shadow-md transition-shadow">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 mx-auto mb-1 sm:mb-2" />
                <div className="text-[10px] sm:text-xs text-gray-600 font-medium">{format(new Date(event.endDate), "PPP", { locale: ar })}</div>
              </div>
            )}
          </div>

          {/* Quiz Important Notes */}
          {(!event.settings.allowEdit || event.settings.timeLimit) && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-5 bg-blue-50 border-2 border-blue-200 rounded-lg sm:rounded-xl">
              <h3 className="font-bold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-[#1a56db] flex items-center justify-center flex-shrink-0">
                  <Target className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                تعليمات الاختبار
              </h3>
              <ul className="text-xs sm:text-sm text-gray-700 space-y-1.5 sm:space-y-2 mr-8 sm:mr-10">
                {event.settings.timeLimit && (
                  <li className="flex items-start gap-2">
                    <span className="text-[#1a56db] font-bold">•</span>
                    <span>يجب إكمال الاختبار خلال <strong className="text-gray-900">{event.settings.timeLimit} دقيقة</strong></span>
                  </li>
                )}
                {!event.settings.allowEdit && (
                  <li className="flex items-start gap-2">
                    <span className="text-[#1a56db] font-bold">•</span>
                    <span>لا يمكن تعديل الإجابات بعد الإرسال</span>
                  </li>
                )}
                {!event.settings.allowMultipleResponses && (
                  <li className="flex items-start gap-2">
                    <span className="text-[#1a56db] font-bold">•</span>
                    <span>محاولة واحدة فقط متاحة</span>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default layout for survey, poll, form
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 border border-gray-100">
      {/* Type Badge */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl ${typeConfig.bgColor} flex items-center justify-center border-2 ${typeConfig.borderColor}`}>
          <TypeIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${typeConfig.color}`} />
        </div>
        <Badge variant="outline" className={`${typeConfig.color} border-current text-xs sm:text-sm`}>
          {typeConfig.label}
        </Badge>
      </div>

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
        {event.title}
      </h1>

      {/* Description */}
      {event.description && (
        <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-4 sm:mb-6">
          {event.description}
        </p>
      )}

      {/* Meta Info */}
      <div className="flex flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm text-gray-600 pt-4 sm:pt-6 border-t border-gray-200">
        {/* Sections Count */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
          </div>
          <span>
            <span className="font-semibold text-gray-900">{event.sections.length}</span> {event.sections.length === 1 ? "قسم" : "أقسام"}
          </span>
        </div>

        {/* Components Count */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-purple-50 flex items-center justify-center">
            <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
          </div>
          <span>
            <span className="font-semibold text-gray-900">{totalComponents}</span> {totalComponents === 1 ? "سؤال" : "أسئلة"}
          </span>
        </div>

        {/* End Date */}
        {event.endDate && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
            </div>
            <span>
              ينتهي في: <span className="font-semibold text-gray-900">{format(new Date(event.endDate), "PPP", { locale: ar })}</span>
            </span>
          </div>
        )}

        {/* Time Limit */}
        {event.settings.timeLimit && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
            </div>
            <span>
              الوقت المحدد: <span className="font-semibold text-gray-900">{event.settings.timeLimit} دقيقة</span>
            </span>
          </div>
        )}
      </div>

      {/* Important Notes */}
      {(!event.settings.allowEdit || event.settings.timeLimit) && (
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-900 mb-1.5 sm:mb-2 text-sm sm:text-base">ملاحظات مهمة:</h3>
          <ul className="text-xs sm:text-sm text-yellow-800 space-y-1">
            {!event.settings.allowEdit && (
              <li>• لا يمكن تعديل الردود بعد الإرسال</li>
            )}
            {event.settings.timeLimit && (
              <li>• يجب إكمال الحدث خلال {event.settings.timeLimit} دقيقة</li>
            )}
            {!event.settings.allowMultipleResponses && (
              <li>• يُسمح برد واحد فقط لكل مشارك</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}


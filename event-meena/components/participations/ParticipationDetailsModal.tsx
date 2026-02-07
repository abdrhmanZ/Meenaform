"use client";

import { ParticipationDetails } from "@/types/participation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  User,
  Trophy,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import AnswerDisplay from "./AnswerDisplay";

interface ParticipationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  participation: ParticipationDetails | null;
  isLoading: boolean;
}

const eventTypeLabels: Record<string, string> = {
  survey: "استبيان",
  quiz: "اختبار",
  form: "نموذج",
  poll: "استطلاع",
  document_signing: "توقيع وثيقة",
};

export default function ParticipationDetailsModal({
  isOpen,
  onClose,
  participation,
  isLoading,
}: ParticipationDetailsModalProps) {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return "غير محدد";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes === 0) return `${secs} ثانية`;
    return `${minutes} دقيقة${secs > 0 ? ` و ${secs} ثانية` : ""}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <DialogHeader className="sr-only">
              <DialogTitle>جاري التحميل</DialogTitle>
            </DialogHeader>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="mr-3 text-gray-500">جاري تحميل التفاصيل...</span>
          </div>
        ) : participation ? (
          <>
            <DialogHeader className="p-6 pb-4 border-b bg-gray-50/50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <DialogTitle className="text-xl font-bold text-gray-900">
                    {participation.eventTitle}
                  </DialogTitle>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{participation.ownerName}</span>
                    </div>
                    <Badge variant="secondary">
                      {eventTypeLabels[participation.eventType]}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-4 mt-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>
                    {format(new Date(participation.participatedAt), "PPP", { locale: ar })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>{formatDuration(participation.durationSeconds)}</span>
                </div>
              </div>

              {/* Quiz Results */}
              {participation.eventType === "quiz" && participation.score !== undefined && (
                <div className="mt-4 p-4 rounded-lg bg-white border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-amber-500" />
                      <span className="font-medium text-gray-700">نتيجة الاختبار</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-primary">
                        {participation.score}/{participation.totalPoints}
                      </span>
                      <span className="text-lg text-gray-500">
                        ({participation.percentage?.toFixed(0)}%)
                      </span>
                      {participation.isPassed !== undefined && (
                        participation.isPassed ? (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle2 className="h-3 w-3 ml-1" />
                            ناجح
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700">
                            <XCircle className="h-3 w-3 ml-1" />
                            راسب
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </DialogHeader>

            <ScrollArea className="max-h-[calc(90vh-280px)]">
              <div className="p-6 space-y-6">
                {participation.sections.map((section, sectionIndex) => (
                  <div key={section.id} className="space-y-4">
                    {participation.sections.length > 1 && (
                      <>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-medium">
                            {sectionIndex + 1}
                          </span>
                          <h3 className="font-semibold text-gray-900">{section.title}</h3>
                        </div>
                        {section.description && (
                          <p className="text-sm text-gray-500 mr-10">{section.description}</p>
                        )}
                      </>
                    )}

                    <div className="space-y-4 mr-10">
                      {section.components.map((component, compIndex) => (
                        <AnswerDisplay
                          key={component.id}
                          component={component}
                          answer={participation.answers[component.id]}
                          questionNumber={compIndex + 1}
                        />
                      ))}
                    </div>

                    {sectionIndex < participation.sections.length - 1 && (
                      <Separator className="my-6" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <DialogHeader className="sr-only">
              <DialogTitle>خطأ</DialogTitle>
            </DialogHeader>
            <p>لا يمكن تحميل تفاصيل المشاركة</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


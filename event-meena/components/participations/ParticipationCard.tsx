"use client";

import { ParticipatedEvent } from "@/types/participation";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  User,
  Eye,
  FileText,
  ClipboardList,
  CheckCircle2,
  Trophy,
  XCircle,
  PenTool,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface ParticipationCardProps {
  participation: ParticipatedEvent;
  onViewDetails: (responseId: string) => void;
}

const eventTypeConfig: Record<string, { label: string; color: string; icon: any }> = {
  survey: { label: "استبيان", color: "bg-blue-100 text-blue-700", icon: ClipboardList },
  quiz: { label: "اختبار", color: "bg-purple-100 text-purple-700", icon: Trophy },
  form: { label: "نموذج", color: "bg-amber-100 text-amber-700", icon: FileText },
  poll: { label: "استطلاع", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  document_signing: { label: "توقيع وثيقة", color: "bg-teal-100 text-teal-700", icon: PenTool },
};

export default function ParticipationCard({ participation, onViewDetails }: ParticipationCardProps) {
  const typeConfig = eventTypeConfig[participation.eventType] || eventTypeConfig.survey;
  const TypeIcon = typeConfig.icon;

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "غير محدد";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes === 0) return `${secs} ثانية`;
    return `${minutes} دقيقة${secs > 0 ? ` و ${secs} ثانية` : ""}`;
  };

  const participatedDate = new Date(participation.participatedAt);
  const timeAgo = formatDistanceToNow(participatedDate, { addSuffix: true, locale: ar });

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-primary/30 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">
              {participation.eventTitle}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <User className="h-3.5 w-3.5" />
              <span className="truncate">{participation.ownerName}</span>
            </div>
          </div>
          <Badge className={`${typeConfig.color} shrink-0`}>
            <TypeIcon className="h-3 w-3 ml-1" />
            {typeConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {participation.eventDescription && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {participation.eventDescription}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>{timeAgo}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="h-4 w-4 text-gray-400" />
            <span>{formatDuration(participation.durationSeconds)}</span>
          </div>
        </div>

        {/* Quiz Results */}
        {participation.eventType === "quiz" && participation.score !== undefined && (
          <div className="mt-4 p-3 rounded-lg bg-gray-50 border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">النتيجة:</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary">
                  {participation.score}/{participation.totalPoints}
                </span>
                <span className="text-sm text-gray-500">
                  ({participation.percentage?.toFixed(0)}%)
                </span>
              </div>
            </div>
            {participation.isPassed !== undefined && (
              <div className="flex items-center gap-2 mt-2">
                {participation.isPassed ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600 font-medium">ناجح</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600 font-medium">راسب</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <Button
          variant="outline"
          className="w-full group-hover:bg-primary group-hover:text-white transition-colors"
          onClick={() => onViewDetails(participation.responseId)}
        >
          <Eye className="h-4 w-4 ml-2" />
          عرض إجاباتي
        </Button>
      </CardFooter>
    </Card>
  );
}


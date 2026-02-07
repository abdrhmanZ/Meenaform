"use client";

import { Event } from "@/types/event";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EventStatusBadge from "./EventStatusBadge";
import {
  FileText,
  HelpCircle,
  ClipboardList,
  Target,
  Users,
  Calendar,
  MoreVertical,
  Eye,
  Edit,
  Copy,
  Trash2,
  Layers,
  Grid3x3,
  PenTool,
  FileSignature,
  BarChart3,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { parseBackendDate } from "@/lib/utils";

interface EventCardProps {
  event: Event;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onArchive?: (id: string) => void;
}

const eventTypeConfig: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  survey: {
    label: "استبيان",
    icon: FileText,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  poll: {
    label: "استطلاع رأي",
    icon: HelpCircle,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  form: {
    label: "نموذج",
    icon: ClipboardList,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  quiz: {
    label: "اختبار",
    icon: Target,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  document_signing: {
    label: "توقيع وثيقة",
    icon: PenTool,
    color: "text-teal-600",
    bgColor: "bg-teal-50",
  },
};

export default function EventCard({ event, onDelete, onDuplicate, onArchive }: EventCardProps) {
  const typeConfig = eventTypeConfig[event.type];
  const TypeIcon = typeConfig.icon;

  // التحقق من نوع الحدث
  const isDocumentSigning = event.type === "document_signing";

  // حساب عدد الأقسام والمكونات (للأحداث العادية)
  const sectionsCount = event.sectionsCount ?? event.sections?.length ?? 0;
  const componentsCount = event.componentsCount ??
    event.sections?.reduce((total, section) => total + (section.components?.length || 0), 0) ?? 0;

  // بيانات حدث الوثيقة (إذا كان document_signing)
  const signatureFieldsCount = event.signatureFieldsCount ?? 0;
  const signaturesCount = event.signaturesCount ?? 0;

  return (
    <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:border-primary/20 group flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          {/* أيقونة النوع */}
          <div className={`p-3 rounded-xl ${typeConfig.bgColor} group-hover:scale-110 transition-transform`}>
            <TypeIcon className={`w-6 h-6 ${typeConfig.color}`} />
          </div>

          {/* المعلومات */}
          <div className="flex-1 min-w-0">
            <Link
              href={`/dashboard/events/${event.id}`}
              className="text-lg font-bold text-gray-900 hover:text-primary line-clamp-1 transition-colors"
            >
              {event.title}
            </Link>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {event.description}
            </p>
          </div>
        </div>

        {/* قائمة الإجراءات */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/events/${event.id}`}>
                <Eye className="w-4 h-4 ml-2" />
                عرض التفاصيل
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/events/${event.id}/edit`}>
                <Edit className="w-4 h-4 ml-2" />
                تعديل
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate?.(event.id)}>
              <Copy className="w-4 h-4 ml-2" />
              نسخ
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete?.(event.id)}
              className="text-red-600"
            >
              <Trash2 className="w-4 h-4 ml-2" />
              حذف
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* الشارات */}
      <div className="flex items-center gap-2 mb-4">
        <EventStatusBadge status={event.status} />
        <span className={`text-xs px-2 py-1 rounded-full ${typeConfig.bgColor} ${typeConfig.color}`}>
          {typeConfig.label}
        </span>
      </div>

      {/* الإحصائيات - مختلفة حسب نوع الحدث */}
      {isDocumentSigning ? (
        // إحصائيات حدث الوثيقة - 3 أعمدة
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="p-2 bg-teal-50 rounded-lg text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <FileSignature className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
              <p className="text-[10px] text-teal-600 font-medium whitespace-nowrap">الحقول</p>
            </div>
            <p className="text-xl font-bold text-teal-700">
              {signatureFieldsCount}
            </p>
          </div>
          <div className="p-2 bg-emerald-50 rounded-lg text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <PenTool className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <p className="text-[10px] text-emerald-600 font-medium whitespace-nowrap">التوقيعات</p>
            </div>
            <p className="text-xl font-bold text-emerald-700">
              {signaturesCount}
            </p>
          </div>
          <div className="p-2 bg-green-50 rounded-lg text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Eye className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
              <p className="text-[10px] text-green-600 font-medium whitespace-nowrap">المشاهدات</p>
            </div>
            <p className="text-xl font-bold text-green-700">
              {event.stats?.views || 0}
            </p>
          </div>
        </div>
      ) : (
        // إحصائيات الأحداث العادية
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-blue-600 font-medium">الأقسام</p>
            </div>
            <p className="text-2xl font-bold text-blue-700">
              {sectionsCount}
            </p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Grid3x3 className="w-4 h-4 text-purple-600" />
              <p className="text-xs text-purple-600 font-medium">المكونات</p>
            </div>
            <p className="text-2xl font-bold text-purple-700">
              {componentsCount}
            </p>
          </div>
        </div>
      )}

      {/* إحصائيات الردود - للأحداث العادية فقط */}
      {!isDocumentSigning && (
        // إحصائيات الأحداث العادية
        <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">الردود</p>
            <p className="text-lg font-bold text-primary">
              {event.stats?.totalResponses || 0}
            </p>
          </div>
          <div className="text-center border-x border-gray-200">
            <p className="text-xs text-gray-500 mb-1">المشاهدات</p>
            <p className="text-lg font-bold text-green-600">
              {event.stats?.views || 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">الإكمال</p>
            <p className="text-lg font-bold text-orange-600">
              {event.stats?.completionRate || 0}%
            </p>
          </div>
        </div>
      )}

      {/* مساحة فارغة لدفع الأزرار للأسفل */}
      <div className="flex-1" />

      {/* التاريخ */}
      <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
        <Calendar className="w-4 h-4" />
        <span>
          {formatDistanceToNow(parseBackendDate(event.createdAt), {
            addSuffix: true,
            locale: ar,
          })}
        </span>
      </div>

      {/* الأزرار */}
      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm" className="flex-1 hover:bg-primary/5 hover:border-primary">
          <Link href={`/dashboard/events/${event.id}`}>
            <Eye className="w-4 h-4 ml-2" />
            عرض
          </Link>
        </Button>
        <Button asChild size="sm" className="flex-1 bg-primary hover:bg-primary/90">
          <Link href={`/dashboard/events/${event.id}/edit`}>
            <Edit className="w-4 h-4 ml-2" />
            تعديل
          </Link>
        </Button>
      </div>
    </Card>
  );
}


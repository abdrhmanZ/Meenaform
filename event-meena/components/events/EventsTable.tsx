"use client";

import { Event } from "@/types/event";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import EventStatusBadge from "./EventStatusBadge";
import {
  FileText,
  HelpCircle,
  ClipboardList,
  Target,
  Eye,
  Edit,
  Copy,
  Trash2,
  MoreVertical,
  PenTool,
  Trophy,
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

interface EventsTableProps {
  events: Event[];
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onArchive?: (id: string) => void;
}

const eventTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
  survey: {
    label: "استبيان",
    icon: FileText,
    color: "text-blue-600",
  },
  poll: {
    label: "استطلاع رأي",
    icon: HelpCircle,
    color: "text-purple-600",
  },
  form: {
    label: "نموذج",
    icon: ClipboardList,
    color: "text-green-600",
  },
  quiz: {
    label: "اختبار",
    icon: Target,
    color: "text-orange-600",
  },
  document_signing: {
    label: "توقيع وثيقة",
    icon: PenTool,
    color: "text-teal-600",
  },
  competition: {
    label: "مسابقة وسحب",
    icon: Trophy,
    color: "text-amber-600",
  },
};

export default function EventsTable({
  events,
  onDelete,
  onDuplicate,
  onArchive,
}: EventsTableProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          لا توجد أحداث
        </h3>
        <p className="text-gray-500 mb-6">
          ابدأ بإنشاء حدثك الأول الآن
        </p>
        <Button asChild>
          <Link href="/dashboard/events/new">إنشاء حدث جديد</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[200px] max-w-xs">العنوان</TableHead>
            <TableHead>النوع</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>الردود</TableHead>
            <TableHead>تاريخ الإنشاء</TableHead>
            <TableHead className="text-left w-[80px]">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => {
            const typeConfig = eventTypeConfig[event.type];
            const TypeIcon = typeConfig.icon;

            return (
              <TableRow key={event.id}>
                {/* العنوان */}
                <TableCell className="min-w-[200px] max-w-xs">
                  <Link
                    href={`/dashboard/events/${event.id}`}
                    className="flex items-center gap-3 hover:text-primary"
                  >
                    <TypeIcon className={`w-5 h-5 shrink-0 ${typeConfig.color}`} />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 line-clamp-1">
                        {event.title}
                      </p>
                      <p className="text-sm text-gray-500 line-clamp-1">
                        {event.description}
                      </p>
                    </div>
                  </Link>
                </TableCell>

                {/* النوع */}
                <TableCell>
                  <span className="text-sm text-gray-600">
                    {typeConfig.label}
                  </span>
                </TableCell>

                {/* الحالة */}
                <TableCell>
                  <EventStatusBadge status={event.status} />
                </TableCell>

                {/* الردود */}
                <TableCell>
                  <span className="text-sm font-semibold text-gray-900">
                    {event.stats.totalResponses}
                  </span>
                </TableCell>

                {/* تاريخ الإنشاء */}
                <TableCell>
                  <span className="text-sm text-gray-600">
                    {formatDistanceToNow(new Date(event.createdAt), {
                      addSuffix: true,
                      locale: ar,
                    })}
                  </span>
                </TableCell>

                {/* الإجراءات */}
                <TableCell className="text-left w-[80px]">
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}


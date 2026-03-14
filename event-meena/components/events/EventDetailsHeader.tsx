"use client";

import { Event, CollaboratorRole } from "@/types/event";
import { Button } from "@/components/ui/button";
import EventStatusBadge from "./EventStatusBadge";
import {
  ArrowRight,
  Edit,
  Share2,
  Copy,
  Trash2,
  MoreVertical,
  Eye,
  BarChart3,
  BookmarkPlus,
  Send,
  FileText,
  PenTool,
  Users,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EventDetailsHeaderProps {
  event: Event;
  onDuplicate?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  onSaveAsTemplate?: () => void;
  onPublish?: () => void;
  onUnpublish?: () => void;
  onManageCollaborators?: () => void;
  isShared?: boolean;
  myRole?: CollaboratorRole;
}

const eventTypeConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  survey: {
    label: "استبيان",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  poll: {
    label: "استطلاع",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  form: {
    label: "نموذج",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  quiz: {
    label: "اختبار",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  document_signing: {
    label: "توقيع وثيقة",
    color: "text-teal-600",
    bgColor: "bg-teal-50",
  },
  competition: {
    label: "مسابقة وسحب",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
};

export default function EventDetailsHeader({
  event,
  onDuplicate,
  onDelete,
  onShare,
  onSaveAsTemplate,
  onPublish,
  onUnpublish,
  onManageCollaborators,
  isShared = false,
  myRole,
}: EventDetailsHeaderProps) {
  const typeConfig = eventTypeConfig[event.type];

  // صلاحيات المتعاون
  const canEdit = !isShared || myRole === "editor";
  const isOwner = !isShared;

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <div className="mb-4">
          <Link
            href="/dashboard/events"
            className="inline-flex items-center text-sm text-gray-600 hover:text-primary transition-colors"
          >
            <ArrowRight className="w-4 h-4 ml-1" />
            العودة إلى الأحداث
          </Link>
        </div>

        {/* Header Content */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          {/* Left Side - Title & Info */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              {event.title}
            </h1>

            {/* Description */}
            {event.description && (
              <p className="text-lg text-gray-600 mb-4 max-w-3xl">
                {event.description}
              </p>
            )}

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-3">
              <EventStatusBadge status={event.status} />
              <span
                className={`inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full ${typeConfig.bgColor} ${typeConfig.color} font-medium`}
              >
                {typeConfig.label}
              </span>
              {event.sections && event.sections.length > 0 && (
                <span className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                  {event.sections.length} قسم
                </span>
              )}
            </div>
          </div>

          {/* Right Side - Actions */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {/* Publish Button - Only for draft events, editors+ */}
            {event.status === "draft" && onPublish && canEdit && (
              <Button
                onClick={onPublish}
                size="lg"
                className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/30"
              >
                <Send className="w-5 h-5 ml-2" />
                <span className="hidden sm:inline">نشر الحدث</span>
                <span className="sm:hidden">نشر</span>
              </Button>
            )}

            {/* Unpublish Button - Only for active events, editors+ */}
            {event.status === "active" && onUnpublish && canEdit && (
              <Button
                onClick={onUnpublish}
                variant="outline"
                size="lg"
                className="hover:bg-yellow-50 hover:border-yellow-500 hover:text-yellow-700"
              >
                <FileText className="w-5 h-5 ml-2" />
                <span className="hidden sm:inline">تحويل لمسودة</span>
                <span className="sm:hidden">مسودة</span>
              </Button>
            )}

            {/* View Results - Hidden on mobile, shown in dropdown */}
            <Button
              asChild
              variant="outline"
              size="lg"
              className="hidden md:inline-flex hover:bg-purple-50 hover:border-purple-500 hover:text-purple-600"
            >
              <Link href={`/dashboard/events/${event.id}/results`}>
                <BarChart3 className="w-5 h-5 ml-2" />
                عرض النتائج
              </Link>
            </Button>

            {/* Preview Page - Hidden on mobile, shown in dropdown - Not for document_signing or competition */}
            {event.type !== "document_signing" && event.type !== "competition" && (
              <Button
                asChild
                variant="outline"
                size="lg"
                className="hidden md:inline-flex hover:bg-primary/5 hover:border-primary"
              >
                <Link href={`/preview/${event.id}`} target="_blank">
                  <Eye className="w-5 h-5 ml-2" />
                  معاينة
                </Link>
              </Button>
            )}

            {/* Edit - Not for competition, editors+ */}
            {event.type !== "competition" && canEdit && (
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30"
              >
                <Link href={`/dashboard/events/${event.id}/edit`}>
                  <Edit className="w-5 h-5 ml-2" />
                  <span className="hidden sm:inline">تعديل</span>
                </Link>
              </Button>
            )}

            {/* Share - Hidden on mobile, shown in dropdown, not for viewers */}
            {canEdit && (
              <Button
                onClick={onShare}
                variant="outline"
                size="lg"
                className="hidden md:inline-flex hover:bg-green-50 hover:border-green-500 hover:text-green-600"
              >
                <Share2 className="w-5 h-5 ml-2" />
                مشاركة
              </Button>
            )}

            {/* More Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="lg" className="px-3">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {/* Mobile-only items */}
                <DropdownMenuItem asChild className="md:hidden">
                  <Link href={`/dashboard/events/${event.id}/results`}>
                    <BarChart3 className="w-4 h-4 ml-2" />
                    عرض النتائج
                  </Link>
                </DropdownMenuItem>
                {event.type !== "document_signing" && event.type !== "competition" && (
                  <DropdownMenuItem asChild className="md:hidden">
                    <Link href={`/preview/${event.id}`} target="_blank">
                      <Eye className="w-4 h-4 ml-2" />
                      معاينة
                    </Link>
                  </DropdownMenuItem>
                )}
                {canEdit && (
                  <DropdownMenuItem onClick={onShare} className="md:hidden">
                    <Share2 className="w-4 h-4 ml-2" />
                    مشاركة
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="md:hidden" />
                {/* Always visible items - Not for document_signing or competition, owner only */}
                {isOwner && event.type !== "document_signing" && event.type !== "competition" && (
                  <>
                    <DropdownMenuItem onClick={onSaveAsTemplate}>
                      <BookmarkPlus className="w-4 h-4 ml-2" />
                      حفظ كقالب
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onDuplicate}>
                      <Copy className="w-4 h-4 ml-2" />
                      نسخ الحدث
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                {isOwner && onManageCollaborators && (
                  <DropdownMenuItem onClick={onManageCollaborators}>
                    <Users className="w-4 h-4 ml-2" />
                    إدارة المتعاونين
                  </DropdownMenuItem>
                )}
                {isOwner && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={onDelete}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 ml-2" />
                      حذف
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}


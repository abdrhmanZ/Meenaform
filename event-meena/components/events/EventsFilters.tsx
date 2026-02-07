"use client";

import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEventsStore } from "@/store/eventsStore";
import { EventStatus, EventType } from "@/types/event";

export default function EventsFilters() {
  const {
    filters,
    setSearch,
    setStatusFilter,
    setTypeFilter,
    setSortBy,
    setSortOrder,
    clearFilters,
  } = useEventsStore();

  const hasActiveFilters =
    filters.search ||
    filters.status !== "all" ||
    filters.type !== "all" ||
    filters.sortBy !== "createdAt" ||
    filters.sortOrder !== "desc";

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* شريط البحث */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="ابحث عن حدث..."
                value={filters.search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10 h-11 text-base"
              />
            </div>
          </div>

          {/* الفلاتر */}
          <div className="flex flex-wrap gap-3">
            {/* فلتر الحالة */}
            <Select
              value={filters.status}
              onValueChange={(value) =>
                setStatusFilter(value as EventStatus | "all")
              }
            >
              <SelectTrigger className="w-[160px] h-11">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
              </SelectContent>
            </Select>

            {/* فلتر النوع */}
            <Select
              value={filters.type}
              onValueChange={(value) =>
                setTypeFilter(value as EventType | "all")
              }
            >
              <SelectTrigger className="w-[160px] h-11">
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="survey">استبيان</SelectItem>
                <SelectItem value="poll">استطلاع</SelectItem>
                <SelectItem value="form">نموذج</SelectItem>
                <SelectItem value="quiz">اختبار</SelectItem>
                <SelectItem value="document_signing">توقيع وثيقة</SelectItem>
              </SelectContent>
            </Select>

            {/* الترتيب */}
            <Select
              value={filters.sortBy}
              onValueChange={(value) =>
                setSortBy(
                  value as "createdAt" | "updatedAt" | "title" | "responses"
                )
              }
            >
              <SelectTrigger className="w-[160px] h-11">
                <SelectValue placeholder="الترتيب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">تاريخ الإنشاء</SelectItem>
                <SelectItem value="updatedAt">تاريخ التعديل</SelectItem>
                <SelectItem value="title">الاسم</SelectItem>
                <SelectItem value="responses">عدد الردود</SelectItem>
              </SelectContent>
            </Select>

            {/* اتجاه الترتيب */}
            <Select
              value={filters.sortOrder}
              onValueChange={(value) => setSortOrder(value as "asc" | "desc")}
            >
              <SelectTrigger className="w-[140px] h-11">
                <SelectValue placeholder="الاتجاه" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">الأحدث أولاً</SelectItem>
                <SelectItem value="asc">الأقدم أولاً</SelectItem>
              </SelectContent>
            </Select>

            {/* زر مسح الفلاتر */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="lg"
                onClick={clearFilters}
                className="h-11"
              >
                <X className="w-4 h-4 ml-2" />
                مسح الفلاتر
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useEventsStore } from "@/store/eventsStore";
import { EventStatus, EventType } from "@/types/event";

export default function EventFilters() {
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
    <div className="space-y-4">
      {/* البحث */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          type="text"
          placeholder="ابحث عن حدث..."
          value={filters.search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* الفلاتر */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* فلتر الحالة */}
        <Select
          value={filters.status}
          onValueChange={(value) => setStatusFilter(value as EventStatus | "all")}
        >
          <SelectTrigger>
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
          onValueChange={(value) => setTypeFilter(value as EventType | "all")}
        >
          <SelectTrigger>
            <SelectValue placeholder="النوع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأنواع</SelectItem>
            <SelectItem value="survey">استبيان</SelectItem>
            <SelectItem value="poll">استطلاع رأي</SelectItem>
            <SelectItem value="form">نموذج</SelectItem>
            <SelectItem value="quiz">اختبار</SelectItem>
            <SelectItem value="document_signing">توقيع وثيقة</SelectItem>
          </SelectContent>
        </Select>

        {/* الترتيب حسب */}
        <Select
          value={filters.sortBy}
          onValueChange={(value) =>
            setSortBy(value as "createdAt" | "updatedAt" | "title" | "responses")
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="ترتيب حسب" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">تاريخ الإنشاء</SelectItem>
            <SelectItem value="updatedAt">تاريخ التحديث</SelectItem>
            <SelectItem value="title">العنوان</SelectItem>
            <SelectItem value="responses">عدد الردود</SelectItem>
          </SelectContent>
        </Select>

        {/* اتجاه الترتيب */}
        <Select
          value={filters.sortOrder}
          onValueChange={(value) => setSortOrder(value as "asc" | "desc")}
        >
          <SelectTrigger>
            <SelectValue placeholder="الاتجاه" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">تنازلي</SelectItem>
            <SelectItem value="asc">تصاعدي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* زر مسح الفلاتر */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="w-full md:w-auto"
        >
          <X className="w-4 h-4 ml-2" />
          مسح الفلاتر
        </Button>
      )}
    </div>
  );
}


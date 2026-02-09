"use client";

import { useEffect, useState, useRef } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import LoadingState from "@/components/dashboard/LoadingState";
import EmptyState from "@/components/dashboard/EmptyState";
import ParticipationsGrid from "@/components/participations/ParticipationsGrid";
import ParticipationDetailsModal from "@/components/participations/ParticipationDetailsModal";
import { responsesService } from "@/lib/api/services/responsesService";
import { ParticipatedEvent, ParticipationDetails } from "@/types/participation";
import { useToast } from "@/hooks/use-toast";
import { ClipboardList, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ✅ Cache خارجي لمنع إعادة الجلب عند كل تنقل
let cachedParticipations: ParticipatedEvent[] | null = null;

function ParticipationsPageContent() {
  const { toast } = useToast();
  const [participations, setParticipations] = useState<ParticipatedEvent[]>(cachedParticipations || []);
  const [isLoading, setIsLoading] = useState(!cachedParticipations);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedParticipation, setSelectedParticipation] = useState<ParticipationDetails | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    // ✅ لو البيانات موجودة في الـ cache، لا نحتاج API call
    if (!hasFetched.current) {
      hasFetched.current = true;
      if (!cachedParticipations) {
        fetchParticipations();
      }
    }
  }, []);

  const fetchParticipations = async () => {
    try {
      setIsLoading(true);
      const data = await responsesService.getMyParticipations();
      cachedParticipations = data;
      setParticipations(data);
    } catch (error) {
      console.error("Error fetching participations:", error);
      toast({
        title: "خطأ",
        description: "فشل في جلب المشاركات",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = async (responseId: string) => {
    try {
      setIsDetailsLoading(true);
      setIsModalOpen(true);
      const details = await responsesService.getParticipationDetails(responseId);
      setSelectedParticipation(details);
    } catch (error: any) {
      console.error("Error fetching participation details:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "فشل في جلب تفاصيل المشاركة";
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
      setIsModalOpen(false);
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedParticipation(null);
  };

  // فلترة المشاركات
  const filteredParticipations = participations.filter((p) => {
    const matchesSearch = p.eventTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ownerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || p.eventType === typeFilter;
    return matchesSearch && matchesType;
  });

  if (isLoading) {
    return <LoadingState message="جاري تحميل مشاركاتك..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">مشاركاتي</h1>
          <p className="text-gray-500 mt-1">
            الأحداث التي شاركت فيها ({participations.length} مشاركة)
          </p>
        </div>
      </div>

      {/* Filters */}
      {participations.length > 0 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="ابحث عن حدث..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 ml-2" />
              <SelectValue placeholder="نوع الحدث" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              <SelectItem value="survey">استبيان</SelectItem>
              <SelectItem value="quiz">اختبار</SelectItem>
              <SelectItem value="form">نموذج</SelectItem>
              <SelectItem value="poll">استطلاع</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Content */}
      {participations.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="لا توجد مشاركات"
          description="لم تشارك في أي أحداث بعد. عندما تشارك في استبيانات أو اختبارات، ستظهر هنا."
        />
      ) : filteredParticipations.length === 0 ? (
        <EmptyState
          icon={Search}
          title="لا توجد نتائج"
          description="لم يتم العثور على مشاركات تطابق معايير البحث"
        />
      ) : (
        <ParticipationsGrid
          participations={filteredParticipations}
          onViewDetails={handleViewDetails}
        />
      )}

      {/* Details Modal */}
      <ParticipationDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        participation={selectedParticipation}
        isLoading={isDetailsLoading}
      />
    </div>
  );
}

export default function ParticipationsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <ParticipationsPageContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}


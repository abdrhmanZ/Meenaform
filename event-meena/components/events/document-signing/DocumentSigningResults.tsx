"use client";

import { useState, useEffect, useRef } from "react";
import { DocumentSigningEvent, DocumentSignature, SignatureField } from "@/types/document-signing";
import { documentSigningService } from "@/lib/api/services";
import { downloadSignedPdf } from "@/lib/utils/pdfWithSignatures";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Users,
  CheckCircle,
  Clock,
  Download,
  Search,
  Filter,
  FileSignature,
  Eye,
  Calendar,
  Mail,
  User,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface SignerGroup {
  responseId: string;
  signerName: string;
  signerEmail: string;
  signedAt: string;
  signatures: DocumentSignature[];
  completedFields: number;
  totalRequiredFields: number;
  isComplete: boolean;
}

// للوضع multi-signer: معلومات كل موقّع
interface MultiSignerInfo {
  email: string;
  name?: string;
  signedAt?: string;
  hasSigned: boolean;
  fieldsCount: number;
  signedFieldsCount: number;
}

// ✅ Cache خارجي لمنع إعادة الجلب عند كل تنقل
const signaturesCache = new Map<string, DocumentSignature[]>();

interface DocumentSigningResultsProps {
  event: DocumentSigningEvent;
  onViewSignature?: (responseId: string) => void;
}

export default function DocumentSigningResults({
  event,
  onViewSignature,
}: DocumentSigningResultsProps) {
  const { toast } = useToast();
  const cached = signaturesCache.get(event.id);
  const [signatures, setSignatures] = useState<DocumentSignature[]>(cached || []);
  const [signerGroups, setSignerGroups] = useState<SignerGroup[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [filteredGroups, setFilteredGroups] = useState<SignerGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  // للوضع multi-signer
  const isMultiSigner = event.signingMode === "multi";

  // جلب التوقيعات
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    // ✅ لو البيانات موجودة في الـ cache، نستخدمها مباشرة
    if (cached) {
      const groups = groupSignaturesByResponse(cached, event.signatureFields);
      setSignerGroups(groups);
      setFilteredGroups(groups);
      return;
    }

    const fetchSignatures = async () => {
      try {
        setIsLoading(true);
        const data = await documentSigningService.getEventSignatures(event.id);
        signaturesCache.set(event.id, data);
        setSignatures(data);

        // تجميع التوقيعات حسب responseId
        const groups = groupSignaturesByResponse(data, event.signatureFields);
        setSignerGroups(groups);
        setFilteredGroups(groups);
      } catch (err) {
        console.error("Error fetching signatures:", err);
        setError("فشل في تحميل التوقيعات");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSignatures();
  }, [event.id, event.signatureFields]);

  // تجميع التوقيعات حسب الرد
  const groupSignaturesByResponse = (
    sigs: DocumentSignature[],
    fields: SignatureField[]
  ): SignerGroup[] => {
    const groupMap = new Map<string, SignerGroup>();
    const requiredFields = fields.filter((f) => f.isRequired).length;

    sigs.forEach((sig) => {
      const existing = groupMap.get(sig.responseId);
      if (existing) {
        existing.signatures.push(sig);
        existing.completedFields = existing.signatures.length;
        existing.isComplete = existing.completedFields >= requiredFields;
        // تحديث تاريخ التوقيع لآخر توقيع
        if (new Date(sig.signedAt) > new Date(existing.signedAt)) {
          existing.signedAt = sig.signedAt;
        }
      } else {
        groupMap.set(sig.responseId, {
          responseId: sig.responseId,
          signerName: sig.signerName,
          signerEmail: sig.signerEmail,
          signedAt: sig.signedAt,
          signatures: [sig],
          completedFields: 1,
          totalRequiredFields: requiredFields,
          isComplete: requiredFields <= 1,
        });
      }
    });

    return Array.from(groupMap.values()).sort(
      (a, b) => new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime()
    );
  };

  // البحث
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredGroups(signerGroups);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredGroups(
        signerGroups.filter(
          (g) =>
            g.signerName.toLowerCase().includes(query) ||
            g.signerEmail.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, signerGroups]);

  // للوضع multi-signer: حساب معلومات كل موقّع
  const getMultiSignerInfo = (): MultiSignerInfo[] => {
    if (!isMultiSigner) return [];

    // استخراج الإيميلات الفريدة من الحقول
    const signerEmails = [...new Set(
      event.signatureFields
        .filter(f => f.assignedEmail)
        .map(f => f.assignedEmail!.toLowerCase())
    )];

    return signerEmails.map(email => {
      const fieldsForSigner = event.signatureFields.filter(
        f => f.assignedEmail?.toLowerCase() === email
      );
      const signedFields = signatures.filter(
        sig => fieldsForSigner.some(f => f.id === sig.signatureFieldId)
      );
      const latestSignature = signedFields.sort(
        (a, b) => new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime()
      )[0];

      return {
        email,
        name: latestSignature?.signerName,
        signedAt: latestSignature?.signedAt,
        hasSigned: signedFields.length > 0,
        fieldsCount: fieldsForSigner.length,
        signedFieldsCount: signedFields.length,
      };
    });
  };

  const multiSignerInfo = getMultiSignerInfo();
  const signedSignersCount = multiSignerInfo.filter(s => s.hasSigned).length;
  const totalSignersCount = multiSignerInfo.length;

  // الإحصائيات
  const stats = isMultiSigner ? {
    totalSigners: totalSignersCount,
    completedSigners: signedSignersCount,
    totalSignatures: signatures.length,
    completionRate: totalSignersCount > 0
      ? Math.round((signedSignersCount / totalSignersCount) * 100)
      : 0,
  } : {
    totalSigners: signerGroups.length,
    completedSigners: signerGroups.filter((g) => g.isComplete).length,
    totalSignatures: signatures.length,
    completionRate:
      signerGroups.length > 0
        ? Math.round(
            (signerGroups.filter((g) => g.isComplete).length / signerGroups.length) * 100
          )
        : 0,
  };

  // تحميل PDF موقع (للوضع العادي)
  const handleDownloadPdf = async (group: SignerGroup) => {
    try {
      setDownloadingId(group.responseId);
      const fileName = `${event.title}_${group.signerName}_signed.pdf`;
      await downloadSignedPdf(event, group.signatures, fileName);
      toast({
        title: "تم التحميل",
        description: "تم تحميل الوثيقة الموقعة بنجاح",
      });
    } catch (err) {
      console.error("Error downloading PDF:", err);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الوثيقة الموقعة",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  // تحميل PDF بكل التوقيعات (للوضع multi-signer)
  const handleDownloadAllSignaturesPdf = async () => {
    try {
      setDownloadingAll(true);
      const fileName = `${event.title}_all_signatures.pdf`;
      await downloadSignedPdf(event, signatures, fileName);
      toast({
        title: "تم التحميل",
        description: `تم تحميل الوثيقة بـ ${signatures.length} توقيع`,
      });
    } catch (err) {
      console.error("Error downloading PDF:", err);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الوثيقة الموقعة",
        variant: "destructive",
      });
    } finally {
      setDownloadingAll(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 md:py-12">
        <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
        <span className="mr-2 text-sm md:text-base text-gray-600">جاري تحميل التوقيعات...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 md:p-8 text-center">
        <p className="text-red-600 text-sm md:text-base">{error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Statistics Cards - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        <Card className="p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 rounded-lg bg-blue-50">
              <Users className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.totalSigners}</p>
              <p className="text-xs md:text-sm text-gray-600">إجمالي الموقعين</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 rounded-lg bg-green-50">
              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
            </div>
            <div>
              <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.completedSigners}</p>
              <p className="text-xs md:text-sm text-gray-600">توقيعات مكتملة</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 rounded-lg bg-purple-50">
              <FileSignature className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.totalSignatures}</p>
              <p className="text-xs md:text-sm text-gray-600">إجمالي التوقيعات</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 rounded-lg bg-orange-50">
              <Clock className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
              <p className="text-xs md:text-sm text-gray-600">نسبة الإكمال</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search - Responsive (للوضع العادي فقط) */}
      {!isMultiSigner && (
        <Card className="p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="ابحث عن موقّع..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9 md:pr-10 text-sm md:text-base"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Multi-Signer View - بطاقة واحدة لكل الموقعين */}
      {isMultiSigner ? (
        <Card className="p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 md:mb-6 pb-4 border-b">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 md:p-2.5 rounded-lg bg-purple-100">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900">
                  حالة التوقيعات
                </h3>
                <p className="text-xs md:text-sm text-gray-600">
                  {signedSignersCount} من {totalSignersCount} موقّعين أكملوا التوقيع
                </p>
              </div>
            </div>
            {/* زر تحميل PDF */}
            {signatures.length > 0 && (
              <Button
                variant="default"
                size="sm"
                className="h-9 md:h-10 text-xs md:text-sm"
                onClick={handleDownloadAllSignaturesPdf}
                disabled={downloadingAll}
              >
                {downloadingAll ? (
                  <Loader2 className="w-4 h-4 ml-1 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 ml-1" />
                )}
                <span className="hidden sm:inline">تحميل PDF</span>
                <span className="sm:hidden">PDF</span>
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-4 md:mb-6">
            <div className="flex items-center justify-between mb-2 text-xs md:text-sm">
              <span className="text-gray-600">التقدم الكلي</span>
              <span className="font-medium text-gray-900">
                {stats.completionRate}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 md:h-3">
              <div
                className={cn(
                  "h-2 md:h-3 rounded-full transition-all duration-500",
                  stats.completionRate === 100 ? "bg-green-500" : "bg-purple-500"
                )}
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </div>

          {/* Signers List */}
          <div className="space-y-3 md:space-y-4">
            {multiSignerInfo.map((signer, index) => (
              <div
                key={signer.email}
                className={cn(
                  "p-3 md:p-4 rounded-lg border transition-all",
                  signer.hasSigned
                    ? "border-green-200 bg-green-50"
                    : "border-gray-200 bg-gray-50"
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div
                    className={cn(
                      "w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0",
                      signer.hasSigned
                        ? "bg-gradient-to-br from-green-500 to-green-600"
                        : "bg-gradient-to-br from-gray-400 to-gray-500"
                    )}
                  >
                    {signer.name?.charAt(0).toUpperCase() || signer.email.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-gray-900 text-sm md:text-base truncate">
                        {signer.name || `موقّع ${index + 1}`}
                      </span>
                      {signer.hasSigned ? (
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs md:text-sm text-gray-600 truncate flex items-center gap-1">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      {signer.email}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="text-left flex-shrink-0">
                    {signer.hasSigned ? (
                      <div className="text-xs md:text-sm">
                        <Badge className="bg-green-100 text-green-700 text-xs">
                          {signer.signedFieldsCount}/{signer.fieldsCount} حقل
                        </Badge>
                        {signer.signedAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(signer.signedAt), "d MMM", { locale: ar })}
                          </p>
                        )}
                      </div>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        في الانتظار
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {multiSignerInfo.length === 0 && (
            <div className="text-center py-8">
              <FileSignature className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">لا يوجد موقّعين محددين</p>
            </div>
          )}
        </Card>
      ) : (
        /* Single Signer View - العرض العادي */
        <>
          {filteredGroups.length === 0 ? (
            <Card className="p-8 md:p-12 text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <FileSignature className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                لا توجد توقيعات بعد
              </h3>
              <p className="text-sm md:text-base text-gray-600">
                {searchQuery
                  ? "لم يتم العثور على نتائج مطابقة للبحث"
                  : "لم يقم أي مشارك بتوقيع هذه الوثيقة بعد"}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {filteredGroups.map((group) => (
                <Card
                  key={group.responseId}
                  className="p-3 md:p-4 hover:shadow-lg transition-all duration-300"
                >
                  {/* Signer Info */}
                  <div className="flex items-start gap-2 md:gap-3 mb-3 md:mb-4">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-sm md:text-base flex-shrink-0">
                      {group.signerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate text-sm md:text-base">
                        {group.signerName}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-600 truncate">{group.signerEmail}</p>
                    </div>
                    <Badge
                      variant={group.isComplete ? "default" : "secondary"}
                      className={cn(
                        "text-xs flex-shrink-0",
                        group.isComplete ? "bg-green-100 text-green-700" : ""
                      )}
                    >
                      {group.isComplete ? "مكتمل" : "جزئي"}
                    </Badge>
                  </div>

                  {/* Stats */}
                  <div className="space-y-1.5 md:space-y-2 mb-3 md:mb-4 text-xs md:text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span className="hidden sm:inline">تاريخ التوقيع:</span>
                        <span className="sm:hidden">التاريخ:</span>
                      </span>
                      <span className="font-medium">
                        {format(new Date(group.signedAt), "d MMM yyyy", { locale: ar })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center gap-1">
                        <FileSignature className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span className="hidden sm:inline">الحقول الموقعة:</span>
                        <span className="sm:hidden">الحقول:</span>
                      </span>
                      <span className="font-medium">
                        {group.completedFields} / {group.totalRequiredFields}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-1.5 md:h-2 mb-3 md:mb-4">
                    <div
                      className={cn(
                        "h-1.5 md:h-2 rounded-full transition-all",
                        group.isComplete ? "bg-green-500" : "bg-yellow-500"
                      )}
                      style={{
                        width: `${Math.min(
                          (group.completedFields / group.totalRequiredFields) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>

                  {/* Actions - Responsive */}
                  <div className="flex gap-2">
                    {onViewSignature && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-9 md:h-10 text-xs md:text-sm"
                        onClick={() => onViewSignature(group.responseId)}
                      >
                        <Eye className="w-3.5 h-3.5 md:w-4 md:h-4 ml-1" />
                        عرض
                      </Button>
                    )}
                    {group.isComplete && (
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 h-9 md:h-10 text-xs md:text-sm"
                        onClick={() => handleDownloadPdf(group)}
                        disabled={downloadingId === group.responseId}
                      >
                        {downloadingId === group.responseId ? (
                          <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 ml-1 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5 md:w-4 md:h-4 ml-1" />
                        )}
                        PDF
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}


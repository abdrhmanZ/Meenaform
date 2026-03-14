"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  UserPlus,
  Trash2,
  Loader2,
  AlertCircle,
  Check,
  Users,
  Shield,
  Eye,
  Edit,
  Settings,
  ChevronDown,
} from "lucide-react";
import { collaboratorService } from "@/lib/api/services/collaboratorService";
import {
  Collaborator,
  CollaboratorRole,
  UserSearchResult,
} from "@/types/event";

interface CollaboratorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventTitle: string;
}

const roleConfig: Record<
  CollaboratorRole,
  { label: string; description: string; icon: typeof Eye; color: string }
> = {
  viewer: {
    label: "مشاهد",
    description: "عرض الحدث والنتائج فقط",
    icon: Eye,
    color: "text-blue-600",
  },
  editor: {
    label: "محرر",
    description: "تعديل الأسئلة والإعدادات والنشر",
    icon: Edit,
    color: "text-amber-600",
  },
};

export default function CollaboratorsDialog({
  open,
  onOpenChange,
  eventId,
  eventTitle,
}: CollaboratorsDialogProps) {
  // حالة المتعاونين
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoadingCollaborators, setIsLoadingCollaborators] = useState(false);

  // حالة البحث والإضافة
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRole, setSelectedRole] = useState<CollaboratorRole>("editor");
  const [isAdding, setIsAdding] = useState(false);

  // حالة العمليات
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  // رسائل
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // جلب المتعاونين عند فتح الـ Dialog
  const loadCollaborators = useCallback(async () => {
    setIsLoadingCollaborators(true);
    try {
      const data = await collaboratorService.getEventCollaborators(eventId);
      setCollaborators(data);
    } catch (err: any) {
      setError(err.message || "فشل جلب المتعاونين");
    } finally {
      setIsLoadingCollaborators(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (open) {
      loadCollaborators();
      setSearchQuery("");
      setSearchResults([]);
      setError("");
      setSuccessMessage("");
    }
  }, [open, loadCollaborators]);

  // البحث عن مستخدمين (مع debounce بسيط)
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await collaboratorService.searchUsers(searchQuery.trim());
        // استبعاد المتعاونين الموجودين
        const existingUserIds = collaborators.map((c) => c.userId);
        setSearchResults(results.filter((u) => !existingUserIds.includes(u.id)));
      } catch {
        // صامت — لا نعرض خطأ للبحث
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, collaborators]);

  // إضافة متعاون
  const handleAddCollaborator = async (user: UserSearchResult) => {
    setIsAdding(true);
    setError("");
    try {
      const newCollaborator = await collaboratorService.addCollaborator(
        eventId,
        user.email,
        selectedRole
      );
      setCollaborators((prev) => [...prev, newCollaborator]);
      setSearchQuery("");
      setSearchResults([]);
      showSuccess("تم إضافة المتعاون بنجاح");
    } catch (err: any) {
      setError(err.message || "فشل إضافة المتعاون");
    } finally {
      setIsAdding(false);
    }
  };

  // تعديل صلاحية متعاون
  const handleUpdateRole = async (userId: string, newRole: CollaboratorRole) => {
    setUpdatingUserId(userId);
    setError("");
    try {
      const updated = await collaboratorService.updateCollaboratorRole(
        eventId,
        userId,
        newRole
      );
      setCollaborators((prev) =>
        prev.map((c) => (c.userId === userId ? updated : c))
      );
      showSuccess("تم تعديل الصلاحية");
    } catch (err: any) {
      setError(err.message || "فشل تعديل الصلاحية");
    } finally {
      setUpdatingUserId(null);
    }
  };

  // إزالة متعاون
  const handleRemoveCollaborator = async (userId: string) => {
    setRemovingUserId(userId);
    setError("");
    try {
      await collaboratorService.removeCollaborator(eventId, userId);
      setCollaborators((prev) => prev.filter((c) => c.userId !== userId));
      showSuccess("تم إزالة المتعاون");
    } catch (err: any) {
      setError(err.message || "فشل إزالة المتعاون");
    } finally {
      setRemovingUserId(null);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 2500);
  };

  // الحرف الأول من الاسم للصورة الافتراضية
  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : "?";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>إدارة المتعاونين</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* العنوان */}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">إدارة المتعاونين</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  أضف مستخدمين للتعاون في إدارة هذا الحدث
                </p>
              </div>
            </div>
          </div>

          {/* البحث والإضافة */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-500" />
              <Label className="text-sm font-semibold text-gray-900">
                إضافة متعاون جديد
              </Label>
            </div>

            {/* اختيار الصلاحية */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="ابحث بالبريد الإلكتروني..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-sm"
                  dir="ltr"
                />
              </div>
              <Select
                value={selectedRole}
                onValueChange={(v) => setSelectedRole(v as CollaboratorRole)}
              >
                <SelectTrigger className="w-[120px] text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">مشاهد</SelectItem>
                  <SelectItem value="editor">محرر</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* نتائج البحث */}
            {isSearching && (
              <div className="flex items-center justify-center py-3">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                <span className="text-xs text-gray-400 mr-2">جاري البحث...</span>
              </div>
            )}

            {!isSearching && searchResults.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                        {getInitial(user.fullName)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.fullName}
                        </p>
                        <p className="text-xs text-gray-500 truncate" dir="ltr">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddCollaborator(user)}
                      disabled={isAdding}
                      className="shrink-0 gap-1 text-xs"
                    >
                      {isAdding ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <UserPlus className="w-3 h-3" />
                      )}
                      إضافة
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {!isSearching &&
              searchQuery.trim().length >= 3 &&
              searchResults.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">
                  لم يتم العثور على مستخدمين بهذا البريد
                </p>
              )}

            {searchQuery.trim().length > 0 &&
              searchQuery.trim().length < 3 && (
                <p className="text-xs text-gray-400 pr-1">
                  أدخل 3 أحرف على الأقل للبحث
                </p>
              )}
          </div>

          {/* قائمة المتعاونين الحاليين */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-500" />
                <Label className="text-sm font-semibold text-gray-900">
                  المتعاونون الحاليون
                </Label>
              </div>
              {collaborators.length > 0 && (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {collaborators.length}
                </span>
              )}
            </div>

            {isLoadingCollaborators ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : collaborators.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl">
                <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">
                  لم يتم إضافة أي متعاون بعد
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  ابحث بالبريد الإلكتروني لإضافة متعاونين
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {collaborators.map((collaborator) => {
                  const config = roleConfig[collaborator.role];
                  const RoleIcon = config.icon;
                  const isUpdating = updatingUserId === collaborator.userId;
                  const isRemoving = removingUserId === collaborator.userId;

                  return (
                    <div
                      key={collaborator.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 group hover:border-gray-200 transition-all"
                    >
                      {/* معلومات المتعاون */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                          {getInitial(collaborator.userName)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {collaborator.userName}
                          </p>
                          <p className="text-xs text-gray-500 truncate" dir="ltr">
                            {collaborator.userEmail}
                          </p>
                        </div>
                      </div>

                      {/* الصلاحية والإجراءات */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Select لتغيير الصلاحية */}
                        <Select
                          value={collaborator.role}
                          onValueChange={(v) =>
                            handleUpdateRole(
                              collaborator.userId,
                              v as CollaboratorRole
                            )
                          }
                          disabled={isUpdating}
                        >
                          <SelectTrigger className="w-[100px] h-8 text-xs border-gray-200">
                            {isUpdating ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            {(
                              Object.entries(roleConfig) as [
                                CollaboratorRole,
                                (typeof roleConfig)[CollaboratorRole],
                              ][]
                            ).map(([key, cfg]) => (
                              <SelectItem key={key} value={key}>
                                <span className="flex items-center gap-1.5">
                                  <cfg.icon className={`w-3 h-3 ${cfg.color}`} />
                                  {cfg.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* زر الحذف */}
                        <button
                          onClick={() =>
                            handleRemoveCollaborator(collaborator.userId)
                          }
                          disabled={isRemoving}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                          title="إزالة المتعاون"
                        >
                          {isRemoving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* دليل الصلاحيات */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <Label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              دليل الصلاحيات
            </Label>
            <div className="grid gap-1.5">
              {(
                Object.entries(roleConfig) as [
                  CollaboratorRole,
                  (typeof roleConfig)[CollaboratorRole],
                ][]
              ).map(([, cfg]) => (
                <div
                  key={cfg.label}
                  className="flex items-center gap-2 text-xs text-gray-500"
                >
                  <cfg.icon className={`w-3 h-3 ${cfg.color}`} />
                  <span className="font-medium text-gray-700">{cfg.label}</span>
                  <span className="text-gray-400">-</span>
                  <span>{cfg.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* رسائل الخطأ والنجاح */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-100">
              <Check className="w-4 h-4 text-green-600 shrink-0" />
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

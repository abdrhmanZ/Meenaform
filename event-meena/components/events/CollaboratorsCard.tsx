"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Eye, Edit, Settings, Loader2, UserPlus } from "lucide-react";
import { collaboratorService } from "@/lib/api/services/collaboratorService";
import { Collaborator, CollaboratorRole } from "@/types/event";

interface CollaboratorsCardProps {
  eventId: string;
  onManageClick: () => void;
}

const roleIcons: Record<CollaboratorRole, { icon: typeof Eye; color: string; bg: string }> = {
  viewer: { icon: Eye, color: "text-blue-600", bg: "bg-blue-50" },
  editor: { icon: Edit, color: "text-amber-600", bg: "bg-amber-50" },
};

export default function CollaboratorsCard({
  eventId,
  onManageClick,
}: CollaboratorsCardProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCollaborators = useCallback(async () => {
    try {
      const data = await collaboratorService.getEventCollaborators(eventId);
      setCollaborators(data);
    } catch {
      // صامت — الكارت لن يظهر محتوى فقط
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadCollaborators();
  }, [loadCollaborators]);

  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : "?";
  };

  return (
    <Card className="p-6">
      {/* العنوان */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-bold text-gray-900">المتعاونون</h3>
        </div>
        {collaborators.length > 0 && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {collaborators.length}
          </span>
        )}
      </div>

      {/* المحتوى */}
      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : collaborators.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-gray-400 mb-3">
            لم يتم إضافة أي متعاون بعد
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onManageClick}
            className="gap-1.5 text-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            إضافة متعاون
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* قائمة المتعاونين (أول 5 فقط) */}
          {collaborators.slice(0, 5).map((collaborator) => {
            const config = roleIcons[collaborator.role];
            const RoleIcon = config.icon;

            return (
              <div
                key={collaborator.id}
                className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
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
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                  <RoleIcon className="w-3 h-3" />
                  {collaborator.roleName}
                </div>
              </div>
            );
          })}

          {/* عرض المزيد */}
          {collaborators.length > 5 && (
            <p className="text-xs text-gray-400 text-center">
              و {collaborators.length - 5} آخرين
            </p>
          )}

          {/* زر الإدارة */}
          <Button
            variant="outline"
            size="sm"
            onClick={onManageClick}
            className="w-full gap-1.5 text-xs mt-2"
          >
            <Settings className="w-3.5 h-3.5" />
            إدارة المتعاونين
          </Button>
        </div>
      )}
    </Card>
  );
}

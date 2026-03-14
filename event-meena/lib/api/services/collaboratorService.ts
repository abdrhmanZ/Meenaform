/**
 * Collaborator Service - خدمة إدارة المتعاونين
 * الاتصال بـ Backend API للتعاون في الأحداث
 */

import { apiClient, ApiResponse } from "../client";
import {
  BackendCollaboratorDto,
  BackendUserSearchResultDto,
  BackendSharedEventListItemDto,
  mapCollaborator,
  mapUserSearchResult,
  mapSharedEventListItem,
} from "../mappers";
import { Collaborator, CollaboratorRole, UserSearchResult, SharedEvent } from "@/types/event";

// ============================================================
// تحويل الدور من نص إلى رقم
// ============================================================

const roleToNumber = (role: CollaboratorRole): number => {
  const roles: Record<CollaboratorRole, number> = {
    viewer: 1,
    editor: 2,
  };
  return roles[role] ?? 1;
};

// ============================================================
// خدمة المتعاونين
// ============================================================

export const collaboratorService = {
  /**
   * جلب جميع المتعاونين في حدث معين
   */
  getEventCollaborators: async (eventId: string): Promise<Collaborator[]> => {
    const response = await apiClient.get<ApiResponse<BackendCollaboratorDto[]>>(
      `/Events/${eventId}/collaborators`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "فشل جلب المتعاونين");
    }

    return response.data.data.map(mapCollaborator);
  },

  /**
   * إضافة متعاون جديد
   */
  addCollaborator: async (
    eventId: string,
    email: string,
    role: CollaboratorRole
  ): Promise<Collaborator> => {
    const response = await apiClient.post<ApiResponse<BackendCollaboratorDto>>(
      `/Events/${eventId}/collaborators`,
      { email, role: roleToNumber(role) }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "فشل إضافة المتعاون");
    }

    return mapCollaborator(response.data.data);
  },

  /**
   * تعديل صلاحية متعاون
   */
  updateCollaboratorRole: async (
    eventId: string,
    userId: string,
    role: CollaboratorRole
  ): Promise<Collaborator> => {
    const response = await apiClient.put<ApiResponse<BackendCollaboratorDto>>(
      `/Events/${eventId}/collaborators/${userId}`,
      { role: roleToNumber(role) }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "فشل تعديل الصلاحية");
    }

    return mapCollaborator(response.data.data);
  },

  /**
   * إزالة متعاون
   */
  removeCollaborator: async (eventId: string, userId: string): Promise<void> => {
    const response = await apiClient.delete<ApiResponse<null>>(
      `/Events/${eventId}/collaborators/${userId}`
    );

    if (!response.data.success) {
      throw new Error(response.data.message || "فشل إزالة المتعاون");
    }
  },

  /**
   * البحث عن مستخدمين بالبريد الإلكتروني
   */
  searchUsers: async (email: string): Promise<UserSearchResult[]> => {
    const response = await apiClient.get<ApiResponse<BackendUserSearchResultDto[]>>(
      `/Events/users/search`,
      { params: { email } }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "فشل البحث");
    }

    return response.data.data.map(mapUserSearchResult);
  },

  /**
   * جلب الأحداث المشتركة مع المستخدم الحالي
   */
  getSharedWithMe: async (): Promise<SharedEvent[]> => {
    const response = await apiClient.get<ApiResponse<BackendSharedEventListItemDto[]>>(
      `/Events/shared-with-me`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "فشل جلب الأحداث المشتركة");
    }

    return response.data.data.map(mapSharedEventListItem);
  },
};

using EventMeena.Application.DTOs.Common;
using EventMeena.Application.DTOs.Events;

namespace EventMeena.Application.Services.Interfaces;

/// <summary>
/// خدمة إدارة المتعاونين في الأحداث
/// </summary>
public interface ICollaboratorService
{
    /// <summary>
    /// جلب جميع المتعاونين في حدث معين
    /// </summary>
    Task<ApiResponse<List<CollaboratorDto>>> GetEventCollaboratorsAsync(Guid eventId, Guid currentUserId);

    /// <summary>
    /// إضافة متعاون جديد للحدث
    /// </summary>
    Task<ApiResponse<CollaboratorDto>> AddCollaboratorAsync(Guid eventId, Guid currentUserId, AddCollaboratorRequest request);

    /// <summary>
    /// تعديل صلاحية متعاون
    /// </summary>
    Task<ApiResponse<CollaboratorDto>> UpdateCollaboratorRoleAsync(Guid eventId, Guid collaboratorUserId, Guid currentUserId, UpdateCollaboratorRoleRequest request);

    /// <summary>
    /// إزالة متعاون من الحدث
    /// </summary>
    Task<ApiResponse> RemoveCollaboratorAsync(Guid eventId, Guid collaboratorUserId, Guid currentUserId);

    /// <summary>
    /// البحث عن مستخدمين بالبريد الإلكتروني
    /// </summary>
    Task<ApiResponse<List<UserSearchResultDto>>> SearchUsersAsync(string email, Guid currentUserId);

    /// <summary>
    /// جلب الأحداث المشتركة مع المستخدم الحالي
    /// </summary>
    Task<ApiResponse<List<SharedEventListItemDto>>> GetSharedWithMeEventsAsync(Guid currentUserId);
}

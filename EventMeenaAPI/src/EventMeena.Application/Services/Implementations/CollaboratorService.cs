using AutoMapper;
using EventMeena.Application.DTOs.Common;
using EventMeena.Application.DTOs.Events;
using EventMeena.Application.Interfaces;
using EventMeena.Application.Services.Interfaces;
using EventMeena.Domain.Entities;
using EventMeena.Domain.Enums;

namespace EventMeena.Application.Services.Implementations;

/// <summary>
/// خدمة إدارة المتعاونين في الأحداث
/// </summary>
public class CollaboratorService : ICollaboratorService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public CollaboratorService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<ApiResponse<List<CollaboratorDto>>> GetEventCollaboratorsAsync(Guid eventId, Guid currentUserId)
    {
        // التحقق من أن المستخدم هو مالك الحدث أو متعاون فيه
        var evt = await _unitOfWork.Events.GetByIdAsync(eventId);
        if (evt == null)
            return ApiResponse<List<CollaboratorDto>>.FailureResponse("الحدث غير موجود");

        if (evt.UserId != currentUserId)
        {
            var isCollaborator = await _unitOfWork.EventCollaborators.IsCollaboratorAsync(eventId, currentUserId);
            if (!isCollaborator)
                return ApiResponse<List<CollaboratorDto>>.FailureResponse("غير مصرح لك بالوصول لهذا الحدث");
        }

        var collaborators = await _unitOfWork.EventCollaborators.GetByEventIdAsync(eventId);
        var dtos = collaborators.Select(MapToCollaboratorDto).ToList();

        return ApiResponse<List<CollaboratorDto>>.SuccessResponse(dtos);
    }

    public async Task<ApiResponse<CollaboratorDto>> AddCollaboratorAsync(Guid eventId, Guid currentUserId, AddCollaboratorRequest request)
    {
        // التحقق من أن المستخدم هو مالك الحدث فقط (المالك هو الوحيد الذي يمكنه إضافة متعاونين)
        var evt = await _unitOfWork.Events.GetByIdAsync(eventId);
        if (evt == null)
            return ApiResponse<CollaboratorDto>.FailureResponse("الحدث غير موجود");

        if (evt.UserId != currentUserId)
            return ApiResponse<CollaboratorDto>.FailureResponse("فقط صاحب الحدث يمكنه إضافة متعاونين");

        // التحقق من صحة الدور
        if (!Enum.IsDefined(typeof(CollaboratorRole), request.Role))
            return ApiResponse<CollaboratorDto>.FailureResponse("الصلاحية غير صالحة. استخدم: 1=مشاهد، 2=محرر، 3=مدير");

        // البحث عن المستخدم بالبريد
        var targetUser = await _unitOfWork.Users.GetByEmailAsync(request.Email.Trim());
        if (targetUser == null)
            return ApiResponse<CollaboratorDto>.FailureResponse("لم يتم العثور على مستخدم بهذا البريد الإلكتروني. يجب أن يكون مسجلاً في المنصة");

        // التحقق من أن المستخدم ليس المالك نفسه
        if (targetUser.Id == currentUserId)
            return ApiResponse<CollaboratorDto>.FailureResponse("لا يمكنك إضافة نفسك كمتعاون");

        // التحقق من عدم وجود المتعاون مسبقاً
        var existing = await _unitOfWork.EventCollaborators.GetByEventAndUserAsync(eventId, targetUser.Id);
        if (existing != null)
            return ApiResponse<CollaboratorDto>.FailureResponse("هذا المستخدم متعاون بالفعل في هذا الحدث");

        // إنشاء المتعاون
        var collaborator = new EventCollaborator
        {
            EventId = eventId,
            UserId = targetUser.Id,
            Role = (CollaboratorRole)request.Role
        };

        await _unitOfWork.EventCollaborators.AddAsync(collaborator);
        await _unitOfWork.SaveChangesAsync();

        // إرجاع النتيجة مع بيانات المستخدم
        collaborator.User = targetUser;
        var dto = MapToCollaboratorDto(collaborator);

        return ApiResponse<CollaboratorDto>.SuccessResponse(dto, "تم إضافة المتعاون بنجاح");
    }

    public async Task<ApiResponse<CollaboratorDto>> UpdateCollaboratorRoleAsync(Guid eventId, Guid collaboratorUserId, Guid currentUserId, UpdateCollaboratorRoleRequest request)
    {
        // التحقق من أن المستخدم هو مالك الحدث
        var evt = await _unitOfWork.Events.GetByIdAsync(eventId);
        if (evt == null)
            return ApiResponse<CollaboratorDto>.FailureResponse("الحدث غير موجود");

        if (evt.UserId != currentUserId)
            return ApiResponse<CollaboratorDto>.FailureResponse("فقط صاحب الحدث يمكنه تعديل صلاحيات المتعاونين");

        // التحقق من صحة الدور
        if (!Enum.IsDefined(typeof(CollaboratorRole), request.Role))
            return ApiResponse<CollaboratorDto>.FailureResponse("الصلاحية غير صالحة. استخدم: 1=مشاهد، 2=محرر، 3=مدير");

        // جلب المتعاون
        var collaborator = await _unitOfWork.EventCollaborators.GetByEventAndUserAsync(eventId, collaboratorUserId);
        if (collaborator == null)
            return ApiResponse<CollaboratorDto>.FailureResponse("المتعاون غير موجود في هذا الحدث");

        // تحديث الصلاحية
        collaborator.Role = (CollaboratorRole)request.Role;
        _unitOfWork.EventCollaborators.Update(collaborator);
        await _unitOfWork.SaveChangesAsync();

        var dto = MapToCollaboratorDto(collaborator);
        return ApiResponse<CollaboratorDto>.SuccessResponse(dto, "تم تعديل صلاحية المتعاون بنجاح");
    }

    public async Task<ApiResponse> RemoveCollaboratorAsync(Guid eventId, Guid collaboratorUserId, Guid currentUserId)
    {
        // التحقق من أن المستخدم هو مالك الحدث
        var evt = await _unitOfWork.Events.GetByIdAsync(eventId);
        if (evt == null)
            return ApiResponse.FailureResponse("الحدث غير موجود");

        if (evt.UserId != currentUserId)
            return ApiResponse.FailureResponse("فقط صاحب الحدث يمكنه إزالة المتعاونين");

        // جلب المتعاون
        var collaborator = await _unitOfWork.EventCollaborators.GetByEventAndUserAsync(eventId, collaboratorUserId);
        if (collaborator == null)
            return ApiResponse.FailureResponse("المتعاون غير موجود في هذا الحدث");

        _unitOfWork.EventCollaborators.Delete(collaborator);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse.SuccessResponse("تم إزالة المتعاون بنجاح");
    }

    public async Task<ApiResponse<List<UserSearchResultDto>>> SearchUsersAsync(string email, Guid currentUserId)
    {
        if (string.IsNullOrWhiteSpace(email) || email.Trim().Length < 3)
            return ApiResponse<List<UserSearchResultDto>>.FailureResponse("أدخل 3 أحرف على الأقل للبحث");

        var emailTrimmed = email.Trim().ToLowerInvariant();

        // البحث عن مستخدمين بالبريد (يستثني المستخدم الحالي)
        var users = await _unitOfWork.Users.FindAsync(u =>
            u.Email.ToLower().Contains(emailTrimmed) && u.Id != currentUserId && u.IsActive);

        var dtos = users.Select(u => new UserSearchResultDto
        {
            Id = u.Id,
            FullName = u.FullName,
            Email = u.Email,
            ProfileImage = u.ProfileImage
        }).Take(10).ToList();

        return ApiResponse<List<UserSearchResultDto>>.SuccessResponse(dtos);
    }

    public async Task<ApiResponse<List<SharedEventListItemDto>>> GetSharedWithMeEventsAsync(Guid currentUserId)
    {
        // جلب جميع الأحداث المشتركة مع المستخدم
        var collaborations = await _unitOfWork.EventCollaborators.GetByUserIdAsync(currentUserId);

        if (!collaborations.Any())
            return ApiResponse<List<SharedEventListItemDto>>.SuccessResponse(new List<SharedEventListItemDto>());

        var dtos = new List<SharedEventListItemDto>();

        foreach (var collab in collaborations)
        {
            // جلب الحدث مع تفاصيل الأقسام والعدد
            var evt = collab.Event;
            if (evt == null) continue;

            // جلب صاحب الحدث
            var owner = await _unitOfWork.Users.GetByIdAsync(evt.UserId);

            var dto = _mapper.Map<SharedEventListItemDto>(evt);
            dto.OwnerName = owner?.FullName ?? "غير معروف";
            dto.MyRole = (int)collab.Role;
            dto.MyRoleName = GetRoleName(collab.Role);

            dtos.Add(dto);
        }

        return ApiResponse<List<SharedEventListItemDto>>.SuccessResponse(dtos);
    }

    // ===== Helper Methods =====

    private static CollaboratorDto MapToCollaboratorDto(EventCollaborator collaborator)
    {
        return new CollaboratorDto
        {
            Id = collaborator.Id,
            UserId = collaborator.UserId,
            UserName = collaborator.User?.FullName ?? "غير معروف",
            UserEmail = collaborator.User?.Email ?? "",
            UserProfileImage = collaborator.User?.ProfileImage,
            Role = (int)collaborator.Role,
            RoleName = GetRoleName(collaborator.Role),
            AddedAt = collaborator.CreatedAt
        };
    }

    private static string GetRoleName(CollaboratorRole role)
    {
        return role switch
        {
            CollaboratorRole.Viewer => "مشاهد",
            CollaboratorRole.Editor => "محرر",
            _ => "غير معروف"
        };
    }
}

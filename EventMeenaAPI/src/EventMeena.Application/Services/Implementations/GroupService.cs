using AutoMapper;
using EventMeena.Application.DTOs.Common;
using EventMeena.Application.DTOs.Groups;
using EventMeena.Application.Interfaces;
using EventMeena.Application.Services.Interfaces;
using EventMeena.Domain.Entities;

namespace EventMeena.Application.Services.Implementations;

/// <summary>
/// Group service implementation
/// </summary>
public class GroupService : IGroupService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GroupService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<ApiResponse<GroupDto>> GetByIdAsync(Guid id, Guid userId)
    {
        // استخدام GetByIdWithContactsAsync لتحميل ContactGroups و SendHistories للإحصائيات
        var group = await _unitOfWork.Groups.GetByIdWithContactsAsync(id);
        if (group == null || group.UserId != userId)
            return ApiResponse<GroupDto>.FailureResponse("المجموعة غير موجودة");

        var dto = _mapper.Map<GroupDto>(group);
        return ApiResponse<GroupDto>.SuccessResponse(dto);
    }

    public async Task<ApiResponse<GroupWithContactsDto>> GetByIdWithContactsAsync(Guid id, Guid userId)
    {
        var group = await _unitOfWork.Groups.GetByIdWithContactsAsync(id);
        if (group == null || group.UserId != userId)
            return ApiResponse<GroupWithContactsDto>.FailureResponse("المجموعة غير موجودة");

        return ApiResponse<GroupWithContactsDto>.SuccessResponse(_mapper.Map<GroupWithContactsDto>(group));
    }

    public async Task<ApiResponse<List<GroupDto>>> GetUserGroupsAsync(Guid userId)
    {
        // GetByUserIdAsync already includes ContactGroups, so AutoMapper calculates ContactCount from src.ContactGroups.Count
        var groups = await _unitOfWork.Groups.GetByUserIdAsync(userId);
        var dtos = _mapper.Map<List<GroupDto>>(groups);
        return ApiResponse<List<GroupDto>>.SuccessResponse(dtos);
    }

    public async Task<ApiResponse<List<GroupWithContactsDto>>> GetUserGroupsWithContactsAsync(Guid userId)
    {
        var groups = await _unitOfWork.Groups.GetByUserIdWithContactsAsync(userId);
        return ApiResponse<List<GroupWithContactsDto>>.SuccessResponse(_mapper.Map<List<GroupWithContactsDto>>(groups));
    }

    public async Task<ApiResponse<GroupDto>> CreateAsync(Guid userId, CreateGroupRequest request)
    {
        var group = _mapper.Map<Group>(request);
        group.UserId = userId;
        group.IsActive = true;

        // إضافة جهات الاتصال إذا تم تحديدها
        if (request.ContactIds != null && request.ContactIds.Count > 0)
        {
            foreach (var contactId in request.ContactIds)
            {
                group.ContactGroups.Add(new ContactGroup
                {
                    ContactId = contactId,
                    GroupId = group.Id,
                    AddedAt = DateTime.UtcNow
                });
            }
        }

        await _unitOfWork.Groups.AddAsync(group);
        await _unitOfWork.SaveChangesAsync();

        // إعادة جلب المجموعة مع البيانات الكاملة للإحصائيات
        var savedGroup = await _unitOfWork.Groups.GetByIdWithContactsAsync(group.Id);
        return ApiResponse<GroupDto>.SuccessResponse(_mapper.Map<GroupDto>(savedGroup!), "تم إنشاء المجموعة بنجاح");
    }

    public async Task<ApiResponse<GroupDto>> UpdateAsync(Guid id, Guid userId, UpdateGroupRequest request)
    {
        // استخدام GetByIdWithContactsAsync لتحميل البيانات الكاملة
        var group = await _unitOfWork.Groups.GetByIdWithContactsAsync(id);
        if (group == null || group.UserId != userId)
            return ApiResponse<GroupDto>.FailureResponse("المجموعة غير موجودة");

        _mapper.Map(request, group);
        _unitOfWork.Groups.Update(group);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<GroupDto>.SuccessResponse(_mapper.Map<GroupDto>(group), "تم تحديث المجموعة بنجاح");
    }

    public async Task<ApiResponse> DeleteAsync(Guid id, Guid userId)
    {
        // استخدام GetByIdWithContactsAsync للتحقق من الملكية
        var group = await _unitOfWork.Groups.GetByIdWithContactsAsync(id);
        if (group == null || group.UserId != userId)
            return ApiResponse.FailureResponse("المجموعة غير موجودة");

        group.IsActive = false;
        _unitOfWork.Groups.Update(group);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse.SuccessResponse("تم حذف المجموعة بنجاح");
    }

    public async Task<ApiResponse> AddContactsAsync(Guid id, Guid userId, AddContactsToGroupRequest request)
    {
        var group = await _unitOfWork.Groups.GetByIdWithContactsAsync(id);
        if (group == null || group.UserId != userId)
            return ApiResponse.FailureResponse("المجموعة غير موجودة");

        foreach (var contactId in request.ContactIds)
        {
            if (!group.ContactGroups.Any(cg => cg.ContactId == contactId))
            {
                group.ContactGroups.Add(new ContactGroup
                {
                    ContactId = contactId,
                    GroupId = id,
                    AddedAt = DateTime.UtcNow
                });
            }
        }

        await _unitOfWork.SaveChangesAsync();
        return ApiResponse.SuccessResponse("تم إضافة جهات الاتصال بنجاح");
    }

    public async Task<ApiResponse> RemoveContactsAsync(Guid id, Guid userId, RemoveContactsFromGroupRequest request)
    {
        var group = await _unitOfWork.Groups.GetByIdWithContactsAsync(id);
        if (group == null || group.UserId != userId)
            return ApiResponse.FailureResponse("المجموعة غير موجودة");

        var toRemove = group.ContactGroups.Where(cg => request.ContactIds.Contains(cg.ContactId)).ToList();
        foreach (var cg in toRemove)
        {
            group.ContactGroups.Remove(cg);
        }

        await _unitOfWork.SaveChangesAsync();
        return ApiResponse.SuccessResponse("تم إزالة جهات الاتصال بنجاح");
    }
}


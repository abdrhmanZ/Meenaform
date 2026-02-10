using AutoMapper;
using EventMeena.Application.DTOs.Common;
using EventMeena.Application.DTOs.Contacts;
using EventMeena.Application.Interfaces;
using EventMeena.Application.Services.Interfaces;
using EventMeena.Domain.Entities;

namespace EventMeena.Application.Services.Implementations;

/// <summary>
/// Contact service implementation
/// </summary>
public class ContactService : IContactService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public ContactService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<ApiResponse<ContactDto>> GetByIdAsync(Guid id, Guid userId)
    {
        var contact = await _unitOfWork.Contacts.GetByIdAsync(id);
        if (contact == null || contact.UserId != userId)
            return ApiResponse<ContactDto>.FailureResponse("جهة الاتصال غير موجودة");

        return ApiResponse<ContactDto>.SuccessResponse(_mapper.Map<ContactDto>(contact));
    }

    public async Task<ApiResponse<ContactWithGroupsDto>> GetByIdWithGroupsAsync(Guid id, Guid userId)
    {
        var contact = await _unitOfWork.Contacts.GetByIdWithGroupsAsync(id);
        if (contact == null || contact.UserId != userId)
            return ApiResponse<ContactWithGroupsDto>.FailureResponse("جهة الاتصال غير موجودة");

        return ApiResponse<ContactWithGroupsDto>.SuccessResponse(_mapper.Map<ContactWithGroupsDto>(contact));
    }

    public async Task<ApiResponse<PagedResult<ContactDto>>> GetUserContactsAsync(Guid userId, PaginationParams pagination)
    {
        // Database-level pagination - يجلب فقط الصفحة المطلوبة من قاعدة البيانات
        var (contacts, totalCount) = await _unitOfWork.Contacts.GetByUserIdPagedAsync(userId, pagination.PageNumber, pagination.PageSize);

        return ApiResponse<PagedResult<ContactDto>>.SuccessResponse(new PagedResult<ContactDto>
        {
            Items = _mapper.Map<List<ContactDto>>(contacts),
            TotalCount = totalCount,
            PageNumber = pagination.PageNumber,
            PageSize = pagination.PageSize
        });
    }

    public async Task<ApiResponse<List<ContactWithGroupsDto>>> GetUserContactsWithGroupsAsync(Guid userId)
    {
        var contacts = await _unitOfWork.Contacts.GetByUserIdWithGroupsAsync(userId);
        return ApiResponse<List<ContactWithGroupsDto>>.SuccessResponse(_mapper.Map<List<ContactWithGroupsDto>>(contacts));
    }

    public async Task<ApiResponse<List<ContactDto>>> SearchAsync(Guid userId, string searchTerm)
    {
        var contacts = await _unitOfWork.Contacts.SearchAsync(userId, searchTerm);
        return ApiResponse<List<ContactDto>>.SuccessResponse(_mapper.Map<List<ContactDto>>(contacts));
    }

    public async Task<ApiResponse<ContactDto>> CreateAsync(Guid userId, CreateContactRequest request)
    {
        if (!string.IsNullOrEmpty(request.Email))
        {
            if (await _unitOfWork.Contacts.ExistsByEmailAndUserIdAsync(request.Email, userId))
                return ApiResponse<ContactDto>.FailureResponse("البريد الإلكتروني مسجل مسبقاً");
        }

        var contact = _mapper.Map<Contact>(request);
        contact.UserId = userId;
        contact.IsActive = true;

        await _unitOfWork.Contacts.AddAsync(contact);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<ContactDto>.SuccessResponse(_mapper.Map<ContactDto>(contact), "تم إنشاء جهة الاتصال بنجاح");
    }

    public async Task<ApiResponse<ContactDto>> UpdateAsync(Guid id, Guid userId, UpdateContactRequest request)
    {
        var contact = await _unitOfWork.Contacts.GetByIdAsync(id);
        if (contact == null || contact.UserId != userId)
            return ApiResponse<ContactDto>.FailureResponse("جهة الاتصال غير موجودة");

        _mapper.Map(request, contact);
        _unitOfWork.Contacts.Update(contact);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<ContactDto>.SuccessResponse(_mapper.Map<ContactDto>(contact), "تم تحديث جهة الاتصال بنجاح");
    }

    public async Task<ApiResponse> DeleteAsync(Guid id, Guid userId)
    {
        var contact = await _unitOfWork.Contacts.GetByIdAsync(id);
        if (contact == null || contact.UserId != userId)
            return ApiResponse.FailureResponse("جهة الاتصال غير موجودة");

        contact.IsActive = false;
        _unitOfWork.Contacts.Update(contact);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse.SuccessResponse("تم حذف جهة الاتصال بنجاح");
    }

    public async Task<ApiResponse<List<ContactDto>>> ImportAsync(Guid userId, List<CreateContactRequest> contacts)
    {
        var createdContacts = new List<Contact>();
        foreach (var request in contacts)
        {
            var contact = _mapper.Map<Contact>(request);
            contact.UserId = userId;
            contact.IsActive = true;
            await _unitOfWork.Contacts.AddAsync(contact);
            createdContacts.Add(contact);
        }

        await _unitOfWork.SaveChangesAsync();
        return ApiResponse<List<ContactDto>>.SuccessResponse(
            _mapper.Map<List<ContactDto>>(createdContacts),
            $"تم استيراد {createdContacts.Count} جهة اتصال بنجاح");
    }
}


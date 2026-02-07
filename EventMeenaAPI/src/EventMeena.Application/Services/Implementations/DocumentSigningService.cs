using AutoMapper;
using EventMeena.Application.DTOs.Common;
using EventMeena.Application.DTOs.DocumentSigning;
using EventMeena.Application.DTOs.Events;
using EventMeena.Application.Interfaces;
using EventMeena.Application.Services.Interfaces;
using EventMeena.Domain.Entities;
using EventMeena.Domain.Enums;
using System.Text.Json;

namespace EventMeena.Application.Services.Implementations;

/// <summary>
/// Document Signing Service Implementation
/// </summary>
public class DocumentSigningService : IDocumentSigningService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public DocumentSigningService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    #region Event Operations

    public async Task<ApiResponse<EventWithSignatureFieldsDto>> CreateDocumentEventAsync(
        Guid userId,
        string documentUrl,
        string documentFileName,
        CreateDocumentEventRequest request)
    {
        try
        {
            await _unitOfWork.BeginTransactionAsync();

            // إنشاء الحدث
            var evt = new Event
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = request.Title,
                Description = request.Description,
                Type = EventType.DocumentSigning,
                Status = EventStatus.Draft,
                DocumentUrl = documentUrl,
                DocumentFileName = documentFileName,
                CoverImage = request.CoverImage,
                ThemeColor = request.ThemeColor,
                Language = request.Language ?? "ar",
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                RequireLogin = request.RequireLogin,
                AllowAnonymous = request.AllowAnonymous,
                MaxResponses = request.MaxResponses,
                AllowMultipleResponses = request.AllowMultipleResponses,
                IsPrivate = request.IsPrivate,
                AllowedEmailsJson = request.AllowedEmails != null
                    ? JsonSerializer.Serialize(request.AllowedEmails)
                    : null,
                AllowDownloadAfterSigning = request.AllowDownloadAfterSigning,
                SendCopyToSigner = request.SendCopyToSigner,
                ThankYouMessage = request.ThankYouMessage,
                ShareCode = GenerateShareCode()
            };

            await _unitOfWork.Events.AddAsync(evt);

            // إضافة حقول التوقيع
            var order = 0;
            foreach (var fieldRequest in request.SignatureFields)
            {
                var field = new SignatureField
                {
                    Id = Guid.NewGuid(),
                    EventId = evt.Id,
                    Label = fieldRequest.Label,
                    PageNumber = fieldRequest.PageNumber,
                    PositionX = fieldRequest.PositionX,
                    PositionY = fieldRequest.PositionY,
                    Width = fieldRequest.Width,
                    Height = fieldRequest.Height,
                    IsRequired = fieldRequest.IsRequired,
                    Order = order++,
                    FieldType = fieldRequest.FieldType,
                    IncludeDate = fieldRequest.IncludeDate,
                    IncludeName = fieldRequest.IncludeName
                };
                await _unitOfWork.SignatureFields.AddAsync(field);
            }

            await _unitOfWork.SaveChangesAsync();
            await _unitOfWork.CommitTransactionAsync();

            return await GetDocumentEventAsync(evt.Id, userId);
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync();
            return ApiResponse<EventWithSignatureFieldsDto>.FailureResponse($"حدث خطأ: {ex.Message}");
        }
    }

    public async Task<ApiResponse<EventWithSignatureFieldsDto>> CreateDocumentEventWithUrlAsync(
        Guid userId,
        CreateDocumentEventWithUrlRequest request)
    {
        try
        {
            await _unitOfWork.BeginTransactionAsync();

            // إنشاء الحدث
            var evt = new Event
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = request.Title,
                Description = request.Description,
                Type = EventType.DocumentSigning,
                Status = EventStatus.Published, // Published مباشرة
                DocumentUrl = request.DocumentUrl,
                DocumentFileName = request.DocumentFileName,
                Language = "ar",
                // إعدادات الوصول
                RequireLogin = request.RequireLogin,
                AllowAnonymous = !request.RequireLogin, // عكس RequireLogin
                IsPrivate = request.IsPrivate,
                AllowedEmailsJson = request.AllowedEmails != null && request.AllowedEmails.Any()
                    ? System.Text.Json.JsonSerializer.Serialize(request.AllowedEmails)
                    : null,
                // إعدادات التوقيع
                AllowDownloadAfterSigning = request.AllowDownloadAfterSigning,
                SendCopyToSigner = request.SendCopyToSigner,
                SignatureDisplayMode = request.SignatureDisplayMode ?? "inside",
                SigningMode = request.SigningMode ?? "single",
                ShareCode = GenerateShareCode()
            };

            await _unitOfWork.Events.AddAsync(evt);

            // إضافة حقول التوقيع
            var order = 0;
            foreach (var fieldRequest in request.SignatureFields)
            {
                var field = new SignatureField
                {
                    Id = Guid.NewGuid(),
                    EventId = evt.Id,
                    Label = fieldRequest.Label,
                    PageNumber = fieldRequest.PageNumber,
                    PositionX = fieldRequest.PositionX,
                    PositionY = fieldRequest.PositionY,
                    Width = fieldRequest.Width,
                    Height = fieldRequest.Height,
                    IsRequired = fieldRequest.IsRequired,
                    Order = fieldRequest.Order > 0 ? fieldRequest.Order : order++,
                    FieldType = fieldRequest.FieldType,
                    IncludeDate = fieldRequest.IncludeDate,
                    IncludeName = fieldRequest.IncludeName,
                    AssignedEmail = fieldRequest.AssignedEmail?.ToLowerInvariant()
                };
                await _unitOfWork.SignatureFields.AddAsync(field);
            }

            await _unitOfWork.SaveChangesAsync();
            await _unitOfWork.CommitTransactionAsync();

            return await GetDocumentEventAsync(evt.Id, userId);
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync();
            return ApiResponse<EventWithSignatureFieldsDto>.FailureResponse($"حدث خطأ: {ex.Message}");
        }
    }

    public async Task<ApiResponse<EventWithSignatureFieldsDto>> UpdateDocumentEventAsync(
        Guid eventId,
        Guid userId,
        UpdateDocumentEventRequest request)
    {
        var evt = await _unitOfWork.Events.GetByIdAsync(eventId);
        if (evt == null || evt.UserId != userId)
            return ApiResponse<EventWithSignatureFieldsDto>.FailureResponse("الحدث غير موجود");

        if (evt.Type != EventType.DocumentSigning)
            return ApiResponse<EventWithSignatureFieldsDto>.FailureResponse("هذا الحدث ليس من نوع توقيع الوثائق");

        try
        {
            await _unitOfWork.BeginTransactionAsync();

            // تحديث الحدث
            evt.Title = request.Title;
            evt.Description = request.Description;
            evt.CoverImage = request.CoverImage;
            evt.ThemeColor = request.ThemeColor;
            evt.Language = request.Language;
            evt.StartDate = request.StartDate;
            evt.EndDate = request.EndDate;
            evt.RequireLogin = request.RequireLogin;
            evt.AllowAnonymous = request.AllowAnonymous;
            evt.MaxResponses = request.MaxResponses;
            evt.AllowMultipleResponses = request.AllowMultipleResponses;
            evt.IsPrivate = request.IsPrivate;
            evt.AllowedEmailsJson = request.AllowedEmails != null
                ? JsonSerializer.Serialize(request.AllowedEmails)
                : null;
            evt.AllowDownloadAfterSigning = request.AllowDownloadAfterSigning;
            evt.SendCopyToSigner = request.SendCopyToSigner;
            evt.ThankYouMessage = request.ThankYouMessage;
            if (!string.IsNullOrEmpty(request.SignatureDisplayMode))
            {
                evt.SignatureDisplayMode = request.SignatureDisplayMode;
            }

            _unitOfWork.Events.Update(evt);

            // حذف حقول التوقيع القديمة وإضافة الجديدة
            await _unitOfWork.SignatureFields.DeleteByEventIdAsync(eventId);
            await _unitOfWork.SaveChangesAsync();

            var order = 0;
            foreach (var fieldRequest in request.SignatureFields)
            {
                var field = new SignatureField
                {
                    Id = fieldRequest.Id != Guid.Empty ? fieldRequest.Id : Guid.NewGuid(),
                    EventId = evt.Id,
                    Label = fieldRequest.Label,
                    PageNumber = fieldRequest.PageNumber,
                    PositionX = fieldRequest.PositionX,
                    PositionY = fieldRequest.PositionY,
                    Width = fieldRequest.Width,
                    Height = fieldRequest.Height,
                    IsRequired = fieldRequest.IsRequired,
                    Order = order++,
                    FieldType = fieldRequest.FieldType,
                    IncludeDate = fieldRequest.IncludeDate,
                    IncludeName = fieldRequest.IncludeName,
                    AssignedEmail = fieldRequest.AssignedEmail?.ToLowerInvariant()
                };
                await _unitOfWork.SignatureFields.AddAsync(field);
            }

            await _unitOfWork.SaveChangesAsync();
            await _unitOfWork.CommitTransactionAsync();

            return await GetDocumentEventAsync(evt.Id, userId);
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync();
            return ApiResponse<EventWithSignatureFieldsDto>.FailureResponse($"حدث خطأ: {ex.Message}");
        }
    }

    public async Task<ApiResponse<EventWithSignatureFieldsDto>> GetDocumentEventAsync(Guid eventId, Guid userId)
    {
        var evt = await _unitOfWork.Events.GetByIdAsync(eventId);
        if (evt == null || evt.UserId != userId)
            return ApiResponse<EventWithSignatureFieldsDto>.FailureResponse("الحدث غير موجود");

        var signatureFields = await _unitOfWork.SignatureFields.GetByEventIdAsync(eventId);

        var dto = _mapper.Map<EventWithSignatureFieldsDto>(evt);
        dto.SignatureFields = _mapper.Map<List<SignatureFieldDto>>(signatureFields);

        return ApiResponse<EventWithSignatureFieldsDto>.SuccessResponse(dto);
    }

    public async Task<ApiResponse<EventWithSignatureFieldsDto>> GetDocumentEventByShareCodeAsync(string shareCode)
    {
        var evt = await _unitOfWork.Events.GetByShareCodeAsync(shareCode);
        if (evt == null)
            return ApiResponse<EventWithSignatureFieldsDto>.FailureResponse("الحدث غير موجود");

        if (evt.Status != EventStatus.Published)
            return ApiResponse<EventWithSignatureFieldsDto>.FailureResponse("الحدث غير متاح حالياً");

        if (evt.Type != EventType.DocumentSigning)
            return ApiResponse<EventWithSignatureFieldsDto>.FailureResponse("هذا الحدث ليس من نوع توقيع الوثائق");

        var signatureFields = await _unitOfWork.SignatureFields.GetByEventIdAsync(evt.Id);

        var dto = _mapper.Map<EventWithSignatureFieldsDto>(evt);
        dto.SignatureFields = _mapper.Map<List<SignatureFieldDto>>(signatureFields);

        return ApiResponse<EventWithSignatureFieldsDto>.SuccessResponse(dto);
    }

    #endregion

    #region Signature Field Operations

    public async Task<ApiResponse<SignatureFieldDto>> AddSignatureFieldAsync(
        Guid eventId,
        Guid userId,
        CreateSignatureFieldRequest request)
    {
        var evt = await _unitOfWork.Events.GetByIdAsync(eventId);
        if (evt == null || evt.UserId != userId)
            return ApiResponse<SignatureFieldDto>.FailureResponse("الحدث غير موجود");

        if (evt.Type != EventType.DocumentSigning)
            return ApiResponse<SignatureFieldDto>.FailureResponse("هذا الحدث ليس من نوع توقيع الوثائق");

        var existingFields = await _unitOfWork.SignatureFields.GetByEventIdAsync(eventId);
        var maxOrder = existingFields.Any() ? existingFields.Max(f => f.Order) : -1;

        var field = new SignatureField
        {
            Id = Guid.NewGuid(),
            EventId = eventId,
            Label = request.Label,
            PageNumber = request.PageNumber,
            PositionX = request.PositionX,
            PositionY = request.PositionY,
            Width = request.Width,
            Height = request.Height,
            IsRequired = request.IsRequired,
            Order = maxOrder + 1,
            FieldType = request.FieldType,
            IncludeDate = request.IncludeDate,
            IncludeName = request.IncludeName
        };

        await _unitOfWork.SignatureFields.AddAsync(field);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<SignatureFieldDto>.SuccessResponse(_mapper.Map<SignatureFieldDto>(field));
    }

    public async Task<ApiResponse<SignatureFieldDto>> UpdateSignatureFieldAsync(
        Guid fieldId,
        Guid userId,
        UpdateSignatureFieldRequest request)
    {
        var field = await _unitOfWork.SignatureFields.GetByIdAsync(fieldId);
        if (field == null)
            return ApiResponse<SignatureFieldDto>.FailureResponse("حقل التوقيع غير موجود");

        var evt = await _unitOfWork.Events.GetByIdAsync(field.EventId);
        if (evt == null || evt.UserId != userId)
            return ApiResponse<SignatureFieldDto>.FailureResponse("غير مصرح لك بتعديل هذا الحقل");

        field.Label = request.Label;
        field.PageNumber = request.PageNumber;
        field.PositionX = request.PositionX;
        field.PositionY = request.PositionY;
        field.Width = request.Width;
        field.Height = request.Height;
        field.IsRequired = request.IsRequired;
        field.FieldType = request.FieldType;
        field.IncludeDate = request.IncludeDate;
        field.IncludeName = request.IncludeName;

        _unitOfWork.SignatureFields.Update(field);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<SignatureFieldDto>.SuccessResponse(_mapper.Map<SignatureFieldDto>(field));
    }

    public async Task<ApiResponse> DeleteSignatureFieldAsync(Guid fieldId, Guid userId)
    {
        var field = await _unitOfWork.SignatureFields.GetByIdAsync(fieldId);
        if (field == null)
            return ApiResponse.FailureResponse("حقل التوقيع غير موجود");

        var evt = await _unitOfWork.Events.GetByIdAsync(field.EventId);
        if (evt == null || evt.UserId != userId)
            return ApiResponse.FailureResponse("غير مصرح لك بحذف هذا الحقل");

        _unitOfWork.SignatureFields.Delete(field);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse.SuccessResponse("تم حذف حقل التوقيع بنجاح");
    }

    public async Task<ApiResponse<List<SignatureFieldDto>>> GetSignatureFieldsAsync(Guid eventId)
    {
        var fields = await _unitOfWork.SignatureFields.GetByEventIdAsync(eventId);
        return ApiResponse<List<SignatureFieldDto>>.SuccessResponse(
            _mapper.Map<List<SignatureFieldDto>>(fields));
    }

    #endregion

    #region Signature Operations

    public async Task<ApiResponse<DocumentSignatureDto>> SubmitSignatureAsync(
        Guid responseId,
        SubmitSignatureRequest request,
        string? ipAddress,
        string? userAgent)
    {
        var response = await _unitOfWork.Responses.GetByIdAsync(responseId);
        if (response == null)
            return ApiResponse<DocumentSignatureDto>.FailureResponse("الرد غير موجود");

        var field = await _unitOfWork.SignatureFields.GetByIdAsync(request.SignatureFieldId);
        if (field == null)
            return ApiResponse<DocumentSignatureDto>.FailureResponse("حقل التوقيع غير موجود");

        // التحقق من عدم وجود توقيع سابق
        var exists = await _unitOfWork.DocumentSignatures.ExistsAsync(request.SignatureFieldId, responseId);
        if (exists)
            return ApiResponse<DocumentSignatureDto>.FailureResponse("تم التوقيع على هذا الحقل مسبقاً");

        var signature = new DocumentSignature
        {
            Id = Guid.NewGuid(),
            SignatureFieldId = request.SignatureFieldId,
            ResponseId = responseId,
            SignerName = request.SignerName,
            SignerEmail = request.SignerEmail,
            SignerPhone = request.SignerPhone,
            SignatureData = request.SignatureData,
            SignedAt = DateTime.UtcNow,
            IpAddress = ipAddress,
            UserAgent = userAgent
        };

        await _unitOfWork.DocumentSignatures.AddAsync(signature);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<DocumentSignatureDto>.SuccessResponse(_mapper.Map<DocumentSignatureDto>(signature));
    }

    public async Task<ApiResponse<List<DocumentSignatureDto>>> SubmitAllSignaturesAsync(
        SubmitAllSignaturesRequest request,
        string? ipAddress,
        string? userAgent)
    {
        try
        {
            await _unitOfWork.BeginTransactionAsync();

            // التحقق من وجود الحدث
            var evt = await _unitOfWork.Events.GetByIdAsync(request.EventId);
            if (evt == null)
                return ApiResponse<List<DocumentSignatureDto>>.FailureResponse("الحدث غير موجود");

            // إنشاء Response جديد إذا لم يكن موجوداً
            var responseId = request.ResponseId;
            if (responseId == Guid.Empty)
            {
                responseId = Guid.NewGuid();
                var response = new Response
                {
                    Id = responseId,
                    EventId = request.EventId,
                    RespondentName = request.SignerName,
                    RespondentEmail = request.SignerEmail,
                    RespondentIp = ipAddress,
                    UserAgent = userAgent,
                    Status = ResponseStatus.Completed,
                    StartedAt = DateTime.UtcNow,
                    CompletedAt = DateTime.UtcNow
                };
                await _unitOfWork.Responses.AddAsync(response);
            }

            var signatures = new List<DocumentSignature>();

            foreach (var sig in request.Signatures)
            {
                var field = await _unitOfWork.SignatureFields.GetByIdAsync(sig.SignatureFieldId);
                if (field == null)
                    continue;

                var exists = await _unitOfWork.DocumentSignatures.ExistsAsync(sig.SignatureFieldId, responseId);
                if (exists)
                    continue;

                var signature = new DocumentSignature
                {
                    Id = Guid.NewGuid(),
                    SignatureFieldId = sig.SignatureFieldId,
                    ResponseId = responseId,
                    SignerName = request.SignerName,
                    SignerEmail = request.SignerEmail,
                    SignerPhone = request.SignerPhone,
                    SignatureData = sig.SignatureData,
                    SignedAt = DateTime.UtcNow,
                    IpAddress = ipAddress,
                    UserAgent = userAgent
                };

                await _unitOfWork.DocumentSignatures.AddAsync(signature);
                signatures.Add(signature);
            }

            await _unitOfWork.SaveChangesAsync();
            await _unitOfWork.CommitTransactionAsync();

            return ApiResponse<List<DocumentSignatureDto>>.SuccessResponse(
                _mapper.Map<List<DocumentSignatureDto>>(signatures));
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync();
            return ApiResponse<List<DocumentSignatureDto>>.FailureResponse($"حدث خطأ: {ex.Message}");
        }
    }

    public async Task<ApiResponse<List<DocumentSignatureDto>>> GetEventSignaturesAsync(Guid eventId, Guid userId)
    {
        var evt = await _unitOfWork.Events.GetByIdAsync(eventId);
        if (evt == null || evt.UserId != userId)
            return ApiResponse<List<DocumentSignatureDto>>.FailureResponse("الحدث غير موجود");

        var signatures = await _unitOfWork.DocumentSignatures.GetByEventIdWithFieldInfoAsync(eventId);
        return ApiResponse<List<DocumentSignatureDto>>.SuccessResponse(
            _mapper.Map<List<DocumentSignatureDto>>(signatures));
    }

    public async Task<ApiResponse<List<DocumentSignatureDto>>> GetResponseSignaturesAsync(Guid responseId)
    {
        var signatures = await _unitOfWork.DocumentSignatures.GetByResponseIdAsync(responseId);
        return ApiResponse<List<DocumentSignatureDto>>.SuccessResponse(
            _mapper.Map<List<DocumentSignatureDto>>(signatures));
    }

    #endregion

    #region PDF Operations

    public async Task<ApiResponse> UpdateDocumentUrlAsync(Guid eventId, Guid userId, string documentUrl, string fileName)
    {
        var evt = await _unitOfWork.Events.GetByIdAsync(eventId);
        if (evt == null || evt.UserId != userId)
            return ApiResponse.FailureResponse("الحدث غير موجود");

        if (evt.Type != EventType.DocumentSigning)
            return ApiResponse.FailureResponse("هذا الحدث ليس من نوع توقيع الوثائق");

        evt.DocumentUrl = documentUrl;
        evt.DocumentFileName = fileName;

        _unitOfWork.Events.Update(evt);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse.SuccessResponse("تم تحديث الوثيقة بنجاح");
    }

    #endregion

    #region Private Methods

    private static string GenerateShareCode()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, 8)
            .Select(s => s[random.Next(s.Length)]).ToArray());
    }

    #endregion
}
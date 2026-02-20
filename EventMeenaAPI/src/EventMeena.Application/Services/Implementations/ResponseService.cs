using AutoMapper;
using EventMeena.Application.DTOs.Common;
using EventMeena.Application.DTOs.Responses;
using EventMeena.Application.Interfaces;
using EventMeena.Application.Services.Interfaces;
using EventMeena.Domain.Entities;
using EventMeena.Domain.Enums;

namespace EventMeena.Application.Services.Implementations;

/// <summary>
/// Response service implementation
/// </summary>
public class ResponseService : IResponseService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public ResponseService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<ApiResponse<ResponseDto>> GetByIdAsync(Guid id, Guid userId)
    {
        var response = await _unitOfWork.Responses.GetByIdAsync(id);
        if (response == null)
            return ApiResponse<ResponseDto>.FailureResponse("الاستجابة غير موجودة");

        var evt = await _unitOfWork.Events.GetByIdAsync(response.EventId);
        if (evt == null || evt.UserId != userId)
            return ApiResponse<ResponseDto>.FailureResponse("غير مصرح");

        return ApiResponse<ResponseDto>.SuccessResponse(_mapper.Map<ResponseDto>(response));
    }

    public async Task<ApiResponse<PagedResult<ResponseDto>>> GetByEventIdAsync(Guid eventId, Guid userId, PaginationParams pagination)
    {
        var evt = await _unitOfWork.Events.GetByIdAsync(eventId);
        if (evt == null || evt.UserId != userId)
            return ApiResponse<PagedResult<ResponseDto>>.FailureResponse("الحدث غير موجود");

        // Database-level pagination - يجلب فقط الصفحة المطلوبة من قاعدة البيانات
        var (responses, totalCount) = await _unitOfWork.Responses.GetByEventIdPagedAsync(eventId, pagination.PageNumber, pagination.PageSize);

        return ApiResponse<PagedResult<ResponseDto>>.SuccessResponse(new PagedResult<ResponseDto>
        {
            Items = _mapper.Map<List<ResponseDto>>(responses),
            TotalCount = totalCount,
            PageNumber = pagination.PageNumber,
            PageSize = pagination.PageSize
        });
    }

    public async Task<ApiResponse<ResponseStatsDto>> GetEventStatsAsync(Guid eventId, Guid userId)
    {
        var evt = await _unitOfWork.Events.GetByIdAsync(eventId);
        if (evt == null || evt.UserId != userId)
            return ApiResponse<ResponseStatsDto>.FailureResponse("الحدث غير موجود");

        var stats = await _unitOfWork.Responses.GetEventStatsAsync(eventId);
        return ApiResponse<ResponseStatsDto>.SuccessResponse(stats);
    }

    public async Task<ApiResponse<ResponseDto>> StartResponseAsync(Guid eventId, StartResponseRequest request, string? ipAddress, string? userAgent)
    {
        var evt = await _unitOfWork.Events.GetByIdAsync(eventId);
        if (evt == null || evt.Status != EventStatus.Published)
            return ApiResponse<ResponseDto>.FailureResponse("الحدث غير متاح");

        // التحقق من AllowMultipleResponses
        if (!evt.AllowMultipleResponses)
        {
            // التحقق بالإيميل أولاً (أكثر دقة)
            if (!string.IsNullOrEmpty(request.RespondentEmail))
            {
                var existingByEmail = await _unitOfWork.Responses.GetCompletedByEventIdAndEmailAsync(eventId, request.RespondentEmail);
                if (existingByEmail != null)
                {
                    return ApiResponse<ResponseDto>.FailureResponse("لقد قمت بالمشاركة في هذا الحدث مسبقاً");
                }
            }
            // التحقق بالـ IP كخيار احتياطي (فقط إذا لم يكن هناك إيميل)
            else if (!string.IsNullOrEmpty(ipAddress))
            {
                var existingByIp = await _unitOfWork.Responses.GetCompletedByEventIdAndIpAsync(eventId, ipAddress);
                if (existingByIp != null)
                {
                    return ApiResponse<ResponseDto>.FailureResponse("لقد قمت بالمشاركة في هذا الحدث مسبقاً من هذا الجهاز");
                }
            }
        }

        var response = new Response
        {
            EventId = eventId,
            RespondentName = request.RespondentName,
            RespondentEmail = request.RespondentEmail,
            RespondentPhone = request.RespondentPhone,
            Status = ResponseStatus.InProgress,
            StartedAt = DateTime.UtcNow,
            RespondentIp = ipAddress,
            UserAgent = userAgent
        };

        await _unitOfWork.Responses.AddAsync(response);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<ResponseDto>.SuccessResponse(_mapper.Map<ResponseDto>(response), "تم بدء الاستجابة");
    }

    public async Task<ApiResponse<ResponseDto>> SubmitSectionAnswersAsync(Guid responseId, SubmitSectionAnswersRequest request)
    {
        var response = await _unitOfWork.Responses.GetByIdAsync(responseId);
        if (response == null || response.Status != ResponseStatus.InProgress)
            return ApiResponse<ResponseDto>.FailureResponse("الاستجابة غير صالحة");

        // Merge answers - parse existing JSON and add new answers
        var existingAnswers = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, System.Text.Json.JsonElement>>(response.AnswersJson)
            ?? new Dictionary<string, System.Text.Json.JsonElement>();
        foreach (var answer in request.Answers)
        {
            // Parse the AnswerJson string to JsonElement to avoid double-encoding
            var answerElement = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(answer.AnswerJson);
            existingAnswers[answer.ComponentId.ToString()] = answerElement;
        }
        response.AnswersJson = System.Text.Json.JsonSerializer.Serialize(existingAnswers);
        response.CurrentSectionIndex = request.SectionIndex;

        _unitOfWork.Responses.Update(response);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<ResponseDto>.SuccessResponse(_mapper.Map<ResponseDto>(response));
    }

    public async Task<ApiResponse<ResponseDto>> CompleteResponseAsync(Guid responseId, CompleteResponseRequest request)
    {
        var response = await _unitOfWork.Responses.GetByIdAsync(responseId);
        if (response == null || response.Status != ResponseStatus.InProgress)
            return ApiResponse<ResponseDto>.FailureResponse("الاستجابة غير صالحة");



        // Add final answers if provided
        if (request.FinalAnswers != null && request.FinalAnswers.Any())
        {
            var existingAnswers = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, System.Text.Json.JsonElement>>(response.AnswersJson)
                ?? new Dictionary<string, System.Text.Json.JsonElement>();
            foreach (var answer in request.FinalAnswers)
            {
                // Parse the AnswerJson string to JsonElement to avoid double-encoding
                var answerElement = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(answer.AnswerJson);
                existingAnswers[answer.ComponentId.ToString()] = answerElement;
            }
            response.AnswersJson = System.Text.Json.JsonSerializer.Serialize(existingAnswers);
        }

        response.Status = ResponseStatus.Completed;
        response.CompletedAt = DateTime.UtcNow;
        response.DurationSeconds = (int)(DateTime.UtcNow - response.StartedAt).TotalSeconds;

        _unitOfWork.Responses.Update(response);
        await _unitOfWork.SaveChangesAsync();

        // زيادة عداد الردود في الحدث (بعد حفظ الرد بنجاح)
        await _unitOfWork.Events.IncrementResponseCountAsync(response.EventId);

        return ApiResponse<ResponseDto>.SuccessResponse(_mapper.Map<ResponseDto>(response), "تم إكمال الاستجابة بنجاح");
    }

    public async Task<ApiResponse> DeleteAsync(Guid id, Guid userId)
    {
        var response = await _unitOfWork.Responses.GetByIdAsync(id);
        if (response == null)
            return ApiResponse.FailureResponse("الاستجابة غير موجودة");

        var evt = await _unitOfWork.Events.GetByIdAsync(response.EventId);
        if (evt == null || evt.UserId != userId)
            return ApiResponse.FailureResponse("غير مصرح");

        _unitOfWork.Responses.Delete(response);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse.SuccessResponse("تم حذف الاستجابة بنجاح");
    }

    public async Task<ApiResponse> DeleteByEventIdAsync(Guid eventId, Guid userId)
    {
        var evt = await _unitOfWork.Events.GetByIdAsync(eventId);
        if (evt == null || evt.UserId != userId)
            return ApiResponse.FailureResponse("الحدث غير موجود");

        await _unitOfWork.Responses.DeleteByEventIdAsync(eventId);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse.SuccessResponse("تم حذف جميع الاستجابات بنجاح");
    }

    public async Task<ApiResponse<ResponseDto?>> GetExistingResponseAsync(Guid eventId, string? email, string? ipAddress)
    {
        var evt = await _unitOfWork.Events.GetByIdAsync(eventId);
        if (evt == null || evt.Status != EventStatus.Published)
            return ApiResponse<ResponseDto?>.FailureResponse("الحدث غير متاح");

        Response? existingResponse = null;

        // البحث بالإيميل أولاً (أكثر دقة)
        if (!string.IsNullOrEmpty(email))
        {
            existingResponse = await _unitOfWork.Responses.GetCompletedByEventIdAndEmailAsync(eventId, email);
        }
        // البحث بالـ IP كخيار احتياطي
        else if (!string.IsNullOrEmpty(ipAddress))
        {
            existingResponse = await _unitOfWork.Responses.GetCompletedByEventIdAndIpAsync(eventId, ipAddress);
        }

        if (existingResponse == null)
        {
            return ApiResponse<ResponseDto?>.SuccessResponse(null, "لا يوجد رد سابق");
        }

        return ApiResponse<ResponseDto?>.SuccessResponse(_mapper.Map<ResponseDto>(existingResponse));
    }

    public async Task<ApiResponse<ResponseDto>> UpdateResponseAnswersAsync(Guid responseId, UpdateResponseAnswersRequest request)
    {
        var response = await _unitOfWork.Responses.GetByIdAsync(responseId);
        if (response == null)
            return ApiResponse<ResponseDto>.FailureResponse("الرد غير موجود");

        var evt = await _unitOfWork.Events.GetByIdAsync(response.EventId);
        if (evt == null || evt.Status != EventStatus.Published)
            return ApiResponse<ResponseDto>.FailureResponse("الحدث غير متاح");

        // التحقق من أن الحدث يسمح بالتعديل
        if (!evt.AllowEditResponses)
            return ApiResponse<ResponseDto>.FailureResponse("هذا الحدث لا يسمح بتعديل الردود");

        // تحديث الإجابات (مخزنة كـ JSON)
        var existingAnswers = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, System.Text.Json.JsonElement>>(response.AnswersJson)
            ?? new Dictionary<string, System.Text.Json.JsonElement>();

        foreach (var answerRequest in request.Answers)
        {
            var answerElement = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(answerRequest.AnswerJson);
            existingAnswers[answerRequest.ComponentId.ToString()] = answerElement;
        }

        response.AnswersJson = System.Text.Json.JsonSerializer.Serialize(existingAnswers);
        response.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<ResponseDto>.SuccessResponse(_mapper.Map<ResponseDto>(response), "تم تحديث الرد بنجاح");
    }

    public async Task<ApiResponse<List<ParticipationDto>>> GetMyParticipationsAsync(string email)
    {
        if (string.IsNullOrEmpty(email))
            return ApiResponse<List<ParticipationDto>>.FailureResponse("البريد الإلكتروني مطلوب");

        var responses = await _unitOfWork.Responses.GetByRespondentEmailWithEventAsync(email);

        var participations = responses.Select(r => new ParticipationDto
        {
            ResponseId = r.Id,
            EventId = r.EventId,
            EventTitle = r.Event.Title,
            EventDescription = r.Event.Description,
            EventType = r.Event.Type,
            OwnerName = r.Event.User?.FullName ?? "غير معروف",
            ParticipatedAt = r.StartedAt,
            CompletedAt = r.CompletedAt,
            DurationSeconds = r.DurationSeconds,
            Status = r.Status,
            Score = r.Score,
            TotalPoints = r.TotalPoints,
            Percentage = r.Percentage,
            IsPassed = r.IsPassed,
            AnswersJson = r.AnswersJson
        }).ToList();

        return ApiResponse<List<ParticipationDto>>.SuccessResponse(participations);
    }

    public async Task<ApiResponse<ParticipationDetailsDto>> GetParticipationDetailsAsync(Guid responseId, string email)
    {
        if (string.IsNullOrEmpty(email))
            return ApiResponse<ParticipationDetailsDto>.FailureResponse("البريد الإلكتروني مطلوب");

        // Direct query by ID with full event details (Sections + Components)
        var response = await _unitOfWork.Responses.GetByIdWithEventDetailsAsync(responseId);

        if (response == null || response.RespondentEmail != email || response.Status != Domain.Enums.ResponseStatus.Completed)
            return ApiResponse<ParticipationDetailsDto>.FailureResponse("المشاركة غير موجودة أو لا تملك صلاحية الوصول");

        var details = new ParticipationDetailsDto
        {
            ResponseId = response.Id,
            EventId = response.EventId,
            EventTitle = response.Event.Title,
            EventDescription = response.Event.Description,
            EventType = response.Event.Type,
            OwnerName = response.Event.User?.FullName ?? "غير معروف",
            ParticipatedAt = response.StartedAt,
            CompletedAt = response.CompletedAt,
            DurationSeconds = response.DurationSeconds,
            Status = response.Status,
            Score = response.Score,
            TotalPoints = response.TotalPoints,
            Percentage = response.Percentage,
            IsPassed = response.IsPassed,
            AnswersJson = response.AnswersJson,
            Sections = response.Event.Sections
                .OrderBy(s => s.Order)
                .Select(s => new ParticipationSectionDto
                {
                    Id = s.Id,
                    Title = s.Title,
                    Description = s.Description,
                    Order = s.Order,
                    Components = s.Components
                        .OrderBy(c => c.Order)
                        .Select(c => new ParticipationComponentDto
                        {
                            Id = c.Id,
                            Type = c.Type,
                            Order = c.Order,
                            SettingsJson = BuildComponentSettingsJson(c)
                        }).ToList()
                }).ToList()
        };

        return ApiResponse<ParticipationDetailsDto>.SuccessResponse(details);
    }

    /// <summary>
    /// بناء JSON للإعدادات من خصائص المكون
    /// </summary>
    private static string BuildComponentSettingsJson(Domain.Entities.Component c)
    {
        var settings = new Dictionary<string, object?>
        {
            ["label"] = c.Title,
            ["description"] = c.Description,
            ["placeholder"] = c.Placeholder,
            ["required"] = c.IsRequired,
            ["isVisible"] = c.IsVisible,
            ["minValue"] = c.MinValue,
            ["maxValue"] = c.MaxValue,
            ["minLabel"] = c.MinLabel,
            ["maxLabel"] = c.MaxLabel,
            ["points"] = c.Points,
            ["explanation"] = c.Explanation,
            ["mediaUrl"] = c.MediaUrl,
            ["mediaType"] = c.MediaType
        };

        // إضافة الخيارات إن وجدت
        if (!string.IsNullOrEmpty(c.OptionsJson))
        {
            try
            {
                var options = System.Text.Json.JsonSerializer.Deserialize<object>(c.OptionsJson);
                settings["choices"] = options;
            }
            catch { }
        }

        // إضافة الإجابة الصحيحة إن وجدت
        if (!string.IsNullOrEmpty(c.CorrectAnswerJson))
        {
            try
            {
                var correctAnswer = System.Text.Json.JsonSerializer.Deserialize<object>(c.CorrectAnswerJson);
                settings["correctAnswer"] = correctAnswer;
            }
            catch { }
        }

        // إزالة القيم الفارغة
        var filteredSettings = settings
            .Where(kv => kv.Value != null)
            .ToDictionary(kv => kv.Key, kv => kv.Value);

        return System.Text.Json.JsonSerializer.Serialize(filteredSettings);
    }
}


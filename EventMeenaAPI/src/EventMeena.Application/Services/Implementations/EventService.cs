using AutoMapper;
using EventMeena.Application.DTOs.Common;
using EventMeena.Application.DTOs.Events;
using EventMeena.Application.Interfaces;
using EventMeena.Application.Services.Interfaces;
using EventMeena.Domain.Entities;
using EventMeena.Domain.Enums;

namespace EventMeena.Application.Services.Implementations;

/// <summary>
/// Event service implementation
/// </summary>
public class EventService : IEventService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public EventService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<ApiResponse<EventDto>> GetByIdAsync(Guid id, Guid userId)
    {
        var evt = await _unitOfWork.Events.GetByIdAsync(id);
        if (evt == null)
            return ApiResponse<EventDto>.FailureResponse("الحدث غير موجود");

        // التحقق: المالك أو متعاون (أي صلاحية)
        if (evt.UserId != userId && !await HasMinimumRoleAsync(id, userId, CollaboratorRole.Viewer))
            return ApiResponse<EventDto>.FailureResponse("الحدث غير موجود");

        return ApiResponse<EventDto>.SuccessResponse(_mapper.Map<EventDto>(evt));
    }

    public async Task<ApiResponse<EventWithFullDetailsDto>> GetByIdWithFullDetailsAsync(Guid id, Guid userId)
    {
        var evt = await _unitOfWork.Events.GetByIdWithFullDetailsAsync(id);
        if (evt == null)
            return ApiResponse<EventWithFullDetailsDto>.FailureResponse("الحدث غير موجود");

        // التحقق: المالك أو متعاون (أي صلاحية)
        if (evt.UserId != userId && !await HasMinimumRoleAsync(id, userId, CollaboratorRole.Viewer))
            return ApiResponse<EventWithFullDetailsDto>.FailureResponse("الحدث غير موجود");

        return ApiResponse<EventWithFullDetailsDto>.SuccessResponse(_mapper.Map<EventWithFullDetailsDto>(evt));
    }

    public async Task<ApiResponse<EventWithFullDetailsDto>> GetByShareCodeAsync(string shareCode)
    {
        var evt = await _unitOfWork.Events.GetByShareCodeAsync(shareCode);
        if (evt == null)
            return ApiResponse<EventWithFullDetailsDto>.FailureResponse("الحدث غير موجود");

        if (evt.Status != EventStatus.Published)
            return ApiResponse<EventWithFullDetailsDto>.FailureResponse("الحدث غير متاح حالياً");

        return ApiResponse<EventWithFullDetailsDto>.SuccessResponse(_mapper.Map<EventWithFullDetailsDto>(evt));
    }

    public async Task<ApiResponse<EventWithFullDetailsDto>> GetForPreviewAsync(Guid id)
    {
        // جلب الحدث مع كامل التفاصيل بدون التحقق من الحالة (للمعاينة فقط)
        var evt = await _unitOfWork.Events.GetByIdWithFullDetailsAsync(id);
        if (evt == null)
            return ApiResponse<EventWithFullDetailsDto>.FailureResponse("الحدث غير موجود");

        return ApiResponse<EventWithFullDetailsDto>.SuccessResponse(_mapper.Map<EventWithFullDetailsDto>(evt));
    }

    public async Task<ApiResponse<PagedResult<EventListItemDto>>> GetUserEventsAsync(Guid userId, PaginationParams pagination)
    {
        // Database-level pagination - يجلب فقط الصفحة المطلوبة من قاعدة البيانات
        var (events, totalCount) = await _unitOfWork.Events.GetByUserIdPagedAsync(userId, pagination.PageNumber, pagination.PageSize);

        // جلب عدد الردود المكتملة بـ COUNT خفيف بدل تحميل كل الـ Responses
        var eventIds = events.Select(e => e.Id).ToList();
        var completedCounts = await _unitOfWork.Responses.GetBulkCompletedCountsAsync(eventIds);

        var dtos = _mapper.Map<List<EventListItemDto>>(events);
        foreach (var dto in dtos)
        {
            if (completedCounts.TryGetValue(dto.Id, out var count))
                dto.CompletedResponseCount = count;
        }

        return ApiResponse<PagedResult<EventListItemDto>>.SuccessResponse(new PagedResult<EventListItemDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            PageNumber = pagination.PageNumber,
            PageSize = pagination.PageSize
        });
    }

    public async Task<ApiResponse<List<EventListItemDto>>> GetUserEventsByStatusAsync(Guid userId, EventStatus status)
    {
        var events = await _unitOfWork.Events.GetByUserIdAndStatusWithCountsAsync(userId, status);

        var eventIds = events.Select(e => e.Id).ToList();
        var completedCounts = await _unitOfWork.Responses.GetBulkCompletedCountsAsync(eventIds);

        var dtos = _mapper.Map<List<EventListItemDto>>(events);
        foreach (var dto in dtos)
        {
            if (completedCounts.TryGetValue(dto.Id, out var count))
                dto.CompletedResponseCount = count;
        }

        return ApiResponse<List<EventListItemDto>>.SuccessResponse(dtos);
    }

    public async Task<ApiResponse<List<EventListItemDto>>> GetUserEventsByTypeAsync(Guid userId, EventType type)
    {
        var events = await _unitOfWork.Events.GetByUserIdAndTypeWithCountsAsync(userId, type);

        var eventIds = events.Select(e => e.Id).ToList();
        var completedCounts = await _unitOfWork.Responses.GetBulkCompletedCountsAsync(eventIds);

        var dtos = _mapper.Map<List<EventListItemDto>>(events);
        foreach (var dto in dtos)
        {
            if (completedCounts.TryGetValue(dto.Id, out var count))
                dto.CompletedResponseCount = count;
        }

        return ApiResponse<List<EventListItemDto>>.SuccessResponse(dtos);
    }

    public async Task<ApiResponse<EventDto>> CreateAsync(Guid userId, CreateEventRequest request)
    {
        var evt = _mapper.Map<Event>(request);
        evt.UserId = userId;
        evt.Status = EventStatus.Published; // نشط فوراً عند الإنشاء
        evt.ShareCode = await GenerateUniqueShareCode();

        await _unitOfWork.Events.AddAsync(evt);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<EventDto>.SuccessResponse(_mapper.Map<EventDto>(evt), "تم إنشاء الحدث بنجاح");
    }

    /// <summary>
    /// إنشاء حدث كامل مع أقسامه ومكوناته في طلب واحد
    /// محسّن: يستخدم SaveChanges واحد + Transaction للأداء الأفضل
    /// </summary>
    public async Task<ApiResponse<EventWithFullDetailsDto>> CreateWithSectionsAsync(Guid userId, CreateEventWithSectionsRequest request)
    {
        // توليد ShareCode قبل البدء
        var shareCode = await GenerateUniqueShareCode();

        Event? evt = null;

        await _unitOfWork.ExecuteInTransactionAsync(async () =>
        {
            // إنشاء الحدث
            evt = new Event
            {
                Title = request.Title,
                Description = request.Description,
                Type = request.Type,
                Status = request.Status ?? EventStatus.Published,
                UserId = userId,
                ShareCode = shareCode,
                CoverImage = request.CoverImage,
                ThemeColor = request.ThemeColor,
                Language = request.Language ?? "ar",
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                TimeLimitMinutes = request.TimeLimitMinutes,
                RequireLogin = request.RequireLogin,
                AllowAnonymous = request.AllowAnonymous,
                MaxResponses = request.MaxResponses,
                AllowMultipleResponses = request.AllowMultipleResponses,
                AllowEditResponses = request.AllowEditResponses,
                ShowResults = request.ShowResults,
                ShowCorrectAnswers = request.ShowCorrectAnswers,
                ShuffleQuestions = request.ShuffleQuestions,
                ShuffleOptions = request.ShuffleOptions,
                PassingScore = request.PassingScore,
                ThankYouMessage = request.ThankYouMessage,
                SuccessMessage = request.SuccessMessage,
                GoodMessage = request.GoodMessage,
                ImprovementMessage = request.ImprovementMessage,
                IsPrivate = request.IsPrivate,
                AllowedEmailsJson = request.AllowedEmails != null && request.AllowedEmails.Count > 0
                    ? System.Text.Json.JsonSerializer.Serialize(request.AllowedEmails)
                    : null,
                // إعدادات المسابقة
                CompetitionMode = request.CompetitionMode,
                WinnersCount = request.WinnersCount,
                QualifyingScore = request.QualifyingScore
            };

            // إنشاء الأقسام والمكونات باستخدام Navigation Properties
            // EF Core سيربط الـ IDs تلقائياً عند الحفظ
            if (request.Sections != null && request.Sections.Count > 0)
            {
                foreach (var sectionReq in request.Sections)
                {
                    var section = new Section
                    {
                        Title = sectionReq.Title,
                        Description = sectionReq.Description,
                        Order = sectionReq.Order,
                        IsVisible = sectionReq.IsVisible
                    };

                    // إنشاء المكونات وربطها بالقسم
                    if (sectionReq.Components != null && sectionReq.Components.Count > 0)
                    {
                        foreach (var compReq in sectionReq.Components)
                        {
                            var component = _mapper.Map<Component>(compReq);
                            section.Components.Add(component);
                        }
                    }

                    // ربط القسم بالحدث
                    evt.Sections.Add(section);
                }
            }

            // حفظ كل شيء مرة واحدة
            await _unitOfWork.Events.AddAsync(evt);
            await _unitOfWork.SaveChangesAsync();
        });

        // الـ evt object يحتوي على كل البيانات بعد SaveChanges (EF Core ملأ الـ IDs)
        // لا حاجة لـ re-fetch من قاعدة البيانات
        return ApiResponse<EventWithFullDetailsDto>.SuccessResponse(
            _mapper.Map<EventWithFullDetailsDto>(evt!),
            "تم إنشاء الحدث بنجاح");
    }

    public async Task<ApiResponse<EventDto>> UpdateAsync(Guid id, Guid userId, UpdateEventRequest request)
    {
        var evt = await _unitOfWork.Events.GetByIdAsync(id);
        if (evt == null)
            return ApiResponse<EventDto>.FailureResponse("الحدث غير موجود");

        // التحقق: المالك أو متعاون بصلاحية محرر على الأقل
        if (evt.UserId != userId && !await HasMinimumRoleAsync(id, userId, CollaboratorRole.Editor))
            return ApiResponse<EventDto>.FailureResponse("غير مصرح لك بتعديل هذا الحدث");

        _mapper.Map(request, evt);
        _unitOfWork.Events.Update(evt);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<EventDto>.SuccessResponse(_mapper.Map<EventDto>(evt), "تم تحديث الحدث بنجاح");
    }

    /// <summary>
    /// تحديث حدث كامل مع أقسامه ومكوناته في طلب واحد
    /// </summary>
    public async Task<ApiResponse<EventWithFullDetailsDto>> UpdateWithSectionsAsync(Guid id, Guid userId, UpdateEventWithSectionsRequest request)
    {
        // جلب الحدث مع الأقسام والمكونات
        var evt = await _unitOfWork.Events.GetByIdWithFullDetailsAsync(id);
        if (evt == null)
            return ApiResponse<EventWithFullDetailsDto>.FailureResponse("الحدث غير موجود");

        // التحقق: المالك أو متعاون بصلاحية محرر على الأقل
        if (evt.UserId != userId && !await HasMinimumRoleAsync(id, userId, CollaboratorRole.Editor))
            return ApiResponse<EventWithFullDetailsDto>.FailureResponse("غير مصرح لك بتعديل هذا الحدث");

        // تحديث بيانات الحدث الأساسية
        if (request.Title != null) evt.Title = request.Title;
        if (request.Description != null) evt.Description = request.Description;
        if (request.Type.HasValue) evt.Type = request.Type.Value;
        if (request.Status.HasValue) evt.Status = request.Status.Value;  // تحديث حالة الحدث
        if (request.CoverImage != null) evt.CoverImage = request.CoverImage;
        if (request.ThemeColor != null) evt.ThemeColor = request.ThemeColor;
        if (request.Language != null) evt.Language = request.Language;
        if (request.StartDate.HasValue) evt.StartDate = request.StartDate;
        if (request.EndDate.HasValue) evt.EndDate = request.EndDate;
        if (request.TimeLimitMinutes.HasValue) evt.TimeLimitMinutes = request.TimeLimitMinutes;
        if (request.RequireLogin.HasValue) evt.RequireLogin = request.RequireLogin.Value;
        if (request.AllowAnonymous.HasValue) evt.AllowAnonymous = request.AllowAnonymous.Value;
        if (request.MaxResponses.HasValue) evt.MaxResponses = request.MaxResponses;
        if (request.AllowMultipleResponses.HasValue) evt.AllowMultipleResponses = request.AllowMultipleResponses.Value;
        if (request.AllowEditResponses.HasValue) evt.AllowEditResponses = request.AllowEditResponses.Value;
        if (request.ShowResults.HasValue) evt.ShowResults = request.ShowResults.Value;
        if (request.ShowCorrectAnswers.HasValue) evt.ShowCorrectAnswers = request.ShowCorrectAnswers.Value;
        if (request.ShuffleQuestions.HasValue) evt.ShuffleQuestions = request.ShuffleQuestions.Value;
        if (request.ShuffleOptions.HasValue) evt.ShuffleOptions = request.ShuffleOptions.Value;
        if (request.PassingScore.HasValue) evt.PassingScore = request.PassingScore;
        if (request.ThankYouMessage != null) evt.ThankYouMessage = request.ThankYouMessage;
        if (request.SuccessMessage != null) evt.SuccessMessage = request.SuccessMessage;
        if (request.GoodMessage != null) evt.GoodMessage = request.GoodMessage;
        if (request.ImprovementMessage != null) evt.ImprovementMessage = request.ImprovementMessage;

        // إعدادات الحدث الخاص
        if (request.IsPrivate.HasValue) evt.IsPrivate = request.IsPrivate.Value;
        if (request.AllowedEmails != null)
        {
            evt.AllowedEmailsJson = request.AllowedEmails.Count > 0
                ? System.Text.Json.JsonSerializer.Serialize(request.AllowedEmails)
                : null;
        }

        _unitOfWork.Events.Update(evt);

        // تحديث الأقسام والمكونات
        if (request.Sections != null)
        {
            // حذف الأقسام والمكونات القديمة (نستخدم الأقسام المحمّلة مع الحدث بدل query جديد)
            foreach (var section in evt.Sections.ToList())
            {
                foreach (var component in section.Components.ToList())
                {
                    _unitOfWork.Components.Delete(component);
                }
                _unitOfWork.Sections.Delete(section);
            }

            // إنشاء الأقسام والمكونات الجديدة باستخدام Navigation Properties
            // EF Core سيربط الـ IDs تلقائياً عند الحفظ
            foreach (var sectionReq in request.Sections)
            {
                var section = new Section
                {
                    Title = sectionReq.Title,
                    Description = sectionReq.Description,
                    Order = sectionReq.Order,
                    IsVisible = sectionReq.IsVisible,
                    EventId = evt.Id
                };

                if (sectionReq.Components != null && sectionReq.Components.Count > 0)
                {
                    foreach (var compReq in sectionReq.Components)
                    {
                        section.Components.Add(new Component
                        {
                            Type = compReq.Type,
                            Order = compReq.Order,
                            Title = compReq.Title,
                            Description = compReq.Description,
                            Placeholder = compReq.Placeholder,
                            IsRequired = compReq.IsRequired,
                            IsVisible = compReq.IsVisible,
                            OptionsJson = compReq.OptionsJson,
                            ValidationJson = compReq.ValidationJson,
                            CorrectAnswerJson = compReq.CorrectAnswerJson,
                            Points = compReq.Points,
                            Explanation = compReq.Explanation,
                            MinValue = compReq.MinValue,
                            MaxValue = compReq.MaxValue,
                            MinLabel = compReq.MinLabel,
                            MaxLabel = compReq.MaxLabel,
                            MediaUrl = compReq.MediaUrl,
                            MediaType = compReq.MediaType,
                            StyleJson = compReq.StyleJson
                        });
                    }
                }

                await _unitOfWork.Sections.AddAsync(section);
            }
        }

        // حفظ كل شيء مرة واحدة بدل SaveChanges متعددة
        await _unitOfWork.SaveChangesAsync();

        // جلب الحدث المحدث مع كل التفاصيل
        var fullEvent = await _unitOfWork.Events.GetByIdWithFullDetailsAsync(evt.Id);
        return ApiResponse<EventWithFullDetailsDto>.SuccessResponse(
            _mapper.Map<EventWithFullDetailsDto>(fullEvent),
            "تم تحديث الحدث بنجاح");
    }

    /// <summary>
    /// تحديث حالة الحدث فقط دون المساس بالبيانات الأخرى
    /// </summary>
    public async Task<ApiResponse<EventDto>> UpdateStatusAsync(Guid id, Guid userId, EventStatus status)
    {
        var evt = await _unitOfWork.Events.GetByIdAsync(id);
        if (evt == null)
            return ApiResponse<EventDto>.FailureResponse("الحدث غير موجود");

        // التحقق: المالك أو متعاون بصلاحية مدير
        if (evt.UserId != userId && !await HasMinimumRoleAsync(id, userId, CollaboratorRole.Editor))
            return ApiResponse<EventDto>.FailureResponse("غير مصرح لك بتعديل حالة هذا الحدث");

        evt.Status = status;
        _unitOfWork.Events.Update(evt);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<EventDto>.SuccessResponse(_mapper.Map<EventDto>(evt), "تم تحديث حالة الحدث بنجاح");
    }

    public async Task<ApiResponse> DeleteAsync(Guid id, Guid userId)
    {
        var evt = await _unitOfWork.Events.GetByIdAsync(id);
        if (evt == null || evt.UserId != userId)
            return ApiResponse.FailureResponse("الحدث غير موجود");

        _unitOfWork.Events.Delete(evt);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse.SuccessResponse("تم حذف الحدث بنجاح");
    }

    public async Task<ApiResponse<EventDto>> DuplicateAsync(Guid id, Guid userId)
    {
        var evt = await _unitOfWork.Events.GetByIdWithFullDetailsAsync(id);
        if (evt == null || evt.UserId != userId)
            return ApiResponse<EventDto>.FailureResponse("الحدث غير موجود");

        // 1️⃣ نسخ الحدث مع جميع الخصائص
        var newEvent = new Event
        {
            Title = $"{evt.Title} (نسخة)",
            Description = evt.Description,
            Type = evt.Type,
            Status = EventStatus.Draft,
            UserId = userId,
            ShareCode = await GenerateUniqueShareCode(),
            // نسخ باقي الخصائص
            CoverImage = evt.CoverImage,
            ThemeColor = evt.ThemeColor,
            Language = evt.Language,
            TimeLimitMinutes = evt.TimeLimitMinutes,
            RequireLogin = evt.RequireLogin,
            AllowAnonymous = evt.AllowAnonymous,
            MaxResponses = evt.MaxResponses,
            AllowMultipleResponses = evt.AllowMultipleResponses,
            AllowEditResponses = evt.AllowEditResponses,
            ShowResults = evt.ShowResults,
            ShowCorrectAnswers = evt.ShowCorrectAnswers,
            ShuffleQuestions = evt.ShuffleQuestions,
            ShuffleOptions = evt.ShuffleOptions,
            PassingScore = evt.PassingScore,
            ThankYouMessage = evt.ThankYouMessage,
            SuccessMessage = evt.SuccessMessage,
            GoodMessage = evt.GoodMessage,
            ImprovementMessage = evt.ImprovementMessage
            // لا ننسخ: StartDate, EndDate, ViewCount, ResponseCount
        };

        // 2️⃣ نسخ الأقسام والمكونات باستخدام Navigation Properties
        // EF Core سيربط الـ IDs تلقائياً عند الحفظ
        if (evt.Sections != null && evt.Sections.Any())
        {
            foreach (var section in evt.Sections.OrderBy(s => s.Order))
            {
                var newSection = new Section
                {
                    Title = section.Title,
                    Description = section.Description,
                    Order = section.Order,
                    IsVisible = section.IsVisible
                };

                // 3️⃣ نسخ المكونات وربطها بالقسم
                if (section.Components != null && section.Components.Any())
                {
                    foreach (var component in section.Components.OrderBy(c => c.Order))
                    {
                        newSection.Components.Add(new Component
                        {
                            Type = component.Type,
                            Order = component.Order,
                            Title = component.Title,
                            Description = component.Description,
                            Placeholder = component.Placeholder,
                            IsRequired = component.IsRequired,
                            IsVisible = component.IsVisible,
                            OptionsJson = component.OptionsJson,
                            ValidationJson = component.ValidationJson,
                            CorrectAnswerJson = component.CorrectAnswerJson,
                            Points = component.Points,
                            Explanation = component.Explanation,
                            MinValue = component.MinValue,
                            MaxValue = component.MaxValue,
                            MinLabel = component.MinLabel,
                            MaxLabel = component.MaxLabel,
                            MediaUrl = component.MediaUrl,
                            MediaType = component.MediaType,
                            StyleJson = component.StyleJson
                        });
                    }
                }

                newEvent.Sections.Add(newSection);
            }
        }

        // حفظ كل شيء مرة واحدة (الحدث + الأقسام + المكونات)
        await _unitOfWork.Events.AddAsync(newEvent);
        await _unitOfWork.SaveChangesAsync();

        // الـ newEvent يحتوي على كل البيانات بعد SaveChanges
        return ApiResponse<EventDto>.SuccessResponse(
            _mapper.Map<EventDto>(newEvent),
            "تم نسخ الحدث بنجاح");
    }

    public async Task<ApiResponse<EventDto>> PublishAsync(Guid id, Guid userId)
    {
        var evt = await _unitOfWork.Events.GetByIdAsync(id);
        if (evt == null)
            return ApiResponse<EventDto>.FailureResponse("الحدث غير موجود");

        // التحقق: المالك أو متعاون بصلاحية مدير
        if (evt.UserId != userId && !await HasMinimumRoleAsync(id, userId, CollaboratorRole.Editor))
            return ApiResponse<EventDto>.FailureResponse("غير مصرح لك بنشر هذا الحدث");

        evt.Status = EventStatus.Published;
        _unitOfWork.Events.Update(evt);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<EventDto>.SuccessResponse(_mapper.Map<EventDto>(evt), "تم نشر الحدث بنجاح");
    }

    public async Task<ApiResponse<EventDto>> CloseAsync(Guid id, Guid userId)
    {
        var evt = await _unitOfWork.Events.GetByIdAsync(id);
        if (evt == null)
            return ApiResponse<EventDto>.FailureResponse("الحدث غير موجود");

        // التحقق: المالك أو متعاون بصلاحية مدير
        if (evt.UserId != userId && !await HasMinimumRoleAsync(id, userId, CollaboratorRole.Editor))
            return ApiResponse<EventDto>.FailureResponse("غير مصرح لك بإغلاق هذا الحدث");

        evt.Status = EventStatus.Closed;
        _unitOfWork.Events.Update(evt);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<EventDto>.SuccessResponse(_mapper.Map<EventDto>(evt), "تم إغلاق الحدث بنجاح");
    }

    public async Task<ApiResponse> IncrementViewCountAsync(Guid id)
    {
        await _unitOfWork.Events.IncrementViewCountAsync(id);
        return ApiResponse.SuccessResponse();
    }

    private async Task<string> GenerateUniqueShareCode()
    {
        string code;
        do
        {
            code = GenerateRandomCode(8);
        } while (await _unitOfWork.Events.ShareCodeExistsAsync(code));
        return code;
    }

    private static readonly Random _random = new();
    private static string GenerateRandomCode(int length)
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        return new string(Enumerable.Repeat(chars, length)
            .Select(s => s[_random.Next(s.Length)]).ToArray());
    }

    /// <summary>
    /// التحقق من أن المستخدم لديه صلاحية متعاون بالحد الأدنى المطلوب
    /// </summary>
    private async Task<bool> HasMinimumRoleAsync(Guid eventId, Guid userId, CollaboratorRole minimumRole)
    {
        var role = await _unitOfWork.EventCollaborators.GetRoleAsync(eventId, userId);
        if (role == null) return false;
        return role.Value >= minimumRole;
    }

    public async Task<ApiResponse<DashboardStatsDto>> GetDashboardStatsAsync(Guid userId)
    {
        var now = DateTime.UtcNow;
        var startOfToday = now.Date;
        var startOf7DaysAgo = startOfToday.AddDays(-6);
        var startOfCurrentPeriod = now.AddDays(-30);
        var startOfPreviousPeriod = startOfCurrentPeriod.AddDays(-30);
        var endOfPreviousPeriod = startOfCurrentPeriod;

        // جلب الأحداث الحالية
        var events = await _unitOfWork.Events.GetByUserIdAsync(userId);
        var totalEvents = events.Count;
        var activeEvents = events.Count(e => e.Status == EventStatus.Published);

        // جلب إجمالي المشاهدات والردود
        var (totalViews, totalResponses) = await _unitOfWork.Events.GetTotalStatsAsync(userId);

        // حساب معدل الإكمال
        double avgCompletionRate = 0;
        var eventsWithResponses = events.Where(e => e.ResponseCount > 0).ToList();
        if (eventsWithResponses.Any())
        {
            var completionRates = await _unitOfWork.Responses.GetBulkCompletionRatesAsync(
                eventsWithResponses.Select(e => e.Id));
            if (completionRates.Any())
            {
                avgCompletionRate = completionRates.Values.Average();
            }
        }

        // حساب نسب التغيير
        var (currentPeriodEvents, previousPeriodEvents) = await _unitOfWork.Events
            .GetEventsCountForPeriodsAsync(userId, startOfCurrentPeriod, now, startOfPreviousPeriod, endOfPreviousPeriod);
        var eventsChange = CalculatePercentageChange(previousPeriodEvents, currentPeriodEvents);

        var currentActiveEvents = events.Count(e => e.Status == EventStatus.Published && e.CreatedAt >= startOfCurrentPeriod);
        var previousActiveEvents = events.Count(e => e.Status == EventStatus.Published && e.CreatedAt >= startOfPreviousPeriod && e.CreatedAt < endOfPreviousPeriod);
        var activeEventsChange = CalculatePercentageChange(previousActiveEvents, currentActiveEvents);

        var (currentPeriodResponses, previousPeriodResponses) = await _unitOfWork.Responses
            .GetCompletedResponsesCountForPeriodsAsync(userId, startOfCurrentPeriod, now, startOfPreviousPeriod, endOfPreviousPeriod);
        var responsesChange = CalculatePercentageChange(previousPeriodResponses, currentPeriodResponses);

        // بيانات الرسم البياني (آخر 7 أيام)
        var dailyEventCounts = await _unitOfWork.Events.GetDailyEventCountsAsync(userId, startOf7DaysAgo, startOfToday.AddDays(1));
        var dailyResponseCounts = await _unitOfWork.Responses.GetDailyResponseCountsAsync(userId, startOf7DaysAgo, startOfToday.AddDays(1));

        var dailyStats = new List<DailyStatsDto>();
        for (int i = 6; i >= 0; i--)
        {
            var date = startOfToday.AddDays(-i);
            dailyStats.Add(new DailyStatsDto
            {
                Date = date.ToString("yyyy-MM-dd"),
                Events = dailyEventCounts.TryGetValue(date, out var eventCount) ? eventCount : 0,
                Responses = dailyResponseCounts.TryGetValue(date, out var responseCount) ? responseCount : 0
            });
        }

        var result = new DashboardStatsDto
        {
            TotalEvents = totalEvents,
            ActiveEvents = activeEvents,
            TotalResponses = totalResponses,
            TotalViews = totalViews,
            AverageCompletionRate = Math.Round(avgCompletionRate, 1),
            EventsChange = Math.Round(eventsChange, 1),
            ActiveEventsChange = Math.Round(activeEventsChange, 1),
            ResponsesChange = Math.Round(responsesChange, 1),
            ViewsChange = 0, // يحتاج تخزين تاريخ المشاهدات للحساب الدقيق
            CompletionRateChange = 0, // يحتاج تخزين تاريخ للحساب الدقيق
            DailyStats = dailyStats
        };

        return ApiResponse<DashboardStatsDto>.SuccessResponse(result);
    }

    private static double CalculatePercentageChange(int previous, int current)
    {
        if (previous == 0)
            return current > 0 ? 100 : 0;
        return ((double)(current - previous) / previous) * 100;
    }

    public async Task<ApiResponse<DrawResultDto>> DrawWinnersAsync(Guid eventId, Guid userId, int winnersCount, List<string>? winnerResponseIds = null)
    {
        // === Fix 5: Validation ===
        if (winnersCount <= 0)
            return ApiResponse<DrawResultDto>.FailureResponse("عدد الفائزين يجب أن يكون أكبر من صفر");

        if (winnersCount > 100)
            return ApiResponse<DrawResultDto>.FailureResponse("عدد الفائزين كبير جداً");

        var evt = await _unitOfWork.Events.GetByIdAsync(eventId);
        if (evt == null)
            return ApiResponse<DrawResultDto>.FailureResponse("الحدث غير موجود");

        // التحقق: المالك أو متعاون بصلاحية محرر
        if (evt.UserId != userId && !await HasMinimumRoleAsync(eventId, userId, CollaboratorRole.Editor))
            return ApiResponse<DrawResultDto>.FailureResponse("غير مصرح لك بإجراء السحب في هذا الحدث");

        if (evt.Type != EventType.Competition)
            return ApiResponse<DrawResultDto>.FailureResponse("هذا الحدث ليس مسابقة");

        if (evt.DrawCompleted)
            return ApiResponse<DrawResultDto>.FailureResponse("تم إجراء السحب مسبقاً");

        // === Fix 1 + Fix 3: استعلام خفيف — بدون AnswersJson — مفلتر بـ Completed في SQL ===
        var completedResponses = await _unitOfWork.Responses.GetCompletedForDrawAsync(eventId);

        // === Fix 4: منطق فلترة المؤهلين مستخرج كـ helper ===
        var eligibleResponses = FilterQualified(completedResponses, evt);

        List<Domain.Entities.Response> winners;

        if (winnerResponseIds != null && winnerResponseIds.Count > 0)
        {
            // === الفائزون مختارون من العجلة في Frontend ===
            var winnerGuids = winnerResponseIds
                .Select(id => Guid.TryParse(id, out var g) ? g : Guid.Empty)
                .Where(g => g != Guid.Empty)
                .ToHashSet();

            winners = completedResponses
                .Where(r => winnerGuids.Contains(r.Id))
                .ToList();

            if (winners.Count == 0)
                return ApiResponse<DrawResultDto>.FailureResponse("لم يتم العثور على الفائزين المحددين");
        }
        else
        {
            // === اختيار عشوائي ===
            if (eligibleResponses.Count == 0)
                return ApiResponse<DrawResultDto>.FailureResponse("لا يوجد مشاركون مؤهلون للسحب");

            var actualWinnersCount = Math.Min(winnersCount, eligibleResponses.Count);
            var shuffled = eligibleResponses.OrderBy(_ => Guid.NewGuid()).ToList();
            winners = shuffled.Take(actualWinnersCount).ToList();
        }

        // بناء قائمة الفائزين
        var winnerDtos = winners.Select((w, index) =>
        {
            string participantName = !string.IsNullOrEmpty(w.RespondentName)
                ? w.RespondentName
                : "مشارك";
            string? participantEmail = w.RespondentEmail;

            double? score = null;
            if (w.Percentage.HasValue)
                score = Math.Round(w.Percentage.Value, 1);
            else if (w.TotalPoints.HasValue && w.TotalPoints > 0 && w.Score.HasValue)
                score = Math.Round(((double)w.Score.Value / w.TotalPoints.Value) * 100, 1);

            return new DrawWinnerDto
            {
                ResponseId = w.Id.ToString(),
                ParticipantName = participantName,
                ParticipantEmail = participantEmail,
                Rank = index + 1,
                Score = score
            };
        }).ToList();

        // حفظ الفائزين في قاعدة البيانات
        evt.WinnersJson = System.Text.Json.JsonSerializer.Serialize(
            winners.Select(w => w.Id.ToString()).ToList()
        );
        evt.DrawCompleted = true;
        evt.WinnersCount = winners.Count;
        _unitOfWork.Events.Update(evt);
        await _unitOfWork.SaveChangesAsync();

        var result = new DrawResultDto
        {
            Winners = winnerDtos,
            TotalParticipants = completedResponses.Count,
            QualifiedCount = eligibleResponses.Count
        };

        return ApiResponse<DrawResultDto>.SuccessResponse(result, "تم إجراء السحب العشوائي بنجاح");
    }

    /// <summary>
    /// فلترة المشاركين المؤهلين حسب نوع المسابقة ودرجة التأهل
    /// </summary>
    private static List<Domain.Entities.Response> FilterQualified(
        IReadOnlyList<Domain.Entities.Response> responses, Event evt)
    {
        if (evt.CompetitionMode != "quiz_draw" || !evt.QualifyingScore.HasValue)
            return responses.ToList();

        var qualifyingScore = evt.QualifyingScore.Value;
        return responses.Where(r =>
        {
            if (r.Percentage.HasValue)
                return r.Percentage.Value >= qualifyingScore;

            if (r.TotalPoints.HasValue && r.TotalPoints > 0 && r.Score.HasValue)
            {
                double percentage = ((double)r.Score.Value / r.TotalPoints.Value) * 100;
                return percentage >= qualifyingScore;
            }
            return false;
        }).ToList();
    }

    public async Task<ApiResponse<string>> UpdateResultsSharingAsync(Guid eventId, Guid userId, ShareResultsRequest request)
    {
        var evt = await _unitOfWork.Events.GetByIdAsync(eventId);
        if (evt == null)
            return ApiResponse<string>.FailureResponse("الحدث غير موجود");

        // التحقق: المالك أو متعاون بصلاحية مدير
        if (evt.UserId != userId && !await HasMinimumRoleAsync(eventId, userId, CollaboratorRole.Editor))
            return ApiResponse<string>.FailureResponse("غير مصرح لك بتعديل إعدادات المشاركة");

        evt.IsResultsShared = request.IsEnabled;

        // توليد token لو أول مرة
        if (request.IsEnabled && string.IsNullOrEmpty(evt.ResultsShareToken))
        {
            evt.ResultsShareToken = Guid.NewGuid().ToString("N");
        }

        // حفظ الإيميلات
        evt.ResultsSharedEmailsJson = request.AllowedEmails.Count > 0
            ? System.Text.Json.JsonSerializer.Serialize(request.AllowedEmails)
            : null;

        // حفظ الصلاحيات
        evt.ResultsSharePermissionsJson = System.Text.Json.JsonSerializer.Serialize(request.Permissions);

        // يجب استدعاء Update لأن NoTracking مفعّل في DbContext
        _unitOfWork.Events.Update(evt);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<string>.SuccessResponse(evt.ResultsShareToken ?? "", "تم تحديث إعدادات المشاركة");
    }

    public async Task<ApiResponse<SharedResultsDataDto>> AccessSharedResultsAsync(string token, string email)
    {
        // البحث عن الحدث بالـ token
        var events = await _unitOfWork.Events.FindAsync(e => e.ResultsShareToken == token);
        var evt = events.FirstOrDefault();

        if (evt == null)
            return ApiResponse<SharedResultsDataDto>.FailureResponse("الرابط غير صالح أو منتهي الصلاحية");

        if (!evt.IsResultsShared)
            return ApiResponse<SharedResultsDataDto>.FailureResponse("مشاركة النتائج غير مفعّلة لهذا الحدث");

        // التحقق من الإيميل
        var allowedEmails = new List<string>();
        if (!string.IsNullOrEmpty(evt.ResultsSharedEmailsJson))
        {
            try
            {
                allowedEmails = System.Text.Json.JsonSerializer.Deserialize<List<string>>(evt.ResultsSharedEmailsJson) ?? new();
            }
            catch { }
        }

        var emailLower = email.Trim().ToLowerInvariant();
        if (!allowedEmails.Any(e => e.Trim().ToLowerInvariant() == emailLower))
            return ApiResponse<SharedResultsDataDto>.FailureResponse("ليس لديك صلاحية لعرض نتائج هذا الحدث");

        // جلب الحدث مع التفاصيل الكاملة
        var fullEvent = await _unitOfWork.Events.GetByIdWithFullDetailsAsync(evt.Id);
        if (fullEvent == null)
            return ApiResponse<SharedResultsDataDto>.FailureResponse("فشل تحميل بيانات الحدث");

        var eventDto = _mapper.Map<EventWithFullDetailsDto>(fullEvent);

        // جلب الردود المكتملة
        var responses = await _unitOfWork.Responses.FindAsync(r =>
            r.EventId == evt.Id && r.Status == Domain.Enums.ResponseStatus.Completed);

        // قائمة الفائزين
        var winnerIds = new List<string>();
        if (!string.IsNullOrEmpty(evt.WinnersJson))
        {
            try
            {
                winnerIds = System.Text.Json.JsonSerializer.Deserialize<List<string>>(evt.WinnersJson) ?? new();
            }
            catch { }
        }

        // تحويل الردود
        var sharedResponses = responses.Select(r => new SharedResponseDto
        {
            Id = r.Id.ToString(),
            ParticipantName = r.RespondentName ?? "مشارك مجهول",
            ParticipantEmail = r.RespondentEmail,
            Status = r.Status.ToString().ToLower(),
            TimeSpent = r.DurationSeconds ?? 0,
            StartedAt = r.StartedAt,
            CompletedAt = r.CompletedAt,
            IsWinner = winnerIds.Contains(r.Id.ToString()),
            Score = r.Score.HasValue && r.TotalPoints.HasValue ? new SharedScoreDto
            {
                EarnedPoints = r.Score.Value,
                TotalPoints = r.TotalPoints.Value,
                Percentage = r.TotalPoints.Value > 0 ? Math.Round((double)r.Score.Value / r.TotalPoints.Value * 100, 1) : 0,
                Passed = r.TotalPoints.Value > 0 && (double)r.Score.Value / r.TotalPoints.Value * 100 >= (evt.PassingScore ?? 0)
            } : null,
            // إرسال AnswersJson خام — الـ Frontend يحوّلها بنفس طريقة mapResponse
            AnswersJson = r.AnswersJson ?? "{}"
        }).ToList();

        // الصلاحيات
        var permissions = new ResultsSharePermissionsDto();
        if (!string.IsNullOrEmpty(evt.ResultsSharePermissionsJson))
        {
            try
            {
                permissions = System.Text.Json.JsonSerializer.Deserialize<ResultsSharePermissionsDto>(
                    evt.ResultsSharePermissionsJson,
                    new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                ) ?? new();
            }
            catch { }
        }

        var result = new SharedResultsDataDto
        {
            Event = eventDto,
            Responses = sharedResponses,
            Permissions = permissions
        };

        return ApiResponse<SharedResultsDataDto>.SuccessResponse(result);
    }

}



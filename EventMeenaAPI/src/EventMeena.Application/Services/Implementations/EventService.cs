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
        if (evt == null || evt.UserId != userId)
            return ApiResponse<EventDto>.FailureResponse("الحدث غير موجود");

        return ApiResponse<EventDto>.SuccessResponse(_mapper.Map<EventDto>(evt));
    }

    public async Task<ApiResponse<EventWithFullDetailsDto>> GetByIdWithFullDetailsAsync(Guid id, Guid userId)
    {
        var evt = await _unitOfWork.Events.GetByIdWithFullDetailsAsync(id);
        if (evt == null || evt.UserId != userId)
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
        // استخدام WithCounts للحصول على عدد الأقسام والمكونات
        var events = await _unitOfWork.Events.GetByUserIdWithCountsAsync(userId);
        var totalCount = events.Count;
        var pagedEvents = events
            .Skip((pagination.PageNumber - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .ToList();

        return ApiResponse<PagedResult<EventListItemDto>>.SuccessResponse(new PagedResult<EventListItemDto>
        {
            Items = _mapper.Map<List<EventListItemDto>>(pagedEvents),
            TotalCount = totalCount,
            PageNumber = pagination.PageNumber,
            PageSize = pagination.PageSize
        });
    }

    public async Task<ApiResponse<List<EventListItemDto>>> GetUserEventsByStatusAsync(Guid userId, EventStatus status)
    {
        // استخدام WithCounts للحصول على عدد الأقسام والمكونات
        var events = await _unitOfWork.Events.GetByUserIdAndStatusWithCountsAsync(userId, status);
        return ApiResponse<List<EventListItemDto>>.SuccessResponse(_mapper.Map<List<EventListItemDto>>(events));
    }

    public async Task<ApiResponse<List<EventListItemDto>>> GetUserEventsByTypeAsync(Guid userId, EventType type)
    {
        // استخدام WithCounts للحصول على عدد الأقسام والمكونات
        var events = await _unitOfWork.Events.GetByUserIdAndTypeWithCountsAsync(userId, type);
        return ApiResponse<List<EventListItemDto>>.SuccessResponse(_mapper.Map<List<EventListItemDto>>(events));
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

        // بدء Transaction للحماية
        await _unitOfWork.BeginTransactionAsync();

        try
        {
            // إنشاء الحدث
            var evt = new Event
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
                    : null
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

            // تأكيد Transaction
            await _unitOfWork.CommitTransactionAsync();

            // جلب الحدث مع كل التفاصيل
            var fullEvent = await _unitOfWork.Events.GetByIdWithFullDetailsAsync(evt.Id);
            return ApiResponse<EventWithFullDetailsDto>.SuccessResponse(
                _mapper.Map<EventWithFullDetailsDto>(fullEvent),
                "تم إنشاء الحدث بنجاح");
        }
        catch (Exception)
        {
            // إلغاء كل شيء في حالة الخطأ
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }
    }

    public async Task<ApiResponse<EventDto>> UpdateAsync(Guid id, Guid userId, UpdateEventRequest request)
    {
        var evt = await _unitOfWork.Events.GetByIdAsync(id);
        if (evt == null || evt.UserId != userId)
            return ApiResponse<EventDto>.FailureResponse("الحدث غير موجود");

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
        if (evt == null || evt.UserId != userId)
            return ApiResponse<EventWithFullDetailsDto>.FailureResponse("الحدث غير موجود");

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
        await _unitOfWork.SaveChangesAsync();

        // تحديث الأقسام والمكونات
        if (request.Sections != null)
        {
            // حذف الأقسام والمكونات القديمة
            var existingSections = await _unitOfWork.Sections.GetByEventIdWithComponentsAsync(id);
            foreach (var section in existingSections)
            {
                // حذف المكونات أولاً
                foreach (var component in section.Components.ToList())
                {
                    _unitOfWork.Components.Delete(component);
                }
                // ثم حذف القسم
                _unitOfWork.Sections.Delete(section);
            }
            await _unitOfWork.SaveChangesAsync();

            // إنشاء الأقسام والمكونات الجديدة
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

                await _unitOfWork.Sections.AddAsync(section);
                await _unitOfWork.SaveChangesAsync();

                // إنشاء المكونات
                if (sectionReq.Components != null && sectionReq.Components.Count > 0)
                {
                    foreach (var compReq in sectionReq.Components)
                    {
                        var component = new Component
                        {
                            SectionId = section.Id,
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
                        };
                        await _unitOfWork.Components.AddAsync(component);
                    }
                    await _unitOfWork.SaveChangesAsync();
                }
            }
        }

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
        if (evt == null || evt.UserId != userId)
            return ApiResponse<EventDto>.FailureResponse("الحدث غير موجود");

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

        await _unitOfWork.Events.AddAsync(newEvent);
        await _unitOfWork.SaveChangesAsync();

        // 2️⃣ نسخ الأقسام والمكونات
        if (evt.Sections != null && evt.Sections.Any())
        {
            foreach (var section in evt.Sections.OrderBy(s => s.Order))
            {
                var newSection = new Section
                {
                    Title = section.Title,
                    Description = section.Description,
                    Order = section.Order,
                    IsVisible = section.IsVisible,
                    EventId = newEvent.Id
                };

                await _unitOfWork.Sections.AddAsync(newSection);
                await _unitOfWork.SaveChangesAsync();

                // 3️⃣ نسخ المكونات
                if (section.Components != null && section.Components.Any())
                {
                    foreach (var component in section.Components.OrderBy(c => c.Order))
                    {
                        var newComponent = new Component
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
                            StyleJson = component.StyleJson,
                            SectionId = newSection.Id
                        };

                        await _unitOfWork.Components.AddAsync(newComponent);
                    }
                    await _unitOfWork.SaveChangesAsync();
                }
            }
        }

        // 4️⃣ جلب الحدث المنسوخ مع التفاصيل الكاملة
        var fullNewEvent = await _unitOfWork.Events.GetByIdWithFullDetailsAsync(newEvent.Id);
        return ApiResponse<EventDto>.SuccessResponse(
            _mapper.Map<EventDto>(fullNewEvent),
            "تم نسخ الحدث بنجاح");
    }

    public async Task<ApiResponse<EventDto>> PublishAsync(Guid id, Guid userId)
    {
        var evt = await _unitOfWork.Events.GetByIdAsync(id);
        if (evt == null || evt.UserId != userId)
            return ApiResponse<EventDto>.FailureResponse("الحدث غير موجود");

        evt.Status = EventStatus.Published;
        _unitOfWork.Events.Update(evt);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<EventDto>.SuccessResponse(_mapper.Map<EventDto>(evt), "تم نشر الحدث بنجاح");
    }

    public async Task<ApiResponse<EventDto>> CloseAsync(Guid id, Guid userId)
    {
        var evt = await _unitOfWork.Events.GetByIdAsync(id);
        if (evt == null || evt.UserId != userId)
            return ApiResponse<EventDto>.FailureResponse("الحدث غير موجود");

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

    private static string GenerateRandomCode(int length)
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, length)
            .Select(s => s[random.Next(s.Length)]).ToArray());
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

        // حساب معدل الإكمال (متوسط نسبة الردود المكتملة)
        double avgCompletionRate = 0;
        if (events.Any())
        {
            var completionRates = new List<double>();
            foreach (var evt in events.Where(e => e.ResponseCount > 0))
            {
                var stats = await _unitOfWork.Responses.GetEventStatsAsync(evt.Id);
                if (stats.TotalResponses > 0)
                {
                    completionRates.Add((double)stats.CompletedResponses / stats.TotalResponses * 100);
                }
            }
            avgCompletionRate = completionRates.Any() ? completionRates.Average() : 0;
        }

        // حساب نسب التغيير
        var currentPeriodEvents = await _unitOfWork.Events.GetEventsCountAsync(userId, startOfCurrentPeriod, now);
        var previousPeriodEvents = await _unitOfWork.Events.GetEventsCountAsync(userId, startOfPreviousPeriod, endOfPreviousPeriod);
        var eventsChange = CalculatePercentageChange(previousPeriodEvents, currentPeriodEvents);

        var currentActiveEvents = events.Count(e => e.Status == EventStatus.Published && e.CreatedAt >= startOfCurrentPeriod);
        var previousActiveEvents = events.Count(e => e.Status == EventStatus.Published && e.CreatedAt >= startOfPreviousPeriod && e.CreatedAt < endOfPreviousPeriod);
        var activeEventsChange = CalculatePercentageChange(previousActiveEvents, currentActiveEvents);

        var currentPeriodResponses = await _unitOfWork.Responses.GetCompletedResponsesCountAsync(userId, startOfCurrentPeriod, now);
        var previousPeriodResponses = await _unitOfWork.Responses.GetCompletedResponsesCountAsync(userId, startOfPreviousPeriod, endOfPreviousPeriod);
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
}


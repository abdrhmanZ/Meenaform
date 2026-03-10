using EventMeena.Application.DTOs.Common;
using EventMeena.Application.DTOs.Events;
using EventMeena.Application.Services.Interfaces;
using EventMeena.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventMeena.API.Controllers;

/// <summary>
/// Events management controller
/// </summary>
[Authorize]
public class EventsController : BaseApiController
{
    private readonly IEventService _eventService;
    private readonly ISendEventService _sendEventService;

    public EventsController(IEventService eventService, ISendEventService sendEventService)
    {
        _eventService = eventService;
        _sendEventService = sendEventService;
    }

    /// <summary>
    /// الحصول على جميع أحداث المستخدم مع Pagination
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<EventListItemDto>>>> GetEvents([FromQuery] PaginationParams pagination)
    {
        var result = await _eventService.GetUserEventsAsync(CurrentUserId, pagination);

        if (!result.Success)
            return BadRequestResponse<PagedResult<EventListItemDto>>(result.Message ?? "فشل جلب الأحداث");

        return Success(result.Data!);
    }

    /// <summary>
    /// الحصول على أحداث المستخدم حسب الحالة
    /// </summary>
    [HttpGet("by-status/{status}")]
    public async Task<ActionResult<ApiResponse<List<EventListItemDto>>>> GetEventsByStatus(EventStatus status)
    {
        var result = await _eventService.GetUserEventsByStatusAsync(CurrentUserId, status);

        if (!result.Success)
            return BadRequestResponse<List<EventListItemDto>>(result.Message ?? "فشل جلب الأحداث");

        return Success(result.Data!);
    }

    /// <summary>
    /// الحصول على أحداث المستخدم حسب النوع
    /// </summary>
    [HttpGet("by-type/{type}")]
    public async Task<ActionResult<ApiResponse<List<EventListItemDto>>>> GetEventsByType(EventType type)
    {
        var result = await _eventService.GetUserEventsByTypeAsync(CurrentUserId, type);

        if (!result.Success)
            return BadRequestResponse<List<EventListItemDto>>(result.Message ?? "فشل جلب الأحداث");

        return Success(result.Data!);
    }

    /// <summary>
    /// الحصول على إحصائيات لوحة التحكم
    /// </summary>
    [HttpGet("dashboard-stats")]
    public async Task<ActionResult<ApiResponse<DashboardStatsDto>>> GetDashboardStats()
    {
        var result = await _eventService.GetDashboardStatsAsync(CurrentUserId);

        if (!result.Success)
            return BadRequestResponse<DashboardStatsDto>(result.Message ?? "فشل جلب الإحصائيات");

        return Success(result.Data!);
    }

    /// <summary>
    /// الحصول على حدث بالـ ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<EventDto>>> GetById(Guid id)
    {
        var result = await _eventService.GetByIdAsync(id, CurrentUserId);

        if (!result.Success)
            return NotFoundResponse<EventDto>(result.Message ?? "الحدث غير موجود");

        return Success(result.Data!);
    }

    /// <summary>
    /// الحصول على حدث بالتفاصيل الكاملة
    /// </summary>
    [HttpGet("{id:guid}/full")]
    public async Task<ActionResult<ApiResponse<EventWithFullDetailsDto>>> GetByIdWithFullDetails(Guid id)
    {
        var result = await _eventService.GetByIdWithFullDetailsAsync(id, CurrentUserId);

        if (!result.Success)
            return NotFoundResponse<EventWithFullDetailsDto>(result.Message ?? "الحدث غير موجود");

        return Success(result.Data!);
    }

    /// <summary>
    /// إنشاء حدث جديد
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiResponse<EventDto>>> Create([FromBody] CreateEventRequest request)
    {
        var result = await _eventService.CreateAsync(CurrentUserId, request);

        if (!result.Success)
            return BadRequestResponse<EventDto>(result.Message ?? "فشل إنشاء الحدث");

        return Created(result.Data!, "تم إنشاء الحدث بنجاح");
    }

    /// <summary>
    /// إنشاء حدث كامل مع أقسامه ومكوناته
    /// </summary>
    [HttpPost("with-sections")]
    public async Task<ActionResult<ApiResponse<EventWithFullDetailsDto>>> CreateWithSections([FromBody] CreateEventWithSectionsRequest request)
    {
        var result = await _eventService.CreateWithSectionsAsync(CurrentUserId, request);

        if (!result.Success)
            return BadRequestResponse<EventWithFullDetailsDto>(result.Message ?? "فشل إنشاء الحدث");

        return Created(result.Data!, "تم إنشاء الحدث بنجاح");
    }

    /// <summary>
    /// تحديث حدث
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<EventDto>>> Update(Guid id, [FromBody] UpdateEventRequest request)
    {
        var result = await _eventService.UpdateAsync(id, CurrentUserId, request);

        if (!result.Success)
            return BadRequestResponse<EventDto>(result.Message ?? "فشل تحديث الحدث");

        return Success(result.Data!, "تم تحديث الحدث بنجاح");
    }

    /// <summary>
    /// تحديث حدث كامل مع أقسامه ومكوناته
    /// </summary>
    [HttpPut("{id:guid}/with-sections")]
    public async Task<ActionResult<ApiResponse<EventWithFullDetailsDto>>> UpdateWithSections(Guid id, [FromBody] UpdateEventWithSectionsRequest request)
    {
        var result = await _eventService.UpdateWithSectionsAsync(id, CurrentUserId, request);

        if (!result.Success)
            return BadRequestResponse<EventWithFullDetailsDto>(result.Message ?? "فشل تحديث الحدث");

        return Success(result.Data!, "تم تحديث الحدث بنجاح");
    }

    /// <summary>
    /// تحديث حالة الحدث فقط
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<ApiResponse<EventDto>>> UpdateStatus(Guid id, [FromBody] UpdateStatusRequest request)
    {
        var result = await _eventService.UpdateStatusAsync(id, CurrentUserId, request.Status);

        if (!result.Success)
            return BadRequestResponse<EventDto>(result.Message ?? "فشل تحديث حالة الحدث");

        return Success(result.Data!, "تم تحديث حالة الحدث بنجاح");
    }

    /// <summary>
    /// حذف حدث
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse>> Delete(Guid id)
    {
        var result = await _eventService.DeleteAsync(id, CurrentUserId);

        if (!result.Success)
            return BadRequestNoContent(result.Message ?? "فشل حذف الحدث");

        return SuccessNoContent("تم حذف الحدث بنجاح");
    }

    /// <summary>
    /// نسخ حدث
    /// </summary>
    [HttpPost("{id:guid}/duplicate")]
    public async Task<ActionResult<ApiResponse<EventDto>>> Duplicate(Guid id)
    {
        var result = await _eventService.DuplicateAsync(id, CurrentUserId);

        if (!result.Success)
            return BadRequestResponse<EventDto>(result.Message ?? "فشل نسخ الحدث");

        return Created(result.Data!, "تم نسخ الحدث بنجاح");
    }

    /// <summary>
    /// نشر حدث
    /// </summary>
    [HttpPost("{id:guid}/publish")]
    public async Task<ActionResult<ApiResponse<EventDto>>> Publish(Guid id)
    {
        var result = await _eventService.PublishAsync(id, CurrentUserId);

        if (!result.Success)
            return BadRequestResponse<EventDto>(result.Message ?? "فشل نشر الحدث");

        return Success(result.Data!, "تم نشر الحدث بنجاح");
    }

    /// <summary>
    /// إغلاق حدث
    /// </summary>
    [HttpPost("{id:guid}/close")]
    public async Task<ActionResult<ApiResponse<EventDto>>> Close(Guid id)
    {
        var result = await _eventService.CloseAsync(id, CurrentUserId);

        if (!result.Success)
            return BadRequestResponse<EventDto>(result.Message ?? "فشل إغلاق الحدث");

        return Success(result.Data!, "تم إغلاق الحدث بنجاح");
    }

    /// <summary>
    /// إرسال حدث لجهات الاتصال أو المجموعات
    /// </summary>
    /// <param name="id">معرف الحدث</param>
    /// <param name="request">بيانات الإرسال</param>
    [HttpPost("{id:guid}/send")]
    public async Task<ActionResult<ApiResponse<SendEventResponse>>> Send(Guid id, [FromBody] SendEventRequest request)
    {
        var response = new SendEventResponse();
        var errors = new List<string>();
        var totalSent = 0;

        // إرسال لجهات الاتصال
        if (request.ContactIds != null && request.ContactIds.Any())
        {
            var result = await _sendEventService.SendEventToContactsAsync(id, request.ContactIds, CurrentUserId);
            if (result.Success)
            {
                totalSent += result.Data;
            }
            else
            {
                errors.Add(result.Message ?? "فشل إرسال لبعض جهات الاتصال");
            }
        }

        // إرسال للمجموعات
        if (request.GroupIds != null && request.GroupIds.Any())
        {
            foreach (var groupId in request.GroupIds)
            {
                var result = await _sendEventService.SendEventToGroupAsync(id, groupId, CurrentUserId);
                if (result.Success)
                {
                    totalSent += result.Data;
                }
                else
                {
                    errors.Add(result.Message ?? $"فشل إرسال للمجموعة {groupId}");
                }
            }
        }

        response.SuccessCount = totalSent;
        response.TotalRecipients = (request.ContactIds?.Count ?? 0) + (request.GroupIds?.Count ?? 0);
        response.FailureCount = response.TotalRecipients - totalSent;
        response.Errors = errors.Any() ? errors : null;

        if (totalSent > 0)
        {
            return Success(response, $"تم إرسال الحدث بنجاح إلى {totalSent} جهة اتصال");
        }
        else
        {
            return BadRequestResponse<SendEventResponse>("فشل إرسال الحدث");
        }
    }

    /// <summary>
    /// إرسال تذكير للمشاركة في حدث
    /// </summary>
    /// <param name="id">معرف الحدث</param>
    /// <param name="contactIds">قائمة معرفات جهات الاتصال</param>
    [HttpPost("{id:guid}/send-reminder")]
    public async Task<ActionResult<ApiResponse<SendEventResponse>>> SendReminder(Guid id, [FromBody] List<Guid> contactIds)
    {
        var result = await _sendEventService.SendEventReminderAsync(id, contactIds, CurrentUserId);

        if (!result.Success)
            return BadRequestResponse<SendEventResponse>(result.Message ?? "فشل إرسال التذكير");

        var response = new SendEventResponse
        {
            SuccessCount = result.Data,
            TotalRecipients = contactIds.Count,
            FailureCount = contactIds.Count - result.Data
        };

        return Success(response, result.Message);
    }

    /// <summary>
    /// الحصول على سجل إرسالات الحدث
    /// </summary>
    /// <param name="id">معرف الحدث</param>
    [HttpGet("{id:guid}/send-history")]
    public async Task<ActionResult<ApiResponse<IEnumerable<SendHistoryDto>>>> GetSendHistory(Guid id)
    {
        var result = await _sendEventService.GetEventSendHistoryAsync(id, CurrentUserId);

        if (!result.Success)
            return BadRequestResponse<IEnumerable<SendHistoryDto>>(result.Message ?? "فشل جلب سجل الإرسالات");

        // تحويل SendHistory إلى SendHistoryDto
        var historyDtos = result.Data!.Select(h => new SendHistoryDto
        {
            Id = h.Id,
            EventId = h.EventId,
            ContactId = h.ContactId,
            Method = h.Method.ToString(),
            Status = h.Status.ToString(),
            RecipientEmail = h.RecipientEmail,
            RecipientPhone = h.RecipientPhone,
            Subject = h.Subject,
            SentAt = h.SentAt,
            ErrorMessage = h.ErrorMessage
        });

        return Success(historyDtos);
    }

    /// <summary>
    /// إجراء السحب العشوائي للفائزين في مسابقة
    /// </summary>
    /// <param name="id">معرف الحدث (مسابقة)</param>
    /// <param name="request">بيانات السحب (عدد الفائزين)</param>
    [HttpPost("{id:guid}/draw")]
    public async Task<ActionResult<ApiResponse<DrawResultDto>>> Draw(Guid id, [FromBody] DrawRequest request)
    {
        var result = await _eventService.DrawWinnersAsync(id, CurrentUserId, request.WinnersCount, request.WinnerResponseIds);

        if (!result.Success)
            return BadRequestResponse<DrawResultDto>(result.Message ?? "فشل إجراء السحب");

        return Success(result.Data!, result.Message ?? "تم إجراء السحب بنجاح");
    }

    /// <summary>
    /// تحديث إعدادات مشاركة النتائج
    /// </summary>
    /// <param name="id">معرف الحدث</param>
    /// <param name="request">إعدادات المشاركة</param>
    [HttpPut("{id:guid}/share-results")]
    public async Task<ActionResult<ApiResponse<string>>> ShareResults(Guid id, [FromBody] ShareResultsRequest request)
    {
        var result = await _eventService.UpdateResultsSharingAsync(id, CurrentUserId, request);

        if (!result.Success)
            return BadRequestResponse<string>(result.Message ?? "فشل تحديث إعدادات المشاركة");

        return Success(result.Data!, result.Message ?? "تم تحديث إعدادات المشاركة");
    }
}


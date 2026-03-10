using EventMeena.Application.DTOs.Common;
using EventMeena.Application.DTOs.Events;
using EventMeena.Domain.Enums;

namespace EventMeena.Application.Services.Interfaces;

/// <summary>
/// Event service interface
/// </summary>
public interface IEventService
{
    Task<ApiResponse<EventDto>> GetByIdAsync(Guid id, Guid userId);
    Task<ApiResponse<EventWithFullDetailsDto>> GetByIdWithFullDetailsAsync(Guid id, Guid userId);
    Task<ApiResponse<EventWithFullDetailsDto>> GetByShareCodeAsync(string shareCode);

    /// <summary>
    /// الحصول على حدث للمعاينة (بدون التحقق من الحالة) - للقراءة فقط
    /// </summary>
    Task<ApiResponse<EventWithFullDetailsDto>> GetForPreviewAsync(Guid id);
    Task<ApiResponse<PagedResult<EventListItemDto>>> GetUserEventsAsync(Guid userId, PaginationParams pagination);
    Task<ApiResponse<List<EventListItemDto>>> GetUserEventsByStatusAsync(Guid userId, EventStatus status);
    Task<ApiResponse<List<EventListItemDto>>> GetUserEventsByTypeAsync(Guid userId, EventType type);
    Task<ApiResponse<EventDto>> CreateAsync(Guid userId, CreateEventRequest request);

    /// <summary>
    /// إنشاء حدث كامل مع أقسامه ومكوناته في طلب واحد
    /// </summary>
    Task<ApiResponse<EventWithFullDetailsDto>> CreateWithSectionsAsync(Guid userId, CreateEventWithSectionsRequest request);

    Task<ApiResponse<EventDto>> UpdateAsync(Guid id, Guid userId, UpdateEventRequest request);

    /// <summary>
    /// تحديث حدث كامل مع أقسامه ومكوناته في طلب واحد
    /// </summary>
    Task<ApiResponse<EventWithFullDetailsDto>> UpdateWithSectionsAsync(Guid id, Guid userId, UpdateEventWithSectionsRequest request);

    /// <summary>
    /// تحديث حالة الحدث فقط دون المساس بالبيانات الأخرى
    /// </summary>
    Task<ApiResponse<EventDto>> UpdateStatusAsync(Guid id, Guid userId, EventStatus status);

    Task<ApiResponse> DeleteAsync(Guid id, Guid userId);
    Task<ApiResponse<EventDto>> DuplicateAsync(Guid id, Guid userId);
    Task<ApiResponse<EventDto>> PublishAsync(Guid id, Guid userId);
    Task<ApiResponse<EventDto>> CloseAsync(Guid id, Guid userId);
    Task<ApiResponse> IncrementViewCountAsync(Guid id);

    /// <summary>
    /// الحصول على إحصائيات لوحة التحكم
    /// </summary>
    Task<ApiResponse<DashboardStatsDto>> GetDashboardStatsAsync(Guid userId);

    /// <summary>
    /// إجراء السحب العشوائي للفائزين من المشاركين المؤهلين
    /// </summary>
    Task<ApiResponse<DrawResultDto>> DrawWinnersAsync(Guid eventId, Guid userId, int winnersCount, List<string>? winnerResponseIds = null);

    /// <summary>
    /// تحديث إعدادات مشاركة النتائج
    /// </summary>
    Task<ApiResponse<string>> UpdateResultsSharingAsync(Guid eventId, Guid userId, ShareResultsRequest request);

    /// <summary>
    /// الوصول للنتائج المشاركة (بدون مصادقة — عبر token + email)
    /// </summary>
    Task<ApiResponse<SharedResultsDataDto>> AccessSharedResultsAsync(string token, string email);
}


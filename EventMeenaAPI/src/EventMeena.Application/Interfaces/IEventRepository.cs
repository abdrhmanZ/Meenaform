using EventMeena.Domain.Entities;
using EventMeena.Domain.Enums;

namespace EventMeena.Application.Interfaces;

/// <summary>
/// Event Repository Interface
/// </summary>
public interface IEventRepository : IGenericRepository<Event>
{
    Task<Event?> GetByIdWithSectionsAsync(Guid id);
    Task<Event?> GetByIdWithFullDetailsAsync(Guid id);
    Task<Event?> GetByShareCodeAsync(string shareCode);
    Task<IReadOnlyList<Event>> GetByUserIdAsync(Guid userId);
    Task<IReadOnlyList<Event>> GetByUserIdWithCountsAsync(Guid userId);
    Task<IReadOnlyList<Event>> GetByUserIdAndStatusAsync(Guid userId, EventStatus status);
    Task<IReadOnlyList<Event>> GetByUserIdAndStatusWithCountsAsync(Guid userId, EventStatus status);
    Task<IReadOnlyList<Event>> GetByUserIdAndTypeAsync(Guid userId, EventType type);
    Task<IReadOnlyList<Event>> GetByUserIdAndTypeWithCountsAsync(Guid userId, EventType type);
    Task<bool> ShareCodeExistsAsync(string shareCode);
    Task IncrementViewCountAsync(Guid eventId);
    Task IncrementResponseCountAsync(Guid eventId);

    /// <summary>
    /// الحصول على عدد الأحداث المنشأة لكل يوم خلال فترة محددة
    /// </summary>
    Task<Dictionary<DateTime, int>> GetDailyEventCountsAsync(Guid userId, DateTime startDate, DateTime endDate);

    /// <summary>
    /// الحصول على إحصائيات الأحداث الإجمالية لمستخدم معين
    /// </summary>
    Task<(int totalViews, int totalResponses)> GetTotalStatsAsync(Guid userId);

    /// <summary>
    /// الحصول على عدد الأحداث خلال فترة محددة
    /// </summary>
    Task<int> GetEventsCountAsync(Guid userId, DateTime? startDate = null, DateTime? endDate = null);

    /// <summary>
    /// الحصول على عدد الأحداث لفترتين مختلفتين في استعلام واحد (للمقارنة)
    /// </summary>
    Task<(int currentCount, int previousCount)> GetEventsCountForPeriodsAsync(
        Guid userId, DateTime currentStart, DateTime currentEnd, DateTime previousStart, DateTime previousEnd);

    /// <summary>
    /// الحصول على الأحداث مع pagination على مستوى قاعدة البيانات
    /// </summary>
    Task<(IReadOnlyList<Event> Items, int TotalCount)> GetByUserIdPagedAsync(Guid userId, int pageNumber, int pageSize);
}


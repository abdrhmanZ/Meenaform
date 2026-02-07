using EventMeena.Application.DTOs.Responses;
using EventMeena.Domain.Entities;
using EventMeena.Domain.Enums;

namespace EventMeena.Application.Interfaces;

/// <summary>
/// Response Repository Interface
/// </summary>
public interface IResponseRepository : IGenericRepository<Response>
{
    Task<IReadOnlyList<Response>> GetByEventIdAsync(Guid eventId);
    Task<IReadOnlyList<Response>> GetByEventIdAndStatusAsync(Guid eventId, ResponseStatus status);
    Task<Response?> GetByEventIdAndEmailAsync(Guid eventId, string email);
    Task<Response?> GetByEventIdAndIpAsync(Guid eventId, string ipAddress);
    Task<Response?> GetCompletedByEventIdAndEmailAsync(Guid eventId, string email);
    Task<Response?> GetCompletedByEventIdAndIpAsync(Guid eventId, string ipAddress);
    Task<int> GetCompletedCountByEventIdAsync(Guid eventId);
    Task<double?> GetAverageScoreByEventIdAsync(Guid eventId);
    Task<IReadOnlyList<Response>> GetRecentByEventIdAsync(Guid eventId, int count);
    Task<ResponseStatsDto> GetEventStatsAsync(Guid eventId);
    Task DeleteByEventIdAsync(Guid eventId);

    /// <summary>
    /// الحصول على عدد الردود لكل يوم خلال فترة محددة لمستخدم معين
    /// </summary>
    Task<Dictionary<DateTime, int>> GetDailyResponseCountsAsync(Guid userId, DateTime startDate, DateTime endDate);

    /// <summary>
    /// الحصول على إجمالي الردود المكتملة لمستخدم معين خلال فترة محددة
    /// </summary>
    Task<int> GetCompletedResponsesCountAsync(Guid userId, DateTime? startDate = null, DateTime? endDate = null);

    /// <summary>
    /// الحصول على جميع الردود لإيميل معين مع تفاصيل الحدث
    /// </summary>
    Task<IReadOnlyList<Response>> GetByRespondentEmailWithEventAsync(string email);

    /// <summary>
    /// الحصول على الردود مع pagination على مستوى قاعدة البيانات
    /// </summary>
    Task<(IReadOnlyList<Response> Items, int TotalCount)> GetByEventIdPagedAsync(Guid eventId, int pageNumber, int pageSize);

    /// <summary>
    /// الحصول على متوسط نسبة الإكمال لعدة أحداث دفعة واحدة
    /// </summary>
    Task<Dictionary<Guid, double>> GetBulkCompletionRatesAsync(IEnumerable<Guid> eventIds);
}


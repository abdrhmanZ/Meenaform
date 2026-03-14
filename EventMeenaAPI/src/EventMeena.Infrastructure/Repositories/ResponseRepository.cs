using EventMeena.Application.Interfaces;
using EventMeena.Domain.Entities;
using EventMeena.Domain.Enums;
using EventMeena.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EventMeena.Infrastructure.Repositories;

/// <summary>
/// Response Repository Implementation
/// </summary>
public class ResponseRepository : GenericRepository<Response>, IResponseRepository
{
    public ResponseRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<Response>> GetByEventIdAsync(Guid eventId)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(r => r.EventId == eventId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<Response>> GetByEventIdAndStatusAsync(Guid eventId, ResponseStatus status)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(r => r.EventId == eventId && r.Status == status)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<Response?> GetByEventIdAndEmailAsync(Guid eventId, string email)
    {
        // SQL Server default collation is case-insensitive, no need for ToLower()
        return await _dbSet
            .FirstOrDefaultAsync(r => r.EventId == eventId &&
                r.RespondentEmail != null &&
                r.RespondentEmail == email);
    }

    public async Task<Response?> GetByEventIdAndIpAsync(Guid eventId, string ipAddress)
    {
        return await _dbSet
            .FirstOrDefaultAsync(r => r.EventId == eventId &&
                r.RespondentIp != null &&
                r.RespondentIp == ipAddress);
    }

    public async Task<Response?> GetCompletedByEventIdAndEmailAsync(Guid eventId, string email)
    {
        return await _dbSet
            .FirstOrDefaultAsync(r => r.EventId == eventId &&
                r.RespondentEmail != null &&
                r.RespondentEmail == email &&
                r.Status == ResponseStatus.Completed);
    }

    public async Task<Response?> GetCompletedByEventIdAndIpAsync(Guid eventId, string ipAddress)
    {
        return await _dbSet
            .FirstOrDefaultAsync(r => r.EventId == eventId &&
                r.RespondentIp != null &&
                r.RespondentIp == ipAddress &&
                r.Status == ResponseStatus.Completed);
    }

    public async Task<int> GetCompletedCountByEventIdAsync(Guid eventId)
    {
        return await _dbSet
            .CountAsync(r => r.EventId == eventId && r.Status == ResponseStatus.Completed);
    }

    public async Task<double?> GetAverageScoreByEventIdAsync(Guid eventId)
    {
        return await _dbSet
            .Where(r => r.EventId == eventId && r.Score.HasValue)
            .AverageAsync(r => (double?)r.Score);
    }

    public async Task<IReadOnlyList<Response>> GetRecentByEventIdAsync(Guid eventId, int count)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(r => r.EventId == eventId)
            .OrderByDescending(r => r.CreatedAt)
            .Take(count)
            .ToListAsync();
    }

    public async Task<Application.DTOs.Responses.ResponseStatsDto> GetEventStatsAsync(Guid eventId)
    {
        // SQL aggregation - يحسب كل شيء في قاعدة البيانات بدون تحميل البيانات في الذاكرة
        var query = _dbSet.Where(r => r.EventId == eventId);

        var stats = await query
            .GroupBy(r => 1)
            .Select(g => new
            {
                Total = g.Count(),
                Completed = g.Count(r => r.Status == ResponseStatus.Completed),
                InProgress = g.Count(r => r.Status == ResponseStatus.InProgress),
                AvgScore = g.Where(r => r.Score.HasValue).Average(r => (double?)r.Score) ?? 0,
                AvgDuration = g.Where(r => r.DurationSeconds.HasValue).Average(r => (double?)r.DurationSeconds) ?? 0,
                Passed = g.Count(r => r.IsPassed == true),
                Failed = g.Count(r => r.IsPassed == false)
            })
            .FirstOrDefaultAsync();

        if (stats == null)
        {
            return new Application.DTOs.Responses.ResponseStatsDto();
        }

        return new Application.DTOs.Responses.ResponseStatsDto
        {
            TotalResponses = stats.Total,
            CompletedResponses = stats.Completed,
            InProgressResponses = stats.InProgress,
            AverageScore = stats.AvgScore,
            AverageDurationSeconds = stats.AvgDuration,
            PassedCount = stats.Passed,
            FailedCount = stats.Failed,
            PassRate = stats.Completed > 0 ? (double)stats.Passed / stats.Completed * 100 : 0
        };
    }

    public async Task DeleteByEventIdAsync(Guid eventId)
    {
        // حذف مباشر في SQL بدون تحميل البيانات في الذاكرة
        await _dbSet.Where(r => r.EventId == eventId).ExecuteDeleteAsync();
    }

    public async Task<Dictionary<DateTime, int>> GetDailyResponseCountsAsync(Guid userId, DateTime startDate, DateTime endDate)
    {
        // ✅ لا نحتاج Include — EF Core يقدر يعمل JOIN تلقائياً في الـ Where
        var responses = await _dbSet
            .Where(r => r.Event.UserId == userId &&
                       r.Status == ResponseStatus.Completed &&
                       r.CompletedAt.HasValue &&
                       r.CompletedAt.Value >= startDate &&
                       r.CompletedAt.Value <= endDate)
            .Select(r => r.CompletedAt!.Value.Date)
            .ToListAsync();

        return responses
            .GroupBy(d => d)
            .ToDictionary(g => g.Key, g => g.Count());
    }

    public async Task<int> GetCompletedResponsesCountAsync(Guid userId, DateTime? startDate = null, DateTime? endDate = null)
    {
        // ✅ لا نحتاج Include — EF Core يقدر يعمل JOIN تلقائياً في الـ Where
        var query = _dbSet
            .Where(r => r.Event.UserId == userId && r.Status == ResponseStatus.Completed);

        if (startDate.HasValue)
            query = query.Where(r => r.CompletedAt.HasValue && r.CompletedAt.Value >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(r => r.CompletedAt.HasValue && r.CompletedAt.Value <= endDate.Value);

        return await query.CountAsync();
    }

    public async Task<IReadOnlyList<Response>> GetByRespondentEmailWithEventAsync(string email)
    {
        // List view: only need Event basic info + User name, no Sections/Components
        return await _dbSet
            .AsNoTracking()
            .Include(r => r.Event)
                .ThenInclude(e => e.User)
            .Where(r => r.RespondentEmail != null &&
                       r.RespondentEmail == email &&
                       r.Status == ResponseStatus.Completed)
            .OrderByDescending(r => r.CompletedAt ?? r.CreatedAt)
            .ToListAsync();
    }

    public async Task<Response?> GetByIdWithEventDetailsAsync(Guid responseId)
    {
        // Details view: need full Event with Sections + Components
        return await _dbSet
            .AsNoTracking()
            .Include(r => r.Event)
                .ThenInclude(e => e.User)
            .Include(r => r.Event)
                .ThenInclude(e => e.Sections.OrderBy(s => s.Order))
                    .ThenInclude(s => s.Components.OrderBy(c => c.Order))
            .FirstOrDefaultAsync(r => r.Id == responseId);
    }

    public async Task<(IReadOnlyList<Response> Items, int TotalCount)> GetByEventIdPagedAsync(Guid eventId, int pageNumber, int pageSize)
    {
        var totalCount = await _dbSet.CountAsync(r => r.EventId == eventId);

        var items = await _dbSet
            .AsNoTracking()
            .Where(r => r.EventId == eventId)
            .OrderByDescending(r => r.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<Dictionary<Guid, double>> GetBulkCompletionRatesAsync(IEnumerable<Guid> eventIds)
    {
        var eventIdList = eventIds.ToList();

        var stats = await _dbSet
            .Where(r => eventIdList.Contains(r.EventId))
            .GroupBy(r => r.EventId)
            .Select(g => new
            {
                EventId = g.Key,
                Total = g.Count(),
                Completed = g.Count(r => r.Status == ResponseStatus.Completed)
            })
            .ToListAsync();

        return stats.ToDictionary(
            s => s.EventId,
            s => s.Total > 0 ? (double)s.Completed / s.Total * 100 : 0
        );
    }

    public async Task<(int currentCount, int previousCount)> GetCompletedResponsesCountForPeriodsAsync(
        Guid userId, DateTime currentStart, DateTime currentEnd, DateTime previousStart, DateTime previousEnd)
    {
        var counts = await _dbSet
            .Where(r => r.Event.UserId == userId && r.Status == ResponseStatus.Completed && r.CompletedAt.HasValue)
            .GroupBy(r => 1)
            .Select(g => new
            {
                CurrentCount = g.Count(r => r.CompletedAt!.Value >= currentStart && r.CompletedAt!.Value <= currentEnd),
                PreviousCount = g.Count(r => r.CompletedAt!.Value >= previousStart && r.CompletedAt!.Value <= previousEnd)
            })
            .FirstOrDefaultAsync();

        return counts != null ? (counts.CurrentCount, counts.PreviousCount) : (0, 0);
    }

    public async Task<Dictionary<Guid, int>> GetBulkCompletedCountsAsync(IEnumerable<Guid> eventIds)
    {
        var eventIdList = eventIds.ToList();

        var counts = await _dbSet
            .Where(r => eventIdList.Contains(r.EventId) && r.Status == ResponseStatus.Completed)
            .GroupBy(r => r.EventId)
            .Select(g => new { EventId = g.Key, Count = g.Count() })
            .ToListAsync();

        return counts.ToDictionary(c => c.EventId, c => c.Count);
    }

    /// <summary>
    /// جلب الردود المكتملة لحدث (خفيف — بدون AnswersJson) للسحب العشوائي
    /// </summary>
    public async Task<IReadOnlyList<Response>> GetCompletedForDrawAsync(Guid eventId)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(r => r.EventId == eventId && r.Status == ResponseStatus.Completed)
            .Select(r => new Response
            {
                Id = r.Id,
                EventId = r.EventId,
                Status = r.Status,
                RespondentName = r.RespondentName,
                RespondentEmail = r.RespondentEmail,
                Score = r.Score,
                TotalPoints = r.TotalPoints,
                Percentage = r.Percentage,
            })
            .ToListAsync();
    }
}


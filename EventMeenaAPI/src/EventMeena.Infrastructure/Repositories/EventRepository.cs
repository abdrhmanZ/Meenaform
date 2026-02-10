using EventMeena.Application.Interfaces;
using EventMeena.Domain.Entities;
using EventMeena.Domain.Enums;
using EventMeena.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EventMeena.Infrastructure.Repositories;

/// <summary>
/// Event Repository Implementation
/// </summary>
public class EventRepository : GenericRepository<Event>, IEventRepository
{
    public EventRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Event?> GetByIdWithSectionsAsync(Guid id)
    {
        return await _dbSet
            .Include(e => e.Sections.OrderBy(s => s.Order))
            .FirstOrDefaultAsync(e => e.Id == id);
    }

    public async Task<Event?> GetByIdWithFullDetailsAsync(Guid id)
    {
        return await _dbSet
            .Include(e => e.Sections.OrderBy(s => s.Order))
                .ThenInclude(s => s.Components.OrderBy(c => c.Order))
            .FirstOrDefaultAsync(e => e.Id == id);
    }

    public async Task<Event?> GetByShareCodeAsync(string shareCode)
    {
        return await _dbSet
            .Include(e => e.Sections.OrderBy(s => s.Order))
                .ThenInclude(s => s.Components.OrderBy(c => c.Order))
            .FirstOrDefaultAsync(e => e.ShareCode == shareCode);
    }

    public async Task<IReadOnlyList<Event>> GetByUserIdAsync(Guid userId)
    {
        return await _dbSet
            .Where(e => e.UserId == userId)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<Event>> GetByUserIdWithCountsAsync(Guid userId)
    {
        return await _dbSet
            .Include(e => e.Sections)
                .ThenInclude(s => s.Components)
            .Include(e => e.SignatureFields)
                .ThenInclude(sf => sf.Signatures)
            .Where(e => e.UserId == userId)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<Event>> GetByUserIdAndStatusAsync(Guid userId, EventStatus status)
    {
        return await _dbSet
            .Where(e => e.UserId == userId && e.Status == status)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<Event>> GetByUserIdAndStatusWithCountsAsync(Guid userId, EventStatus status)
    {
        return await _dbSet
            .Include(e => e.Sections)
                .ThenInclude(s => s.Components)
            .Include(e => e.SignatureFields)
                .ThenInclude(sf => sf.Signatures)
            .Where(e => e.UserId == userId && e.Status == status)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<Event>> GetByUserIdAndTypeAsync(Guid userId, EventType type)
    {
        return await _dbSet
            .Where(e => e.UserId == userId && e.Type == type)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<Event>> GetByUserIdAndTypeWithCountsAsync(Guid userId, EventType type)
    {
        return await _dbSet
            .Include(e => e.Sections)
                .ThenInclude(s => s.Components)
            .Include(e => e.SignatureFields)
                .ThenInclude(sf => sf.Signatures)
            .Where(e => e.UserId == userId && e.Type == type)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();
    }

    public async Task<bool> ShareCodeExistsAsync(string shareCode)
    {
        return await _dbSet.AnyAsync(e => e.ShareCode == shareCode);
    }

    public async Task IncrementViewCountAsync(Guid eventId)
    {
        await _context.Database.ExecuteSqlRawAsync(
            "UPDATE Events SET ViewCount = ViewCount + 1 WHERE Id = {0}", eventId);
    }

    public async Task IncrementResponseCountAsync(Guid eventId)
    {
        await _context.Database.ExecuteSqlRawAsync(
            "UPDATE Events SET ResponseCount = ResponseCount + 1 WHERE Id = {0}", eventId);
    }

    public async Task<Dictionary<DateTime, int>> GetDailyEventCountsAsync(Guid userId, DateTime startDate, DateTime endDate)
    {
        var events = await _dbSet
            .Where(e => e.UserId == userId && e.CreatedAt >= startDate && e.CreatedAt <= endDate)
            .Select(e => e.CreatedAt.Date)
            .ToListAsync();

        return events
            .GroupBy(d => d)
            .ToDictionary(g => g.Key, g => g.Count());
    }

    public async Task<(int totalViews, int totalResponses)> GetTotalStatsAsync(Guid userId)
    {
        var stats = await _dbSet
            .Where(e => e.UserId == userId)
            .GroupBy(e => 1)
            .Select(g => new
            {
                TotalViews = g.Sum(e => e.ViewCount),
                TotalResponses = g.Sum(e => e.ResponseCount)
            })
            .FirstOrDefaultAsync();

        return stats != null ? (stats.TotalViews, stats.TotalResponses) : (0, 0);
    }

    public async Task<int> GetEventsCountAsync(Guid userId, DateTime? startDate = null, DateTime? endDate = null)
    {
        var query = _dbSet.Where(e => e.UserId == userId);

        if (startDate.HasValue)
            query = query.Where(e => e.CreatedAt >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(e => e.CreatedAt <= endDate.Value);

        return await query.CountAsync();
    }

    public async Task<(int currentCount, int previousCount)> GetEventsCountForPeriodsAsync(
        Guid userId, DateTime currentStart, DateTime currentEnd, DateTime previousStart, DateTime previousEnd)
    {
        var counts = await _dbSet
            .Where(e => e.UserId == userId)
            .GroupBy(e => 1)
            .Select(g => new
            {
                CurrentCount = g.Count(e => e.CreatedAt >= currentStart && e.CreatedAt <= currentEnd),
                PreviousCount = g.Count(e => e.CreatedAt >= previousStart && e.CreatedAt <= previousEnd)
            })
            .FirstOrDefaultAsync();

        return counts != null ? (counts.CurrentCount, counts.PreviousCount) : (0, 0);
    }

    public async Task<(IReadOnlyList<Event> Items, int TotalCount)> GetByUserIdPagedAsync(Guid userId, int pageNumber, int pageSize)
    {
        var totalCount = await _dbSet.CountAsync(e => e.UserId == userId);

        // لا نجلب Responses لأنها ثقيلة (AnswersJson كبير) - نجلب العدد بشكل منفصل
        var items = await _dbSet
            .Include(e => e.Sections)
                .ThenInclude(s => s.Components)
            .Include(e => e.SignatureFields)
                .ThenInclude(sf => sf.Signatures)
            .Where(e => e.UserId == userId)
            .OrderByDescending(e => e.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }
}


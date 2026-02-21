using EventMeena.Application.Interfaces;
using EventMeena.Domain.Entities;
using EventMeena.Domain.Enums;
using EventMeena.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EventMeena.Infrastructure.Repositories;

/// <summary>
/// UserTemplate Repository Implementation
/// </summary>
public class UserTemplateRepository : GenericRepository<UserTemplate>, IUserTemplateRepository
{
    public UserTemplateRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<UserTemplate>> GetByUserIdAsync(Guid userId)
    {
        return await _dbSet
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<UserTemplate>> GetByUserIdAndTypeAsync(Guid userId, EventType type)
    {
        return await _dbSet
            .Where(t => t.UserId == userId && t.Type == type)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<UserTemplate>> GetPublicTemplatesAsync()
    {
        return await _dbSet
            .Where(t => t.IsPublic)
            .OrderByDescending(t => t.UsageCount)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<UserTemplate>> GetPublicTemplatesByTypeAsync(EventType type)
    {
        return await _dbSet
            .Where(t => t.IsPublic && t.Type == type)
            .OrderByDescending(t => t.UsageCount)
            .ToListAsync();
    }

    public async Task IncrementUsageCountAsync(Guid templateId)
    {
        await _context.Database.ExecuteSqlRawAsync(
            "UPDATE \"UserTemplates\" SET \"UsageCount\" = \"UsageCount\" + 1 WHERE \"Id\" = {0}", templateId);
    }
}


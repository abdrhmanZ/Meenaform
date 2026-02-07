using EventMeena.Application.Interfaces;
using EventMeena.Domain.Entities;
using EventMeena.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EventMeena.Infrastructure.Repositories;

/// <summary>
/// Group Repository Implementation
/// </summary>
public class GroupRepository : GenericRepository<Group>, IGroupRepository
{
    public GroupRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<Group>> GetByUserIdAsync(Guid userId)
    {
        return await _dbSet
            .Include(g => g.ContactGroups)
                .ThenInclude(cg => cg.Contact)
            .Where(g => g.UserId == userId && g.IsActive)
            .OrderBy(g => g.Name)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<Group>> GetByUserIdWithContactsAsync(Guid userId)
    {
        return await _dbSet
            .Include(g => g.ContactGroups)
                .ThenInclude(cg => cg.Contact)
            .Where(g => g.UserId == userId && g.IsActive)
            .OrderBy(g => g.Name)
            .ToListAsync();
    }

    public async Task<Group?> GetByIdWithContactsAsync(Guid id)
    {
        return await _dbSet
            .Include(g => g.ContactGroups)
                .ThenInclude(cg => cg.Contact)
            .FirstOrDefaultAsync(g => g.Id == id);
    }

    public async Task<int> GetContactCountAsync(Guid groupId)
    {
        return await _context.ContactGroups
            .CountAsync(cg => cg.GroupId == groupId);
    }
}


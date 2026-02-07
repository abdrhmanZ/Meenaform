using EventMeena.Application.Interfaces;
using EventMeena.Domain.Entities;
using EventMeena.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EventMeena.Infrastructure.Repositories;

/// <summary>
/// Contact Repository Implementation
/// </summary>
public class ContactRepository : GenericRepository<Contact>, IContactRepository
{
    public ContactRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<Contact>> GetByUserIdAsync(Guid userId)
    {
        return await _dbSet
            .Include(c => c.SendHistories)
            .Where(c => c.UserId == userId && c.IsActive)
            .OrderBy(c => c.Name)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<Contact>> GetByUserIdWithGroupsAsync(Guid userId)
    {
        return await _dbSet
            .Include(c => c.ContactGroups)
                .ThenInclude(cg => cg.Group)
            .Include(c => c.SendHistories)
            .Where(c => c.UserId == userId && c.IsActive)
            .OrderBy(c => c.Name)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<Contact>> GetByGroupIdAsync(Guid groupId)
    {
        return await _context.ContactGroups
            .Where(cg => cg.GroupId == groupId)
            .Select(cg => cg.Contact)
            .Where(c => c.IsActive)
            .OrderBy(c => c.Name)
            .ToListAsync();
    }

    public async Task<Contact?> GetByEmailAndUserIdAsync(string email, Guid userId)
    {
        // SQL Server default collation is case-insensitive, no need for ToLower()
        return await _dbSet
            .FirstOrDefaultAsync(c => c.Email != null &&
                c.Email == email &&
                c.UserId == userId);
    }

    public async Task<bool> ExistsByEmailAndUserIdAsync(string email, Guid userId)
    {
        return await _dbSet
            .AnyAsync(c => c.Email != null &&
                c.Email == email &&
                c.UserId == userId);
    }

    public async Task<IReadOnlyList<Contact>> SearchAsync(Guid userId, string searchTerm)
    {
        return await _dbSet
            .Where(c => c.UserId == userId && c.IsActive &&
                (c.Name.Contains(searchTerm) ||
                 (c.Email != null && c.Email.Contains(searchTerm)) ||
                 (c.Phone != null && c.Phone.Contains(searchTerm)) ||
                 (c.Company != null && c.Company.Contains(searchTerm))))
            .OrderBy(c => c.Name)
            .ToListAsync();
    }

    public async Task<(IReadOnlyList<Contact> Items, int TotalCount)> GetByUserIdPagedAsync(Guid userId, int pageNumber, int pageSize)
    {
        var totalCount = await _dbSet.CountAsync(c => c.UserId == userId && c.IsActive);

        var items = await _dbSet
            .Include(c => c.ContactGroups)
                .ThenInclude(cg => cg.Group)
            .Where(c => c.UserId == userId && c.IsActive)
            .OrderBy(c => c.Name)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }
}


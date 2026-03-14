using EventMeena.Application.Interfaces;
using EventMeena.Domain.Entities;
using EventMeena.Domain.Enums;
using EventMeena.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EventMeena.Infrastructure.Repositories;

/// <summary>
/// Event Collaborator Repository Implementation
/// </summary>
public class EventCollaboratorRepository : GenericRepository<EventCollaborator>, IEventCollaboratorRepository
{
    public EventCollaboratorRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<EventCollaborator>> GetByEventIdAsync(Guid eventId)
    {
        return await _dbSet
            .Include(ec => ec.User)
            .Where(ec => ec.EventId == eventId)
            .OrderBy(ec => ec.CreatedAt)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<EventCollaborator>> GetByUserIdAsync(Guid userId)
    {
        return await _dbSet
            .Include(ec => ec.Event)
            .Where(ec => ec.UserId == userId)
            .OrderByDescending(ec => ec.CreatedAt)
            .ToListAsync();
    }

    public async Task<EventCollaborator?> GetByEventAndUserAsync(Guid eventId, Guid userId)
    {
        return await _dbSet
            .Include(ec => ec.User)
            .FirstOrDefaultAsync(ec => ec.EventId == eventId && ec.UserId == userId);
    }

    public async Task<bool> IsCollaboratorAsync(Guid eventId, Guid userId)
    {
        return await _dbSet
            .AnyAsync(ec => ec.EventId == eventId && ec.UserId == userId);
    }

    public async Task<CollaboratorRole?> GetRoleAsync(Guid eventId, Guid userId)
    {
        var collaborator = await _dbSet
            .FirstOrDefaultAsync(ec => ec.EventId == eventId && ec.UserId == userId);

        return collaborator?.Role;
    }
}

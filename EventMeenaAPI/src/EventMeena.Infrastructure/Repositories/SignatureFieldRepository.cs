using EventMeena.Application.Interfaces;
using EventMeena.Domain.Entities;
using EventMeena.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EventMeena.Infrastructure.Repositories;

/// <summary>
/// Signature Field Repository Implementation
/// </summary>
public class SignatureFieldRepository : GenericRepository<SignatureField>, ISignatureFieldRepository
{
    public SignatureFieldRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<SignatureField>> GetByEventIdAsync(Guid eventId)
    {
        return await _dbSet
            .Where(sf => sf.EventId == eventId)
            .OrderBy(sf => sf.Order)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<SignatureField>> GetByEventIdWithSignaturesAsync(Guid eventId)
    {
        return await _dbSet
            .Include(sf => sf.Signatures)
            .Where(sf => sf.EventId == eventId)
            .OrderBy(sf => sf.Order)
            .ToListAsync();
    }

    public async Task DeleteByEventIdAsync(Guid eventId)
    {
        var fields = await _dbSet.Where(sf => sf.EventId == eventId).ToListAsync();
        _dbSet.RemoveRange(fields);
    }
}


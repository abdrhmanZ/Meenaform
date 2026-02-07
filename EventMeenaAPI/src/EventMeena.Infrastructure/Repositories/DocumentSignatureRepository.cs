using EventMeena.Application.Interfaces;
using EventMeena.Domain.Entities;
using EventMeena.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EventMeena.Infrastructure.Repositories;

/// <summary>
/// Document Signature Repository Implementation
/// </summary>
public class DocumentSignatureRepository : GenericRepository<DocumentSignature>, IDocumentSignatureRepository
{
    public DocumentSignatureRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<DocumentSignature>> GetBySignatureFieldIdAsync(Guid signatureFieldId)
    {
        return await _dbSet
            .Where(ds => ds.SignatureFieldId == signatureFieldId)
            .OrderByDescending(ds => ds.SignedAt)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<DocumentSignature>> GetByResponseIdAsync(Guid responseId)
    {
        return await _dbSet
            .Include(ds => ds.SignatureField)
            .Where(ds => ds.ResponseId == responseId)
            .OrderBy(ds => ds.SignatureField.Order)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<DocumentSignature>> GetByEventIdAsync(Guid eventId)
    {
        return await _dbSet
            .Include(ds => ds.SignatureField)
            .Where(ds => ds.SignatureField.EventId == eventId)
            .OrderByDescending(ds => ds.SignedAt)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<DocumentSignature>> GetByEventIdWithFieldInfoAsync(Guid eventId)
    {
        return await _dbSet
            .Include(ds => ds.SignatureField)
            .Include(ds => ds.Response)
            .Where(ds => ds.SignatureField.EventId == eventId)
            .OrderByDescending(ds => ds.SignedAt)
            .ToListAsync();
    }

    public async Task<bool> ExistsAsync(Guid signatureFieldId, Guid responseId)
    {
        return await _dbSet.AnyAsync(ds => 
            ds.SignatureFieldId == signatureFieldId && 
            ds.ResponseId == responseId);
    }
}


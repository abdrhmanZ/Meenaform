using EventMeena.Domain.Entities;

namespace EventMeena.Application.Interfaces;

/// <summary>
/// Signature Field Repository Interface
/// </summary>
public interface ISignatureFieldRepository : IGenericRepository<SignatureField>
{
    /// <summary>
    /// الحصول على جميع حقول التوقيع لحدث معين
    /// </summary>
    Task<IReadOnlyList<SignatureField>> GetByEventIdAsync(Guid eventId);

    /// <summary>
    /// الحصول على حقول التوقيع مع التوقيعات
    /// </summary>
    Task<IReadOnlyList<SignatureField>> GetByEventIdWithSignaturesAsync(Guid eventId);

    /// <summary>
    /// حذف جميع حقول التوقيع لحدث معين
    /// </summary>
    Task DeleteByEventIdAsync(Guid eventId);
}


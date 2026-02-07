using EventMeena.Domain.Entities;

namespace EventMeena.Application.Interfaces;

/// <summary>
/// Document Signature Repository Interface
/// </summary>
public interface IDocumentSignatureRepository : IGenericRepository<DocumentSignature>
{
    /// <summary>
    /// الحصول على جميع التوقيعات لحقل توقيع معين
    /// </summary>
    Task<IReadOnlyList<DocumentSignature>> GetBySignatureFieldIdAsync(Guid signatureFieldId);

    /// <summary>
    /// الحصول على جميع التوقيعات لرد معين
    /// </summary>
    Task<IReadOnlyList<DocumentSignature>> GetByResponseIdAsync(Guid responseId);

    /// <summary>
    /// الحصول على جميع التوقيعات لحدث معين
    /// </summary>
    Task<IReadOnlyList<DocumentSignature>> GetByEventIdAsync(Guid eventId);

    /// <summary>
    /// الحصول على التوقيعات مع معلومات الحقل
    /// </summary>
    Task<IReadOnlyList<DocumentSignature>> GetByEventIdWithFieldInfoAsync(Guid eventId);

    /// <summary>
    /// التحقق من وجود توقيع لحقل معين ورد معين
    /// </summary>
    Task<bool> ExistsAsync(Guid signatureFieldId, Guid responseId);
}


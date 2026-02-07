using EventMeena.Domain.Common;

namespace EventMeena.Domain.Entities;

/// <summary>
/// التوقيع الفعلي من المشارك على حقل توقيع معين
/// </summary>
public class DocumentSignature : AuditableEntity
{
    /// <summary>
    /// معرف حقل التوقيع
    /// </summary>
    public Guid SignatureFieldId { get; set; }

    /// <summary>
    /// معرف الرد (Response) المرتبط
    /// </summary>
    public Guid ResponseId { get; set; }

    /// <summary>
    /// اسم الموقّع
    /// </summary>
    public string SignerName { get; set; } = string.Empty;

    /// <summary>
    /// البريد الإلكتروني للموقّع
    /// </summary>
    public string SignerEmail { get; set; } = string.Empty;

    /// <summary>
    /// رقم جوال الموقّع (اختياري)
    /// </summary>
    public string? SignerPhone { get; set; }

    /// <summary>
    /// بيانات التوقيع (Base64 encoded image)
    /// </summary>
    public string SignatureData { get; set; } = string.Empty;

    /// <summary>
    /// تاريخ ووقت التوقيع
    /// </summary>
    public DateTime SignedAt { get; set; }

    /// <summary>
    /// عنوان IP للموقّع (للتوثيق)
    /// </summary>
    public string? IpAddress { get; set; }

    /// <summary>
    /// معلومات المتصفح/الجهاز (للتوثيق)
    /// </summary>
    public string? UserAgent { get; set; }

    // Navigation Properties
    public virtual SignatureField SignatureField { get; set; } = null!;
    public virtual Response Response { get; set; } = null!;
}


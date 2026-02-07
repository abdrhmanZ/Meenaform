namespace EventMeena.Application.DTOs.DocumentSigning;

/// <summary>
/// DTO للتوقيع الفعلي
/// </summary>
public class DocumentSignatureDto
{
    public Guid Id { get; set; }
    public Guid SignatureFieldId { get; set; }
    public Guid ResponseId { get; set; }
    public string SignerName { get; set; } = string.Empty;
    public string SignerEmail { get; set; } = string.Empty;
    public string? SignerPhone { get; set; }
    public string SignatureData { get; set; } = string.Empty;
    public DateTime SignedAt { get; set; }

    // معلومات إضافية عن الحقل
    public string? FieldLabel { get; set; }
    public int? PageNumber { get; set; }
}

/// <summary>
/// DTO لإرسال توقيع جديد
/// </summary>
public class SubmitSignatureRequest
{
    public Guid SignatureFieldId { get; set; }
    public string SignerName { get; set; } = string.Empty;
    public string SignerEmail { get; set; } = string.Empty;
    public string? SignerPhone { get; set; }
    public string SignatureData { get; set; } = string.Empty;
}

/// <summary>
/// DTO لإرسال جميع التوقيعات مرة واحدة
/// </summary>
public class SubmitAllSignaturesRequest
{
    public Guid EventId { get; set; }
    public Guid ResponseId { get; set; }
    public string SignerName { get; set; } = string.Empty;
    public string SignerEmail { get; set; } = string.Empty;
    public string? SignerPhone { get; set; }
    public List<SignatureDataItem> Signatures { get; set; } = new();
}

/// <summary>
/// عنصر توقيع فردي
/// </summary>
public class SignatureDataItem
{
    public Guid SignatureFieldId { get; set; }
    public string SignatureData { get; set; } = string.Empty;
}


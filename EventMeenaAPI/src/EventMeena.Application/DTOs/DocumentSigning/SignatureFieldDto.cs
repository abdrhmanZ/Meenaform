namespace EventMeena.Application.DTOs.DocumentSigning;

/// <summary>
/// DTO لحقل التوقيع
/// </summary>
public class SignatureFieldDto
{
    public Guid Id { get; set; }
    public Guid EventId { get; set; }
    public string Label { get; set; } = string.Empty;
    public int PageNumber { get; set; }
    public double PositionX { get; set; }
    public double PositionY { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
    public bool IsRequired { get; set; }
    public int Order { get; set; }
    public string FieldType { get; set; } = "signature";
    public bool IncludeDate { get; set; }
    public bool IncludeName { get; set; }
    /// <summary>
    /// إيميل الموقّع المخصص لهذا الحقل (يُستخدم فقط في وضع multi-signer)
    /// </summary>
    public string? AssignedEmail { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO لإنشاء حقل توقيع
/// </summary>
public class CreateSignatureFieldRequest
{
    public string Label { get; set; } = string.Empty;
    public int PageNumber { get; set; }
    public double PositionX { get; set; }
    public double PositionY { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
    public bool IsRequired { get; set; } = true;
    public int Order { get; set; }
    public string FieldType { get; set; } = "signature";
    public bool IncludeDate { get; set; } = false;
    public bool IncludeName { get; set; } = false;
    /// <summary>
    /// إيميل الموقّع المخصص لهذا الحقل (يُستخدم فقط في وضع multi-signer)
    /// </summary>
    public string? AssignedEmail { get; set; }
}

/// <summary>
/// DTO لتحديث حقل توقيع
/// </summary>
public class UpdateSignatureFieldRequest
{
    public Guid Id { get; set; }
    public string Label { get; set; } = string.Empty;
    public int PageNumber { get; set; }
    public double PositionX { get; set; }
    public double PositionY { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
    public bool IsRequired { get; set; }
    public int Order { get; set; }
    public string FieldType { get; set; } = "signature";
    public bool IncludeDate { get; set; }
    public bool IncludeName { get; set; }
    /// <summary>
    /// إيميل الموقّع المخصص لهذا الحقل (يُستخدم فقط في وضع multi-signer)
    /// </summary>
    public string? AssignedEmail { get; set; }
}


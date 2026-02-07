namespace EventMeena.Application.DTOs.DocumentSigning;

/// <summary>
/// DTO لإنشاء حدث توقيع وثيقة
/// </summary>
public class CreateDocumentEventRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? CoverImage { get; set; }
    public string? ThemeColor { get; set; }
    public string Language { get; set; } = "ar";

    // إعدادات الوقت
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    // إعدادات المشاركة
    public bool RequireLogin { get; set; } = false;
    public bool AllowAnonymous { get; set; } = true;
    public int? MaxResponses { get; set; }
    public bool AllowMultipleResponses { get; set; } = false;

    // إعدادات الحدث الخاص
    public bool IsPrivate { get; set; } = false;
    public List<string>? AllowedEmails { get; set; }

    // إعدادات التوقيع
    public bool AllowDownloadAfterSigning { get; set; } = true;
    public bool SendCopyToSigner { get; set; } = false;
    public string? ThankYouMessage { get; set; }

    // حقول التوقيع
    public List<CreateSignatureFieldRequest> SignatureFields { get; set; } = new();
}

/// <summary>
/// DTO لإنشاء حدث توقيع وثيقة مع URL الوثيقة (بعد رفعها مسبقاً)
/// </summary>
public class CreateDocumentEventWithUrlRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string DocumentUrl { get; set; } = string.Empty;
    public string DocumentFileName { get; set; } = string.Empty;

    // إعدادات الوصول (مفعّلة تلقائياً للتوقيعات)
    public bool RequireLogin { get; set; } = true;
    public bool IsPrivate { get; set; } = true;
    public List<string>? AllowedEmails { get; set; }

    // إعدادات التوقيع
    public bool AllowDownloadAfterSigning { get; set; } = true;
    public bool SendCopyToSigner { get; set; } = false;

    /// <summary>
    /// طريقة عرض التوقيع للمشارك
    /// inside = التوقيع داخل الـ PDF (الوضع الافتراضي)
    /// outside = التوقيع خارج الـ PDF (في خانة منفصلة أسفله)
    /// </summary>
    public string SignatureDisplayMode { get; set; } = "inside";

    /// <summary>
    /// نوع التوقيع
    /// single = موقّع واحد (النظام الحالي)
    /// multi = أكثر من موقّع (كل حقل مخصص لإيميل معين)
    /// </summary>
    public string SigningMode { get; set; } = "single";

    // حقول التوقيع
    public List<CreateSignatureFieldRequest> SignatureFields { get; set; } = new();
}

/// <summary>
/// DTO لتحديث حدث توقيع وثيقة
/// </summary>
public class UpdateDocumentEventRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? CoverImage { get; set; }
    public string? ThemeColor { get; set; }
    public string Language { get; set; } = "ar";

    // إعدادات الوقت
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    // إعدادات المشاركة
    public bool RequireLogin { get; set; }
    public bool AllowAnonymous { get; set; }
    public int? MaxResponses { get; set; }
    public bool AllowMultipleResponses { get; set; }

    // إعدادات الحدث الخاص
    public bool IsPrivate { get; set; }
    public List<string>? AllowedEmails { get; set; }

    // إعدادات التوقيع
    public bool AllowDownloadAfterSigning { get; set; }
    public bool SendCopyToSigner { get; set; }
    public string? ThankYouMessage { get; set; }
    public string? SignatureDisplayMode { get; set; }
    /// <summary>
    /// نوع التوقيع (لا يمكن تغييره بعد الإنشاء)
    /// </summary>
    public string? SigningMode { get; set; }

    // حقول التوقيع (الكاملة - ستستبدل الموجودة)
    public List<UpdateSignatureFieldRequest> SignatureFields { get; set; } = new();
}


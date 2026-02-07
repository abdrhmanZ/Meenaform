using EventMeena.Domain.Common;
using EventMeena.Domain.Enums;

namespace EventMeena.Domain.Entities;

/// <summary>
/// كيان الحدث (استبيان، اختبار، نموذج، حدث)
/// </summary>
public class Event : AuditableEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public EventType Type { get; set; }
    public EventStatus Status { get; set; } = EventStatus.Published; // نشط افتراضياً

    // الإعدادات العامة
    public string? CoverImage { get; set; }
    public string? ThemeColor { get; set; }
    public string? Language { get; set; } = "ar";

    // إعدادات الوقت
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? TimeLimitMinutes { get; set; }

    // إعدادات المشاركة
    public string ShareCode { get; set; } = string.Empty;
    public string? ShareLink { get; set; }
    public bool RequireLogin { get; set; } = false;
    public bool AllowAnonymous { get; set; } = true;
    public int? MaxResponses { get; set; }
    public bool AllowMultipleResponses { get; set; } = false;
    public bool AllowEditResponses { get; set; } = false;

    // إعدادات الحدث الخاص (Private Event)
    public bool IsPrivate { get; set; } = false;
    public string? AllowedEmailsJson { get; set; } // قائمة الإيميلات المسموح لها بالدخول (JSON Array)

    // إعدادات الاختبار (Quiz)
    public bool ShowResults { get; set; } = true;
    public bool ShowCorrectAnswers { get; set; } = true;
    public bool ShuffleQuestions { get; set; } = false;
    public bool ShuffleOptions { get; set; } = false;
    public int? PassingScore { get; set; }

    // رسائل الشكر والنتائج
    public string? ThankYouMessage { get; set; }
    public string? SuccessMessage { get; set; }
    public string? GoodMessage { get; set; }
    public string? ImprovementMessage { get; set; }

    // إعدادات توقيع الوثائق (Document Signing)
    /// <summary>
    /// رابط ملف PDF المرفوع (لأحداث توقيع الوثائق)
    /// </summary>
    public string? DocumentUrl { get; set; }

    /// <summary>
    /// اسم ملف PDF الأصلي
    /// </summary>
    public string? DocumentFileName { get; set; }

    /// <summary>
    /// السماح للموقّع بتحميل نسخة بعد التوقيع
    /// </summary>
    public bool AllowDownloadAfterSigning { get; set; } = true;

    /// <summary>
    /// إرسال نسخة للموقّع بالبريد الإلكتروني بعد التوقيع
    /// </summary>
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

    // إحصائيات
    public int ViewCount { get; set; } = 0;
    public int ResponseCount { get; set; } = 0;

    // المالك
    public Guid UserId { get; set; }

    // Navigation Properties
    public virtual User User { get; set; } = null!;
    public virtual ICollection<Section> Sections { get; set; } = new List<Section>();
    public virtual ICollection<Response> Responses { get; set; } = new List<Response>();
    public virtual ICollection<SendHistory> SendHistories { get; set; } = new List<SendHistory>();
    public virtual ICollection<SignatureField> SignatureFields { get; set; } = new List<SignatureField>();
}


using EventMeena.Domain.Common;

namespace EventMeena.Domain.Entities;

/// <summary>
/// حقل التوقيع - يحدد موقع التوقيع على صفحة PDF
/// </summary>
public class SignatureField : AuditableEntity
{
    /// <summary>
    /// معرف الحدث المرتبط
    /// </summary>
    public Guid EventId { get; set; }

    /// <summary>
    /// تسمية الحقل (مثل: توقيع الموظف، توقيع المدير)
    /// </summary>
    public string Label { get; set; } = string.Empty;

    /// <summary>
    /// رقم الصفحة في PDF (تبدأ من 1)
    /// </summary>
    public int PageNumber { get; set; }

    /// <summary>
    /// الموقع الأفقي (X) بالنسبة المئوية من عرض الصفحة (0-100)
    /// </summary>
    public double PositionX { get; set; }

    /// <summary>
    /// الموقع الرأسي (Y) بالنسبة المئوية من ارتفاع الصفحة (0-100)
    /// </summary>
    public double PositionY { get; set; }

    /// <summary>
    /// عرض حقل التوقيع بالنسبة المئوية من عرض الصفحة
    /// </summary>
    public double Width { get; set; }

    /// <summary>
    /// ارتفاع حقل التوقيع بالنسبة المئوية من ارتفاع الصفحة
    /// </summary>
    public double Height { get; set; }

    /// <summary>
    /// هل الحقل مطلوب؟
    /// </summary>
    public bool IsRequired { get; set; } = true;

    /// <summary>
    /// ترتيب الحقل (للعرض)
    /// </summary>
    public int Order { get; set; }

    /// <summary>
    /// نوع الحقل (signature, date, name, text)
    /// </summary>
    public string FieldType { get; set; } = "signature";

    /// <summary>
    /// إضافة التاريخ تلقائياً بجانب التوقيع
    /// </summary>
    public bool IncludeDate { get; set; } = false;

    /// <summary>
    /// إضافة اسم الموقع تلقائياً بجانب التوقيع
    /// </summary>
    public bool IncludeName { get; set; } = false;

    /// <summary>
    /// إيميل الموقّع المخصص لهذا الحقل (يُستخدم فقط في وضع multi-signer)
    /// إذا كان null أو فارغ، يمكن لأي شخص التوقيع على هذا الحقل
    /// </summary>
    public string? AssignedEmail { get; set; }

    // Navigation Properties
    public virtual Event Event { get; set; } = null!;
    public virtual ICollection<DocumentSignature> Signatures { get; set; } = new List<DocumentSignature>();
}


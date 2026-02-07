using EventMeena.Application.DTOs.DocumentSigning;
using EventMeena.Application.DTOs.Sections;
using EventMeena.Domain.Enums;

namespace EventMeena.Application.DTOs.Events;

/// <summary>
/// Event response DTO
/// </summary>
public class EventDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public EventType Type { get; set; }
    public EventStatus Status { get; set; }
    public string? CoverImage { get; set; }
    public string? ThemeColor { get; set; }
    public string? Language { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? TimeLimitMinutes { get; set; }
    public string ShareCode { get; set; } = string.Empty;
    public string? ShareLink { get; set; }
    public bool RequireLogin { get; set; }
    public bool AllowAnonymous { get; set; }
    public int? MaxResponses { get; set; }
    public bool AllowMultipleResponses { get; set; }
    public bool AllowEditResponses { get; set; }
    public bool ShowResults { get; set; }
    public bool ShowCorrectAnswers { get; set; }
    public bool ShuffleQuestions { get; set; }
    public bool ShuffleOptions { get; set; }
    public int? PassingScore { get; set; }
    public string? ThankYouMessage { get; set; }
    public string? SuccessMessage { get; set; }
    public string? GoodMessage { get; set; }
    public string? ImprovementMessage { get; set; }

    // إعدادات الحدث الخاص (Private Event)
    public bool IsPrivate { get; set; }
    public List<string>? AllowedEmails { get; set; }

    // إعدادات توقيع الوثائق (Document Signing)
    public string? DocumentUrl { get; set; }
    public string? DocumentFileName { get; set; }
    public bool AllowDownloadAfterSigning { get; set; }
    public bool SendCopyToSigner { get; set; }
    public string SignatureDisplayMode { get; set; } = "inside";
    /// <summary>
    /// نوع التوقيع: single = موقّع واحد، multi = أكثر من موقّع
    /// </summary>
    public string SigningMode { get; set; } = "single";

    public int ViewCount { get; set; }
    public int ResponseCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// Event with sections DTO
/// </summary>
public class EventWithSectionsDto : EventDto
{
    public List<SectionDto> Sections { get; set; } = new();
}

/// <summary>
/// Event with full details (sections and components) DTO
/// </summary>
public class EventWithFullDetailsDto : EventDto
{
    public List<SectionWithComponentsDto> Sections { get; set; } = new();
}

/// <summary>
/// Event with signature fields DTO (for Document Signing events)
/// </summary>
public class EventWithSignatureFieldsDto : EventDto
{
    public List<SignatureFieldDto> SignatureFields { get; set; } = new();
}

/// <summary>
/// Event list item DTO (lightweight)
/// </summary>
public class EventListItemDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public EventType Type { get; set; }
    public EventStatus Status { get; set; }
    public string? CoverImage { get; set; }
    public string ShareCode { get; set; } = string.Empty;
    public int ViewCount { get; set; }
    public int ResponseCount { get; set; }
    public int CompletedResponseCount { get; set; }
    public int SectionsCount { get; set; }
    public int ComponentsCount { get; set; }
    public DateTime CreatedAt { get; set; }

    // خاص بأحداث توقيع الوثائق
    public int SignatureFieldsCount { get; set; }
    public int SignaturesCount { get; set; } // عدد التوقيعات الفعلية

    /// <summary>
    /// معدل الإكمال (نسبة مئوية)
    /// للأحداث العادية: نسبة الردود المكتملة
    /// لأحداث الوثائق: نسبة التوقيعات المكتملة
    /// </summary>
    public double CompletionRate => Type == EventType.DocumentSigning
        ? (SignatureFieldsCount > 0 && ResponseCount > 0
            ? Math.Round((double)SignaturesCount / (SignatureFieldsCount * ResponseCount) * 100, 1)
            : 0)
        : (ResponseCount > 0
            ? Math.Round((double)CompletedResponseCount / ResponseCount * 100, 1)
            : 0);
}


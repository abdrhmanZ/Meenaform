using EventMeena.Application.DTOs.Components;
using EventMeena.Domain.Enums;

namespace EventMeena.Application.DTOs.Events;

/// <summary>
/// Create event with sections and components request DTO
/// يسمح بإنشاء حدث كامل مع أقسامه ومكوناته في طلب واحد
/// </summary>
public class CreateEventWithSectionsRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public EventType Type { get; set; }
    public EventStatus? Status { get; set; }  // حالة الحدث (اختياري - الافتراضي Published)
    public string? CoverImage { get; set; }
    public string? ThemeColor { get; set; }
    public string? Language { get; set; } = "ar";
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? TimeLimitMinutes { get; set; }
    public bool RequireLogin { get; set; }
    public bool AllowAnonymous { get; set; } = true;
    public int? MaxResponses { get; set; }
    public bool AllowMultipleResponses { get; set; }
    public bool AllowEditResponses { get; set; }
    public bool ShowResults { get; set; } = true;
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

    // إعدادات المسابقة
    public string? CompetitionMode { get; set; }
    public int WinnersCount { get; set; } = 1;
    public int? QualifyingScore { get; set; }

    /// <summary>
    /// الأقسام مع مكوناتها
    /// </summary>
    public List<CreateSectionWithComponentsRequest>? Sections { get; set; }
}

/// <summary>
/// Create section with components request DTO
/// </summary>
public class CreateSectionWithComponentsRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Order { get; set; }
    public bool IsVisible { get; set; } = true;

    /// <summary>
    /// المكونات في هذا القسم
    /// </summary>
    public List<CreateComponentRequest>? Components { get; set; }
}


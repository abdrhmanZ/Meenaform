using EventMeena.Domain.Enums;

namespace EventMeena.Application.DTOs.Events;

/// <summary>
/// Create event request DTO
/// </summary>
public class CreateEventRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public EventType Type { get; set; }
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
    public bool ShowResults { get; set; } = true;
    public bool ShowCorrectAnswers { get; set; }
    public bool ShuffleQuestions { get; set; }
    public bool ShuffleOptions { get; set; }
    public int? PassingScore { get; set; }

    // إعدادات المسابقة
    public string? CompetitionMode { get; set; }
    public int WinnersCount { get; set; } = 1;
    public int? QualifyingScore { get; set; }
}


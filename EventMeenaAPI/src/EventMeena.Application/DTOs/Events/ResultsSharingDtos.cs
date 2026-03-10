namespace EventMeena.Application.DTOs.Events;

/// <summary>
/// صلاحيات مشاركة النتائج
/// </summary>
public class ResultsSharePermissionsDto
{
    public bool AllowExport { get; set; } = false;
    public bool AllowDraw { get; set; } = false;
}

/// <summary>
/// طلب تحديث إعدادات مشاركة النتائج
/// </summary>
public class ShareResultsRequest
{
    public bool IsEnabled { get; set; }
    public List<string> AllowedEmails { get; set; } = new();
    public ResultsSharePermissionsDto Permissions { get; set; } = new();
}

/// <summary>
/// طلب الوصول للنتائج المشاركة (من المستلم)
/// </summary>
public class SharedResultsAccessRequest
{
    public string Email { get; set; } = string.Empty;
}

/// <summary>
/// استجابة الوصول للنتائج المشاركة
/// </summary>
public class SharedResultsDataDto
{
    public EventWithFullDetailsDto Event { get; set; } = null!;
    public List<SharedResponseDto> Responses { get; set; } = new();
    public ResultsSharePermissionsDto Permissions { get; set; } = new();
}

/// <summary>
/// بيانات الرد المبسّطة للنتائج المشاركة
/// </summary>
public class SharedResponseDto
{
    public string Id { get; set; } = string.Empty;
    public string ParticipantName { get; set; } = string.Empty;
    public string? ParticipantEmail { get; set; }
    public string Status { get; set; } = string.Empty;
    public int TimeSpent { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public SharedScoreDto? Score { get; set; }
    public bool IsWinner { get; set; }
    public string AnswersJson { get; set; } = "{}";
}

/// <summary>
/// درجة مبسّطة
/// </summary>
public class SharedScoreDto
{
    public int EarnedPoints { get; set; }
    public int TotalPoints { get; set; }
    public double Percentage { get; set; }
    public bool Passed { get; set; }
}

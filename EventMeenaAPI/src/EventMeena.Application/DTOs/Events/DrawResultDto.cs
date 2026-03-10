namespace EventMeena.Application.DTOs.Events;

/// <summary>
/// نتيجة السحب العشوائي
/// </summary>
public class DrawResultDto
{
    public List<DrawWinnerDto> Winners { get; set; } = new();
    public int TotalParticipants { get; set; }
    public int QualifiedCount { get; set; }
}

/// <summary>
/// معلومات الفائز
/// </summary>
public class DrawWinnerDto
{
    public string ResponseId { get; set; } = string.Empty;
    public string ParticipantName { get; set; } = string.Empty;
    public string? ParticipantEmail { get; set; }
    public int Rank { get; set; }
    public double? Score { get; set; }
}

/// <summary>
/// طلب السحب العشوائي
/// </summary>
public class DrawRequest
{
    public int WinnersCount { get; set; } = 1;
    /// <summary>
    /// قائمة Response IDs للفائزين المختارين من العجلة (اختياري)
    /// إذا وُجدت، يتم حفظها مباشرة بدلاً من اختيار عشوائي
    /// </summary>
    public List<string>? WinnerResponseIds { get; set; }
}

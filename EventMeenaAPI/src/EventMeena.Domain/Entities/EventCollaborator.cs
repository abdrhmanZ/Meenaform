using EventMeena.Domain.Common;
using EventMeena.Domain.Enums;

namespace EventMeena.Domain.Entities;

/// <summary>
/// كيان المتعاون في الحدث — يربط مستخدم بحدث مع صلاحية محددة
/// </summary>
public class EventCollaborator : AuditableEntity
{
    /// <summary>
    /// معرف الحدث
    /// </summary>
    public Guid EventId { get; set; }

    /// <summary>
    /// معرف المستخدم المتعاون
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// دور المتعاون (مشاهد، محرر، مدير)
    /// </summary>
    public CollaboratorRole Role { get; set; }

    // Navigation Properties
    public virtual Event Event { get; set; } = null!;
    public virtual User User { get; set; } = null!;
}

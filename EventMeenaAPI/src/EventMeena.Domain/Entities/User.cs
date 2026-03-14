using EventMeena.Domain.Common;

namespace EventMeena.Domain.Entities;

/// <summary>
/// كيان المستخدم
/// </summary>
public class User : AuditableEntity
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? ProfileImage { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? LastLoginAt { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }

    // Password Reset Properties
    public string? PasswordResetToken { get; set; }
    public DateTime? PasswordResetTokenExpiry { get; set; }

    // Navigation Properties
    public virtual ICollection<Event> Events { get; set; } = new List<Event>();
    public virtual ICollection<Contact> Contacts { get; set; } = new List<Contact>();
    public virtual ICollection<Group> Groups { get; set; } = new List<Group>();
    public virtual ICollection<UserTemplate> Templates { get; set; } = new List<UserTemplate>();
    public virtual ICollection<EventCollaborator> CollaboratedEvents { get; set; } = new List<EventCollaborator>();
}


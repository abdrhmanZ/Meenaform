using EventMeena.Domain.Entities;
using EventMeena.Domain.Enums;

namespace EventMeena.Application.Interfaces;

/// <summary>
/// Event Collaborator Repository Interface
/// </summary>
public interface IEventCollaboratorRepository : IGenericRepository<EventCollaborator>
{
    /// <summary>
    /// جلب جميع المتعاونين في حدث معين (مع بيانات المستخدم)
    /// </summary>
    Task<IReadOnlyList<EventCollaborator>> GetByEventIdAsync(Guid eventId);

    /// <summary>
    /// جلب جميع الأحداث التي يتعاون فيها مستخدم معين (مع بيانات الحدث)
    /// </summary>
    Task<IReadOnlyList<EventCollaborator>> GetByUserIdAsync(Guid userId);

    /// <summary>
    /// جلب متعاون محدد في حدث محدد
    /// </summary>
    Task<EventCollaborator?> GetByEventAndUserAsync(Guid eventId, Guid userId);

    /// <summary>
    /// التحقق مما إذا كان المستخدم متعاوناً في حدث معين
    /// </summary>
    Task<bool> IsCollaboratorAsync(Guid eventId, Guid userId);

    /// <summary>
    /// جلب دور المتعاون في حدث معين (null إذا لم يكن متعاوناً)
    /// </summary>
    Task<CollaboratorRole?> GetRoleAsync(Guid eventId, Guid userId);
}

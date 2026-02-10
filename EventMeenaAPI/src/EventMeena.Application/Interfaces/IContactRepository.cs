using EventMeena.Domain.Entities;

namespace EventMeena.Application.Interfaces;

/// <summary>
/// Contact Repository Interface
/// </summary>
public interface IContactRepository : IGenericRepository<Contact>
{
    Task<IReadOnlyList<Contact>> GetByUserIdAsync(Guid userId);
    Task<IReadOnlyList<Contact>> GetByUserIdWithGroupsAsync(Guid userId);
    Task<Contact?> GetByIdWithGroupsAsync(Guid id);
    Task<IReadOnlyList<Contact>> GetByGroupIdAsync(Guid groupId);
    Task<Contact?> GetByEmailAndUserIdAsync(string email, Guid userId);
    Task<bool> ExistsByEmailAndUserIdAsync(string email, Guid userId);
    Task<IReadOnlyList<Contact>> SearchAsync(Guid userId, string searchTerm);

    /// <summary>
    /// الحصول على جهات الاتصال مع pagination على مستوى قاعدة البيانات
    /// </summary>
    Task<(IReadOnlyList<Contact> Items, int TotalCount)> GetByUserIdPagedAsync(Guid userId, int pageNumber, int pageSize);
}


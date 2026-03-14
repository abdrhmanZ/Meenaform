namespace EventMeena.Application.DTOs.Events;

/// <summary>
/// DTO لعرض بيانات متعاون في حدث
/// </summary>
public class CollaboratorDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string? UserProfileImage { get; set; }
    /// <summary>
    /// دور المتعاون: 1=Viewer, 2=Editor, 3=Manager
    /// </summary>
    public int Role { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public DateTime AddedAt { get; set; }
}

/// <summary>
/// طلب إضافة متعاون جديد
/// </summary>
public class AddCollaboratorRequest
{
    /// <summary>
    /// البريد الإلكتروني للمستخدم المراد إضافته
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// الصلاحية: 1=Viewer, 2=Editor, 3=Manager
    /// </summary>
    public int Role { get; set; }
}

/// <summary>
/// طلب تعديل صلاحية متعاون
/// </summary>
public class UpdateCollaboratorRoleRequest
{
    /// <summary>
    /// الصلاحية الجديدة: 1=Viewer, 2=Editor, 3=Manager
    /// </summary>
    public int Role { get; set; }
}

/// <summary>
/// نتيجة البحث عن مستخدم
/// </summary>
public class UserSearchResultDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? ProfileImage { get; set; }
}

/// <summary>
/// DTO لعرض حدث مشترك مع المتعاون (يوسّع EventListItemDto)
/// </summary>
public class SharedEventListItemDto : EventListItemDto
{
    /// <summary>
    /// اسم صاحب الحدث
    /// </summary>
    public string OwnerName { get; set; } = string.Empty;

    /// <summary>
    /// دور المتعاون: 1=Viewer, 2=Editor, 3=Manager
    /// </summary>
    public int MyRole { get; set; }

    /// <summary>
    /// اسم الدور بالعربي
    /// </summary>
    public string MyRoleName { get; set; } = string.Empty;
}

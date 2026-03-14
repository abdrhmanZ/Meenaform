namespace EventMeena.Domain.Enums;

/// <summary>
/// أدوار المتعاونين في إدارة الحدث
/// </summary>
public enum CollaboratorRole
{
    /// <summary>
    /// مشاهد — عرض الحدث والنتائج فقط
    /// </summary>
    Viewer = 1,

    /// <summary>
    /// محرر — تعديل الأسئلة والإعدادات والنشر
    /// </summary>
    Editor = 2
}

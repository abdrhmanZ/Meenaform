namespace EventMeena.Application.DTOs.Groups;

/// <summary>
/// Update group request DTO
/// </summary>
public class UpdateGroupRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Color { get; set; }
    public string? Icon { get; set; }
    public List<Guid>? ContactIds { get; set; }
}

/// <summary>
/// Add contacts to group request DTO
/// </summary>
public class AddContactsToGroupRequest
{
    public List<Guid> ContactIds { get; set; } = new();
}

/// <summary>
/// Remove contacts from group request DTO
/// </summary>
public class RemoveContactsFromGroupRequest
{
    public List<Guid> ContactIds { get; set; } = new();
}


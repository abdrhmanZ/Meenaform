using System.Text.Json;
using AutoMapper;
using EventMeena.Application.DTOs.Auth;
using EventMeena.Application.DTOs.Components;
using EventMeena.Application.DTOs.Contacts;
using EventMeena.Application.DTOs.DocumentSigning;
using EventMeena.Application.DTOs.Events;
using EventMeena.Application.DTOs.Groups;
using EventMeena.Application.DTOs.Responses;
using EventMeena.Application.DTOs.Sections;
using EventMeena.Application.DTOs.Templates;
using EventMeena.Domain.Entities;
using EventMeena.Domain.Enums;

namespace EventMeena.Application.Mappings;

/// <summary>
/// AutoMapper Profile for Entity-DTO mappings
/// </summary>
public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // User Mappings
        CreateMap<User, UserDto>();
        CreateMap<UpdateProfileRequest, User>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // Event Mappings
        CreateMap<Event, EventDto>()
            .ForMember(dest => dest.AllowedEmails, opt => opt.MapFrom(src => ParseAllowedEmails(src.AllowedEmailsJson)))
            .ForMember(dest => dest.ResultsSharedEmails, opt => opt.MapFrom(src => ParseAllowedEmails(src.ResultsSharedEmailsJson)))
            .ForMember(dest => dest.ResultsSharePermissions, opt => opt.MapFrom(src => ParseSharePermissions(src.ResultsSharePermissionsJson)));
        CreateMap<Event, EventListItemDto>()
            .ForMember(dest => dest.SectionsCount, opt => opt.MapFrom(src => src.Sections.Count))
            .ForMember(dest => dest.ComponentsCount, opt => opt.MapFrom(src =>
                src.Sections.Sum(s => s.Components.Count)))
            .ForMember(dest => dest.CompletedResponseCount, opt => opt.MapFrom(src =>
                src.Responses.Count(r => r.Status == Domain.Enums.ResponseStatus.Completed)))
            .ForMember(dest => dest.SignatureFieldsCount, opt => opt.MapFrom(src =>
                src.SignatureFields != null ? src.SignatureFields.Count : 0))
            .ForMember(dest => dest.SignaturesCount, opt => opt.MapFrom(src =>
                src.SignatureFields != null ? src.SignatureFields.Sum(sf => sf.Signatures != null ? sf.Signatures.Count : 0) : 0));
        CreateMap<Event, EventWithSectionsDto>()
            .ForMember(dest => dest.AllowedEmails, opt => opt.MapFrom(src => ParseAllowedEmails(src.AllowedEmailsJson)))
            .ForMember(dest => dest.ResultsSharedEmails, opt => opt.MapFrom(src => ParseAllowedEmails(src.ResultsSharedEmailsJson)))
            .ForMember(dest => dest.ResultsSharePermissions, opt => opt.MapFrom(src => ParseSharePermissions(src.ResultsSharePermissionsJson)));
        CreateMap<Event, EventWithFullDetailsDto>()
            .ForMember(dest => dest.AllowedEmails, opt => opt.MapFrom(src => ParseAllowedEmails(src.AllowedEmailsJson)))
            .ForMember(dest => dest.ResultsSharedEmails, opt => opt.MapFrom(src => ParseAllowedEmails(src.ResultsSharedEmailsJson)))
            .ForMember(dest => dest.ResultsSharePermissions, opt => opt.MapFrom(src => ParseSharePermissions(src.ResultsSharePermissionsJson)));
        CreateMap<CreateEventRequest, Event>();
        CreateMap<CreateEventWithSectionsRequest, Event>();
        CreateMap<UpdateEventRequest, Event>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // Section Mappings
        CreateMap<Section, SectionDto>();
        CreateMap<Section, SectionWithComponentsDto>();
        CreateMap<CreateSectionRequest, Section>();
        CreateMap<CreateSectionWithComponentsRequest, Section>();
        CreateMap<UpdateSectionRequest, Section>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // Component Mappings
        CreateMap<Component, ComponentDto>();
        CreateMap<CreateComponentRequest, Component>();
        CreateMap<UpdateComponentRequest, Component>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // Contact Mappings
        CreateMap<Contact, ContactDto>()
            .ForMember(dest => dest.Tags, opt => opt.MapFrom(src => ParseTags(src.Tags)))
            .ForMember(dest => dest.GroupIds, opt => opt.MapFrom(src =>
                src.ContactGroups.Select(cg => cg.GroupId).ToList()))
            .ForMember(dest => dest.Stats, opt => opt.MapFrom(src => CalculateContactStats(src.SendHistories)));
        CreateMap<Contact, ContactWithGroupsDto>()
            .ForMember(dest => dest.Tags, opt => opt.MapFrom(src => ParseTags(src.Tags)))
            .ForMember(dest => dest.GroupIds, opt => opt.MapFrom(src =>
                src.ContactGroups.Select(cg => cg.GroupId).ToList()))
            .ForMember(dest => dest.Groups, opt => opt.MapFrom(src =>
                src.ContactGroups.Select(cg => cg.Group)))
            .ForMember(dest => dest.Stats, opt => opt.MapFrom(src => CalculateContactStats(src.SendHistories)));
        CreateMap<CreateContactRequest, Contact>()
            .ForMember(dest => dest.Tags, opt => opt.MapFrom(src => SerializeTags(src.Tags)));
        CreateMap<UpdateContactRequest, Contact>()
            .ForMember(dest => dest.Tags, opt => opt.MapFrom(src => SerializeTags(src.Tags)))
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // Group Mappings
        CreateMap<Group, GroupDto>()
            .ForMember(dest => dest.ContactCount, opt => opt.MapFrom(src => src.ContactGroups.Count))
            .ForMember(dest => dest.ContactIds, opt => opt.MapFrom(src =>
                src.ContactGroups.Select(cg => cg.ContactId).ToList()))
            .ForMember(dest => dest.Stats, opt => opt.MapFrom(src => CalculateGroupStats(src.ContactGroups)));
        CreateMap<Group, GroupWithContactsDto>()
            .ForMember(dest => dest.Contacts, opt => opt.MapFrom(src =>
                src.ContactGroups.Select(cg => cg.Contact)))
            .ForMember(dest => dest.ContactCount, opt => opt.MapFrom(src => src.ContactGroups.Count))
            .ForMember(dest => dest.ContactIds, opt => opt.MapFrom(src =>
                src.ContactGroups.Select(cg => cg.ContactId).ToList()))
            .ForMember(dest => dest.Stats, opt => opt.MapFrom(src => CalculateGroupStats(src.ContactGroups)));
        CreateMap<CreateGroupRequest, Group>();
        CreateMap<UpdateGroupRequest, Group>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // Response Mappings
        CreateMap<Response, ResponseDto>();
        CreateMap<StartResponseRequest, Response>();

        // Template Mappings
        CreateMap<UserTemplate, TemplateDto>();
        CreateMap<UserTemplate, TemplateListItemDto>();
        CreateMap<CreateTemplateRequest, UserTemplate>();
        CreateMap<UpdateTemplateRequest, UserTemplate>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // Document Signing Mappings
        CreateMap<Event, EventWithSignatureFieldsDto>()
            .ForMember(dest => dest.AllowedEmails, opt => opt.MapFrom(src => ParseAllowedEmails(src.AllowedEmailsJson)))
            .ForMember(dest => dest.ResultsSharedEmails, opt => opt.MapFrom(src => ParseAllowedEmails(src.ResultsSharedEmailsJson)))
            .ForMember(dest => dest.ResultsSharePermissions, opt => opt.MapFrom(src => ParseSharePermissions(src.ResultsSharePermissionsJson)))
            .ForMember(dest => dest.SignatureFields, opt => opt.Ignore());

        CreateMap<SignatureField, SignatureFieldDto>();
        CreateMap<CreateSignatureFieldRequest, SignatureField>();
        CreateMap<UpdateSignatureFieldRequest, SignatureField>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        CreateMap<DocumentSignature, DocumentSignatureDto>()
            .ForMember(dest => dest.FieldLabel, opt => opt.MapFrom(src => src.SignatureField != null ? src.SignatureField.Label : null))
            .ForMember(dest => dest.PageNumber, opt => opt.MapFrom(src => src.SignatureField != null ? src.SignatureField.PageNumber : 0));
    }

    /// <summary>
    /// تحويل JSON string إلى قائمة نصوص
    /// </summary>
    private static List<string> ParseTags(string? tagsJson)
    {
        if (string.IsNullOrEmpty(tagsJson))
            return new List<string>();

        try
        {
            return JsonSerializer.Deserialize<List<string>>(tagsJson) ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }

    /// <summary>
    /// تحويل قائمة نصوص إلى JSON string
    /// </summary>
    private static string? SerializeTags(List<string>? tags)
    {
        if (tags == null || tags.Count == 0)
            return null;

        return JsonSerializer.Serialize(tags);
    }

    /// <summary>
    /// تحويل JSON string إلى قائمة الإيميلات المسموح لها
    /// </summary>
    private static List<string>? ParseAllowedEmails(string? allowedEmailsJson)
    {
        if (string.IsNullOrEmpty(allowedEmailsJson))
            return null;

        try
        {
            return JsonSerializer.Deserialize<List<string>>(allowedEmailsJson);
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// تحويل JSON string إلى كائن صلاحيات مشاركة النتائج
    /// </summary>
    private static ResultsSharePermissionsDto? ParseSharePermissions(string? json)
    {
        if (string.IsNullOrEmpty(json))
            return null;

        try
        {
            return JsonSerializer.Deserialize<ResultsSharePermissionsDto>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// حساب إحصائيات جهة الاتصال من سجل الإرسال
    /// </summary>
    private static ContactStatsDto CalculateContactStats(ICollection<SendHistory>? sendHistories)
    {
        if (sendHistories == null || sendHistories.Count == 0)
        {
            return new ContactStatsDto
            {
                EventsSent = 0,
                EventsCompleted = 0,
                ResponseRate = 0,
                LastInteraction = null
            };
        }

        var totalSent = sendHistories.Count;
        var completed = sendHistories.Count(sh =>
            sh.Status == SendStatus.Delivered || sh.Status == SendStatus.Opened);
        var opened = sendHistories.Count(sh => sh.OpenedAt != null);
        var responseRate = totalSent > 0 ? (double)opened / totalSent * 100 : 0;
        var lastInteraction = sendHistories
            .Where(sh => sh.SentAt != null)
            .Max(sh => sh.SentAt);

        return new ContactStatsDto
        {
            EventsSent = totalSent,
            EventsCompleted = completed,
            ResponseRate = Math.Round(responseRate, 1),
            LastInteraction = lastInteraction
        };
    }

    /// <summary>
    /// حساب إحصائيات المجموعة من سجلات الإرسال لجهات الاتصال فيها
    /// </summary>
    private static GroupStatsDto CalculateGroupStats(ICollection<ContactGroup>? contactGroups)
    {
        if (contactGroups == null || contactGroups.Count == 0)
        {
            return new GroupStatsDto
            {
                EventsSent = 0,
                AverageResponseRate = 0,
                LastEventSent = null
            };
        }

        // جمع كل سجلات الإرسال من جهات الاتصال في المجموعة
        var allSendHistories = contactGroups
            .Where(cg => cg.Contact?.SendHistories != null)
            .SelectMany(cg => cg.Contact.SendHistories)
            .ToList();

        if (allSendHistories.Count == 0)
        {
            return new GroupStatsDto
            {
                EventsSent = 0,
                AverageResponseRate = 0,
                LastEventSent = null
            };
        }

        var totalSent = allSendHistories.Count;
        var opened = allSendHistories.Count(sh => sh.OpenedAt != null);
        var responseRate = totalSent > 0 ? (double)opened / totalSent * 100 : 0;
        var lastEventSent = allSendHistories
            .Where(sh => sh.SentAt != null)
            .Max(sh => sh.SentAt);

        return new GroupStatsDto
        {
            EventsSent = totalSent,
            AverageResponseRate = Math.Round(responseRate, 1),
            LastEventSent = lastEventSent
        };
    }
}


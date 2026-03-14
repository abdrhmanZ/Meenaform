using EventMeena.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EventMeena.Infrastructure.Data.Configurations;

public class EventCollaboratorConfiguration : IEntityTypeConfiguration<EventCollaborator>
{
    public void Configure(EntityTypeBuilder<EventCollaborator> builder)
    {
        builder.ToTable("EventCollaborators");

        // Primary Key (الـ Id من BaseEntity)
        builder.HasKey(ec => ec.Id);

        // Unique Constraint: نفس المستخدم لا يمكن إضافته مرتين لنفس الحدث
        builder.HasIndex(ec => new { ec.EventId, ec.UserId }).IsUnique();

        // Relationship with Event
        builder.HasOne(ec => ec.Event)
            .WithMany(e => e.Collaborators)
            .HasForeignKey(ec => ec.EventId)
            .OnDelete(DeleteBehavior.Cascade);

        // Relationship with User
        builder.HasOne(ec => ec.User)
            .WithMany(u => u.CollaboratedEvents)
            .HasForeignKey(ec => ec.UserId)
            .OnDelete(DeleteBehavior.NoAction); // Prevent cascade delete conflict

        builder.HasIndex(ec => ec.EventId);
        builder.HasIndex(ec => ec.UserId);
    }
}

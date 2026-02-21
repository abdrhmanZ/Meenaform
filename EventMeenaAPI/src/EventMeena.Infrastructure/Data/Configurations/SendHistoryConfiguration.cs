using EventMeena.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EventMeena.Infrastructure.Data.Configurations;

public class SendHistoryConfiguration : IEntityTypeConfiguration<SendHistory>
{
    public void Configure(EntityTypeBuilder<SendHistory> builder)
    {
        builder.ToTable("SendHistories");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.RecipientEmail)
            .HasMaxLength(256);

        builder.Property(s => s.RecipientPhone)
            .HasMaxLength(20);

        builder.Property(s => s.Subject)
            .HasMaxLength(500);

        builder.Property(s => s.Message)
            .HasColumnType("text");

        builder.Property(s => s.ErrorMessage)
            .HasMaxLength(1000);

        builder.Property(s => s.ExternalId)
            .HasMaxLength(100);

        // Relationship with Event
        builder.HasOne(s => s.Event)
            .WithMany(e => e.SendHistories)
            .HasForeignKey(s => s.EventId)
            .OnDelete(DeleteBehavior.Cascade);

        // Relationship with Contact (optional) - NoAction to avoid cascade cycles
        builder.HasOne(s => s.Contact)
            .WithMany(c => c.SendHistories)
            .HasForeignKey(s => s.ContactId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(s => s.EventId);
        builder.HasIndex(s => s.ContactId);
        builder.HasIndex(s => s.Status);
        builder.HasIndex(s => s.Method);
    }
}


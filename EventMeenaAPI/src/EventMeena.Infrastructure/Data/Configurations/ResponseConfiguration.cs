using EventMeena.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EventMeena.Infrastructure.Data.Configurations;

public class ResponseConfiguration : IEntityTypeConfiguration<Response>
{
    public void Configure(EntityTypeBuilder<Response> builder)
    {
        builder.ToTable("Responses");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.RespondentName)
            .HasMaxLength(100);

        builder.Property(r => r.RespondentEmail)
            .HasMaxLength(256);

        builder.Property(r => r.RespondentPhone)
            .HasMaxLength(20);

        builder.Property(r => r.RespondentIp)
            .HasMaxLength(50);

        builder.Property(r => r.UserAgent)
            .HasMaxLength(500);

        builder.Property(r => r.AnswersJson)
            .IsRequired()
            .HasColumnType("nvarchar(max)");

        // Relationship with Event
        builder.HasOne(r => r.Event)
            .WithMany(e => e.Responses)
            .HasForeignKey(r => r.EventId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(r => r.EventId);
        builder.HasIndex(r => r.Status);
        builder.HasIndex(r => r.RespondentEmail);

        // Composite index for common queries (GetBulkCompletedCountsAsync, GetCompletedCountByEventIdAsync, etc.)
        builder.HasIndex(r => new { r.EventId, r.Status })
            .HasDatabaseName("IX_Responses_EventId_Status");
    }
}


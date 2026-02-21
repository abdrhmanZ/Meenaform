using EventMeena.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EventMeena.Infrastructure.Data.Configurations;

public class UserTemplateConfiguration : IEntityTypeConfiguration<UserTemplate>
{
    public void Configure(EntityTypeBuilder<UserTemplate> builder)
    {
        builder.ToTable("UserTemplates");
        
        builder.HasKey(t => t.Id);
        
        builder.Property(t => t.Name)
            .IsRequired()
            .HasMaxLength(200);
            
        builder.Property(t => t.Description)
            .HasMaxLength(1000);
            
        builder.Property(t => t.ThumbnailUrl)
            .HasMaxLength(500);
            
        builder.Property(t => t.TemplateDataJson)
            .IsRequired()
            .HasColumnType("text");
            
        // Relationship with User
        builder.HasOne(t => t.User)
            .WithMany(u => u.Templates)
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);
            
        builder.HasIndex(t => t.UserId);
        builder.HasIndex(t => t.Type);
        builder.HasIndex(t => t.IsPublic);
    }
}


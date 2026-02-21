using EventMeena.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EventMeena.Infrastructure.Data.Configurations;

public class ComponentConfiguration : IEntityTypeConfiguration<Component>
{
    public void Configure(EntityTypeBuilder<Component> builder)
    {
        builder.ToTable("Components");
        
        builder.HasKey(c => c.Id);
        
        builder.Property(c => c.Title)
            .HasMaxLength(500);
            
        builder.Property(c => c.Description)
            .HasMaxLength(2000);
            
        builder.Property(c => c.Placeholder)
            .HasMaxLength(200);
            
        builder.Property(c => c.OptionsJson)
            .HasColumnType("text");
            
        builder.Property(c => c.ValidationJson)
            .HasColumnType("text");
            
        builder.Property(c => c.CorrectAnswerJson)
            .HasColumnType("text");
            
        builder.Property(c => c.Explanation)
            .HasMaxLength(2000);
            
        builder.Property(c => c.MinLabel)
            .HasMaxLength(100);
            
        builder.Property(c => c.MaxLabel)
            .HasMaxLength(100);
            
        builder.Property(c => c.MediaUrl)
            .HasMaxLength(500);
            
        builder.Property(c => c.MediaType)
            .HasMaxLength(50);
            
        builder.Property(c => c.StyleJson)
            .HasColumnType("text");
            
        // Relationship with Section
        builder.HasOne(c => c.Section)
            .WithMany(s => s.Components)
            .HasForeignKey(c => c.SectionId)
            .OnDelete(DeleteBehavior.Cascade);
            
        builder.HasIndex(c => c.SectionId);
    }
}


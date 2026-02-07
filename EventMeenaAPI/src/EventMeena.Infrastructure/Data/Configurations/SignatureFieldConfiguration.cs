using EventMeena.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EventMeena.Infrastructure.Data.Configurations;

public class SignatureFieldConfiguration : IEntityTypeConfiguration<SignatureField>
{
    public void Configure(EntityTypeBuilder<SignatureField> builder)
    {
        builder.ToTable("SignatureFields");

        builder.HasKey(sf => sf.Id);

        builder.Property(sf => sf.Label)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(sf => sf.FieldType)
            .IsRequired()
            .HasMaxLength(50)
            .HasDefaultValue("signature");

        builder.Property(sf => sf.PageNumber)
            .IsRequired();

        builder.Property(sf => sf.PositionX)
            .IsRequired();

        builder.Property(sf => sf.PositionY)
            .IsRequired();

        builder.Property(sf => sf.Width)
            .IsRequired();

        builder.Property(sf => sf.Height)
            .IsRequired();

        builder.Property(sf => sf.IsRequired)
            .HasDefaultValue(true);

        builder.Property(sf => sf.Order)
            .HasDefaultValue(0);

        // Relationship with Event
        builder.HasOne(sf => sf.Event)
            .WithMany(e => e.SignatureFields)
            .HasForeignKey(sf => sf.EventId)
            .OnDelete(DeleteBehavior.Cascade);

        // Index for faster queries
        builder.HasIndex(sf => sf.EventId);
    }
}


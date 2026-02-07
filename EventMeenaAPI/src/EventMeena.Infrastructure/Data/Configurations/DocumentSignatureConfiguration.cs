using EventMeena.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EventMeena.Infrastructure.Data.Configurations;

public class DocumentSignatureConfiguration : IEntityTypeConfiguration<DocumentSignature>
{
    public void Configure(EntityTypeBuilder<DocumentSignature> builder)
    {
        builder.ToTable("DocumentSignatures");

        builder.HasKey(ds => ds.Id);

        builder.Property(ds => ds.SignerName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(ds => ds.SignerEmail)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(ds => ds.SignerPhone)
            .HasMaxLength(20);

        builder.Property(ds => ds.SignatureData)
            .IsRequired();

        builder.Property(ds => ds.SignedAt)
            .IsRequired();

        builder.Property(ds => ds.IpAddress)
            .HasMaxLength(50);

        builder.Property(ds => ds.UserAgent)
            .HasMaxLength(500);

        // Relationship with SignatureField
        builder.HasOne(ds => ds.SignatureField)
            .WithMany(sf => sf.Signatures)
            .HasForeignKey(ds => ds.SignatureFieldId)
            .OnDelete(DeleteBehavior.Cascade);

        // Relationship with Response
        builder.HasOne(ds => ds.Response)
            .WithMany()
            .HasForeignKey(ds => ds.ResponseId)
            .OnDelete(DeleteBehavior.NoAction);

        // Index for faster queries
        builder.HasIndex(ds => ds.SignatureFieldId);
        builder.HasIndex(ds => ds.ResponseId);
        builder.HasIndex(ds => ds.SignerEmail);
    }
}


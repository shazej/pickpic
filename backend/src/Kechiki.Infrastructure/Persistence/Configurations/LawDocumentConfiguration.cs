using Kechiki.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kechiki.Infrastructure.Persistence.Configurations;

public class LawDocumentConfiguration : IEntityTypeConfiguration<LawDocument>
{
    public void Configure(EntityTypeBuilder<LawDocument> builder)
    {
        builder.Property(t => t.Title)
            .HasMaxLength(200)
            .IsRequired();

        builder.HasOne(t => t.Country)
            .WithMany()
            .HasForeignKey(t => t.CountryId)
            .IsRequired();

        builder.HasMany(t => t.Chunks)
            .WithOne(t => t.LawDocument)
            .HasForeignKey(t => t.LawDocumentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

using Kechiki.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kechiki.Infrastructure.Persistence.Configurations
{
    public class CountryConfiguration : IEntityTypeConfiguration<Country>
    {
        public void Configure(EntityTypeBuilder<Country> builder)
        {
            builder.HasKey(e => e.Id);
            builder.Property(e => e.Code).HasMaxLength(3).IsRequired();
            builder.HasIndex(e => e.Code).IsUnique();
            builder.Property(e => e.Name).HasMaxLength(100).IsRequired();
            builder.Property(e => e.Currency).HasMaxLength(3).IsRequired();
        }
    }
}

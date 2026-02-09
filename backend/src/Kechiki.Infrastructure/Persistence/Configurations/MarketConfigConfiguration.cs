using Kechiki.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kechiki.Infrastructure.Persistence.Configurations
{
    public class MarketConfigConfiguration : IEntityTypeConfiguration<MarketConfig>
    {
        public void Configure(EntityTypeBuilder<MarketConfig> builder)
        {
            builder.HasKey(e => e.Id);
            builder.HasOne(e => e.Country)
                   .WithMany()
                   .HasForeignKey(e => e.CountryId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.Property(e => e.SettingsJson).HasColumnType("jsonb");
            builder.Property(e => e.FeatureFlagsJson).HasColumnType("jsonb");
        }
    }
}

using Kechiki.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kechiki.Infrastructure.Persistence.Configurations;

public class ComplianceRuleConfiguration : IEntityTypeConfiguration<ComplianceRule>
{
    public void Configure(EntityTypeBuilder<ComplianceRule> builder)
    {
        builder.Property(t => t.RuleName)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(t => t.Description)
            .IsRequired();

        builder.HasOne(t => t.Country)
            .WithMany()
            .HasForeignKey(t => t.CountryId)
            .IsRequired();
    }
}

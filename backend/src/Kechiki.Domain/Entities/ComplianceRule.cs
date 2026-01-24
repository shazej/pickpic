using Kechiki.Domain.Common;

namespace Kechiki.Domain.Entities;

public class ComplianceRule : BaseAuditableEntity
{
    public string RuleName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public int CountryId { get; set; }
    public Country Country { get; set; } = null!;
}

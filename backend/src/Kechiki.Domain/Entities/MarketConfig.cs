using System;
using Kechiki.Domain.Common;

namespace Kechiki.Domain.Entities
{
    public class MarketConfig : BaseAuditableEntity
    {
        public int CountryId { get; set; }
        public Country? Country { get; set; }
        public string SettingsJson { get; set; } = "{}";
        public string FeatureFlagsJson { get; set; } = "{}";
        public string TaxModel { get; set; } = "Default";
    }
}

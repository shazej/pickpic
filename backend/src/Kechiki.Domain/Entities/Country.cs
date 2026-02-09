using Kechiki.Domain.Common;

namespace Kechiki.Domain.Entities
{
    public class Country : BaseAuditableEntity
    {
        public string Code { get; set; } = string.Empty; // ISO Code e.g. KW
        public string Name { get; set; } = string.Empty;
        public string Currency { get; set; } = string.Empty; // KWD
        public string TimeZone { get; set; } = "UTC";
        public string DefaultLanguage { get; set; } = "ar";
        public bool Enabled { get; set; } = true;
    }
}

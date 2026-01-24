using Kechiki.Domain.Common;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kechiki.Domain.Entities
{
    [Table("Listings", Schema = "marketplace")]
    public class Listing : BaseAuditableEntity
    {
        public int SellerProfileId { get; set; }
        public SellerProfile SellerProfile { get; set; } = null!;
        
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string Currency { get; set; } = "KWD";
        
        public int Stock { get; set; }
        public string Condition { get; set; } = "New"; // New, Used-Good, etc.
        public string Category { get; set; } = string.Empty;
        
        public string[] Images { get; set; } = Array.Empty<string>();
        
        // Navigation properties if needed
    }
}

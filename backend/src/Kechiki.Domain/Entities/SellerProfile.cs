using Kechiki.Domain.Common;
using System.ComponentModel.DataAnnotations.Schema;
using NetTopologySuite.Geometries;

namespace Kechiki.Domain.Entities
{
    [Table("SellerProfiles", Schema = "marketplace")]
    public class SellerProfile : BaseAuditableEntity
    {
        public string UserId { get; set; } = string.Empty; // Links to ASP.NET Identity User
        public string BusinessName { get; set; } = string.Empty;
        public string VerificationStatus { get; set; } = "Pending"; // Pending, Verified, Rejected
        public string? DocumentRefs { get; set; } // JSON or comma-separated URLs
        
        // Location
        public string? Address { get; set; }
        public Point? Location { get; set; } // PostGIS Point (Lat/Long)
        public double CoverageRadiusMeters { get; set; } = 5000;
        
        // Navigation
        public ICollection<Listing> Listings { get; set; } = new List<Listing>();
    }
}

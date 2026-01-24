using Kechiki.Domain.Common;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kechiki.Domain.Entities
{
    [Table("Orders", Schema = "marketplace")]
    public class Order : BaseAuditableEntity
    {
        public string BuyerId { get; set; } = string.Empty; // UserId
        
        public int SellerProfileId { get; set; }
        public SellerProfile SellerProfile { get; set; } = null!;

        public decimal TotalAmount { get; set; }
        public string Currency { get; set; } = "KWD";
        
        public string Status { get; set; } = "Pending"; // Pending, Paid, Shipped, Delivered, Cancelled
        public string? PaymentRef { get; set; }
    }
}

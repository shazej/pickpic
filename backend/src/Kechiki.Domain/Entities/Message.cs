using Kechiki.Domain.Common;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kechiki.Domain.Entities
{
    [Table("Messages", Schema = "marketplace")]
    public class Message : BaseAuditableEntity
    {
        public string SenderId { get; set; } = string.Empty;
        public string ReceiverId { get; set; } = string.Empty;
        
        public string Content { get; set; } = string.Empty;
        
        public bool IsRead { get; set; }
    }
}

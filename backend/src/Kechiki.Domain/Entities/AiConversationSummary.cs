using Kechiki.Domain.Common;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kechiki.Domain.Entities
{
    [Table("ConversationSummaries", Schema = "ai_memory")]
    public class AiConversationSummary : BaseAuditableEntity
    {
        public string UserId { get; set; } = string.Empty;
        public string SummaryText { get; set; } = string.Empty;
        public string? LastIntent { get; set; }
    }
}

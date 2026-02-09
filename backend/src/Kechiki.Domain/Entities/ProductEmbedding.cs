using Kechiki.Domain.Common;
using System.ComponentModel.DataAnnotations.Schema;
using Pgvector;

namespace Kechiki.Domain.Entities
{
    [Table("ProductEmbeddings", Schema = "ai_memory")]
    public class ProductEmbedding : BaseAuditableEntity
    {
        public int ListingId { get; set; } // Loose relationship to avoid hard FK constraints across schemas if we split DBs later. Or keep FK is fine.
        // Let's keep FK optional or logic-enforced for now to match "ability to split later" advice.
        
        [Column(TypeName = "vector(1536)")] // Example size, e.g., OpenAI text-embedding-3-small
        public Vector? Embedding { get; set; }
        
        public string SourceText { get; set; } = string.Empty; // What was embedded
    }
}

using Kechiki.Domain.Common;

namespace Kechiki.Domain.Entities;

public class LawDocumentChunk : BaseAuditableEntity
{
    public int LawDocumentId { get; set; }
    public LawDocument LawDocument { get; set; } = null!;

    public string Content { get; set; } = string.Empty;
    public int Sequence { get; set; }
    
    // Placeholder for Embedding/Vector ID if using external store
    public string? VectorId { get; set; }
}

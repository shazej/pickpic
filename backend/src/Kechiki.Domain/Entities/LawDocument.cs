using Kechiki.Domain.Common;
using Kechiki.Domain.Enums;

namespace Kechiki.Domain.Entities;

public class LawDocument : BaseAuditableEntity
{
    public string Title { get; set; } = string.Empty;
    public DocumentStatus Status { get; set; } = DocumentStatus.Draft;
    public int Version { get; set; } = 1;
    public DateTimeOffset? EffectiveDate { get; set; }
    public DateTimeOffset? PublicationDate { get; set; }

    public int CountryId { get; set; }
    public Country Country { get; set; } = null!;

    public ICollection<LawDocumentChunk> Chunks { get; set; } = new List<LawDocumentChunk>();
}

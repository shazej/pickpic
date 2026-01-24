using Kechiki.Domain.Common;

namespace Kechiki.Domain.Entities;

public class AuditLog
{
    public int Id { get; set; }
    public string EntityType { get; set; } = string.Empty; // e.g., "LawDocument"
    public string EntityId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty; // Create, Update, Delete, Publish
    public string UserId { get; set; } = string.Empty;
    public DateTimeOffset Timestamp { get; set; } = DateTimeOffset.UtcNow;
    public string Details { get; set; } = string.Empty; // JSON or text configuration
}

using Kechiki.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;

namespace Kechiki.Application.Common.Interfaces
{
    public interface IApplicationDbContext
    {
        DbSet<Country> Countries { get; }
        DbSet<MarketConfig> MarketConfigs { get; }
        DbSet<LawDocument> LawDocuments { get; }
        DbSet<LawDocumentChunk> LawDocumentChunks { get; }
        DbSet<ComplianceRule> ComplianceRules { get; }
        DbSet<AuditLog> AuditLogs { get; }
        Task<int> SaveChangesAsync(CancellationToken cancellationToken);
    }
}

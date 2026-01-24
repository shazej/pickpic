using Kechiki.Application.Common.Interfaces;
using Kechiki.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System.Reflection;

namespace Kechiki.Infrastructure.Persistence
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>, IApplicationDbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<Country> Countries => Set<Country>();
        public DbSet<MarketConfig> MarketConfigs => Set<MarketConfig>();
        public DbSet<LawDocument> LawDocuments => Set<LawDocument>();
        public DbSet<LawDocumentChunk> LawDocumentChunks => Set<LawDocumentChunk>();
        public DbSet<ComplianceRule> ComplianceRules => Set<ComplianceRule>();
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

        // Marketplace Schema
        public DbSet<SellerProfile> SellerProfiles => Set<SellerProfile>();
        public DbSet<Listing> Listings => Set<Listing>();
        public DbSet<Order> Orders => Set<Order>();
        public DbSet<Message> Messages => Set<Message>();

        // AI Memory Schema
        public DbSet<AiConversationSummary> ConversationSummaries => Set<AiConversationSummary>();
        public DbSet<ProductEmbedding> ProductEmbeddings => Set<ProductEmbedding>();

        protected override void OnModelCreating(ModelBuilder builder)
        {
            builder.HasPostgresExtension("vector");
            builder.HasPostgresExtension("postgis");

            builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
            base.OnModelCreating(builder);
        }
    }
}

using Kechiki.Application.Common.Interfaces;
using Kechiki.Domain.Entities;
using Kechiki.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Kechiki.Infrastructure.Services;

public class ComplianceService : IComplianceService
{
    private readonly IApplicationDbContext _context;

    public ComplianceService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<LawDocument> CreateDraftAsync(string title, int countryId, string fullText)
    {
        // Simple chunking logic (by paragraph for now)
        var chunks = fullText.Split(new[] { "\n\n" }, StringSplitOptions.RemoveEmptyEntries)
            .Select((text, index) => new LawDocumentChunk
            {
                Content = text.Trim(),
                Sequence = index
            })
            .ToList();

        var document = new LawDocument
        {
            Title = title,
            CountryId = countryId,
            Status = DocumentStatus.Draft,
            Version = 1,
            Chunks = chunks
        };

        _context.LawDocuments.Add(document);
        await _context.SaveChangesAsync(CancellationToken.None);

        return document;
    }

    public async Task PublishAsync(int id)
    {
        var document = await _context.LawDocuments
            .Include(d => d.Chunks)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (document == null)
            throw new KeyNotFoundException($"LawDocument {id} not found");

        if (document.Status == DocumentStatus.Published)
            return;

        // Archive current active implementation for this country if exists?
        // For simplicity, just mark this as Published.
        document.Status = DocumentStatus.Published;
        document.PublicationDate = DateTimeOffset.UtcNow;
        document.EffectiveDate = DateTimeOffset.UtcNow; // Or separate logic

        await _context.SaveChangesAsync(CancellationToken.None);
    }

    public async Task<LawDocument?> GetActiveLawAsync(string countryCode)
    {
        return await _context.LawDocuments
            .Include(d => d.Chunks)
            .Include(d => d.Country)
            .Where(d => d.Country.Code == countryCode && d.Status == DocumentStatus.Published)
            .OrderByDescending(d => d.Version)
            .FirstOrDefaultAsync();
    }

    public async Task AddRuleAsync(ComplianceRule rule)
    {
        _context.ComplianceRules.Add(rule);
        await _context.SaveChangesAsync(CancellationToken.None);
    }
}

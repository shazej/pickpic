using Kechiki.Domain.Entities;

namespace Kechiki.Application.Common.Interfaces;

public interface IComplianceService
{
    Task<LawDocument> CreateDraftAsync(string title, int countryId, string fullText);
    Task PublishAsync(int id);
    Task<LawDocument?> GetActiveLawAsync(string countryCode);
    Task AddRuleAsync(ComplianceRule rule);
}

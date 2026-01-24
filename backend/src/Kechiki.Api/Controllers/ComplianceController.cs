using Kechiki.Application.Common.Interfaces;
using Kechiki.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kechiki.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ComplianceController : ControllerBase
{
    private readonly IComplianceService _complianceService;

    public ComplianceController(IComplianceService complianceService)
    {
        _complianceService = complianceService;
    }

    [HttpPost("draft")]
    public async Task<IActionResult> CreateDraft(CreateDraftRequest request)
    {
        var result = await _complianceService.CreateDraftAsync(request.Title, request.CountryId, request.Content);
        return Ok(result);
    }

    [HttpPost("publish/{id}")]
    public async Task<IActionResult> Publish(int id)
    {
        await _complianceService.PublishAsync(id);
        return Ok();
    }

    [HttpGet("active/{countryCode}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetActiveLaw(string countryCode)
    {
        var result = await _complianceService.GetActiveLawAsync(countryCode);
        if (result == null) return NotFound();
        return Ok(result);
    }
}

public record CreateDraftRequest(string Title, int CountryId, string Content);

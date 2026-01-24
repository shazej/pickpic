using Kechiki.Application.Common.Interfaces;
using Kechiki.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace Kechiki.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IIdentityService _identityService;

    public AuthController(IIdentityService identityService)
    {
        _identityService = identityService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var (token, userId, userName) = await _identityService.LoginAsync(request.Email, request.Password);
            return Ok(new { Token = token, UserId = userId, UserName = userName });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var (userId, userName) = await _identityService.RegisterAsync(request.Email, request.Password, request.FullName, request.UserType);
            return Ok(new { UserId = userId, UserName = userName });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }
}

public record LoginRequest(string Email, string Password);
public record RegisterRequest(string Email, string Password, string FullName, UserType UserType);

using Refit;
using System.Threading.Tasks;

namespace Kechiki.Admin.Desktop.Contracts
{
    public interface IAuthApi
    {
        [Post("/api/auth/login")]
        Task<AuthResponse> LoginAsync([Body] LoginRequest request);

        [Post("/api/auth/refresh")]
        Task<AuthResponse> RefreshTokenAsync([Body] RefreshTokenRequest request);

        [Get("/api/auth/me")]
        Task<UserProfile> GetProfileAsync();
    }

    public record LoginRequest(string Email, string Password);
    public record RefreshTokenRequest(string RefreshToken);
    
    public record AuthResponse(string AccessToken, string RefreshToken, UserProfile User);
    
    public record UserProfile(string Id, string Email, string Name, string[] Roles, string[] Permissions, string CountryScope);
}

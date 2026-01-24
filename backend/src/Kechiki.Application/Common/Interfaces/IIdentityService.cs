using Kechiki.Domain.Enums;

namespace Kechiki.Application.Common.Interfaces;

public interface IIdentityService
{
    Task<(string Token, string UserId, string UserName)> LoginAsync(string email, string password);
    Task<(string UserId, string UserName)> RegisterAsync(string email, string password, string fullName, UserType userType);
}

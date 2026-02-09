using Kechiki.Domain.Enums;
using Microsoft.AspNetCore.Identity;

namespace Kechiki.Domain.Entities;

public class ApplicationUser : IdentityUser
{
    public string? FullName { get; set; }
    public UserType UserType { get; set; }
}

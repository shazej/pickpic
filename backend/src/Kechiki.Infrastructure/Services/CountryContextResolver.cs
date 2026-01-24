using Kechiki.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace Kechiki.Infrastructure.Services
{
    public class CountryContextResolver : ICountryContextResolver
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CountryContextResolver(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public Task<string> ResolveCountryCodeAsync()
        {
            var context = _httpContextAccessor.HttpContext;
            // Default to KW if not specified
            if (context == null) return Task.FromResult("KW");

            if (context.Request.Headers.TryGetValue("X-Country", out var code))
            {
                return Task.FromResult(code.ToString());
            }

            // TODO: Fallback to user profile preference if authenticated
            
            return Task.FromResult("KW");
        }
    }
}

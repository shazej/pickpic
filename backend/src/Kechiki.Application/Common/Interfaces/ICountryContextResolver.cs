using System.Threading.Tasks;

namespace Kechiki.Application.Common.Interfaces
{
    public interface ICountryContextResolver
    {
        Task<string> ResolveCountryCodeAsync();
    }
}

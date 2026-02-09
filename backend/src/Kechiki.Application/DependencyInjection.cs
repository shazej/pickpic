using Microsoft.Extensions.DependencyInjection;

namespace Kechiki.Application
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            // Register MediatR, Validators etc later
            return services;
        }
    }
}

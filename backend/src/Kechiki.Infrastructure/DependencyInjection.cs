using Kechiki.Application.Common.Interfaces;
using Kechiki.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Kechiki.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection");

            services.AddDbContext<ApplicationDbContext>((sp, options) =>
            {
                options.UseNpgsql(connectionString, o => 
                {
                    o.UseNetTopologySuite();
                    o.UseVector();
                });
            });

            services.AddIdentityCore<Kechiki.Domain.Entities.ApplicationUser>()
                .AddEntityFrameworkStores<ApplicationDbContext>();

            services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());

            services.AddStackExchangeRedisCache(options =>
            {
                options.Configuration = configuration.GetConnectionString("RedisConnection") ?? "localhost:6379";
            });

            services.AddScoped<ICountryContextResolver, Services.CountryContextResolver>();
            services.AddScoped<IIdentityService, Identity.IdentityService>();
            services.AddScoped<IComplianceService, Services.ComplianceService>();

            return services;
        }
    }
}

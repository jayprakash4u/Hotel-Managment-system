using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Hospitality.Persistence.Data;

namespace Hospitality.Persistence;

public static class DependencyInjection
{
    public static IServiceCollection AddPersistence(this IServiceCollection services, IConfiguration configuration)
    {
        AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

        var connectionString = configuration.GetConnectionString("DefaultConnection");

        services.AddDbContext<HospitalityDbContext>(options =>
        {
            if (string.IsNullOrEmpty(connectionString))
            {
                throw new InvalidOperationException("Connection string 'DefaultConnection' was not found.");
            }

            // Check if PostgreSQL or SQL Server
            if (connectionString.StartsWith("Host=", StringComparison.OrdinalIgnoreCase) ||
                connectionString.StartsWith("Server=", StringComparison.OrdinalIgnoreCase) && connectionString.Contains("Port=", StringComparison.OrdinalIgnoreCase) ||
                connectionString.Contains("supabase.com", StringComparison.OrdinalIgnoreCase) ||
                connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
            {
                options.UseNpgsql(connectionString, b => b.MigrationsAssembly(typeof(HospitalityDbContext).Assembly.FullName));
            }
            else
            {
                options.UseSqlServer(connectionString, b => b.MigrationsAssembly(typeof(HospitalityDbContext).Assembly.FullName));
            }
        });

        return services;
    }
}

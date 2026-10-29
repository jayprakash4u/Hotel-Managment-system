using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Hospitality.Persistence.Data;
using Xunit;
using Xunit.Abstractions;

namespace Hospitality.IntegrationTests;

public class DatabaseSchemaTests
{
    private readonly ITestOutputHelper _output;
    private const string ConnectionString = "Host=aws-0-ap-northeast-2.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.tdcxkajabulncqixvvzu;Password=TzUD36m8L4bxqfYt;Ssl Mode=Require;Trust Server Certificate=true";

    public DatabaseSchemaTests(ITestOutputHelper output)
    {
        _output = output;
        AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
    }

    private HospitalityDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<HospitalityDbContext>()
            .UseNpgsql(ConnectionString)
            .Options;
        return new HospitalityDbContext(options);
    }

    [Fact]
    public async Task PrintUsers()
    {
        await using var db = CreateDbContext();
        var canConnect = await db.Database.CanConnectAsync();
        _output.WriteLine($"CanConnect: {canConnect}");
        var users = await db.Users.ToListAsync();
        _output.WriteLine($"Users count: {users.Count}");
        var tables = await db.RestaurantTables.ToListAsync();
        _output.WriteLine($"RestaurantTables count: {tables.Count}");
        var reservations = await db.TableReservations.ToListAsync();
        _output.WriteLine($"TableReservations count: {reservations.Count}");
        var products = await db.POSProducts.ToListAsync();
        _output.WriteLine($"POSProducts count: {products.Count}");
    }
}

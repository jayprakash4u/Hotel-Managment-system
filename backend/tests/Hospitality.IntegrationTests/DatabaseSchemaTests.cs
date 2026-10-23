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
        var users = await db.Users.ToListAsync();
        foreach (var u in users)
        {
            _output.WriteLine($"User: id={u.Id}, username='{u.Username}', role='{u.Role}', hash='{u.PasswordHash}'");
        }
    }
}

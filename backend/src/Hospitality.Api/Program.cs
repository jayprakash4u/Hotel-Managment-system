using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc.Formatters;
using Microsoft.OpenApi.Models;
using Microsoft.EntityFrameworkCore;
using Hospitality.Infrastructure;
using Hospitality.Persistence;
using Hospitality.Persistence.Data;
using System.Text.Json;
using Hospitality.Api.Common;
using Supabase.Extensions.DependencyInjection;
using Hospitality.Api.Models;

var builder = WebApplication.CreateBuilder(args);

// Add Services
var jsonOptions = new JsonSerializerOptions
{
    ReferenceHandler = ReferenceHandler.IgnoreCycles,
    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
};

builder.Services.AddControllers(options =>
{
    // Replace default PipeWriter-based SystemTextJsonOutputFormatter with SafeJsonOutputFormatter
    // to avoid TestHost PipeWriter.UnflushedBytes runtime exceptions
    var stjFormatter = options.OutputFormatters.OfType<SystemTextJsonOutputFormatter>().FirstOrDefault();
    if (stjFormatter != null)
    {
        var idx = options.OutputFormatters.IndexOf(stjFormatter);
        options.OutputFormatters[idx] = new SafeJsonOutputFormatter(jsonOptions);
    }
    else
    {
        options.OutputFormatters.Insert(0, new SafeJsonOutputFormatter(jsonOptions));
    }
})
.AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
});

// Persistence (EF Core & Supabase PostgreSQL)
builder.Services.AddPersistence(builder.Configuration);

// Infrastructure (JWT Auth & Services)
builder.Services.AddInfrastructure(builder.Configuration);

// Supabase Client (Auth, Postgrest, Storage, Realtime)
builder.Services.AddSupabase(
    builder.Configuration["Supabase:Url"]!,
    builder.Configuration["Supabase:Key"]!
);

// CORS Policy (Permissive for local development with Next.js frontend on port 3000)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://127.0.0.1:3000")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Swagger / OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Hospitality Management System API",
        Version = "v1",
        Description = ".NET 8 Clean Architecture API for Grand Hospitality Management System"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Ensure safe schema updates for POSProduct (TrackStock and IsAvailable)
using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<HospitalityDbContext>();
        await db.Database.ExecuteSqlRawAsync(@"
            ALTER TABLE IF EXISTS ""POSProduct"" ADD COLUMN IF NOT EXISTS ""trackStock"" boolean DEFAULT false;
            ALTER TABLE IF EXISTS ""POSProduct"" ADD COLUMN IF NOT EXISTS ""isAvailable"" boolean DEFAULT true;
        ");
        logger.LogInformation("Database schema verified: POSProduct columns 'trackStock' and 'isAvailable' ready.");
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Could not execute automatic schema update for POSProduct.");
    }
}


// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment() || true)
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Hospitality API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/todos", async (Supabase.Client supabase) =>
{
    await supabase.InitializeAsync();
    var response = await supabase.From<Todo>().Get();
    return response.Models;
});

app.Run();

public partial class Program { }

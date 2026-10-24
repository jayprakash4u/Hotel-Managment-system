using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc.Formatters;
using Microsoft.OpenApi.Models;
using Hospitality.Infrastructure;
using Hospitality.Persistence;
using System.Text.Json;
using Hospitality.Api.Common;

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

app.Run();

public partial class Program { }

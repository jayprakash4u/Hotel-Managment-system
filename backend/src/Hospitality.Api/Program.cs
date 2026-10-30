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

// Background Schedulers
builder.Services.AddHostedService<Hospitality.Api.Services.TableReservationAlertService>();

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

// Ensure safe schema updates for POSProduct, TableReservation, and RestaurantOrder
using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<HospitalityDbContext>();
        await db.Database.ExecuteSqlRawAsync(@"
            ALTER TABLE IF EXISTS ""POSProduct"" ADD COLUMN IF NOT EXISTS ""trackStock"" boolean DEFAULT false;
            ALTER TABLE IF EXISTS ""POSProduct"" ADD COLUMN IF NOT EXISTS ""isAvailable"" boolean DEFAULT true;
            ALTER TABLE IF EXISTS ""POSProduct"" ADD COLUMN IF NOT EXISTS ""inventoryItemId"" text;
            ALTER TABLE IF EXISTS ""RestaurantOrder"" ADD COLUMN IF NOT EXISTS ""reservationId"" text;
            ALTER TABLE IF EXISTS ""RestaurantOrder"" ADD COLUMN IF NOT EXISTS ""discountAmount"" double precision DEFAULT 0;
            ALTER TABLE IF EXISTS ""RestaurantOrder"" ADD COLUMN IF NOT EXISTS ""discountPercent"" double precision DEFAULT 0;
            ALTER TABLE IF EXISTS ""RestaurantTable"" ADD COLUMN IF NOT EXISTS ""cleaningStatus"" text DEFAULT 'CLEAN';
            ALTER TABLE IF EXISTS ""RestaurantTable"" ADD COLUMN IF NOT EXISTS ""maintenanceNotes"" text;

            ALTER TABLE IF EXISTS ""InventoryItem"" ADD COLUMN IF NOT EXISTS ""department"" text DEFAULT 'HOTEL';
            ALTER TABLE IF EXISTS ""InventoryItem"" ADD COLUMN IF NOT EXISTS ""trackStock"" boolean DEFAULT true;
            UPDATE ""InventoryItem"" SET ""trackStock"" = false, ""currentStock"" = 0, ""minThreshold"" = 0 WHERE ""category"" IN ('FOOD_RAW', 'PANTRY', 'LINEN', 'TOILETRIES', 'CLEANING_SUPPLIES', 'EQUIPMENT', 'RESTAURANT_SUPPLIES') AND ""sku"" NOT IN ('RES-BEV-201', 'RES-BEV-202', 'HOT-AMN-401');
            ALTER TABLE IF EXISTS ""StockMovement"" ADD COLUMN IF NOT EXISTS ""department"" text DEFAULT 'HOTEL';
            ALTER TABLE IF EXISTS ""StockMovement"" ADD COLUMN IF NOT EXISTS ""sourceDepartment"" text;
            ALTER TABLE IF EXISTS ""StockMovement"" ADD COLUMN IF NOT EXISTS ""destinationDepartment"" text;
            ALTER TABLE IF EXISTS ""StockMovement"" ADD COLUMN IF NOT EXISTS ""transferNumber"" text;
            ALTER TABLE IF EXISTS ""StockMovement"" ADD COLUMN IF NOT EXISTS ""previousBalance"" integer;
            ALTER TABLE IF EXISTS ""StockMovement"" ADD COLUMN IF NOT EXISTS ""resultingBalance"" integer;
            ALTER TABLE IF EXISTS ""PurchaseOrder"" ADD COLUMN IF NOT EXISTS ""allocationsJson"" text DEFAULT '[]';
            ALTER TABLE IF EXISTS ""PurchaseOrder"" ADD COLUMN IF NOT EXISTS ""invoiceNumber"" text;
            ALTER TABLE IF EXISTS ""PurchaseOrder"" ALTER COLUMN ""supplierId"" DROP NOT NULL;

            CREATE TABLE IF NOT EXISTS ""TableReservation"" (
                ""id"" text PRIMARY KEY,
                ""hotelId"" text NOT NULL,
                ""tableId"" text,
                ""guestId"" text,
                ""customerName"" text NOT NULL,
                ""phoneNumber"" text NOT NULL,
                ""reservationDate"" timestamp with time zone NOT NULL,
                ""reservationTime"" text NOT NULL,
                ""durationMinutes"" integer NOT NULL DEFAULT 120,
                ""partySize"" integer NOT NULL DEFAULT 2,
                ""status"" text NOT NULL DEFAULT 'CONFIRMED',
                ""specialRequests"" text,
                ""internalNotes"" text,
                ""reservationCode"" text NOT NULL,
                ""orderId"" text,
                ""createdAt"" timestamp with time zone NOT NULL DEFAULT now(),
                ""updatedAt"" timestamp with time zone NOT NULL DEFAULT now()
            );

            CREATE INDEX IF NOT EXISTS ""ix_tablereservation_hotel_date"" ON ""TableReservation"" (""hotelId"", ""reservationDate"");
            CREATE INDEX IF NOT EXISTS ""ix_tablereservation_table_status"" ON ""TableReservation"" (""tableId"", ""status"");
            CREATE INDEX IF NOT EXISTS ""ix_inventoryitem_dept"" ON ""InventoryItem"" (""department"");

            CREATE TABLE IF NOT EXISTS ""Bill"" (
                ""id"" text PRIMARY KEY,
                ""hotelId"" text NOT NULL,
                ""billNumber"" text NOT NULL,
                ""billingType"" text NOT NULL DEFAULT 'QUICK_BILL',
                ""orderId"" text,
                ""orderNumber"" text,
                ""reservationId"" text,
                ""bookingCode"" text,
                ""guestId"" text,
                ""roomNumber"" text,
                ""tableNumber"" text,
                ""serverOrStaff"" text,
                ""customerName"" text,
                ""customerPhone"" text,
                ""subtotal"" double precision NOT NULL DEFAULT 0,
                ""discountAmount"" double precision NOT NULL DEFAULT 0,
                ""discountPercent"" double precision NOT NULL DEFAULT 0,
                ""taxAmount"" double precision NOT NULL DEFAULT 0,
                ""serviceCharge"" double precision NOT NULL DEFAULT 0,
                ""roundOff"" double precision NOT NULL DEFAULT 0,
                ""grandTotal"" double precision NOT NULL DEFAULT 0,
                ""amountPaid"" double precision NOT NULL DEFAULT 0,
                ""balanceDue"" double precision NOT NULL DEFAULT 0,
                ""paymentStatus"" text NOT NULL DEFAULT 'PAID',
                ""paymentMethod"" text NOT NULL DEFAULT 'CASH',
                ""itemsJson"" text NOT NULL DEFAULT '[]',
                ""paymentsJson"" text NOT NULL DEFAULT '[]',
                ""notes"" text,
                ""createdAt"" timestamp with time zone NOT NULL DEFAULT now(),
                ""updatedAt"" timestamp with time zone NOT NULL DEFAULT now()
            );

            CREATE UNIQUE INDEX IF NOT EXISTS ""ix_bill_hotel_number"" ON ""Bill"" (""hotelId"", ""billNumber"");
            CREATE INDEX IF NOT EXISTS ""ix_bill_type"" ON ""Bill"" (""billingType"");
            CREATE INDEX IF NOT EXISTS ""ix_bill_status"" ON ""Bill"" (""paymentStatus"");
            CREATE INDEX IF NOT EXISTS ""ix_bill_created"" ON ""Bill"" (""createdAt"");

            CREATE TABLE IF NOT EXISTS ""ReservationAlert"" (
                ""id"" text PRIMARY KEY,
                ""hotelId"" text NOT NULL,
                ""reservationId"" text NOT NULL,
                ""tableId"" text,
                ""alertType"" text NOT NULL DEFAULT 'PREPARATION_15MIN',
                ""scheduledFor"" timestamp with time zone NOT NULL,
                ""triggeredAt"" timestamp with time zone,
                ""status"" text NOT NULL DEFAULT 'ACTIVE',
                ""severity"" text NOT NULL DEFAULT 'WARNING',
                ""title"" text NOT NULL,
                ""message"" text NOT NULL,
                ""targetRoles"" text NOT NULL DEFAULT 'MANAGER,WAITER,STAFF',
                ""isRead"" boolean NOT NULL DEFAULT false,
                ""acknowledgedBy"" text,
                ""acknowledgedAt"" timestamp with time zone,
                ""createdAt"" timestamp with time zone NOT NULL DEFAULT now(),
                ""updatedAt"" timestamp with time zone NOT NULL DEFAULT now()
            );

            CREATE INDEX IF NOT EXISTS ""ix_reservationalert_status"" ON ""ReservationAlert"" (""status"");
            CREATE INDEX IF NOT EXISTS ""ix_reservationalert_res_type"" ON ""ReservationAlert"" (""reservationId"", ""alertType"");
            CREATE INDEX IF NOT EXISTS ""ix_reservationalert_hotel_status"" ON ""ReservationAlert"" (""hotelId"", ""status"");
        ");
        logger.LogInformation("Database schema verified: POSProduct, RestaurantOrder, TableReservation, Bills, and ReservationAlert tables ready.");
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Could not execute automatic schema update for TableReservation / POSProduct / Bill.");
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

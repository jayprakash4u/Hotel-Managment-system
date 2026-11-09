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
using Hospitality.Domain.Entities;
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
        var allowedOrigins = new List<string> { "http://localhost:3000", "http://127.0.0.1:3000" };
        var envOrigins = builder.Configuration["CORS__AllowedOrigins"];
        if (!string.IsNullOrEmpty(envOrigins))
        {
            allowedOrigins.AddRange(envOrigins.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
        }
        policy.WithOrigins(allowedOrigins.ToArray())
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
            ALTER TABLE IF EXISTS ""POSProduct"" ADD COLUMN IF NOT EXISTS ""variantsJson"" text DEFAULT '[]';
            ALTER TABLE IF EXISTS ""POSProduct"" ADD COLUMN IF NOT EXISTS ""department"" text DEFAULT 'KOT';
            ALTER TABLE IF EXISTS ""RestaurantOrderItem"" ADD COLUMN IF NOT EXISTS ""department"" text DEFAULT 'KOT';
            ALTER TABLE IF EXISTS ""RestaurantOrderItem"" ADD COLUMN IF NOT EXISTS ""dispatchedQuantity"" integer DEFAULT 0;
            ALTER TABLE IF EXISTS ""RestaurantOrderItem"" ADD COLUMN IF NOT EXISTS ""kotNumber"" text;
            ALTER TABLE IF EXISTS ""RestaurantOrderItem"" ADD COLUMN IF NOT EXISTS ""botNumber"" text;
            ALTER TABLE IF EXISTS ""RestaurantOrder"" ADD COLUMN IF NOT EXISTS ""botNumber"" text;
            ALTER TABLE IF EXISTS ""RestaurantOrder"" ADD COLUMN IF NOT EXISTS ""reservationId"" text;
            ALTER TABLE IF EXISTS ""RestaurantOrder"" ADD COLUMN IF NOT EXISTS ""customerName"" text;
            ALTER TABLE IF EXISTS ""RestaurantOrder"" ADD COLUMN IF NOT EXISTS ""customerPhone"" text;
            ALTER TABLE IF EXISTS ""RestaurantOrders"" ADD COLUMN IF NOT EXISTS ""CustomerName"" text;
            ALTER TABLE IF EXISTS ""RestaurantOrders"" ADD COLUMN IF NOT EXISTS ""CustomerPhone"" text;
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
            ALTER TABLE IF EXISTS ""StockMovement"" ADD COLUMN IF NOT EXISTS ""referenceNumber"" text;
            ALTER TABLE IF EXISTS ""StockMovement"" ADD COLUMN IF NOT EXISTS ""previousBalance"" integer;
            ALTER TABLE IF EXISTS ""StockMovement"" ADD COLUMN IF NOT EXISTS ""resultingBalance"" integer;
            ALTER TABLE IF EXISTS ""Supplier"" ADD COLUMN IF NOT EXISTS ""code"" text DEFAULT '';
            ALTER TABLE IF EXISTS ""Supplier"" ADD COLUMN IF NOT EXISTS ""panVatNumber"" text;
            ALTER TABLE IF EXISTS ""Supplier"" ADD COLUMN IF NOT EXISTS ""notes"" text;
            ALTER TABLE IF EXISTS ""Supplier"" ADD COLUMN IF NOT EXISTS ""isActive"" boolean DEFAULT true;
            ALTER TABLE IF EXISTS ""Supplier"" ADD COLUMN IF NOT EXISTS ""creditLimit"" double precision DEFAULT 0;
            ALTER TABLE IF EXISTS ""Supplier"" ADD COLUMN IF NOT EXISTS ""paymentTermsDays"" integer DEFAULT 0;
            ALTER TABLE IF EXISTS ""Supplier"" ADD COLUMN IF NOT EXISTS ""openingBalance"" double precision DEFAULT 0;

            ALTER TABLE IF EXISTS ""PurchaseOrder"" ADD COLUMN IF NOT EXISTS ""allocationsJson"" text DEFAULT '[]';
            ALTER TABLE IF EXISTS ""PurchaseOrder"" ADD COLUMN IF NOT EXISTS ""invoiceNumber"" text;
            ALTER TABLE IF EXISTS ""PurchaseOrder"" ADD COLUMN IF NOT EXISTS ""panVatNumber"" text;
            ALTER TABLE IF EXISTS ""PurchaseOrder"" ADD COLUMN IF NOT EXISTS ""supplierName"" text;
            ALTER TABLE IF EXISTS ""PurchaseOrder"" ADD COLUMN IF NOT EXISTS ""purchaseType"" text DEFAULT 'FULL';
            ALTER TABLE IF EXISTS ""PurchaseOrder"" ADD COLUMN IF NOT EXISTS ""subtotal"" double precision DEFAULT 0;
            ALTER TABLE IF EXISTS ""PurchaseOrder"" ADD COLUMN IF NOT EXISTS ""discount"" double precision DEFAULT 0;
            ALTER TABLE IF EXISTS ""PurchaseOrder"" ADD COLUMN IF NOT EXISTS ""tax"" double precision DEFAULT 0;
            ALTER TABLE IF EXISTS ""PurchaseOrder"" ADD COLUMN IF NOT EXISTS ""additionalCharges"" double precision DEFAULT 0;
            ALTER TABLE IF EXISTS ""PurchaseOrder"" ADD COLUMN IF NOT EXISTS ""paymentMethod"" text DEFAULT 'Cash';
            ALTER TABLE IF EXISTS ""PurchaseOrder"" ADD COLUMN IF NOT EXISTS ""paymentStatus"" text DEFAULT 'Paid';
            ALTER TABLE IF EXISTS ""PurchaseOrder"" ADD COLUMN IF NOT EXISTS ""notes"" text;
            ALTER TABLE IF EXISTS ""PurchaseOrder"" ADD COLUMN IF NOT EXISTS ""attachmentUrl"" text;
            ALTER TABLE IF EXISTS ""PurchaseOrder"" ADD COLUMN IF NOT EXISTS ""createdBy"" text DEFAULT 'Admin';
            ALTER TABLE IF EXISTS ""PurchaseOrder"" ADD COLUMN IF NOT EXISTS ""dueDate"" timestamp with time zone;
            ALTER TABLE IF EXISTS ""PurchaseOrder"" ALTER COLUMN ""supplierId"" DROP NOT NULL;

            ALTER TABLE IF EXISTS ""InventoryItem"" ADD COLUMN IF NOT EXISTS ""purchaseUnit"" text;
            ALTER TABLE IF EXISTS ""InventoryItem"" ADD COLUMN IF NOT EXISTS ""conversionFactor"" double precision DEFAULT 1.0;

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

            CREATE TABLE IF NOT EXISTS ""Hotels"" (
                ""id"" text PRIMARY KEY,
                ""name"" text NOT NULL DEFAULT '',
                ""slug"" text NOT NULL DEFAULT '',
                ""address"" text NOT NULL DEFAULT '',
                ""totalFloors"" integer NOT NULL DEFAULT 1,
                ""currency"" text NOT NULL DEFAULT 'NPR',
                ""timezone"" text NOT NULL DEFAULT 'Asia/Kathmandu',
                ""status"" text NOT NULL DEFAULT 'ACTIVE',
                ""createdAt"" timestamp with time zone NOT NULL DEFAULT now(),
                ""updatedAt"" timestamp with time zone NOT NULL DEFAULT now()
            );
            -- RoomType detailed setup columns
            ALTER TABLE ""RoomType"" ADD COLUMN IF NOT EXISTS ""roomSize"" text;
            ALTER TABLE ""RoomType"" ADD COLUMN IF NOT EXISTS ""roomView"" text;
            ALTER TABLE ""RoomType"" ADD COLUMN IF NOT EXISTS ""maxAdults"" integer NOT NULL DEFAULT 2;
            ALTER TABLE ""RoomType"" ADD COLUMN IF NOT EXISTS ""maxChildren"" integer NOT NULL DEFAULT 1;
            ALTER TABLE ""RoomType"" ADD COLUMN IF NOT EXISTS ""smokingPolicy"" text DEFAULT 'Non-Smoking';
            ALTER TABLE ""RoomType"" ADD COLUMN IF NOT EXISTS ""accessibility"" text;
            ALTER TABLE ""RoomType"" ADD COLUMN IF NOT EXISTS ""bedConfiguration"" text DEFAULT '[]';
            ALTER TABLE ""RoomType"" ADD COLUMN IF NOT EXISTS ""bathroomFacilities"" text DEFAULT '[]';
            ALTER TABLE ""RoomType"" ADD COLUMN IF NOT EXISTS ""galleryImages"" text DEFAULT '[]';
            ALTER TABLE ""RoomType"" ADD COLUMN IF NOT EXISTS ""policies"" text DEFAULT '{{}}';
            ALTER TABLE ""RoomType"" ADD COLUMN IF NOT EXISTS ""extraAdultPrice"" double precision NOT NULL DEFAULT 0;
            ALTER TABLE ""RoomType"" ADD COLUMN IF NOT EXISTS ""extraChildPrice"" double precision NOT NULL DEFAULT 0;
            ALTER TABLE ""RoomType"" ADD COLUMN IF NOT EXISTS ""weekendPrice"" double precision NOT NULL DEFAULT 0;

            -- Room detailed setup overrides
            ALTER TABLE ""Room"" ADD COLUMN IF NOT EXISTS ""roomSize"" text;
            ALTER TABLE ""Room"" ADD COLUMN IF NOT EXISTS ""roomView"" text;
            ALTER TABLE ""Room"" ADD COLUMN IF NOT EXISTS ""maxAdults"" integer NOT NULL DEFAULT 2;
            ALTER TABLE ""Room"" ADD COLUMN IF NOT EXISTS ""maxChildren"" integer NOT NULL DEFAULT 1;
            ALTER TABLE ""Room"" ADD COLUMN IF NOT EXISTS ""smokingPolicy"" text DEFAULT 'Non-Smoking';
            ALTER TABLE ""Room"" ADD COLUMN IF NOT EXISTS ""accessibility"" text;
            ALTER TABLE ""Room"" ADD COLUMN IF NOT EXISTS ""bedConfiguration"" text DEFAULT '[]';
            ALTER TABLE ""Room"" ADD COLUMN IF NOT EXISTS ""bathroomFacilities"" text DEFAULT '[]';
            ALTER TABLE ""Room"" ADD COLUMN IF NOT EXISTS ""galleryImages"" text DEFAULT '[]';
            ALTER TABLE ""Room"" ADD COLUMN IF NOT EXISTS ""policies"" text DEFAULT '{{}}';
            ALTER TABLE ""Room"" ADD COLUMN IF NOT EXISTS ""extraAdultPrice"" double precision NOT NULL DEFAULT 0;
            ALTER TABLE ""Room"" ADD COLUMN IF NOT EXISTS ""extraChildPrice"" double precision NOT NULL DEFAULT 0;
            ALTER TABLE ""Room"" ADD COLUMN IF NOT EXISTS ""weekendPrice"" double precision NOT NULL DEFAULT 0;

            -- Customer table
            CREATE TABLE IF NOT EXISTS ""Customer"" (
                ""id"" text PRIMARY KEY,
                ""hotelId"" text NOT NULL,
                ""name"" text NOT NULL,
                ""phone"" text NOT NULL,
                ""address"" text,
                ""customerType"" text NOT NULL DEFAULT 'CASH',
                ""creditLimit"" double precision NOT NULL DEFAULT 0,
                ""creditStatus"" text NOT NULL DEFAULT 'ACTIVE',
                ""openingBalance"" double precision NOT NULL DEFAULT 0,
                ""currentOutstanding"" double precision NOT NULL DEFAULT 0,
                ""notes"" text,
                ""createdBy"" text,
                ""updatedBy"" text,
                ""createdAt"" timestamp with time zone NOT NULL DEFAULT now(),
                ""updatedAt"" timestamp with time zone NOT NULL DEFAULT now()
            );
            CREATE UNIQUE INDEX IF NOT EXISTS ""ix_customer_hotel_phone"" ON ""Customer"" (""hotelId"", ""phone"");
            CREATE INDEX IF NOT EXISTS ""ix_customer_type"" ON ""Customer"" (""customerType"");
            CREATE INDEX IF NOT EXISTS ""ix_customer_status"" ON ""Customer"" (""creditStatus"");

            -- Customer Ledger Entry table
            CREATE TABLE IF NOT EXISTS ""CustomerLedgerEntry"" (
                ""id"" text PRIMARY KEY,
                ""hotelId"" text NOT NULL,
                ""customerId"" text NOT NULL,
                ""billId"" text,
                ""paymentId"" text,
                ""entryDate"" timestamp with time zone NOT NULL DEFAULT now(),
                ""description"" text NOT NULL,
                ""debitAmount"" double precision NOT NULL DEFAULT 0,
                ""creditAmount"" double precision NOT NULL DEFAULT 0,
                ""balance"" double precision NOT NULL DEFAULT 0,
                ""referenceType"" text NOT NULL DEFAULT 'CREDIT_BILL',
                ""referenceId"" text,
                ""paymentMode"" text,
                ""createdBy"" text,
                ""createdAt"" timestamp with time zone NOT NULL DEFAULT now()
            );
            CREATE INDEX IF NOT EXISTS ""ix_customer_ledger_customer"" ON ""CustomerLedgerEntry"" (""customerId"", ""entryDate"");
            CREATE INDEX IF NOT EXISTS ""ix_customer_ledger_bill"" ON ""CustomerLedgerEntry"" (""billId"");

            -- Supplier Ledger table (tracks credit purchases and payments to suppliers)
            CREATE TABLE IF NOT EXISTS ""SupplierLedgerEntry"" (
                ""id"" text PRIMARY KEY,
                ""hotelId"" text NOT NULL,
                ""supplierId"" text NOT NULL,
                ""purchaseOrderId"" text,
                ""entryDate"" timestamp with time zone NOT NULL DEFAULT now(),
                ""description"" text NOT NULL,
                ""creditAmount"" double precision NOT NULL DEFAULT 0,
                ""debitAmount"" double precision NOT NULL DEFAULT 0,
                ""balance"" double precision NOT NULL DEFAULT 0,
                ""dueDate"" timestamp with time zone,
                ""referenceType"" text NOT NULL DEFAULT 'PURCHASE_CREDIT',
                ""referenceId"" text,
                ""paymentMode"" text,
                ""createdBy"" text,
                ""createdAt"" timestamp with time zone NOT NULL DEFAULT now()
            );
            CREATE INDEX IF NOT EXISTS ""ix_supplier_ledger_supplier"" ON ""SupplierLedgerEntry"" (""supplierId"", ""entryDate"");
            CREATE INDEX IF NOT EXISTS ""ix_supplier_ledger_purchase_order"" ON ""SupplierLedgerEntry"" (""purchaseOrderId"");

            -- Credit Override Audit table
            CREATE TABLE IF NOT EXISTS ""CreditOverrideAudit"" (
                ""id"" text PRIMARY KEY,
                ""hotelId"" text NOT NULL,
                ""customerId"" text NOT NULL,
                ""billId"" text,
                ""billNumber"" text,
                ""previousAvailableCredit"" double precision NOT NULL DEFAULT 0,
                ""billAmount"" double precision NOT NULL DEFAULT 0,
                ""overrideAmount"" double precision NOT NULL DEFAULT 0,
                ""reason"" text NOT NULL,
                ""approvedBy"" text NOT NULL,
                ""approvedAt"" timestamp with time zone NOT NULL DEFAULT now()
            );
            CREATE INDEX IF NOT EXISTS ""ix_credit_override_customer"" ON ""CreditOverrideAudit"" (""customerId"");

            -- Bill table updates
            ALTER TABLE ""Bill"" ADD COLUMN IF NOT EXISTS ""customerId"" text;
            ALTER TABLE ""Bill"" ADD COLUMN IF NOT EXISTS ""outstandingAmount"" double precision NOT NULL DEFAULT 0;
            ALTER TABLE ""Bill"" ADD COLUMN IF NOT EXISTS ""paidAt"" timestamp with time zone;
            ALTER TABLE ""Bill"" ADD COLUMN IF NOT EXISTS ""packingCharge"" double precision NOT NULL DEFAULT 0;

            -- Packing Management Schema
            ALTER TABLE ""RestaurantOrder"" ADD COLUMN IF NOT EXISTS ""packingStatus"" text NOT NULL DEFAULT 'NONE';
            ALTER TABLE ""RestaurantOrder"" ADD COLUMN IF NOT EXISTS ""packingCharge"" double precision NOT NULL DEFAULT 0;
            ALTER TABLE ""RestaurantOrder"" ADD COLUMN IF NOT EXISTS ""packingDetailsJson"" text;
            ALTER TABLE ""RestaurantOrder"" ADD COLUMN IF NOT EXISTS ""packedAt"" timestamp with time zone;
            ALTER TABLE ""RestaurantOrder"" ADD COLUMN IF NOT EXISTS ""packedBy"" text;

            ALTER TABLE ""POSProduct"" ADD COLUMN IF NOT EXISTS ""packingConfigJson"" text DEFAULT '[]';

            CREATE TABLE IF NOT EXISTS ""TableCategory"" (
                ""id"" text PRIMARY KEY,
                ""hotelId"" text NOT NULL,
                ""name"" text NOT NULL,
                ""description"" text,
                ""floor"" text,
                ""displayOrder"" integer NOT NULL DEFAULT 0,
                ""isActive"" boolean NOT NULL DEFAULT true,
                ""createdAt"" timestamp with time zone NOT NULL DEFAULT now(),
                ""updatedAt"" timestamp with time zone NOT NULL DEFAULT now()
            );
            ALTER TABLE IF EXISTS ""RestaurantTable"" ADD COLUMN IF NOT EXISTS ""categoryId"" text;
            ALTER TABLE IF EXISTS ""RestaurantTable"" ADD COLUMN IF NOT EXISTS ""section"" text DEFAULT 'Main Area';

            CREATE TABLE IF NOT EXISTS ""PackingMaterial"" (
                ""id"" text PRIMARY KEY,
                ""hotelId"" text NOT NULL,
                ""name"" text NOT NULL,
                ""unit"" text NOT NULL DEFAULT 'pcs',
                ""purchaseCost"" double precision NOT NULL DEFAULT 0,
                ""packingCharge"" double precision NOT NULL DEFAULT 0,
                ""availableStock"" integer NOT NULL DEFAULT 0,
                ""minStockThreshold"" integer NOT NULL DEFAULT 20,
                ""status"" text NOT NULL DEFAULT 'ACTIVE',
                ""inventoryItemId"" text,
                ""createdAt"" timestamp with time zone NOT NULL DEFAULT now(),
                ""updatedAt"" timestamp with time zone NOT NULL DEFAULT now()
            );
            CREATE INDEX IF NOT EXISTS ""ix_packingmaterial_hotel"" ON ""PackingMaterial"" (""hotelId"");
            CREATE INDEX IF NOT EXISTS ""ix_packingmaterial_status"" ON ""PackingMaterial"" (""status"");

            CREATE TABLE IF NOT EXISTS ""PackingTransaction"" (
                ""id"" text PRIMARY KEY,
                ""hotelId"" text NOT NULL,
                ""materialId"" text NOT NULL,
                ""orderId"" text,
                ""orderNumber"" text,
                ""orderType"" text NOT NULL DEFAULT 'TAKEAWAY',
                ""quantity"" integer NOT NULL DEFAULT 1,
                ""unitCost"" double precision NOT NULL DEFAULT 0,
                ""totalCost"" double precision NOT NULL DEFAULT 0,
                ""packingCharge"" double precision NOT NULL DEFAULT 0,
                ""previousStock"" integer NOT NULL DEFAULT 0,
                ""resultingStock"" integer NOT NULL DEFAULT 0,
                ""type"" text NOT NULL DEFAULT 'CONSUMPTION',
                ""notes"" text,
                ""performedBy"" text,
                ""createdAt"" timestamp with time zone NOT NULL DEFAULT now()
            );
            CREATE INDEX IF NOT EXISTS ""ix_packingtrans_order"" ON ""PackingTransaction"" (""orderId"");
            CREATE INDEX IF NOT EXISTS ""ix_packingtrans_material"" ON ""PackingTransaction"" (""materialId"");
            CREATE INDEX IF NOT EXISTS ""ix_packingtrans_hotel"" ON ""PackingTransaction"" (""hotelId"");

            -- Accounting: Chart of Accounts, Journal Entries, and Lines
            CREATE TABLE IF NOT EXISTS ""Account"" (
                ""id"" text PRIMARY KEY,
                ""hotelId"" text NOT NULL,
                ""accountCode"" text NOT NULL,
                ""accountName"" text NOT NULL,
                ""accountType"" text NOT NULL DEFAULT 'ASSET',
                ""subCategory"" text NOT NULL DEFAULT 'Current Asset',
                ""normalBalance"" text NOT NULL DEFAULT 'DEBIT',
                ""openingBalance"" double precision NOT NULL DEFAULT 0,
                ""currentBalance"" double precision NOT NULL DEFAULT 0,
                ""description"" text,
                ""isActive"" boolean NOT NULL DEFAULT true,
                ""isSystemAccount"" boolean NOT NULL DEFAULT false,
                ""createdAt"" timestamp with time zone NOT NULL DEFAULT now(),
                ""updatedAt"" timestamp with time zone NOT NULL DEFAULT now()
            );
            CREATE UNIQUE INDEX IF NOT EXISTS ""ix_account_hotel_code"" ON ""Account"" (""hotelId"", ""accountCode"");
            CREATE INDEX IF NOT EXISTS ""ix_account_type"" ON ""Account"" (""accountType"");

            CREATE TABLE IF NOT EXISTS ""JournalEntry"" (
                ""id"" text PRIMARY KEY,
                ""hotelId"" text NOT NULL,
                ""entryNumber"" text NOT NULL,
                ""entryDate"" timestamp with time zone NOT NULL DEFAULT now(),
                ""reference"" text,
                ""description"" text NOT NULL DEFAULT '',
                ""totalDebit"" double precision NOT NULL DEFAULT 0,
                ""totalCredit"" double precision NOT NULL DEFAULT 0,
                ""status"" text NOT NULL DEFAULT 'POSTED',
                ""sourceModule"" text NOT NULL DEFAULT 'MANUAL',
                ""createdBy"" text NOT NULL DEFAULT 'Admin',
                ""createdAt"" timestamp with time zone NOT NULL DEFAULT now()
            );
            CREATE INDEX IF NOT EXISTS ""ix_journalentry_hotel_date"" ON ""JournalEntry"" (""hotelId"", ""entryDate"");
            CREATE INDEX IF NOT EXISTS ""ix_journalentry_number"" ON ""JournalEntry"" (""entryNumber"");

            CREATE TABLE IF NOT EXISTS ""JournalEntryLine"" (
                ""id"" text PRIMARY KEY,
                ""journalEntryId"" text NOT NULL,
                ""accountId"" text NOT NULL,
                ""accountCode"" text NOT NULL,
                ""accountName"" text NOT NULL,
                ""lineDescription"" text,
                ""debit"" double precision NOT NULL DEFAULT 0,
                ""credit"" double precision NOT NULL DEFAULT 0
            );
            CREATE INDEX IF NOT EXISTS ""ix_journalentryline_entry"" ON ""JournalEntryLine"" (""journalEntryId"");
            CREATE INDEX IF NOT EXISTS ""ix_journalentryline_account"" ON ""JournalEntryLine"" (""accountId"");

        ");
        logger.LogInformation("Database schema verified: POSProduct, RestaurantOrder, TableReservation, Bills, and Packing tables ready.");

        // Seed default PackingMaterials if none exist
        if (!await db.PackingMaterials.AnyAsync())
        {
            var hotel = await db.Hotels.FirstOrDefaultAsync();
            var hotelId = hotel?.Id ?? "hotel-default";
            var defaultMaterials = new List<PackingMaterial>
            {
                new PackingMaterial { HotelId = hotelId, Name = "Food Box (Standard)", Unit = "pcs", PurchaseCost = 5.0, PackingCharge = 15.0, AvailableStock = 150, MinStockThreshold = 30, Status = "ACTIVE" },
                new PackingMaterial { HotelId = hotelId, Name = "Burger Box (Eco Craft)", Unit = "pcs", PurchaseCost = 4.0, PackingCharge = 10.0, AvailableStock = 120, MinStockThreshold = 25, Status = "ACTIVE" },
                new PackingMaterial { HotelId = hotelId, Name = "Paper Carry Bag", Unit = "pcs", PurchaseCost = 3.0, PackingCharge = 10.0, AvailableStock = 200, MinStockThreshold = 40, Status = "ACTIVE" },
                new PackingMaterial { HotelId = hotelId, Name = "Sauce / Chutney Container (50ml)", Unit = "pcs", PurchaseCost = 1.5, PackingCharge = 5.0, AvailableStock = 300, MinStockThreshold = 50, Status = "ACTIVE" },
                new PackingMaterial { HotelId = hotelId, Name = "Hot / Cold Cup with Lid", Unit = "pcs", PurchaseCost = 3.5, PackingCharge = 10.0, AvailableStock = 180, MinStockThreshold = 35, Status = "ACTIVE" },
                new PackingMaterial { HotelId = hotelId, Name = "Wooden Cutlery & Napkin Set", Unit = "set", PurchaseCost = 2.0, PackingCharge = 5.0, AvailableStock = 250, MinStockThreshold = 50, Status = "ACTIVE" },
            };
            db.PackingMaterials.AddRange(defaultMaterials);
            await db.SaveChangesAsync();

            // Link sample menu items to default packing
            var allProducts = await db.POSProducts.ToListAsync();
            var foodBox = defaultMaterials.First(m => m.Name.StartsWith("Food Box"));
            var sauceContainer = defaultMaterials.First(m => m.Name.StartsWith("Sauce"));
            var burgerBox = defaultMaterials.First(m => m.Name.StartsWith("Burger Box"));
            var paperBag = defaultMaterials.First(m => m.Name.StartsWith("Paper Carry Bag"));
            var cupLid = defaultMaterials.First(m => m.Name.StartsWith("Hot / Cold Cup"));

            foreach (var p in allProducts)
            {
                if (p.Name.Contains("Burger", StringComparison.OrdinalIgnoreCase))
                {
                    p.PackingConfigJson = System.Text.Json.JsonSerializer.Serialize(new[]
                    {
                        new { materialId = burgerBox.Id, materialName = burgerBox.Name, quantity = 1 },
                        new { materialId = paperBag.Id, materialName = paperBag.Name, quantity = 1 }
                    });
                }
                else if (p.Name.Contains("Coffee", StringComparison.OrdinalIgnoreCase) || p.Name.Contains("Tea", StringComparison.OrdinalIgnoreCase) || p.Name.Contains("Shake", StringComparison.OrdinalIgnoreCase) || p.Name.Contains("Beverage", StringComparison.OrdinalIgnoreCase))
                {
                    p.PackingConfigJson = System.Text.Json.JsonSerializer.Serialize(new[]
                    {
                        new { materialId = cupLid.Id, materialName = cupLid.Name, quantity = 1 }
                    });
                }
                else
                {
                    p.PackingConfigJson = System.Text.Json.JsonSerializer.Serialize(new[]
                    {
                        new { materialId = foodBox.Id, materialName = foodBox.Name, quantity = 1 },
                        new { materialId = sauceContainer.Id, materialName = sauceContainer.Name, quantity = 1 }
                    });
                }
            }
            await db.SaveChangesAsync();
        }

        // Seed default TableCategory if none exist
        if (!await db.TableCategories.AnyAsync())
        {
            var hotel = await db.Hotels.FirstOrDefaultAsync();
            var hotelId = hotel?.Id ?? "hotel-default";
            var defaultCategories = new List<TableCategory>
            {
                new TableCategory { HotelId = hotelId, Name = "Dining Hall", Description = "Spacious indoor main dining hall", Floor = "Ground Floor", DisplayOrder = 1 },
                new TableCategory { HotelId = hotelId, Name = "Corridor Side", Description = "Window & corridor aisle seating", Floor = "Ground Floor", DisplayOrder = 2 },
                new TableCategory { HotelId = hotelId, Name = "Main Area", Description = "Central restaurant dining zone", Floor = "Ground Floor", DisplayOrder = 3 },
                new TableCategory { HotelId = hotelId, Name = "Skyline Rooftop Terrace", Description = "Panoramic rooftop outdoor view", Floor = "Rooftop", DisplayOrder = 4 },
                new TableCategory { HotelId = hotelId, Name = "Poolside Lounge & Bar", Description = "Relaxed open-air dining by the pool", Floor = "Ground Floor", DisplayOrder = 5 },
            };
            db.TableCategories.AddRange(defaultCategories);
            await db.SaveChangesAsync();

            // Link existing tables to their matching categories
            var allTables = await db.RestaurantTables.ToListAsync();
            foreach (var tbl in allTables)
            {
                var matchingCat = defaultCategories.FirstOrDefault(c => c.Name.Equals(tbl.Section, StringComparison.OrdinalIgnoreCase));
                if (matchingCat != null)
                {
                    tbl.CategoryId = matchingCat.Id;
                }
            }
            await db.SaveChangesAsync();
        }
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

app.UseStaticFiles();
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

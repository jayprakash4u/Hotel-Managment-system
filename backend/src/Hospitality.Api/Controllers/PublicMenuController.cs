using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;
using Hospitality.Infrastructure.Security;
using System.Text.Json;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/public/menu")]
public class PublicMenuController : ControllerBase
{
    private readonly HospitalityDbContext _db;

    public PublicMenuController(HospitalityDbContext db)
    {
        _db = db;
    }

    public record PublicVariantDto(string Unit, double Price);

    public record PublicMenuItemDto(
        string Id,
        string Code,
        string Name,
        string Category,
        string? Description,
        double Price,
        bool IsAvailable,
        string? ImageUrl,
        bool IsVeg,
        List<PublicVariantDto> Variants
    );

    public record PublicMenuResponse(
        string RestaurantName,
        string RestaurantSlug,
        string? LogoUrl,
        string? CoverImageUrl,
        string? Address,
        string Currency,
        string? WelcomeMessage,
        bool ShowPrices,
        bool ShowImages,
        bool ShowDescriptions,
        bool AllowOnlineOrdering,
        string? TableNumber,
        string? TableSection,
        List<string> Categories,
        List<PublicMenuItemDto> Items
    );

    // ----------------------------------------------------
    // 1. GET PUBLIC MENU BY RESTAURANT SLUG
    // ----------------------------------------------------
    [HttpGet("{slug}")]
    public async Task<IActionResult> GetPublicMenu(string slug, [FromQuery] string? qr, [FromQuery] string? tableId)
    {
        if (string.IsNullOrWhiteSpace(slug))
        {
            return BadRequest(ApiResponse.Fail("Restaurant identifier is required."));
        }

        var normalizedSlug = slug.Trim().ToLower();

        // 1. Resolve Hotel / Restaurant
        var hotel = await _db.Hotels
            .FirstOrDefaultAsync(h => h.Slug.ToLower() == normalizedSlug || h.Id.ToLower() == normalizedSlug);

        if (hotel == null || hotel.Status == "SUSPENDED")
        {
            return NotFound(ApiResponse.Fail("Restaurant not found or currently unavailable."));
        }

        // 2. Resolve Menu Settings
        var settings = await _db.RestaurantMenuSettings
            .FirstOrDefaultAsync(s => s.HotelId == hotel.Id);

        // Check if QR Menu is explicitly disabled by manager
        if (settings != null && !settings.IsEnabled)
        {
            return Ok(ApiResponse.Ok(new
            {
                isDisabled = true,
                message = "The Digital Menu is currently turned off by the restaurant management."
            }));
        }

        // 3. Resolve Table context if QR token was provided
        string? tableNumber = null;
        string? tableSection = null;

        if (!string.IsNullOrWhiteSpace(qr))
        {
            var tokenHash = QrTokenSecurity.HashToken(qr);
            var qrRecord = await _db.RestaurantQrCodes
                .Include(q => q.Table)
                .FirstOrDefaultAsync(q => q.TokenHash == tokenHash && q.HotelId == hotel.Id);

            if (qrRecord != null && qrRecord.IsActive)
            {
                // Increment scan metrics
                qrRecord.ScanCount += 1;
                qrRecord.LastScannedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();

                if (qrRecord.Table != null)
                {
                    tableNumber = qrRecord.Table.TableNumber;
                    tableSection = qrRecord.Table.Section;
                }
            }
        }
        else if (!string.IsNullOrWhiteSpace(tableId))
        {
            // Fallback table resolution for direct preview
            var table = await _db.RestaurantTables
                .FirstOrDefaultAsync(t => t.Id == tableId && t.HotelId == hotel.Id);
            if (table != null)
            {
                tableNumber = table.TableNumber;
                tableSection = table.Section;
            }
        }

        // 4. Fetch published and active menu products (POSProduct)
        var products = await _db.POSProducts
            .Where(p => p.HotelId == hotel.Id && p.IsPublished && p.Outlet == "RESTAURANT")
            .OrderBy(p => p.DisplayOrder)
            .ThenBy(p => p.Category)
            .ThenBy(p => p.Name)
            .ToListAsync();

        // If no products tied to hotelId yet, also check outlet fallback
        if (!products.Any())
        {
            products = await _db.POSProducts
                .Where(p => p.IsPublished && p.Outlet == "RESTAURANT")
                .OrderBy(p => p.Category)
                .ThenBy(p => p.Name)
                .ToListAsync();
        }

        var publicItems = new List<PublicMenuItemDto>();
        var categorySet = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var p in products)
        {
            var cat = string.IsNullOrWhiteSpace(p.Category) ? "Main Menu" : p.Category.Trim();
            categorySet.Add(cat);

            // Parse portion variants
            var variants = new List<PublicVariantDto>();
            if (!string.IsNullOrWhiteSpace(p.VariantsJson))
            {
                try
                {
                    using var doc = JsonDocument.Parse(p.VariantsJson);
                    if (doc.RootElement.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var el in doc.RootElement.EnumerateArray())
                        {
                            var unit = el.TryGetProperty("unit", out var uProp) ? uProp.GetString() : "Regular";
                            var price = el.TryGetProperty("price", out var pProp) ? pProp.GetDouble() : p.Price;
                            if (!string.IsNullOrWhiteSpace(unit))
                            {
                                variants.Add(new PublicVariantDto(unit, price));
                            }
                        }
                    }
                }
                catch
                {
                    // Fallback to base product price if JSON parsing fails
                }
            }

            if (!variants.Any())
            {
                variants.Add(new PublicVariantDto("Regular", p.Price));
            }

            bool isVeg = p.Category.ToLower().Contains("veg") && !p.Category.ToLower().Contains("non-veg");

            publicItems.Add(new PublicMenuItemDto(
                Id: p.Id,
                Code: p.Id.Length > 8 ? p.Id[..8].ToUpper() : p.Id,
                Name: p.Name,
                Category: cat,
                Description: settings?.ShowDescriptions == false ? null : p.Description,
                Price: settings?.ShowPrices == false ? 0 : p.Price,
                IsAvailable: p.IsAvailable,
                ImageUrl: settings?.ShowImages == false ? null : p.ImageUrl,
                IsVeg: isVeg,
                Variants: settings?.ShowPrices == false ? new List<PublicVariantDto>() : variants
            ));
        }

        var categories = categorySet.OrderBy(c => c).ToList();

        var response = new PublicMenuResponse(
            RestaurantName: settings?.PublicRestaurantName ?? hotel.Name,
            RestaurantSlug: hotel.Slug,
            LogoUrl: settings?.LogoUrl,
            CoverImageUrl: settings?.CoverImageUrl,
            Address: hotel.Address,
            Currency: hotel.Currency,
            WelcomeMessage: settings?.WelcomeMessage,
            ShowPrices: settings?.ShowPrices ?? true,
            ShowImages: settings?.ShowImages ?? true,
            ShowDescriptions: settings?.ShowDescriptions ?? true,
            AllowOnlineOrdering: settings?.AllowOnlineOrdering ?? false,
            TableNumber: tableNumber,
            TableSection: tableSection,
            Categories: categories,
            Items: publicItems
        );

        return Ok(ApiResponse.Ok(response));
    }

    // ----------------------------------------------------
    // 2. RESOLVE QR TOKEN & REDIRECT / RETURN MENU
    // ----------------------------------------------------
    [HttpGet("qr/{token}")]
    public async Task<IActionResult> ResolveQrToken(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return BadRequest(ApiResponse.Fail("QR Token is required."));
        }

        var tokenHash = QrTokenSecurity.HashToken(token);

        var qr = await _db.RestaurantQrCodes
            .Include(q => q.Hotel)
            .Include(q => q.Table)
            .FirstOrDefaultAsync(q => q.TokenHash == tokenHash);

        if (qr == null || !qr.IsActive)
        {
            return NotFound(ApiResponse.Fail("This QR code is invalid, deactivated, or has been revoked."));
        }

        if (qr.Hotel == null || qr.Hotel.Status == "SUSPENDED")
        {
            return NotFound(ApiResponse.Fail("The restaurant associated with this QR code is unavailable."));
        }

        // Increment scan count
        qr.ScanCount += 1;
        qr.LastScannedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            valid = true,
            restaurantSlug = qr.Hotel.Slug,
            restaurantName = qr.Hotel.Name,
            codeType = qr.CodeType,
            tableNumber = qr.Table?.TableNumber,
            tableSection = qr.Table?.Section,
            targetUrl = $"/menu/{qr.Hotel.Slug}?qr={token}"
        }));
    }
}

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;
using Hospitality.Infrastructure.Security;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/restaurant/qr-menu")]
public class RestaurantQrMenuController : ControllerBase
{
    private readonly HospitalityDbContext _db;

    public RestaurantQrMenuController(HospitalityDbContext db)
    {
        _db = db;
    }

    private async Task<string> ResolveHotelIdAsync(string? requestedHotelId = null)
    {
        // 1. Check JWT claim
        var claimHotelId = User.FindFirst("hotelId")?.Value;
        if (!string.IsNullOrWhiteSpace(claimHotelId)) return claimHotelId;

        // 2. Check explicitly provided ID (if admin)
        if (!string.IsNullOrWhiteSpace(requestedHotelId)) return requestedHotelId;

        // 3. Fallback to active hotel in system
        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        return hotel?.Id ?? "default_hotel";
    }

    // ----------------------------------------------------
    // 1. QR MENU SETTINGS (GET & PUT)
    // ----------------------------------------------------

    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings([FromQuery] string? hotelId)
    {
        var resolvedHotelId = await ResolveHotelIdAsync(hotelId);
        var hotel = await _db.Hotels.FirstOrDefaultAsync(h => h.Id == resolvedHotelId);
        if (hotel == null)
        {
            return NotFound(ApiResponse.Fail("Hotel/Restaurant not found."));
        }

        var settings = await _db.RestaurantMenuSettings
            .FirstOrDefaultAsync(s => s.HotelId == resolvedHotelId);

        if (settings == null)
        {
            // Auto-initialize default settings for the restaurant
            settings = new RestaurantMenuSettings
            {
                HotelId = resolvedHotelId,
                IsEnabled = true,
                ShowPrices = true,
                ShowImages = true,
                ShowDescriptions = true,
                AllowOnlineOrdering = false,
                PublicRestaurantName = hotel.Name,
                WelcomeMessage = "Welcome to our Digital Menu. Explore our dishes and beverages below.",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.RestaurantMenuSettings.Add(settings);
            await _db.SaveChangesAsync();
        }

        return Ok(ApiResponse.Ok(new
        {
            id = settings.Id,
            hotelId = settings.HotelId,
            restaurantName = hotel.Name,
            restaurantSlug = hotel.Slug,
            isEnabled = settings.IsEnabled,
            showPrices = settings.ShowPrices,
            showImages = settings.ShowImages,
            showDescriptions = settings.ShowDescriptions,
            allowOnlineOrdering = settings.AllowOnlineOrdering,
            publicRestaurantName = settings.PublicRestaurantName ?? hotel.Name,
            logoUrl = settings.LogoUrl,
            coverImageUrl = settings.CoverImageUrl,
            welcomeMessage = settings.WelcomeMessage,
            publicMenuUrl = $"/menu/{hotel.Slug}"
        }));
    }

    public record UpdateMenuSettingsRequest(
        string? HotelId,
        bool? IsEnabled,
        bool? ShowPrices,
        bool? ShowImages,
        bool? ShowDescriptions,
        bool? AllowOnlineOrdering,
        string? PublicRestaurantName,
        string? LogoUrl,
        string? CoverImageUrl,
        string? WelcomeMessage
    );

    [HttpPut("settings")]
    public async Task<IActionResult> UpdateSettings([FromBody] UpdateMenuSettingsRequest req)
    {
        var resolvedHotelId = await ResolveHotelIdAsync(req.HotelId);
        var hotel = await _db.Hotels.FirstOrDefaultAsync(h => h.Id == resolvedHotelId);
        if (hotel == null)
        {
            return NotFound(ApiResponse.Fail("Hotel/Restaurant not found."));
        }

        var settings = await _db.RestaurantMenuSettings
            .FirstOrDefaultAsync(s => s.HotelId == resolvedHotelId);

        if (settings == null)
        {
            settings = new RestaurantMenuSettings
            {
                HotelId = resolvedHotelId
            };
            _db.RestaurantMenuSettings.Add(settings);
        }

        if (req.IsEnabled.HasValue) settings.IsEnabled = req.IsEnabled.Value;
        if (req.ShowPrices.HasValue) settings.ShowPrices = req.ShowPrices.Value;
        if (req.ShowImages.HasValue) settings.ShowImages = req.ShowImages.Value;
        if (req.ShowDescriptions.HasValue) settings.ShowDescriptions = req.ShowDescriptions.Value;
        if (req.AllowOnlineOrdering.HasValue) settings.AllowOnlineOrdering = req.AllowOnlineOrdering.Value;
        if (req.PublicRestaurantName != null) settings.PublicRestaurantName = req.PublicRestaurantName.Trim();
        if (req.LogoUrl != null) settings.LogoUrl = req.LogoUrl.Trim();
        if (req.CoverImageUrl != null) settings.CoverImageUrl = req.CoverImageUrl.Trim();
        if (req.WelcomeMessage != null) settings.WelcomeMessage = req.WelcomeMessage.Trim();

        settings.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            message = "QR Menu settings updated successfully.",
            settings = new
            {
                id = settings.Id,
                hotelId = settings.HotelId,
                isEnabled = settings.IsEnabled,
                showPrices = settings.ShowPrices,
                showImages = settings.ShowImages,
                showDescriptions = settings.ShowDescriptions,
                allowOnlineOrdering = settings.AllowOnlineOrdering,
                publicRestaurantName = settings.PublicRestaurantName,
                logoUrl = settings.LogoUrl,
                coverImageUrl = settings.CoverImageUrl,
                welcomeMessage = settings.WelcomeMessage,
                publicMenuUrl = $"/menu/{hotel.Slug}"
            }
        }));
    }

    // ----------------------------------------------------
    // 2. QR CODES LISTING (GET)
    // ----------------------------------------------------

    [HttpGet("codes")]
    public async Task<IActionResult> GetQrCodes([FromQuery] string? hotelId)
    {
        var resolvedHotelId = await ResolveHotelIdAsync(hotelId);
        var hotel = await _db.Hotels.FirstOrDefaultAsync(h => h.Id == resolvedHotelId);
        if (hotel == null)
        {
            return NotFound(ApiResponse.Fail("Hotel/Restaurant not found."));
        }

        var existingCodes = await _db.RestaurantQrCodes
            .Include(q => q.Table)
            .Where(q => q.HotelId == resolvedHotelId)
            .OrderBy(q => q.CodeType == "RESTAURANT" ? 0 : 1)
            .ThenBy(q => q.Table != null ? q.Table.TableNumber : q.Label)
            .ToListAsync();

        // Also fetch active tables to identify tables that do not have a QR generated yet
        var tables = await _db.RestaurantTables
            .Where(t => t.HotelId == resolvedHotelId && t.Status != "OUT_OF_SERVICE")
            .OrderBy(t => t.TableNumber)
            .Select(t => new
            {
                id = t.Id,
                tableNumber = t.TableNumber,
                section = t.Section,
                capacity = t.Capacity
            })
            .ToListAsync();

        var result = existingCodes.Select(q => new
        {
            id = q.Id,
            codeType = q.CodeType,
            label = q.Label,
            tableId = q.TableId,
            tableNumber = q.Table?.TableNumber,
            section = q.Table?.Section,
            capacity = q.Table?.Capacity,
            isActive = q.IsActive,
            scanCount = q.ScanCount,
            lastScannedAt = q.LastScannedAt,
            createdAt = q.CreatedAt,
            // Reconstructed public target URL
            targetUrl = q.CodeType == "RESTAURANT"
                ? $"/menu/{hotel.Slug}"
                : $"/menu/{hotel.Slug}?tableId={q.TableId}"
        });

        return Ok(ApiResponse.Ok(new
        {
            hotelId = resolvedHotelId,
            hotelSlug = hotel.Slug,
            hotelName = hotel.Name,
            qrCodes = result,
            tables = tables
        }));
    }

    // ----------------------------------------------------
    // 3. GENERATE QR CODE (POST)
    // ----------------------------------------------------

    public record GenerateQrCodeRequest(
        string? HotelId,
        string CodeType, // "RESTAURANT" or "TABLE"
        string? TableId,
        string? CustomLabel
    );

    [HttpPost("generate")]
    public async Task<IActionResult> GenerateQrCode([FromBody] GenerateQrCodeRequest req)
    {
        var resolvedHotelId = await ResolveHotelIdAsync(req.HotelId);
        var hotel = await _db.Hotels.FirstOrDefaultAsync(h => h.Id == resolvedHotelId);
        if (hotel == null)
        {
            return NotFound(ApiResponse.Fail("Hotel/Restaurant not found."));
        }

        string rawToken = QrTokenSecurity.GenerateSecureToken();
        string tokenHash = QrTokenSecurity.HashToken(rawToken);

        RestaurantQrCode? qrEntry;

        if (req.CodeType.Equals("RESTAURANT", StringComparison.OrdinalIgnoreCase))
        {
            // Check if a restaurant-wide QR already exists
            qrEntry = await _db.RestaurantQrCodes
                .FirstOrDefaultAsync(q => q.HotelId == resolvedHotelId && q.CodeType == "RESTAURANT");

            if (qrEntry == null)
            {
                qrEntry = new RestaurantQrCode
                {
                    HotelId = resolvedHotelId,
                    CodeType = "RESTAURANT",
                    TableId = null,
                    Label = req.CustomLabel ?? $"{hotel.Name} - Main Menu",
                    TokenHash = tokenHash,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _db.RestaurantQrCodes.Add(qrEntry);
            }
            else
            {
                // Refresh token hash
                qrEntry.TokenHash = tokenHash;
                qrEntry.IsActive = true;
                qrEntry.Label = req.CustomLabel ?? qrEntry.Label;
                qrEntry.UpdatedAt = DateTime.UtcNow;
            }
        }
        else // TABLE QR
        {
            if (string.IsNullOrWhiteSpace(req.TableId))
            {
                return BadRequest(ApiResponse.Fail("TableId is required for table-wise QR code generation."));
            }

            var table = await _db.RestaurantTables.FirstOrDefaultAsync(t => t.Id == req.TableId && t.HotelId == resolvedHotelId);
            if (table == null)
            {
                return NotFound(ApiResponse.Fail("Specified restaurant table was not found."));
            }

            // Check if QR code for this table already exists
            qrEntry = await _db.RestaurantQrCodes
                .FirstOrDefaultAsync(q => q.HotelId == resolvedHotelId && q.TableId == table.Id);

            if (qrEntry == null)
            {
                qrEntry = new RestaurantQrCode
                {
                    HotelId = resolvedHotelId,
                    CodeType = "TABLE",
                    TableId = table.Id,
                    Label = req.CustomLabel ?? $"Table {table.TableNumber} ({table.Section})",
                    TokenHash = tokenHash,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _db.RestaurantQrCodes.Add(qrEntry);
            }
            else
            {
                // Refresh token hash
                qrEntry.TokenHash = tokenHash;
                qrEntry.IsActive = true;
                qrEntry.Label = req.CustomLabel ?? qrEntry.Label;
                qrEntry.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _db.SaveChangesAsync();

        // The raw token is returned only here so frontend can encode it into the QR code graphic and link
        var publicScanUrl = qrEntry.CodeType == "RESTAURANT"
            ? $"/menu/{hotel.Slug}?qr={rawToken}"
            : $"/menu/{hotel.Slug}?qr={rawToken}";

        return Ok(ApiResponse.Ok(new
        {
            message = "QR code generated successfully.",
            qrCode = new
            {
                id = qrEntry.Id,
                codeType = qrEntry.CodeType,
                label = qrEntry.Label,
                tableId = qrEntry.TableId,
                isActive = qrEntry.IsActive,
                rawToken = rawToken, // Returned at generation time for QR image encoding
                publicScanUrl = publicScanUrl,
                restaurantSlug = hotel.Slug
            }
        }));
    }

    // ----------------------------------------------------
    // 4. BATCH GENERATE ALL TABLE QRS (POST)
    // ----------------------------------------------------

    [HttpPost("generate-all-tables")]
    public async Task<IActionResult> GenerateAllTableQrs([FromQuery] string? hotelId)
    {
        var resolvedHotelId = await ResolveHotelIdAsync(hotelId);
        var hotel = await _db.Hotels.FirstOrDefaultAsync(h => h.Id == resolvedHotelId);
        if (hotel == null)
        {
            return NotFound(ApiResponse.Fail("Hotel/Restaurant not found."));
        }

        var tables = await _db.RestaurantTables
            .Where(t => t.HotelId == resolvedHotelId && t.Status != "OUT_OF_SERVICE")
            .ToListAsync();

        var existingQrs = await _db.RestaurantQrCodes
            .Where(q => q.HotelId == resolvedHotelId && q.CodeType == "TABLE")
            .ToListAsync();

        var generatedList = new List<object>();

        foreach (var table in tables)
        {
            string rawToken = QrTokenSecurity.GenerateSecureToken();
            string tokenHash = QrTokenSecurity.HashToken(rawToken);

            var qr = existingQrs.FirstOrDefault(q => q.TableId == table.Id);
            if (qr == null)
            {
                qr = new RestaurantQrCode
                {
                    HotelId = resolvedHotelId,
                    CodeType = "TABLE",
                    TableId = table.Id,
                    Label = $"Table {table.TableNumber} ({table.Section})",
                    TokenHash = tokenHash,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _db.RestaurantQrCodes.Add(qr);
            }
            else
            {
                qr.TokenHash = tokenHash;
                qr.IsActive = true;
                qr.UpdatedAt = DateTime.UtcNow;
            }

            generatedList.Add(new
            {
                id = qr.Id,
                tableId = table.Id,
                tableNumber = table.TableNumber,
                section = table.Section,
                rawToken = rawToken,
                publicScanUrl = $"/menu/{hotel.Slug}?qr={rawToken}"
            });
        }

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            message = $"Generated QR codes for {generatedList.Count} restaurant tables.",
            items = generatedList
        }));
    }

    // ----------------------------------------------------
    // 5. ACTIVATE / DEACTIVATE QR CODE (PATCH)
    // ----------------------------------------------------

    public record ToggleStatusRequest(bool IsActive);

    [HttpPatch("codes/{id}/status")]
    public async Task<IActionResult> ToggleQrStatus(string id, [FromBody] ToggleStatusRequest req)
    {
        var qr = await _db.RestaurantQrCodes.FirstOrDefaultAsync(q => q.Id == id);
        if (qr == null)
        {
            return NotFound(ApiResponse.Fail("QR Code record not found."));
        }

        qr.IsActive = req.IsActive;
        qr.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            message = $"QR code has been {(qr.IsActive ? "activated" : "deactivated")}.",
            id = qr.Id,
            isActive = qr.IsActive
        }));
    }

    // ----------------------------------------------------
    // 6. REVOKE / REGENERATE TOKEN (POST)
    // ----------------------------------------------------

    [HttpPost("codes/{id}/revoke")]
    public async Task<IActionResult> RevokeAndRegenerate(string id)
    {
        var qr = await _db.RestaurantQrCodes.Include(q => q.Hotel).FirstOrDefaultAsync(q => q.Id == id);
        if (qr == null)
        {
            return NotFound(ApiResponse.Fail("QR Code record not found."));
        }

        string rawToken = QrTokenSecurity.GenerateSecureToken();
        string tokenHash = QrTokenSecurity.HashToken(rawToken);

        qr.TokenHash = tokenHash;
        qr.IsActive = true;
        qr.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var slug = qr.Hotel?.Slug ?? "restaurant";

        return Ok(ApiResponse.Ok(new
        {
            message = "QR code token revoked and regenerated securely.",
            id = qr.Id,
            rawToken = rawToken,
            publicScanUrl = $"/menu/{slug}?qr={rawToken}"
        }));
    }
}

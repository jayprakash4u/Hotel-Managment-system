using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;
using System.Text.Json;
using System.Security.Claims;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/restaurant/website")]
public class RestaurantWebsiteController : ControllerBase
{
    private readonly HospitalityDbContext _db;

    public RestaurantWebsiteController(HospitalityDbContext db)
    {
        _db = db;
    }

    private async Task<string> ResolveHotelIdAsync(string? explicitHotelId)
    {
        if (!string.IsNullOrWhiteSpace(explicitHotelId))
        {
            return explicitHotelId;
        }

        var claimHotelId = User.FindFirstValue("HotelId") ?? User.FindFirstValue("hotelId");
        if (!string.IsNullOrWhiteSpace(claimHotelId))
        {
            return claimHotelId;
        }

        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        return hotel?.Id ?? "default_hotel";
    }

    public record SocialLinkItem(string Id, string Platform, string Url, string? Label);
    public record UsefulLinkItem(string Id, string Title, string Url);
    public record GalleryImageItem(string Id, string Title, string Category, string ImageUrl, string CreatedAt);

    public record UpdateWebsiteSettingsRequest(
        string? HotelId,
        bool? IsDeliveryEnabled,
        bool? ShareMyMenu,
        decimal? DeliveryFee,
        decimal? FreeDeliveryAbove,
        decimal? MinDeliveryOrder,
        bool? RequireOrderConfirmation,
        bool? IsEnabled,
        string? PhoneNumber,
        string? Address,
        string? GoogleMapsUrl,
        string? OpeningHours,
        string? PublicRestaurantName,
        string? LogoUrl,
        string? CoverImageUrl,
        string? WelcomeMessage,
        string? FooterText,
        string? Theme,
        List<SocialLinkItem>? SocialLinks,
        List<UsefulLinkItem>? UsefulLinks,
        List<GalleryImageItem>? GalleryImages
    );

    public record AddGalleryImageRequest(
        string? HotelId,
        string Title,
        string Category,
        string ImageUrl
    );

    // ----------------------------------------------------
    // 1. GET WEBSITE SETTINGS
    // ----------------------------------------------------
    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings([FromQuery] string? hotelId)
    {
        var resolvedHotelId = await ResolveHotelIdAsync(hotelId);
        var hotel = await _db.Hotels.FirstOrDefaultAsync(h => h.Id == resolvedHotelId);
        if (hotel == null)
        {
            return NotFound(ApiResponse.Fail("Hotel / Restaurant record not found."));
        }

        var settings = await _db.RestaurantMenuSettings
            .FirstOrDefaultAsync(s => s.HotelId == resolvedHotelId);

        if (settings == null)
        {
            settings = new RestaurantMenuSettings
            {
                HotelId = resolvedHotelId,
                IsEnabled = true,
                ShareMyMenu = true,
                IsDeliveryEnabled = false,
                ShowPrices = true,
                ShowImages = true,
                ShowDescriptions = true,
                PublicRestaurantName = hotel.Name,
                Address = hotel.Address,
                Theme = "emerald",
                WelcomeMessage = "Welcome to our restaurant. Explore our delicious food and authentic taste.",
                FooterText = $"© {DateTime.UtcNow.Year} {hotel.Name}. All rights reserved.",
                SocialLinksJson = "[]",
                UsefulLinksJson = "[]",
                GalleryImagesJson = "[]",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.RestaurantMenuSettings.Add(settings);
            await _db.SaveChangesAsync();
        }

        // Parse JSON lists safely
        var socialLinks = new List<SocialLinkItem>();
        if (!string.IsNullOrWhiteSpace(settings.SocialLinksJson))
        {
            try { socialLinks = JsonSerializer.Deserialize<List<SocialLinkItem>>(settings.SocialLinksJson) ?? new(); } catch { }
        }

        var usefulLinks = new List<UsefulLinkItem>();
        if (!string.IsNullOrWhiteSpace(settings.UsefulLinksJson))
        {
            try { usefulLinks = JsonSerializer.Deserialize<List<UsefulLinkItem>>(settings.UsefulLinksJson) ?? new(); } catch { }
        }

        var galleryImages = new List<GalleryImageItem>();
        if (!string.IsNullOrWhiteSpace(settings.GalleryImagesJson))
        {
            try { galleryImages = JsonSerializer.Deserialize<List<GalleryImageItem>>(settings.GalleryImagesJson) ?? new(); } catch { }
        }

        return Ok(ApiResponse.Ok(new
        {
            id = settings.Id,
            hotelId = settings.HotelId,
            restaurantName = hotel.Name,
            restaurantSlug = hotel.Slug,
            publicWebsiteUrl = $"/menu/{hotel.Slug}",
            isDeliveryEnabled = settings.IsDeliveryEnabled,
            shareMyMenu = settings.ShareMyMenu,
            deliveryFee = settings.DeliveryFee,
            freeDeliveryAbove = settings.FreeDeliveryAbove,
            minDeliveryOrder = settings.MinDeliveryOrder,
            requireOrderConfirmation = settings.RequireOrderConfirmation,
            isEnabled = settings.IsEnabled,
            phoneNumber = settings.PhoneNumber,
            address = settings.Address ?? hotel.Address,
            googleMapsUrl = settings.GoogleMapsUrl,
            openingHours = settings.OpeningHours ?? "10:00 AM - 10:00 PM (Daily)",
            publicRestaurantName = settings.PublicRestaurantName ?? hotel.Name,
            logoUrl = settings.LogoUrl,
            coverImageUrl = settings.CoverImageUrl,
            welcomeMessage = settings.WelcomeMessage,
            footerText = settings.FooterText,
            theme = settings.Theme ?? "emerald",
            socialLinks,
            usefulLinks,
            galleryImages
        }));
    }

    // ----------------------------------------------------
    // 2. UPDATE WEBSITE SETTINGS
    // ----------------------------------------------------
    [HttpPut("settings")]
    public async Task<IActionResult> UpdateSettings([FromBody] UpdateWebsiteSettingsRequest req)
    {
        var resolvedHotelId = await ResolveHotelIdAsync(req.HotelId);
        var hotel = await _db.Hotels.FirstOrDefaultAsync(h => h.Id == resolvedHotelId);
        if (hotel == null)
        {
            return NotFound(ApiResponse.Fail("Hotel / Restaurant record not found."));
        }

        var settings = await _db.RestaurantMenuSettings
            .FirstOrDefaultAsync(s => s.HotelId == resolvedHotelId);

        if (settings == null)
        {
            settings = new RestaurantMenuSettings
            {
                HotelId = resolvedHotelId,
                CreatedAt = DateTime.UtcNow
            };
            _db.RestaurantMenuSettings.Add(settings);
        }

        if (req.IsDeliveryEnabled.HasValue) settings.IsDeliveryEnabled = req.IsDeliveryEnabled.Value;
        if (req.ShareMyMenu.HasValue) settings.ShareMyMenu = req.ShareMyMenu.Value;
        if (req.DeliveryFee.HasValue) settings.DeliveryFee = req.DeliveryFee.Value;
        if (req.FreeDeliveryAbove.HasValue) settings.FreeDeliveryAbove = req.FreeDeliveryAbove.Value;
        if (req.MinDeliveryOrder.HasValue) settings.MinDeliveryOrder = req.MinDeliveryOrder.Value;
        if (req.RequireOrderConfirmation.HasValue) settings.RequireOrderConfirmation = req.RequireOrderConfirmation.Value;
        if (req.IsEnabled.HasValue) settings.IsEnabled = req.IsEnabled.Value;

        if (req.PhoneNumber != null) settings.PhoneNumber = req.PhoneNumber.Trim();
        if (req.Address != null) settings.Address = req.Address.Trim();
        if (req.GoogleMapsUrl != null) settings.GoogleMapsUrl = req.GoogleMapsUrl.Trim();
        if (req.OpeningHours != null) settings.OpeningHours = req.OpeningHours.Trim();
        if (req.PublicRestaurantName != null) settings.PublicRestaurantName = req.PublicRestaurantName.Trim();
        if (req.LogoUrl != null) settings.LogoUrl = req.LogoUrl.Trim();
        if (req.CoverImageUrl != null) settings.CoverImageUrl = req.CoverImageUrl.Trim();
        if (req.WelcomeMessage != null) settings.WelcomeMessage = req.WelcomeMessage.Trim();
        if (req.FooterText != null) settings.FooterText = req.FooterText.Trim();
        if (req.Theme != null) settings.Theme = req.Theme.Trim().ToLower();

        if (req.SocialLinks != null)
        {
            settings.SocialLinksJson = JsonSerializer.Serialize(req.SocialLinks);
        }

        if (req.UsefulLinks != null)
        {
            settings.UsefulLinksJson = JsonSerializer.Serialize(req.UsefulLinks);
        }

        if (req.GalleryImages != null)
        {
            settings.GalleryImagesJson = JsonSerializer.Serialize(req.GalleryImages);
        }

        settings.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new { message = "Website settings updated successfully." }));
    }

    // ----------------------------------------------------
    // 3. ADD GALLERY IMAGE
    // ----------------------------------------------------
    [HttpPost("gallery")]
    public async Task<IActionResult> AddGalleryImage([FromBody] AddGalleryImageRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.ImageUrl))
        {
            return BadRequest(ApiResponse.Fail("Image URL or upload is required."));
        }

        var resolvedHotelId = await ResolveHotelIdAsync(req.HotelId);
        var settings = await _db.RestaurantMenuSettings
            .FirstOrDefaultAsync(s => s.HotelId == resolvedHotelId);

        if (settings == null)
        {
            settings = new RestaurantMenuSettings { HotelId = resolvedHotelId };
            _db.RestaurantMenuSettings.Add(settings);
        }

        var galleryImages = new List<GalleryImageItem>();
        if (!string.IsNullOrWhiteSpace(settings.GalleryImagesJson))
        {
            try { galleryImages = JsonSerializer.Deserialize<List<GalleryImageItem>>(settings.GalleryImagesJson) ?? new(); } catch { }
        }

        var newItem = new GalleryImageItem(
            Id: $"img-{DateTime.UtcNow.Ticks}",
            Title: string.IsNullOrWhiteSpace(req.Title) ? "Restaurant Photo" : req.Title.Trim(),
            Category: string.IsNullOrWhiteSpace(req.Category) ? "Food & Drinks" : req.Category.Trim(),
            ImageUrl: req.ImageUrl.Trim(),
            CreatedAt: DateTime.UtcNow.ToString("o")
        );

        galleryImages.Insert(0, newItem);
        settings.GalleryImagesJson = JsonSerializer.Serialize(galleryImages);
        settings.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(newItem, "Image added to restaurant gallery."));
    }

    // ----------------------------------------------------
    // 4. DELETE GALLERY IMAGE
    // ----------------------------------------------------
    [HttpDelete("gallery/{id}")]
    public async Task<IActionResult> DeleteGalleryImage(string id, [FromQuery] string? hotelId)
    {
        var resolvedHotelId = await ResolveHotelIdAsync(hotelId);
        var settings = await _db.RestaurantMenuSettings
            .FirstOrDefaultAsync(s => s.HotelId == resolvedHotelId);

        if (settings == null || string.IsNullOrWhiteSpace(settings.GalleryImagesJson))
        {
            return NotFound(ApiResponse.Fail("Image not found."));
        }

        var galleryImages = new List<GalleryImageItem>();
        try { galleryImages = JsonSerializer.Deserialize<List<GalleryImageItem>>(settings.GalleryImagesJson) ?? new(); } catch { }

        var countBefore = galleryImages.Count;
        galleryImages = galleryImages.Where(g => g.Id != id).ToList();

        if (galleryImages.Count == countBefore)
        {
            return NotFound(ApiResponse.Fail("Image not found in gallery."));
        }

        settings.GalleryImagesJson = JsonSerializer.Serialize(galleryImages);
        settings.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new { message = "Image deleted from gallery." }));
    }
}

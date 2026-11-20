using System;

namespace Hospitality.Domain.Entities;

public class RestaurantMenuSettings : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public bool IsEnabled { get; set; } = true;
    public bool ShowPrices { get; set; } = true;
    public bool ShowImages { get; set; } = true;
    public bool ShowDescriptions { get; set; } = true;
    public bool AllowOnlineOrdering { get; set; } = false; // Kept disabled by default as specified

    public string? PublicRestaurantName { get; set; }
    public string? LogoUrl { get; set; }
    public string? CoverImageUrl { get; set; }
    public string? WelcomeMessage { get; set; }
    public string? FooterText { get; set; }

    // Website Module Settings
    public bool IsDeliveryEnabled { get; set; } = false;
    public bool ShareMyMenu { get; set; } = true;
    public decimal DeliveryFee { get; set; } = 0;
    public decimal FreeDeliveryAbove { get; set; } = 0;
    public decimal MinDeliveryOrder { get; set; } = 0;
    public bool RequireOrderConfirmation { get; set; } = true;
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public string? GoogleMapsUrl { get; set; }
    public string? OpeningHours { get; set; }
    public string? SocialLinksJson { get; set; } = "[]";
    public string? UsefulLinksJson { get; set; } = "[]";
    public string? GalleryImagesJson { get; set; } = "[]";
    public string? Theme { get; set; } = "emerald";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

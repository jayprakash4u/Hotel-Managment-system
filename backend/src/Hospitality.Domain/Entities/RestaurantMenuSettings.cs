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

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

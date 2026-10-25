using System.ComponentModel.DataAnnotations.Schema;

namespace Hospitality.Domain.Entities;

public class POSProduct : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string Outlet { get; set; } = "RESTAURANT"; // RESTAURANT, ROOFTOP_BAR, ZENITH_SPA, ROOM_SERVICE, MINIBAR
    public string Category { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public double Price { get; set; }
    public int Stock { get; set; } = 0;
    public bool TrackStock { get; set; } = false;
    public bool IsAvailable { get; set; } = true;
    public string? ImageUrl { get; set; }

    [NotMapped]
    public bool IsActive
    {
        get => IsAvailable;
        set => IsAvailable = value;
    }
}

namespace Hospitality.Domain.Entities;

public class TableCategory : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string Name { get; set; } = string.Empty; // e.g. "Dining Hall", "Corridor Side", "Main Area"
    public string? Description { get; set; }
    public string? Floor { get; set; } // e.g. "Ground Floor", "1st Floor", "Rooftop"
    public int DisplayOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<RestaurantTable> Tables { get; set; } = new List<RestaurantTable>();
}

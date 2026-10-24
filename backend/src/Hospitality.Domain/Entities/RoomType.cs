namespace Hospitality.Domain.Entities;

public class RoomType : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool HasAC { get; set; } = true;
    public string BedType { get; set; } = "King Bed";
    public int MaxCapacity { get; set; } = 2;
    public double BasePrice { get; set; } = 0.0;
    public string Amenities { get; set; } = "[]"; // JSON string array
    public string? ImageUrl { get; set; }
    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Room> Rooms { get; set; } = new List<Room>();
}

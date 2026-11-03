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

    // Detailed Setup & Booking Attributes
    public string? RoomSize { get; set; }
    public string? RoomView { get; set; }
    public int MaxAdults { get; set; } = 2;
    public int MaxChildren { get; set; } = 1;
    public string? SmokingPolicy { get; set; } = "Non-Smoking";
    public string? Accessibility { get; set; }
    public string BedConfiguration { get; set; } = "[]"; // JSON array of { bedType, quantity }
    public string BathroomFacilities { get; set; } = "[]"; // JSON array of string names
    public string GalleryImages { get; set; } = "[]"; // JSON array of { url, caption, category, isCover }
    public string Policies { get; set; } = "{}"; // JSON object with checkInTime, checkOutTime, cancellation, rules
    public double ExtraAdultPrice { get; set; } = 0.0;
    public double ExtraChildPrice { get; set; } = 0.0;
    public double WeekendPrice { get; set; } = 0.0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Room> Rooms { get; set; } = new List<Room>();
}

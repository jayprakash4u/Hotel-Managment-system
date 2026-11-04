namespace Hospitality.Domain.Entities;

public class Room : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }
    public string? RoomTypeId { get; set; }
    public RoomType? RoomType { get; set; }
    public string Number { get; set; } = string.Empty;
    public int Floor { get; set; } = 1;
    public string Type { get; set; } = string.Empty;
    public bool HasAC { get; set; } = true;
    public string BedType { get; set; } = "King Bed";
    public double PricePerNight { get; set; }
    public int Capacity { get; set; } = 2;
    public string SetupStatus { get; set; } = "OPERATIONAL"; // OPERATIONAL, UNDER_CONSTRUCTION, OUT_OF_SERVICE
    public string Status { get; set; } = "AVAILABLE"; // AVAILABLE, OCCUPIED, RESERVED, DIRTY, CLEANING, INSPECTED, MAINTENANCE
    public string Amenities { get; set; } = "[]";
    public string ImageUrl { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    // Detailed Setup & Overrides
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

    public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
    public ICollection<HousekeepingTask> HousekeepingTasks { get; set; } = new List<HousekeepingTask>();
    public ICollection<MaintenanceTicket> MaintenanceTickets { get; set; } = new List<MaintenanceTicket>();
    public ICollection<RestaurantOrder> Orders { get; set; } = new List<RestaurantOrder>();
}

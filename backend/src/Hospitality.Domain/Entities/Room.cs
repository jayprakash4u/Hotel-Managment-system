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

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
    public ICollection<HousekeepingTask> HousekeepingTasks { get; set; } = new List<HousekeepingTask>();
    public ICollection<MaintenanceTicket> MaintenanceTickets { get; set; } = new List<MaintenanceTicket>();
    public ICollection<RestaurantOrder> Orders { get; set; } = new List<RestaurantOrder>();
}

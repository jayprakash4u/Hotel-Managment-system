namespace Hospitality.Domain.Entities;

public class Guest : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string IdType { get; set; } = "Passport"; // Passport, National ID, Driving License, Citizenship Card
    public string IdNumber { get; set; } = string.Empty;
    public string Country { get; set; } = "Nepal";
    public string VipTier { get; set; } = "STANDARD"; // STANDARD, SILVER, GOLD, PLATINUM, DIAMOND
    public int LoyaltyPoints { get; set; } = 0;
    public string? Preferences { get; set; }
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
    public ICollection<RestaurantOrder> Orders { get; set; } = new List<RestaurantOrder>();
}

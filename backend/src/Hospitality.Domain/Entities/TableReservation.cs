namespace Hospitality.Domain.Entities;

public class TableReservation : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string? TableId { get; set; }
    public RestaurantTable? Table { get; set; }

    public string? GuestId { get; set; }
    public Guest? Guest { get; set; }

    public string CustomerName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public DateTime ReservationDate { get; set; } = DateTime.UtcNow.Date;
    public string ReservationTime { get; set; } = "19:00";
    public int DurationMinutes { get; set; } = 120;
    public int PartySize { get; set; } = 2;
    public string Status { get; set; } = "CONFIRMED"; // PENDING, CONFIRMED, SEATED, COMPLETED, CANCELLED, NO_SHOW
    public string? SpecialRequests { get; set; }
    public string? InternalNotes { get; set; }
    public string ReservationCode { get; set; } = string.Empty;
    public string? OrderId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

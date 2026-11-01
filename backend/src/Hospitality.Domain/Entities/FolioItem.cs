using System.ComponentModel.DataAnnotations.Schema;

namespace Hospitality.Domain.Entities;

public class FolioItem : BaseEntity
{
    public string ReservationId { get; set; } = string.Empty;
    public Reservation? Reservation { get; set; }

    public string Outlet { get; set; } = "ROOM_CHARGE"; // ROOM_CHARGE, RESTAURANT, ROOFTOP_BAR, ZENITH_SPA, ROOM_SERVICE, MINIBAR, LAUNDRY, TAX, DISCOUNT
    public string Description { get; set; } = string.Empty;
    public double UnitPrice { get; set; }
    public int Quantity { get; set; } = 1;
    public double Total { get; set; }
    public string? BilledBy { get; set; } = "Front Desk";
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    [NotMapped]
    public DateTime BilledAt
    {
        get => Timestamp;
        set => Timestamp = value;
    }
}

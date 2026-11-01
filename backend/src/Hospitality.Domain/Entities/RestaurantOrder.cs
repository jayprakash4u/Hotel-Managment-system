namespace Hospitality.Domain.Entities;

public class RestaurantOrder : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string OrderNumber { get; set; } = string.Empty; // ORD-XXXX
    public string KotNumber { get; set; } = string.Empty; // KOT-XXXX
    public string? BotNumber { get; set; } // BOT-XXXX
    public string Outlet { get; set; } = "RESTAURANT"; // RESTAURANT, ROOFTOP_BAR, ZENITH_SPA, ROOM_SERVICE
    public string? TableId { get; set; }
    public RestaurantTable? Table { get; set; }

    public string? RoomId { get; set; }
    public Room? Room { get; set; }

    public string? GuestId { get; set; }
    public Guest? Guest { get; set; }

    public string Status { get; set; } = "RECEIVED"; // RECEIVED, PREPARING, READY, SERVED, BILLED, CANCELLED
    public string OrderType { get; set; } = "DINE_IN"; // DINE_IN, ROOM_SERVICE, TAKEAWAY
    public string ServerName { get; set; } = "David Kim";
    public double Subtotal { get; set; } = 0;
    public double DiscountAmount { get; set; } = 0;
    public double DiscountPercent { get; set; } = 0;
    public double Tax { get; set; } = 0;
    public double ServiceCharge { get; set; } = 0;
    public double Total { get; set; } = 0;
    public string? PaymentMethod { get; set; } // ROOM_FOLIO, CASH, CARD, UPI
    public bool IsPaid { get; set; } = false;
    public string? ReservationId { get; set; }
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<RestaurantOrderItem> Items { get; set; } = new List<RestaurantOrderItem>();
}

namespace Hospitality.Domain.Entities;

public class ReservationAlert : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string ReservationId { get; set; } = string.Empty;
    public TableReservation? Reservation { get; set; }

    public string? TableId { get; set; }
    public RestaurantTable? Table { get; set; }

    public string AlertType { get; set; } = "PREPARATION_15MIN"; // PREPARATION_15MIN, OVERDUE_OCCUPIED, TABLE_DIRTY, OUT_OF_SERVICE
    public DateTime ScheduledFor { get; set; }
    public DateTime? TriggeredAt { get; set; }
    
    public string Status { get; set; } = "ACTIVE"; // ACTIVE, ACKNOWLEDGED, DISMISSED, CANCELLED
    public string Severity { get; set; } = "WARNING"; // INFO, WARNING, DANGER
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string TargetRoles { get; set; } = "MANAGER,WAITER,STAFF";
    
    public bool IsRead { get; set; } = false;
    public string? AcknowledgedBy { get; set; }
    public DateTime? AcknowledgedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

using System.ComponentModel.DataAnnotations.Schema;

namespace Hospitality.Domain.Entities;

public class RestaurantOrderItem : BaseEntity
{
    public string OrderId { get; set; } = string.Empty;
    public RestaurantOrder? Order { get; set; }

    public string ProductId { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;

    [NotMapped]
    public string Name
    {
        get => ProductName;
        set => ProductName = value;
    }

    public double UnitPrice { get; set; }
    public int Quantity { get; set; } = 1;
    public double Total { get; set; }
    public string? Notes { get; set; }
    public string Department { get; set; } = "KOT"; // KOT or BOT
    public string PreparationMethod { get; set; } = "NOT_CONFIGURED"; // Snapshot from product: READY_TO_SERVE, REQUIRES_PREPARATION, NOT_CONFIGURED
    public string Status { get; set; } = "RECEIVED"; // RECEIVED, PREPARING, READY, SERVED, CANCELLED
    public DateTime? PreparationStartedAt { get; set; }
    public DateTime? PreparationCompletedAt { get; set; }
    public string? PreparedBy { get; set; }
    public double? PreparationDurationMinutes { get; set; }
    public int DispatchedQuantity { get; set; } = 0; // Quantities successfully dispatched/printed
    public string? KotNumber { get; set; }
    public string? BotNumber { get; set; }
}

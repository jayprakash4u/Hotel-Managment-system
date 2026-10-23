namespace Hospitality.Domain.Entities;

public class StockMovement : BaseEntity
{
    public string ItemId { get; set; } = string.Empty;
    public InventoryItem? Item { get; set; }

    public int Quantity { get; set; }
    public string Type { get; set; } = "PURCHASE"; // PURCHASE, POS_CONSUMPTION, HOUSEKEEPING_USAGE, WASTAGE, ADJUSTMENT
    public string? Reason { get; set; }
    public string PerformedBy { get; set; } = "Inventory Manager";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

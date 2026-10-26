namespace Hospitality.Domain.Entities;

public class StockMovement : BaseEntity
{
    public string ItemId { get; set; } = string.Empty;
    public InventoryItem? Item { get; set; }

    public int Quantity { get; set; }
    public int? PreviousBalance { get; set; }
    public int? ResultingBalance { get; set; }
    public string Type { get; set; } = "PURCHASE"; // PURCHASE, POS_CONSUMPTION, HOUSEKEEPING_USAGE, WASTAGE, ADJUSTMENT, TRANSFER_IN, TRANSFER_OUT
    public string Department { get; set; } = "HOTEL"; // HOTEL, RESTAURANT
    public string? SourceDepartment { get; set; }
    public string? DestinationDepartment { get; set; }
    public string? TransferNumber { get; set; }
    public string? Reason { get; set; }
    public string PerformedBy { get; set; } = "Inventory Manager";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

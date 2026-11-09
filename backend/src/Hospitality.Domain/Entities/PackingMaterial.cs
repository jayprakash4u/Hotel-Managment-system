namespace Hospitality.Domain.Entities;

public class PackingMaterial : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string Name { get; set; } = string.Empty; // e.g. Food Box, Paper Bag, Sauce Container, Cup, Lid, Spoon
    public string Unit { get; set; } = "pcs"; // pcs, box, roll, pkt
    public double PurchaseCost { get; set; } = 0; // Actual material purchase cost to restaurant
    public double PackingCharge { get; set; } = 0; // Selling / packing charge billed to customer
    public int AvailableStock { get; set; } = 0;
    public int MinStockThreshold { get; set; } = 20; // Reorder alert level
    public string Status { get; set; } = "ACTIVE"; // ACTIVE, INACTIVE

    public string? InventoryItemId { get; set; }
    public InventoryItem? InventoryItem { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}


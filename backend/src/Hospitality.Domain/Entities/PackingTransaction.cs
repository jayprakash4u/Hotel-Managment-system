namespace Hospitality.Domain.Entities;

public class PackingTransaction : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string MaterialId { get; set; } = string.Empty;
    public PackingMaterial? Material { get; set; }

    public string? OrderId { get; set; }
    public string? OrderNumber { get; set; }
    public string OrderType { get; set; } = "TAKEAWAY"; // TAKEAWAY, DELIVERY

    public int Quantity { get; set; }
    public double UnitCost { get; set; }
    public double TotalCost { get; set; }
    public double PackingCharge { get; set; }

    public int PreviousStock { get; set; }
    public int ResultingStock { get; set; }

    public string Type { get; set; } = "CONSUMPTION"; // CONSUMPTION, RESTOCK, ADJUSTMENT
    public string? Notes { get; set; }
    public string? PerformedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}


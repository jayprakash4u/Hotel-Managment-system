using System.ComponentModel.DataAnnotations.Schema;

namespace Hospitality.Domain.Entities;

public class InventoryItem : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string Name { get; set; } = string.Empty;
    public string Department { get; set; } = "HOTEL"; // "HOTEL" or "RESTAURANT"
    public string Category { get; set; } = "LINEN"; // LINEN, TOILETRIES, BEVERAGES, FOOD_RAW, CLEANING_SUPPLIES, MINIBAR
    public string Sku { get; set; } = string.Empty;

    [NotMapped]
    public string ItemCode
    {
        get => Sku;
        set => Sku = value;
    }

    public bool TrackStock { get; set; } = true;
    public int CurrentStock { get; set; }
    public int MinThreshold { get; set; }

    [NotMapped]
    public double ReorderLevel
    {
        get => MinThreshold;
        set => MinThreshold = (int)value;
    }

    public string Unit { get; set; } = "pieces"; // pieces, bottles, kg, boxes, sets
    public double CostPerUnit { get; set; }

    [NotMapped]
    public double UnitCost
    {
        get => CostPerUnit;
        set => CostPerUnit = value;
    }

    public string? SupplierId { get; set; }
    public Supplier? Supplier { get; set; }
    public DateTime LastRestocked { get; set; } = DateTime.UtcNow;

    public ICollection<StockMovement> Movements { get; set; } = new List<StockMovement>();
}

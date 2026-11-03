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
    public string? PurchaseUnit { get; set; } // carton, case, crate, bag
    public double ConversionFactor { get; set; } = 1.0; // e.g. 1 carton = 24 bottles, factor = 24.0

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

    [NotMapped]
    public int? PreviousStock { get; set; }

    [NotMapped]
    public int? RecentlyAddedStock { get; set; }

    [NotMapped]
    public DateTime? PreviousPurchaseDate { get; set; }

    [NotMapped]
    public DateTime? LastPurchaseDate { get; set; }

    [NotMapped]
    public string? LastPurchaseQuantity { get; set; }

    [NotMapped]
    public double? PreviousPurchaseAmount { get; set; }

    [NotMapped]
    public double? LastPurchaseAmount { get; set; }

    [NotMapped]
    public double TotalPurchaseAmount { get; set; }

    [NotMapped]
    public string? LastSupplierName { get; set; }

    [NotMapped]
    public string StockStatus { get; set; } = "IN_STOCK";

    public ICollection<StockMovement> Movements { get; set; } = new List<StockMovement>();
}

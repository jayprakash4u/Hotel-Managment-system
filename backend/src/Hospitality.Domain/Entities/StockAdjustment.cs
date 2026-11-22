using System;

namespace Hospitality.Domain.Entities;

public class StockAdjustment : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string AdjustmentNumber { get; set; } = string.Empty;
    public DateTime AdjustmentDate { get; set; } = DateTime.UtcNow;
    public string Department { get; set; } = "SHARED"; // HOTEL, RESTAURANT, SHARED
    public string Status { get; set; } = "COMPLETED"; // COMPLETED, PENDING, DRAFT
    public string AdjustmentType { get; set; } = "INCREASE"; // INCREASE, DECREASE, MIXED
    public int ItemCount { get; set; } = 1;
    public int TotalQuantity { get; set; } = 0;
    public string PrimaryReason { get; set; } = "Stock Correction";
    public string? Notes { get; set; }
    public string AdjustedBy { get; set; } = "Inventory Manager";
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string ItemsJson { get; set; } = "[]";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

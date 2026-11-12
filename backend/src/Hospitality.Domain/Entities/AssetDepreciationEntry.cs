namespace Hospitality.Domain.Entities;

public class AssetDepreciationEntry : BaseEntity
{
    public string FixedAssetId { get; set; } = string.Empty;
    public FixedAsset? FixedAsset { get; set; }

    public string PeriodKey { get; set; } = string.Empty; // e.g. "2026-11" or "Period 1"
    public int PeriodNumber { get; set; }
    public DateTime PeriodDate { get; set; } = DateTime.UtcNow;

    public double OpeningBookValue { get; set; }
    public double DepreciationAmount { get; set; }
    public double AccumulatedDepreciation { get; set; }
    public double ClosingBookValue { get; set; }

    // Status: PENDING, POSTED
    public string Status { get; set; } = "PENDING";

    // Double-Entry Journal Entry
    public string? JournalEntryId { get; set; }
    public string? JournalEntryNumber { get; set; }
    public DateTime? PostedAt { get; set; }
    public string? PostedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}


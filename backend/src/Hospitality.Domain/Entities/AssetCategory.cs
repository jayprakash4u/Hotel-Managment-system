namespace Hospitality.Domain.Entities;

public class AssetCategory : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string CategoryName { get; set; } = string.Empty;
    public string CodePrefix { get; set; } = "AST"; // KIT, REF, FUR, IT, AC, VEH, BLD, ELE, OFA

    // Fixed Asset Cost Account (Asset, Debit)
    public string AssetAccountId { get; set; } = string.Empty;
    public string AssetAccountCode { get; set; } = string.Empty;
    public string AssetAccountName { get; set; } = string.Empty;

    // Accumulated Depreciation Account (Contra-Asset, Credit)
    public string AccumulatedDepreciationAccountId { get; set; } = string.Empty;
    public string AccumulatedDepreciationAccountCode { get; set; } = string.Empty;
    public string AccumulatedDepreciationAccountName { get; set; } = string.Empty;

    // Depreciation Expense Account (Expense, Debit)
    public string DepreciationExpenseAccountId { get; set; } = string.Empty;
    public string DepreciationExpenseAccountCode { get; set; } = string.Empty;
    public string DepreciationExpenseAccountName { get; set; } = string.Empty;

    public int DefaultUsefulLifeYears { get; set; } = 5;
    public string DefaultDepreciationMethod { get; set; } = "STRAIGHT_LINE";
    public double DefaultResidualValuePercentage { get; set; } = 0; // %

    public string? Description { get; set; }
    public bool IsSystem { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}


namespace Hospitality.Domain.Entities;

public class Account : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string AccountCode { get; set; } = string.Empty; // e.g. "1000", "1100", "1101"
    public string AccountName { get; set; } = string.Empty; // e.g. "Assets", "Current Assets", "Cash in Hand"
    public string AccountType { get; set; } = "ASSET"; // ASSET, LIABILITY, EQUITY, INCOME, EXPENSE (or REVENUE)
    public string SubCategory { get; set; } = "General"; // Category / Reporting Group
    public string NormalBalance { get; set; } = "DEBIT"; // DEBIT or CREDIT
    
    // Hierarchy: Parent / Child Grouping
    public string? ParentId { get; set; }
    public Account? Parent { get; set; }
    public ICollection<Account> Children { get; set; } = new List<Account>();
    public int AccountLevel { get; set; } = 3; // 1 = Top Root Group, 2 = Subgroup, 3 = Posting Ledger
    public bool IsGroup { get; set; } = false; // True = Parent Group (No direct postings), False = Posting Ledger
    
    // Controls & Permissions
    public bool IsControlAccount { get; set; } = false; // Linked to AR / AP / Bank subledgers
    public bool IsSystemAccount { get; set; } = false; // Protected from deletion
    public bool AllowManualEntries { get; set; } = true; // False if only system modules should post
    public bool IsActive { get; set; } = true;
    
    // Balances
    public double OpeningBalance { get; set; } = 0.0;
    public DateTime? OpeningBalanceDate { get; set; }
    public double CurrentBalance { get; set; } = 0.0;
    
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

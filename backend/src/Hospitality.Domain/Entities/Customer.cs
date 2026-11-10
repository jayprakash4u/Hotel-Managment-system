namespace Hospitality.Domain.Entities;

public class Customer : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string Name { get; set; } = string.Empty;
    public string? CustomerCode { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? PanVatNumber { get; set; }

    /// <summary>
    /// Customer type: "CASH", "CREDIT", "CORPORATE", "REGULAR"
    /// </summary>
    public string CustomerType { get; set; } = "CASH";

    /// <summary>
    /// Approved credit limit for purchases on credit (>= 0)
    /// </summary>
    public double CreditLimit { get; set; } = 0;

    /// <summary>
    /// Credit terms in days (e.g. 15, 30 days)
    /// </summary>
    public int CreditTerms { get; set; } = 30;

    /// <summary>
    /// Status: "ACTIVE", "BLOCKED", "ON_HOLD"
    /// </summary>
    public string CreditStatus { get; set; } = "ACTIVE";

    /// <summary>
    /// Starting / historical balance when migrating
    /// </summary>
    public double OpeningBalance { get; set; } = 0;

    /// <summary>
    /// Current outstanding balance owed by this customer
    /// </summary>
    public double CurrentOutstanding { get; set; } = 0;

    /// <summary>
    /// Advance payment balance held for this customer
    /// </summary>
    public double AdvanceBalance { get; set; } = 0;

    public string BranchOrOutlet { get; set; } = "RESTAURANT";
    public string? Notes { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<CustomerLedgerEntry> LedgerEntries { get; set; } = new List<CustomerLedgerEntry>();
    public ICollection<Bill> Bills { get; set; } = new List<Bill>();
}


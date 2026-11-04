namespace Hospitality.Domain.Entities;

public class Customer : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Address { get; set; }

    /// <summary>
    /// Customer type: "CASH" or "CREDIT"
    /// </summary>
    public string CustomerType { get; set; } = "CASH";

    /// <summary>
    /// Approved credit limit for purchases on credit (>= 0)
    /// </summary>
    public double CreditLimit { get; set; } = 0;

    /// <summary>
    /// Status: "ACTIVE" or "BLOCKED"
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

    public string? Notes { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<CustomerLedgerEntry> LedgerEntries { get; set; } = new List<CustomerLedgerEntry>();
    public ICollection<Bill> Bills { get; set; } = new List<Bill>();
}


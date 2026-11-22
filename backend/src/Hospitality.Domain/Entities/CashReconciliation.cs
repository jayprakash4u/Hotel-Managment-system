namespace Hospitality.Domain.Entities;

public class CashReconciliation : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string AccountId { get; set; } = string.Empty;
    public Account? Account { get; set; }

    public string ReconciliationNumber { get; set; } = string.Empty; // e.g. CRCN-2026-0001
    public DateTime ReconciliationDate { get; set; } = DateTime.UtcNow;

    public double SystemBalance { get; set; } = 0.0;
    public double PhysicalCount { get; set; } = 0.0;
    public double Difference { get; set; } = 0.0; // Physical - System

    public string Status { get; set; } = "MATCHED"; // MATCHED, PENDING_APPROVAL, APPROVED, REJECTED
    public string? Explanation { get; set; }
    public string? DenominationsJson { get; set; } // {"1000": 10, "500": 5, ...}

    public string ReconciledBy { get; set; } = string.Empty;
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }

    public string? JournalEntryId { get; set; }
    public JournalEntry? JournalEntry { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}


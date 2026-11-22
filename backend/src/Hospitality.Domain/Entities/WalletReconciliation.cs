namespace Hospitality.Domain.Entities;

public class WalletReconciliation : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string ReconciliationNumber { get; set; } = string.Empty; // e.g. "WREC-2026-0001"
    public string WalletAccountId { get; set; } = string.Empty;
    public DigitalWalletAccount? WalletAccount { get; set; }

    public DateTime ReconciliationDate { get; set; } = DateTime.UtcNow;
    public double SystemBalance { get; set; } = 0.0;
    public double StatementBalance { get; set; } = 0.0;
    public double Difference { get; set; } = 0.0; // Statement - System

    public double TotalReceipts { get; set; } = 0.0;
    public double TotalSettlements { get; set; } = 0.0;
    public double TotalRefunds { get; set; } = 0.0;
    public double TotalCharges { get; set; } = 0.0;

    public string Status { get; set; } = "MATCHED"; // MATCHED, APPROVED, PENDING_APPROVAL
    public string? Explanation { get; set; }

    public string ReconciledBy { get; set; } = "Admin";
    public string? ApprovedBy { get; set; }
    public string? JournalEntryId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}


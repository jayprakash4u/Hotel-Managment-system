namespace Hospitality.Domain.Entities;

public class WalletRefund : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string RefundNumber { get; set; } = string.Empty; // e.g. "WRF-2026-0001"
    public string WalletAccountId { get; set; } = string.Empty;
    public DigitalWalletAccount? WalletAccount { get; set; }

    public string? OriginalBillId { get; set; }
    public string? OriginalTransactionRef { get; set; }
    public DateTime RefundDate { get; set; } = DateTime.UtcNow;
    public double Amount { get; set; } = 0.0;
    public string ProviderReference { get; set; } = string.Empty; // e.g. eSewa Refund ID
    public string RefundReason { get; set; } = string.Empty;
    public string Status { get; set; } = "APPROVED"; // APPROVED, PENDING_APPROVAL, REJECTED

    public string? ApprovedBy { get; set; }
    public string? JournalEntryId { get; set; }
    public JournalEntry? JournalEntry { get; set; }

    public string CreatedBy { get; set; } = "Admin";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}


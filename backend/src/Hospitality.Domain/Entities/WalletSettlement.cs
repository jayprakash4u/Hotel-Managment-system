namespace Hospitality.Domain.Entities;

public class WalletSettlement : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string SettlementNumber { get; set; } = string.Empty; // e.g. "STLM-2026-0001"
    public string WalletAccountId { get; set; } = string.Empty;
    public DigitalWalletAccount? WalletAccount { get; set; }

    public DateTime SettlementDate { get; set; } = DateTime.UtcNow;
    public string SettlementReference { get; set; } = string.Empty; // Payout Ref / Batch ID

    public double GrossAmount { get; set; } = 0.0;
    public double WalletCharges { get; set; } = 0.0; // MDR Fee
    public double OtherDeductions { get; set; } = 0.0;
    public double NetAmount { get; set; } = 0.0; // Gross - Charges - Deductions

    public string DestinationBankAccountId { get; set; } = string.Empty;
    public Account? DestinationBankAccount { get; set; }

    public string? BankReference { get; set; }
    public string? Description { get; set; }
    public string Status { get; set; } = "COMPLETED"; // COMPLETED, PENDING, REVERSED

    public string? JournalEntryId { get; set; }
    public JournalEntry? JournalEntry { get; set; }

    public string CreatedBy { get; set; } = "Admin";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}


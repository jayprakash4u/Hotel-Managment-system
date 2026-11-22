namespace Hospitality.Domain.Entities;

public class IncomeTransaction : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string VoucherNumber { get; set; } = string.Empty; // e.g. "INC-2026-0001"
    public DateTime IncomeDate { get; set; } = DateTime.UtcNow;

    // Income Category & Linked GL Account
    public string CategoryId { get; set; } = string.Empty;
    public IncomeCategory? Category { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string CategoryType { get; set; } = "OPERATING"; // "OPERATING" or "NON_OPERATING"
    
    public string IncomeAccountId { get; set; } = string.Empty; // GL Account Credited
    public string IncomeAccountCode { get; set; } = string.Empty;
    public string IncomeAccountName { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;
    public double Amount { get; set; } = 0.0;

    // Settlement / Receiving Account (Cash drawer or Bank account or Digital Wallet)
    public string ReceivedThrough { get; set; } = "CASH"; // CASH, BANK, WALLET, CHEQUE, OTHER
    public string ReceivingAccountId { get; set; } = string.Empty; // GL Account Debited
    public string ReceivingAccountCode { get; set; } = string.Empty;
    public string ReceivingAccountName { get; set; } = string.Empty;

    public string? ReferenceNumber { get; set; } // Cheque #, transaction ref, UTR, slip #
    public string? PayerName { get; set; } // Client, corporate customer, guest, bank
    public string? AttachmentUrl { get; set; }
    public string? Notes { get; set; }
    public string? BranchOrOutlet { get; set; } = "Main Restaurant";

    // Status: DRAFT, POSTED, REVERSED
    public string Status { get; set; } = "DRAFT"; 

    // Double-entry accounting linkage
    public string? JournalEntryId { get; set; }
    public string? JournalEntryNumber { get; set; }
    public string? ReversalJournalEntryId { get; set; }
    public string? ReversalJournalEntryNumber { get; set; }
    public string? ReversalReason { get; set; }
    public string? ReversedBy { get; set; }
    public DateTime? ReversedAt { get; set; }

    public string CreatedBy { get; set; } = "Staff";
    public string? PostedBy { get; set; }
    public DateTime? PostedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}


namespace Hospitality.Domain.Entities;

public class ExpenseTransaction : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string VoucherNumber { get; set; } = string.Empty; // EXP-2026-XXXX
    public DateTime ExpenseDate { get; set; } = DateTime.UtcNow;

    // Configurable Category Link
    public string CategoryId { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public string CategoryType { get; set; } = "OPERATING"; // OPERATING, NON_OPERATING

    // Chart of Accounts Link (Expense Account)
    public string ExpenseAccountId { get; set; } = string.Empty;
    public string ExpenseAccountCode { get; set; } = string.Empty;
    public string ExpenseAccountName { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;
    public double TotalAmount { get; set; }
    public double PaidAmount { get; set; } = 0;
    public double RemainingPayable { get; set; } = 0;

    // Payment Status: PAID, PARTIALLY_PAID, UNPAID
    public string PaymentStatus { get; set; } = "PAID";
    public string PaymentMode { get; set; } = "CASH"; // CASH, BANK, WALLET, CHEQUE, CREDIT/UNPAID

    // Payment or Accrual Account (Cash/Bank Asset if Paid, or Expense Payable Liability if Unpaid)
    public string PaymentAccountId { get; set; } = string.Empty;
    public string PaymentAccountCode { get; set; } = string.Empty;
    public string PaymentAccountName { get; set; } = string.Empty;

    public string? PaidTo { get; set; } // Payee / Vendor / Utility Provider
    public string? ReferenceNumber { get; set; } // Bill #, Invoice #, Cheque #
    public string? AttachmentUrl { get; set; }
    public string? Notes { get; set; }
    public DateTime? DueDate { get; set; }
    public string? BranchOrOutlet { get; set; }

    // Workflow Status: DRAFT, POSTED, REVERSED
    public string Status { get; set; } = "DRAFT";

    // Double-Entry Journal Entry Link
    public string? JournalEntryId { get; set; }
    public string? JournalEntryNumber { get; set; }

    // Reversal Information
    public string? ReversalJournalEntryId { get; set; }
    public string? ReversalJournalEntryNumber { get; set; }
    public string? ReversalReason { get; set; }
    public string? ReversedBy { get; set; }
    public DateTime? ReversedAt { get; set; }

    // Audit Info
    public string? CreatedBy { get; set; }
    public string? PostedBy { get; set; }
    public DateTime? PostedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Subsequent payment settlements for unpaid/partially paid bills
    public List<ExpensePayment> Payments { get; set; } = new();
}


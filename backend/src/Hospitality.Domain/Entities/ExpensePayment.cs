namespace Hospitality.Domain.Entities;

public class ExpensePayment : BaseEntity
{
    public string ExpenseTransactionId { get; set; } = string.Empty;
    public ExpenseTransaction? ExpenseTransaction { get; set; }

    public string PaymentReceiptNumber { get; set; } = string.Empty; // PMT-EXP-2026-XXXX
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
    public double Amount { get; set; }

    // Payment Source (Asset)
    public string PaymentMode { get; set; } = "CASH"; // CASH, BANK, WALLET, CHEQUE
    public string PaymentAccountId { get; set; } = string.Empty;
    public string PaymentAccountCode { get; set; } = string.Empty;
    public string PaymentAccountName { get; set; } = string.Empty;

    public string? ReferenceNumber { get; set; }
    public string? PaidBy { get; set; }
    public string? Notes { get; set; }

    // Accounting Journal Entry
    public string? JournalEntryId { get; set; }
    public string? JournalEntryNumber { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}


namespace Hospitality.Domain.Entities;

public class BankReconciliationLine : BaseEntity
{
    public string ReconciliationId { get; set; } = string.Empty;
    public BankReconciliation? Reconciliation { get; set; }

    // Line Source: "SYSTEM" (GL Book Entry) or "STATEMENT" (Imported Bank/Wallet Statement Line)
    public string LineSource { get; set; } = "SYSTEM"; 

    // For SYSTEM line, links to actual JournalEntryLine
    public string? JournalEntryLineId { get; set; }
    public string? JournalEntryNumber { get; set; }

    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
    public string? ReferenceNumber { get; set; } // Cheque #, transaction ref, gateway order ID, UTR
    public string Description { get; set; } = string.Empty;
    public string? PayeeOrPayer { get; set; }
    
    public double Debit { get; set; } = 0.0; // Withdrawal / Payment out
    public double Credit { get; set; } = 0.0; // Deposit / Receipt in
    public double Amount { get; set; } = 0.0; // Net absolute or movement
    
    // Type classification: DEPOSIT, PAYMENT, TRANSFER, SETTLEMENT, BANK_CHARGE, INTEREST, WALLET_FEE, OTHER
    public string TransactionType { get; set; } = "DEPOSIT"; 

    // Match tracking
    public bool IsMatched { get; set; } = false;
    public string? MatchedLineId { get; set; } // Points to the corresponding paired line (SYSTEM <-> STATEMENT)
    public DateTime? MatchedAt { get; set; }
    public string? MatchRule { get; set; } // MANUAL, AUTO_EXACT, AUTO_REF, AUTO_APPROX, ADJUSTMENT
    public string Status { get; set; } = "UNMATCHED"; // UNMATCHED, MATCHED, EXCLUDED, ADJUSTED

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}


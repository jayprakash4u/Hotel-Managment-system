namespace Hospitality.Domain.Entities;

public class BankReconciliation : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string ReconciliationNumber { get; set; } = string.Empty; // e.g. "BREC-2026-0001" or "WREC-2026-0001"
    
    // Linked Account (Bank or Digital Wallet)
    public string AccountId { get; set; } = string.Empty;
    public Account? Account { get; set; }
    
    // Account Type: "BANK" or "DIGITAL_WALLET"
    public string AccountType { get; set; } = "BANK";
    
    // Reconciliation Period
    public DateTime StatementDate { get; set; } = DateTime.UtcNow;
    public DateTime PeriodStartDate { get; set; } = DateTime.UtcNow;
    public DateTime PeriodEndDate { get; set; } = DateTime.UtcNow;
    
    // Balances
    public double StatementOpeningBalance { get; set; } = 0.0;
    public double StatementEndingBalance { get; set; } = 0.0;
    public double BookOpeningBalance { get; set; } = 0.0;
    public double BookEndingBalance { get; set; } = 0.0;
    
    // Reconciliation Math
    public double TotalDepositsCleared { get; set; } = 0.0;
    public double TotalPaymentsCleared { get; set; } = 0.0;
    public double TotalDepositsInTransit { get; set; } = 0.0; // Unmatched system deposits
    public double TotalOutstandingChecks { get; set; } = 0.0; // Unmatched system payments/withdrawals
    
    public double BankCharges { get; set; } = 0.0; // Unrecorded charges identified on statement
    public double InterestEarned { get; set; } = 0.0; // Unrecorded interest on statement
    
    public double ReconciledBalance { get; set; } = 0.0; // StatementEndingBalance + TotalDepositsInTransit - TotalOutstandingChecks
    public double AdjustedBookBalance { get; set; } = 0.0; // BookEndingBalance + InterestEarned - BankCharges
    public double Difference { get; set; } = 0.0; // ReconciledBalance - AdjustedBookBalance
    
    // Status & Workflow: DRAFT, IN_PROGRESS, RECONCILED, FINALIZED
    public string Status { get; set; } = "IN_PROGRESS"; 
    public string ReconciledBy { get; set; } = "Accountant";
    public string? ApprovedBy { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? Notes { get; set; }
    
    // Statement Source / File
    public string? StatementFileName { get; set; }
    public string? StatementFormat { get; set; } // STANDARD_CSV, NABIL_BANK, GLOBAL_IME, ESEWA_SETTLEMENT, KHALTI_SETTLEMENT, MANUAL
    
    // Navigation
    public ICollection<BankReconciliationLine> Lines { get; set; } = new List<BankReconciliationLine>();
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}


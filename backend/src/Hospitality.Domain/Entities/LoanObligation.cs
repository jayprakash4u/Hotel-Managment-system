using System;
using System.Collections.Generic;

namespace Hospitality.Domain.Entities;

public class LoanObligation : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string LoanName { get; set; } = string.Empty; // e.g. "Nabil Bank Commercial Kitchen Term Loan"
    public string LoanReferenceNumber { get; set; } = string.Empty; // e.g. "LOAN-NAB-2026-001"
    public string LenderName { get; set; } = string.Empty; // e.g. "Nabil Bank Limited"
    public string Category { get; set; } = "Long-Term Bank Loans"; // Long-Term Bank Loans, Short-Term Loans, Long-Term Borrowings, Other Long-Term Liabilities
    public string LiabilityType { get; set; } = "NON_CURRENT"; // CURRENT, NON_CURRENT

    public string LinkedAccountId { get; set; } = string.Empty;
    public string LinkedAccountCode { get; set; } = "2500";
    public string LinkedAccountName { get; set; } = "Long-Term Bank Loan (Principal)";

    public double OriginalLoanAmount { get; set; } = 0.0;
    public double OutstandingPrincipal { get; set; } = 0.0;
    public double InterestRate { get; set; } = 0.0; // Percentage e.g. 10.5

    public DateTime LoanStartDate { get; set; } = DateTime.UtcNow;
    public DateTime MaturityDate { get; set; } = DateTime.UtcNow.AddYears(3);
    public string RepaymentFrequency { get; set; } = "MONTHLY"; // MONTHLY, QUARTERLY, ANNUALLY
    public DateTime? NextPaymentDueDate { get; set; }
    public double MonthlyInstallmentAmount { get; set; } = 0.0; // EMI / estimated installment

    public double TotalPrincipalPaid { get; set; } = 0.0;
    public double TotalInterestPaid { get; set; } = 0.0;

    public string Status { get; set; } = "ACTIVE"; // ACTIVE, PAID_OFF, DEFAULTED, DRAFT

    public string? DisbursementBankAccountId { get; set; }
    public string? DisbursementBankAccountName { get; set; }
    public string? AcquisitionJournalEntryId { get; set; }
    public string? AcquisitionJournalEntryNumber { get; set; }

    public string? Notes { get; set; }
    public string CreatedBy { get; set; } = "Admin";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<LoanRepaymentScheduleItem> RepaymentSchedule { get; set; } = new List<LoanRepaymentScheduleItem>();
}


using System;

namespace Hospitality.Domain.Entities;

public class LoanRepaymentScheduleItem : BaseEntity
{
    public string LoanObligationId { get; set; } = string.Empty;
    public LoanObligation? LoanObligation { get; set; }

    public int PeriodNumber { get; set; } = 1;
    public DateTime DueDate { get; set; } = DateTime.UtcNow;

    public double PrincipalDue { get; set; } = 0.0;
    public double InterestDue { get; set; } = 0.0;
    public double TotalDue { get; set; } = 0.0;

    public double PrincipalPaid { get; set; } = 0.0;
    public double InterestPaid { get; set; } = 0.0;
    public double TotalPaid { get; set; } = 0.0;

    public string Status { get; set; } = "PENDING"; // PENDING, PAID, PARTIAL, OVERDUE

    public DateTime? PaidDate { get; set; }
    public string? PaymentMode { get; set; }
    public string? PaymentAccountId { get; set; }
    public string? JournalEntryId { get; set; }
    public string? JournalEntryNumber { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}


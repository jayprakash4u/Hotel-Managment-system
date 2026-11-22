using System;

namespace Hospitality.Domain.Entities;

public class LiabilityAccountConfig : BaseEntity
{
    public string HotelId { get; set; } = string.Empty;
    public Hotel? Hotel { get; set; }

    public string AccountId { get; set; } = string.Empty;
    public string AccountCode { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;

    public string Category { get; set; } = "Other Current Liabilities"; 
    // Supplier Payables, Expense Payables, Salary & Wages Payables, Tax Payables, Customer Advances, Short-Term Loans, Other Current Liabilities, Long-Term Bank Loans, Long-Term Borrowings, Other Long-Term Liabilities

    public string Classification { get; set; } = "CURRENT"; // CURRENT, NON_CURRENT

    public string SourceModule { get; set; } = "GENERAL_LEDGER"; // SUPPLIER_LEDGER, EXPENSES, PAYROLL, TAX, CUSTOMER_ADVANCE, LOAN, GENERAL_LEDGER

    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}


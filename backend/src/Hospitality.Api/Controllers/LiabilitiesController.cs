using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/liabilities")]
public class LiabilitiesController : ControllerBase
{
    private readonly HospitalityDbContext _db;
    private readonly ILogger<LiabilitiesController> _logger;

    public LiabilitiesController(HospitalityDbContext db, ILogger<LiabilitiesController> logger)
    {
        _db = db;
        _logger = logger;
    }

    private async Task<string> GetCurrentHotelIdAsync()
    {
        var hotelClaim = User.FindFirst("HotelId")?.Value;
        if (!string.IsNullOrEmpty(hotelClaim))
            return hotelClaim;

        var firstHotel = await _db.Hotels.FirstOrDefaultAsync();
        return firstHotel?.Id ?? "hotel-default";
    }

    private async Task EnsureStandardLiabilityAccountsAsync(string hotelId)
    {
        var accountsCount = await _db.Accounts.CountAsync();
        if (accountsCount == 0)
        {
            var seedAccounts = AccountsController.GetStandardHospitalityAccounts(hotelId);
            _db.Accounts.AddRange(seedAccounts);
            await _db.SaveChangesAsync();
        }
        else
        {
            // Verify critical non-current and current accounts exist
            var existingCodes = await _db.Accounts.Select(a => a.AccountCode).ToListAsync();
            var toAdd = new List<Account>();

            void EnsureAcc(string code, string name, string subCat, string normalBal, double openBal, string desc)
            {
                if (!existingCodes.Contains(code))
                {
                    toAdd.Add(new Account
                    {
                        HotelId = hotelId,
                        AccountCode = code,
                        AccountName = name,
                        AccountType = "LIABILITY",
                        SubCategory = subCat,
                        NormalBalance = normalBal,
                        OpeningBalance = openBal,
                        CurrentBalance = openBal,
                        Description = desc
                    });
                }
            }

            EnsureAcc("2070", "TDS / Withholding Tax Payable", "Tax Liabilities", "CREDIT", 0, "Tax deducted at source on rent and services");
            EnsureAcc("2080", "Customer Banquet & Party Advances", "Customer Advances", "CREDIT", 0, "Advance deposits for events");
            EnsureAcc("2110", "Short-Term Bank Borrowings & Overdraft", "Short-Term Borrowings", "CREDIT", 0, "Working capital credit line");
            EnsureAcc("2190", "Other Current Accrued Liabilities", "Other Current Liabilities", "CREDIT", 0, "Sundry accrued current liabilities");
            EnsureAcc("2500", "Long-Term Bank Loan (Principal)", "Long-Term Liabilities", "CREDIT", 0, "Commercial bank term loan");
            EnsureAcc("2510", "Equipment Financing & Hire Purchase", "Long-Term Liabilities", "CREDIT", 0, "Kitchen equipment financing");
            EnsureAcc("2590", "Directors / Owners Long-Term Borrowings", "Long-Term Liabilities", "CREDIT", 0, "Unsecured shareholder loans");

            if (toAdd.Count > 0)
            {
                _db.Accounts.AddRange(toAdd);
                await _db.SaveChangesAsync();
            }
        }
    }

    #region Private Aggregation Helper

    public class LiabilityOverviewItem
    {
        public string Id { get; set; } = string.Empty;
        public string LiabilityName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Classification { get; set; } = "CURRENT"; // CURRENT, NON_CURRENT
        public string RelatedParty { get; set; } = string.Empty;
        public double OriginalAmount { get; set; } = 0.0;
        public double TotalPaid { get; set; } = 0.0;
        public double OutstandingBalance { get; set; } = 0.0;
        public DateTime? DueDate { get; set; }
        public bool IsOverdue { get; set; }
        public int DaysOverdue { get; set; }
        public string Status { get; set; } = "OUTSTANDING"; // OUTSTANDING, PARTIALLY_PAID, PAID, OVERDUE
        public string SourceModule { get; set; } = "GENERAL_LEDGER"; // SUPPLIER_LEDGER, EXPENSES, PAYROLL, TAX, CUSTOMER_ADVANCE, LOAN, GENERAL_LEDGER
        public string? SourceTransactionId { get; set; }
        public string? SourceReferenceNumber { get; set; }
        public string LinkedAccountCode { get; set; } = string.Empty;
        public string LinkedAccountName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    private async Task<List<LiabilityOverviewItem>> CollectAllLiabilitiesAsync(string hotelId, DateTime today)
    {
        var items = new List<LiabilityOverviewItem>();

        // 1. Collect Supplier Payables
        var suppliers = await _db.Suppliers
            .Where(s => s.IsActive)
            .ToListAsync();

        foreach (var s in suppliers)
        {
            var latestEntry = await _db.SupplierLedgers
                .Where(e => e.SupplierId == s.Id)
                .OrderByDescending(e => e.EntryDate)
                .ThenByDescending(e => e.Id)
                .FirstOrDefaultAsync();

            double bal = latestEntry != null ? latestEntry.Balance : s.OpeningBalance;
            if (bal > 0)
            {
                var creditEntry = await _db.SupplierLedgers
                    .Where(e => e.SupplierId == s.Id && e.CreditAmount > 0)
                    .OrderByDescending(e => e.EntryDate)
                    .FirstOrDefaultAsync();

                var dueDate = creditEntry?.DueDate ?? creditEntry?.EntryDate.AddDays(s.PaymentTermsDays > 0 ? s.PaymentTermsDays : 30);
                bool isOverdue = dueDate.HasValue && dueDate.Value < today;
                int daysOverdue = isOverdue ? (int)(today - dueDate!.Value).TotalDays : 0;

                items.Add(new LiabilityOverviewItem
                {
                    Id = $"sup-{s.Id}",
                    LiabilityName = $"Payable: {s.Name}",
                    Category = "Supplier Payables",
                    Classification = "CURRENT",
                    RelatedParty = s.Name,
                    OriginalAmount = creditEntry?.CreditAmount > 0 ? creditEntry.CreditAmount : bal,
                    TotalPaid = Math.Max(0, (creditEntry?.CreditAmount ?? bal) - bal),
                    OutstandingBalance = Math.Round(bal, 2),
                    DueDate = dueDate,
                    IsOverdue = isOverdue,
                    DaysOverdue = daysOverdue,
                    Status = isOverdue ? "OVERDUE" : (bal < (creditEntry?.CreditAmount ?? bal) ? "PARTIALLY_PAID" : "OUTSTANDING"),
                    SourceModule = "SUPPLIER_LEDGER",
                    SourceTransactionId = s.Id,
                    SourceReferenceNumber = s.Code,
                    LinkedAccountCode = "2010",
                    LinkedAccountName = "Accounts Payable - Suppliers & Vendors",
                    CreatedAt = s.CreatedAt
                });
            }
        }

        // 2. Collect Expense Payables
        var unpaidExpenses = await _db.ExpenseTransactions
            .Where(e => e.Status != "REVERSED" && (e.PaymentStatus == "UNPAID" || e.PaymentStatus == "PARTIAL") && e.RemainingPayable > 0)
            .OrderByDescending(e => e.ExpenseDate)
            .ToListAsync();

        foreach (var exp in unpaidExpenses)
        {
            var dueDate = exp.DueDate ?? exp.ExpenseDate.AddDays(15);
            bool isOverdue = dueDate < today;
            int daysOverdue = isOverdue ? (int)(today - dueDate).TotalDays : 0;

            items.Add(new LiabilityOverviewItem
            {
                Id = $"exp-{exp.Id}",
                LiabilityName = exp.Description,
                Category = "Expense Payables",
                Classification = "CURRENT",
                RelatedParty = !string.IsNullOrEmpty(exp.PaidTo) ? exp.PaidTo : exp.CategoryName,
                OriginalAmount = exp.TotalAmount,
                TotalPaid = exp.PaidAmount,
                OutstandingBalance = Math.Round(exp.RemainingPayable, 2),
                DueDate = dueDate,
                IsOverdue = isOverdue,
                DaysOverdue = daysOverdue,
                Status = isOverdue ? "OVERDUE" : (exp.PaymentStatus == "PARTIAL" ? "PARTIALLY_PAID" : "OUTSTANDING"),
                SourceModule = "EXPENSES",
                SourceTransactionId = exp.Id,
                SourceReferenceNumber = exp.VoucherNumber,
                LinkedAccountCode = exp.PaymentAccountCode,
                LinkedAccountName = exp.PaymentAccountName,
                CreatedAt = exp.CreatedAt
            });
        }

        // 3. Collect Bank Loans & Borrowings
        var loans = await _db.LoanObligations
            .Include(l => l.RepaymentSchedule)
            .Where(l => l.Status == "ACTIVE" || l.Status == "DRAFT")
            .ToListAsync();

        foreach (var loan in loans)
        {
            var nextSchedule = loan.RepaymentSchedule
                .Where(s => s.Status == "PENDING" || s.Status == "OVERDUE")
                .OrderBy(s => s.DueDate)
                .FirstOrDefault();

            var dueDate = nextSchedule?.DueDate ?? loan.NextPaymentDueDate ?? loan.MaturityDate;
            bool isOverdue = dueDate < today && loan.OutstandingPrincipal > 0;
            int daysOverdue = isOverdue ? (int)(today - dueDate).TotalDays : 0;

            items.Add(new LiabilityOverviewItem
            {
                Id = $"loan-{loan.Id}",
                LiabilityName = loan.LoanName,
                Category = loan.Category,
                Classification = loan.LiabilityType,
                RelatedParty = loan.LenderName,
                OriginalAmount = loan.OriginalLoanAmount,
                TotalPaid = loan.TotalPrincipalPaid,
                OutstandingBalance = Math.Round(loan.OutstandingPrincipal, 2),
                DueDate = dueDate,
                IsOverdue = isOverdue,
                DaysOverdue = daysOverdue,
                Status = isOverdue ? "OVERDUE" : (loan.TotalPrincipalPaid > 0 ? "PARTIALLY_PAID" : "OUTSTANDING"),
                SourceModule = "LOAN",
                SourceTransactionId = loan.Id,
                SourceReferenceNumber = loan.LoanReferenceNumber,
                LinkedAccountCode = loan.LinkedAccountCode,
                LinkedAccountName = loan.LinkedAccountName,
                CreatedAt = loan.CreatedAt
            });
        }

        // 4. Collect Tax Payables (Accounts 2050, 2070)
        var taxAccounts = await _db.Accounts
            .Where(a => a.AccountType == "LIABILITY" && (a.AccountCode == "2050" || a.AccountCode == "2070") && a.CurrentBalance > 0)
            .ToListAsync();

        foreach (var tax in taxAccounts)
        {
            var nextDue = new DateTime(today.Year, today.Month, 25, 0, 0, 0, DateTimeKind.Utc);
            if (nextDue < today) nextDue = nextDue.AddMonths(1);

            items.Add(new LiabilityOverviewItem
            {
                Id = $"tax-{tax.Id}",
                LiabilityName = tax.AccountName,
                Category = "Tax Payables",
                Classification = "CURRENT",
                RelatedParty = "Inland Revenue Department (IRD)",
                OriginalAmount = tax.CurrentBalance,
                TotalPaid = 0,
                OutstandingBalance = Math.Round(tax.CurrentBalance, 2),
                DueDate = nextDue,
                IsOverdue = false,
                DaysOverdue = 0,
                Status = "OUTSTANDING",
                SourceModule = "TAX",
                SourceTransactionId = tax.Id,
                SourceReferenceNumber = tax.AccountCode,
                LinkedAccountCode = tax.AccountCode,
                LinkedAccountName = tax.AccountName,
                CreatedAt = DateTime.UtcNow
            });
        }

        // 5. Collect Customer Advances (Accounts 2020, 2080)
        var advAccounts = await _db.Accounts
            .Where(a => a.AccountType == "LIABILITY" && (a.AccountCode == "2020" || a.AccountCode == "2080") && a.CurrentBalance > 0)
            .ToListAsync();

        foreach (var adv in advAccounts)
        {
            items.Add(new LiabilityOverviewItem
            {
                Id = $"adv-{adv.Id}",
                LiabilityName = adv.AccountName,
                Category = "Customer Advances",
                Classification = "CURRENT",
                RelatedParty = "Guests & Event Organizers",
                OriginalAmount = adv.CurrentBalance,
                TotalPaid = 0,
                OutstandingBalance = Math.Round(adv.CurrentBalance, 2),
                DueDate = today.AddDays(30),
                IsOverdue = false,
                DaysOverdue = 0,
                Status = "OUTSTANDING",
                SourceModule = "CUSTOMER_ADVANCE",
                SourceTransactionId = adv.Id,
                SourceReferenceNumber = adv.AccountCode,
                LinkedAccountCode = adv.AccountCode,
                LinkedAccountName = adv.AccountName,
                CreatedAt = DateTime.UtcNow
            });
        }

        // 6. Collect Accrued Salaries & Service Charges (Accounts 2100, 2060)
        var payAccounts = await _db.Accounts
            .Where(a => a.AccountType == "LIABILITY" && (a.AccountCode == "2100" || a.AccountCode == "2060") && a.CurrentBalance > 0)
            .ToListAsync();

        foreach (var pay in payAccounts)
        {
            var endOfMonth = new DateTime(today.Year, today.Month, DateTime.DaysInMonth(today.Year, today.Month), 0, 0, 0, DateTimeKind.Utc);
            items.Add(new LiabilityOverviewItem
            {
                Id = $"pay-{pay.Id}",
                LiabilityName = pay.AccountName,
                Category = "Salary & Wages Payables",
                Classification = "CURRENT",
                RelatedParty = "Restaurant & Kitchen Staff",
                OriginalAmount = pay.CurrentBalance,
                TotalPaid = 0,
                OutstandingBalance = Math.Round(pay.CurrentBalance, 2),
                DueDate = endOfMonth,
                IsOverdue = endOfMonth < today,
                DaysOverdue = endOfMonth < today ? (int)(today - endOfMonth).TotalDays : 0,
                Status = endOfMonth < today ? "OVERDUE" : "OUTSTANDING",
                SourceModule = "PAYROLL",
                SourceTransactionId = pay.Id,
                SourceReferenceNumber = pay.AccountCode,
                LinkedAccountCode = pay.AccountCode,
                LinkedAccountName = pay.AccountName,
                CreatedAt = DateTime.UtcNow
            });
        }

        return items;
    }

    #endregion

    #region 1. Summary Endpoint

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var hotelId = await GetCurrentHotelIdAsync();
        await EnsureStandardLiabilityAccountsAsync(hotelId);
        var today = DateTime.UtcNow;

        var allItems = await CollectAllLiabilitiesAsync(hotelId, today);

        double currentLiabilities = allItems.Where(i => i.Classification == "CURRENT").Sum(i => i.OutstandingBalance);
        double nonCurrentLiabilities = allItems.Where(i => i.Classification == "NON_CURRENT").Sum(i => i.OutstandingBalance);
        double totalLiabilities = currentLiabilities + nonCurrentLiabilities;
        double overdueLiabilities = allItems.Where(i => i.IsOverdue).Sum(i => i.OutstandingBalance);
        int overdueCount = allItems.Count(i => i.IsOverdue);

        var breakdown = allItems
            .GroupBy(i => new { i.Category, i.Classification })
            .Select(g => new
            {
                Category = g.Key.Category,
                Type = g.Key.Classification,
                Outstanding = Math.Round(g.Sum(x => x.OutstandingBalance), 2),
                Count = g.Count()
            })
            .OrderByDescending(x => x.Outstanding)
            .ToList();

        return Ok(ApiResponse.Ok(new
        {
            TotalLiabilities = Math.Round(totalLiabilities, 2),
            CurrentLiabilities = Math.Round(currentLiabilities, 2),
            NonCurrentLiabilities = Math.Round(nonCurrentLiabilities, 2),
            OverdueLiabilities = Math.Round(overdueLiabilities, 2),
            TotalObligationsCount = allItems.Count,
            OverdueCount = overdueCount,
            CategoryBreakdown = breakdown
        }));
    }

    #endregion

    #region 2. Unified Liabilities Overview List

    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview(
        [FromQuery] string? search,
        [FromQuery] string? category,
        [FromQuery] string? classification,
        [FromQuery] string? status,
        [FromQuery] string? dateFrom,
        [FromQuery] string? dateTo,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        var hotelId = await GetCurrentHotelIdAsync();
        await EnsureStandardLiabilityAccountsAsync(hotelId);
        var today = DateTime.UtcNow;

        var items = await CollectAllLiabilitiesAsync(hotelId, today);

        // Apply In-Memory Query Filters
        var query = items.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(i =>
                i.LiabilityName.ToLower().Contains(s) ||
                i.RelatedParty.ToLower().Contains(s) ||
                (i.SourceReferenceNumber != null && i.SourceReferenceNumber.ToLower().Contains(s)) ||
                i.LinkedAccountCode.ToLower().Contains(s));
        }

        if (!string.IsNullOrWhiteSpace(category) && category != "ALL")
        {
            query = query.Where(i => i.Category.Equals(category, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(classification) && classification != "ALL")
        {
            query = query.Where(i => i.Classification.Equals(classification, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(status) && status != "ALL")
        {
            query = query.Where(i => i.Status.Equals(status, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(dateFrom) && DateTime.TryParse(dateFrom, out var df))
        {
            query = query.Where(i => (i.DueDate ?? i.CreatedAt) >= df);
        }

        if (!string.IsNullOrWhiteSpace(dateTo) && DateTime.TryParse(dateTo, out var dt))
        {
            var dtEnd = dt.Date.AddDays(1).AddTicks(-1);
            query = query.Where(i => (i.DueDate ?? i.CreatedAt) <= dtEnd);
        }

        var totalCount = query.Count();

        // Sort: Overdue first, then by DueDate ascending, then by OutstandingBalance descending
        var pagedItems = query
            .OrderByDescending(i => i.IsOverdue)
            .ThenBy(i => i.DueDate ?? DateTime.MaxValue)
            .ThenByDescending(i => i.OutstandingBalance)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return Ok(ApiResponse.Ok(new
        {
            Items = pagedItems,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    #endregion

    #region 3. Single Liability Details Endpoint

    [HttpGet("{id}")]
    public async Task<IActionResult> GetLiabilityDetail(string id)
    {
        var hotelId = await GetCurrentHotelIdAsync();

        if (id.StartsWith("sup-"))
        {
            var supId = id.Substring(4);
            var supplier = await _db.Suppliers.FindAsync(supId);
            if (supplier == null) return NotFound(ApiResponse.Fail("Supplier not found."));

            var entries = await _db.SupplierLedgers
                .Where(e => e.SupplierId == supId)
                .OrderByDescending(e => e.EntryDate)
                .Take(25)
                .Select(e => new
                {
                    e.Id,
                    e.EntryDate,
                    e.Description,
                    DebitAmount = e.DebitAmount,
                    CreditAmount = e.CreditAmount,
                    Balance = e.Balance,
                    e.DueDate
                })
                .ToListAsync();

            double currentBal = entries.Count > 0 ? entries[0].Balance : supplier.OpeningBalance;

            return Ok(ApiResponse.Ok(new
            {
                Id = id,
                LiabilityName = $"Payable: {supplier.Name}",
                Category = "Supplier Payables",
                Classification = "CURRENT",
                RelatedParty = supplier.Name,
                OriginalAmount = currentBal,
                TotalPaid = 0.0,
                OutstandingBalance = currentBal,
                DueDate = entries.FirstOrDefault(e => e.CreditAmount > 0)?.DueDate ?? DateTime.UtcNow.AddDays(supplier.PaymentTermsDays > 0 ? supplier.PaymentTermsDays : 30),
                Status = currentBal > 0 ? "OUTSTANDING" : "PAID",
                SourceModule = "SUPPLIER_LEDGER",
                SourceTransactionId = supplier.Id,
                SourceReferenceNumber = supplier.Code,
                LinkedAccountCode = "2010",
                LinkedAccountName = "Accounts Payable - Suppliers & Vendors",
                SourceRoute = $"/accounts?tab=supplier-ledger&supplierId={supplier.Id}",
                TransactionHistory = entries
            }));
        }

        if (id.StartsWith("exp-"))
        {
            var expId = id.Substring(4);
            var expense = await _db.ExpenseTransactions
                .Include(e => e.Payments)
                .FirstOrDefaultAsync(e => e.Id == expId);
            if (expense == null) return NotFound(ApiResponse.Fail("Expense not found."));

            return Ok(ApiResponse.Ok(new
            {
                Id = id,
                LiabilityName = expense.Description,
                Category = "Expense Payables",
                Classification = "CURRENT",
                RelatedParty = !string.IsNullOrEmpty(expense.PaidTo) ? expense.PaidTo : expense.CategoryName,
                OriginalAmount = expense.TotalAmount,
                TotalPaid = expense.PaidAmount,
                OutstandingBalance = expense.RemainingPayable,
                DueDate = expense.DueDate ?? expense.ExpenseDate.AddDays(15),
                Status = expense.PaymentStatus == "PAID" ? "PAID" : (expense.PaymentStatus == "PARTIAL" ? "PARTIALLY_PAID" : "OUTSTANDING"),
                SourceModule = "EXPENSES",
                SourceTransactionId = expense.Id,
                SourceReferenceNumber = expense.VoucherNumber,
                LinkedAccountCode = expense.PaymentAccountCode,
                LinkedAccountName = expense.PaymentAccountName,
                SourceRoute = $"/accounts?tab=expenses&search={expense.VoucherNumber}",
                TransactionHistory = expense.Payments.Select(p => new
                {
                    p.Id,
                    EntryDate = p.PaymentDate,
                    Description = $"Payment via {p.PaymentMode} ({p.PaymentReceiptNumber})",
                    DebitAmount = p.Amount,
                    CreditAmount = 0.0,
                    Balance = 0.0,
                    DueDate = (DateTime?)null
                }).ToList()
            }));
        }

        if (id.StartsWith("loan-"))
        {
            var loanId = id.Substring(5);
            var loan = await _db.LoanObligations
                .Include(l => l.RepaymentSchedule)
                .FirstOrDefaultAsync(l => l.Id == loanId);
            if (loan == null) return NotFound(ApiResponse.Fail("Loan record not found."));

            return Ok(ApiResponse.Ok(new
            {
                Id = id,
                LiabilityName = loan.LoanName,
                Category = loan.Category,
                Classification = loan.LiabilityType,
                RelatedParty = loan.LenderName,
                OriginalAmount = loan.OriginalLoanAmount,
                TotalPaid = loan.TotalPrincipalPaid,
                OutstandingBalance = loan.OutstandingPrincipal,
                DueDate = loan.NextPaymentDueDate ?? loan.MaturityDate,
                Status = loan.Status,
                SourceModule = "LOAN",
                SourceTransactionId = loan.Id,
                SourceReferenceNumber = loan.LoanReferenceNumber,
                LinkedAccountCode = loan.LinkedAccountCode,
                LinkedAccountName = loan.LinkedAccountName,
                LoanDetails = loan,
                RepaymentSchedule = loan.RepaymentSchedule.OrderBy(s => s.PeriodNumber).ToList(),
                SourceRoute = $"/accounts?tab=liabilities&loanId={loan.Id}"
            }));
        }

        // Generic Account-based liability
        var rawId = id.StartsWith("tax-") ? id.Substring(4) : (id.StartsWith("adv-") ? id.Substring(4) : (id.StartsWith("pay-") ? id.Substring(4) : id));
        var acc = await _db.Accounts.FindAsync(rawId);
        if (acc != null)
        {
            return Ok(ApiResponse.Ok(new
            {
                Id = id,
                LiabilityName = acc.AccountName,
                Category = acc.SubCategory ?? "Other Current Liabilities",
                Classification = acc.AccountCode.StartsWith("25") ? "NON_CURRENT" : "CURRENT",
                RelatedParty = "Accounting General Ledger",
                OriginalAmount = acc.CurrentBalance,
                TotalPaid = 0.0,
                OutstandingBalance = acc.CurrentBalance,
                DueDate = DateTime.UtcNow.AddDays(30),
                Status = "OUTSTANDING",
                SourceModule = "GENERAL_LEDGER",
                SourceTransactionId = acc.Id,
                SourceReferenceNumber = acc.AccountCode,
                LinkedAccountCode = acc.AccountCode,
                LinkedAccountName = acc.AccountName,
                SourceRoute = $"/accounts?tab=general-ledger&accountId={acc.Id}"
            }));
        }

        return NotFound(ApiResponse.Fail("Liability record not found."));
    }

    #endregion

    #region 4. Loan Management (Add Loan, Repay Loan, Repayment Schedule)

    public class CreateLoanDto
    {
        public string LoanName { get; set; } = string.Empty;
        public string LenderName { get; set; } = string.Empty;
        public string? LoanReferenceNumber { get; set; }
        public string Category { get; set; } = "Long-Term Bank Loans";
        public string LiabilityType { get; set; } = "NON_CURRENT";
        public string? LinkedAccountId { get; set; }
        public double OriginalLoanAmount { get; set; }
        public double InterestRate { get; set; }
        public DateTime LoanStartDate { get; set; } = DateTime.UtcNow;
        public DateTime MaturityDate { get; set; } = DateTime.UtcNow.AddYears(3);
        public string RepaymentFrequency { get; set; } = "MONTHLY";
        public double? MonthlyInstallmentAmount { get; set; }
        public string? DisbursementBankAccountId { get; set; }
        public bool AutoCapitalize { get; set; } = true;
        public string? Notes { get; set; }
    }

    [HttpGet("loans")]
    public async Task<IActionResult> GetLoans()
    {
        var hotelId = await GetCurrentHotelIdAsync();
        var loans = await _db.LoanObligations
            .Include(l => l.RepaymentSchedule)
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync();

        return Ok(ApiResponse.Ok(loans));
    }

    [HttpGet("loans/{id}")]
    public async Task<IActionResult> GetLoanById(string id)
    {
        var loan = await _db.LoanObligations
            .Include(l => l.RepaymentSchedule)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (loan == null) return NotFound(ApiResponse.Fail("Loan obligation not found."));
        return Ok(ApiResponse.Ok(loan));
    }

    [HttpPost("loans")]
    public async Task<IActionResult> CreateLoan([FromBody] CreateLoanDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.LoanName))
            return BadRequest(ApiResponse.Fail("Loan name is required."));
        if (string.IsNullOrWhiteSpace(dto.LenderName))
            return BadRequest(ApiResponse.Fail("Lender name is required."));
        if (dto.OriginalLoanAmount <= 0)
            return BadRequest(ApiResponse.Fail("Loan amount must be greater than zero."));

        var hotelId = await GetCurrentHotelIdAsync();
        await EnsureStandardLiabilityAccountsAsync(hotelId);

        // Find or fallback Linked Account
        Account? loanAccount = null;
        if (!string.IsNullOrEmpty(dto.LinkedAccountId))
        {
            loanAccount = await _db.Accounts.FindAsync(dto.LinkedAccountId);
        }

        if (loanAccount == null)
        {
            string targetCode = dto.Category == "Short-Term Loans" ? "2110" : "2500";
            loanAccount = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == targetCode);
            if (loanAccount == null)
            {
                loanAccount = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountType == "LIABILITY");
            }
        }

        if (loanAccount == null)
            return BadRequest(ApiResponse.Fail("No valid liability account available in Chart of Accounts."));

        // Generate Loan Reference # if not provided
        var loanCount = await _db.LoanObligations.CountAsync() + 1;
        var prefix = dto.LenderName.Length >= 3 ? dto.LenderName.Substring(0, 3).ToUpper() : "LND";
        var loanRef = !string.IsNullOrWhiteSpace(dto.LoanReferenceNumber)
            ? dto.LoanReferenceNumber.Trim().ToUpper()
            : $"LN-{prefix}-{DateTime.UtcNow.Year}-{loanCount:D3}";

        // Calculate Monthly Installments
        int totalMonths = Math.Max(1, (int)Math.Round((dto.MaturityDate - dto.LoanStartDate).TotalDays / 30.44));
        double monthlyPrincipal = Math.Round(dto.OriginalLoanAmount / totalMonths, 2);
        double monthlyInterestEst = Math.Round((dto.OriginalLoanAmount * (dto.InterestRate / 100)) / 12, 2);
        double installmentEst = dto.MonthlyInstallmentAmount ?? (monthlyPrincipal + monthlyInterestEst);

        var loan = new LoanObligation
        {
            HotelId = hotelId,
            LoanName = dto.LoanName.Trim(),
            LoanReferenceNumber = loanRef,
            LenderName = dto.LenderName.Trim(),
            Category = dto.Category,
            LiabilityType = dto.LiabilityType,
            LinkedAccountId = loanAccount.Id,
            LinkedAccountCode = loanAccount.AccountCode,
            LinkedAccountName = loanAccount.AccountName,
            OriginalLoanAmount = dto.OriginalLoanAmount,
            OutstandingPrincipal = dto.OriginalLoanAmount,
            InterestRate = dto.InterestRate,
            LoanStartDate = dto.LoanStartDate,
            MaturityDate = dto.MaturityDate,
            RepaymentFrequency = dto.RepaymentFrequency,
            NextPaymentDueDate = dto.LoanStartDate.AddMonths(1),
            MonthlyInstallmentAmount = Math.Round(installmentEst, 2),
            Status = "ACTIVE",
            Notes = dto.Notes?.Trim(),
            CreatedBy = "Admin Accountant",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Auto-generate Repayment Schedule (up to 60 periods)
        int periodsToGenerate = Math.Min(totalMonths, 60);
        for (int i = 1; i <= periodsToGenerate; i++)
        {
            var dueDate = dto.LoanStartDate.AddMonths(i);
            var pDue = (i == periodsToGenerate) ? Math.Round(dto.OriginalLoanAmount - (monthlyPrincipal * (periodsToGenerate - 1)), 2) : monthlyPrincipal;
            var iDue = monthlyInterestEst;

            loan.RepaymentSchedule.Add(new LoanRepaymentScheduleItem
            {
                LoanObligationId = loan.Id,
                PeriodNumber = i,
                DueDate = dueDate,
                PrincipalDue = pDue,
                InterestDue = iDue,
                TotalDue = Math.Round(pDue + iDue, 2),
                Status = "PENDING",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }

        // Auto-capitalize: Debit Bank / Credit Loan Payable Account
        if (dto.AutoCapitalize && !string.IsNullOrEmpty(dto.DisbursementBankAccountId))
        {
            var bankAccount = await _db.Accounts.FindAsync(dto.DisbursementBankAccountId);
            if (bankAccount != null)
            {
                loan.DisbursementBankAccountId = bankAccount.Id;
                loan.DisbursementBankAccountName = $"{bankAccount.AccountName} ({bankAccount.AccountCode})";

                var jvNumber = $"JV-LOAN-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}";
                var jv = new JournalEntry
                {
                    HotelId = hotelId,
                    EntryNumber = jvNumber,
                    EntryDate = dto.LoanStartDate,
                    EntryType = "GENERAL",
                    Reference = loanRef,
                    Description = $"Disbursement of {dto.LoanName} from {dto.LenderName} to {bankAccount.AccountName}",
                    TotalDebit = dto.OriginalLoanAmount,
                    TotalCredit = dto.OriginalLoanAmount,
                    Status = "POSTED",
                    SourceModule = "LOAN",
                    SourceTransactionId = loan.Id,
                    CreatedBy = "Admin Accountant",
                    PostedBy = "Admin Accountant",
                    PostedAt = DateTime.UtcNow
                };

                // Debit Bank (increases asset)
                jv.Lines.Add(new JournalEntryLine
                {
                    JournalEntryId = jv.Id,
                    AccountId = bankAccount.Id,
                    AccountCode = bankAccount.AccountCode,
                    AccountName = bankAccount.AccountName,
                    LineDescription = $"Loan proceeds received from {dto.LenderName}",
                    Debit = dto.OriginalLoanAmount,
                    Credit = 0.0
                });
                bankAccount.CurrentBalance += dto.OriginalLoanAmount;

                // Credit Loan Payable (increases liability)
                jv.Lines.Add(new JournalEntryLine
                {
                    JournalEntryId = jv.Id,
                    AccountId = loanAccount.Id,
                    AccountCode = loanAccount.AccountCode,
                    AccountName = loanAccount.AccountName,
                    LineDescription = $"Obligation recognized for {dto.LoanName}",
                    Debit = 0.0,
                    Credit = dto.OriginalLoanAmount
                });
                loanAccount.CurrentBalance += dto.OriginalLoanAmount;

                _db.JournalEntries.Add(jv);
                loan.AcquisitionJournalEntryId = jv.Id;
                loan.AcquisitionJournalEntryNumber = jvNumber;
            }
        }
        else
        {
            loanAccount.CurrentBalance += dto.OriginalLoanAmount;
        }

        _db.LoanObligations.Add(loan);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(loan, $"Loan {loan.LoanReferenceNumber} created and schedule generated successfully."));
    }

    public class RecordLoanRepaymentDto
    {
        public double PrincipalAmount { get; set; }
        public double InterestAmount { get; set; }
        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
        public string PaymentAccountId { get; set; } = string.Empty;
        public string? ReferenceNumber { get; set; }
        public string? Notes { get; set; }
    }

    [HttpPost("loans/{id}/repay")]
    public async Task<IActionResult> RecordLoanRepayment(string id, [FromBody] RecordLoanRepaymentDto dto)
    {
        if (dto.PrincipalAmount < 0 || dto.InterestAmount < 0)
            return BadRequest(ApiResponse.Fail("Amounts cannot be negative."));

        double totalRepayment = dto.PrincipalAmount + dto.InterestAmount;
        if (totalRepayment <= 0)
            return BadRequest(ApiResponse.Fail("Repayment amount must be greater than zero."));

        var loan = await _db.LoanObligations
            .Include(l => l.RepaymentSchedule)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (loan == null) return NotFound(ApiResponse.Fail("Loan record not found."));

        if (dto.PrincipalAmount > loan.OutstandingPrincipal + 0.01)
            return BadRequest(ApiResponse.Fail($"Principal payment cannot exceed outstanding principal (Rs. {loan.OutstandingPrincipal:N2})."));

        var hotelId = await GetCurrentHotelIdAsync();

        // 1. Bank Account verification
        var bankAccount = await _db.Accounts.FindAsync(dto.PaymentAccountId);
        if (bankAccount == null)
            return BadRequest(ApiResponse.Fail("Please select an active Cash or Bank account for disbursement."));

        // 2. Loan Principal Liability Account
        var loanAccount = await _db.Accounts.FindAsync(loan.LinkedAccountId)
            ?? await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == loan.LinkedAccountCode);
        if (loanAccount == null)
            return BadRequest(ApiResponse.Fail("Associated loan liability account could not be found."));

        // 3. Interest Expense Account (6100)
        var interestAccount = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "6100")
            ?? await _db.Accounts.FirstOrDefaultAsync(a => a.AccountType == "EXPENSE" && a.AccountName.Contains("Interest"));

        if (interestAccount == null && dto.InterestAmount > 0)
        {
            interestAccount = new Account
            {
                HotelId = hotelId,
                AccountCode = "6100",
                AccountName = "Interest Expense on Borrowings",
                AccountType = "EXPENSE",
                SubCategory = "Non-Operating Expense",
                NormalBalance = "DEBIT",
                OpeningBalance = 0,
                CurrentBalance = 0,
                Description = "Bank loan and overdraft financing interest"
            };
            _db.Accounts.Add(interestAccount);
            await _db.SaveChangesAsync();
        }

        // 4. Generate Balanced Journal Entry
        var jvNumber = $"JV-LOANPMT-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}";
        var jv = new JournalEntry
        {
            HotelId = hotelId,
            EntryNumber = jvNumber,
            EntryDate = dto.PaymentDate,
            EntryType = "GENERAL",
            Reference = dto.ReferenceNumber ?? loan.LoanReferenceNumber,
            Description = $"Loan Repayment for {loan.LoanName}: Principal Rs. {dto.PrincipalAmount:N2}, Interest Rs. {dto.InterestAmount:N2}",
            TotalDebit = totalRepayment,
            TotalCredit = totalRepayment,
            Status = "POSTED",
            SourceModule = "LOAN",
            SourceTransactionId = loan.Id,
            CreatedBy = "Admin Accountant",
            PostedBy = "Admin Accountant",
            PostedAt = DateTime.UtcNow
        };

        // Debit Loan Principal
        if (dto.PrincipalAmount > 0)
        {
            jv.Lines.Add(new JournalEntryLine
            {
                JournalEntryId = jv.Id,
                AccountId = loanAccount.Id,
                AccountCode = loanAccount.AccountCode,
                AccountName = loanAccount.AccountName,
                LineDescription = $"Principal repayment for {loan.LoanReferenceNumber}",
                Debit = dto.PrincipalAmount,
                Credit = 0.0
            });
            loanAccount.CurrentBalance = Math.Max(0, loanAccount.CurrentBalance - dto.PrincipalAmount);
        }

        // Debit Interest Expense
        if (dto.InterestAmount > 0 && interestAccount != null)
        {
            jv.Lines.Add(new JournalEntryLine
            {
                JournalEntryId = jv.Id,
                AccountId = interestAccount.Id,
                AccountCode = interestAccount.AccountCode,
                AccountName = interestAccount.AccountName,
                LineDescription = $"Interest expense for {loan.LoanReferenceNumber}",
                Debit = dto.InterestAmount,
                Credit = 0.0
            });
            interestAccount.CurrentBalance += dto.InterestAmount;
        }

        // Credit Bank
        jv.Lines.Add(new JournalEntryLine
        {
            JournalEntryId = jv.Id,
            AccountId = bankAccount.Id,
            AccountCode = bankAccount.AccountCode,
            AccountName = bankAccount.AccountName,
            LineDescription = $"Repayment disbursement from {bankAccount.AccountName}",
            Debit = 0.0,
            Credit = totalRepayment
        });
        bankAccount.CurrentBalance -= totalRepayment;

        _db.JournalEntries.Add(jv);

        // 5. Update Loan Obligation Figures
        loan.OutstandingPrincipal = Math.Max(0, Math.Round(loan.OutstandingPrincipal - dto.PrincipalAmount, 2));
        loan.TotalPrincipalPaid = Math.Round(loan.TotalPrincipalPaid + dto.PrincipalAmount, 2);
        loan.TotalInterestPaid = Math.Round(loan.TotalInterestPaid + dto.InterestAmount, 2);

        if (loan.OutstandingPrincipal <= 0.01)
        {
            loan.OutstandingPrincipal = 0;
            loan.Status = "PAID_OFF";
        }

        var nextSchedule = loan.RepaymentSchedule
            .Where(s => s.Status == "PENDING" || s.Status == "OVERDUE")
            .OrderBy(s => s.DueDate)
            .FirstOrDefault();

        if (nextSchedule != null)
        {
            nextSchedule.PrincipalPaid += dto.PrincipalAmount;
            nextSchedule.InterestPaid += dto.InterestAmount;
            nextSchedule.TotalPaid += totalRepayment;
            nextSchedule.Status = (nextSchedule.PrincipalPaid >= nextSchedule.PrincipalDue && nextSchedule.InterestPaid >= nextSchedule.InterestDue) ? "PAID" : "PARTIAL";
            nextSchedule.PaidDate = dto.PaymentDate;
            nextSchedule.PaymentAccountId = bankAccount.Id;
            nextSchedule.JournalEntryId = jv.Id;
            nextSchedule.JournalEntryNumber = jvNumber;
            nextSchedule.UpdatedAt = DateTime.UtcNow;

            var subsequent = loan.RepaymentSchedule
                .Where(s => (s.Status == "PENDING" || s.Status == "OVERDUE") && s.PeriodNumber > nextSchedule.PeriodNumber)
                .OrderBy(s => s.PeriodNumber)
                .FirstOrDefault();
            loan.NextPaymentDueDate = subsequent?.DueDate;
        }

        loan.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            loan.Id,
            loan.LoanReferenceNumber,
            NewOutstandingPrincipal = loan.OutstandingPrincipal,
            TotalPrincipalPaid = loan.TotalPrincipalPaid,
            TotalInterestPaid = loan.TotalInterestPaid,
            LoanStatus = loan.Status,
            JournalEntryNumber = jvNumber
        }, $"Repayment of Rs. {totalRepayment:N2} recorded successfully under JV {jvNumber}."));
    }

    #endregion

    #region 5. Reports & Aging Matrix

    [HttpGet("reports")]
    public async Task<IActionResult> GetReports()
    {
        var hotelId = await GetCurrentHotelIdAsync();
        await EnsureStandardLiabilityAccountsAsync(hotelId);
        var today = DateTime.UtcNow;

        var items = await CollectAllLiabilitiesAsync(hotelId, today);

        // Current vs Non-Current Breakdown
        var currentItems = items.Where(i => i.Classification == "CURRENT").ToList();
        var nonCurrentItems = items.Where(i => i.Classification == "NON_CURRENT").ToList();

        // Aging Matrix
        double notDueAmount = 0;
        double days1To30 = 0;
        double days31To60 = 0;
        double days61To90 = 0;
        double days90Plus = 0;

        foreach (var item in items)
        {
            if (item.OutstandingBalance <= 0) continue;

            if (!item.DueDate.HasValue || item.DueDate.Value >= today)
            {
                notDueAmount += item.OutstandingBalance;
            }
            else
            {
                int days = (int)(today - item.DueDate.Value).TotalDays;
                if (days <= 30) days1To30 += item.OutstandingBalance;
                else if (days <= 60) days31To60 += item.OutstandingBalance;
                else if (days <= 90) days61To90 += item.OutstandingBalance;
                else days90Plus += item.OutstandingBalance;
            }
        }

        // Category Grouping
        var byCategory = items
            .GroupBy(i => i.Category)
            .Select(g => new
            {
                Category = g.Key,
                Count = g.Count(),
                TotalOutstanding = Math.Round(g.Sum(x => x.OutstandingBalance), 2),
                OverdueAmount = Math.Round(g.Where(x => x.IsOverdue).Sum(x => x.OutstandingBalance), 2)
            })
            .OrderByDescending(x => x.TotalOutstanding)
            .ToList();

        return Ok(ApiResponse.Ok(new
        {
            TotalLiabilities = Math.Round(items.Sum(i => i.OutstandingBalance), 2),
            CurrentTotal = Math.Round(currentItems.Sum(i => i.OutstandingBalance), 2),
            NonCurrentTotal = Math.Round(nonCurrentItems.Sum(i => i.OutstandingBalance), 2),
            Aging = new
            {
                NotDue = Math.Round(notDueAmount, 2),
                Days1To30 = Math.Round(days1To30, 2),
                Days31To60 = Math.Round(days31To60, 2),
                Days61To90 = Math.Round(days61To90, 2),
                Days90Plus = Math.Round(days90Plus, 2),
                TotalOverdue = Math.Round(days1To30 + days31To60 + days61To90 + days90Plus, 2)
            },
            CategoryBreakdown = byCategory
        }));
    }

    #endregion

    #region 6. Metadata (Liability Accounts & Bank Accounts)

    [HttpGet("account-configs")]
    public async Task<IActionResult> GetAccountConfigs()
    {
        var hotelId = await GetCurrentHotelIdAsync();
        await EnsureStandardLiabilityAccountsAsync(hotelId);

        var accounts = await _db.Accounts
            .Where(a => a.AccountType == "LIABILITY")
            .OrderBy(a => a.AccountCode)
            .Select(a => new
            {
                a.Id,
                a.AccountCode,
                a.AccountName,
                Category = a.SubCategory ?? "Other Current Liabilities",
                Classification = a.AccountCode.StartsWith("25") ? "NON_CURRENT" : "CURRENT",
                a.CurrentBalance,
                a.NormalBalance,
                a.Description
            })
            .ToListAsync();

        return Ok(ApiResponse.Ok(accounts));
    }

    [HttpGet("bank-accounts")]
    public async Task<IActionResult> GetBankAccounts()
    {
        var hotelId = await GetCurrentHotelIdAsync();
        var accounts = await _db.Accounts
            .Where(a => a.AccountType == "ASSET" && (a.AccountCode.StartsWith("101") || a.AccountCode.StartsWith("102") || a.AccountCode.StartsWith("105")))
            .OrderBy(a => a.AccountCode)
            .Select(a => new
            {
                a.Id,
                a.AccountCode,
                a.AccountName,
                a.CurrentBalance,
                a.SubCategory
            })
            .ToListAsync();

        return Ok(ApiResponse.Ok(accounts));
    }

    #endregion
}

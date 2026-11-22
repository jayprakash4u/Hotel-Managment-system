using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/profit-loss")]
public class ProfitAndLossController : ControllerBase
{
    private readonly HospitalityDbContext _db;
    private readonly ILogger<ProfitAndLossController> _logger;

    public ProfitAndLossController(HospitalityDbContext db, ILogger<ProfitAndLossController> logger)
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

    private async Task EnsureStandardAccountsAsync(string hotelId)
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
            // Verify tax expense account 7010 exists
            var hasTax = await _db.Accounts.AnyAsync(a => a.AccountCode == "7010");
            if (!hasTax)
            {
                _db.Accounts.Add(new Account
                {
                    HotelId = hotelId,
                    AccountCode = "7010",
                    AccountName = "Corporate Income Tax Expense",
                    AccountType = "EXPENSE",
                    SubCategory = "Income Tax",
                    NormalBalance = "DEBIT",
                    OpeningBalance = 0,
                    CurrentBalance = 0,
                    Description = "Estimated corporate income tax on period net earnings"
                });
                await _db.SaveChangesAsync();
            }
        }
    }

    #region Data Transfer Models

    public class PnLLineItem
    {
        public string AccountId { get; set; } = string.Empty;
        public string AccountCode { get; set; } = string.Empty;
        public string AccountName { get; set; } = string.Empty;
        public string SubCategory { get; set; } = string.Empty;
        public double CurrentAmount { get; set; }
        public double CompareAmount { get; set; }
        public double Variance { get; set; }
        public double VariancePercentage { get; set; }
        public bool IsContra { get; set; }
    }

    public class PnLSection
    {
        public string SectionKey { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public List<PnLLineItem> Items { get; set; } = new();
        public double CurrentTotal { get; set; }
        public double CompareTotal { get; set; }
        public double Variance { get; set; }
        public double VariancePercentage { get; set; }
    }

    public class MonthlyTrendItem
    {
        public string MonthKey { get; set; } = string.Empty;
        public string MonthLabel { get; set; } = string.Empty;
        public double Revenue { get; set; }
        public double COGS { get; set; }
        public double OperatingExpenses { get; set; }
        public double GrossProfit { get; set; }
        public double NetProfit { get; set; }
    }

    public class ExpenseCategoryBreakdownItem
    {
        public string CategoryName { get; set; } = string.Empty;
        public double Amount { get; set; }
        public double PercentageOfExpenses { get; set; }
    }

    #endregion

    #region 1. Profit & Loss Statement Endpoint

    [HttpGet("statement")]
    public async Task<IActionResult> GetStatement(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] string comparisonMode = "NONE", // NONE, PREVIOUS_PERIOD, PREVIOUS_YEAR, CUSTOM
        [FromQuery] DateTime? compareStartDate = null,
        [FromQuery] DateTime? compareEndDate = null)
    {
        var hotelId = await GetCurrentHotelIdAsync();
        await EnsureStandardAccountsAsync(hotelId);

        // 1. Determine Current Reporting Period
        var now = DateTime.UtcNow;
        var endUtc = endDate?.Date.AddDays(1).AddTicks(-1) ?? new DateTime(now.Year, now.Month, DateTime.DaysInMonth(now.Year, now.Month), 23, 59, 59, DateTimeKind.Utc);
        var startUtc = startDate?.Date ?? new DateTime(endUtc.Year, endUtc.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        if (startUtc > endUtc)
        {
            var temp = startUtc;
            startUtc = endUtc.Date;
            endUtc = temp.Date.AddDays(1).AddTicks(-1);
        }

        // 2. Determine Comparison Period
        DateTime? cmpStartUtc = null;
        DateTime? cmpEndUtc = null;
        bool hasComparison = comparisonMode != "NONE";

        if (comparisonMode == "PREVIOUS_PERIOD")
        {
            var durationDays = (endUtc - startUtc).TotalDays + 1;
            cmpEndUtc = startUtc.AddDays(-1).Date.AddDays(1).AddTicks(-1);
            cmpStartUtc = cmpEndUtc.Value.AddDays(-durationDays + 1).Date;
        }
        else if (comparisonMode == "PREVIOUS_YEAR")
        {
            cmpStartUtc = startUtc.AddYears(-1);
            cmpEndUtc = endUtc.AddYears(-1);
        }
        else if (comparisonMode == "CUSTOM" && compareStartDate.HasValue && compareEndDate.HasValue)
        {
            cmpStartUtc = compareStartDate.Value.Date;
            cmpEndUtc = compareEndDate.Value.Date.AddDays(1).AddTicks(-1);
        }
        else
        {
            hasComparison = false;
        }

        // 3. Load all Revenue and Expense accounts
        var accounts = await _db.Accounts
            .Where(a => a.AccountType == "REVENUE" || a.AccountType == "EXPENSE")
            .OrderBy(a => a.AccountCode)
            .ToListAsync();

        var accountIds = accounts.Select(a => a.Id).ToList();

        // 4. Query Current Period Journal Entry Lines
        var currentLines = await _db.JournalEntryLines
            .Where(l => accountIds.Contains(l.AccountId) &&
                        l.JournalEntry != null &&
                        (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED") &&
                        l.JournalEntry.EntryDate >= startUtc &&
                        l.JournalEntry.EntryDate <= endUtc)
            .Select(l => new { l.AccountId, l.Debit, l.Credit })
            .ToListAsync();

        var currentGrouped = currentLines
            .GroupBy(l => l.AccountId)
            .ToDictionary(
                g => g.Key,
                g => new { TotalDebit = g.Sum(x => x.Debit), TotalCredit = g.Sum(x => x.Credit) }
            );

        // 5. Query Comparison Period Journal Entry Lines (if comparison enabled)
        Dictionary<string, (double TotalDebit, double TotalCredit)> compareGrouped = new();
        if (hasComparison && cmpStartUtc.HasValue && cmpEndUtc.HasValue)
        {
            var compLines = await _db.JournalEntryLines
                .Where(l => accountIds.Contains(l.AccountId) &&
                            l.JournalEntry != null &&
                            (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED") &&
                            l.JournalEntry.EntryDate >= cmpStartUtc.Value &&
                            l.JournalEntry.EntryDate <= cmpEndUtc.Value)
                .Select(l => new { l.AccountId, l.Debit, l.Credit })
                .ToListAsync();

            compareGrouped = compLines
                .GroupBy(l => l.AccountId)
                .ToDictionary(
                    g => g.Key,
                    g => (g.Sum(x => x.Debit), g.Sum(x => x.Credit))
                );
        }

        // Helper function to calculate net movement
        double GetAccountPeriodBalance(Account acc, bool isCurrent)
        {
            double deb = 0, cred = 0;
            if (isCurrent)
            {
                if (currentGrouped.TryGetValue(acc.Id, out var cur))
                {
                    deb = cur.TotalDebit;
                    cred = cur.TotalCredit;
                }
            }
            else
            {
                if (compareGrouped.TryGetValue(acc.Id, out var cmp))
                {
                    deb = cmp.TotalDebit;
                    cred = cmp.TotalCredit;
                }
            }

            if (acc.AccountType == "REVENUE")
            {
                // Sales returns or contra-revenue codes have normal debit balance
                if (acc.AccountCode == "4200" || acc.NormalBalance == "DEBIT" || acc.AccountName.Contains("Return", StringComparison.OrdinalIgnoreCase) || acc.AccountName.Contains("Discount", StringComparison.OrdinalIgnoreCase))
                {
                    return deb - cred; // Positive value representing deduction
                }
                return cred - deb; // Normal revenue credit balance
            }
            else // EXPENSE
            {
                return deb - cred; // Normal expense debit balance
            }
        }

        // Helper to build line item
        PnLLineItem BuildLineItem(Account acc)
        {
            var curVal = Math.Round(GetAccountPeriodBalance(acc, true), 2);
            var cmpVal = hasComparison ? Math.Round(GetAccountPeriodBalance(acc, false), 2) : 0.0;
            var variance = Math.Round(curVal - cmpVal, 2);
            double varPct = 0;
            if (hasComparison && Math.Abs(cmpVal) > 0.001)
            {
                varPct = Math.Round((variance / Math.Abs(cmpVal)) * 100, 1);
            }
            else if (hasComparison && Math.Abs(curVal) > 0.001)
            {
                varPct = curVal > 0 ? 100.0 : -100.0;
            }

            bool isContra = acc.AccountType == "REVENUE" && (acc.AccountCode == "4200" || acc.AccountName.Contains("Return", StringComparison.OrdinalIgnoreCase) || acc.AccountName.Contains("Discount", StringComparison.OrdinalIgnoreCase));

            return new PnLLineItem
            {
                AccountId = acc.Id,
                AccountCode = acc.AccountCode,
                AccountName = acc.AccountName,
                SubCategory = acc.SubCategory ?? (acc.AccountType == "REVENUE" ? "Operating Revenue" : "Operating Expense"),
                CurrentAmount = curVal,
                CompareAmount = cmpVal,
                Variance = variance,
                VariancePercentage = varPct,
                IsContra = isContra
            };
        }

        // 6. Partition Accounts into P&L Sections
        // Section A: Operating Revenue (Codes 4000 - 4899)
        var revenueAccounts = accounts
            .Where(a => a.AccountType == "REVENUE" && string.Compare(a.AccountCode, "4900") < 0)
            .Select(BuildLineItem)
            .ToList();

        // Section B: Cost of Goods Sold (Codes 5000 - 5099 or Direct Cost)
        var cogsAccounts = accounts
            .Where(a => a.AccountType == "EXPENSE" && (a.AccountCode.StartsWith("50") || a.SubCategory == "Direct Cost"))
            .Select(BuildLineItem)
            .ToList();

        // Section C: Operating Expenses (Codes 5100 - 5999, excluding 50xx and 6xxx/7xxx)
        var opexAccounts = accounts
            .Where(a => a.AccountType == "EXPENSE" && !a.AccountCode.StartsWith("50") && string.Compare(a.AccountCode, "6000") < 0)
            .Select(BuildLineItem)
            .ToList();

        // Section D: Other Non-Operating Income (Codes 4900 - 4999)
        var otherIncomeAccounts = accounts
            .Where(a => a.AccountType == "REVENUE" && string.Compare(a.AccountCode, "4900") >= 0)
            .Select(BuildLineItem)
            .ToList();

        // Section E: Other Non-Operating Expenses (Codes 6000 - 6999)
        var otherExpenseAccounts = accounts
            .Where(a => a.AccountType == "EXPENSE" && a.AccountCode.StartsWith("6"))
            .Select(BuildLineItem)
            .ToList();

        // Section F: Income Tax Expense (Codes 7000 - 7999)
        var taxExpenseAccounts = accounts
            .Where(a => a.AccountType == "EXPENSE" && (a.AccountCode.StartsWith("7") || a.SubCategory == "Income Tax"))
            .Select(BuildLineItem)
            .ToList();

        // Helper to build PnLSection
        PnLSection BuildSection(string key, string title, List<PnLLineItem> items)
        {
            var curTot = Math.Round(items.Sum(i => i.IsContra ? -i.CurrentAmount : i.CurrentAmount), 2);
            var cmpTot = hasComparison ? Math.Round(items.Sum(i => i.IsContra ? -i.CompareAmount : i.CompareAmount), 2) : 0.0;
            var varTot = Math.Round(curTot - cmpTot, 2);
            double varPct = 0;
            if (hasComparison && Math.Abs(cmpTot) > 0.001)
            {
                varPct = Math.Round((varTot / Math.Abs(cmpTot)) * 100, 1);
            }
            else if (hasComparison && Math.Abs(curTot) > 0.001)
            {
                varPct = curTot > 0 ? 100.0 : -100.0;
            }

            return new PnLSection
            {
                SectionKey = key,
                Title = title,
                Items = items,
                CurrentTotal = curTot,
                CompareTotal = cmpTot,
                Variance = varTot,
                VariancePercentage = varPct
            };
        }

        var secRevenue = BuildSection("REVENUE", "Operating Revenue", revenueAccounts);
        var secCOGS = BuildSection("COGS", "Cost of Goods Sold (COGS)", cogsAccounts);
        var secOpex = BuildSection("OPERATING_EXPENSES", "Operating Expenses", opexAccounts);
        var secOtherIncome = BuildSection("OTHER_INCOME", "Other Income", otherIncomeAccounts);
        var secOtherExpenses = BuildSection("OTHER_EXPENSES", "Other Expenses (Financing & Non-Operating)", otherExpenseAccounts);
        var secTax = BuildSection("TAX_EXPENSE", "Income Tax Expense", taxExpenseAccounts);

        // 7. Calculate Financial Totals & Margins
        double netRevenue = secRevenue.CurrentTotal;
        double compareNetRevenue = secRevenue.CompareTotal;

        double cogs = secCOGS.CurrentTotal;
        double compareCOGS = secCOGS.CompareTotal;

        double grossProfit = Math.Round(netRevenue - cogs, 2);
        double compareGrossProfit = Math.Round(compareNetRevenue - compareCOGS, 2);
        double grossMargin = netRevenue > 0 ? Math.Round((grossProfit / netRevenue) * 100, 2) : 0.0;
        double compareGrossMargin = compareNetRevenue > 0 ? Math.Round((compareGrossProfit / compareNetRevenue) * 100, 2) : 0.0;

        double totalOpex = secOpex.CurrentTotal;
        double compareOpex = secOpex.CompareTotal;

        double operatingProfit = Math.Round(grossProfit - totalOpex, 2);
        double compareOperatingProfit = Math.Round(compareGrossProfit - compareOpex, 2);
        double operatingMargin = netRevenue > 0 ? Math.Round((operatingProfit / netRevenue) * 100, 2) : 0.0;

        double otherIncome = secOtherIncome.CurrentTotal;
        double compareOtherIncome = secOtherIncome.CompareTotal;

        double otherExpenses = secOtherExpenses.CurrentTotal;
        double compareOtherExpenses = secOtherExpenses.CompareTotal;

        double netProfitBeforeTax = Math.Round(operatingProfit + otherIncome - otherExpenses, 2);
        double compareNetProfitBeforeTax = Math.Round(compareOperatingProfit + compareOtherIncome - compareOtherExpenses, 2);

        double taxExpense = secTax.CurrentTotal;
        double compareTaxExpense = secTax.CompareTotal;

        double netProfitAfterTax = Math.Round(netProfitBeforeTax - taxExpense, 2);
        double compareNetProfitAfterTax = Math.Round(compareNetProfitBeforeTax - compareTaxExpense, 2);
        double netMargin = netRevenue > 0 ? Math.Round((netProfitAfterTax / netRevenue) * 100, 2) : 0.0;
        double compareNetMargin = compareNetRevenue > 0 ? Math.Round((compareNetProfitAfterTax / compareNetRevenue) * 100, 2) : 0.0;

        // Variances & Growth
        double revenueGrowth = 0;
        double grossProfitGrowth = 0;
        double netProfitGrowth = 0;
        if (hasComparison && Math.Abs(compareNetRevenue) > 0.001)
            revenueGrowth = Math.Round(((netRevenue - compareNetRevenue) / Math.Abs(compareNetRevenue)) * 100, 1);
        if (hasComparison && Math.Abs(compareGrossProfit) > 0.001)
            grossProfitGrowth = Math.Round(((grossProfit - compareGrossProfit) / Math.Abs(compareGrossProfit)) * 100, 1);
        if (hasComparison && Math.Abs(compareNetProfitAfterTax) > 0.001)
            netProfitGrowth = Math.Round(((netProfitAfterTax - compareNetProfitAfterTax) / Math.Abs(compareNetProfitAfterTax)) * 100, 1);

        // 8. Monthly Trend (6 Months ending on endUtc)
        var monthlyTrends = new List<MonthlyTrendItem>();
        for (int i = 5; i >= 0; i--)
        {
            var mDate = endUtc.AddMonths(-i);
            var mStart = new DateTime(mDate.Year, mDate.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var mEnd = new DateTime(mDate.Year, mDate.Month, DateTime.DaysInMonth(mDate.Year, mDate.Month), 23, 59, 59, DateTimeKind.Utc);

            var mLines = await _db.JournalEntryLines
                .Where(l => accountIds.Contains(l.AccountId) &&
                            l.JournalEntry != null &&
                            (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED") &&
                            l.JournalEntry.EntryDate >= mStart &&
                            l.JournalEntry.EntryDate <= mEnd)
                .Select(l => new { l.AccountId, l.AccountCode, l.Debit, l.Credit })
                .ToListAsync();

            double mRev = 0, mCogs = 0, mOpex = 0, mOtherInc = 0, mOtherExp = 0;
            foreach (var l in mLines)
            {
                if (l.AccountCode.StartsWith("4") && string.Compare(l.AccountCode, "4900") < 0)
                    mRev += (l.Credit - l.Debit);
                else if (l.AccountCode.StartsWith("50"))
                    mCogs += (l.Debit - l.Credit);
                else if (l.AccountCode.StartsWith("5"))
                    mOpex += (l.Debit - l.Credit);
                else if (l.AccountCode.StartsWith("49"))
                    mOtherInc += (l.Credit - l.Debit);
                else if (l.AccountCode.StartsWith("6"))
                    mOtherExp += (l.Debit - l.Credit);
            }

            double mGp = mRev - mCogs;
            double mNp = mGp - mOpex + mOtherInc - mOtherExp;

            monthlyTrends.Add(new MonthlyTrendItem
            {
                MonthKey = $"{mDate.Year}-{mDate.Month:D2}",
                MonthLabel = mDate.ToString("MMM yyyy"),
                Revenue = Math.Round(Math.Max(0, mRev), 2),
                COGS = Math.Round(Math.Max(0, mCogs), 2),
                OperatingExpenses = Math.Round(Math.Max(0, mOpex), 2),
                GrossProfit = Math.Round(mGp, 2),
                NetProfit = Math.Round(mNp, 2)
            });
        }

        // 9. Operating Expense Breakdown for Charts
        var expenseCategories = opexAccounts
            .Where(a => a.CurrentAmount > 0)
            .GroupBy(a => a.SubCategory)
            .Select(g => new ExpenseCategoryBreakdownItem
            {
                CategoryName = g.Key,
                Amount = Math.Round(g.Sum(x => x.CurrentAmount), 2),
                PercentageOfExpenses = totalOpex > 0 ? Math.Round((g.Sum(x => x.CurrentAmount) / totalOpex) * 100, 1) : 0.0
            })
            .OrderByDescending(x => x.Amount)
            .ToList();

        return Ok(ApiResponse.Ok(new
        {
            Period = new
            {
                StartDate = startUtc,
                EndDate = endUtc,
                FormattedPeriod = $"{startUtc:dd MMM yyyy} – {endUtc:dd MMM yyyy}",
                ComparisonMode = comparisonMode,
                HasComparison = hasComparison,
                CompareStartDate = cmpStartUtc,
                CompareEndDate = cmpEndUtc,
                FormattedComparePeriod = hasComparison && cmpStartUtc.HasValue && cmpEndUtc.HasValue
                    ? $"{cmpStartUtc.Value:dd MMM yyyy} – {cmpEndUtc.Value:dd MMM yyyy}"
                    : null
            },
            SummaryCards = new
            {
                TotalNetRevenue = netRevenue,
                CompareNetRevenue = compareNetRevenue,
                RevenueGrowthPercentage = revenueGrowth,

                GrossProfit = grossProfit,
                CompareGrossProfit = compareGrossProfit,
                GrossProfitMargin = grossMargin,
                CompareGrossProfitMargin = compareGrossMargin,
                GrossProfitGrowthPercentage = grossProfitGrowth,

                OperatingProfit = operatingProfit,
                CompareOperatingProfit = compareOperatingProfit,
                OperatingProfitMargin = operatingMargin,

                NetProfitAfterTax = netProfitAfterTax,
                CompareNetProfitAfterTax = compareNetProfitAfterTax,
                NetProfitMargin = netMargin,
                CompareNetProfitMargin = compareNetMargin,
                NetProfitGrowthPercentage = netProfitGrowth,

                TotalOperatingExpenses = totalOpex,
                TotalCOGS = cogs,
                TotalOtherIncome = otherIncome,
                TotalOtherExpenses = otherExpenses,
                TaxExpense = taxExpense
            },
            Sections = new List<PnLSection>
            {
                secRevenue,
                secCOGS,
                secOpex,
                secOtherIncome,
                secOtherExpenses,
                secTax
            },
            MonthlyTrends = monthlyTrends,
            ExpenseCategoryBreakdown = expenseCategories
        }));
    }

    #endregion

    #region 2. Account Drilldown Endpoint (Audit & Verification)

    [HttpGet("drilldown")]
    public async Task<IActionResult> GetAccountDrilldown(
        [FromQuery] string accountId,
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        if (string.IsNullOrEmpty(accountId))
            return BadRequest(ApiResponse.Fail("AccountId is required."));

        var acc = await _db.Accounts.FindAsync(accountId);
        if (acc == null) return NotFound(ApiResponse.Fail("Account not found."));

        var startUtc = startDate.Date;
        var endUtc = endDate.Date.AddDays(1).AddTicks(-1);

        var lines = await _db.JournalEntryLines
            .Include(l => l.JournalEntry)
            .Where(l => l.AccountId == accountId &&
                        l.JournalEntry != null &&
                        (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED") &&
                        l.JournalEntry.EntryDate >= startUtc &&
                        l.JournalEntry.EntryDate <= endUtc)
            .OrderByDescending(l => l.JournalEntry!.EntryDate)
            .Select(l => new
            {
                l.Id,
                JournalEntryId = l.JournalEntryId,
                EntryNumber = l.JournalEntry!.EntryNumber,
                EntryDate = l.JournalEntry.EntryDate,
                Description = l.JournalEntry.Description,
                LineDescription = l.LineDescription,
                Reference = l.JournalEntry.Reference,
                SourceModule = l.JournalEntry.SourceModule,
                SourceTransactionId = l.JournalEntry.SourceTransactionId,
                Debit = l.Debit,
                Credit = l.Credit,
                Status = l.JournalEntry.Status
            })
            .ToListAsync();

        double totalDebit = lines.Sum(l => l.Debit);
        double totalCredit = lines.Sum(l => l.Credit);
        double netMovement = acc.AccountType == "REVENUE" ? (totalCredit - totalDebit) : (totalDebit - totalCredit);

        return Ok(ApiResponse.Ok(new
        {
            Account = new
            {
                acc.Id,
                acc.AccountCode,
                acc.AccountName,
                acc.AccountType,
                acc.SubCategory,
                acc.NormalBalance
            },
            Period = new
            {
                StartDate = startUtc,
                EndDate = endUtc
            },
            Totals = new
            {
                TotalDebit = Math.Round(totalDebit, 2),
                TotalCredit = Math.Round(totalCredit, 2),
                NetMovement = Math.Round(netMovement, 2),
                TransactionCount = lines.Count
            },
            Transactions = lines
        }));
    }

    #endregion
}


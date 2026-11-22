using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/cash-flow")]
public class CashFlowController : ControllerBase
{
    private readonly HospitalityDbContext _db;
    private readonly ILogger<CashFlowController> _logger;

    public CashFlowController(HospitalityDbContext db, ILogger<CashFlowController> logger)
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

    #region Data Transfer Models

    public class CashFlowLineItem
    {
        public string ItemKey { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty; // Inflow or Outflow
        public double CurrentAmount { get; set; }
        public double CompareAmount { get; set; }
        public double Variance { get; set; }
        public double VariancePercentage { get; set; }
        public int TransactionCount { get; set; }
    }

    public class CashFlowActivitySection
    {
        public string ActivityType { get; set; } = string.Empty; // OPERATING, INVESTING, FINANCING
        public string Title { get; set; } = string.Empty;
        public List<CashFlowLineItem> Inflows { get; set; } = new();
        public double TotalInflows { get; set; }
        public double CompareTotalInflows { get; set; }

        public List<CashFlowLineItem> Outflows { get; set; } = new();
        public double TotalOutflows { get; set; }
        public double CompareTotalOutflows { get; set; }

        public double NetCashFlow { get; set; }
        public double CompareNetCashFlow { get; set; }
        public double Variance { get; set; }
        public double VariancePercentage { get; set; }
    }

    public class CashAccountBalanceSummary
    {
        public string AccountId { get; set; } = string.Empty;
        public string AccountCode { get; set; } = string.Empty;
        public string AccountName { get; set; } = string.Empty;
        public string SubCategory { get; set; } = string.Empty;
        public double OpeningBalance { get; set; }
        public double TotalInflows { get; set; }
        public double TotalOutflows { get; set; }
        public double NetChange { get; set; }
        public double ClosingBalance { get; set; }
    }

    public class IndirectWorkingCapitalItem
    {
        public string ItemKey { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public double OpeningBalance { get; set; }
        public double ClosingBalance { get; set; }
        public double ChangeInBalance { get; set; }
        public double CashFlowImpact { get; set; }
        public string Explanation { get; set; } = string.Empty;
    }

    public class IndirectMethodSection
    {
        public double NetProfitOrLoss { get; set; }
        public List<CashFlowLineItem> NonCashAdjustments { get; set; } = new();
        public double TotalNonCashAdjustments { get; set; }

        public List<IndirectWorkingCapitalItem> WorkingCapitalAdjustments { get; set; } = new();
        public double TotalWorkingCapitalAdjustments { get; set; }

        public double NetOperatingCashFlow { get; set; }
    }

    public class MonthlyCashFlowTrendItem
    {
        public string MonthKey { get; set; } = string.Empty;
        public string MonthLabel { get; set; } = string.Empty;
        public double TotalInflow { get; set; }
        public double TotalOutflow { get; set; }
        public double NetChange { get; set; }
        public double OperatingCashFlow { get; set; }
        public double InvestingCashFlow { get; set; }
        public double FinancingCashFlow { get; set; }
    }

    public class CashFlowSummaryCards
    {
        public double OpeningCashBalance { get; set; }
        public double TotalCashInflow { get; set; }
        public double TotalCashOutflow { get; set; }
        public double NetChangeInCash { get; set; }
        public double ClosingCashBalance { get; set; }

        public double OperatingCashFlow { get; set; }
        public double InvestingCashFlow { get; set; }
        public double FinancingCashFlow { get; set; }

        // Comparison
        public double CompareOpeningCashBalance { get; set; }
        public double CompareTotalCashInflow { get; set; }
        public double CompareTotalCashOutflow { get; set; }
        public double CompareNetChangeInCash { get; set; }
        public double CompareClosingCashBalance { get; set; }

        public double VarianceNetChange { get; set; }
        public double VariancePercentageNetChange { get; set; }
    }

    public class CashFlowStatementResponse
    {
        public string StartDate { get; set; } = string.Empty;
        public string EndDate { get; set; } = string.Empty;
        public string FormattedPeriod { get; set; } = string.Empty;
        public string? CompareStartDate { get; set; }
        public string? CompareEndDate { get; set; }
        public string? FormattedComparePeriod { get; set; }
        public string ComparisonMode { get; set; } = "NONE";
        public string PresentationMethod { get; set; } = "DIRECT"; // DIRECT or INDIRECT

        public CashFlowSummaryCards Summary { get; set; } = new();
        public List<CashAccountBalanceSummary> CashAccounts { get; set; } = new();

        public CashFlowActivitySection OperatingActivities { get; set; } = new();
        public CashFlowActivitySection InvestingActivities { get; set; } = new();
        public CashFlowActivitySection FinancingActivities { get; set; } = new();

        public IndirectMethodSection? IndirectMethod { get; set; }
        public List<MonthlyCashFlowTrendItem> MonthlyTrends { get; set; } = new();
    }

    public class CashFlowDrilldownTransaction
    {
        public string Id { get; set; } = string.Empty;
        public string JournalEntryId { get; set; } = string.Empty;
        public string EntryNumber { get; set; } = string.Empty;
        public DateTime EntryDate { get; set; }
        public string Description { get; set; } = string.Empty;
        public string? Reference { get; set; }
        public string SourceModule { get; set; } = string.Empty;
        public string CashAccountCode { get; set; } = string.Empty;
        public string CashAccountName { get; set; } = string.Empty;
        public string ContraAccountCode { get; set; } = string.Empty;
        public string ContraAccountName { get; set; } = string.Empty;
        public bool IsInflow { get; set; }
        public double Amount { get; set; }
    }

    public class CashFlowDrilldownResponse
    {
        public string ItemKey { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string ActivityType { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public double TotalAmount { get; set; }
        public int TransactionCount { get; set; }
        public string FormattedPeriod { get; set; } = string.Empty;
        public List<CashFlowDrilldownTransaction> Transactions { get; set; } = new();
    }

    #endregion

    #region Helper Classification Logic

    private static bool IsCashEquivalent(Account a)
    {
        if (a.AccountType != "ASSET") return false;
        var sub = (a.SubCategory ?? "").ToLowerInvariant();
        var code = a.AccountCode;

        if (code.StartsWith("10") ||
            sub.Contains("cash") ||
            sub.Contains("bank") ||
            sub.Contains("wallet") ||
            sub.Contains("clearing"))
        {
            // Ensure not AR, Inventory, or Fixed Assets
            if (code.StartsWith("11") || code.StartsWith("12") || code.StartsWith("14") || code.StartsWith("15") || code.StartsWith("16"))
                return false;
            return true;
        }
        return false;
    }

    private static (string Activity, string CategoryKey, string Title, bool IsInflow) ClassifyCashLeg(
        bool isCashDebit,
        Account contraAcc,
        JournalEntry je,
        JournalEntryLine contraLine)
    {
        var code = contraAcc.AccountCode;
        var type = contraAcc.AccountType.ToUpperInvariant();
        var sub = (contraAcc.SubCategory ?? "").ToLowerInvariant();

        if (isCashDebit)
        {
            // Cash DEBIT means Cash INFLOW. The contra account is CREDITED.
            // 1. Investing Inflows: Disposal of Fixed Assets
            if (code.StartsWith("15") || code.StartsWith("16") || code == "4930" || sub.Contains("disposal"))
            {
                return ("INVESTING", "FA_SALE", "Proceeds from Sale of Fixed Assets & Equipment", true);
            }

            // 2. Financing Inflows: Bank loans received or Owner capital contributions
            if (code == "2500" || code == "2110" || sub.Contains("long-term") || sub.Contains("borrowing"))
            {
                return ("FINANCING", "LOAN_PROCEEDS", "Bank Loans & Commercial Borrowings Received", true);
            }
            if (code.StartsWith("301") || code.StartsWith("310") || sub.Contains("capital") || sub.Contains("equity"))
            {
                return ("FINANCING", "CAPITAL_CONTRIB", "Owner Capital Injections & Paid-in Equity", true);
            }

            // 3. Operating Inflows: Revenue and receipts
            if (code == "4300" || code == "4310" || code == "4320" || sub.Contains("catering") || sub.Contains("event") || sub.Contains("banquet"))
            {
                return ("OPERATING", "CATERING_RECEIPTS", "Catering, Banquet & Event Hall Receipts", true);
            }
            if (code == "4330" || sub.Contains("delivery"))
            {
                return ("OPERATING", "DELIVERY_RECEIPTS", "Online Order & Food Delivery Receipts", true);
            }
            if (code == "4910" || sub.Contains("interest"))
            {
                return ("OPERATING", "INTEREST_RECEIVED", "Bank Interest & Deposit Returns Received", true);
            }
            if (code == "4920" || sub.Contains("discount"))
            {
                return ("OPERATING", "DISCOUNTS_RECEIVED", "Settlement & Vendor Prompt Payment Discounts", true);
            }
            if (code == "2020" || code == "2080" || sub.Contains("advance"))
            {
                return ("OPERATING", "CUSTOMER_ADVANCES", "Guest Booking & Event Advance Deposits Received", true);
            }
            if (code.StartsWith("11") || sub.Contains("receivable"))
            {
                return ("OPERATING", "AR_COLLECTIONS", "Customer Ledger & Guest Folio Receivables Collected", true);
            }
            if (code.StartsWith("40") || code.StartsWith("41") || type == "REVENUE" || type == "INCOME")
            {
                return ("OPERATING", "CUSTOMER_RECEIPTS", "Customer Dining & Direct Restaurant Sales Receipts", true);
            }

            // Default operating inflow
            return ("OPERATING", "OTHER_OPERATING_INFLOW", "Other Operating Cash Receipts", true);
        }
        else
        {
            // Cash CREDIT means Cash OUTFLOW. The contra account is DEBITED.
            // 1. Investing Outflows: Fixed Asset purchases / Capital expenditures
            if (code.StartsWith("15"))
            {
                if (code == "1510" || code == "1520" || sub.Contains("kitchen") || sub.Contains("refrigerator"))
                    return ("INVESTING", "FA_KITCHEN_EQ", "Kitchen Equipment & Refrigeration Purchases", false);
                if (code == "1500" || sub.Contains("furniture"))
                    return ("INVESTING", "FA_FURNITURE", "Dining Hall Furniture & Fixtures Purchases", false);
                if (code == "1530" || sub.Contains("computer") || sub.Contains("it"))
                    return ("INVESTING", "FA_IT_EQUIP", "POS Hardware & Computer Equipment Purchases", false);
                if (code == "1550" || sub.Contains("vehicle"))
                    return ("INVESTING", "FA_VEHICLES", "Delivery Vans & Vehicle Acquisitions", false);
                if (code == "1560" || code == "1570" || sub.Contains("building") || sub.Contains("generator"))
                    return ("INVESTING", "FA_IMPROVEMENTS", "Building Improvements & Generator Infrastructure", false);

                return ("INVESTING", "FA_OTHER", "Other Long-Term Capital Asset Purchases", false);
            }

            // 2. Financing Outflows: Loan principal repayments & Owner drawings
            if (code == "2500" || code == "2110" || sub.Contains("long-term") || sub.Contains("borrowing"))
            {
                return ("FINANCING", "LOAN_REPAYMENT", "Bank Loan Principal & Borrowing Repayments", false);
            }
            if (code == "3030" || sub.Contains("drawing"))
            {
                return ("FINANCING", "OWNER_DRAWINGS", "Owner Drawings & Personal Profit Withdrawals", false);
            }

            // 3. Operating Outflows: Expenses, payroll, rent, utilities, suppliers
            if (code == "2010" || code.StartsWith("12") || code == "5010" || code == "5020" || sub.Contains("supplier") || sub.Contains("direct cost") || sub.Contains("inventory"))
            {
                return ("OPERATING", "SUPPLIER_PAYMENTS", "Supplier & Food Raw Ingredients Purchases Paid", false);
            }
            if (code == "2100" || code == "2060" || code.StartsWith("51") || sub.Contains("payroll") || sub.Contains("salary") || sub.Contains("welfare"))
            {
                return ("OPERATING", "PAYROLL_PAID", "Staff Salaries, Wages & Service Charge Paid", false);
            }
            if (code == "5210" || sub.Contains("rent"))
            {
                return ("OPERATING", "RENT_PAID", "Dining Hall & Premises Lease Rent Paid", false);
            }
            if (code == "5300" || code == "5310" || sub.Contains("utilities") || sub.Contains("electricity") || sub.Contains("water"))
            {
                return ("OPERATING", "UTILITIES_PAID", "Electricity Grid, Water Supply & Utility Bills Paid", false);
            }
            if (code == "5400" || code == "5410" || code == "5420" || sub.Contains("maintenance") || sub.Contains("repair"))
            {
                return ("OPERATING", "MAINTENANCE_PAID", "Kitchen & Restaurant Facilities Maintenance Paid", false);
            }
            if (code == "5600" || code == "5620" || sub.Contains("administrative") || sub.Contains("internet") || sub.Contains("software"))
            {
                return ("OPERATING", "ADMIN_SOFTWARE_PAID", "Internet, Software Subscriptions & Office Supplies Paid", false);
            }
            if (code == "5500" || sub.Contains("marketing") || sub.Contains("commission"))
            {
                return ("OPERATING", "MARKETING_PAID", "Marketing, Social Media Ads & Booking Commissions Paid", false);
            }
            if (code == "2050" || code == "2070" || code == "7010" || sub.Contains("tax") || sub.Contains("vat") || sub.Contains("tds"))
            {
                return ("OPERATING", "TAXES_PAID", "Statutory Taxes Paid (VAT, TDS & Corporate Tax)", false);
            }
            if (code == "6100" || sub.Contains("interest"))
            {
                return ("OPERATING", "INTEREST_PAID", "Bank Loan & Financing Interest Charges Paid", false);
            }

            // Default operating outflow
            return ("OPERATING", "OTHER_OPERATING_EXPENSE", "Other Restaurant Operating Expenses Paid", false);
        }
    }

    #endregion

    #region 1. Main Cash Flow Statement Endpoint

    [HttpGet("statement")]
    public async Task<IActionResult> GetStatement(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] string? comparisonMode = "NONE",
        [FromQuery] DateTime? compareStartDate = null,
        [FromQuery] DateTime? compareEndDate = null,
        [FromQuery] string? method = "DIRECT")
    {
        var hotelId = await GetCurrentHotelIdAsync();
        var now = DateTime.UtcNow;

        var start = startDate.HasValue
            ? DateTime.SpecifyKind(startDate.Value.Date, DateTimeKind.Utc)
            : new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var end = endDate.HasValue
            ? DateTime.SpecifyKind(endDate.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc)
            : new DateTime(now.Year, now.Month, DateTime.DaysInMonth(now.Year, now.Month), 23, 59, 59, 999, DateTimeKind.Utc);

        var mode = (comparisonMode ?? "NONE").ToUpperInvariant();
        DateTime? compStart = null;
        DateTime? compEnd = null;

        if (mode == "PREVIOUS_PERIOD")
        {
            var duration = end - start;
            compEnd = start.AddTicks(-1);
            compStart = compEnd.Value.Subtract(duration);
        }
        else if (mode == "PREVIOUS_YEAR")
        {
            compStart = start.AddYears(-1);
            compEnd = end.AddYears(-1);
        }
        else if (mode == "CUSTOM" && compareStartDate.HasValue && compareEndDate.HasValue)
        {
            compStart = DateTime.SpecifyKind(compareStartDate.Value.Date, DateTimeKind.Utc);
            compEnd = DateTime.SpecifyKind(compareEndDate.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
        }

        var hasComparison = compStart.HasValue && compEnd.HasValue;

        // Fetch accounts
        var allAccounts = await _db.Accounts
            .Where(a => !a.IsGroup && a.IsActive)
            .OrderBy(a => a.AccountCode)
            .ToListAsync();

        var cashAccounts = allAccounts.Where(IsCashEquivalent).ToList();
        var cashAccountIds = cashAccounts.Select(a => a.Id).ToHashSet();

        // 1. Calculate Opening Cash Balance (posted lines before start)
        var priorCashLines = await _db.JournalEntryLines
            .Where(l => cashAccountIds.Contains(l.AccountId) &&
                        l.JournalEntry != null &&
                        (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED") &&
                        l.JournalEntry.EntryDate < start)
            .Select(l => new { l.AccountId, l.Debit, l.Credit })
            .ToListAsync();

        var priorCashGrouped = priorCashLines
            .GroupBy(l => l.AccountId)
            .ToDictionary(g => g.Key, g => g.Sum(x => x.Debit) - g.Sum(x => x.Credit));

        // 2. Fetch Period Journal Entries touching at least one cash account
        var periodEntries = await _db.JournalEntries
            .Where(je => (je.Status == "POSTED" || je.Status == "REVERSED") &&
                         je.EntryDate >= start &&
                         je.EntryDate <= end)
            .Include(je => je.Lines)
            .ToListAsync();

        // Also fetch comparison entries if comparison requested
        List<JournalEntry> compareEntries = new();
        Dictionary<string, double> compPriorCashGrouped = new();
        if (hasComparison)
        {
            var compPriorLines = await _db.JournalEntryLines
                .Where(l => cashAccountIds.Contains(l.AccountId) &&
                            l.JournalEntry != null &&
                            (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED") &&
                            l.JournalEntry.EntryDate < compStart!.Value)
                .Select(l => new { l.AccountId, l.Debit, l.Credit })
                .ToListAsync();

            compPriorCashGrouped = compPriorLines
                .GroupBy(l => l.AccountId)
                .ToDictionary(g => g.Key, g => g.Sum(x => x.Debit) - g.Sum(x => x.Credit));

            compareEntries = await _db.JournalEntries
                .Where(je => (je.Status == "POSTED" || je.Status == "REVERSED") &&
                             je.EntryDate >= compStart!.Value &&
                             je.EntryDate <= compEnd!.Value)
                .Include(je => je.Lines)
                .ToListAsync();
        }

        // Account dictionary for fast lookups
        var accountsById = allAccounts.ToDictionary(a => a.Id, a => a);

        // Process cash flow lines for a given set of entries
        (
            Dictionary<string, (CashFlowLineItem Item, List<CashFlowDrilldownTransaction> Txs)> Inflows,
            Dictionary<string, (CashFlowLineItem Item, List<CashFlowDrilldownTransaction> Txs)> Outflows,
            Dictionary<string, (double Inflows, double Outflows)> AccMovements
        ) ProcessCashFlow(List<JournalEntry> entries)
        {
            var inflowsDict = new Dictionary<string, (CashFlowLineItem Item, List<CashFlowDrilldownTransaction> Txs)>();
            var outflowsDict = new Dictionary<string, (CashFlowLineItem Item, List<CashFlowDrilldownTransaction> Txs)>();
            var accMovements = new Dictionary<string, (double, double)>();

            foreach (var ca in cashAccounts)
            {
                accMovements[ca.Id] = (0.0, 0.0);
            }

            foreach (var je in entries)
            {
                var lines = je.Lines;
                var cashInLines = lines.Where(l => cashAccountIds.Contains(l.AccountId)).ToList();
                if (cashInLines.Count == 0) continue; // Pure non-cash entry

                var nonCashLines = lines.Where(l => !cashAccountIds.Contains(l.AccountId)).ToList();

                // Check for internal transfer: all lines are cash accounts
                if (nonCashLines.Count == 0)
                {
                    // Internal transfer: e.g. Cash drawer to Bank.
                    // Updates individual cash account movements, but does NOT create external cash flow!
                    foreach (var cl in cashInLines)
                    {
                        var cur = accMovements[cl.AccountId];
                        accMovements[cl.AccountId] = (cur.Item1 + cl.Debit, cur.Item2 + cl.Credit);
                    }
                    continue;
                }

                // Normal cash transaction with non-cash counter-legs
                foreach (var cl in cashInLines)
                {
                    var cur = accMovements[cl.AccountId];
                    accMovements[cl.AccountId] = (cur.Item1 + cl.Debit, cur.Item2 + cl.Credit);

                    bool isCashDebit = cl.Debit > 0;
                    double cashAmount = isCashDebit ? cl.Debit : cl.Credit;
                    if (cashAmount <= 0) continue;

                    // Match with primary contra line
                    var contraLine = nonCashLines.OrderByDescending(n => isCashDebit ? n.Credit : n.Debit).FirstOrDefault()
                                     ?? nonCashLines.First();

                    if (!accountsById.TryGetValue(contraLine.AccountId, out var contraAcc))
                    {
                        contraAcc = new Account { AccountCode = contraLine.AccountCode, AccountName = contraLine.AccountName, AccountType = "EXPENSE" };
                    }

                    accountsById.TryGetValue(cl.AccountId, out var caAcc);

                    var (activity, key, title, isInflow) = ClassifyCashLeg(isCashDebit, contraAcc, je, contraLine);

                    var txItem = new CashFlowDrilldownTransaction
                    {
                        Id = cl.Id,
                        JournalEntryId = je.Id,
                        EntryNumber = je.EntryNumber,
                        EntryDate = je.EntryDate,
                        Description = string.IsNullOrWhiteSpace(cl.LineDescription) ? je.Description : cl.LineDescription,
                        Reference = je.Reference,
                        SourceModule = je.SourceModule,
                        CashAccountCode = caAcc?.AccountCode ?? cl.AccountCode,
                        CashAccountName = caAcc?.AccountName ?? cl.AccountName,
                        ContraAccountCode = contraAcc.AccountCode,
                        ContraAccountName = contraAcc.AccountName,
                        IsInflow = isInflow,
                        Amount = Math.Round(cashAmount, 2)
                    };

                    var dict = isInflow ? inflowsDict : outflowsDict;
                    if (!dict.ContainsKey(key))
                    {
                        dict[key] = (new CashFlowLineItem
                        {
                            ItemKey = key,
                            Title = title,
                            Category = activity,
                            CurrentAmount = 0,
                            TransactionCount = 0
                        }, new List<CashFlowDrilldownTransaction>());
                    }

                    var tuple = dict[key];
                    tuple.Item.CurrentAmount += cashAmount;
                    tuple.Item.TransactionCount++;
                    tuple.Txs.Add(txItem);
                }
            }

            return (inflowsDict, outflowsDict, accMovements);
        }

        var (currentInflows, currentOutflows, currentAccMovements) = ProcessCashFlow(periodEntries);
        var (compareInflows, compareOutflows, compAccMovements) = ProcessCashFlow(compareEntries);

        // Build Cash Accounts Summary
        var cashAccountSummaries = new List<CashAccountBalanceSummary>();
        double totalOpeningCash = 0;
        double totalClosingCash = 0;
        double compTotalOpeningCash = 0;
        double compTotalClosingCash = 0;

        foreach (var ca in cashAccounts)
        {
            priorCashGrouped.TryGetValue(ca.Id, out var priorNet);
            var opening = ca.OpeningBalance + priorNet;

            currentAccMovements.TryGetValue(ca.Id, out var moves);
            var inFlow = moves.Inflows;
            var outFlow = moves.Outflows;
            var net = inFlow - outFlow;
            var closing = opening + net;

            totalOpeningCash += opening;
            totalClosingCash += closing;

            cashAccountSummaries.Add(new CashAccountBalanceSummary
            {
                AccountId = ca.Id,
                AccountCode = ca.AccountCode,
                AccountName = ca.AccountName,
                SubCategory = ca.SubCategory ?? "Cash & Bank",
                OpeningBalance = Math.Round(opening, 2),
                TotalInflows = Math.Round(inFlow, 2),
                TotalOutflows = Math.Round(outFlow, 2),
                NetChange = Math.Round(net, 2),
                ClosingBalance = Math.Round(closing, 2)
            });

            if (hasComparison)
            {
                compPriorCashGrouped.TryGetValue(ca.Id, out var cPriorNet);
                var cOpening = ca.OpeningBalance + cPriorNet;
                compAccMovements.TryGetValue(ca.Id, out var cMoves);
                var cNet = cMoves.Inflows - cMoves.Outflows;
                compTotalOpeningCash += cOpening;
                compTotalClosingCash += (cOpening + cNet);
            }
        }

        // Helper to compile activity section
        CashFlowActivitySection BuildSection(string activityType, string title)
        {
            var inflowItems = new List<CashFlowLineItem>();
            var outflowItems = new List<CashFlowLineItem>();

            foreach (var kvp in currentInflows.Where(k => k.Value.Item.Category == activityType))
            {
                var cur = kvp.Value.Item;
                double comp = 0;
                if (compareInflows.TryGetValue(kvp.Key, out var cTuple))
                {
                    comp = cTuple.Item.CurrentAmount;
                }
                var v = cur.CurrentAmount - comp;
                var vPct = comp != 0 ? (v / Math.Abs(comp)) * 100 : (cur.CurrentAmount != 0 ? 100 : 0);

                inflowItems.Add(new CashFlowLineItem
                {
                    ItemKey = cur.ItemKey,
                    Title = cur.Title,
                    Category = activityType,
                    CurrentAmount = Math.Round(cur.CurrentAmount, 2),
                    CompareAmount = Math.Round(comp, 2),
                    Variance = Math.Round(v, 2),
                    VariancePercentage = Math.Round(vPct, 1),
                    TransactionCount = cur.TransactionCount
                });
            }

            // Check if there are compare items that had 0 in current
            if (hasComparison)
            {
                foreach (var kvp in compareInflows.Where(k => k.Value.Item.Category == activityType && !currentInflows.ContainsKey(k.Key)))
                {
                    var comp = kvp.Value.Item.CurrentAmount;
                    inflowItems.Add(new CashFlowLineItem
                    {
                        ItemKey = kvp.Key,
                        Title = kvp.Value.Item.Title,
                        Category = activityType,
                        CurrentAmount = 0,
                        CompareAmount = Math.Round(comp, 2),
                        Variance = Math.Round(-comp, 2),
                        VariancePercentage = -100,
                        TransactionCount = 0
                    });
                }
            }

            foreach (var kvp in currentOutflows.Where(k => k.Value.Item.Category == activityType))
            {
                var cur = kvp.Value.Item;
                double comp = 0;
                if (compareOutflows.TryGetValue(kvp.Key, out var cTuple))
                {
                    comp = cTuple.Item.CurrentAmount;
                }
                var v = cur.CurrentAmount - comp;
                var vPct = comp != 0 ? (v / Math.Abs(comp)) * 100 : (cur.CurrentAmount != 0 ? 100 : 0);

                outflowItems.Add(new CashFlowLineItem
                {
                    ItemKey = cur.ItemKey,
                    Title = cur.Title,
                    Category = activityType,
                    CurrentAmount = Math.Round(cur.CurrentAmount, 2),
                    CompareAmount = Math.Round(comp, 2),
                    Variance = Math.Round(v, 2),
                    VariancePercentage = Math.Round(vPct, 1),
                    TransactionCount = cur.TransactionCount
                });
            }

            if (hasComparison)
            {
                foreach (var kvp in compareOutflows.Where(k => k.Value.Item.Category == activityType && !currentOutflows.ContainsKey(k.Key)))
                {
                    var comp = kvp.Value.Item.CurrentAmount;
                    outflowItems.Add(new CashFlowLineItem
                    {
                        ItemKey = kvp.Key,
                        Title = kvp.Value.Item.Title,
                        Category = activityType,
                        CurrentAmount = 0,
                        CompareAmount = Math.Round(comp, 2),
                        Variance = Math.Round(-comp, 2),
                        VariancePercentage = -100,
                        TransactionCount = 0
                    });
                }
            }

            var totIn = inflowItems.Sum(i => i.CurrentAmount);
            var compTotIn = inflowItems.Sum(i => i.CompareAmount);
            var totOut = outflowItems.Sum(i => i.CurrentAmount);
            var compTotOut = outflowItems.Sum(i => i.CompareAmount);

            var net = totIn - totOut;
            var compNet = compTotIn - compTotOut;
            var netVar = net - compNet;
            var netVarPct = compNet != 0 ? (netVar / Math.Abs(compNet)) * 100 : (net != 0 ? 100 : 0);

            return new CashFlowActivitySection
            {
                ActivityType = activityType,
                Title = title,
                Inflows = inflowItems.OrderByDescending(i => i.CurrentAmount).ToList(),
                TotalInflows = Math.Round(totIn, 2),
                CompareTotalInflows = Math.Round(compTotIn, 2),
                Outflows = outflowItems.OrderByDescending(i => i.CurrentAmount).ToList(),
                TotalOutflows = Math.Round(totOut, 2),
                CompareTotalOutflows = Math.Round(compTotOut, 2),
                NetCashFlow = Math.Round(net, 2),
                CompareNetCashFlow = Math.Round(compNet, 2),
                Variance = Math.Round(netVar, 2),
                VariancePercentage = Math.Round(netVarPct, 1)
            };
        }

        var operatingSection = BuildSection("OPERATING", "Operating Activities");
        var investingSection = BuildSection("INVESTING", "Investing Activities");
        var financingSection = BuildSection("FINANCING", "Financing Activities");

        var totalInflows = operatingSection.TotalInflows + investingSection.TotalInflows + financingSection.TotalInflows;
        var totalOutflows = operatingSection.TotalOutflows + investingSection.TotalOutflows + financingSection.TotalOutflows;
        var netChangeInCash = totalInflows - totalOutflows;

        var compTotalInflows = operatingSection.CompareTotalInflows + investingSection.CompareTotalInflows + financingSection.CompareTotalInflows;
        var compTotalOutflows = operatingSection.CompareTotalOutflows + investingSection.CompareTotalOutflows + financingSection.CompareTotalOutflows;
        var compNetChangeInCash = compTotalInflows - compTotalOutflows;

        var varNetChange = netChangeInCash - compNetChangeInCash;
        var varNetChangePct = compNetChangeInCash != 0 ? (varNetChange / Math.Abs(compNetChangeInCash)) * 100 : (netChangeInCash != 0 ? 100 : 0);

        var summaryCards = new CashFlowSummaryCards
        {
            OpeningCashBalance = Math.Round(totalOpeningCash, 2),
            TotalCashInflow = Math.Round(totalInflows, 2),
            TotalCashOutflow = Math.Round(totalOutflows, 2),
            NetChangeInCash = Math.Round(netChangeInCash, 2),
            ClosingCashBalance = Math.Round(totalClosingCash, 2),

            OperatingCashFlow = operatingSection.NetCashFlow,
            InvestingCashFlow = investingSection.NetCashFlow,
            FinancingCashFlow = financingSection.NetCashFlow,

            CompareOpeningCashBalance = Math.Round(compTotalOpeningCash, 2),
            CompareTotalCashInflow = Math.Round(compTotalInflows, 2),
            CompareTotalCashOutflow = Math.Round(compTotalOutflows, 2),
            CompareNetChangeInCash = Math.Round(compNetChangeInCash, 2),
            CompareClosingCashBalance = Math.Round(compTotalClosingCash, 2),

            VarianceNetChange = Math.Round(varNetChange, 2),
            VariancePercentageNetChange = Math.Round(varNetChangePct, 1)
        };

        // 3. Indirect Method calculation
        IndirectMethodSection? indirectSection = null;
        if (method?.ToUpperInvariant() == "INDIRECT")
        {
            // Calculate period P&L net profit
            var pnlLines = await _db.JournalEntryLines
                .Where(l => l.JournalEntry != null &&
                            (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED") &&
                            l.JournalEntry.EntryDate >= start &&
                            l.JournalEntry.EntryDate <= end)
                .Select(l => new { l.AccountId, l.Debit, l.Credit })
                .ToListAsync();

            var pnlGrouped = pnlLines.GroupBy(l => l.AccountId).ToDictionary(g => g.Key, g => new { TotalDebit = g.Sum(x => x.Debit), TotalCredit = g.Sum(x => x.Credit) });

            double periodRev = 0;
            double periodExp = 0;
            double depreciationTotal = 0;

            foreach (var a in allAccounts)
            {
                pnlGrouped.TryGetValue(a.Id, out var cur);
                var deb = cur?.TotalDebit ?? 0.0;
                var cred = cur?.TotalCredit ?? 0.0;

                if (a.AccountType == "REVENUE" || a.AccountType == "INCOME")
                    periodRev += (cred - deb);
                else if (a.AccountType == "EXPENSE")
                {
                    var expAmt = (deb - cred);
                    periodExp += expAmt;
                    if (a.AccountCode.StartsWith("58") || (a.SubCategory ?? "").Contains("depreciation", StringComparison.OrdinalIgnoreCase))
                    {
                        depreciationTotal += expAmt;
                    }
                }
            }

            var netProfit = periodRev - periodExp;

            var nonCashItems = new List<CashFlowLineItem>
            {
                new CashFlowLineItem
                {
                    ItemKey = "DEP_ADJUST",
                    Title = "Add back: Non-Cash Depreciation & Amortization Expense",
                    Category = "NON_CASH",
                    CurrentAmount = Math.Round(depreciationTotal, 2)
                }
            };

            // Calculate Working Capital Changes (Receivables, Inventory, Payables, Customer Advances)
            async Task<(double Open, double Close)> GetBalanceRange(List<string> codes)
            {
                var targetAccIds = allAccounts.Where(a => codes.Any(c => a.AccountCode.StartsWith(c))).Select(a => a.Id).ToList();
                var prior = await _db.JournalEntryLines
                    .Where(l => targetAccIds.Contains(l.AccountId) && l.JournalEntry != null && (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED") && l.JournalEntry.EntryDate < start)
                    .Select(l => new { l.AccountId, l.Debit, l.Credit })
                    .ToListAsync();
                var period = await _db.JournalEntryLines
                    .Where(l => targetAccIds.Contains(l.AccountId) && l.JournalEntry != null && (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED") && l.JournalEntry.EntryDate >= start && l.JournalEntry.EntryDate <= end)
                    .Select(l => new { l.AccountId, l.Debit, l.Credit })
                    .ToListAsync();

                var targetAccounts = allAccounts.Where(a => targetAccIds.Contains(a.Id)).ToList();
                double openBal = 0;
                double closeBal = 0;

                foreach (var a in targetAccounts)
                {
                    var pDeb = prior.Where(x => x.AccountId == a.Id).Sum(x => x.Debit);
                    var pCred = prior.Where(x => x.AccountId == a.Id).Sum(x => x.Credit);
                    var curDeb = period.Where(x => x.AccountId == a.Id).Sum(x => x.Debit);
                    var curCred = period.Where(x => x.AccountId == a.Id).Sum(x => x.Credit);

                    if (a.NormalBalance == "DEBIT")
                    {
                        var o = a.OpeningBalance + (pDeb - pCred);
                        openBal += o;
                        closeBal += (o + (curDeb - curCred));
                    }
                    else
                    {
                        var o = a.OpeningBalance + (pCred - pDeb);
                        openBal += o;
                        closeBal += (o + (curCred - curDeb));
                    }
                }
                return (openBal, closeBal);
            }

            var arBal = await GetBalanceRange(new List<string> { "1100", "1110" });
            var invBal = await GetBalanceRange(new List<string> { "1200", "1210" });
            var apBal = await GetBalanceRange(new List<string> { "2010", "2025" });
            var advBal = await GetBalanceRange(new List<string> { "2020", "2080" });
            var taxBal = await GetBalanceRange(new List<string> { "2050", "2070" });

            var wcList = new List<IndirectWorkingCapitalItem>
            {
                new IndirectWorkingCapitalItem
                {
                    ItemKey = "WC_AR",
                    Title = "Change in Accounts Receivable & Guest Folios",
                    OpeningBalance = Math.Round(arBal.Open, 2),
                    ClosingBalance = Math.Round(arBal.Close, 2),
                    ChangeInBalance = Math.Round(arBal.Close - arBal.Open, 2),
                    CashFlowImpact = Math.Round(arBal.Open - arBal.Close, 2), // Increase in AR reduces cash
                    Explanation = arBal.Close >= arBal.Open ? "Increase in uncollected receivables deferred cash collection." : "Decrease in receivables represents cash collected from customers."
                },
                new IndirectWorkingCapitalItem
                {
                    ItemKey = "WC_INV",
                    Title = "Change in Food & Operating Inventory",
                    OpeningBalance = Math.Round(invBal.Open, 2),
                    ClosingBalance = Math.Round(invBal.Close, 2),
                    ChangeInBalance = Math.Round(invBal.Close - invBal.Open, 2),
                    CashFlowImpact = Math.Round(invBal.Open - invBal.Close, 2), // Increase in Inventory consumed cash
                    Explanation = invBal.Close >= invBal.Open ? "Stock buildup consumed cash resources." : "Inventory liquidation freed cash for operations."
                },
                new IndirectWorkingCapitalItem
                {
                    ItemKey = "WC_AP",
                    Title = "Change in Supplier & Operating Payables",
                    OpeningBalance = Math.Round(apBal.Open, 2),
                    ClosingBalance = Math.Round(apBal.Close, 2),
                    ChangeInBalance = Math.Round(apBal.Close - apBal.Open, 2),
                    CashFlowImpact = Math.Round(apBal.Close - apBal.Open, 2), // Increase in AP conserved cash
                    Explanation = apBal.Close >= apBal.Open ? "Unpaid vendor bills conserved cash." : "Settling supplier invoices required cash outflow."
                },
                new IndirectWorkingCapitalItem
                {
                    ItemKey = "WC_ADV",
                    Title = "Change in Customer Advance Deposits",
                    OpeningBalance = Math.Round(advBal.Open, 2),
                    ClosingBalance = Math.Round(advBal.Close, 2),
                    ChangeInBalance = Math.Round(advBal.Close - advBal.Open, 2),
                    CashFlowImpact = Math.Round(advBal.Close - advBal.Open, 2), // Increase in advances brings cash upfront
                    Explanation = "Customer advance deposits received for future banquets and guest reservations."
                },
                new IndirectWorkingCapitalItem
                {
                    ItemKey = "WC_TAX",
                    Title = "Change in Statutory Tax Obligations (VAT & TDS)",
                    OpeningBalance = Math.Round(taxBal.Open, 2),
                    ClosingBalance = Math.Round(taxBal.Close, 2),
                    ChangeInBalance = Math.Round(taxBal.Close - taxBal.Open, 2),
                    CashFlowImpact = Math.Round(taxBal.Close - taxBal.Open, 2),
                    Explanation = "Tax collections pending government deposit."
                }
            };

            var totWcImpact = wcList.Sum(w => w.CashFlowImpact);
            var totNonCash = nonCashItems.Sum(n => n.CurrentAmount);
            var indirectOperatingCash = netProfit + totNonCash + totWcImpact;

            indirectSection = new IndirectMethodSection
            {
                NetProfitOrLoss = Math.Round(netProfit, 2),
                NonCashAdjustments = nonCashItems,
                TotalNonCashAdjustments = Math.Round(totNonCash, 2),
                WorkingCapitalAdjustments = wcList,
                TotalWorkingCapitalAdjustments = Math.Round(totWcImpact, 2),
                NetOperatingCashFlow = Math.Round(indirectOperatingCash, 2)
            };
        }

        // 4. Monthly Trends (last 6 months up to end date)
        var monthlyTrends = new List<MonthlyCashFlowTrendItem>();
        for (int m = 5; m >= 0; m--)
        {
            var targetMonth = end.AddMonths(-m);
            var mStart = new DateTime(targetMonth.Year, targetMonth.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var mEnd = new DateTime(targetMonth.Year, targetMonth.Month, DateTime.DaysInMonth(targetMonth.Year, targetMonth.Month), 23, 59, 59, 999, DateTimeKind.Utc);

            var mEntries = await _db.JournalEntries
                .Where(je => (je.Status == "POSTED" || je.Status == "REVERSED") && je.EntryDate >= mStart && je.EntryDate <= mEnd)
                .Include(je => je.Lines)
                .ToListAsync();

            var (mIn, mOut, _) = ProcessCashFlow(mEntries);

            var mTotIn = mIn.Sum(x => x.Value.Item.CurrentAmount);
            var mTotOut = mOut.Sum(x => x.Value.Item.CurrentAmount);
            var mOp = mIn.Where(x => x.Value.Item.Category == "OPERATING").Sum(x => x.Value.Item.CurrentAmount) -
                      mOut.Where(x => x.Value.Item.Category == "OPERATING").Sum(x => x.Value.Item.CurrentAmount);
            var mInv = mIn.Where(x => x.Value.Item.Category == "INVESTING").Sum(x => x.Value.Item.CurrentAmount) -
                       mOut.Where(x => x.Value.Item.Category == "INVESTING").Sum(x => x.Value.Item.CurrentAmount);
            var mFin = mIn.Where(x => x.Value.Item.Category == "FINANCING").Sum(x => x.Value.Item.CurrentAmount) -
                       mOut.Where(x => x.Value.Item.Category == "FINANCING").Sum(x => x.Value.Item.CurrentAmount);

            monthlyTrends.Add(new MonthlyCashFlowTrendItem
            {
                MonthKey = targetMonth.ToString("yyyy-MM"),
                MonthLabel = targetMonth.ToString("MMM yyyy"),
                TotalInflow = Math.Round(mTotIn, 2),
                TotalOutflow = Math.Round(mTotOut, 2),
                NetChange = Math.Round(mTotIn - mTotOut, 2),
                OperatingCashFlow = Math.Round(mOp, 2),
                InvestingCashFlow = Math.Round(mInv, 2),
                FinancingCashFlow = Math.Round(mFin, 2)
            });
        }

        var response = new CashFlowStatementResponse
        {
            StartDate = start.ToString("yyyy-MM-dd"),
            EndDate = end.ToString("yyyy-MM-dd"),
            FormattedPeriod = $"{start:dd MMM yyyy} - {end:dd MMM yyyy}",
            CompareStartDate = compStart.HasValue ? compStart.Value.ToString("yyyy-MM-dd") : null,
            CompareEndDate = compEnd.HasValue ? compEnd.Value.ToString("yyyy-MM-dd") : null,
            FormattedComparePeriod = compStart.HasValue && compEnd.HasValue ? $"{compStart.Value:dd MMM yyyy} - {compEnd.Value:dd MMM yyyy}" : null,
            ComparisonMode = mode,
            PresentationMethod = (method ?? "DIRECT").ToUpperInvariant(),
            Summary = summaryCards,
            CashAccounts = cashAccountSummaries,
            OperatingActivities = operatingSection,
            InvestingActivities = investingSection,
            FinancingActivities = financingSection,
            IndirectMethod = indirectSection,
            MonthlyTrends = monthlyTrends
        };

        return Ok(ApiResponse.Ok(response, "Cash Flow Statement generated successfully."));
    }

    #endregion

    #region 2. Category Drilldown Endpoint

    [HttpGet("drilldown")]
    public async Task<IActionResult> GetCategoryDrilldown(
        [FromQuery] string itemKey,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] string? activityType)
    {
        var now = DateTime.UtcNow;
        var start = startDate.HasValue ? DateTime.SpecifyKind(startDate.Value.Date, DateTimeKind.Utc) : new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var end = endDate.HasValue ? DateTime.SpecifyKind(endDate.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc) : new DateTime(now.Year, now.Month, DateTime.DaysInMonth(now.Year, now.Month), 23, 59, 59, 999, DateTimeKind.Utc);

        var allAccounts = await _db.Accounts.Where(a => !a.IsGroup && a.IsActive).ToListAsync();
        var accountsById = allAccounts.ToDictionary(a => a.Id, a => a);
        var cashAccounts = allAccounts.Where(IsCashEquivalent).ToList();
        var cashAccountIds = cashAccounts.Select(a => a.Id).ToHashSet();

        var entries = await _db.JournalEntries
            .Where(je => (je.Status == "POSTED" || je.Status == "REVERSED") && je.EntryDate >= start && je.EntryDate <= end)
            .Include(je => je.Lines)
            .OrderBy(je => je.EntryDate)
            .ToListAsync();

        var matchedTxs = new List<CashFlowDrilldownTransaction>();
        string title = itemKey;
        string activity = activityType ?? "OPERATING";
        bool isInflowCat = false;

        foreach (var je in entries)
        {
            var lines = je.Lines;
            var cashInLines = lines.Where(l => cashAccountIds.Contains(l.AccountId)).ToList();
            if (cashInLines.Count == 0) continue;

            var nonCashLines = lines.Where(l => !cashAccountIds.Contains(l.AccountId)).ToList();
            if (nonCashLines.Count == 0) continue; // Skip internal transfer

            foreach (var cl in cashInLines)
            {
                bool isCashDebit = cl.Debit > 0;
                double cashAmount = isCashDebit ? cl.Debit : cl.Credit;
                if (cashAmount <= 0) continue;

                var contraLine = nonCashLines.OrderByDescending(n => isCashDebit ? n.Credit : n.Debit).FirstOrDefault()
                                 ?? nonCashLines.First();

                if (!accountsById.TryGetValue(contraLine.AccountId, out var contraAcc))
                {
                    contraAcc = new Account { AccountCode = contraLine.AccountCode, AccountName = contraLine.AccountName, AccountType = "EXPENSE" };
                }

                accountsById.TryGetValue(cl.AccountId, out var caAcc);

                var (act, key, catTitle, isInflow) = ClassifyCashLeg(isCashDebit, contraAcc, je, contraLine);

                if (key.Equals(itemKey, StringComparison.OrdinalIgnoreCase))
                {
                    title = catTitle;
                    activity = act;
                    isInflowCat = isInflow;

                    matchedTxs.Add(new CashFlowDrilldownTransaction
                    {
                        Id = cl.Id,
                        JournalEntryId = je.Id,
                        EntryNumber = je.EntryNumber,
                        EntryDate = je.EntryDate,
                        Description = string.IsNullOrWhiteSpace(cl.LineDescription) ? je.Description : cl.LineDescription,
                        Reference = je.Reference,
                        SourceModule = je.SourceModule,
                        CashAccountCode = caAcc?.AccountCode ?? cl.AccountCode,
                        CashAccountName = caAcc?.AccountName ?? cl.AccountName,
                        ContraAccountCode = contraAcc.AccountCode,
                        ContraAccountName = contraAcc.AccountName,
                        IsInflow = isInflow,
                        Amount = Math.Round(cashAmount, 2)
                    });
                }
            }
        }

        var total = matchedTxs.Sum(t => t.Amount);

        var result = new CashFlowDrilldownResponse
        {
            ItemKey = itemKey,
            Title = title,
            ActivityType = activity,
            Category = isInflowCat ? "INFLOW" : "OUTFLOW",
            TotalAmount = Math.Round(total, 2),
            TransactionCount = matchedTxs.Count,
            FormattedPeriod = $"{start:dd MMM yyyy} - {end:dd MMM yyyy}",
            Transactions = matchedTxs
        };

        return Ok(ApiResponse.Ok(result, "Transactions retrieved successfully."));
    }

    #endregion
}

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/balance-sheet")]
public class BalanceSheetController : ControllerBase
{
    private readonly HospitalityDbContext _db;
    private readonly ILogger<BalanceSheetController> _logger;

    public BalanceSheetController(HospitalityDbContext db, ILogger<BalanceSheetController> logger)
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
            var existingCodes = await _db.Accounts.Select(a => a.AccountCode).ToListAsync();
            var toAdd = new List<Account>();

            void Ensure(string code, string name, string type, string subCategory, string normalBal, double openingBal, string desc)
            {
                if (!existingCodes.Contains(code))
                {
                    toAdd.Add(new Account
                    {
                        HotelId = hotelId,
                        AccountCode = code,
                        AccountName = name,
                        AccountType = type,
                        SubCategory = subCategory,
                        NormalBalance = normalBal,
                        OpeningBalance = openingBal,
                        CurrentBalance = openingBal,
                        Description = desc
                    });
                }
            }

            // Ensure equity and asset accounts
            Ensure("1400", "Prepaid Expenses & Advances", "ASSET", "Prepaid Expenses", "DEBIT", 0, "Prepaid insurance, advance rent and prepayments");
            Ensure("3015", "Additional Paid-in Capital", "EQUITY", "Owner's Equity", "CREDIT", 0, "Subsequent partner and owner equity injections");
            Ensure("3030", "Owner's Drawings & Withdrawals", "EQUITY", "Drawings", "DEBIT", 0, "Owner personal withdrawals and profit drawings");

            if (toAdd.Count > 0)
            {
                _db.Accounts.AddRange(toAdd);
                await _db.SaveChangesAsync();
            }
        }
    }

    #region Data Transfer Models

    public class BalanceSheetLineItem
    {
        public string AccountId { get; set; } = string.Empty;
        public string AccountCode { get; set; } = string.Empty;
        public string AccountName { get; set; } = string.Empty;
        public string SubCategory { get; set; } = string.Empty;
        public double CurrentBalance { get; set; }
        public double CompareBalance { get; set; }
        public double Variance { get; set; }
        public double VariancePercentage { get; set; }
        public bool IsContra { get; set; }
    }

    public class BalanceSheetSubGroup
    {
        public string GroupKey { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public List<BalanceSheetLineItem> Items { get; set; } = new();
        public double CurrentTotal { get; set; }
        public double CompareTotal { get; set; }
        public double Variance { get; set; }
        public double VariancePercentage { get; set; }
    }

    public class AssetsSection
    {
        public string Title { get; set; } = "Assets";
        public List<BalanceSheetSubGroup> CurrentAssetGroups { get; set; } = new();
        public double TotalCurrentAssets { get; set; }
        public double CompareTotalCurrentAssets { get; set; }

        public List<BalanceSheetLineItem> FixedAssetsCostItems { get; set; } = new();
        public double TotalFixedAssetsCost { get; set; }
        public double CompareTotalFixedAssetsCost { get; set; }

        public List<BalanceSheetLineItem> AccumulatedDepreciationItems { get; set; } = new();
        public double TotalAccumulatedDepreciation { get; set; } // Presented as positive deduction
        public double CompareTotalAccumulatedDepreciation { get; set; }

        public double NetFixedAssets { get; set; }
        public double CompareNetFixedAssets { get; set; }

        public double TotalAssets { get; set; }
        public double CompareTotalAssets { get; set; }
        public double Variance { get; set; }
        public double VariancePercentage { get; set; }
    }

    public class LiabilitiesSection
    {
        public string Title { get; set; } = "Liabilities";
        public List<BalanceSheetSubGroup> CurrentLiabilityGroups { get; set; } = new();
        public double TotalCurrentLiabilities { get; set; }
        public double CompareTotalCurrentLiabilities { get; set; }

        public List<BalanceSheetSubGroup> NonCurrentLiabilityGroups { get; set; } = new();
        public double TotalNonCurrentLiabilities { get; set; }
        public double CompareTotalNonCurrentLiabilities { get; set; }

        public double TotalLiabilities { get; set; }
        public double CompareTotalLiabilities { get; set; }
        public double Variance { get; set; }
        public double VariancePercentage { get; set; }
    }

    public class EquitySection
    {
        public string Title { get; set; } = "Owner's Equity";
        public List<BalanceSheetLineItem> Items { get; set; } = new();
        public double TotalEquity { get; set; }
        public double CompareTotalEquity { get; set; }
        public double Variance { get; set; }
        public double VariancePercentage { get; set; }
    }

    public class BalanceSheetSummaryCards
    {
        public double TotalAssets { get; set; }
        public double TotalLiabilities { get; set; }
        public double TotalEquity { get; set; }
        public double TotalLiabilitiesAndEquity { get; set; }
        public double BalanceDifference { get; set; }
        public bool IsBalanced { get; set; }

        public double CompareTotalAssets { get; set; }
        public double CompareTotalLiabilities { get; set; }
        public double CompareTotalEquity { get; set; }
        public double CompareTotalLiabilitiesAndEquity { get; set; }
        public double CompareBalanceDifference { get; set; }

        public double VarianceAssets { get; set; }
        public double VariancePercentageAssets { get; set; }
        public double VarianceLiabilities { get; set; }
        public double VariancePercentageLiabilities { get; set; }
        public double VarianceEquity { get; set; }
        public double VariancePercentageEquity { get; set; }
    }

    public class BalanceSheetStatementResponse
    {
        public string AsOfDate { get; set; } = string.Empty;
        public string? CompareAsOfDate { get; set; }
        public string FormattedAsOfDate { get; set; } = string.Empty;
        public string? FormattedCompareAsOfDate { get; set; }
        public string ComparisonMode { get; set; } = "NONE";
        public string ViewMode { get; set; } = "DETAILED";
        public BalanceSheetSummaryCards Summary { get; set; } = new();
        public AssetsSection Assets { get; set; } = new();
        public LiabilitiesSection Liabilities { get; set; } = new();
        public EquitySection Equity { get; set; } = new();
    }

    public class AccountDrilldownItem
    {
        public string Id { get; set; } = string.Empty;
        public string JournalEntryId { get; set; } = string.Empty;
        public string EntryNumber { get; set; } = string.Empty;
        public DateTime EntryDate { get; set; }
        public string EntryType { get; set; } = string.Empty;
        public string? Reference { get; set; }
        public string Narration { get; set; } = string.Empty;
        public double Debit { get; set; }
        public double Credit { get; set; }
        public double RunningBalance { get; set; }
        public string SourceModule { get; set; } = string.Empty;
    }

    public class AccountDrilldownResponse
    {
        public string AccountId { get; set; } = string.Empty;
        public string AccountCode { get; set; } = string.Empty;
        public string AccountName { get; set; } = string.Empty;
        public string AccountType { get; set; } = string.Empty;
        public string SubCategory { get; set; } = string.Empty;
        public string NormalBalance { get; set; } = string.Empty;
        public double OpeningBalance { get; set; }
        public double TotalDebits { get; set; }
        public double TotalCredits { get; set; }
        public double ClosingBalance { get; set; }
        public string AsOfDate { get; set; } = string.Empty;
        public List<AccountDrilldownItem> Transactions { get; set; } = new();
    }

    public class DiscrepancyDiagnosticResponse
    {
        public DateTime AsOfDate { get; set; }
        public double BalanceDifference { get; set; }
        public bool IsBalanced { get; set; }
        public double OpeningDebitsSum { get; set; }
        public double OpeningCreditsSum { get; set; }
        public double OpeningDiscrepancy { get; set; }
        public int ImbalancedJournalEntriesCount { get; set; }
        public List<string> ImbalancedEntryNumbers { get; set; } = new();
        public int UnpostedDraftsCount { get; set; }
        public double TotalAssets { get; set; }
        public double TotalLiabilities { get; set; }
        public double TotalEquity { get; set; }
        public double CumulativeNetProfit { get; set; }
        public List<string> AuditFindings { get; set; } = new();
        public List<string> Recommendations { get; set; } = new();
    }

    #endregion

    #region 1. Main Balance Sheet Statement

    [HttpGet("statement")]
    public async Task<IActionResult> GetStatement(
        [FromQuery] DateTime? asOfDate,
        [FromQuery] string? comparisonMode = "NONE",
        [FromQuery] DateTime? compareAsOfDate = null,
        [FromQuery] string? viewMode = "DETAILED")
    {
        var hotelId = await GetCurrentHotelIdAsync();
        await EnsureStandardAccountsAsync(hotelId);

        var now = DateTime.UtcNow;
        var primaryDate = asOfDate.HasValue ? asOfDate.Value.Date : now.Date;
        var asOfUtc = DateTime.SpecifyKind(primaryDate.AddDays(1).AddTicks(-1), DateTimeKind.Utc);

        var mode = (comparisonMode ?? "NONE").ToUpperInvariant();
        DateTime? compareUtc = null;

        if (mode == "PREVIOUS_MONTH_END")
        {
            var firstOfCurrent = new DateTime(primaryDate.Year, primaryDate.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            compareUtc = firstOfCurrent.AddTicks(-1);
        }
        else if (mode == "PREVIOUS_YEAR_END")
        {
            compareUtc = new DateTime(primaryDate.Year - 1, 12, 31, 23, 59, 59, 999, DateTimeKind.Utc);
        }
        else if (mode == "CUSTOM" && compareAsOfDate.HasValue)
        {
            compareUtc = DateTime.SpecifyKind(compareAsOfDate.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
        }

        var hasComparison = compareUtc.HasValue;

        // Fetch leaf active accounts
        var accounts = await _db.Accounts
            .Where(a => !a.IsGroup && a.IsActive)
            .OrderBy(a => a.AccountCode)
            .ToListAsync();

        var accountIds = accounts.Select(a => a.Id).ToList();

        // 1. Fetch posted transactions up to asOfUtc
        var currentLines = await _db.JournalEntryLines
            .Where(l => accountIds.Contains(l.AccountId) &&
                        l.JournalEntry != null &&
                        (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED") &&
                        l.JournalEntry.EntryDate <= asOfUtc)
            .Select(l => new { l.AccountId, l.Debit, l.Credit })
            .ToListAsync();

        var currentGrouped = currentLines
            .GroupBy(l => l.AccountId)
            .ToDictionary(
                g => g.Key,
                g => new { TotalDebit = g.Sum(x => x.Debit), TotalCredit = g.Sum(x => x.Credit) }
            );

        // 2. Fetch posted transactions up to compareUtc if comparison is requested
        Dictionary<string, (double TotalDebit, double TotalCredit)> compareGrouped = new();
        if (hasComparison)
        {
            var compLines = await _db.JournalEntryLines
                .Where(l => accountIds.Contains(l.AccountId) &&
                            l.JournalEntry != null &&
                            (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED") &&
                            l.JournalEntry.EntryDate <= compareUtc!.Value)
                .Select(l => new { l.AccountId, l.Debit, l.Credit })
                .ToListAsync();

            compareGrouped = compLines
                .GroupBy(l => l.AccountId)
                .ToDictionary(
                    g => g.Key,
                    g => (TotalDebit: g.Sum(x => x.Debit), TotalCredit: g.Sum(x => x.Credit))
                );
        }

        // Helper function to calculate point-in-time balance for an account
        double CalculateAccountBalance(Account acc, double debitSum, double creditSum)
        {
            if (acc.AccountType == "ASSET")
            {
                if (acc.NormalBalance == "CREDIT" ||
                    acc.AccountCode.StartsWith("16") ||
                    (acc.SubCategory != null && acc.SubCategory.Contains("Accumulated Depreciation", StringComparison.OrdinalIgnoreCase)))
                {
                    // Contra asset (Accumulated Depreciation)
                    return acc.OpeningBalance + (creditSum - debitSum);
                }
                return acc.OpeningBalance + (debitSum - creditSum);
            }
            if (acc.AccountType == "LIABILITY")
            {
                return acc.OpeningBalance + (creditSum - debitSum);
            }
            if (acc.AccountType == "EQUITY")
            {
                if (acc.NormalBalance == "DEBIT" ||
                    (acc.SubCategory != null && acc.SubCategory.Contains("Drawings", StringComparison.OrdinalIgnoreCase)) ||
                    acc.AccountCode == "3030")
                {
                    // Owner drawings (Debit normal balance reduces equity)
                    return acc.OpeningBalance + (debitSum - creditSum);
                }
                return acc.OpeningBalance + (creditSum - debitSum);
            }
            if (acc.AccountType == "REVENUE" || acc.AccountType == "INCOME")
            {
                return acc.OpeningBalance + (creditSum - debitSum);
            }
            if (acc.AccountType == "EXPENSE")
            {
                return acc.OpeningBalance + (debitSum - creditSum);
            }
            return 0.0;
        }

        // Calculate balances for all accounts
        var accBalanceMap = new Dictionary<string, (double Current, double Compare)>();
        double currentTotalRevenue = 0;
        double currentTotalExpense = 0;
        double compareTotalRevenue = 0;
        double compareTotalExpense = 0;

        foreach (var acc in accounts)
        {
            currentGrouped.TryGetValue(acc.Id, out var cur);
            var curDeb = cur?.TotalDebit ?? 0.0;
            var curCred = cur?.TotalCredit ?? 0.0;
            var curBal = CalculateAccountBalance(acc, curDeb, curCred);

            double compBal = 0.0;
            if (hasComparison)
            {
                compareGrouped.TryGetValue(acc.Id, out var comp);
                var compDeb = comp.TotalDebit;
                var compCred = comp.TotalCredit;
                compBal = CalculateAccountBalance(acc, compDeb, compCred);
            }

            accBalanceMap[acc.Id] = (curBal, compBal);

            if (acc.AccountType == "REVENUE" || acc.AccountType == "INCOME")
            {
                currentTotalRevenue += curBal;
                compareTotalRevenue += compBal;
            }
            else if (acc.AccountType == "EXPENSE")
            {
                currentTotalExpense += curBal;
                compareTotalExpense += compBal;
            }
        }

        // Current period net profit (P&L) up to asOfUtc
        var currentNetProfit = currentTotalRevenue - currentTotalExpense;
        var compareNetProfit = compareTotalRevenue - compareTotalExpense;

        // Build LineItem helper
        BalanceSheetLineItem MakeLineItem(Account acc, bool isContra = false)
        {
            var (cur, comp) = accBalanceMap[acc.Id];
            var variance = cur - comp;
            var variancePct = comp != 0 ? (variance / Math.Abs(comp)) * 100 : (cur != 0 ? 100 : 0);

            return new BalanceSheetLineItem
            {
                AccountId = acc.Id,
                AccountCode = acc.AccountCode,
                AccountName = acc.AccountName,
                SubCategory = acc.SubCategory ?? "General",
                CurrentBalance = Math.Round(cur, 2),
                CompareBalance = Math.Round(comp, 2),
                Variance = Math.Round(variance, 2),
                VariancePercentage = Math.Round(variancePct, 1),
                IsContra = isContra
            };
        }

        // ------------------ A. ASSETS SECTION ------------------
        var assetAccounts = accounts.Where(a => a.AccountType == "ASSET").ToList();

        // 1. Current Assets (1000 - 1499)
        var currentAssetAccounts = assetAccounts
            .Where(a => !a.AccountCode.StartsWith("15") && !a.AccountCode.StartsWith("16"))
            .ToList();

        // Classify into standard subgroups
        var caGroupsDict = new Dictionary<string, (string Title, List<Account> List)>
        {
            ["CASH"] = ("Cash in Hand & Safe", new List<Account>()),
            ["BANK"] = ("Bank Operating Accounts", new List<Account>()),
            ["WALLET"] = ("Digital Wallet Balances", new List<Account>()),
            ["RECEIVABLE"] = ("Accounts Receivable & Guest Folios", new List<Account>()),
            ["INVENTORY"] = ("Inventory & Operating Stock", new List<Account>()),
            ["PREPAID"] = ("Prepaid Expenses & Advances", new List<Account>()),
            ["OTHER_CA"] = ("Other Current Assets", new List<Account>())
        };

        foreach (var acc in currentAssetAccounts)
        {
            var code = acc.AccountCode;
            var sub = (acc.SubCategory ?? string.Empty).ToLowerInvariant();

            if (code.StartsWith("107") || sub.Contains("wallet"))
                caGroupsDict["WALLET"].List.Add(acc);
            else if (code.StartsWith("105") || sub.Contains("bank"))
                caGroupsDict["BANK"].List.Add(acc);
            else if (code.StartsWith("10") || sub.Contains("cash"))
                caGroupsDict["CASH"].List.Add(acc);
            else if (code.StartsWith("11") || sub.Contains("receivable"))
                caGroupsDict["RECEIVABLE"].List.Add(acc);
            else if (code.StartsWith("12") || sub.Contains("inventory") || sub.Contains("stock"))
                caGroupsDict["INVENTORY"].List.Add(acc);
            else if (code.StartsWith("14") || sub.Contains("prepaid") || sub.Contains("advance"))
                caGroupsDict["PREPAID"].List.Add(acc);
            else
                caGroupsDict["OTHER_CA"].List.Add(acc);
        }

        var caSubGroups = new List<BalanceSheetSubGroup>();
        double sumCurrentAssets = 0;
        double sumCompareCurrentAssets = 0;

        foreach (var kvp in caGroupsDict)
        {
            if (kvp.Value.List.Count == 0) continue;

            var items = kvp.Value.List.Select(a => MakeLineItem(a)).ToList();
            var gCur = items.Sum(i => i.CurrentBalance);
            var gComp = items.Sum(i => i.CompareBalance);
            var gVar = gCur - gComp;
            var gVarPct = gComp != 0 ? (gVar / Math.Abs(gComp)) * 100 : (gCur != 0 ? 100 : 0);

            sumCurrentAssets += gCur;
            sumCompareCurrentAssets += gComp;

            caSubGroups.Add(new BalanceSheetSubGroup
            {
                GroupKey = kvp.Key,
                Title = kvp.Value.Title,
                Items = items,
                CurrentTotal = Math.Round(gCur, 2),
                CompareTotal = Math.Round(gComp, 2),
                Variance = Math.Round(gVar, 2),
                VariancePercentage = Math.Round(gVarPct, 1)
            });
        }

        // 2. Non-Current Assets (Fixed Assets 1500-1599, and Contra Depreciation 1600-1699)
        var fixedAssetCostAccounts = assetAccounts
            .Where(a => a.AccountCode.StartsWith("15"))
            .ToList();

        var accDeprecAccounts = assetAccounts
            .Where(a => a.AccountCode.StartsWith("16") ||
                        (a.SubCategory != null && a.SubCategory.Contains("Accumulated Depreciation", StringComparison.OrdinalIgnoreCase)) ||
                        a.NormalBalance == "CREDIT")
            .ToList();

        var faCostItems = fixedAssetCostAccounts.Select(a => MakeLineItem(a)).ToList();
        var totalFaCost = faCostItems.Sum(i => i.CurrentBalance);
        var compTotalFaCost = faCostItems.Sum(i => i.CompareBalance);

        var accDeprecItems = accDeprecAccounts.Select(a => MakeLineItem(a, isContra: true)).ToList();
        var totalAccDeprec = accDeprecItems.Sum(i => i.CurrentBalance); // Positive deduction
        var compTotalAccDeprec = accDeprecItems.Sum(i => i.CompareBalance);

        var netFixedAssets = totalFaCost - totalAccDeprec;
        var compNetFixedAssets = compTotalFaCost - compTotalAccDeprec;

        var totalAssets = sumCurrentAssets + netFixedAssets;
        var compTotalAssets = sumCompareCurrentAssets + compNetFixedAssets;
        var totalAssetsVar = totalAssets - compTotalAssets;
        var totalAssetsVarPct = compTotalAssets != 0 ? (totalAssetsVar / Math.Abs(compTotalAssets)) * 100 : (totalAssets != 0 ? 100 : 0);

        var assetsSection = new AssetsSection
        {
            Title = "Assets",
            CurrentAssetGroups = caSubGroups,
            TotalCurrentAssets = Math.Round(sumCurrentAssets, 2),
            CompareTotalCurrentAssets = Math.Round(sumCompareCurrentAssets, 2),
            FixedAssetsCostItems = faCostItems,
            TotalFixedAssetsCost = Math.Round(totalFaCost, 2),
            CompareTotalFixedAssetsCost = Math.Round(compTotalFaCost, 2),
            AccumulatedDepreciationItems = accDeprecItems,
            TotalAccumulatedDepreciation = Math.Round(totalAccDeprec, 2),
            CompareTotalAccumulatedDepreciation = Math.Round(compTotalAccDeprec, 2),
            NetFixedAssets = Math.Round(netFixedAssets, 2),
            CompareNetFixedAssets = Math.Round(compNetFixedAssets, 2),
            TotalAssets = Math.Round(totalAssets, 2),
            CompareTotalAssets = Math.Round(compTotalAssets, 2),
            Variance = Math.Round(totalAssetsVar, 2),
            VariancePercentage = Math.Round(totalAssetsVarPct, 1)
        };

        // ------------------ B. LIABILITIES SECTION ------------------
        var liabilityAccounts = accounts.Where(a => a.AccountType == "LIABILITY").ToList();

        // 1. Current Liabilities (< 2500)
        var curLiabAccounts = liabilityAccounts.Where(a =>
        {
            if (int.TryParse(a.AccountCode, out int c))
                return c < 2500;
            return !(a.SubCategory ?? "").Contains("Long-Term", StringComparison.OrdinalIgnoreCase);
        }).ToList();

        // 2. Non-Current Liabilities (>= 2500)
        var nonCurLiabAccounts = liabilityAccounts.Where(a =>
        {
            if (int.TryParse(a.AccountCode, out int c))
                return c >= 2500;
            return (a.SubCategory ?? "").Contains("Long-Term", StringComparison.OrdinalIgnoreCase);
        }).ToList();

        // Subgroups for Current Liabilities
        var clGroupsDict = new Dictionary<string, (string Title, List<Account> List)>
        {
            ["SUPPLIER"] = ("Accounts Payable - Suppliers & Vendors", new List<Account>()),
            ["EXPENSE_PAY"] = ("Accrued Expenses & Operating Payables", new List<Account>()),
            ["ADVANCE"] = ("Customer & Guest Advance Deposits", new List<Account>()),
            ["TAX"] = ("Tax Obligations (VAT & TDS)", new List<Account>()),
            ["PAYROLL"] = ("Staff Salaries & Service Charge Payable", new List<Account>()),
            ["SHORT_LOAN"] = ("Short-Term Borrowings & Overdraft", new List<Account>()),
            ["OTHER_CL"] = ("Other Current Accrued Liabilities", new List<Account>())
        };

        foreach (var acc in curLiabAccounts)
        {
            var code = acc.AccountCode;
            var sub = (acc.SubCategory ?? "").ToLowerInvariant();

            if (code == "2010" || sub.Contains("supplier") || sub.Contains("vendor"))
                clGroupsDict["SUPPLIER"].List.Add(acc);
            else if (code == "2025" || sub.Contains("expense"))
                clGroupsDict["EXPENSE_PAY"].List.Add(acc);
            else if (code == "2020" || code == "2080" || sub.Contains("advance") || sub.Contains("deposit"))
                clGroupsDict["ADVANCE"].List.Add(acc);
            else if (code == "2050" || code == "2070" || sub.Contains("tax") || sub.Contains("vat") || sub.Contains("tds"))
                clGroupsDict["TAX"].List.Add(acc);
            else if (code == "2060" || code == "2100" || sub.Contains("payroll") || sub.Contains("salaries") || sub.Contains("service charge"))
                clGroupsDict["PAYROLL"].List.Add(acc);
            else if (code == "2110" || sub.Contains("borrowing") || sub.Contains("overdraft"))
                clGroupsDict["SHORT_LOAN"].List.Add(acc);
            else
                clGroupsDict["OTHER_CL"].List.Add(acc);
        }

        var clSubGroups = new List<BalanceSheetSubGroup>();
        double sumCurrentLiabilities = 0;
        double sumCompareCurrentLiabilities = 0;

        foreach (var kvp in clGroupsDict)
        {
            if (kvp.Value.List.Count == 0) continue;

            var items = kvp.Value.List.Select(a => MakeLineItem(a)).ToList();
            var gCur = items.Sum(i => i.CurrentBalance);
            var gComp = items.Sum(i => i.CompareBalance);
            var gVar = gCur - gComp;
            var gVarPct = gComp != 0 ? (gVar / Math.Abs(gComp)) * 100 : (gCur != 0 ? 100 : 0);

            sumCurrentLiabilities += gCur;
            sumCompareCurrentLiabilities += gComp;

            clSubGroups.Add(new BalanceSheetSubGroup
            {
                GroupKey = kvp.Key,
                Title = kvp.Value.Title,
                Items = items,
                CurrentTotal = Math.Round(gCur, 2),
                CompareTotal = Math.Round(gComp, 2),
                Variance = Math.Round(gVar, 2),
                VariancePercentage = Math.Round(gVarPct, 1)
            });
        }

        // Subgroups for Non-Current Liabilities
        var nclGroupsDict = new Dictionary<string, (string Title, List<Account> List)>
        {
            ["TERM_LOAN"] = ("Long-Term Commercial Bank Loans", new List<Account>()),
            ["EQUIP_FIN"] = ("Equipment Financing & Hire Purchase", new List<Account>()),
            ["DIRECTOR"] = ("Directors / Owners Long-Term Borrowings", new List<Account>()),
            ["OTHER_NCL"] = ("Other Long-Term Liabilities", new List<Account>())
        };

        foreach (var acc in nonCurLiabAccounts)
        {
            var code = acc.AccountCode;
            if (code == "2500") nclGroupsDict["TERM_LOAN"].List.Add(acc);
            else if (code == "2510") nclGroupsDict["EQUIP_FIN"].List.Add(acc);
            else if (code == "2590") nclGroupsDict["DIRECTOR"].List.Add(acc);
            else nclGroupsDict["OTHER_NCL"].List.Add(acc);
        }

        var nclSubGroups = new List<BalanceSheetSubGroup>();
        double sumNonCurrentLiabilities = 0;
        double sumCompareNonCurrentLiabilities = 0;

        foreach (var kvp in nclGroupsDict)
        {
            if (kvp.Value.List.Count == 0) continue;

            var items = kvp.Value.List.Select(a => MakeLineItem(a)).ToList();
            var gCur = items.Sum(i => i.CurrentBalance);
            var gComp = items.Sum(i => i.CompareBalance);
            var gVar = gCur - gComp;
            var gVarPct = gComp != 0 ? (gVar / Math.Abs(gComp)) * 100 : (gCur != 0 ? 100 : 0);

            sumNonCurrentLiabilities += gCur;
            sumCompareNonCurrentLiabilities += gComp;

            nclSubGroups.Add(new BalanceSheetSubGroup
            {
                GroupKey = kvp.Key,
                Title = kvp.Value.Title,
                Items = items,
                CurrentTotal = Math.Round(gCur, 2),
                CompareTotal = Math.Round(gComp, 2),
                Variance = Math.Round(gVar, 2),
                VariancePercentage = Math.Round(gVarPct, 1)
            });
        }

        var totalLiabilities = sumCurrentLiabilities + sumNonCurrentLiabilities;
        var compTotalLiabilities = sumCompareCurrentLiabilities + sumCompareNonCurrentLiabilities;
        var totalLiabilitiesVar = totalLiabilities - compTotalLiabilities;
        var totalLiabilitiesVarPct = compTotalLiabilities != 0 ? (totalLiabilitiesVar / Math.Abs(compTotalLiabilities)) * 100 : (totalLiabilities != 0 ? 100 : 0);

        var liabilitiesSection = new LiabilitiesSection
        {
            Title = "Liabilities",
            CurrentLiabilityGroups = clSubGroups,
            TotalCurrentLiabilities = Math.Round(sumCurrentLiabilities, 2),
            CompareTotalCurrentLiabilities = Math.Round(sumCompareCurrentLiabilities, 2),
            NonCurrentLiabilityGroups = nclSubGroups,
            TotalNonCurrentLiabilities = Math.Round(sumNonCurrentLiabilities, 2),
            CompareTotalNonCurrentLiabilities = Math.Round(sumCompareNonCurrentLiabilities, 2),
            TotalLiabilities = Math.Round(totalLiabilities, 2),
            CompareTotalLiabilities = Math.Round(compTotalLiabilities, 2),
            Variance = Math.Round(totalLiabilitiesVar, 2),
            VariancePercentage = Math.Round(totalLiabilitiesVarPct, 1)
        };

        // ------------------ C. EQUITY SECTION ------------------
        var equityAccounts = accounts.Where(a => a.AccountType == "EQUITY").ToList();
        var equityItems = new List<BalanceSheetLineItem>();
        double totalEquityAccounts = 0;
        double compTotalEquityAccounts = 0;

        foreach (var acc in equityAccounts)
        {
            var isDrawings = acc.NormalBalance == "DEBIT" ||
                             (acc.SubCategory != null && acc.SubCategory.Contains("Drawings", StringComparison.OrdinalIgnoreCase)) ||
                             acc.AccountCode == "3030";

            var item = MakeLineItem(acc, isContra: isDrawings);
            equityItems.Add(item);

            if (isDrawings)
            {
                totalEquityAccounts -= item.CurrentBalance;
                compTotalEquityAccounts -= item.CompareBalance;
            }
            else
            {
                totalEquityAccounts += item.CurrentBalance;
                compTotalEquityAccounts += item.CompareBalance;
            }
        }

        // Add Current Period Net Profit / (Loss) item
        var netProfitVariance = currentNetProfit - compareNetProfit;
        var netProfitVarPct = compareNetProfit != 0 ? (netProfitVariance / Math.Abs(compareNetProfit)) * 100 : (currentNetProfit != 0 ? 100 : 0);

        equityItems.Add(new BalanceSheetLineItem
        {
            AccountId = "pl-net-earnings",
            AccountCode = "P&L-NET",
            AccountName = currentNetProfit >= 0 ? "Current Period Net Profit" : "Current Period Net Loss",
            SubCategory = "Retained Earnings / Current Period",
            CurrentBalance = Math.Round(currentNetProfit, 2),
            CompareBalance = Math.Round(compareNetProfit, 2),
            Variance = Math.Round(netProfitVariance, 2),
            VariancePercentage = Math.Round(netProfitVarPct, 1),
            IsContra = currentNetProfit < 0
        });

        var totalEquity = totalEquityAccounts + currentNetProfit;
        var compTotalEquity = compTotalEquityAccounts + compareNetProfit;
        var totalEquityVar = totalEquity - compTotalEquity;
        var totalEquityVarPct = compTotalEquity != 0 ? (totalEquityVar / Math.Abs(compTotalEquity)) * 100 : (totalEquity != 0 ? 100 : 0);

        var equitySection = new EquitySection
        {
            Title = "Owner's Equity",
            Items = equityItems,
            TotalEquity = Math.Round(totalEquity, 2),
            CompareTotalEquity = Math.Round(compTotalEquity, 2),
            Variance = Math.Round(totalEquityVar, 2),
            VariancePercentage = Math.Round(totalEquityVarPct, 1)
        };

        // ------------------ BALANCE SHEET EQUATION CHECK ------------------
        var totalLiabAndEquity = totalLiabilities + totalEquity;
        var compTotalLiabAndEquity = compTotalLiabilities + compTotalEquity;
        var balanceDifference = totalAssets - totalLiabAndEquity;
        var compBalanceDifference = compTotalAssets - compTotalLiabAndEquity;
        var isBalanced = Math.Abs(balanceDifference) < 0.01;

        var summaryCards = new BalanceSheetSummaryCards
        {
            TotalAssets = Math.Round(totalAssets, 2),
            TotalLiabilities = Math.Round(totalLiabilities, 2),
            TotalEquity = Math.Round(totalEquity, 2),
            TotalLiabilitiesAndEquity = Math.Round(totalLiabAndEquity, 2),
            BalanceDifference = Math.Round(balanceDifference, 2),
            IsBalanced = isBalanced,

            CompareTotalAssets = Math.Round(compTotalAssets, 2),
            CompareTotalLiabilities = Math.Round(compTotalLiabilities, 2),
            CompareTotalEquity = Math.Round(compTotalEquity, 2),
            CompareTotalLiabilitiesAndEquity = Math.Round(compTotalLiabAndEquity, 2),
            CompareBalanceDifference = Math.Round(compBalanceDifference, 2),

            VarianceAssets = Math.Round(totalAssetsVar, 2),
            VariancePercentageAssets = Math.Round(totalAssetsVarPct, 1),
            VarianceLiabilities = Math.Round(totalLiabilitiesVar, 2),
            VariancePercentageLiabilities = Math.Round(totalLiabilitiesVarPct, 1),
            VarianceEquity = Math.Round(totalEquityVar, 2),
            VariancePercentageEquity = Math.Round(totalEquityVarPct, 1)
        };

        var response = new BalanceSheetStatementResponse
        {
            AsOfDate = primaryDate.ToString("yyyy-MM-dd"),
            CompareAsOfDate = compareUtc.HasValue ? compareUtc.Value.ToString("yyyy-MM-dd") : null,
            FormattedAsOfDate = primaryDate.ToString("dd MMMM yyyy"),
            FormattedCompareAsOfDate = compareUtc.HasValue ? compareUtc.Value.ToString("dd MMMM yyyy") : null,
            ComparisonMode = mode,
            ViewMode = (viewMode ?? "DETAILED").ToUpperInvariant(),
            Summary = summaryCards,
            Assets = assetsSection,
            Liabilities = liabilitiesSection,
            Equity = equitySection
        };

        return Ok(ApiResponse.Ok(response, "Balance Sheet generated successfully."));
    }

    #endregion

    #region 2. Account Drilldown

    [HttpGet("drilldown")]
    public async Task<IActionResult> GetAccountDrilldown(
        [FromQuery] string accountId,
        [FromQuery] DateTime? asOfDate)
    {
        var primaryDate = asOfDate.HasValue ? asOfDate.Value.Date : DateTime.UtcNow.Date;
        var asOfUtc = DateTime.SpecifyKind(primaryDate.AddDays(1).AddTicks(-1), DateTimeKind.Utc);

        // Special handling for the synthetic Current Period Net Profit line
        if (accountId == "pl-net-earnings" || accountId == "P&L-NET")
        {
            var pnlAccounts = await _db.Accounts
                .Where(a => !a.IsGroup && a.IsActive && (a.AccountType == "REVENUE" || a.AccountType == "INCOME" || a.AccountType == "EXPENSE"))
                .ToListAsync();

            var pnlAccountIds = pnlAccounts.Select(a => a.Id).ToList();

            var pnlLines = await _db.JournalEntryLines
                .Where(l => pnlAccountIds.Contains(l.AccountId) &&
                            l.JournalEntry != null &&
                            (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED") &&
                            l.JournalEntry.EntryDate <= asOfUtc)
                .Include(l => l.JournalEntry)
                .OrderBy(l => l.JournalEntry!.EntryDate)
                .Take(200)
                .ToListAsync();

            double runningBal = 0.0;
            var txList = new List<AccountDrilldownItem>();
            double totalDebits = 0;
            double totalCredits = 0;

            foreach (var l in pnlLines)
            {
                var je = l.JournalEntry;
                var acc = pnlAccounts.FirstOrDefault(a => a.Id == l.AccountId);
                var isRev = acc?.AccountType == "REVENUE" || acc?.AccountType == "INCOME";

                // For P&L Net: Revenue is positive, Expense is negative
                double effect = isRev ? (l.Credit - l.Debit) : (l.Debit - l.Credit) * -1;
                runningBal += effect;
                totalDebits += l.Debit;
                totalCredits += l.Credit;

                txList.Add(new AccountDrilldownItem
                {
                    Id = l.Id,
                    JournalEntryId = l.JournalEntryId,
                    EntryNumber = je?.EntryNumber ?? "JV-UNKNOWN",
                    EntryDate = je?.EntryDate ?? DateTime.UtcNow,
                    EntryType = je?.EntryType ?? "GENERAL",
                    Reference = je?.Reference,
                    Narration = $"[{acc?.AccountCode} - {acc?.AccountName}] {l.LineDescription ?? je?.Description}",
                    Debit = l.Debit,
                    Credit = l.Credit,
                    RunningBalance = Math.Round(runningBal, 2),
                    SourceModule = je?.SourceModule ?? "MANUAL"
                });
            }

            return Ok(ApiResponse.Ok(new AccountDrilldownResponse
            {
                AccountId = "pl-net-earnings",
                AccountCode = "P&L-NET",
                AccountName = "Current Period Net Profit / (Loss)",
                AccountType = "EQUITY",
                SubCategory = "Retained Earnings / Current Period",
                NormalBalance = "CREDIT",
                OpeningBalance = 0,
                TotalDebits = Math.Round(totalDebits, 2),
                TotalCredits = Math.Round(totalCredits, 2),
                ClosingBalance = Math.Round(runningBal, 2),
                AsOfDate = primaryDate.ToString("yyyy-MM-dd"),
                Transactions = txList
            }));
        }

        var account = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == accountId);
        if (account == null)
        {
            return NotFound(ApiResponse.Fail($"Account with ID '{accountId}' not found."));
        }

        var lines = await _db.JournalEntryLines
            .Where(l => l.AccountId == accountId &&
                        l.JournalEntry != null &&
                        (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED") &&
                        l.JournalEntry.EntryDate <= asOfUtc)
            .Include(l => l.JournalEntry)
            .OrderBy(l => l.JournalEntry!.EntryDate)
            .ToListAsync();

        double running = account.OpeningBalance;
        double sumDebits = 0;
        double sumCredits = 0;
        var transactions = new List<AccountDrilldownItem>();

        foreach (var l in lines)
        {
            var je = l.JournalEntry;
            sumDebits += l.Debit;
            sumCredits += l.Credit;

            if (account.NormalBalance == "DEBIT")
            {
                running += (l.Debit - l.Credit);
            }
            else
            {
                running += (l.Credit - l.Debit);
            }

            transactions.Add(new AccountDrilldownItem
            {
                Id = l.Id,
                JournalEntryId = l.JournalEntryId,
                EntryNumber = je?.EntryNumber ?? "JV-UNKNOWN",
                EntryDate = je?.EntryDate ?? DateTime.UtcNow,
                EntryType = je?.EntryType ?? "GENERAL",
                Reference = je?.Reference,
                Narration = string.IsNullOrWhiteSpace(l.LineDescription) ? (je?.Description ?? "") : l.LineDescription,
                Debit = l.Debit,
                Credit = l.Credit,
                RunningBalance = Math.Round(running, 2),
                SourceModule = je?.SourceModule ?? "MANUAL"
            });
        }

        var result = new AccountDrilldownResponse
        {
            AccountId = account.Id,
            AccountCode = account.AccountCode,
            AccountName = account.AccountName,
            AccountType = account.AccountType,
            SubCategory = account.SubCategory ?? "General",
            NormalBalance = account.NormalBalance,
            OpeningBalance = account.OpeningBalance,
            TotalDebits = Math.Round(sumDebits, 2),
            TotalCredits = Math.Round(sumCredits, 2),
            ClosingBalance = Math.Round(running, 2),
            AsOfDate = primaryDate.ToString("yyyy-MM-dd"),
            Transactions = transactions
        };

        return Ok(ApiResponse.Ok(result, "Account transactions retrieved successfully."));
    }

    #endregion

    #region 3. Diagnostic Discrepancy Investigation

    [HttpGet("investigate")]
    public async Task<IActionResult> InvestigateDiscrepancy([FromQuery] DateTime? asOfDate)
    {
        var primaryDate = asOfDate.HasValue ? asOfDate.Value.Date : DateTime.UtcNow.Date;
        var asOfUtc = DateTime.SpecifyKind(primaryDate.AddDays(1).AddTicks(-1), DateTimeKind.Utc);

        var accounts = await _db.Accounts.Where(a => !a.IsGroup && a.IsActive).ToListAsync();

        // 1. Audit Opening Balances
        double sumOpenDebit = 0;
        double sumOpenCredit = 0;
        foreach (var a in accounts)
        {
            if (a.NormalBalance == "DEBIT")
            {
                if (a.OpeningBalance >= 0) sumOpenDebit += a.OpeningBalance;
                else sumOpenCredit += Math.Abs(a.OpeningBalance);
            }
            else
            {
                if (a.OpeningBalance >= 0) sumOpenCredit += a.OpeningBalance;
                else sumOpenDebit += Math.Abs(a.OpeningBalance);
            }
        }
        var openDiscrepancy = Math.Round(sumOpenDebit - sumOpenCredit, 2);

        // 2. Audit Journal Entries for Imbalances (TotalDebit != TotalCredit)
        var entries = await _db.JournalEntries
            .Where(je => je.EntryDate <= asOfUtc && (je.Status == "POSTED" || je.Status == "REVERSED"))
            .Include(je => je.Lines)
            .ToListAsync();

        var imbalancedEntries = entries
            .Where(je => Math.Abs(je.Lines.Sum(l => l.Debit) - je.Lines.Sum(l => l.Credit)) > 0.01)
            .Select(je => je.EntryNumber)
            .ToList();

        // 3. Audit unposted drafts
        var unpostedCount = await _db.JournalEntries
            .Where(je => je.EntryDate <= asOfUtc && je.Status == "DRAFT")
            .CountAsync();

        // Calculate statement summary to get balance difference
        var accountIds = accounts.Select(a => a.Id).ToList();
        var lines = await _db.JournalEntryLines
            .Where(l => accountIds.Contains(l.AccountId) &&
                        l.JournalEntry != null &&
                        (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED") &&
                        l.JournalEntry.EntryDate <= asOfUtc)
            .Select(l => new { l.AccountId, l.Debit, l.Credit })
            .ToListAsync();

        var grouped = lines
            .GroupBy(l => l.AccountId)
            .ToDictionary(
                g => g.Key,
                g => new { TotalDebit = g.Sum(x => x.Debit), TotalCredit = g.Sum(x => x.Credit) }
            );

        double totalAssets = 0;
        double totalLiabilities = 0;
        double totalEquityAccounts = 0;
        double totalRevenue = 0;
        double totalExpense = 0;

        foreach (var acc in accounts)
        {
            grouped.TryGetValue(acc.Id, out var cur);
            var deb = cur?.TotalDebit ?? 0.0;
            var cred = cur?.TotalCredit ?? 0.0;

            if (acc.AccountType == "ASSET")
            {
                if (acc.AccountCode.StartsWith("16") || acc.NormalBalance == "CREDIT")
                    totalAssets -= (acc.OpeningBalance + (cred - deb)); // Contra reduces assets
                else
                    totalAssets += (acc.OpeningBalance + (deb - cred));
            }
            else if (acc.AccountType == "LIABILITY")
            {
                totalLiabilities += (acc.OpeningBalance + (cred - deb));
            }
            else if (acc.AccountType == "EQUITY")
            {
                if (acc.NormalBalance == "DEBIT" || acc.AccountCode == "3030")
                    totalEquityAccounts -= (acc.OpeningBalance + (deb - cred));
                else
                    totalEquityAccounts += (acc.OpeningBalance + (cred - deb));
            }
            else if (acc.AccountType == "REVENUE" || acc.AccountType == "INCOME")
            {
                totalRevenue += (acc.OpeningBalance + (cred - deb));
            }
            else if (acc.AccountType == "EXPENSE")
            {
                totalExpense += (acc.OpeningBalance + (deb - cred));
            }
        }

        var netProfit = totalRevenue - totalExpense;
        var totalEquity = totalEquityAccounts + netProfit;
        var diff = Math.Round(totalAssets - (totalLiabilities + totalEquity), 2);
        var isBalanced = Math.Abs(diff) < 0.01;

        var findings = new List<string>();
        var recommendations = new List<string>();

        if (isBalanced)
        {
            findings.Add("The fundamental accounting equation Assets = Liabilities + Equity holds true (Balance difference is 0.00).");
            recommendations.Add("No corrective actions required. All posted transactions maintain double-entry parity.");
        }
        else
        {
            findings.Add($"Balance Sheet discrepancy detected: Total Assets differ from Total Liabilities + Equity by Rs. {Math.Abs(diff):N2}.");

            if (Math.Abs(openDiscrepancy) > 0.01)
            {
                findings.Add($"Chart of Accounts Opening Balances are unbalanced: Opening Debits (Rs. {sumOpenDebit:N2}) != Opening Credits (Rs. {sumOpenCredit:N2}) by Rs. {openDiscrepancy:N2}.");
                recommendations.Add("Review initial Chart of Accounts setup in the Chart of Accounts module. Adjust initial Owner's Capital or Retained Earnings to balance initial opening balances.");
            }

            if (imbalancedEntries.Count > 0)
            {
                findings.Add($"Found {imbalancedEntries.Count} posted Journal Entries where Debit does not equal Credit: {string.Join(", ", imbalancedEntries.Take(5))}.");
                recommendations.Add("Open Journal Entries and reverse or correct the imbalanced vouchers identified above.");
            }

            if (unpostedCount > 0)
            {
                findings.Add($"There are {unpostedCount} unposted DRAFT journal entries prior to {primaryDate:yyyy-MM-dd}. Draft entries are excluded from Balance Sheet calculations.");
                recommendations.Add("Review unposted drafts in the Journal Entries module and post them if they represent completed transactions.");
            }
        }

        var response = new DiscrepancyDiagnosticResponse
        {
            AsOfDate = primaryDate,
            BalanceDifference = diff,
            IsBalanced = isBalanced,
            OpeningDebitsSum = Math.Round(sumOpenDebit, 2),
            OpeningCreditsSum = Math.Round(sumOpenCredit, 2),
            OpeningDiscrepancy = openDiscrepancy,
            ImbalancedJournalEntriesCount = imbalancedEntries.Count,
            ImbalancedEntryNumbers = imbalancedEntries,
            UnpostedDraftsCount = unpostedCount,
            TotalAssets = Math.Round(totalAssets, 2),
            TotalLiabilities = Math.Round(totalLiabilities, 2),
            TotalEquity = Math.Round(totalEquity, 2),
            CumulativeNetProfit = Math.Round(netProfit, 2),
            AuditFindings = findings,
            Recommendations = recommendations
        };

        return Ok(ApiResponse.Ok(response, "Discrepancy diagnostic analysis completed."));
    }

    #endregion
}

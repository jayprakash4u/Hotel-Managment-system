using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;
using System.Text.Json;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/cash-accounts")]
public class CashAccountsController : ControllerBase
{
    private readonly HospitalityDbContext _db;

    public CashAccountsController(HospitalityDbContext db)
    {
        _db = db;
    }

    private async Task<string> GetHotelIdAsync()
    {
        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        return hotel?.Id ?? "hotel-default";
    }

    private async Task EnsureStandardCashAccountsAsync(string hotelId)
    {
        var count = await _db.Accounts.CountAsync(a => a.SubCategory == "Cash & Cash Equivalents");
        if (count == 0)
        {
            var seed = AccountsController.GetStandardHospitalityAccounts(hotelId);
            _db.Accounts.AddRange(seed);
            await _db.SaveChangesAsync();
        }
        else
        {
            // Ensure 1040 (Main Safe) exists
            var has1040 = await _db.Accounts.AnyAsync(a => a.AccountCode == "1040");
            if (!has1040)
            {
                _db.Accounts.Add(new Account
                {
                    HotelId = hotelId,
                    AccountCode = "1040",
                    AccountName = "Main Cash Safe & Vault",
                    AccountType = "ASSET",
                    SubCategory = "Cash & Cash Equivalents",
                    NormalBalance = "DEBIT",
                    OpeningBalance = 50000,
                    CurrentBalance = 50000,
                    BranchOrOutlet = "Manager Safe",
                    Description = "Central safe for daily cash drops and manager reserve"
                });
                await _db.SaveChangesAsync();
            }

            // Ensure 5450 (Cash Shortage Expense) exists
            var has5450 = await _db.Accounts.AnyAsync(a => a.AccountCode == "5450");
            if (!has5450)
            {
                _db.Accounts.Add(new Account
                {
                    HotelId = hotelId,
                    AccountCode = "5450",
                    AccountName = "Cash Shortage / Reconciliation Loss",
                    AccountType = "EXPENSE",
                    SubCategory = "Operating Expense",
                    NormalBalance = "DEBIT",
                    OpeningBalance = 0,
                    CurrentBalance = 0,
                    Description = "Cash register shortage discrepancies"
                });
                await _db.SaveChangesAsync();
            }
        }
    }

    #region 1. Main Cash Accounts List & Summary Cards
    [HttpGet]
    public async Task<IActionResult> GetCashAccounts(
        [FromQuery] string? branch,
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo)
    {
        var hotelId = await GetHotelIdAsync();
        await EnsureStandardCashAccountsAsync(hotelId);

        var query = _db.Accounts
            .Where(a => a.AccountType == "ASSET" && a.SubCategory == "Cash & Cash Equivalents");

        if (!string.IsNullOrWhiteSpace(branch) && !branch.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(a => a.BranchOrOutlet != null && a.BranchOrOutlet.ToLower() == branch.Trim().ToLower());
        }

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            var isActive = status.Equals("ACTIVE", StringComparison.OrdinalIgnoreCase);
            query = query.Where(a => a.IsActive == isActive);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(a => a.AccountName.ToLower().Contains(s) || a.AccountCode.ToLower().Contains(s));
        }

        var accounts = await query.OrderBy(a => a.AccountCode).ToListAsync();

        var now = DateTime.UtcNow;
        var startUtc = dateFrom.HasValue
            ? DateTime.SpecifyKind(dateFrom.Value.Date, DateTimeKind.Utc)
            : new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var endUtc = dateTo.HasValue
            ? DateTime.SpecifyKind(dateTo.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc)
            : new DateTime(now.Year, now.Month, DateTime.DaysInMonth(now.Year, now.Month), 23, 59, 59, DateTimeKind.Utc);

        var todayStart = DateTime.SpecifyKind(DateTime.UtcNow.Date, DateTimeKind.Utc);
        var todayEnd = todayStart.AddDays(1).AddTicks(-1);

        var accountIds = accounts.Select(a => a.Id).ToList();

        // Fetch journal lines for these cash accounts
        var allPeriodLines = await _db.JournalEntryLines
            .Include(l => l.JournalEntry)
            .Where(l => accountIds.Contains(l.AccountId) &&
                        l.JournalEntry != null &&
                        (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED"))
            .ToListAsync();

        var periodLines = allPeriodLines
            .Where(l => l.JournalEntry!.EntryDate >= startUtc && l.JournalEntry.EntryDate <= endUtc)
            .ToList();

        var todayLines = allPeriodLines
            .Where(l => l.JournalEntry!.EntryDate >= todayStart && l.JournalEntry.EntryDate <= todayEnd)
            .ToList();

        var resultList = new List<object>();

        foreach (var acc in accounts)
        {
            // All-time posted net balance
            var accAllLines = allPeriodLines.Where(l => l.AccountId == acc.Id).ToList();
            var totalAllIn = accAllLines.Sum(l => l.Debit);
            var totalAllOut = accAllLines.Sum(l => l.Credit);
            var actualCurrentBalance = acc.OpeningBalance + totalAllIn - totalAllOut;

            // In filtered period
            var accPeriodLines = periodLines.Where(l => l.AccountId == acc.Id).ToList();
            var periodIn = accPeriodLines.Sum(l => l.Debit);
            var periodOut = accPeriodLines.Sum(l => l.Credit);

            // Today's movement
            var accTodayLines = todayLines.Where(l => l.AccountId == acc.Id).ToList();
            var todayIn = accTodayLines.Sum(l => l.Debit);
            var todayOut = accTodayLines.Sum(l => l.Credit);

            resultList.Add(new
            {
                id = acc.Id,
                accountName = acc.AccountName,
                accountCode = acc.AccountCode,
                branchOrOutlet = string.IsNullOrWhiteSpace(acc.BranchOrOutlet) ? "Main Restaurant" : acc.BranchOrOutlet,
                accountType = "Cash & Cash Equivalents",
                openingBalance = acc.OpeningBalance,
                openingBalanceDate = acc.OpeningBalanceDate ?? acc.CreatedAt,
                currentBalance = Math.Round(actualCurrentBalance, 2),
                totalCashIn = Math.Round(periodIn, 2),
                totalCashOut = Math.Round(periodOut, 2),
                todayCashIn = Math.Round(todayIn, 2),
                todayCashOut = Math.Round(todayOut, 2),
                responsibleEmployee = acc.ResponsibleEmployee ?? "Cashier In-Charge",
                isActive = acc.IsActive,
                description = acc.Description ?? ""
            });
        }

        // Summary Cards across all active cash accounts:
        // 1. Total Cash Balance
        // 2. Cash Received (Filtered Period)
        // 3. Cash Paid (Filtered Period)
        // 4. Today's Cash Balance
        var activeAccounts = accounts.Where(a => a.IsActive).ToList();
        var activeAccountIds = activeAccounts.Select(a => a.Id).ToList();

        double totalCashBalance = 0;
        foreach (var acc in activeAccounts)
        {
            var accLines = allPeriodLines.Where(l => l.AccountId == acc.Id).ToList();
            totalCashBalance += (acc.OpeningBalance + accLines.Sum(l => l.Debit) - accLines.Sum(l => l.Credit));
        }

        var cashReceived = periodLines.Where(l => activeAccountIds.Contains(l.AccountId)).Sum(l => l.Debit);
        var cashPaid = periodLines.Where(l => activeAccountIds.Contains(l.AccountId)).Sum(l => l.Credit);

        // Today's Cash Balance is the current live balance across active accounts
        var todayCashBalance = totalCashBalance;

        var availableBranches = await _db.Accounts
            .Where(a => a.SubCategory == "Cash & Cash Equivalents" && !string.IsNullOrEmpty(a.BranchOrOutlet))
            .Select(a => a.BranchOrOutlet!)
            .Distinct()
            .ToListAsync();

        if (!availableBranches.Contains("Main Restaurant")) availableBranches.Insert(0, "Main Restaurant");
        if (!availableBranches.Contains("Front Desk")) availableBranches.Add("Front Desk");
        if (!availableBranches.Contains("Central Kitchen")) availableBranches.Add("Central Kitchen");
        if (!availableBranches.Contains("Manager Safe")) availableBranches.Add("Manager Safe");

        return Ok(ApiResponse.Ok(new
        {
            summary = new
            {
                totalCashBalance = Math.Round(totalCashBalance, 2),
                cashReceived = Math.Round(cashReceived, 2),
                cashPaid = Math.Round(cashPaid, 2),
                todayCashBalance = Math.Round(todayCashBalance, 2)
            },
            accounts = resultList,
            branches = availableBranches.Distinct().ToList()
        }));
    }
    #endregion

    #region 2. Cash Account Details & Transaction History
    [HttpGet("{id}")]
    public async Task<IActionResult> GetCashAccountDetails(string id)
    {
        var hotelId = await GetHotelIdAsync();
        Account? acc = null;

        if (id.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            var activeAccounts = await _db.Accounts
                .Where(a => a.AccountType == "ASSET" && a.SubCategory == "Cash & Cash Equivalents" && a.IsActive)
                .ToListAsync();

            var allLines = await _db.JournalEntryLines
                .Include(l => l.JournalEntry)
                .Where(l => activeAccounts.Select(a => a.Id).Contains(l.AccountId) &&
                            l.JournalEntry != null &&
                            (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED"))
                .ToListAsync();

            var totalOpen = activeAccounts.Sum(a => a.OpeningBalance);
            var totalIn = allLines.Sum(l => l.Debit);
            var totalOut = allLines.Sum(l => l.Credit);
            var totalCur = totalOpen + totalIn - totalOut;

            return Ok(ApiResponse.Ok(new
            {
                id = "ALL",
                accountName = "All Cash Accounts (Consolidated)",
                accountCode = "1000-CASH",
                branchOrOutlet = "All Outlets",
                currentBalance = Math.Round(totalCur, 2),
                openingBalance = Math.Round(totalOpen, 2),
                totalCashReceived = Math.Round(totalIn, 2),
                totalCashPaid = Math.Round(totalOut, 2),
                responsibleEmployee = "Finance Department",
                isActive = true,
                description = "Consolidated cash positions across all registers and vaults."
            }));
        }

        acc = await _db.Accounts.FindAsync(id);
        if (acc == null)
        {
            return NotFound(ApiResponse.Fail("Cash account not found."));
        }

        var lines = await _db.JournalEntryLines
            .Include(l => l.JournalEntry)
            .Where(l => l.AccountId == acc.Id &&
                        l.JournalEntry != null &&
                        (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED"))
            .ToListAsync();

        var totalCashIn = lines.Sum(l => l.Debit);
        var totalCashOut = lines.Sum(l => l.Credit);
        var curBalance = acc.OpeningBalance + totalCashIn - totalCashOut;

        return Ok(ApiResponse.Ok(new
        {
            id = acc.Id,
            accountName = acc.AccountName,
            accountCode = acc.AccountCode,
            branchOrOutlet = string.IsNullOrWhiteSpace(acc.BranchOrOutlet) ? "Main Restaurant" : acc.BranchOrOutlet,
            currentBalance = Math.Round(curBalance, 2),
            openingBalance = Math.Round(acc.OpeningBalance, 2),
            totalCashReceived = Math.Round(totalCashIn, 2),
            totalCashPaid = Math.Round(totalCashOut, 2),
            responsibleEmployee = acc.ResponsibleEmployee ?? "Cashier In-Charge",
            isActive = acc.IsActive,
            description = acc.Description ?? ""
        }));
    }

    [HttpGet("{id}/transactions")]
    public async Task<IActionResult> GetCashAccountTransactions(
        string id,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] string? type,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        var now = DateTime.UtcNow;
        var startUtc = fromDate.HasValue
            ? DateTime.SpecifyKind(fromDate.Value.Date, DateTimeKind.Utc)
            : new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var endUtc = toDate.HasValue
            ? DateTime.SpecifyKind(toDate.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc)
            : new DateTime(now.Year, now.Month, DateTime.DaysInMonth(now.Year, now.Month), 23, 59, 59, DateTimeKind.Utc);

        var isAll = id.Equals("ALL", StringComparison.OrdinalIgnoreCase);
        List<string> targetAccountIds = new();

        double baseOpening = 0.0;

        if (isAll)
        {
            var accs = await _db.Accounts
                .Where(a => a.AccountType == "ASSET" && a.SubCategory == "Cash & Cash Equivalents" && a.IsActive)
                .ToListAsync();
            targetAccountIds = accs.Select(a => a.Id).ToList();
            baseOpening = accs.Sum(a => a.OpeningBalance);
        }
        else
        {
            var acc = await _db.Accounts.FindAsync(id);
            if (acc == null)
            {
                return NotFound(ApiResponse.Fail("Cash account not found."));
            }
            targetAccountIds.Add(acc.Id);
            baseOpening = acc.OpeningBalance;
        }

        // Calculate period opening balance (base opening + all posted lines prior to startUtc)
        var priorLines = await _db.JournalEntryLines
            .Include(l => l.JournalEntry)
            .Where(l => targetAccountIds.Contains(l.AccountId) &&
                        l.JournalEntry != null &&
                        (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED") &&
                        l.JournalEntry.EntryDate < startUtc)
            .ToListAsync();

        var priorIn = priorLines.Sum(l => l.Debit);
        var priorOut = priorLines.Sum(l => l.Credit);
        var periodOpeningBalance = baseOpening + priorIn - priorOut;

        // Fetch lines within period
        var periodQuery = _db.JournalEntryLines
            .Include(l => l.JournalEntry)
            .Include(l => l.Account)
            .Where(l => targetAccountIds.Contains(l.AccountId) &&
                        l.JournalEntry != null &&
                        (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED") &&
                        l.JournalEntry.EntryDate >= startUtc &&
                        l.JournalEntry.EntryDate <= endUtc);

        var allPeriodLines = await periodQuery
            .OrderBy(l => l.JournalEntry!.EntryDate)
            .ThenBy(l => l.Id)
            .ToListAsync();

        // Calculate chronological running balance for every row in period
        var computedList = new List<CashTransactionItemDto>();
        var currentRunning = periodOpeningBalance;

        foreach (var l in allPeriodLines)
        {
            var je = l.JournalEntry!;
            var cashIn = l.Debit;
            var cashOut = l.Credit;
            currentRunning = currentRunning + cashIn - cashOut;

            var txnType = DetermineTransactionType(je, cashIn, cashOut);

            computedList.Add(new CashTransactionItemDto
            {
                Id = l.Id,
                Date = je.EntryDate,
                ReferenceNumber = !string.IsNullOrWhiteSpace(je.Reference) ? je.Reference : je.EntryNumber,
                EntryNumber = je.EntryNumber,
                TransactionType = txnType,
                Description = !string.IsNullOrWhiteSpace(l.LineDescription) ? l.LineDescription : je.Description,
                CashIn = Math.Round(cashIn, 2),
                CashOut = Math.Round(cashOut, 2),
                RunningBalance = Math.Round(currentRunning, 2),
                SourceModule = je.SourceModule,
                CreatedBy = je.CreatedBy,
                JournalEntryId = je.Id,
                AccountId = l.AccountId,
                AccountName = l.AccountName ?? l.Account?.AccountName ?? "Cash Account",
                AccountCode = l.AccountCode ?? l.Account?.AccountCode ?? "1020"
            });
        }

        var periodClosingBalance = currentRunning;
        var totalCashIn = allPeriodLines.Sum(l => l.Debit);
        var totalCashOut = allPeriodLines.Sum(l => l.Credit);

        // Apply in-memory filters (type & search) on the computed list
        var filtered = computedList.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(type) && !type.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            filtered = filtered.Where(x => x.TransactionType.Equals(type, StringComparison.OrdinalIgnoreCase) ||
                                           x.SourceModule.Equals(type, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            filtered = filtered.Where(x => x.ReferenceNumber.ToLower().Contains(s) ||
                                           x.Description.ToLower().Contains(s) ||
                                           x.CreatedBy.ToLower().Contains(s) ||
                                           x.TransactionType.ToLower().Contains(s) ||
                                           x.AccountName.ToLower().Contains(s));
        }

        var filteredList = filtered.ToList();
        var totalRecords = filteredList.Count;

        if (page < 1) page = 1;
        if (pageSize < 5) pageSize = 25;

        // In reverse chronological order for table presentation
        var paginated = filteredList
            .OrderByDescending(x => x.Date)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return Ok(ApiResponse.Ok(new
        {
            periodOpeningBalance = Math.Round(periodOpeningBalance, 2),
            periodClosingBalance = Math.Round(periodClosingBalance, 2),
            periodCashIn = Math.Round(totalCashIn, 2),
            periodCashOut = Math.Round(totalCashOut, 2),
            netMovement = Math.Round(totalCashIn - totalCashOut, 2),
            totalRecords,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling(totalRecords / (double)pageSize),
            transactions = paginated
        }));
    }

    private static string DetermineTransactionType(JournalEntry je, double cashIn, double cashOut)
    {
        if (je.EntryType == "OPENING") return "OPENING_BALANCE";
        if (je.EntryType == "TRANSFER") return "CASH_TRANSFER";
        if (je.EntryType == "RECEIPT") return "CASH_RECEIPT";
        if (je.EntryType == "PAYMENT") return "CASH_PAYMENT";
        if (je.EntryType == "ADJUSTMENT") return "RECONCILIATION_ADJUSTMENT";

        if (je.SourceModule == "POS_SALE") return "POS_CASH_SALE";
        if (je.SourceModule == "CUSTOMER_PAYMENT") return "CUSTOMER_RECEIPT";
        if (je.SourceModule == "PURCHASE" || je.SourceModule == "SUPPLIER_PAYMENT") return "SUPPLIER_PAYMENT";
        if (je.SourceModule == "EXPENSE") return "EXPENSE_PAYMENT";
        if (je.SourceModule == "PETTY_CASH") return "PETTY_CASH_EXPENSE";

        if (cashIn > 0 && cashOut == 0) return "CASH_RECEIPT";
        if (cashOut > 0 && cashIn == 0) return "CASH_PAYMENT";
        return "GENERAL_ENTRY";
    }
    #endregion

    #region 3. Add & Edit Cash Account
    public record CreateCashAccountRequest(
        string AccountName,
        string? AccountCode,
        string? BranchOrOutlet,
        string? Description,
        double OpeningBalance,
        DateTime? OpeningBalanceDate,
        string? ResponsibleEmployee,
        bool IsActive = true);

    [HttpPost]
    public async Task<IActionResult> CreateCashAccount([FromBody] CreateCashAccountRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.AccountName))
        {
            return BadRequest(ApiResponse.Fail("Account name is required."));
        }

        var hotelId = await GetHotelIdAsync();

        // Generate or validate account code
        string code = req.AccountCode?.Trim() ?? "";
        if (string.IsNullOrEmpty(code))
        {
            var existingCodes = await _db.Accounts
                .Where(a => a.AccountCode.StartsWith("10"))
                .Select(a => a.AccountCode)
                .ToListAsync();

            int nextNum = 21;
            while (existingCodes.Contains($"10{nextNum:00}"))
            {
                nextNum++;
            }
            code = $"10{nextNum:00}";
        }
        else
        {
            var codeExists = await _db.Accounts.AnyAsync(a => a.AccountCode == code);
            if (codeExists)
            {
                return BadRequest(ApiResponse.Fail($"Account code '{code}' already exists. Duplicate codes are not allowed."));
            }
        }

        var account = new Account
        {
            HotelId = hotelId,
            AccountCode = code,
            AccountName = req.AccountName.Trim(),
            AccountType = "ASSET",
            SubCategory = "Cash & Cash Equivalents",
            NormalBalance = "DEBIT",
            BranchOrOutlet = string.IsNullOrWhiteSpace(req.BranchOrOutlet) ? "Main Restaurant" : req.BranchOrOutlet.Trim(),
            Description = req.Description,
            OpeningBalance = req.OpeningBalance >= 0 ? req.OpeningBalance : 0,
            OpeningBalanceDate = req.OpeningBalanceDate ?? DateTime.UtcNow,
            CurrentBalance = req.OpeningBalance >= 0 ? req.OpeningBalance : 0,
            ResponsibleEmployee = req.ResponsibleEmployee?.Trim() ?? "Cashier In-Charge",
            IsActive = req.IsActive,
            AllowManualEntries = true
        };

        _db.Accounts.Add(account);
        await _db.SaveChangesAsync();

        // If opening balance > 0, create balanced opening journal entry
        if (req.OpeningBalance > 0)
        {
            var equityAccount = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "3010")
                                ?? await _db.Accounts.FirstOrDefaultAsync(a => a.AccountType == "EQUITY");

            if (equityAccount != null)
            {
                var entryNumber = $"JV-OPEN-{DateTime.UtcNow.Year}-{Random.Shared.Next(1000, 9999)}";
                var je = new JournalEntry
                {
                    HotelId = hotelId,
                    EntryNumber = entryNumber,
                    EntryDate = req.OpeningBalanceDate ?? DateTime.UtcNow,
                    EntryType = "OPENING",
                    Reference = code,
                    Description = $"Opening balance for cash account {account.AccountName} ({code})",
                    TotalDebit = req.OpeningBalance,
                    TotalCredit = req.OpeningBalance,
                    Status = "POSTED",
                    SourceModule = "OPENING",
                    CreatedBy = req.ResponsibleEmployee ?? "Admin",
                    Lines = new List<JournalEntryLine>
                    {
                        new JournalEntryLine
                        {
                            AccountId = account.Id,
                            AccountCode = account.AccountCode,
                            AccountName = account.AccountName,
                            LineDescription = $"Opening Cash Balance",
                            Debit = req.OpeningBalance,
                            Credit = 0
                        },
                        new JournalEntryLine
                        {
                            AccountId = equityAccount.Id,
                            AccountCode = equityAccount.AccountCode,
                            AccountName = equityAccount.AccountName,
                            LineDescription = $"Owner Equity Contribution for {account.AccountName}",
                            Debit = 0,
                            Credit = req.OpeningBalance
                        }
                    }
                };
                _db.JournalEntries.Add(je);
                await _db.SaveChangesAsync();
            }
        }

        return Ok(ApiResponse.Ok(account, "Cash account created successfully."));
    }

    public record UpdateCashAccountRequest(
        string AccountName,
        string? BranchOrOutlet,
        string? Description,
        string? ResponsibleEmployee,
        bool IsActive);

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCashAccount(string id, [FromBody] UpdateCashAccountRequest req)
    {
        var acc = await _db.Accounts.FindAsync(id);
        if (acc == null)
        {
            return NotFound(ApiResponse.Fail("Cash account not found."));
        }

        if (!string.IsNullOrWhiteSpace(req.AccountName))
        {
            acc.AccountName = req.AccountName.Trim();
        }
        if (!string.IsNullOrWhiteSpace(req.BranchOrOutlet))
        {
            acc.BranchOrOutlet = req.BranchOrOutlet.Trim();
        }
        if (req.Description != null)
        {
            acc.Description = req.Description;
        }
        if (req.ResponsibleEmployee != null)
        {
            acc.ResponsibleEmployee = req.ResponsibleEmployee.Trim();
        }
        acc.IsActive = req.IsActive;
        acc.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(ApiResponse.Ok(acc, "Cash account updated successfully."));
    }
    #endregion

    #region 4. Cash Receipt Action
    public record RecordCashReceiptRequest(
        string AccountId,
        DateTime Date,
        string ReceivedFrom,
        string Category,
        double Amount,
        string? ReferenceNumber,
        string? Description,
        string? Branch,
        string? ReceivedBy);

    [HttpPost("receipt")]
    public async Task<IActionResult> RecordCashReceipt([FromBody] RecordCashReceiptRequest req)
    {
        if (req.Amount <= 0)
        {
            return BadRequest(ApiResponse.Fail("Receipt amount must be greater than zero."));
        }

        var cashAcc = await _db.Accounts.FindAsync(req.AccountId);
        if (cashAcc == null || !cashAcc.IsActive)
        {
            return BadRequest(ApiResponse.Fail("Active cash account not found."));
        }

        var hotelId = await GetHotelIdAsync();

        // Determine credit counter-account based on receipt category
        // - "Customer Payment" -> 1100 Accounts Receivable
        // - "Supplier Refund" -> 2010 Accounts Payable
        // - "Owner / Capital Contribution" -> 3010 Owner's Capital
        // - "Other Income" / default -> 4900 Miscellaneous Income
        Account? counterAcc = null;
        var cat = (req.Category ?? "").Trim();

        if (cat.Contains("Customer", StringComparison.OrdinalIgnoreCase))
        {
            counterAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "1100")
                         ?? await _db.Accounts.FirstOrDefaultAsync(a => a.AccountType == "ASSET" && a.SubCategory == "Receivables");
        }
        else if (cat.Contains("Supplier", StringComparison.OrdinalIgnoreCase) || cat.Contains("Refund", StringComparison.OrdinalIgnoreCase))
        {
            counterAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "2010")
                         ?? await _db.Accounts.FirstOrDefaultAsync(a => a.AccountType == "LIABILITY" && a.SubCategory == "Payables");
        }
        else if (cat.Contains("Owner", StringComparison.OrdinalIgnoreCase) || cat.Contains("Capital", StringComparison.OrdinalIgnoreCase))
        {
            counterAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "3010")
                         ?? await _db.Accounts.FirstOrDefaultAsync(a => a.AccountType == "EQUITY");
        }
        else
        {
            counterAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "4900")
                         ?? await _db.Accounts.FirstOrDefaultAsync(a => a.AccountType == "REVENUE");
        }

        counterAcc ??= await _db.Accounts.FirstOrDefaultAsync(a => a.AccountType == "REVENUE") ?? cashAcc;

        var receiptNumber = $"CR-{DateTime.UtcNow.Year}-{Random.Shared.Next(10000, 99999)}";
        var narration = !string.IsNullOrWhiteSpace(req.Description)
            ? req.Description
            : $"Cash received from {req.ReceivedFrom} for {req.Category}";

        var je = new JournalEntry
        {
            HotelId = hotelId,
            EntryNumber = receiptNumber,
            EntryDate = req.Date != default ? DateTime.SpecifyKind(req.Date, DateTimeKind.Utc) : DateTime.UtcNow,
            EntryType = "RECEIPT",
            Reference = req.ReferenceNumber ?? receiptNumber,
            Description = narration,
            TotalDebit = req.Amount,
            TotalCredit = req.Amount,
            Status = "POSTED",
            SourceModule = "CASH_ACCOUNT",
            CreatedBy = req.ReceivedBy ?? "Cashier",
            Lines = new List<JournalEntryLine>
            {
                new JournalEntryLine
                {
                    AccountId = cashAcc.Id,
                    AccountCode = cashAcc.AccountCode,
                    AccountName = cashAcc.AccountName,
                    LineDescription = $"Receipt {receiptNumber} from {req.ReceivedFrom}",
                    Debit = req.Amount,
                    Credit = 0
                },
                new JournalEntryLine
                {
                    AccountId = counterAcc.Id,
                    AccountCode = counterAcc.AccountCode,
                    AccountName = counterAcc.AccountName,
                    LineDescription = $"{req.Category}: {req.ReceivedFrom}",
                    Debit = 0,
                    Credit = req.Amount
                }
            }
        };

        _db.JournalEntries.Add(je);
        cashAcc.CurrentBalance += req.Amount;
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            receiptNumber,
            amount = req.Amount,
            cashAccountName = cashAcc.AccountName,
            journalEntryId = je.Id
        }, "Cash receipt recorded successfully."));
    }
    #endregion

    #region 5. Cash Payment Action
    public record RecordCashPaymentRequest(
        string AccountId,
        DateTime Date,
        string Payee,
        string Category,
        double Amount,
        string? ReferenceNumber,
        string? Description,
        string? Branch,
        string? PaidBy);

    [HttpPost("payment")]
    public async Task<IActionResult> RecordCashPayment([FromBody] RecordCashPaymentRequest req)
    {
        if (req.Amount <= 0)
        {
            return BadRequest(ApiResponse.Fail("Payment amount must be greater than zero."));
        }

        var cashAcc = await _db.Accounts.FindAsync(req.AccountId);
        if (cashAcc == null || !cashAcc.IsActive)
        {
            return BadRequest(ApiResponse.Fail("Active cash account not found."));
        }

        var hotelId = await GetHotelIdAsync();

        // Determine debit counter-account based on payment category
        // - "Supplier Payments" -> 2010 Accounts Payable
        // - "Petty Cash Expenses" -> 5200 Operating Expenses
        // - "Operating Expenses" -> 5200 / 5400 Operating Expenses
        // - "Staff Payments" -> 5100 Staff Payroll
        // - "Utilities" -> 5300 Utilities
        Account? counterAcc = null;
        var cat = (req.Category ?? "").Trim();

        if (cat.Contains("Supplier", StringComparison.OrdinalIgnoreCase))
        {
            counterAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "2010")
                         ?? await _db.Accounts.FirstOrDefaultAsync(a => a.AccountType == "LIABILITY" && a.SubCategory == "Payables");
        }
        else if (cat.Contains("Staff", StringComparison.OrdinalIgnoreCase) || cat.Contains("Salary", StringComparison.OrdinalIgnoreCase))
        {
            counterAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "5100")
                         ?? await _db.Accounts.FirstOrDefaultAsync(a => a.AccountType == "EXPENSE");
        }
        else if (cat.Contains("Utilities", StringComparison.OrdinalIgnoreCase) || cat.Contains("Electricity", StringComparison.OrdinalIgnoreCase))
        {
            counterAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "5300")
                         ?? await _db.Accounts.FirstOrDefaultAsync(a => a.AccountType == "EXPENSE");
        }
        else if (cat.Contains("Repair", StringComparison.OrdinalIgnoreCase) || cat.Contains("Maintenance", StringComparison.OrdinalIgnoreCase))
        {
            counterAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "5400")
                         ?? await _db.Accounts.FirstOrDefaultAsync(a => a.AccountType == "EXPENSE");
        }
        else
        {
            counterAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "5200")
                         ?? await _db.Accounts.FirstOrDefaultAsync(a => a.AccountType == "EXPENSE");
        }

        counterAcc ??= await _db.Accounts.FirstOrDefaultAsync(a => a.AccountType == "EXPENSE") ?? cashAcc;

        var voucherNumber = $"CP-{DateTime.UtcNow.Year}-{Random.Shared.Next(10000, 99999)}";
        var narration = !string.IsNullOrWhiteSpace(req.Description)
            ? req.Description
            : $"Cash payment to {req.Payee} for {req.Category}";

        var je = new JournalEntry
        {
            HotelId = hotelId,
            EntryNumber = voucherNumber,
            EntryDate = req.Date != default ? DateTime.SpecifyKind(req.Date, DateTimeKind.Utc) : DateTime.UtcNow,
            EntryType = "PAYMENT",
            Reference = req.ReferenceNumber ?? voucherNumber,
            Description = narration,
            TotalDebit = req.Amount,
            TotalCredit = req.Amount,
            Status = "POSTED",
            SourceModule = "CASH_ACCOUNT",
            CreatedBy = req.PaidBy ?? "Cashier",
            Lines = new List<JournalEntryLine>
            {
                new JournalEntryLine
                {
                    AccountId = counterAcc.Id,
                    AccountCode = counterAcc.AccountCode,
                    AccountName = counterAcc.AccountName,
                    LineDescription = $"{req.Category}: Paid to {req.Payee}",
                    Debit = req.Amount,
                    Credit = 0
                },
                new JournalEntryLine
                {
                    AccountId = cashAcc.Id,
                    AccountCode = cashAcc.AccountCode,
                    AccountName = cashAcc.AccountName,
                    LineDescription = $"Payment voucher {voucherNumber} to {req.Payee}",
                    Debit = 0,
                    Credit = req.Amount
                }
            }
        };

        _db.JournalEntries.Add(je);
        cashAcc.CurrentBalance -= req.Amount;
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            voucherNumber,
            amount = req.Amount,
            cashAccountName = cashAcc.AccountName,
            journalEntryId = je.Id
        }, "Cash payment recorded successfully."));
    }
    #endregion

    #region 6. Cash Transfer (Contra Entry)
    public record CashTransferRequest(
        string FromAccountId,
        string ToAccountId,
        double Amount,
        DateTime Date,
        string? Description,
        string? Reference,
        string? TransferredBy);

    [HttpPost("transfer")]
    public async Task<IActionResult> TransferCash([FromBody] CashTransferRequest req)
    {
        if (req.Amount <= 0)
        {
            return BadRequest(ApiResponse.Fail("Transfer amount must be greater than zero."));
        }

        if (req.FromAccountId == req.ToAccountId)
        {
            return BadRequest(ApiResponse.Fail("Cannot transfer between the same cash account. Please select distinct source and destination accounts."));
        }

        var fromAcc = await _db.Accounts.FindAsync(req.FromAccountId);
        var toAcc = await _db.Accounts.FindAsync(req.ToAccountId);

        if (fromAcc == null || !fromAcc.IsActive)
        {
            return BadRequest(ApiResponse.Fail("Source cash account not found or inactive."));
        }
        if (toAcc == null || !toAcc.IsActive)
        {
            return BadRequest(ApiResponse.Fail("Destination cash account not found or inactive."));
        }

        // Validate available balance
        var fromLines = await _db.JournalEntryLines
            .Where(l => l.AccountId == fromAcc.Id &&
                        l.JournalEntry != null &&
                        (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED"))
            .ToListAsync();
        var currentFromBal = fromAcc.OpeningBalance + fromLines.Sum(l => l.Debit) - fromLines.Sum(l => l.Credit);

        if (currentFromBal < req.Amount)
        {
            return BadRequest(ApiResponse.Fail($"Insufficient funds in {fromAcc.AccountName}. Available balance is Rs. {currentFromBal:N2}, but requested transfer is Rs. {req.Amount:N2}."));
        }

        var hotelId = await GetHotelIdAsync();
        var transferNumber = $"CTR-{DateTime.UtcNow.Year}-{Random.Shared.Next(10000, 99999)}";
        var narration = !string.IsNullOrWhiteSpace(req.Description)
            ? req.Description
            : $"Internal cash transfer from {fromAcc.AccountName} to {toAcc.AccountName}";

        var je = new JournalEntry
        {
            HotelId = hotelId,
            EntryNumber = transferNumber,
            EntryDate = req.Date != default ? DateTime.SpecifyKind(req.Date, DateTimeKind.Utc) : DateTime.UtcNow,
            EntryType = "TRANSFER",
            Reference = req.Reference ?? transferNumber,
            Description = narration,
            TotalDebit = req.Amount,
            TotalCredit = req.Amount,
            Status = "POSTED",
            SourceModule = "CASH_ACCOUNT",
            CreatedBy = req.TransferredBy ?? "Manager",
            Lines = new List<JournalEntryLine>
            {
                new JournalEntryLine
                {
                    AccountId = toAcc.Id,
                    AccountCode = toAcc.AccountCode,
                    AccountName = toAcc.AccountName,
                    LineDescription = $"Transfer In from {fromAcc.AccountName}",
                    Debit = req.Amount,
                    Credit = 0
                },
                new JournalEntryLine
                {
                    AccountId = fromAcc.Id,
                    AccountCode = fromAcc.AccountCode,
                    AccountName = fromAcc.AccountName,
                    LineDescription = $"Transfer Out to {toAcc.AccountName}",
                    Debit = 0,
                    Credit = req.Amount
                }
            }
        };

        _db.JournalEntries.Add(je);
        fromAcc.CurrentBalance -= req.Amount;
        toAcc.CurrentBalance += req.Amount;
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            transferNumber,
            amount = req.Amount,
            fromAccount = fromAcc.AccountName,
            toAccount = toAcc.AccountName,
            journalEntryId = je.Id
        }, $"Successfully transferred Rs. {req.Amount:N2} from {fromAcc.AccountName} to {toAcc.AccountName}."));
    }
    #endregion

    #region 7. Cash Reconciliation & Adjustment
    public record CashReconcileRequest(
        string AccountId,
        DateTime ReconciliationDate,
        double ActualCountedCash,
        string? Explanation,
        string? DenominationsJson,
        string ReconciledBy,
        string? WitnessManager,
        bool AutoApproveAdjustment = true);

    [HttpPost("reconcile")]
    public async Task<IActionResult> ReconcileCash([FromBody] CashReconcileRequest req)
    {
        var acc = await _db.Accounts.FindAsync(req.AccountId);
        if (acc == null)
        {
            return NotFound(ApiResponse.Fail("Cash account not found."));
        }

        var hotelId = await GetHotelIdAsync();

        // Compute system cash balance up to reconciliation date
        var reconUtc = req.ReconciliationDate != default
            ? DateTime.SpecifyKind(req.ReconciliationDate, DateTimeKind.Utc)
            : DateTime.UtcNow;

        var lines = await _db.JournalEntryLines
            .Where(l => l.AccountId == acc.Id &&
                        l.JournalEntry != null &&
                        (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED") &&
                        l.JournalEntry.EntryDate <= reconUtc)
            .ToListAsync();

        var systemBalance = Math.Round(acc.OpeningBalance + lines.Sum(l => l.Debit) - lines.Sum(l => l.Credit), 2);
        var countedCash = Math.Round(req.ActualCountedCash, 2);
        var difference = Math.Round(countedCash - systemBalance, 2);

        var reconNumber = $"CRCN-{DateTime.UtcNow.Year}-{Random.Shared.Next(1000, 9999)}";
        string status = (difference == 0) ? "MATCHED" : (req.AutoApproveAdjustment ? "APPROVED" : "PENDING_APPROVAL");

        JournalEntry? adjustmentEntry = null;

        // If discrepancy and approved, post adjustment entry
        if (difference != 0 && status == "APPROVED")
        {
            if (difference < 0)
            {
                // Shortage: Debit Expense (5450), Credit Cash Account
                var shortageAmt = Math.Abs(difference);
                var shortageAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "5450")
                                  ?? await _db.Accounts.FirstOrDefaultAsync(a => a.AccountType == "EXPENSE");

                adjustmentEntry = new JournalEntry
                {
                    HotelId = hotelId,
                    EntryNumber = $"ADJ-{DateTime.UtcNow.Year}-{Random.Shared.Next(1000, 9999)}",
                    EntryDate = reconUtc,
                    EntryType = "ADJUSTMENT",
                    Reference = reconNumber,
                    Description = $"Cash shortage adjustment for {acc.AccountName}: Counted Rs. {countedCash:N2} vs System Rs. {systemBalance:N2}. {req.Explanation}",
                    TotalDebit = shortageAmt,
                    TotalCredit = shortageAmt,
                    Status = "POSTED",
                    SourceModule = "CASH_ACCOUNT",
                    CreatedBy = req.ReconciledBy,
                    Lines = new List<JournalEntryLine>
                    {
                        new JournalEntryLine
                        {
                            AccountId = shortageAcc?.Id ?? acc.Id,
                            AccountCode = shortageAcc?.AccountCode ?? "5450",
                            AccountName = shortageAcc?.AccountName ?? "Cash Shortage Loss",
                            LineDescription = $"Cash register shortage: {acc.AccountName}",
                            Debit = shortageAmt,
                            Credit = 0
                        },
                        new JournalEntryLine
                        {
                            AccountId = acc.Id,
                            AccountCode = acc.AccountCode,
                            AccountName = acc.AccountName,
                            LineDescription = $"Discrepancy adjustment ({reconNumber})",
                            Debit = 0,
                            Credit = shortageAmt
                        }
                    }
                };
                _db.JournalEntries.Add(adjustmentEntry);
                acc.CurrentBalance -= shortageAmt;
            }
            else
            {
                // Excess: Debit Cash Account, Credit Misc Income (4900)
                var excessAmt = difference;
                var incomeAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "4900")
                                ?? await _db.Accounts.FirstOrDefaultAsync(a => a.AccountType == "REVENUE");

                adjustmentEntry = new JournalEntry
                {
                    HotelId = hotelId,
                    EntryNumber = $"ADJ-{DateTime.UtcNow.Year}-{Random.Shared.Next(1000, 9999)}",
                    EntryDate = reconUtc,
                    EntryType = "ADJUSTMENT",
                    Reference = reconNumber,
                    Description = $"Cash overage adjustment for {acc.AccountName}: Counted Rs. {countedCash:N2} vs System Rs. {systemBalance:N2}. {req.Explanation}",
                    TotalDebit = excessAmt,
                    TotalCredit = excessAmt,
                    Status = "POSTED",
                    SourceModule = "CASH_ACCOUNT",
                    CreatedBy = req.ReconciledBy,
                    Lines = new List<JournalEntryLine>
                    {
                        new JournalEntryLine
                        {
                            AccountId = acc.Id,
                            AccountCode = acc.AccountCode,
                            AccountName = acc.AccountName,
                            LineDescription = $"Discrepancy adjustment ({reconNumber})",
                            Debit = excessAmt,
                            Credit = 0
                        },
                        new JournalEntryLine
                        {
                            AccountId = incomeAcc?.Id ?? acc.Id,
                            AccountCode = incomeAcc?.AccountCode ?? "4900",
                            AccountName = incomeAcc?.AccountName ?? "Miscellaneous Cash Overage",
                            LineDescription = $"Cash register excess: {acc.AccountName}",
                            Debit = 0,
                            Credit = excessAmt
                        }
                    }
                };
                _db.JournalEntries.Add(adjustmentEntry);
                acc.CurrentBalance += excessAmt;
            }
        }

        var recon = new CashReconciliation
        {
            HotelId = hotelId,
            AccountId = acc.Id,
            ReconciliationNumber = reconNumber,
            ReconciliationDate = reconUtc,
            SystemBalance = systemBalance,
            PhysicalCount = countedCash,
            Difference = difference,
            Status = status,
            Explanation = req.Explanation,
            DenominationsJson = req.DenominationsJson,
            ReconciledBy = req.ReconciledBy,
            ApprovedBy = (status == "APPROVED") ? (req.WitnessManager ?? req.ReconciledBy) : null,
            ApprovedAt = (status == "APPROVED") ? DateTime.UtcNow : null,
            JournalEntryId = adjustmentEntry?.Id
        };

        _db.CashReconciliations.Add(recon);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            reconNumber,
            systemBalance,
            physicalCount = countedCash,
            difference,
            status,
            journalEntryId = adjustmentEntry?.Id
        }, difference == 0
            ? "Cash count matched perfectly with system balance."
            : $"Cash reconciliation logged with difference of Rs. {difference:N2} ({status})."));
    }

    [HttpGet("{id}/reconciliations")]
    public async Task<IActionResult> GetReconciliations(string id)
    {
        var query = _db.CashReconciliations
            .Include(r => r.Account)
            .AsQueryable();

        if (!id.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(r => r.AccountId == id);
        }

        var list = await query
            .OrderByDescending(r => r.ReconciliationDate)
            .Take(50)
            .ToListAsync();

        return Ok(ApiResponse.Ok(list));
    }
    #endregion
}

public class CashTransactionItemDto
{
    public string Id { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string ReferenceNumber { get; set; } = string.Empty;
    public string EntryNumber { get; set; } = string.Empty;
    public string TransactionType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public double CashIn { get; set; }
    public double CashOut { get; set; }
    public double RunningBalance { get; set; }
    public string SourceModule { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = string.Empty;
    public string JournalEntryId { get; set; } = string.Empty;
    public string AccountId { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public string AccountCode { get; set; } = string.Empty;
}

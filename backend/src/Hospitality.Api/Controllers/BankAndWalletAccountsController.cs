using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/bank-wallet-accounts")]
public class BankAndWalletAccountsController : ControllerBase
{
    private readonly HospitalityDbContext _db;

    public BankAndWalletAccountsController(HospitalityDbContext db)
    {
        _db = db;
    }

    private async Task<string> GetHotelIdAsync()
    {
        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        return hotel?.Id ?? "hotel-default";
    }

    private async Task EnsureStandardAccountsAsync(string hotelId)
    {
        // 1. Ensure Bank Accounts exist (1050 Nabil Bank, 1051 Global IME)
        var has1050 = await _db.Accounts.AnyAsync(a => a.AccountCode == "1050");
        if (!has1050)
        {
            _db.Accounts.Add(new Account
            {
                HotelId = hotelId,
                AccountCode = "1050",
                AccountName = "Nabil Bank Operating Account",
                AccountType = "ASSET",
                SubCategory = "Bank Accounts",
                NormalBalance = "DEBIT",
                OpeningBalance = 350000,
                CurrentBalance = 350000,
                IsSystemAccount = true,
                Description = "Primary commercial operating bank account",
                BranchOrOutlet = "Kathmandu Main",
                BankName = "Nabil Bank",
                AccountNumber = "01201017500123",
                AccountHolderName = "Everest Family Restaurant Pvt. Ltd."
            });
        }

        var has1051 = await _db.Accounts.AnyAsync(a => a.AccountCode == "1051");
        if (!has1051)
        {
            _db.Accounts.Add(new Account
            {
                HotelId = hotelId,
                AccountCode = "1051",
                AccountName = "Global IME Bank Revenue Account",
                AccountType = "ASSET",
                SubCategory = "Bank Accounts",
                NormalBalance = "DEBIT",
                OpeningBalance = 120000,
                CurrentBalance = 120000,
                Description = "Secondary revenue deposit account",
                BranchOrOutlet = "Pokhara Branch",
                BankName = "Global IME Bank",
                AccountNumber = "0401010002345",
                AccountHolderName = "Everest Family Restaurant Pvt. Ltd."
            });
        }

        // 2. Ensure Digital Wallets exist (1070 eSewa, 1071 Khalti, 1072 IME Pay)
        var has1070 = await _db.Accounts.AnyAsync(a => a.AccountCode == "1070");
        if (!has1070)
        {
            _db.Accounts.Add(new Account
            {
                HotelId = hotelId,
                AccountCode = "1070",
                AccountName = "eSewa Merchant Wallet",
                AccountType = "ASSET",
                SubCategory = "Digital Wallets",
                NormalBalance = "DEBIT",
                OpeningBalance = 0,
                CurrentBalance = 0,
                Description = "eSewa merchant payment collection account",
                BranchOrOutlet = "Main Restaurant",
                WalletProvider = "eSewa",
                MerchantId = "EPAYTEST",
                RegisteredMobileNumber = "9801234567"
            });
        }

        var has1071 = await _db.Accounts.AnyAsync(a => a.AccountCode == "1071");
        if (!has1071)
        {
            _db.Accounts.Add(new Account
            {
                HotelId = hotelId,
                AccountCode = "1071",
                AccountName = "Khalti Merchant Wallet",
                AccountType = "ASSET",
                SubCategory = "Digital Wallets",
                NormalBalance = "DEBIT",
                OpeningBalance = 0,
                CurrentBalance = 0,
                Description = "Khalti merchant payment collection account",
                BranchOrOutlet = "Main Restaurant",
                WalletProvider = "Khalti",
                MerchantId = "KHALTI_MERCH_01",
                RegisteredMobileNumber = "9809876543"
            });
        }

        var has1072 = await _db.Accounts.AnyAsync(a => a.AccountCode == "1072");
        if (!has1072)
        {
            _db.Accounts.Add(new Account
            {
                HotelId = hotelId,
                AccountCode = "1072",
                AccountName = "IME Pay Merchant Wallet",
                AccountType = "ASSET",
                SubCategory = "Digital Wallets",
                NormalBalance = "DEBIT",
                OpeningBalance = 0,
                CurrentBalance = 0,
                Description = "IME Pay merchant payment collection account",
                BranchOrOutlet = "Main Restaurant",
                WalletProvider = "IME Pay",
                MerchantId = "IMEPAY_MERCH_01",
                RegisteredMobileNumber = "9812345678"
            });
        }

        // 3. Ensure Wallet Charges Expense (5710) exists
        var has5710 = await _db.Accounts.AnyAsync(a => a.AccountCode == "5710");
        if (!has5710)
        {
            _db.Accounts.Add(new Account
            {
                HotelId = hotelId,
                AccountCode = "5710",
                AccountName = "Digital Wallet & Gateway Charges",
                AccountType = "EXPENSE",
                SubCategory = "Financial Expense",
                NormalBalance = "DEBIT",
                OpeningBalance = 0,
                CurrentBalance = 0,
                Description = "eSewa, Khalti and payment gateway commission fees"
            });
        }

        await _db.SaveChangesAsync();
    }

    #region 1. Account Overview & List
    [HttpGet]
    public async Task<IActionResult> GetAccounts(
        [FromQuery] string? type, // "ALL", "BANK", "WALLET"
        [FromQuery] string? provider, // "eSewa", "Khalti", etc.
        [FromQuery] string? branch,
        [FromQuery] string? status,
        [FromQuery] string? search,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo)
    {
        var hotelId = await GetHotelIdAsync();
        await EnsureStandardAccountsAsync(hotelId);

        var query = _db.Accounts.Where(a => a.AccountType == "ASSET" &&
            (a.SubCategory == "Bank Accounts" || a.SubCategory == "Digital Wallets"));

        if (!string.IsNullOrWhiteSpace(type) && !type.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            if (type.Equals("BANK", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(a => a.SubCategory == "Bank Accounts");
            }
            else if (type.Equals("WALLET", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(a => a.SubCategory == "Digital Wallets");
            }
        }

        if (!string.IsNullOrWhiteSpace(provider) && !provider.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(a => a.WalletProvider != null && a.WalletProvider.ToLower() == provider.Trim().ToLower());
        }

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
            query = query.Where(a =>
                a.AccountName.ToLower().Contains(s) ||
                a.AccountCode.ToLower().Contains(s) ||
                (a.BankName != null && a.BankName.ToLower().Contains(s)) ||
                (a.WalletProvider != null && a.WalletProvider.ToLower().Contains(s)) ||
                (a.MerchantId != null && a.MerchantId.ToLower().Contains(s)));
        }

        var accounts = await query.OrderBy(a => a.AccountCode).ToListAsync();
        var accountIds = accounts.Select(a => a.Id).ToList();

        // Calculate all-time and period transactions from JournalEntryLine
        var now = DateTime.UtcNow;
        var startUtc = dateFrom.HasValue
            ? DateTime.SpecifyKind(dateFrom.Value.Date, DateTimeKind.Utc)
            : new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var endUtc = dateTo.HasValue
            ? DateTime.SpecifyKind(dateTo.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc)
            : new DateTime(now.Year, now.Month, DateTime.DaysInMonth(now.Year, now.Month), 23, 59, 59, DateTimeKind.Utc);

        var allLines = await _db.JournalEntryLines
            .Include(l => l.JournalEntry)
            .Where(l => accountIds.Contains(l.AccountId) &&
                        l.JournalEntry != null &&
                        (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED"))
            .ToListAsync();

        var periodLines = allLines
            .Where(l => l.JournalEntry!.EntryDate >= startUtc && l.JournalEntry.EntryDate <= endUtc)
            .ToList();

        var bankAccountsList = new List<object>();
        var walletAccountsList = new List<object>();

        double totalBankBal = 0;
        double totalWalletBal = 0;

        foreach (var acc in accounts)
        {
            var accLines = allLines.Where(l => l.AccountId == acc.Id).ToList();
            var totalIn = accLines.Sum(l => l.Debit);
            var totalOut = accLines.Sum(l => l.Credit);
            var curBalance = acc.OpeningBalance + totalIn - totalOut;

            var accPeriodLines = periodLines.Where(l => l.AccountId == acc.Id).ToList();
            var periodIn = accPeriodLines.Sum(l => l.Debit);
            var periodOut = accPeriodLines.Sum(l => l.Credit);

            var isBank = acc.SubCategory == "Bank Accounts";
            if (acc.IsActive)
            {
                if (isBank) totalBankBal += curBalance;
                else totalWalletBal += curBalance;
            }

            var item = new
            {
                id = acc.Id,
                accountCode = acc.AccountCode,
                accountName = acc.AccountName,
                accountType = isBank ? "BANK" : "WALLET",
                subCategory = acc.SubCategory,
                // Bank fields
                bankName = acc.BankName ?? "Commercial Bank",
                accountNumber = MaskString(acc.AccountNumber, 4),
                rawAccountNumber = acc.AccountNumber ?? "",
                accountHolderName = acc.AccountHolderName ?? "Everest Family Restaurant",
                branch = acc.BranchOrOutlet ?? "Main Restaurant",
                // Wallet fields
                walletProvider = acc.WalletProvider ?? "eSewa",
                merchantId = MaskString(acc.MerchantId, 4),
                rawMerchantId = acc.MerchantId ?? "",
                registeredMobileNumber = MaskString(acc.RegisteredMobileNumber, 3),
                directBankSettlement = acc.DirectBankSettlement,
                // Financials
                openingBalance = acc.OpeningBalance,
                openingBalanceDate = acc.OpeningBalanceDate ?? acc.CreatedAt,
                currentBalance = Math.Round(curBalance, 2),
                totalIn = Math.Round(periodIn, 2),
                totalOut = Math.Round(periodOut, 2),
                isActive = acc.IsActive,
                description = acc.Description ?? ""
            };

            if (isBank) bankAccountsList.Add(item);
            else walletAccountsList.Add(item);
        }

        var totalAccountBalance = totalBankBal + totalWalletBal;

        var availableBranches = await _db.Accounts
            .Where(a => (a.SubCategory == "Bank Accounts" || a.SubCategory == "Digital Wallets") && !string.IsNullOrEmpty(a.BranchOrOutlet))
            .Select(a => a.BranchOrOutlet!)
            .Distinct()
            .ToListAsync();

        if (!availableBranches.Contains("Main Restaurant")) availableBranches.Insert(0, "Main Restaurant");
        if (!availableBranches.Contains("Kathmandu Main")) availableBranches.Add("Kathmandu Main");
        if (!availableBranches.Contains("Pokhara Branch")) availableBranches.Add("Pokhara Branch");

        return Ok(ApiResponse.Ok(new
        {
            summary = new
            {
                totalAccountBalance = Math.Round(totalAccountBalance, 2),
                totalBankBalance = Math.Round(totalBankBal, 2),
                totalWalletBalance = Math.Round(totalWalletBal, 2)
            },
            bankAccounts = bankAccountsList,
            digitalWallets = walletAccountsList,
            branches = availableBranches.Distinct().ToList()
        }));
    }

    private static string MaskString(string? value, int keepLast = 4)
    {
        if (string.IsNullOrWhiteSpace(value)) return "—";
        var str = value.Trim();
        if (str.Length <= keepLast) return str;
        var maskedPart = new string('*', str.Length - keepLast);
        var visiblePart = str.Substring(str.Length - keepLast);
        return $"{maskedPart}{visiblePart}";
    }
    #endregion

    #region 2. Account Details & Transaction History
    [HttpGet("{id}")]
    public async Task<IActionResult> GetAccountDetails(string id)
    {
        var acc = await _db.Accounts.FindAsync(id);
        if (acc == null)
        {
            return NotFound(ApiResponse.Fail("Account not found."));
        }

        var lines = await _db.JournalEntryLines
            .Include(l => l.JournalEntry)
            .Where(l => l.AccountId == acc.Id &&
                        l.JournalEntry != null &&
                        (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED"))
            .ToListAsync();

        var totalIn = lines.Sum(l => l.Debit);
        var totalOut = lines.Sum(l => l.Credit);
        var curBalance = acc.OpeningBalance + totalIn - totalOut;

        var isBank = acc.SubCategory == "Bank Accounts";

        return Ok(ApiResponse.Ok(new
        {
            id = acc.Id,
            accountCode = acc.AccountCode,
            accountName = acc.AccountName,
            accountType = isBank ? "BANK" : "WALLET",
            subCategory = acc.SubCategory,
            bankName = acc.BankName ?? "",
            accountNumber = acc.AccountNumber ?? "",
            accountHolderName = acc.AccountHolderName ?? "",
            branch = acc.BranchOrOutlet ?? "Main Restaurant",
            walletProvider = acc.WalletProvider ?? "",
            merchantId = acc.MerchantId ?? "",
            registeredMobileNumber = acc.RegisteredMobileNumber ?? "",
            directBankSettlement = acc.DirectBankSettlement,
            openingBalance = acc.OpeningBalance,
            openingBalanceDate = acc.OpeningBalanceDate ?? acc.CreatedAt,
            currentBalance = Math.Round(curBalance, 2),
            totalIn = Math.Round(totalIn, 2),
            totalOut = Math.Round(totalOut, 2),
            isActive = acc.IsActive,
            description = acc.Description ?? ""
        }));
    }

    [HttpGet("{id}/transactions")]
    public async Task<IActionResult> GetAccountTransactions(
        string id,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] string? type,
        [FromQuery] string? source,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        var acc = await _db.Accounts.FindAsync(id);
        if (acc == null)
        {
            return NotFound(ApiResponse.Fail("Account not found."));
        }

        var now = DateTime.UtcNow;
        var startUtc = fromDate.HasValue
            ? DateTime.SpecifyKind(fromDate.Value.Date, DateTimeKind.Utc)
            : new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var endUtc = toDate.HasValue
            ? DateTime.SpecifyKind(toDate.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc)
            : new DateTime(now.Year, now.Month, DateTime.DaysInMonth(now.Year, now.Month), 23, 59, 59, DateTimeKind.Utc);

        // Period opening balance
        var priorLines = await _db.JournalEntryLines
            .Include(l => l.JournalEntry)
            .Where(l => l.AccountId == acc.Id &&
                        l.JournalEntry != null &&
                        (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED") &&
                        l.JournalEntry.EntryDate < startUtc)
            .ToListAsync();

        var priorOpening = acc.OpeningBalance + priorLines.Sum(l => l.Debit) - priorLines.Sum(l => l.Credit);

        // Fetch lines within period
        var periodQuery = _db.JournalEntryLines
            .Include(l => l.JournalEntry)
            .Where(l => l.AccountId == acc.Id &&
                        l.JournalEntry != null &&
                        (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED") &&
                        l.JournalEntry.EntryDate >= startUtc &&
                        l.JournalEntry.EntryDate <= endUtc);

        var allPeriodLines = await periodQuery
            .OrderBy(l => l.JournalEntry!.EntryDate)
            .ThenBy(l => l.Id)
            .ToListAsync();

        var running = priorOpening;
        var computedList = new List<BankWalletTransactionDto>();

        foreach (var l in allPeriodLines)
        {
            var je = l.JournalEntry!;
            var debit = l.Debit;
            var credit = l.Credit;
            running = running + debit - credit;

            var txnType = DetermineTxnType(je, debit, credit);

            computedList.Add(new BankWalletTransactionDto
            {
                Id = l.Id,
                Date = je.EntryDate,
                ReferenceNumber = !string.IsNullOrWhiteSpace(je.Reference) ? je.Reference : je.EntryNumber,
                EntryNumber = je.EntryNumber,
                Description = !string.IsNullOrWhiteSpace(l.LineDescription) ? l.LineDescription : je.Description,
                TransactionType = txnType,
                Debit = Math.Round(debit, 2),
                Credit = Math.Round(credit, 2),
                RunningBalance = Math.Round(running, 2),
                SourceModule = je.SourceModule,
                Status = je.Status,
                CreatedBy = je.CreatedBy,
                JournalEntryId = je.Id
            });
        }

        var totalDebit = allPeriodLines.Sum(l => l.Debit);
        var totalCredit = allPeriodLines.Sum(l => l.Credit);

        // Filters in-memory
        var filtered = computedList.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(type) && !type.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            filtered = filtered.Where(x => x.TransactionType.Equals(type, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(source) && !source.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            filtered = filtered.Where(x => x.SourceModule.Equals(source, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            filtered = filtered.Where(x =>
                x.ReferenceNumber.ToLower().Contains(s) ||
                x.Description.ToLower().Contains(s) ||
                x.CreatedBy.ToLower().Contains(s) ||
                x.TransactionType.ToLower().Contains(s));
        }

        var filteredList = filtered.ToList();
        var totalRecords = filteredList.Count;

        if (page < 1) page = 1;
        if (pageSize < 5) pageSize = 25;

        var paginated = filteredList
            .OrderByDescending(x => x.Date)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return Ok(ApiResponse.Ok(new
        {
            account = new
            {
                id = acc.Id,
                accountName = acc.AccountName,
                accountCode = acc.AccountCode,
                accountType = acc.SubCategory == "Bank Accounts" ? "BANK" : "WALLET"
            },
            periodOpeningBalance = Math.Round(priorOpening, 2),
            periodClosingBalance = Math.Round(running, 2),
            periodIn = Math.Round(totalDebit, 2),
            periodOut = Math.Round(totalCredit, 2),
            netMovement = Math.Round(totalDebit - totalCredit, 2),
            totalRecords,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling(totalRecords / (double)pageSize),
            transactions = paginated
        }));
    }

    private static string DetermineTxnType(JournalEntry je, double debit, double credit)
    {
        if (je.EntryType == "OPENING") return "OPENING_BALANCE";
        if (je.EntryType == "SETTLEMENT") return "WALLET_SETTLEMENT";
        if (je.EntryType == "TRANSFER") return "TRANSFER";
        if (je.EntryType == "REFUND") return "REFUND";
        if (je.EntryType == "CHARGE") return "CHARGES";

        if (je.SourceModule == "POS_SALE") return "POS_RECEIPT";
        if (je.SourceModule == "CUSTOMER_PAYMENT") return "CUSTOMER_RECEIPT";
        if (je.SourceModule == "PURCHASE" || je.SourceModule == "SUPPLIER_PAYMENT") return "SUPPLIER_PAYMENT";
        if (je.SourceModule == "EXPENSE") return "EXPENSE_PAYMENT";

        if (debit > 0) return "RECEIPT";
        if (credit > 0) return "PAYMENT";
        return "GENERAL_ENTRY";
    }
    #endregion

    #region 3. Add & Edit Account
    public record CreateAccountRequest(
        string AccountName,
        string AccountType, // "BANK" or "WALLET"
        string? AccountCode,
        double OpeningBalance,
        DateTime? OpeningDate,
        string? Branch,
        string? Notes,
        bool IsActive,
        // Bank fields
        string? BankName,
        string? AccountNumber,
        string? AccountHolderName,
        // Wallet fields
        string? WalletProvider,
        string? MerchantId,
        string? RegisteredMobileNumber,
        string? SettlementBankAccountId,
        bool DirectBankSettlement = false);

    [HttpPost]
    public async Task<IActionResult> CreateAccount([FromBody] CreateAccountRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.AccountName))
        {
            return BadRequest(ApiResponse.Fail("Account name is required."));
        }

        var isBank = req.AccountType.Equals("BANK", StringComparison.OrdinalIgnoreCase);
        var subCategory = isBank ? "Bank Accounts" : "Digital Wallets";
        var hotelId = await GetHotelIdAsync();

        // Generate next code if blank
        string code = req.AccountCode?.Trim() ?? "";
        if (string.IsNullOrEmpty(code))
        {
            var prefix = isBank ? "105" : "107";
            var existingCodes = await _db.Accounts
                .Where(a => a.AccountCode.StartsWith(prefix))
                .Select(a => a.AccountCode)
                .ToListAsync();

            int nextNum = isBank ? 2 : 3;
            while (existingCodes.Contains($"{prefix}{nextNum}"))
            {
                nextNum++;
            }
            code = $"{prefix}{nextNum}";
        }
        else
        {
            var codeExists = await _db.Accounts.AnyAsync(a => a.AccountCode == code);
            if (codeExists)
            {
                return BadRequest(ApiResponse.Fail($"Account code '{code}' already exists."));
            }
        }

        var account = new Account
        {
            HotelId = hotelId,
            AccountCode = code,
            AccountName = req.AccountName.Trim(),
            AccountType = "ASSET",
            SubCategory = subCategory,
            NormalBalance = "DEBIT",
            BranchOrOutlet = string.IsNullOrWhiteSpace(req.Branch) ? "Main Restaurant" : req.Branch.Trim(),
            Description = req.Notes,
            OpeningBalance = req.OpeningBalance >= 0 ? req.OpeningBalance : 0,
            OpeningBalanceDate = req.OpeningDate ?? DateTime.UtcNow,
            CurrentBalance = req.OpeningBalance >= 0 ? req.OpeningBalance : 0,
            IsActive = req.IsActive,
            // Bank fields
            BankName = isBank ? req.BankName?.Trim() : null,
            AccountNumber = isBank ? req.AccountNumber?.Trim() : null,
            AccountHolderName = isBank ? req.AccountHolderName?.Trim() : null,
            // Wallet fields
            WalletProvider = !isBank ? (req.WalletProvider?.Trim() ?? "eSewa") : null,
            MerchantId = !isBank ? req.MerchantId?.Trim() : null,
            RegisteredMobileNumber = !isBank ? req.RegisteredMobileNumber?.Trim() : null,
            SettlementBankAccountId = !isBank ? req.SettlementBankAccountId : null,
            DirectBankSettlement = !isBank && req.DirectBankSettlement
        };

        _db.Accounts.Add(account);
        await _db.SaveChangesAsync();

        // If opening balance > 0, post balanced opening journal entry
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
                    EntryDate = req.OpeningDate ?? DateTime.UtcNow,
                    EntryType = "OPENING",
                    Reference = code,
                    Description = $"Opening balance for {account.AccountName} ({code})",
                    TotalDebit = req.OpeningBalance,
                    TotalCredit = req.OpeningBalance,
                    Status = "POSTED",
                    SourceModule = "OPENING",
                    CreatedBy = "Admin",
                    Lines = new List<JournalEntryLine>
                    {
                        new JournalEntryLine
                        {
                            AccountId = account.Id,
                            AccountCode = account.AccountCode,
                            AccountName = account.AccountName,
                            LineDescription = "Opening Account Balance",
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

        return Ok(ApiResponse.Ok(account, "Account created successfully."));
    }

    public record UpdateAccountRequest(
        string AccountName,
        string? Branch,
        string? Notes,
        bool IsActive,
        string? BankName,
        string? AccountNumber,
        string? AccountHolderName,
        string? WalletProvider,
        string? MerchantId,
        string? RegisteredMobileNumber,
        bool DirectBankSettlement = false);

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAccount(string id, [FromBody] UpdateAccountRequest req)
    {
        var acc = await _db.Accounts.FindAsync(id);
        if (acc == null)
        {
            return NotFound(ApiResponse.Fail("Account not found."));
        }

        acc.AccountName = req.AccountName.Trim();
        acc.BranchOrOutlet = req.Branch?.Trim() ?? acc.BranchOrOutlet;
        acc.Description = req.Notes;
        acc.IsActive = req.IsActive;

        if (acc.SubCategory == "Bank Accounts")
        {
            acc.BankName = req.BankName?.Trim();
            acc.AccountNumber = req.AccountNumber?.Trim();
            acc.AccountHolderName = req.AccountHolderName?.Trim();
        }
        else
        {
            acc.WalletProvider = req.WalletProvider?.Trim();
            acc.MerchantId = req.MerchantId?.Trim();
            acc.RegisteredMobileNumber = req.RegisteredMobileNumber?.Trim();
            acc.DirectBankSettlement = req.DirectBankSettlement;
        }

        acc.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(acc, "Account updated successfully."));
    }
    #endregion

    #region 4. Transactions: Settlement, Transfer, Charges
    public record RecordSettlementRequest(
        string WalletAccountId,
        string DestinationBankAccountId,
        double GrossAmount,
        double WalletCharges,
        double OtherDeductions,
        DateTime SettlementDate,
        string SettlementReference,
        string? BankReference,
        string? Description);

    [HttpPost("settlement")]
    public async Task<IActionResult> RecordSettlement([FromBody] RecordSettlementRequest req)
    {
        if (req.GrossAmount <= 0)
        {
            return BadRequest(ApiResponse.Fail("Gross settlement amount must be greater than zero."));
        }

        var walletAcc = await _db.Accounts.FindAsync(req.WalletAccountId);
        var bankAcc = await _db.Accounts.FindAsync(req.DestinationBankAccountId);

        if (walletAcc == null || walletAcc.SubCategory != "Digital Wallets")
        {
            return BadRequest(ApiResponse.Fail("Valid digital wallet account is required."));
        }
        if (bankAcc == null || bankAcc.SubCategory != "Bank Accounts")
        {
            return BadRequest(ApiResponse.Fail("Valid destination bank account is required."));
        }

        // Validate available wallet balance
        var walletLines = await _db.JournalEntryLines
            .Where(l => l.AccountId == walletAcc.Id &&
                        l.JournalEntry != null &&
                        (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED"))
            .ToListAsync();

        var currentWalletBal = walletAcc.OpeningBalance + walletLines.Sum(l => l.Debit) - walletLines.Sum(l => l.Credit);

        if (currentWalletBal < req.GrossAmount)
        {
            return BadRequest(ApiResponse.Fail($"Insufficient wallet balance in {walletAcc.AccountName}. Available: Rs. {currentWalletBal:N2}, requested settlement: Rs. {req.GrossAmount:N2}."));
        }

        var charges = req.WalletCharges >= 0 ? req.WalletCharges : 0;
        var deductions = req.OtherDeductions >= 0 ? req.OtherDeductions : 0;
        var netSettlement = req.GrossAmount - charges - deductions;

        if (netSettlement <= 0)
        {
            return BadRequest(ApiResponse.Fail("Net settlement amount must be greater than zero after charges."));
        }

        var hotelId = await GetHotelIdAsync();
        var settlementNumber = $"STLM-{DateTime.UtcNow.Year}-{Random.Shared.Next(10000, 99999)}";

        // Charges expense account (5710)
        var chargesAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "5710")
                         ?? await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "5700");

        var jeLines = new List<JournalEntryLine>
        {
            // Debit Bank Account (Net received)
            new JournalEntryLine
            {
                AccountId = bankAcc.Id,
                AccountCode = bankAcc.AccountCode,
                AccountName = bankAcc.AccountName,
                LineDescription = $"Wallet Settlement: {walletAcc.AccountName} (Payout Ref: {req.SettlementReference})",
                Debit = netSettlement,
                Credit = 0
            }
        };

        if (charges > 0 && chargesAcc != null)
        {
            // Debit Wallet Charges Expense
            jeLines.Add(new JournalEntryLine
            {
                AccountId = chargesAcc.Id,
                AccountCode = chargesAcc.AccountCode,
                AccountName = chargesAcc.AccountName,
                LineDescription = $"Merchant discount rate / wallet fee on settlement {settlementNumber}",
                Debit = charges,
                Credit = 0
            });
        }

        // Credit Wallet Account (Gross amount swept)
        jeLines.Add(new JournalEntryLine
        {
            AccountId = walletAcc.Id,
            AccountCode = walletAcc.AccountCode,
            AccountName = walletAcc.AccountName,
            LineDescription = $"Settlement payout to {bankAcc.AccountName} ({settlementNumber})",
            Debit = 0,
            Credit = req.GrossAmount
        });

        var je = new JournalEntry
        {
            HotelId = hotelId,
            EntryNumber = settlementNumber,
            EntryDate = req.SettlementDate != default ? DateTime.SpecifyKind(req.SettlementDate, DateTimeKind.Utc) : DateTime.UtcNow,
            EntryType = "SETTLEMENT",
            Reference = req.SettlementReference,
            Description = !string.IsNullOrWhiteSpace(req.Description) ? req.Description : $"Settlement of Rs. {req.GrossAmount:N2} from {walletAcc.AccountName} to {bankAcc.AccountName}",
            TotalDebit = req.GrossAmount,
            TotalCredit = req.GrossAmount,
            Status = "POSTED",
            SourceModule = "WALLET_SETTLEMENT",
            CreatedBy = "Admin",
            Lines = jeLines
        };

        _db.JournalEntries.Add(je);
        walletAcc.CurrentBalance -= req.GrossAmount;
        bankAcc.CurrentBalance += netSettlement;
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            settlementNumber,
            grossAmount = req.GrossAmount,
            charges,
            netSettlement,
            walletAccount = walletAcc.AccountName,
            bankAccount = bankAcc.AccountName,
            journalEntryId = je.Id
        }, $"Settlement of Rs. {netSettlement:N2} posted to {bankAcc.AccountName} successfully."));
    }

    public record TransferRequest(
        string FromAccountId,
        string ToAccountId,
        double Amount,
        DateTime Date,
        string? Reference,
        string? Description);

    [HttpPost("transfer")]
    public async Task<IActionResult> TransferFunds([FromBody] TransferRequest req)
    {
        if (req.Amount <= 0)
        {
            return BadRequest(ApiResponse.Fail("Transfer amount must be greater than zero."));
        }
        if (req.FromAccountId == req.ToAccountId)
        {
            return BadRequest(ApiResponse.Fail("Source and destination accounts must be distinct."));
        }

        var fromAcc = await _db.Accounts.FindAsync(req.FromAccountId);
        var toAcc = await _db.Accounts.FindAsync(req.ToAccountId);

        if (fromAcc == null || !fromAcc.IsActive)
        {
            return BadRequest(ApiResponse.Fail("Source account not found or inactive."));
        }
        if (toAcc == null || !toAcc.IsActive)
        {
            return BadRequest(ApiResponse.Fail("Destination account not found or inactive."));
        }

        var hotelId = await GetHotelIdAsync();
        var transferNo = $"TRF-{DateTime.UtcNow.Year}-{Random.Shared.Next(10000, 99999)}";

        var je = new JournalEntry
        {
            HotelId = hotelId,
            EntryNumber = transferNo,
            EntryDate = req.Date != default ? DateTime.SpecifyKind(req.Date, DateTimeKind.Utc) : DateTime.UtcNow,
            EntryType = "TRANSFER",
            Reference = req.Reference ?? transferNo,
            Description = !string.IsNullOrWhiteSpace(req.Description) ? req.Description : $"Transfer from {fromAcc.AccountName} to {toAcc.AccountName}",
            TotalDebit = req.Amount,
            TotalCredit = req.Amount,
            Status = "POSTED",
            SourceModule = "BANK_TRANSFER",
            CreatedBy = "Admin",
            Lines = new List<JournalEntryLine>
            {
                new JournalEntryLine
                {
                    AccountId = toAcc.Id,
                    AccountCode = toAcc.AccountCode,
                    AccountName = toAcc.AccountName,
                    LineDescription = $"Transfer in from {fromAcc.AccountName}",
                    Debit = req.Amount,
                    Credit = 0
                },
                new JournalEntryLine
                {
                    AccountId = fromAcc.Id,
                    AccountCode = fromAcc.AccountCode,
                    AccountName = fromAcc.AccountName,
                    LineDescription = $"Transfer out to {toAcc.AccountName}",
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
            transferNumber = transferNo,
            amount = req.Amount,
            fromAccount = fromAcc.AccountName,
            toAccount = toAcc.AccountName,
            journalEntryId = je.Id
        }, $"Successfully transferred Rs. {req.Amount:N2}."));
    }

    public record RecordChargeRequest(
        string AccountId,
        double Amount,
        DateTime Date,
        string ChargeType,
        string? Reference,
        string? Description);

    [HttpPost("charges")]
    public async Task<IActionResult> RecordCharge([FromBody] RecordChargeRequest req)
    {
        if (req.Amount <= 0)
        {
            return BadRequest(ApiResponse.Fail("Charge amount must be greater than zero."));
        }

        var acc = await _db.Accounts.FindAsync(req.AccountId);
        if (acc == null || !acc.IsActive)
        {
            return BadRequest(ApiResponse.Fail("Active account not found."));
        }

        var hotelId = await GetHotelIdAsync();
        var isWallet = acc.SubCategory == "Digital Wallets";
        var expenseCode = isWallet ? "5710" : "5700";

        var expenseAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == expenseCode)
                         ?? await _db.Accounts.FirstOrDefaultAsync(a => a.AccountType == "EXPENSE");

        var voucherNo = $"CHG-{DateTime.UtcNow.Year}-{Random.Shared.Next(10000, 99999)}";

        var je = new JournalEntry
        {
            HotelId = hotelId,
            EntryNumber = voucherNo,
            EntryDate = req.Date != default ? DateTime.SpecifyKind(req.Date, DateTimeKind.Utc) : DateTime.UtcNow,
            EntryType = "CHARGE",
            Reference = req.Reference ?? voucherNo,
            Description = !string.IsNullOrWhiteSpace(req.Description) ? req.Description : $"{req.ChargeType} on {acc.AccountName}",
            TotalDebit = req.Amount,
            TotalCredit = req.Amount,
            Status = "POSTED",
            SourceModule = "BANK_CHARGES",
            CreatedBy = "Admin",
            Lines = new List<JournalEntryLine>
            {
                new JournalEntryLine
                {
                    AccountId = expenseAcc?.Id ?? acc.Id,
                    AccountCode = expenseAcc?.AccountCode ?? expenseCode,
                    AccountName = expenseAcc?.AccountName ?? "Bank / Gateway Charges",
                    LineDescription = $"{req.ChargeType}: {acc.AccountName}",
                    Debit = req.Amount,
                    Credit = 0
                },
                new JournalEntryLine
                {
                    AccountId = acc.Id,
                    AccountCode = acc.AccountCode,
                    AccountName = acc.AccountName,
                    LineDescription = $"Charge deducted: {req.ChargeType}",
                    Debit = 0,
                    Credit = req.Amount
                }
            }
        };

        _db.JournalEntries.Add(je);
        acc.CurrentBalance -= req.Amount;
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            voucherNumber = voucherNo,
            amount = req.Amount,
            accountName = acc.AccountName,
            journalEntryId = je.Id
        }, "Charge recorded successfully."));
    }
    #endregion
}

public class BankWalletTransactionDto
{
    public string Id { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string ReferenceNumber { get; set; } = string.Empty;
    public string EntryNumber { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string TransactionType { get; set; } = string.Empty;
    public double Debit { get; set; }
    public double Credit { get; set; }
    public double RunningBalance { get; set; }
    public string SourceModule { get; set; } = string.Empty;
    public string Status { get; set; } = "POSTED";
    public string CreatedBy { get; set; } = string.Empty;
    public string JournalEntryId { get; set; } = string.Empty;
}


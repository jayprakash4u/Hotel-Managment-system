using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/accounts")]
public class AccountsController : ControllerBase
{
    private readonly HospitalityDbContext _db;
    private readonly ILogger<AccountsController> _logger;

    public AccountsController(HospitalityDbContext db, ILogger<AccountsController> logger)
    {
        _db = db;
        _logger = logger;
    }

    #region Default Chart of Accounts Definition
    public static List<Account> GetStandardHospitalityAccounts(string hotelId)
    {
        return new List<Account>
        {
            // ASSETS (1000 - 1999)
            new Account { HotelId = hotelId, AccountCode = "1010", AccountName = "Front Desk Cash Drawer", AccountType = "ASSET", SubCategory = "Cash & Cash Equivalents", NormalBalance = "DEBIT", OpeningBalance = 25000, CurrentBalance = 25000, IsSystemAccount = true, Description = "Cash float kept at front desk reception", BranchOrOutlet = "Front Desk" },
            new Account { HotelId = hotelId, AccountCode = "1020", AccountName = "Restaurant POS Cash Drawer", AccountType = "ASSET", SubCategory = "Cash & Cash Equivalents", NormalBalance = "DEBIT", OpeningBalance = 15000, CurrentBalance = 15000, IsSystemAccount = true, Description = "Restaurant register cash on hand", BranchOrOutlet = "Main Restaurant" },
            new Account { HotelId = hotelId, AccountCode = "1030", AccountName = "Petty Cash Fund", AccountType = "ASSET", SubCategory = "Cash & Cash Equivalents", NormalBalance = "DEBIT", OpeningBalance = 10000, CurrentBalance = 10000, Description = "Office & emergency petty expenses", BranchOrOutlet = "Central Kitchen" },
            new Account { HotelId = hotelId, AccountCode = "1040", AccountName = "Main Cash Safe & Vault", AccountType = "ASSET", SubCategory = "Cash & Cash Equivalents", NormalBalance = "DEBIT", OpeningBalance = 50000, CurrentBalance = 50000, Description = "Central safe for daily cash drops and manager reserve", BranchOrOutlet = "Manager Safe" },
            new Account { HotelId = hotelId, AccountCode = "1050", AccountName = "Nabil Bank Operating Account", AccountType = "ASSET", SubCategory = "Bank Accounts", NormalBalance = "DEBIT", OpeningBalance = 350000, CurrentBalance = 350000, IsSystemAccount = true, Description = "Primary commercial operating bank account", BranchOrOutlet = "Kathmandu Main", BankName = "Nabil Bank", AccountNumber = "01201017500123", AccountHolderName = "Everest Family Restaurant Pvt. Ltd." },
            new Account { HotelId = hotelId, AccountCode = "1051", AccountName = "Global IME Bank Revenue Account", AccountType = "ASSET", SubCategory = "Bank Accounts", NormalBalance = "DEBIT", OpeningBalance = 120000, CurrentBalance = 120000, Description = "Secondary revenue deposit account", BranchOrOutlet = "Pokhara Branch", BankName = "Global IME Bank", AccountNumber = "0401010002345", AccountHolderName = "Everest Family Restaurant Pvt. Ltd." },
            new Account { HotelId = hotelId, AccountCode = "1070", AccountName = "eSewa Merchant Wallet", AccountType = "ASSET", SubCategory = "Digital Wallets", NormalBalance = "DEBIT", OpeningBalance = 0, CurrentBalance = 0, Description = "eSewa merchant payment collection account", BranchOrOutlet = "Main Restaurant", WalletProvider = "eSewa", MerchantId = "EPAYTEST", RegisteredMobileNumber = "9801234567" },
            new Account { HotelId = hotelId, AccountCode = "1071", AccountName = "Khalti Merchant Wallet", AccountType = "ASSET", SubCategory = "Digital Wallets", NormalBalance = "DEBIT", OpeningBalance = 0, CurrentBalance = 0, Description = "Khalti merchant payment collection account", BranchOrOutlet = "Main Restaurant", WalletProvider = "Khalti", MerchantId = "KHALTI_MERCH_01", RegisteredMobileNumber = "9809876543" },
            new Account { HotelId = hotelId, AccountCode = "1072", AccountName = "IME Pay Merchant Wallet", AccountType = "ASSET", SubCategory = "Digital Wallets", NormalBalance = "DEBIT", OpeningBalance = 0, CurrentBalance = 0, Description = "IME Pay merchant payment collection account", BranchOrOutlet = "Main Restaurant", WalletProvider = "IME Pay", MerchantId = "IMEPAY_MERCH_01", RegisteredMobileNumber = "9812345678" },
            new Account { HotelId = hotelId, AccountCode = "1060", AccountName = "Card & QR Settlement Clearing", AccountType = "ASSET", SubCategory = "Cash & Cash Equivalents", NormalBalance = "DEBIT", OpeningBalance = 0, CurrentBalance = 0, Description = "Pending card swipe and digital wallet settlements", BranchOrOutlet = "Finance Desk" },
            new Account { HotelId = hotelId, AccountCode = "1100", AccountName = "Accounts Receivable - Guest Folios", AccountType = "ASSET", SubCategory = "Receivables", NormalBalance = "DEBIT", OpeningBalance = 0, CurrentBalance = 0, IsSystemAccount = true, Description = "Unsettled in-house guest room charges" },
            new Account { HotelId = hotelId, AccountCode = "1110", AccountName = "Accounts Receivable - Corporate & Travel Agents", AccountType = "ASSET", SubCategory = "Receivables", NormalBalance = "DEBIT", OpeningBalance = 0, CurrentBalance = 0, Description = "Direct billing to corporate travel partners" },
            new Account { HotelId = hotelId, AccountCode = "1200", AccountName = "Food & Beverage Inventory Asset", AccountType = "ASSET", SubCategory = "Inventory", NormalBalance = "DEBIT", OpeningBalance = 85000, CurrentBalance = 85000, IsSystemAccount = true, Description = "Raw materials, food ingredients & beverage stock" },
            new Account { HotelId = hotelId, AccountCode = "1210", AccountName = "Hotel Operating Supplies Inventory", AccountType = "ASSET", SubCategory = "Inventory", NormalBalance = "DEBIT", OpeningBalance = 30000, CurrentBalance = 30000, Description = "Linens, room amenities and cleaning items stock" },
            new Account { HotelId = hotelId, AccountCode = "1500", AccountName = "Hotel Furniture & Fixtures", AccountType = "ASSET", SubCategory = "Property & Equipment", NormalBalance = "DEBIT", OpeningBalance = 1200000, CurrentBalance = 1200000, Description = "Beds, dressers, dining tables and banquet chairs" },
            new Account { HotelId = hotelId, AccountCode = "1510", AccountName = "Kitchen & Restaurant Equipment", AccountType = "ASSET", SubCategory = "Property & Equipment", NormalBalance = "DEBIT", OpeningBalance = 650000, CurrentBalance = 650000, Description = "Commercial ovens, freezers, cooktops and blenders" },

            // LIABILITIES (2000 - 2999)
            new Account { HotelId = hotelId, AccountCode = "2010", AccountName = "Accounts Payable - Suppliers & Vendors", AccountType = "LIABILITY", SubCategory = "Payables", NormalBalance = "CREDIT", OpeningBalance = 45000, CurrentBalance = 45000, IsSystemAccount = true, Description = "Pending payments to food and amenities vendors" },
            new Account { HotelId = hotelId, AccountCode = "2020", AccountName = "Guest Advance Reservation Deposits", AccountType = "LIABILITY", SubCategory = "Customer Advances", NormalBalance = "CREDIT", OpeningBalance = 20000, CurrentBalance = 20000, IsSystemAccount = true, Description = "Advance booking payments held before check-in" },
            new Account { HotelId = hotelId, AccountCode = "2050", AccountName = "VAT / Sales Tax Collected Payable", AccountType = "LIABILITY", SubCategory = "Tax Liabilities", NormalBalance = "CREDIT", OpeningBalance = 0, CurrentBalance = 0, IsSystemAccount = true, Description = "Government tax collected from customers" },
            new Account { HotelId = hotelId, AccountCode = "2060", AccountName = "Staff Service Charge Payable", AccountType = "LIABILITY", SubCategory = "Payroll & Tips", NormalBalance = "CREDIT", OpeningBalance = 0, CurrentBalance = 0, Description = "10% service charge pool distributed to staff" },
            new Account { HotelId = hotelId, AccountCode = "2100", AccountName = "Accrued Staff Salaries & Wages", AccountType = "LIABILITY", SubCategory = "Payroll & Tips", NormalBalance = "CREDIT", OpeningBalance = 0, CurrentBalance = 0, Description = "Earned staff payroll payable at month end" },

            // EQUITY (3000 - 3999)
            new Account { HotelId = hotelId, AccountCode = "3010", AccountName = "Owner's Capital Contribution", AccountType = "EQUITY", SubCategory = "Owner's Equity", NormalBalance = "CREDIT", OpeningBalance = 2000000, CurrentBalance = 2000000, IsSystemAccount = true, Description = "Capital invested by hotel owners" },
            new Account { HotelId = hotelId, AccountCode = "3020", AccountName = "Retained Earnings", AccountType = "EQUITY", SubCategory = "Retained Earnings", NormalBalance = "CREDIT", OpeningBalance = 345000, CurrentBalance = 345000, IsSystemAccount = true, Description = "Accumulated business profits" },

            // REVENUE (4000 - 4999)
            new Account { HotelId = hotelId, AccountCode = "4010", AccountName = "Room Revenue - Standard & Deluxe", AccountType = "REVENUE", SubCategory = "Operating Revenue", NormalBalance = "CREDIT", OpeningBalance = 0, CurrentBalance = 0, IsSystemAccount = true, Description = "Accommodation sales from guest rooms" },
            new Account { HotelId = hotelId, AccountCode = "4020", AccountName = "Room Revenue - Suites & Executive", AccountType = "REVENUE", SubCategory = "Operating Revenue", NormalBalance = "CREDIT", OpeningBalance = 0, CurrentBalance = 0, Description = "Accommodation sales from premium suites" },
            new Account { HotelId = hotelId, AccountCode = "4100", AccountName = "Food & Dining Revenue", AccountType = "REVENUE", SubCategory = "Operating Revenue", NormalBalance = "CREDIT", OpeningBalance = 0, CurrentBalance = 0, IsSystemAccount = true, Description = "Restaurant, cafe and in-room dining food sales" },
            new Account { HotelId = hotelId, AccountCode = "4110", AccountName = "Beverage & Bar Revenue", AccountType = "REVENUE", SubCategory = "Operating Revenue", NormalBalance = "CREDIT", OpeningBalance = 0, CurrentBalance = 0, Description = "Cold drinks, mocktails, coffee and juices" },
            new Account { HotelId = hotelId, AccountCode = "4200", AccountName = "Laundry & Valet Service Revenue", AccountType = "REVENUE", SubCategory = "Ancillary Revenue", NormalBalance = "CREDIT", OpeningBalance = 0, CurrentBalance = 0, Description = "Guest dry cleaning and express laundry" },
            new Account { HotelId = hotelId, AccountCode = "4300", AccountName = "Banquet, Conference & Event Hall Revenue", AccountType = "REVENUE", SubCategory = "Ancillary Revenue", NormalBalance = "CREDIT", OpeningBalance = 0, CurrentBalance = 0, Description = "Hall rentals and catering packages" },
            new Account { HotelId = hotelId, AccountCode = "4900", AccountName = "Miscellaneous Income", AccountType = "REVENUE", SubCategory = "Other Revenue", NormalBalance = "CREDIT", OpeningBalance = 0, CurrentBalance = 0, Description = "Printing, airport transfer and extra fees" },

            // EXPENSES (5000 - 5999)
            new Account { HotelId = hotelId, AccountCode = "5010", AccountName = "Cost of Goods Sold - Food Ingredients", AccountType = "EXPENSE", SubCategory = "Direct Cost", NormalBalance = "DEBIT", OpeningBalance = 0, CurrentBalance = 0, IsSystemAccount = true, Description = "Purchases of poultry, vegetables, dairy and groceries" },
            new Account { HotelId = hotelId, AccountCode = "5020", AccountName = "Cost of Goods Sold - Beverages & Syrups", AccountType = "EXPENSE", SubCategory = "Direct Cost", NormalBalance = "DEBIT", OpeningBalance = 0, CurrentBalance = 0, Description = "Coffee beans, tea leaves and beverage cans" },
            new Account { HotelId = hotelId, AccountCode = "5100", AccountName = "Staff Payroll & Wages", AccountType = "EXPENSE", SubCategory = "Operating Expense", NormalBalance = "DEBIT", OpeningBalance = 0, CurrentBalance = 0, Description = "Hotel front desk, kitchen and housekeeping salaries" },
            new Account { HotelId = hotelId, AccountCode = "5200", AccountName = "Housekeeping & Linen Cleaning Supplies", AccountType = "EXPENSE", SubCategory = "Operating Expense", NormalBalance = "DEBIT", OpeningBalance = 0, CurrentBalance = 0, Description = "Detergents, disinfectants and room toiletries" },
            new Account { HotelId = hotelId, AccountCode = "5300", AccountName = "Electricity & Power Utilities", AccountType = "EXPENSE", SubCategory = "Utilities", NormalBalance = "DEBIT", OpeningBalance = 0, CurrentBalance = 0, Description = "Monthly electric grid & generator fuel charges" },
            new Account { HotelId = hotelId, AccountCode = "5310", AccountName = "Water & Waste Management", AccountType = "EXPENSE", SubCategory = "Utilities", NormalBalance = "DEBIT", OpeningBalance = 0, CurrentBalance = 0, Description = "Municipal water supply and trash disposal" },
            new Account { HotelId = hotelId, AccountCode = "5400", AccountName = "Repairs, Maintenance & Painting", AccountType = "EXPENSE", SubCategory = "Operating Expense", NormalBalance = "DEBIT", OpeningBalance = 0, CurrentBalance = 0, Description = "Plumbing, electrical and AC maintenance" },
            new Account { HotelId = hotelId, AccountCode = "5450", AccountName = "Cash Shortage / Reconciliation Loss", AccountType = "EXPENSE", SubCategory = "Operating Expense", NormalBalance = "DEBIT", OpeningBalance = 0, CurrentBalance = 0, Description = "Cash register shortage discrepancies" },
            new Account { HotelId = hotelId, AccountCode = "5500", AccountName = "OTA Booking Commissions & Marketing", AccountType = "EXPENSE", SubCategory = "Selling & Marketing", NormalBalance = "DEBIT", OpeningBalance = 0, CurrentBalance = 0, Description = "Booking.com, Agoda commissions and social media ads" },
            new Account { HotelId = hotelId, AccountCode = "5600", AccountName = "Internet, Cloud Software & IT Subscriptions", AccountType = "EXPENSE", SubCategory = "Administrative", NormalBalance = "DEBIT", OpeningBalance = 0, CurrentBalance = 0, Description = "High-speed Wi-Fi and hospitality software" },
            new Account { HotelId = hotelId, AccountCode = "5700", AccountName = "Bank Charges & POS Processing Fees", AccountType = "EXPENSE", SubCategory = "Financial Expense", NormalBalance = "DEBIT", OpeningBalance = 0, CurrentBalance = 0, Description = "Card merchant charges and bank maintenance fees" },
            new Account { HotelId = hotelId, AccountCode = "5710", AccountName = "Digital Wallet & Gateway Charges", AccountType = "EXPENSE", SubCategory = "Financial Expense", NormalBalance = "DEBIT", OpeningBalance = 0, CurrentBalance = 0, Description = "eSewa, Khalti and payment gateway commission fees" }
        };
    }
    #endregion

    #region 1. Chart of Accounts Endpoints

    [HttpGet("chart")]
    public async Task<IActionResult> GetChartOfAccounts([FromQuery] string? type, [FromQuery] string? search, [FromQuery] bool activeOnly = false)
    {
        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? "hotel-default";

        var count = await _db.Accounts.CountAsync();
        if (count == 0)
        {
            var seedList = GetStandardHospitalityAccounts(hotelId);
            _db.Accounts.AddRange(seedList);
            await _db.SaveChangesAsync();
        }

        var query = _db.Accounts.AsQueryable();

        if (!string.IsNullOrEmpty(type) && !type.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(a => a.AccountType == type.ToUpper());
        }

        if (activeOnly)
        {
            query = query.Where(a => a.IsActive);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(a =>
                a.AccountCode.ToLower().Contains(s) ||
                a.AccountName.ToLower().Contains(s) ||
                (a.Description != null && a.Description.ToLower().Contains(s)) ||
                a.SubCategory.ToLower().Contains(s));
        }

        var accounts = await query
            .OrderBy(a => a.AccountCode)
            .ToListAsync();

        var totalAssets = accounts.Where(a => a.AccountType == "ASSET").Sum(a => a.CurrentBalance);
        var totalLiabilities = accounts.Where(a => a.AccountType == "LIABILITY").Sum(a => a.CurrentBalance);
        var totalEquity = accounts.Where(a => a.AccountType == "EQUITY").Sum(a => a.CurrentBalance);
        var totalRevenue = accounts.Where(a => a.AccountType == "REVENUE").Sum(a => a.CurrentBalance);
        var totalExpenses = accounts.Where(a => a.AccountType == "EXPENSE").Sum(a => a.CurrentBalance);

        return Ok(ApiResponse.Ok(new
        {
            accounts,
            summary = new
            {
                totalAccounts = accounts.Count,
                totalAssets,
                totalLiabilities,
                totalEquity,
                totalRevenue,
                totalExpenses,
                netProfitLoss = totalRevenue - totalExpenses
            }
        }));
    }

    public record CreateAccountDto(
        string AccountCode,
        string AccountName,
        string AccountType,
        string? SubCategory,
        string? NormalBalance,
        double OpeningBalance,
        string? Description
    );

    [HttpPost("chart")]
    public async Task<IActionResult> CreateAccount([FromBody] CreateAccountDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.AccountCode) || string.IsNullOrWhiteSpace(dto.AccountName))
        {
            return BadRequest(ApiResponse.Fail("Account Code and Account Name are required."));
        }

        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? "hotel-default";

        var exists = await _db.Accounts.AnyAsync(a => a.AccountCode == dto.AccountCode.Trim());
        if (exists)
        {
            return BadRequest(ApiResponse.Fail($"Account with code '{dto.AccountCode}' already exists."));
        }

        var type = (dto.AccountType ?? "ASSET").ToUpper();
        var normalBalance = dto.NormalBalance;
        if (string.IsNullOrEmpty(normalBalance))
        {
            normalBalance = (type == "ASSET" || type == "EXPENSE") ? "DEBIT" : "CREDIT";
        }

        var account = new Account
        {
            HotelId = hotelId,
            AccountCode = dto.AccountCode.Trim(),
            AccountName = dto.AccountName.Trim(),
            AccountType = type,
            SubCategory = string.IsNullOrWhiteSpace(dto.SubCategory) ? "General" : dto.SubCategory.Trim(),
            NormalBalance = normalBalance.ToUpper(),
            OpeningBalance = dto.OpeningBalance,
            CurrentBalance = dto.OpeningBalance,
            Description = dto.Description?.Trim(),
            IsActive = true,
            IsSystemAccount = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Accounts.Add(account);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(account, "Account created successfully."));
    }

    public record UpdateAccountDto(
        string AccountName,
        string? SubCategory,
        string? Description,
        bool? IsActive
    );

    [HttpPut("chart/{id}")]
    public async Task<IActionResult> UpdateAccount(string id, [FromBody] UpdateAccountDto dto)
    {
        var account = await _db.Accounts.FindAsync(id);
        if (account == null)
        {
            return NotFound(ApiResponse.Fail("Account not found."));
        }

        if (!string.IsNullOrWhiteSpace(dto.AccountName))
        {
            account.AccountName = dto.AccountName.Trim();
        }
        if (dto.SubCategory != null)
        {
            account.SubCategory = dto.SubCategory.Trim();
        }
        if (dto.Description != null)
        {
            account.Description = dto.Description.Trim();
        }
        if (dto.IsActive.HasValue)
        {
            account.IsActive = dto.IsActive.Value;
        }

        account.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(account, "Account updated successfully."));
    }

    [HttpDelete("chart/{id}")]
    public async Task<IActionResult> DeleteAccount(string id)
    {
        var account = await _db.Accounts.FindAsync(id);
        if (account == null)
        {
            return NotFound(ApiResponse.Fail("Account not found."));
        }

        if (account.IsSystemAccount)
        {
            return BadRequest(ApiResponse.Fail("System core accounts cannot be deleted. You can deactivate them instead."));
        }

        var hasTransactions = await _db.JournalEntryLines.AnyAsync(l => l.AccountId == id);
        if (hasTransactions)
        {
            account.IsActive = false;
            account.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(ApiResponse.Ok(account, "Account has journal transaction history and has been deactivated instead of deleted."));
        }

        _db.Accounts.Remove(account);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new { id }, "Account deleted successfully."));
    }

    [HttpPost("chart/seed-default")]
    public async Task<IActionResult> SeedDefaultAccounts()
    {
        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? "hotel-default";

        var standardAccounts = GetStandardHospitalityAccounts(hotelId);
        int added = 0;

        foreach (var sa in standardAccounts)
        {
            var exists = await _db.Accounts.AnyAsync(a => a.AccountCode == sa.AccountCode);
            if (!exists)
            {
                _db.Accounts.Add(sa);
                added++;
            }
        }

        if (added > 0)
        {
            await _db.SaveChangesAsync();
        }

        return Ok(ApiResponse.Ok(new { added }, $"Successfully seeded {added} hospitality standard accounts."));
    }

    #endregion

    #region 2. Journal Entries Endpoints

    public record JournalEntryLineDto(
        string AccountId,
        string? LineDescription,
        double Debit,
        double Credit
    );

    public record CreateJournalEntryDto(
        string? EntryNumber,
        DateTime? EntryDate,
        string? EntryType, // GENERAL, ADJUSTMENT, OPENING, CLOSING
        string? Reference,
        string Description,
        string? Status, // DRAFT or POSTED
        string? SourceModule,
        List<JournalEntryLineDto> Lines
    );

    public record ReverseJournalEntryDto(
        string? Reason
    );

    [HttpGet("journal-entries/next-number")]
    public async Task<IActionResult> GetNextJournalNumber()
    {
        var currentYear = DateTime.UtcNow.Year;
        var prefix = $"JV-{currentYear}-";
        var countThisYear = await _db.JournalEntries
            .CountAsync(j => j.EntryNumber.StartsWith(prefix));

        var latestEntry = await _db.JournalEntries
            .Where(j => j.EntryNumber.StartsWith(prefix))
            .OrderByDescending(j => j.EntryNumber)
            .Select(j => j.EntryNumber)
            .FirstOrDefaultAsync();

        int nextSeq = countThisYear + 1;
        if (!string.IsNullOrEmpty(latestEntry) && latestEntry.Length >= prefix.Length + 4)
        {
            var seqStr = latestEntry.Substring(prefix.Length);
            if (int.TryParse(seqStr, out int parsed))
            {
                nextSeq = Math.Max(nextSeq, parsed + 1);
            }
        }

        var nextNumber = $"{prefix}{nextSeq:D4}";
        return Ok(ApiResponse.Ok(new { nextNumber }));
    }

    [HttpGet("journal-entries")]
    public async Task<IActionResult> GetJournalEntries(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] string? status,
        [FromQuery] string? entryType,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        var allEntries = _db.JournalEntries.AsQueryable();
        var totalEntries = await allEntries.CountAsync();
        var postedEntries = await allEntries.CountAsync(j => j.Status == "POSTED");
        var draftEntries = await allEntries.CountAsync(j => j.Status == "DRAFT");
        var reversedEntries = await allEntries.CountAsync(j => j.Status == "REVERSED");

        var query = _db.JournalEntries
            .Include(j => j.Lines)
            .AsQueryable();

        if (fromDate.HasValue)
        {
            var startUtc = DateTime.SpecifyKind(fromDate.Value.Date, DateTimeKind.Utc);
            query = query.Where(j => j.EntryDate >= startUtc);
        }

        if (toDate.HasValue)
        {
            var endUtc = DateTime.SpecifyKind(toDate.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
            query = query.Where(j => j.EntryDate <= endUtc);
        }

        if (!string.IsNullOrEmpty(status) && !status.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(j => j.Status == status.ToUpper());
        }

        if (!string.IsNullOrEmpty(entryType) && !entryType.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(j => j.EntryType == entryType.ToUpper());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(j =>
                j.EntryNumber.ToLower().Contains(s) ||
                (j.Reference != null && j.Reference.ToLower().Contains(s)) ||
                j.Description.ToLower().Contains(s) ||
                j.Lines.Any(l => l.AccountName.ToLower().Contains(s) || l.AccountCode.ToLower().Contains(s)));
        }

        var totalCount = await query.CountAsync();

        var periodDebit = await query.Where(j => j.Status == "POSTED" || j.Status == "REVERSED").SumAsync(j => (double?)j.TotalDebit) ?? 0.0;
        var periodCredit = await query.Where(j => j.Status == "POSTED" || j.Status == "REVERSED").SumAsync(j => (double?)j.TotalCredit) ?? 0.0;

        var entries = await query
            .OrderByDescending(j => j.EntryDate)
            .ThenByDescending(j => j.EntryNumber)
            .Skip((Math.Max(1, page) - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(ApiResponse.Ok(new
        {
            items = entries,
            totalCount,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling((double)totalCount / pageSize),
            summary = new
            {
                totalEntries,
                postedEntries,
                draftEntries,
                reversedEntries,
                periodDebit = Math.Round(periodDebit, 2),
                periodCredit = Math.Round(periodCredit, 2)
            }
        }));
    }

    [HttpGet("journal-entries/{id}")]
    public async Task<IActionResult> GetJournalEntryById(string id)
    {
        var entry = await _db.JournalEntries
            .Include(j => j.Lines)
            .FirstOrDefaultAsync(j => j.Id == id);

        if (entry == null)
        {
            return NotFound(ApiResponse.Fail("Journal entry not found."));
        }

        return Ok(ApiResponse.Ok(entry));
    }

    [HttpPost("journal-entries")]
    public async Task<IActionResult> CreateJournalEntry([FromBody] CreateJournalEntryDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Description))
        {
            return BadRequest(ApiResponse.Fail("Description / Narration is required."));
        }

        var status = (dto.Status ?? "POSTED").Trim().ToUpper();
        if (status != "DRAFT" && status != "POSTED")
        {
            status = "POSTED";
        }

        var lines = dto.Lines ?? new List<JournalEntryLineDto>();

        if (status == "POSTED")
        {
            if (lines.Count < 2)
            {
                return BadRequest(ApiResponse.Fail("A posted journal entry requires at least 2 line items (double-entry)."));
            }

            var totalDebit = Math.Round(lines.Sum(l => l.Debit), 2);
            var totalCredit = Math.Round(lines.Sum(l => l.Credit), 2);

            if (totalDebit <= 0 || totalCredit <= 0)
            {
                return BadRequest(ApiResponse.Fail("Debit and credit amounts must be greater than zero."));
            }

            if (Math.Abs(totalDebit - totalCredit) > 0.01)
            {
                return BadRequest(ApiResponse.Fail($"Total debits (Rs. {totalDebit:N2}) must equal total credits (Rs. {totalCredit:N2}). Difference: Rs. {Math.Abs(totalDebit - totalCredit):N2}"));
            }
        }

        var accountIds = lines.Select(l => l.AccountId).Where(id => !string.IsNullOrEmpty(id)).Distinct().ToList();
        var accounts = await _db.Accounts.Where(a => accountIds.Contains(a.Id)).ToDictionaryAsync(a => a.Id);

        if (accountIds.Count > 0 && accounts.Count != accountIds.Count)
        {
            return BadRequest(ApiResponse.Fail("One or more selected accounts could not be found."));
        }

        foreach (var l in lines)
        {
            if (!string.IsNullOrEmpty(l.AccountId) && accounts.TryGetValue(l.AccountId, out var acc))
            {
                if (status == "POSTED")
                {
                    if (acc.IsGroup)
                    {
                        return BadRequest(ApiResponse.Fail($"Account [{acc.AccountCode}] {acc.AccountName} is a Group Header account. Postings are only permitted to sub-ledger posting accounts."));
                    }
                    if (!acc.IsActive)
                    {
                        return BadRequest(ApiResponse.Fail($"Account [{acc.AccountCode}] {acc.AccountName} is Inactive and cannot receive new entries."));
                    }
                }
            }
        }

        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? "hotel-default";

        string entryNumber = dto.EntryNumber?.Trim() ?? string.Empty;
        if (string.IsNullOrEmpty(entryNumber))
        {
            var currentYear = DateTime.UtcNow.Year;
            var prefix = $"JV-{currentYear}-";
            var countThisYear = await _db.JournalEntries.CountAsync(j => j.EntryNumber.StartsWith(prefix));
            entryNumber = $"{prefix}{(countThisYear + 1):D4}";
        }

        var totalDebitSum = Math.Round(lines.Sum(l => l.Debit), 2);
        var totalCreditSum = Math.Round(lines.Sum(l => l.Credit), 2);
        var entryType = string.IsNullOrWhiteSpace(dto.EntryType) ? "GENERAL" : dto.EntryType.Trim().ToUpper();

        var entry = new JournalEntry
        {
            HotelId = hotelId,
            EntryNumber = entryNumber,
            EntryDate = dto.EntryDate.HasValue ? DateTime.SpecifyKind(dto.EntryDate.Value, DateTimeKind.Utc) : DateTime.UtcNow,
            EntryType = entryType,
            Reference = dto.Reference?.Trim(),
            Description = dto.Description.Trim(),
            TotalDebit = totalDebitSum,
            TotalCredit = totalCreditSum,
            Status = status,
            SourceModule = string.IsNullOrWhiteSpace(dto.SourceModule) ? "MANUAL" : dto.SourceModule.Trim(),
            CreatedBy = "Staff / Admin",
            PostedBy = status == "POSTED" ? "Staff / Admin" : null,
            PostedAt = status == "POSTED" ? DateTime.UtcNow : null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        foreach (var lineDto in lines)
        {
            if (string.IsNullOrEmpty(lineDto.AccountId) || !accounts.TryGetValue(lineDto.AccountId, out var acc))
                continue;

            var line = new JournalEntryLine
            {
                JournalEntryId = entry.Id,
                AccountId = acc.Id,
                AccountCode = acc.AccountCode,
                AccountName = acc.AccountName,
                LineDescription = lineDto.LineDescription?.Trim(),
                Debit = Math.Round(lineDto.Debit, 2),
                Credit = Math.Round(lineDto.Credit, 2)
            };
            entry.Lines.Add(line);

            if (status == "POSTED")
            {
                if (acc.NormalBalance == "DEBIT")
                {
                    acc.CurrentBalance += (line.Debit - line.Credit);
                }
                else
                {
                    acc.CurrentBalance += (line.Credit - line.Debit);
                }
                acc.UpdatedAt = DateTime.UtcNow;
            }
        }

        _db.JournalEntries.Add(entry);
        await _db.SaveChangesAsync();

        var message = status == "POSTED"
            ? $"Journal Entry {entry.EntryNumber} posted successfully."
            : $"Journal Entry {entry.EntryNumber} saved as draft.";

        return Ok(ApiResponse.Ok(entry, message));
    }

    [HttpPut("journal-entries/{id}")]
    public async Task<IActionResult> UpdateJournalEntry(string id, [FromBody] CreateJournalEntryDto dto)
    {
        var entry = await _db.JournalEntries
            .Include(j => j.Lines)
            .FirstOrDefaultAsync(j => j.Id == id);

        if (entry == null)
        {
            return NotFound(ApiResponse.Fail("Journal entry not found."));
        }

        if (entry.Status != "DRAFT")
        {
            return BadRequest(ApiResponse.Fail($"Only DRAFT entries can be edited. This entry is already {entry.Status}. To make corrections, please post a reversal voucher."));
        }

        if (string.IsNullOrWhiteSpace(dto.Description))
        {
            return BadRequest(ApiResponse.Fail("Description / Narration is required."));
        }

        var targetStatus = (dto.Status ?? "DRAFT").Trim().ToUpper();
        if (targetStatus != "DRAFT" && targetStatus != "POSTED")
        {
            targetStatus = "DRAFT";
        }

        var lines = dto.Lines ?? new List<JournalEntryLineDto>();

        if (targetStatus == "POSTED")
        {
            if (lines.Count < 2)
            {
                return BadRequest(ApiResponse.Fail("A posted journal entry requires at least 2 line items (double-entry)."));
            }

            var totalDebit = Math.Round(lines.Sum(l => l.Debit), 2);
            var totalCredit = Math.Round(lines.Sum(l => l.Credit), 2);

            if (totalDebit <= 0 || totalCredit <= 0)
            {
                return BadRequest(ApiResponse.Fail("Debit and credit amounts must be greater than zero."));
            }

            if (Math.Abs(totalDebit - totalCredit) > 0.01)
            {
                return BadRequest(ApiResponse.Fail($"Total debits (Rs. {totalDebit:N2}) must equal total credits (Rs. {totalCredit:N2}). Difference: Rs. {Math.Abs(totalDebit - totalCredit):N2}"));
            }
        }

        var accountIds = lines.Select(l => l.AccountId).Where(accId => !string.IsNullOrEmpty(accId)).Distinct().ToList();
        var accounts = await _db.Accounts.Where(a => accountIds.Contains(a.Id)).ToDictionaryAsync(a => a.Id);

        if (accountIds.Count > 0 && accounts.Count != accountIds.Count)
        {
            return BadRequest(ApiResponse.Fail("One or more selected accounts could not be found."));
        }

        foreach (var l in lines)
        {
            if (!string.IsNullOrEmpty(l.AccountId) && accounts.TryGetValue(l.AccountId, out var acc))
            {
                if (targetStatus == "POSTED")
                {
                    if (acc.IsGroup)
                    {
                        return BadRequest(ApiResponse.Fail($"Account [{acc.AccountCode}] {acc.AccountName} is a Group Header account. Postings are only permitted to sub-ledger posting accounts."));
                    }
                    if (!acc.IsActive)
                    {
                        return BadRequest(ApiResponse.Fail($"Account [{acc.AccountCode}] {acc.AccountName} is Inactive and cannot receive new entries."));
                    }
                }
            }
        }

        _db.JournalEntryLines.RemoveRange(entry.Lines);
        entry.Lines.Clear();

        if (dto.EntryDate.HasValue)
        {
            entry.EntryDate = DateTime.SpecifyKind(dto.EntryDate.Value, DateTimeKind.Utc);
        }
        if (!string.IsNullOrWhiteSpace(dto.EntryType))
        {
            entry.EntryType = dto.EntryType.Trim().ToUpper();
        }
        entry.Reference = dto.Reference?.Trim();
        entry.Description = dto.Description.Trim();
        entry.TotalDebit = Math.Round(lines.Sum(l => l.Debit), 2);
        entry.TotalCredit = Math.Round(lines.Sum(l => l.Credit), 2);
        entry.Status = targetStatus;
        entry.UpdatedAt = DateTime.UtcNow;

        if (targetStatus == "POSTED")
        {
            entry.PostedBy = "Staff / Admin";
            entry.PostedAt = DateTime.UtcNow;
        }

        foreach (var lineDto in lines)
        {
            if (string.IsNullOrEmpty(lineDto.AccountId) || !accounts.TryGetValue(lineDto.AccountId, out var acc))
                continue;

            var line = new JournalEntryLine
            {
                JournalEntryId = entry.Id,
                AccountId = acc.Id,
                AccountCode = acc.AccountCode,
                AccountName = acc.AccountName,
                LineDescription = lineDto.LineDescription?.Trim(),
                Debit = Math.Round(lineDto.Debit, 2),
                Credit = Math.Round(lineDto.Credit, 2)
            };
            entry.Lines.Add(line);

            if (targetStatus == "POSTED")
            {
                if (acc.NormalBalance == "DEBIT")
                {
                    acc.CurrentBalance += (line.Debit - line.Credit);
                }
                else
                {
                    acc.CurrentBalance += (line.Credit - line.Debit);
                }
                acc.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _db.SaveChangesAsync();

        var msg = targetStatus == "POSTED"
            ? $"Journal Entry {entry.EntryNumber} posted successfully."
            : $"Journal Entry {entry.EntryNumber} updated successfully.";

        return Ok(ApiResponse.Ok(entry, msg));
    }

    [HttpDelete("journal-entries/{id}")]
    public async Task<IActionResult> DeleteJournalEntry(string id)
    {
        var entry = await _db.JournalEntries
            .Include(j => j.Lines)
            .FirstOrDefaultAsync(j => j.Id == id);

        if (entry == null)
        {
            return NotFound(ApiResponse.Fail("Journal entry not found."));
        }

        if (entry.Status != "DRAFT")
        {
            return BadRequest(ApiResponse.Fail($"Cannot delete a {entry.Status} journal entry. Posted entries must be reversed to maintain the accounting audit trail."));
        }

        _db.JournalEntryLines.RemoveRange(entry.Lines);
        _db.JournalEntries.Remove(entry);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new { id }, $"Draft journal entry {entry.EntryNumber} deleted successfully."));
    }

    [HttpPost("journal-entries/{id}/post")]
    public async Task<IActionResult> PostDraftJournalEntry(string id)
    {
        var entry = await _db.JournalEntries
            .Include(j => j.Lines)
            .FirstOrDefaultAsync(j => j.Id == id);

        if (entry == null)
        {
            return NotFound(ApiResponse.Fail("Journal entry not found."));
        }

        if (entry.Status != "DRAFT")
        {
            return BadRequest(ApiResponse.Fail($"Journal entry is already {entry.Status}."));
        }

        if (entry.Lines == null || entry.Lines.Count < 2)
        {
            return BadRequest(ApiResponse.Fail("A posted journal entry requires at least 2 line items (double-entry)."));
        }

        var totalDebit = Math.Round(entry.Lines.Sum(l => l.Debit), 2);
        var totalCredit = Math.Round(entry.Lines.Sum(l => l.Credit), 2);

        if (totalDebit <= 0 || totalCredit <= 0)
        {
            return BadRequest(ApiResponse.Fail("Debit and credit amounts must be greater than zero."));
        }

        if (Math.Abs(totalDebit - totalCredit) > 0.01)
        {
            return BadRequest(ApiResponse.Fail($"Total debits (Rs. {totalDebit:N2}) must equal total credits (Rs. {totalCredit:N2}). Difference: Rs. {Math.Abs(totalDebit - totalCredit):N2}"));
        }

        var accountIds = entry.Lines.Select(l => l.AccountId).Distinct().ToList();
        var accounts = await _db.Accounts.Where(a => accountIds.Contains(a.Id)).ToDictionaryAsync(a => a.Id);

        foreach (var line in entry.Lines)
        {
            if (!accounts.TryGetValue(line.AccountId, out var acc))
            {
                return BadRequest(ApiResponse.Fail($"Account {line.AccountCode} could not be found."));
            }
            if (acc.IsGroup)
            {
                return BadRequest(ApiResponse.Fail($"Account [{acc.AccountCode}] {acc.AccountName} is a Group Header account."));
            }
            if (!acc.IsActive)
            {
                return BadRequest(ApiResponse.Fail($"Account [{acc.AccountCode}] {acc.AccountName} is Inactive."));
            }

            if (acc.NormalBalance == "DEBIT")
            {
                acc.CurrentBalance += (line.Debit - line.Credit);
            }
            else
            {
                acc.CurrentBalance += (line.Credit - line.Debit);
            }
            acc.UpdatedAt = DateTime.UtcNow;
        }

        entry.Status = "POSTED";
        entry.PostedBy = "Staff / Admin";
        entry.PostedAt = DateTime.UtcNow;
        entry.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(entry, $"Journal Entry {entry.EntryNumber} posted successfully."));
    }

    [HttpPost("journal-entries/{id}/reverse")]
    public async Task<IActionResult> ReverseJournalEntry(string id, [FromBody] ReverseJournalEntryDto? dto)
    {
        var entry = await _db.JournalEntries
            .Include(j => j.Lines)
            .FirstOrDefaultAsync(j => j.Id == id);

        if (entry == null)
        {
            return NotFound(ApiResponse.Fail("Journal entry not found."));
        }

        if (entry.Status != "POSTED")
        {
            return BadRequest(ApiResponse.Fail($"Only POSTED journal entries can be reversed. This entry is {entry.Status}."));
        }

        var currentYear = DateTime.UtcNow.Year;
        var prefix = $"JV-{currentYear}-";
        var countThisYear = await _db.JournalEntries.CountAsync(j => j.EntryNumber.StartsWith(prefix));
        var reversalNumber = $"{prefix}{(countThisYear + 1):D4}";

        var accountIds = entry.Lines.Select(l => l.AccountId).Distinct().ToList();
        var accounts = await _db.Accounts.Where(a => accountIds.Contains(a.Id)).ToDictionaryAsync(a => a.Id);

        var reasonText = !string.IsNullOrWhiteSpace(dto?.Reason) ? dto.Reason.Trim() : "Manual reversal";

        var reversalEntry = new JournalEntry
        {
            HotelId = entry.HotelId,
            EntryNumber = reversalNumber,
            EntryDate = DateTime.UtcNow,
            EntryType = "ADJUSTMENT",
            Reference = $"REV-{entry.EntryNumber}",
            Description = $"Reversal of {entry.EntryNumber} - {reasonText}. Original narration: {entry.Description}",
            TotalDebit = entry.TotalCredit,
            TotalCredit = entry.TotalDebit,
            Status = "POSTED",
            SourceModule = "REVERSAL",
            ReversedFromId = entry.Id,
            CreatedBy = "Staff / Admin",
            PostedBy = "Staff / Admin",
            PostedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        foreach (var originalLine in entry.Lines)
        {
            var reversalLine = new JournalEntryLine
            {
                JournalEntryId = reversalEntry.Id,
                AccountId = originalLine.AccountId,
                AccountCode = originalLine.AccountCode,
                AccountName = originalLine.AccountName,
                LineDescription = $"Reversal contra: {originalLine.LineDescription ?? originalLine.AccountName}",
                Debit = originalLine.Credit,
                Credit = originalLine.Debit
            };
            reversalEntry.Lines.Add(reversalLine);

            if (accounts.TryGetValue(originalLine.AccountId, out var acc))
            {
                if (acc.NormalBalance == "DEBIT")
                {
                    acc.CurrentBalance += (reversalLine.Debit - reversalLine.Credit);
                }
                else
                {
                    acc.CurrentBalance += (reversalLine.Credit - reversalLine.Debit);
                }
                acc.UpdatedAt = DateTime.UtcNow;
            }
        }

        entry.Status = "REVERSED";
        entry.UpdatedAt = DateTime.UtcNow;

        _db.JournalEntries.Add(reversalEntry);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(reversalEntry, $"Journal Entry {entry.EntryNumber} reversed successfully via voucher {reversalEntry.EntryNumber}."));
    }

    [HttpPost("journal-entries/{id}/void")]
    public async Task<IActionResult> VoidJournalEntry(string id)
    {
        var entry = await _db.JournalEntries
            .Include(j => j.Lines)
            .FirstOrDefaultAsync(j => j.Id == id);

        if (entry == null)
        {
            return NotFound(ApiResponse.Fail("Journal entry not found."));
        }

        if (entry.Status == "VOID")
        {
            return BadRequest(ApiResponse.Fail("Journal entry is already voided."));
        }

        var accountIds = entry.Lines.Select(l => l.AccountId).Distinct().ToList();
        var accounts = await _db.Accounts.Where(a => accountIds.Contains(a.Id)).ToDictionaryAsync(a => a.Id);

        foreach (var line in entry.Lines)
        {
            if (accounts.TryGetValue(line.AccountId, out var acc))
            {
                if (acc.NormalBalance == "DEBIT")
                {
                    acc.CurrentBalance -= (line.Debit - line.Credit);
                }
                else
                {
                    acc.CurrentBalance += (line.Credit - line.Debit);
                }
                acc.UpdatedAt = DateTime.UtcNow;
            }
        }

        entry.Status = "VOID";
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(entry, $"Journal Entry {entry.EntryNumber} has been voided and balances reversed."));
    }

    #endregion

    #region 3. General Ledger Endpoints

    [HttpGet("general-ledger")]
    public async Task<IActionResult> GetGeneralLedger(
        [FromQuery] string? accountId,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] string? sourceModule,
        [FromQuery] string? search)
    {
        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? "hotel-default";

        var now = DateTime.UtcNow;
        var startUtc = fromDate.HasValue
            ? DateTime.SpecifyKind(fromDate.Value.Date, DateTimeKind.Utc)
            : new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var endUtc = toDate.HasValue
            ? DateTime.SpecifyKind(toDate.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc)
            : new DateTime(now.Year, now.Month, DateTime.DaysInMonth(now.Year, now.Month), 23, 59, 59, DateTimeKind.Utc);

        Account? targetAccount = null;
        if (!string.IsNullOrEmpty(accountId))
        {
            targetAccount = await _db.Accounts.FindAsync(accountId);
        }
        else
        {
            targetAccount = await _db.Accounts
                .Where(a => a.IsActive && !a.IsGroup)
                .OrderBy(a => a.AccountCode)
                .FirstOrDefaultAsync();
        }

        if (targetAccount == null)
        {
            return Ok(ApiResponse.Ok(new
            {
                account = (object?)null,
                openingBalance = 0.0,
                closingBalance = 0.0,
                totalDebit = 0.0,
                totalCredit = 0.0,
                transactions = new List<object>()
            }));
        }

        // 1. Calculate Opening Balance: Net of all posted/reversed entries prior to start date
        var priorLines = await _db.JournalEntryLines
            .Include(l => l.JournalEntry)
            .Where(l => l.AccountId == targetAccount.Id &&
                        l.JournalEntry != null &&
                        (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED") &&
                        l.JournalEntry.EntryDate < startUtc)
            .ToListAsync();

        double priorNet = 0.0;
        if (targetAccount.NormalBalance == "DEBIT")
        {
            priorNet = priorLines.Sum(l => l.Debit - l.Credit);
        }
        else
        {
            priorNet = priorLines.Sum(l => l.Credit - l.Debit);
        }
        var openingBalance = targetAccount.OpeningBalance + priorNet;

        // 2. Fetch all POSTED and REVERSED lines within date range
        var periodQuery = _db.JournalEntryLines
            .Include(l => l.JournalEntry)
            .Where(l => l.AccountId == targetAccount.Id &&
                        l.JournalEntry != null &&
                        (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED") &&
                        l.JournalEntry.EntryDate >= startUtc &&
                        l.JournalEntry.EntryDate <= endUtc);

        if (!string.IsNullOrEmpty(sourceModule) && !sourceModule.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            periodQuery = periodQuery.Where(l => l.JournalEntry!.SourceModule == sourceModule.ToUpper());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            periodQuery = periodQuery.Where(l =>
                l.JournalEntry!.EntryNumber.ToLower().Contains(s) ||
                (l.JournalEntry.Reference != null && l.JournalEntry.Reference.ToLower().Contains(s)) ||
                l.JournalEntry.Description.ToLower().Contains(s) ||
                (l.LineDescription != null && l.LineDescription.ToLower().Contains(s)));
        }

        var periodLines = await periodQuery
            .OrderBy(l => l.JournalEntry!.EntryDate)
            .ThenBy(l => l.JournalEntry!.EntryNumber)
            .ToListAsync();

        // 3. Compute running balances chronologically
        double running = openingBalance;
        var transactions = new List<object>();

        foreach (var l in periodLines)
        {
            if (targetAccount.NormalBalance == "DEBIT")
            {
                running += (l.Debit - l.Credit);
            }
            else
            {
                running += (l.Credit - l.Debit);
            }

            transactions.Add(new
            {
                id = l.Id,
                journalEntryId = l.JournalEntryId,
                entryNumber = l.JournalEntry!.EntryNumber,
                entryDate = l.JournalEntry.EntryDate,
                entryType = l.JournalEntry.EntryType,
                reference = l.JournalEntry.Reference,
                description = l.JournalEntry.Description,
                lineDescription = l.LineDescription,
                sourceModule = l.JournalEntry.SourceModule,
                sourceTransactionId = l.JournalEntry.SourceTransactionId,
                status = l.JournalEntry.Status,
                createdBy = l.JournalEntry.CreatedBy,
                postedBy = l.JournalEntry.PostedBy,
                postedAt = l.JournalEntry.PostedAt,
                reversedFromId = l.JournalEntry.ReversedFromId,
                debit = l.Debit,
                credit = l.Credit,
                runningBalance = Math.Round(running, 2)
            });
        }

        var totalDebit = Math.Round(periodLines.Sum(l => l.Debit), 2);
        var totalCredit = Math.Round(periodLines.Sum(l => l.Credit), 2);
        var closingBalance = Math.Round(running, 2);

        return Ok(ApiResponse.Ok(new
        {
            account = targetAccount,
            fromDate = startUtc,
            toDate = endUtc,
            openingBalance = Math.Round(openingBalance, 2),
            closingBalance,
            totalDebit,
            totalCredit,
            netChange = targetAccount.NormalBalance == "DEBIT" ? totalDebit - totalCredit : totalCredit - totalDebit,
            transactionCount = transactions.Count,
            transactions
        }));
    }

    [HttpGet("general-ledger/all-accounts")]
    public async Task<IActionResult> GetAllAccountsLedger(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] string? accountType)
    {
        var now = DateTime.UtcNow;
        var startUtc = fromDate.HasValue
            ? DateTime.SpecifyKind(fromDate.Value.Date, DateTimeKind.Utc)
            : new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var endUtc = toDate.HasValue
            ? DateTime.SpecifyKind(toDate.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc)
            : new DateTime(now.Year, now.Month, DateTime.DaysInMonth(now.Year, now.Month), 23, 59, 59, DateTimeKind.Utc);

        var accountsQuery = _db.Accounts
            .Where(a => a.IsActive && !a.IsGroup)
            .OrderBy(a => a.AccountCode)
            .AsQueryable();

        if (!string.IsNullOrEmpty(accountType) && !accountType.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            accountsQuery = accountsQuery.Where(a => a.AccountType == accountType.ToUpper());
        }

        var accounts = await accountsQuery.ToListAsync();
        var accountIds = accounts.Select(a => a.Id).ToList();

        // 1. Prior lines before startUtc for opening balances
        var priorLines = await _db.JournalEntryLines
            .Where(l => accountIds.Contains(l.AccountId) &&
                        l.JournalEntry != null &&
                        (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED") &&
                        l.JournalEntry.EntryDate < startUtc)
            .Select(l => new { l.AccountId, l.Debit, l.Credit })
            .ToListAsync();

        var priorGrouped = priorLines
            .GroupBy(l => l.AccountId)
            .ToDictionary(
                g => g.Key,
                g => new { TotalDebit = g.Sum(x => x.Debit), TotalCredit = g.Sum(x => x.Credit) }
            );

        // 2. Period lines between startUtc and endUtc
        var periodLines = await _db.JournalEntryLines
            .Where(l => accountIds.Contains(l.AccountId) &&
                        l.JournalEntry != null &&
                        (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED") &&
                        l.JournalEntry.EntryDate >= startUtc &&
                        l.JournalEntry.EntryDate <= endUtc)
            .Select(l => new { l.AccountId, l.Debit, l.Credit })
            .ToListAsync();

        var periodGrouped = periodLines
            .GroupBy(l => l.AccountId)
            .ToDictionary(
                g => g.Key,
                g => new { TotalDebit = g.Sum(x => x.Debit), TotalCredit = g.Sum(x => x.Credit) }
            );

        var rows = new List<object>();
        double sumOpeningDebit = 0;
        double sumOpeningCredit = 0;
        double sumPeriodDebit = 0;
        double sumPeriodCredit = 0;
        double sumClosingDebit = 0;
        double sumClosingCredit = 0;

        foreach (var acc in accounts)
        {
            priorGrouped.TryGetValue(acc.Id, out var p);
            var pDeb = p?.TotalDebit ?? 0.0;
            var pCred = p?.TotalCredit ?? 0.0;

            double priorNet = acc.NormalBalance == "DEBIT" ? (pDeb - pCred) : (pCred - pDeb);
            double openingBal = acc.OpeningBalance + priorNet;

            double openDeb = 0.0;
            double openCred = 0.0;
            if (acc.NormalBalance == "DEBIT")
            {
                if (openingBal >= 0) openDeb = openingBal;
                else openCred = Math.Abs(openingBal);
            }
            else
            {
                if (openingBal >= 0) openCred = openingBal;
                else openDeb = Math.Abs(openingBal);
            }

            periodGrouped.TryGetValue(acc.Id, out var cur);
            var perDebit = cur?.TotalDebit ?? 0.0;
            var perCredit = cur?.TotalCredit ?? 0.0;

            double closingBal = acc.NormalBalance == "DEBIT"
                ? (openingBal + perDebit - perCredit)
                : (openingBal + perCredit - perDebit);

            double closeDeb = 0.0;
            double closeCred = 0.0;
            if (acc.NormalBalance == "DEBIT")
            {
                if (closingBal >= 0) closeDeb = closingBal;
                else closeCred = Math.Abs(closingBal);
            }
            else
            {
                if (closingBal >= 0) closeCred = closingBal;
                else closeDeb = Math.Abs(closingBal);
            }

            sumOpeningDebit += openDeb;
            sumOpeningCredit += openCred;
            sumPeriodDebit += perDebit;
            sumPeriodCredit += perCredit;
            sumClosingDebit += closeDeb;
            sumClosingCredit += closeCred;

            rows.Add(new
            {
                accountId = acc.Id,
                accountCode = acc.AccountCode,
                accountName = acc.AccountName,
                accountType = acc.AccountType,
                subCategory = acc.SubCategory,
                normalBalance = acc.NormalBalance,
                openingBalance = Math.Round(openingBal, 2),
                openingDebit = Math.Round(openDeb, 2),
                openingCredit = Math.Round(openCred, 2),
                periodDebit = Math.Round(perDebit, 2),
                periodCredit = Math.Round(perCredit, 2),
                closingBalance = Math.Round(closingBal, 2),
                closingDebit = Math.Round(closeDeb, 2),
                closingCredit = Math.Round(closeCred, 2)
            });
        }

        return Ok(ApiResponse.Ok(new
        {
            fromDate = startUtc,
            toDate = endUtc,
            accountType = accountType ?? "ALL",
            totalAccounts = accounts.Count,
            totals = new
            {
                openingDebit = Math.Round(sumOpeningDebit, 2),
                openingCredit = Math.Round(sumOpeningCredit, 2),
                periodDebit = Math.Round(sumPeriodDebit, 2),
                periodCredit = Math.Round(sumPeriodCredit, 2),
                closingDebit = Math.Round(sumClosingDebit, 2),
                closingCredit = Math.Round(sumClosingCredit, 2)
            },
            accounts = rows
        }));
    }

    #endregion

    #region 4. Trial Balance Endpoints

    [HttpGet("trial-balance")]
    public async Task<IActionResult> GetTrialBalance(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] string? accountType,
        [FromQuery] bool showZeroBalances = false,
        [FromQuery] string? search = null)
    {
        var now = DateTime.UtcNow;
        var startUtc = fromDate.HasValue
            ? DateTime.SpecifyKind(fromDate.Value.Date, DateTimeKind.Utc)
            : new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var endUtc = toDate.HasValue
            ? DateTime.SpecifyKind(toDate.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc)
            : new DateTime(now.Year, now.Month, DateTime.DaysInMonth(now.Year, now.Month), 23, 59, 59, DateTimeKind.Utc);

        var accountsQuery = _db.Accounts
            .Where(a => !a.IsGroup && a.IsActive)
            .OrderBy(a => a.AccountCode)
            .AsQueryable();

        if (!string.IsNullOrEmpty(accountType) && !accountType.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            accountsQuery = accountsQuery.Where(a => a.AccountType == accountType.ToUpper());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            accountsQuery = accountsQuery.Where(a =>
                a.AccountCode.ToLower().Contains(s) ||
                a.AccountName.ToLower().Contains(s) ||
                (a.SubCategory != null && a.SubCategory.ToLower().Contains(s)));
        }

        var accounts = await accountsQuery.ToListAsync();
        var accountIds = accounts.Select(a => a.Id).ToList();

        // 1. Calculate historical transactions before startUtc
        var priorLines = await _db.JournalEntryLines
            .Where(l => accountIds.Contains(l.AccountId) &&
                        l.JournalEntry != null &&
                        (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED") &&
                        l.JournalEntry.EntryDate < startUtc)
            .Select(l => new { l.AccountId, l.Debit, l.Credit })
            .ToListAsync();

        var priorGrouped = priorLines
            .GroupBy(l => l.AccountId)
            .ToDictionary(
                g => g.Key,
                g => new { TotalDebit = g.Sum(x => x.Debit), TotalCredit = g.Sum(x => x.Credit) }
            );

        // 2. Calculate period transactions between startUtc and endUtc
        var periodLines = await _db.JournalEntryLines
            .Where(l => accountIds.Contains(l.AccountId) &&
                        l.JournalEntry != null &&
                        (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED") &&
                        l.JournalEntry.EntryDate >= startUtc &&
                        l.JournalEntry.EntryDate <= endUtc)
            .Select(l => new { l.AccountId, l.Debit, l.Credit })
            .ToListAsync();

        var periodGrouped = periodLines
            .GroupBy(l => l.AccountId)
            .ToDictionary(
                g => g.Key,
                g => new { TotalDebit = g.Sum(x => x.Debit), TotalCredit = g.Sum(x => x.Credit) }
            );

        var rows = new List<object>();
        double sumOpeningDebit = 0;
        double sumOpeningCredit = 0;
        double sumPeriodDebit = 0;
        double sumPeriodCredit = 0;
        double sumClosingDebit = 0;
        double sumClosingCredit = 0;

        foreach (var acc in accounts)
        {
            priorGrouped.TryGetValue(acc.Id, out var p);
            var pDeb = p?.TotalDebit ?? 0.0;
            var pCred = p?.TotalCredit ?? 0.0;

            double priorNet = acc.NormalBalance == "DEBIT" ? (pDeb - pCred) : (pCred - pDeb);
            double openingBal = acc.OpeningBalance + priorNet;

            double openDeb = 0.0;
            double openCred = 0.0;
            if (acc.NormalBalance == "DEBIT")
            {
                if (openingBal >= 0) openDeb = openingBal;
                else openCred = Math.Abs(openingBal);
            }
            else
            {
                if (openingBal >= 0) openCred = openingBal;
                else openDeb = Math.Abs(openingBal);
            }

            periodGrouped.TryGetValue(acc.Id, out var cur);
            var perDebit = cur?.TotalDebit ?? 0.0;
            var perCredit = cur?.TotalCredit ?? 0.0;

            double closingBal = acc.NormalBalance == "DEBIT"
                ? (openingBal + perDebit - perCredit)
                : (openingBal + perCredit - perDebit);

            double closeDeb = 0.0;
            double closeCred = 0.0;
            if (acc.NormalBalance == "DEBIT")
            {
                if (closingBal >= 0) closeDeb = closingBal;
                else closeCred = Math.Abs(closingBal);
            }
            else
            {
                if (closingBal >= 0) closeCred = closingBal;
                else closeDeb = Math.Abs(closingBal);
            }

            bool isZeroBalance = openDeb == 0 && openCred == 0 && perDebit == 0 && perCredit == 0 && closeDeb == 0 && closeCred == 0;
            if (!showZeroBalances && isZeroBalance)
            {
                continue;
            }

            sumOpeningDebit += openDeb;
            sumOpeningCredit += openCred;
            sumPeriodDebit += perDebit;
            sumPeriodCredit += perCredit;
            sumClosingDebit += closeDeb;
            sumClosingCredit += closeCred;

            rows.Add(new
            {
                accountId = acc.Id,
                accountCode = acc.AccountCode,
                accountName = acc.AccountName,
                accountType = acc.AccountType,
                subCategory = acc.SubCategory,
                normalBalance = acc.NormalBalance,
                openingBalance = Math.Round(openingBal, 2),
                openingDebit = Math.Round(openDeb, 2),
                openingCredit = Math.Round(openCred, 2),
                periodDebit = Math.Round(perDebit, 2),
                periodCredit = Math.Round(perCredit, 2),
                closingBalance = Math.Round(closingBal, 2),
                closingDebit = Math.Round(closeDeb, 2),
                closingCredit = Math.Round(closeCred, 2)
            });
        }

        var closingDebSum = Math.Round(sumClosingDebit, 2);
        var closingCredSum = Math.Round(sumClosingCredit, 2);
        var diff = Math.Round(Math.Abs(closingDebSum - closingCredSum), 2);
        var isBalanced = diff <= 0.01;

        return Ok(ApiResponse.Ok(new
        {
            fromDate = startUtc,
            toDate = endUtc,
            accountType = accountType ?? "ALL",
            showZeroBalances,
            totalAccounts = rows.Count,
            isBalanced,
            difference = diff,
            totals = new
            {
                openingDebit = Math.Round(sumOpeningDebit, 2),
                openingCredit = Math.Round(sumOpeningCredit, 2),
                periodDebit = Math.Round(sumPeriodDebit, 2),
                periodCredit = Math.Round(sumPeriodCredit, 2),
                closingDebit = closingDebSum,
                closingCredit = closingCredSum
            },
            accounts = rows
        }));
    }

    #endregion
}

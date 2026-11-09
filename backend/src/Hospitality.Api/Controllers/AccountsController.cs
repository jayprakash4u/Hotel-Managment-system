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
            new Account { HotelId = hotelId, AccountCode = "1010", AccountName = "Front Desk Cash Drawer", AccountType = "ASSET", SubCategory = "Cash & Cash Equivalents", NormalBalance = "DEBIT", OpeningBalance = 25000, CurrentBalance = 25000, IsSystemAccount = true, Description = "Cash float kept at front desk reception" },
            new Account { HotelId = hotelId, AccountCode = "1020", AccountName = "Restaurant POS Cash Drawer", AccountType = "ASSET", SubCategory = "Cash & Cash Equivalents", NormalBalance = "DEBIT", OpeningBalance = 15000, CurrentBalance = 15000, IsSystemAccount = true, Description = "Restaurant register cash on hand" },
            new Account { HotelId = hotelId, AccountCode = "1030", AccountName = "Petty Cash Fund", AccountType = "ASSET", SubCategory = "Cash & Cash Equivalents", NormalBalance = "DEBIT", OpeningBalance = 10000, CurrentBalance = 10000, Description = "Office & emergency petty expenses" },
            new Account { HotelId = hotelId, AccountCode = "1050", AccountName = "Main Operating Bank Account", AccountType = "ASSET", SubCategory = "Bank Accounts", NormalBalance = "DEBIT", OpeningBalance = 350000, CurrentBalance = 350000, IsSystemAccount = true, Description = "Primary commercial bank account" },
            new Account { HotelId = hotelId, AccountCode = "1060", AccountName = "Card & QR Settlement Clearing", AccountType = "ASSET", SubCategory = "Cash & Cash Equivalents", NormalBalance = "DEBIT", OpeningBalance = 0, CurrentBalance = 0, Description = "Pending card swipe and digital wallet settlements" },
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
            new Account { HotelId = hotelId, AccountCode = "5500", AccountName = "OTA Booking Commissions & Marketing", AccountType = "EXPENSE", SubCategory = "Selling & Marketing", NormalBalance = "DEBIT", OpeningBalance = 0, CurrentBalance = 0, Description = "Booking.com, Agoda commissions and social media ads" },
            new Account { HotelId = hotelId, AccountCode = "5600", AccountName = "Internet, Cloud Software & IT Subscriptions", AccountType = "EXPENSE", SubCategory = "Administrative", NormalBalance = "DEBIT", OpeningBalance = 0, CurrentBalance = 0, Description = "High-speed Wi-Fi and hospitality software" },
            new Account { HotelId = hotelId, AccountCode = "5700", AccountName = "Bank Charges & POS Processing Fees", AccountType = "EXPENSE", SubCategory = "Financial Expense", NormalBalance = "DEBIT", OpeningBalance = 0, CurrentBalance = 0, Description = "Card merchant charges and bank maintenance fees" }
        };
    }
    #endregion

    #region 1. Chart of Accounts Endpoints

    [HttpGet("chart")]
    public async Task<IActionResult> GetChartOfAccounts([FromQuery] string? type, [FromQuery] string? search, [FromQuery] bool activeOnly = false)
    {
        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? "hotel-default";

        // Auto-seed standard accounts if table is currently empty
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

        // Calculate summary KPI stats
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

        // Check if journal lines reference this account
        var hasTransactions = await _db.JournalEntryLines.AnyAsync(l => l.AccountId == id);
        if (hasTransactions)
        {
            // Soft-deactivate
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
        DateTime? EntryDate,
        string? Reference,
        string Description,
        string? SourceModule,
        List<JournalEntryLineDto> Lines
    );

    [HttpGet("journal-entries")]
    public async Task<IActionResult> GetJournalEntries(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] string? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
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
            totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
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
        if (dto.Lines == null || dto.Lines.Count < 2)
        {
            return BadRequest(ApiResponse.Fail("A journal entry requires at least 2 line items (double-entry)."));
        }

        if (string.IsNullOrWhiteSpace(dto.Description))
        {
            return BadRequest(ApiResponse.Fail("Description / Narration is required."));
        }

        var totalDebit = Math.Round(dto.Lines.Sum(l => l.Debit), 2);
        var totalCredit = Math.Round(dto.Lines.Sum(l => l.Credit), 2);

        if (totalDebit <= 0 || totalCredit <= 0)
        {
            return BadRequest(ApiResponse.Fail("Debit and credit amounts must be greater than zero."));
        }

        if (Math.Abs(totalDebit - totalCredit) > 0.01)
        {
            return BadRequest(ApiResponse.Fail($"Total debits (Rs. {totalDebit:N2}) must equal total credits (Rs. {totalCredit:N2}). Difference: Rs. {Math.Abs(totalDebit - totalCredit):N2}"));
        }

        // Validate all accounts exist
        var accountIds = dto.Lines.Select(l => l.AccountId).Distinct().ToList();
        var accounts = await _db.Accounts.Where(a => accountIds.Contains(a.Id)).ToDictionaryAsync(a => a.Id);

        if (accounts.Count != accountIds.Count)
        {
            return BadRequest(ApiResponse.Fail("One or more selected accounts could not be found."));
        }

        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? "hotel-default";

        // Generate next Entry Number: e.g. JV-2026-0001
        var currentYear = DateTime.UtcNow.Year;
        var prefix = $"JV-{currentYear}-";
        var countThisYear = await _db.JournalEntries
            .CountAsync(j => j.EntryNumber.StartsWith(prefix));
        var entryNumber = $"{prefix}{(countThisYear + 1):D4}";

        var entry = new JournalEntry
        {
            HotelId = hotelId,
            EntryNumber = entryNumber,
            EntryDate = dto.EntryDate.HasValue ? DateTime.SpecifyKind(dto.EntryDate.Value, DateTimeKind.Utc) : DateTime.UtcNow,
            Reference = dto.Reference?.Trim(),
            Description = dto.Description.Trim(),
            TotalDebit = totalDebit,
            TotalCredit = totalCredit,
            Status = "POSTED",
            SourceModule = string.IsNullOrWhiteSpace(dto.SourceModule) ? "MANUAL" : dto.SourceModule.Trim(),
            CreatedBy = "Staff / Admin",
            CreatedAt = DateTime.UtcNow
        };

        foreach (var lineDto in dto.Lines)
        {
            var acc = accounts[lineDto.AccountId];
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

            // Update Account current balance based on its normal balance
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

        _db.JournalEntries.Add(entry);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(entry, $"Journal Entry {entry.EntryNumber} posted successfully."));
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

        // Reverse the effect on account balances
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
                    acc.CurrentBalance -= (line.Credit - line.Debit);
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
        [FromQuery] DateTime? toDate)
    {
        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? "hotel-default";

        // Default date range: current month if not provided
        var now = DateTime.UtcNow;
        var startUtc = fromDate.HasValue
            ? DateTime.SpecifyKind(fromDate.Value.Date, DateTimeKind.Utc)
            : new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var endUtc = toDate.HasValue
            ? DateTime.SpecifyKind(toDate.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc)
            : new DateTime(now.Year, now.Month, DateTime.DaysInMonth(now.Year, now.Month), 23, 59, 59, DateTimeKind.Utc);

        // If no account is specified, pick the first active cash or bank account
        Account? targetAccount = null;
        if (!string.IsNullOrEmpty(accountId))
        {
            targetAccount = await _db.Accounts.FindAsync(accountId);
        }
        else
        {
            targetAccount = await _db.Accounts
                .Where(a => a.IsActive)
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

        // 1. Calculate Opening Balance:
        // Starting with targetAccount.OpeningBalance plus all POSTED lines before startUtc
        var priorLines = await _db.JournalEntryLines
            .Include(l => l.JournalEntry)
            .Where(l => l.AccountId == targetAccount.Id &&
                        l.JournalEntry != null &&
                        l.JournalEntry.Status == "POSTED" &&
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

        // 2. Fetch all POSTED lines within the date range
        var periodLines = await _db.JournalEntryLines
            .Include(l => l.JournalEntry)
            .Where(l => l.AccountId == targetAccount.Id &&
                        l.JournalEntry != null &&
                        l.JournalEntry.Status == "POSTED" &&
                        l.JournalEntry.EntryDate >= startUtc &&
                        l.JournalEntry.EntryDate <= endUtc)
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
                reference = l.JournalEntry.Reference,
                description = l.JournalEntry.Description,
                lineDescription = l.LineDescription,
                sourceModule = l.JournalEntry.SourceModule,
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

    #endregion
}

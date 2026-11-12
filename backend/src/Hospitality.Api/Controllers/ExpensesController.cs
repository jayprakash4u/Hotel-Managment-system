using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/expenses")]
public class ExpensesController : ControllerBase
{
    private readonly HospitalityDbContext _db;
    private readonly ILogger<ExpensesController> _logger;

    public ExpensesController(HospitalityDbContext db, ILogger<ExpensesController> logger)
    {
        _db = db;
        _logger = logger;
    }

    #region Helpers & Default Categories Seeding

    private async Task<string> GetCurrentHotelIdAsync()
    {
        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        return hotel?.Id ?? "hotel-default";
    }

    public static List<ExpenseCategory> GetStandardExpenseCategories(string hotelId, List<Account> accounts)
    {
        var categories = new List<ExpenseCategory>();

        void AddCategory(string name, string type, string code, string desc, int order)
        {
            var acc = accounts.FirstOrDefault(a => a.AccountCode == code);
            if (acc != null)
            {
                categories.Add(new ExpenseCategory
                {
                    HotelId = hotelId,
                    CategoryName = name,
                    CategoryType = type,
                    AccountId = acc.Id,
                    AccountCode = acc.AccountCode,
                    AccountName = acc.AccountName,
                    Description = desc,
                    IsSystem = true,
                    IsActive = true,
                    DisplayOrder = order
                });
            }
        }

        // Operating Expenses
        AddCategory("Rent Expense", "OPERATING", "5210", "Premises, dining hall and parking facility lease rent", 1);
        AddCategory("Electricity Expense", "OPERATING", "5300", "Monthly electric grid power and backup generator diesel fuel", 2);
        AddCategory("Water Expense", "OPERATING", "5310", "Municipal drinking water and commercial tanker supply", 3);
        AddCategory("Internet & Telephone Expense", "OPERATING", "5600", "Broadband Wi-Fi, landline and cloud hospitality systems", 4);
        AddCategory("Salary & Wages Expense", "OPERATING", "5100", "Casual wages, overtime and daily temporary kitchen staff", 5);
        AddCategory("Staff Welfare Expense", "OPERATING", "5120", "Staff duty meals, uniform cleaning, medical and welfare", 6);
        AddCategory("Kitchen Maintenance Expense", "OPERATING", "5410", "Kitchen hood cleaning, chimney duct care and stove repairs", 7);
        AddCategory("Equipment Maintenance Expense", "OPERATING", "5420", "Refrigeration, dishwasher, oven and HVAC servicing", 8);
        AddCategory("Cleaning Expense", "OPERATING", "5200", "Housekeeping detergents, dishwashing chemicals and sanitation", 9);
        AddCategory("Transportation Expense", "OPERATING", "5460", "Local ingredient pickup freight and delivery bike petrol", 10);
        AddCategory("Marketing Expense", "OPERATING", "5500", "Social media ads, billboard banners and promotional flyers", 11);
        AddCategory("Office Supplies Expense", "OPERATING", "5620", "POS thermal receipt paper, stationery and order pads", 12);
        AddCategory("Repair & Maintenance Expense", "OPERATING", "5400", "Plumbing, electrical fixtures and interior dining repairs", 13);
        AddCategory("Bank Charges", "OPERATING", "5700", "POS card swipe fees, cheque clearance and account charges", 14);
        AddCategory("Delivery & Service Expense", "OPERATING", "5720", "Takeaway food packaging boxes, bags and delivery courier costs", 15);
        AddCategory("Other Operating Expenses", "OPERATING", "5900", "Sundry daily restaurant and administrative costs", 16);

        // Non-Operating Expenses
        AddCategory("Interest Expense", "NON_OPERATING", "6100", "Interest charged on commercial bank loans and overdrafts", 17);
        AddCategory("Asset Disposal Loss", "NON_OPERATING", "6200", "Loss recognized on retirement or scrap disposal of used equipment", 18);
        AddCategory("Other Non-Operating Expenses", "NON_OPERATING", "6900", "Non-operational fines, statutory penalties and extraordinary costs", 19);

        return categories;
    }

    private async Task EnsureStandardAccountsAndCategoriesAsync(string hotelId)
    {
        // 1. Ensure Standard Accounts
        var accountsCount = await _db.Accounts.CountAsync();
        if (accountsCount == 0)
        {
            var seedAccounts = AccountsController.GetStandardHospitalityAccounts(hotelId);
            _db.Accounts.AddRange(seedAccounts);
            await _db.SaveChangesAsync();
        }

        // 2. Ensure Standard Expense & Payable Accounts exist
        var existingExpenseAccounts = await _db.Accounts
            .Where(a => a.AccountCode.StartsWith("5") || a.AccountCode.StartsWith("6") || a.AccountCode == "2025")
            .ToListAsync();

        var missingAccounts = new List<Account>();
        void CheckAndAdd(string code, string name, string type, string subCat, string normBal, string desc)
        {
            if (!existingExpenseAccounts.Any(a => a.AccountCode == code))
            {
                missingAccounts.Add(new Account
                {
                    HotelId = hotelId,
                    AccountCode = code,
                    AccountName = name,
                    AccountType = type,
                    SubCategory = subCat,
                    NormalBalance = normBal,
                    Description = desc,
                    IsActive = true
                });
            }
        }

        // Accrued Expense Payable Liability
        CheckAndAdd("2025", "Accrued Expenses & Operating Payables", "LIABILITY", "Payables", "CREDIT", "Unpaid utility bills, rent, services and operational expenses");

        // Expenses
        CheckAndAdd("5210", "Rent Expense", "EXPENSE", "Operating Expense", "DEBIT", "Premises and dining hall monthly lease rent");
        CheckAndAdd("5300", "Electricity & Power Utilities", "EXPENSE", "Utilities", "DEBIT", "Monthly electric grid power and backup generator fuel");
        CheckAndAdd("5310", "Water & Waste Management", "EXPENSE", "Utilities", "DEBIT", "Municipal water supply and trash disposal");
        CheckAndAdd("5600", "Internet, Cloud Software & Telephone", "EXPENSE", "Administrative", "DEBIT", "High-speed Wi-Fi and hospitality software");
        CheckAndAdd("5100", "Staff Payroll & Wages", "EXPENSE", "Operating Expense", "DEBIT", "Casual wages, kitchen and restaurant staff salaries");
        CheckAndAdd("5120", "Staff Welfare & Meals Expense", "EXPENSE", "Operating Expense", "DEBIT", "Staff duty meals, uniform and welfare costs");
        CheckAndAdd("5410", "Kitchen Maintenance Expense", "EXPENSE", "Operating Expense", "DEBIT", "Kitchen chimney cleaning, hood repair and cookware upkeep");
        CheckAndAdd("5420", "Equipment Maintenance Expense", "EXPENSE", "Operating Expense", "DEBIT", "Refrigeration, generator and HVAC servicing");
        CheckAndAdd("5200", "Housekeeping & Cleaning Supplies", "EXPENSE", "Operating Expense", "DEBIT", "Detergents, disinfectants and cleaning items");
        CheckAndAdd("5460", "Transportation Expense", "EXPENSE", "Operating Expense", "DEBIT", "Local transport, freight and delivery vehicle fuel");
        CheckAndAdd("5500", "Marketing & Advertising Expense", "EXPENSE", "Selling & Marketing", "DEBIT", "Promotional ads, flyers and digital campaigns");
        CheckAndAdd("5620", "Office Supplies & Stationery", "EXPENSE", "Administrative", "DEBIT", "Receipt paper rolls, printer toner and office stationery");
        CheckAndAdd("5400", "Repairs, Maintenance & Painting", "EXPENSE", "Operating Expense", "DEBIT", "Plumbing, electrical and AC maintenance");
        CheckAndAdd("5700", "Bank Charges & POS Fees", "EXPENSE", "Financial Expense", "DEBIT", "Card merchant charges and bank maintenance fees");
        CheckAndAdd("5720", "Delivery & Service Expense", "EXPENSE", "Operating Expense", "DEBIT", "Delivery containers, takeaway boxes and packaging");
        CheckAndAdd("5900", "Other Operating Expenses", "EXPENSE", "Operating Expense", "DEBIT", "Sundry daily operational charges");
        CheckAndAdd("6100", "Interest Expense on Borrowings", "EXPENSE", "Non-Operating Expense", "DEBIT", "Bank loan and overdraft financing interest");
        CheckAndAdd("6200", "Loss on Disposal of Fixed Assets", "EXPENSE", "Non-Operating Expense", "DEBIT", "Loss recognized on disposal or scrap of used assets");
        CheckAndAdd("6900", "Other Non-Operating Expenses", "EXPENSE", "Non-Operating Expense", "DEBIT", "Secondary non-operational charges and penalties");

        if (missingAccounts.Count > 0)
        {
            _db.Accounts.AddRange(missingAccounts);
            await _db.SaveChangesAsync();
        }

        // 3. Ensure Standard Categories exist
        var categoriesCount = await _db.ExpenseCategories.CountAsync();
        if (categoriesCount == 0)
        {
            var allAccounts = await _db.Accounts.ToListAsync();
            var seedCategories = GetStandardExpenseCategories(hotelId, allAccounts);
            _db.ExpenseCategories.AddRange(seedCategories);
            await _db.SaveChangesAsync();
        }
    }

    #endregion

    #region 1. Summary & Reports Endpoints

    [HttpGet("summary")]
    public async Task<IActionResult> GetExpenseSummary([FromQuery] DateTime? dateFrom, [FromQuery] DateTime? dateTo)
    {
        var hotelId = await GetCurrentHotelIdAsync();
        await EnsureStandardAccountsAndCategoriesAsync(hotelId);

        var query = _db.ExpenseTransactions.AsQueryable();

        if (dateFrom.HasValue)
            query = query.Where(t => t.ExpenseDate >= dateFrom.Value);

        if (dateTo.HasValue)
            query = query.Where(t => t.ExpenseDate <= dateTo.Value.AddDays(1).AddTicks(-1));

        var transactions = await query.ToListAsync();

        var posted = transactions.Where(t => t.Status == "POSTED").ToList();
        var drafts = transactions.Where(t => t.Status == "DRAFT").ToList();

        var today = DateTime.UtcNow.Date;
        var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var totalExpenses = posted.Sum(t => t.TotalAmount);
        var thisMonthExpenses = _db.ExpenseTransactions
            .Where(t => t.Status == "POSTED" && t.ExpenseDate >= startOfMonth)
            .Sum(t => t.TotalAmount);

        var todayExpenses = _db.ExpenseTransactions
            .Where(t => t.Status == "POSTED" && t.ExpenseDate >= today)
            .Sum(t => t.TotalAmount);

        var operatingExpenses = posted.Where(t => t.CategoryType == "OPERATING").Sum(t => t.TotalAmount);
        var nonOperatingExpenses = posted.Where(t => t.CategoryType == "NON_OPERATING").Sum(t => t.TotalAmount);

        var totalPaid = posted.Sum(t => t.PaidAmount);
        var totalUnpaidPayable = posted.Sum(t => t.RemainingPayable);
        var unpaidCount = posted.Count(t => t.RemainingPayable > 0);

        return Ok(ApiResponse.Ok(new
        {
            TotalExpenses = totalExpenses,
            ThisMonthExpenses = thisMonthExpenses,
            TodayExpenses = todayExpenses,
            TotalDraftExpenses = drafts.Sum(t => t.TotalAmount),
            DraftCount = drafts.Count,
            TotalPostedCount = posted.Count,
            OperatingExpenses = operatingExpenses,
            NonOperatingExpenses = nonOperatingExpenses,
            TotalPaid = totalPaid,
            TotalUnpaidPayable = totalUnpaidPayable,
            UnpaidCount = unpaidCount
        }));
    }

    [HttpGet("reports")]
    public async Task<IActionResult> GetExpenseReports([FromQuery] DateTime? dateFrom, [FromQuery] DateTime? dateTo)
    {
        var query = _db.ExpenseTransactions
            .Where(t => t.Status == "POSTED")
            .AsQueryable();

        if (dateFrom.HasValue)
            query = query.Where(t => t.ExpenseDate >= dateFrom.Value);

        if (dateTo.HasValue)
            query = query.Where(t => t.ExpenseDate <= dateTo.Value.AddDays(1).AddTicks(-1));

        var items = await query.ToListAsync();
        var total = items.Sum(t => t.TotalAmount);

        // Group by Category
        var byCategory = items
            .GroupBy(t => new { t.CategoryId, t.CategoryName, t.CategoryType })
            .Select(g => new
            {
                g.Key.CategoryId,
                g.Key.CategoryName,
                g.Key.CategoryType,
                Count = g.Count(),
                TotalAmount = g.Sum(x => x.TotalAmount),
                Percentage = total > 0 ? Math.Round((g.Sum(x => x.TotalAmount) / total) * 100, 2) : 0
            })
            .OrderByDescending(x => x.TotalAmount)
            .ToList();

        // Group by Payment Account
        var byAccount = items
            .GroupBy(t => new { t.PaymentAccountId, t.PaymentAccountName, t.PaymentAccountCode })
            .Select(g => new
            {
                g.Key.PaymentAccountId,
                g.Key.PaymentAccountName,
                g.Key.PaymentAccountCode,
                Count = g.Count(),
                TotalAmount = g.Sum(x => x.TotalAmount),
                PaidAmount = g.Sum(x => x.PaidAmount),
                RemainingPayable = g.Sum(x => x.RemainingPayable),
                Percentage = total > 0 ? Math.Round((g.Sum(x => x.TotalAmount) / total) * 100, 2) : 0
            })
            .OrderByDescending(x => x.TotalAmount)
            .ToList();

        // Operating vs Non-Operating Breakdown
        var operatingTotal = items.Where(t => t.CategoryType == "OPERATING").Sum(t => t.TotalAmount);
        var nonOperatingTotal = items.Where(t => t.CategoryType == "NON_OPERATING").Sum(t => t.TotalAmount);

        // Outstanding Payables List (Unpaid/Partially Paid)
        var outstandingPayables = items
            .Where(t => t.RemainingPayable > 0)
            .OrderBy(t => t.DueDate ?? t.ExpenseDate)
            .Select(t => new
            {
                t.Id,
                t.VoucherNumber,
                t.ExpenseDate,
                t.DueDate,
                t.CategoryName,
                t.Description,
                t.PaidTo,
                t.TotalAmount,
                t.PaidAmount,
                t.RemainingPayable,
                t.PaymentStatus
            })
            .ToList();

        return Ok(ApiResponse.Ok(new
        {
            TotalExpenses = total,
            TotalPaid = items.Sum(x => x.PaidAmount),
            TotalUnpaidPayable = items.Sum(x => x.RemainingPayable),
            OperatingTotal = operatingTotal,
            NonOperatingTotal = nonOperatingTotal,
            OperatingPercentage = total > 0 ? Math.Round((operatingTotal / total) * 100, 2) : 0,
            NonOperatingPercentage = total > 0 ? Math.Round((nonOperatingTotal / total) * 100, 2) : 0,
            ByCategory = byCategory,
            ByAccount = byAccount,
            OutstandingPayables = outstandingPayables
        }));
    }

    #endregion

    #region 2. Transactions Listing & Detail

    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactions(
        [FromQuery] string? search,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        [FromQuery] string? categoryId,
        [FromQuery] string? categoryType,
        [FromQuery] string? paymentAccountId,
        [FromQuery] string? paymentStatus,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        var hotelId = await GetCurrentHotelIdAsync();
        await EnsureStandardAccountsAndCategoriesAsync(hotelId);

        var query = _db.ExpenseTransactions
            .Include(t => t.Payments)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower();
            query = query.Where(t =>
                t.VoucherNumber.ToLower().Contains(q) ||
                t.Description.ToLower().Contains(q) ||
                (t.ReferenceNumber != null && t.ReferenceNumber.ToLower().Contains(q)) ||
                (t.PaidTo != null && t.PaidTo.ToLower().Contains(q)) ||
                t.CategoryName.ToLower().Contains(q));
        }

        if (dateFrom.HasValue)
            query = query.Where(t => t.ExpenseDate >= dateFrom.Value);

        if (dateTo.HasValue)
            query = query.Where(t => t.ExpenseDate <= dateTo.Value.AddDays(1).AddTicks(-1));

        if (!string.IsNullOrWhiteSpace(categoryId) && !categoryId.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            query = query.Where(t => t.CategoryId == categoryId);

        if (!string.IsNullOrWhiteSpace(categoryType) && !categoryType.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            query = query.Where(t => t.CategoryType == categoryType.ToUpper());

        if (!string.IsNullOrWhiteSpace(paymentAccountId) && !paymentAccountId.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            query = query.Where(t => t.PaymentAccountId == paymentAccountId);

        if (!string.IsNullOrWhiteSpace(paymentStatus) && !paymentStatus.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            query = query.Where(t => t.PaymentStatus == paymentStatus.ToUpper());

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            query = query.Where(t => t.Status == status.ToUpper());

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(t => t.ExpenseDate)
            .ThenByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new
            {
                t.Id,
                t.VoucherNumber,
                t.ExpenseDate,
                t.CategoryId,
                t.CategoryName,
                t.CategoryType,
                t.ExpenseAccountId,
                t.ExpenseAccountCode,
                t.ExpenseAccountName,
                t.Description,
                t.TotalAmount,
                t.PaidAmount,
                t.RemainingPayable,
                t.PaymentStatus,
                t.PaymentMode,
                t.PaymentAccountId,
                t.PaymentAccountCode,
                t.PaymentAccountName,
                t.PaidTo,
                t.ReferenceNumber,
                t.AttachmentUrl,
                t.Notes,
                t.DueDate,
                t.BranchOrOutlet,
                t.Status,
                t.JournalEntryId,
                t.JournalEntryNumber,
                t.ReversalJournalEntryId,
                t.ReversalJournalEntryNumber,
                t.ReversalReason,
                t.ReversedBy,
                t.ReversedAt,
                t.CreatedBy,
                t.PostedBy,
                t.PostedAt,
                t.CreatedAt,
                PaymentCount = t.Payments.Count
            })
            .ToListAsync();

        return Ok(ApiResponse.Ok(new
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("transactions/{id}")]
    public async Task<IActionResult> GetTransactionById(string id)
    {
        var item = await _db.ExpenseTransactions
            .Include(t => t.Payments)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (item == null)
            return NotFound(ApiResponse.Fail("Expense transaction record not found"));

        return Ok(ApiResponse.Ok(item));
    }

    #endregion

    #region 3. Create, Update, Delete (Draft Management)

    public class CreateExpenseDto
    {
        public DateTime ExpenseDate { get; set; }
        public string CategoryId { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public double Amount { get; set; }
        public bool IsPaid { get; set; } = true; // true = Paid immediately; false = Unpaid / Accrual
        public string PaymentMode { get; set; } = "CASH"; // CASH, BANK, WALLET, CHEQUE, CREDIT/UNPAID
        public string? PaymentAccountId { get; set; } // Cash Drawer or Bank or Wallet if paid; or Payable Account if unpaid
        public string? PaidTo { get; set; }
        public string? ReferenceNumber { get; set; }
        public string? AttachmentUrl { get; set; }
        public string? Notes { get; set; }
        public DateTime? DueDate { get; set; }
        public string? BranchOrOutlet { get; set; }
        public bool AutoPost { get; set; } = true;
        public string? CreatedBy { get; set; }
    }

    [HttpPost("transactions")]
    public async Task<IActionResult> CreateTransaction([FromBody] CreateExpenseDto dto)
    {
        if (dto.Amount <= 0)
            return BadRequest(ApiResponse.Fail("Expense amount must be greater than zero."));

        if (string.IsNullOrWhiteSpace(dto.Description))
            return BadRequest(ApiResponse.Fail("Expense description is mandatory."));

        var hotelId = await GetCurrentHotelIdAsync();
        await EnsureStandardAccountsAndCategoriesAsync(hotelId);

        // Validate Category
        var category = await _db.ExpenseCategories.FirstOrDefaultAsync(c => c.Id == dto.CategoryId);
        if (category == null)
            return BadRequest(ApiResponse.Fail("Invalid expense category selected."));

        Account? creditAcc = null;

        if (dto.IsPaid)
        {
            // Must be an active Asset account (Cash drawer, Bank account, or Digital wallet)
            if (string.IsNullOrWhiteSpace(dto.PaymentAccountId))
                return BadRequest(ApiResponse.Fail("Please select a payment account for paid expenses."));

            creditAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == dto.PaymentAccountId && a.AccountType == "ASSET" && !a.IsGroup);
            if (creditAcc == null)
                return BadRequest(ApiResponse.Fail("Invalid payment account. Must be an active Cash, Bank, or Digital Wallet account."));
        }
        else
        {
            // Unpaid / Accrual: Credit Accrued Expenses Payable Liability Account (2025) or Accounts Payable (2010)
            creditAcc = await _db.Accounts.FirstOrDefaultAsync(a => (a.AccountCode == "2025" || a.AccountCode == "2010") && a.AccountType == "LIABILITY");
            if (creditAcc == null)
            {
                // Fallback to any active Accounts Payable liability
                creditAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountType == "LIABILITY" && !a.IsGroup);
            }

            if (creditAcc == null)
                return BadRequest(ApiResponse.Fail("Could not locate an Expense Payable liability account for unpaid expenses."));
        }

        var today = DateTime.UtcNow;
        var seq = await _db.ExpenseTransactions.CountAsync() + 1;
        var voucherNumber = $"EXP-{today.Year}-{seq:D4}";

        var paidAmt = dto.IsPaid ? Math.Round(dto.Amount, 2) : 0;
        var remainingPayable = dto.IsPaid ? 0 : Math.Round(dto.Amount, 2);
        var paymentStatus = dto.IsPaid ? "PAID" : "UNPAID";
        var paymentMode = dto.IsPaid ? (string.IsNullOrWhiteSpace(dto.PaymentMode) ? "CASH" : dto.PaymentMode.ToUpper()) : "CREDIT";

        var transaction = new ExpenseTransaction
        {
            HotelId = hotelId,
            VoucherNumber = voucherNumber,
            ExpenseDate = dto.ExpenseDate != default ? dto.ExpenseDate : today,
            CategoryId = category.Id,
            CategoryName = category.CategoryName,
            CategoryType = category.CategoryType,
            ExpenseAccountId = category.AccountId,
            ExpenseAccountCode = category.AccountCode,
            ExpenseAccountName = category.AccountName,
            Description = dto.Description.Trim(),
            TotalAmount = Math.Round(dto.Amount, 2),
            PaidAmount = paidAmt,
            RemainingPayable = remainingPayable,
            PaymentStatus = paymentStatus,
            PaymentMode = paymentMode,
            PaymentAccountId = creditAcc.Id,
            PaymentAccountCode = creditAcc.AccountCode,
            PaymentAccountName = creditAcc.AccountName,
            PaidTo = dto.PaidTo?.Trim(),
            ReferenceNumber = dto.ReferenceNumber?.Trim(),
            AttachmentUrl = dto.AttachmentUrl?.Trim(),
            Notes = dto.Notes?.Trim(),
            DueDate = dto.DueDate,
            BranchOrOutlet = string.IsNullOrWhiteSpace(dto.BranchOrOutlet) ? creditAcc.BranchOrOutlet ?? "Main Restaurant" : dto.BranchOrOutlet.Trim(),
            Status = dto.AutoPost ? "POSTED" : "DRAFT",
            CreatedBy = string.IsNullOrWhiteSpace(dto.CreatedBy) ? "Staff" : dto.CreatedBy.Trim(),
            PostedBy = dto.AutoPost ? (dto.CreatedBy ?? "Staff") : null,
            PostedAt = dto.AutoPost ? today : null
        };

        // If AutoPost is requested, generate balanced double-entry JournalEntry immediately
        if (dto.AutoPost)
        {
            var jvSeq = await _db.JournalEntries.CountAsync() + 1;
            var jvNumber = $"JV-EXP-{today.Year}-{jvSeq:D4}";

            var narration = $"[Expense Voucher {voucherNumber}] {category.CategoryName}: {transaction.Description}";
            var journalEntry = new JournalEntry
            {
                HotelId = hotelId,
                EntryNumber = jvNumber,
                EntryDate = transaction.ExpenseDate,
                EntryType = "GENERAL",
                SourceModule = "EXPENSES",
                SourceTransactionId = transaction.Id,
                Reference = transaction.ReferenceNumber ?? voucherNumber,
                Description = narration,
                Status = "POSTED",
                CreatedBy = transaction.CreatedBy ?? "Staff",
                PostedBy = transaction.PostedBy ?? "Staff",
                PostedAt = today,
                TotalDebit = transaction.TotalAmount,
                TotalCredit = transaction.TotalAmount
            };

            // Double-Entry:
            // Debit: Expense Account (Increases Expense)
            journalEntry.Lines.Add(new JournalEntryLine
            {
                JournalEntryId = journalEntry.Id,
                AccountId = category.AccountId,
                AccountCode = category.AccountCode,
                AccountName = category.AccountName,
                Debit = transaction.TotalAmount,
                Credit = 0,
                LineDescription = narration
            });

            // Credit: Cash/Bank Asset (if paid) OR Expense Payable Liability (if unpaid)
            journalEntry.Lines.Add(new JournalEntryLine
            {
                JournalEntryId = journalEntry.Id,
                AccountId = creditAcc.Id,
                AccountCode = creditAcc.AccountCode,
                AccountName = creditAcc.AccountName,
                Debit = 0,
                Credit = transaction.TotalAmount,
                LineDescription = dto.IsPaid
                    ? $"Payment via {creditAcc.AccountName} for {voucherNumber}"
                    : $"Accrued expense payable for {voucherNumber}"
            });

            _db.JournalEntries.Add(journalEntry);

            // Update Account Balance:
            if (dto.IsPaid)
            {
                // Asset account decreases with credit
                creditAcc.CurrentBalance -= transaction.TotalAmount;
            }
            else
            {
                // Liability account increases with credit
                creditAcc.CurrentBalance += transaction.TotalAmount;
            }

            transaction.JournalEntryId = journalEntry.Id;
            transaction.JournalEntryNumber = journalEntry.EntryNumber;
        }

        _db.ExpenseTransactions.Add(transaction);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(transaction, $"Expense voucher {voucherNumber} {(dto.AutoPost ? "created and posted successfully" : "saved as draft")}."));
    }

    [HttpPut("transactions/{id}")]
    public async Task<IActionResult> UpdateTransaction(string id, [FromBody] CreateExpenseDto dto)
    {
        var transaction = await _db.ExpenseTransactions.FirstOrDefaultAsync(t => t.Id == id);
        if (transaction == null)
            return NotFound(ApiResponse.Fail("Expense transaction not found."));

        if (transaction.Status != "DRAFT")
            return BadRequest(ApiResponse.Fail("Only Draft expense vouchers can be modified. Posted expenses are immutable and must be corrected using reversals."));

        if (dto.Amount <= 0)
            return BadRequest(ApiResponse.Fail("Expense amount must be greater than zero."));

        if (string.IsNullOrWhiteSpace(dto.Description))
            return BadRequest(ApiResponse.Fail("Expense description is mandatory."));

        var category = await _db.ExpenseCategories.FirstOrDefaultAsync(c => c.Id == dto.CategoryId);
        if (category == null)
            return BadRequest(ApiResponse.Fail("Invalid expense category."));

        Account? creditAcc = null;
        if (dto.IsPaid)
        {
            creditAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == dto.PaymentAccountId && a.AccountType == "ASSET" && !a.IsGroup);
            if (creditAcc == null)
                return BadRequest(ApiResponse.Fail("Invalid payment asset account."));
        }
        else
        {
            creditAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "2025" || a.AccountCode == "2010");
            if (creditAcc == null)
                creditAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountType == "LIABILITY" && !a.IsGroup);
        }

        if (creditAcc == null)
            return BadRequest(ApiResponse.Fail("Unable to locate appropriate payment or payable account."));

        transaction.ExpenseDate = dto.ExpenseDate != default ? dto.ExpenseDate : transaction.ExpenseDate;
        transaction.CategoryId = category.Id;
        transaction.CategoryName = category.CategoryName;
        transaction.CategoryType = category.CategoryType;
        transaction.ExpenseAccountId = category.AccountId;
        transaction.ExpenseAccountCode = category.AccountCode;
        transaction.ExpenseAccountName = category.AccountName;
        transaction.Description = dto.Description.Trim();
        transaction.TotalAmount = Math.Round(dto.Amount, 2);
        transaction.PaidAmount = dto.IsPaid ? Math.Round(dto.Amount, 2) : 0;
        transaction.RemainingPayable = dto.IsPaid ? 0 : Math.Round(dto.Amount, 2);
        transaction.PaymentStatus = dto.IsPaid ? "PAID" : "UNPAID";
        transaction.PaymentMode = dto.IsPaid ? (string.IsNullOrWhiteSpace(dto.PaymentMode) ? "CASH" : dto.PaymentMode.ToUpper()) : "CREDIT";
        transaction.PaymentAccountId = creditAcc.Id;
        transaction.PaymentAccountCode = creditAcc.AccountCode;
        transaction.PaymentAccountName = creditAcc.AccountName;
        transaction.PaidTo = dto.PaidTo?.Trim();
        transaction.ReferenceNumber = dto.ReferenceNumber?.Trim();
        transaction.AttachmentUrl = dto.AttachmentUrl?.Trim();
        transaction.Notes = dto.Notes?.Trim();
        transaction.DueDate = dto.DueDate;
        transaction.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(transaction, "Expense draft updated successfully."));
    }

    [HttpDelete("transactions/{id}")]
    public async Task<IActionResult> DeleteTransaction(string id)
    {
        var transaction = await _db.ExpenseTransactions.FirstOrDefaultAsync(t => t.Id == id);
        if (transaction == null)
            return NotFound(ApiResponse.Fail("Expense transaction not found."));

        if (transaction.Status != "DRAFT")
            return BadRequest(ApiResponse.Fail("Only Draft expenses can be deleted. Posted records must be reversed to preserve general ledger integrity."));

        _db.ExpenseTransactions.Remove(transaction);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok("Expense draft deleted successfully."));
    }

    #endregion

    #region 4. Post Draft to General Ledger

    public class PostActionDto
    {
        public string? PostedBy { get; set; }
    }

    [HttpPost("transactions/{id}/post")]
    public async Task<IActionResult> PostTransaction(string id, [FromBody] PostActionDto? dto)
    {
        var transaction = await _db.ExpenseTransactions.FirstOrDefaultAsync(t => t.Id == id);
        if (transaction == null)
            return NotFound(ApiResponse.Fail("Expense transaction not found."));

        if (transaction.Status == "POSTED")
            return BadRequest(ApiResponse.Fail("This expense voucher is already posted."));

        if (transaction.Status == "REVERSED")
            return BadRequest(ApiResponse.Fail("Cannot post a reversed expense voucher."));

        var creditAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == transaction.PaymentAccountId);
        if (creditAcc == null)
            return BadRequest(ApiResponse.Fail("Payment or payable account not found in Chart of Accounts."));

        var expenseAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == transaction.ExpenseAccountId);
        if (expenseAcc == null)
            return BadRequest(ApiResponse.Fail("Expense account not found in Chart of Accounts."));

        var hotelId = await GetCurrentHotelIdAsync();
        var today = DateTime.UtcNow;
        var jvSeq = await _db.JournalEntries.CountAsync() + 1;
        var jvNumber = $"JV-EXP-{today.Year}-{jvSeq:D4}";

        var narration = $"[Expense Voucher {transaction.VoucherNumber}] {transaction.CategoryName}: {transaction.Description}";
        var journalEntry = new JournalEntry
        {
            HotelId = hotelId,
            EntryNumber = jvNumber,
            EntryDate = transaction.ExpenseDate,
            EntryType = "GENERAL",
            SourceModule = "EXPENSES",
            SourceTransactionId = transaction.Id,
            Reference = transaction.ReferenceNumber ?? transaction.VoucherNumber,
            Description = narration,
            Status = "POSTED",
            CreatedBy = transaction.CreatedBy ?? "Staff",
            PostedBy = string.IsNullOrWhiteSpace(dto?.PostedBy) ? "Accountant" : dto.PostedBy.Trim(),
            PostedAt = today,
            TotalDebit = transaction.TotalAmount,
            TotalCredit = transaction.TotalAmount
        };

        // Debit: Expense Account (Increases Expense)
        journalEntry.Lines.Add(new JournalEntryLine
        {
            JournalEntryId = journalEntry.Id,
            AccountId = expenseAcc.Id,
            AccountCode = expenseAcc.AccountCode,
            AccountName = expenseAcc.AccountName,
            Debit = transaction.TotalAmount,
            Credit = 0,
            LineDescription = narration
        });

        // Credit: Cash/Bank Asset (if paid) OR Expense Payable Liability (if unpaid)
        journalEntry.Lines.Add(new JournalEntryLine
        {
            JournalEntryId = journalEntry.Id,
            AccountId = creditAcc.Id,
            AccountCode = creditAcc.AccountCode,
            AccountName = creditAcc.AccountName,
            Debit = 0,
            Credit = transaction.TotalAmount,
            LineDescription = transaction.PaymentStatus == "PAID"
                ? $"Payment via {creditAcc.AccountName} for {transaction.VoucherNumber}"
                : $"Accrued expense payable for {transaction.VoucherNumber}"
        });

        _db.JournalEntries.Add(journalEntry);

        // Update Account Balance:
        if (transaction.PaymentStatus == "PAID")
        {
            creditAcc.CurrentBalance -= transaction.TotalAmount;
        }
        else
        {
            creditAcc.CurrentBalance += transaction.TotalAmount;
        }

        transaction.Status = "POSTED";
        transaction.PostedBy = journalEntry.PostedBy;
        transaction.PostedAt = today;
        transaction.JournalEntryId = journalEntry.Id;
        transaction.JournalEntryNumber = journalEntry.EntryNumber;
        transaction.UpdatedAt = today;

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            transaction.Id,
            transaction.VoucherNumber,
            transaction.Status,
            transaction.JournalEntryNumber,
            transaction.TotalAmount,
            PaymentAccountNewBalance = creditAcc.CurrentBalance
        }, $"Expense voucher {transaction.VoucherNumber} posted successfully. Journal voucher {journalEntry.EntryNumber} created."));
    }

    #endregion

    #region 5. Record Payment for Unpaid / Partially Paid Expenses

    public class RecordPaymentDto
    {
        public DateTime PaymentDate { get; set; }
        public double Amount { get; set; }
        public string PaymentMode { get; set; } = "CASH"; // CASH, BANK, WALLET, CHEQUE
        public string PaymentAccountId { get; set; } = string.Empty; // Cash or Bank or Wallet Asset
        public string? ReferenceNumber { get; set; }
        public string? PaidBy { get; set; }
        public string? Notes { get; set; }
    }

    [HttpPost("transactions/{id}/payments")]
    public async Task<IActionResult> RecordPayment(string id, [FromBody] RecordPaymentDto dto)
    {
        if (dto.Amount <= 0)
            return BadRequest(ApiResponse.Fail("Payment amount must be greater than zero."));

        var transaction = await _db.ExpenseTransactions
            .Include(t => t.Payments)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (transaction == null)
            return NotFound(ApiResponse.Fail("Expense transaction not found."));

        if (transaction.Status != "POSTED")
            return BadRequest(ApiResponse.Fail("Payments can only be recorded against Posted expense vouchers."));

        if (transaction.RemainingPayable <= 0)
            return BadRequest(ApiResponse.Fail("This expense voucher is already fully settled."));

        var paymentAmount = Math.Round(dto.Amount, 2);
        if (paymentAmount > Math.Round(transaction.RemainingPayable, 2))
            return BadRequest(ApiResponse.Fail($"Payment amount (Rs. {paymentAmount}) exceeds the remaining payable balance (Rs. {transaction.RemainingPayable})."));

        // Validate Asset Payment Account (Cash drawer, Bank account, or Digital Wallet)
        var paymentAssetAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == dto.PaymentAccountId && a.AccountType == "ASSET" && !a.IsGroup);
        if (paymentAssetAcc == null)
            return BadRequest(ApiResponse.Fail("Invalid payment account. Must be an active Cash, Bank, or Digital Wallet account."));

        // Identify the Accrued Payable Liability Account
        var payableAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == transaction.PaymentAccountId && a.AccountType == "LIABILITY");
        if (payableAcc == null)
        {
            payableAcc = await _db.Accounts.FirstOrDefaultAsync(a => (a.AccountCode == "2025" || a.AccountCode == "2010") && a.AccountType == "LIABILITY");
        }

        if (payableAcc == null)
            return BadRequest(ApiResponse.Fail("Accrued Expense Payable liability account could not be found."));

        var hotelId = await GetCurrentHotelIdAsync();
        var today = DateTime.UtcNow;
        var pmtSeq = await _db.ExpensePayments.CountAsync() + 1;
        var receiptNumber = $"PMT-EXP-{today.Year}-{pmtSeq:D4}";

        var jvSeq = await _db.JournalEntries.CountAsync() + 1;
        var jvNumber = $"JV-PMT-{today.Year}-{jvSeq:D4}";

        var narration = $"[Payment {receiptNumber}] Settlement for Expense {transaction.VoucherNumber} ({transaction.CategoryName}): {transaction.Description}";

        // Balanced Double-Entry for paying an unpaid expense:
        // Debit: Accrued Expenses Payable (Decreases Liability)
        // Credit: Cash/Bank Asset Account (Decreases Cash/Bank Asset)
        // IMPORTANT: The expense itself is NOT recorded a second time!
        var journalEntry = new JournalEntry
        {
            HotelId = hotelId,
            EntryNumber = jvNumber,
            EntryDate = dto.PaymentDate != default ? dto.PaymentDate : today,
            EntryType = "PAYMENT",
            SourceModule = "EXPENSES",
            SourceTransactionId = transaction.Id,
            Reference = dto.ReferenceNumber ?? receiptNumber,
            Description = narration,
            Status = "POSTED",
            CreatedBy = string.IsNullOrWhiteSpace(dto.PaidBy) ? "Cashier" : dto.PaidBy.Trim(),
            PostedBy = string.IsNullOrWhiteSpace(dto.PaidBy) ? "Cashier" : dto.PaidBy.Trim(),
            PostedAt = today,
            TotalDebit = paymentAmount,
            TotalCredit = paymentAmount
        };

        // Debit: Payable Liability
        journalEntry.Lines.Add(new JournalEntryLine
        {
            JournalEntryId = journalEntry.Id,
            AccountId = payableAcc.Id,
            AccountCode = payableAcc.AccountCode,
            AccountName = payableAcc.AccountName,
            Debit = paymentAmount,
            Credit = 0,
            LineDescription = $"Settlement of payable for {transaction.VoucherNumber}"
        });

        // Credit: Cash/Bank Asset
        journalEntry.Lines.Add(new JournalEntryLine
        {
            JournalEntryId = journalEntry.Id,
            AccountId = paymentAssetAcc.Id,
            AccountCode = paymentAssetAcc.AccountCode,
            AccountName = paymentAssetAcc.AccountName,
            Debit = 0,
            Credit = paymentAmount,
            LineDescription = $"Disbursement via {paymentAssetAcc.AccountName} for {transaction.VoucherNumber}"
        });

        _db.JournalEntries.Add(journalEntry);

        // Update Account Balances
        payableAcc.CurrentBalance -= paymentAmount; // Decreases liability
        paymentAssetAcc.CurrentBalance -= paymentAmount; // Decreases asset cash/bank

        // Create Payment Line
        var payment = new ExpensePayment
        {
            ExpenseTransactionId = transaction.Id,
            PaymentReceiptNumber = receiptNumber,
            PaymentDate = dto.PaymentDate != default ? dto.PaymentDate : today,
            Amount = paymentAmount,
            PaymentMode = string.IsNullOrWhiteSpace(dto.PaymentMode) ? "CASH" : dto.PaymentMode.ToUpper(),
            PaymentAccountId = paymentAssetAcc.Id,
            PaymentAccountCode = paymentAssetAcc.AccountCode,
            PaymentAccountName = paymentAssetAcc.AccountName,
            ReferenceNumber = dto.ReferenceNumber?.Trim(),
            PaidBy = journalEntry.PostedBy,
            Notes = dto.Notes?.Trim(),
            JournalEntryId = journalEntry.Id,
            JournalEntryNumber = journalEntry.EntryNumber
        };

        _db.ExpensePayments.Add(payment);

        // Update Transaction Payable and Status
        transaction.PaidAmount += paymentAmount;
        transaction.RemainingPayable -= paymentAmount;
        if (transaction.RemainingPayable <= 0.001)
        {
            transaction.RemainingPayable = 0;
            transaction.PaymentStatus = "PAID";
        }
        else
        {
            transaction.PaymentStatus = "PARTIALLY_PAID";
        }

        transaction.UpdatedAt = today;
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            PaymentReceiptNumber = receiptNumber,
            JournalEntryNumber = jvNumber,
            PaidAmount = paymentAmount,
            RemainingPayable = transaction.RemainingPayable,
            PaymentStatus = transaction.PaymentStatus,
            PaymentAccountNewBalance = paymentAssetAcc.CurrentBalance
        }, $"Payment of Rs. {paymentAmount} recorded successfully under receipt {receiptNumber}."));
    }

    #endregion

    #region 6. Reverse Posted Expense Transaction

    public class ReverseActionDto
    {
        public string Reason { get; set; } = string.Empty;
        public string? ReversedBy { get; set; }
    }

    [HttpPost("transactions/{id}/reverse")]
    public async Task<IActionResult> ReverseTransaction(string id, [FromBody] ReverseActionDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Reason))
            return BadRequest(ApiResponse.Fail("Reversal reason is mandatory for audit trail."));

        var transaction = await _db.ExpenseTransactions
            .Include(t => t.Payments)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (transaction == null)
            return NotFound(ApiResponse.Fail("Expense transaction not found."));

        if (transaction.Status != "POSTED")
            return BadRequest(ApiResponse.Fail("Only Posted expense transactions can be reversed."));

        var creditAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == transaction.PaymentAccountId);
        if (creditAcc == null)
            return BadRequest(ApiResponse.Fail("Original payment/payable account not found in Chart of Accounts."));

        var expenseAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == transaction.ExpenseAccountId);
        if (expenseAcc == null)
            return BadRequest(ApiResponse.Fail("Expense account not found in Chart of Accounts."));

        var hotelId = await GetCurrentHotelIdAsync();
        var today = DateTime.UtcNow;
        var revSeq = await _db.JournalEntries.CountAsync() + 1;
        var revNumber = $"JV-REV-{today.Year}-{revSeq:D4}";

        var narration = $"[REVERSAL of {transaction.VoucherNumber}] Reason: {dto.Reason.Trim()} - {transaction.Description}";
        var reversalEntry = new JournalEntry
        {
            HotelId = hotelId,
            EntryNumber = revNumber,
            EntryDate = today,
            EntryType = "ADJUSTMENT",
            SourceModule = "EXPENSES",
            SourceTransactionId = transaction.Id,
            Reference = $"REV-{transaction.VoucherNumber}",
            Description = narration,
            Status = "POSTED",
            CreatedBy = string.IsNullOrWhiteSpace(dto.ReversedBy) ? "Accountant" : dto.ReversedBy.Trim(),
            PostedBy = string.IsNullOrWhiteSpace(dto.ReversedBy) ? "Accountant" : dto.ReversedBy.Trim(),
            PostedAt = today,
            TotalDebit = transaction.TotalAmount,
            TotalCredit = transaction.TotalAmount
        };

        // Reversal Double-Entry:
        // Debit: Cash/Bank Asset (if was paid) OR Expense Payable Liability (if was unpaid)
        reversalEntry.Lines.Add(new JournalEntryLine
        {
            JournalEntryId = reversalEntry.Id,
            AccountId = creditAcc.Id,
            AccountCode = creditAcc.AccountCode,
            AccountName = creditAcc.AccountName,
            Debit = transaction.TotalAmount,
            Credit = 0,
            LineDescription = $"Reversal restoring {creditAcc.AccountName} for {transaction.VoucherNumber}"
        });

        // Credit: Expense Account (Decreases Expense)
        reversalEntry.Lines.Add(new JournalEntryLine
        {
            JournalEntryId = reversalEntry.Id,
            AccountId = expenseAcc.Id,
            AccountCode = expenseAcc.AccountCode,
            AccountName = expenseAcc.AccountName,
            Debit = 0,
            Credit = transaction.TotalAmount,
            LineDescription = $"Reversal of Expense {transaction.VoucherNumber}: {dto.Reason.Trim()}"
        });

        _db.JournalEntries.Add(reversalEntry);

        // Reverse Account Balance:
        if (transaction.PaymentMode != "CREDIT" && transaction.PaidAmount > 0)
        {
            creditAcc.CurrentBalance += transaction.TotalAmount; // Restores Cash/Bank
        }
        else
        {
            creditAcc.CurrentBalance -= transaction.TotalAmount; // Clears Liability
        }

        // If there were any subsequent partial payments recorded against an unpaid bill, reverse each payment's cash impact
        foreach (var p in transaction.Payments)
        {
            var pmtAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == p.PaymentAccountId);
            if (pmtAcc != null)
            {
                pmtAcc.CurrentBalance += p.Amount; // Restores cash spent on payment
            }
        }

        transaction.Status = "REVERSED";
        transaction.ReversalJournalEntryId = reversalEntry.Id;
        transaction.ReversalJournalEntryNumber = reversalEntry.EntryNumber;
        transaction.ReversalReason = dto.Reason.Trim();
        transaction.ReversedBy = reversalEntry.PostedBy;
        transaction.ReversedAt = today;
        transaction.UpdatedAt = today;

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            transaction.Id,
            transaction.VoucherNumber,
            transaction.Status,
            transaction.ReversalJournalEntryNumber,
            PaymentAccountNewBalance = creditAcc.CurrentBalance
        }, $"Expense voucher {transaction.VoucherNumber} reversed successfully. Reversal voucher {reversalEntry.EntryNumber} posted."));
    }

    #endregion

    #region 7. Configurable Expense Categories

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var hotelId = await GetCurrentHotelIdAsync();
        await EnsureStandardAccountsAndCategoriesAsync(hotelId);

        var categories = await _db.ExpenseCategories
            .OrderBy(c => c.CategoryType)
            .ThenBy(c => c.DisplayOrder)
            .ThenBy(c => c.CategoryName)
            .ToListAsync();

        return Ok(ApiResponse.Ok(categories));
    }

    public class CreateExpenseCategoryDto
    {
        public string CategoryName { get; set; } = string.Empty;
        public string CategoryType { get; set; } = "OPERATING"; // OPERATING or NON_OPERATING
        public string AccountId { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int DisplayOrder { get; set; } = 0;
    }

    [HttpPost("categories")]
    public async Task<IActionResult> CreateCategory([FromBody] CreateExpenseCategoryDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.CategoryName))
            return BadRequest(ApiResponse.Fail("Category name is required."));

        var hotelId = await GetCurrentHotelIdAsync();

        var account = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == dto.AccountId);
        if (account == null)
            return BadRequest(ApiResponse.Fail("Invalid Chart of Accounts link."));

        var category = new ExpenseCategory
        {
            HotelId = hotelId,
            CategoryName = dto.CategoryName.Trim(),
            CategoryType = dto.CategoryType.ToUpper() == "NON_OPERATING" ? "NON_OPERATING" : "OPERATING",
            AccountId = account.Id,
            AccountCode = account.AccountCode,
            AccountName = account.AccountName,
            Description = dto.Description?.Trim(),
            IsSystem = false,
            IsActive = true,
            DisplayOrder = dto.DisplayOrder
        };

        _db.ExpenseCategories.Add(category);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(category, "Expense category created successfully."));
    }

    [HttpPut("categories/{id}")]
    public async Task<IActionResult> UpdateCategory(string id, [FromBody] CreateExpenseCategoryDto dto)
    {
        var category = await _db.ExpenseCategories.FirstOrDefaultAsync(c => c.Id == id);
        if (category == null)
            return NotFound(ApiResponse.Fail("Expense category not found."));

        if (!string.IsNullOrWhiteSpace(dto.CategoryName))
            category.CategoryName = dto.CategoryName.Trim();

        category.CategoryType = dto.CategoryType.ToUpper() == "NON_OPERATING" ? "NON_OPERATING" : "OPERATING";
        category.Description = dto.Description?.Trim();
        category.DisplayOrder = dto.DisplayOrder;

        if (!string.IsNullOrWhiteSpace(dto.AccountId) && dto.AccountId != category.AccountId)
        {
            var account = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == dto.AccountId);
            if (account != null)
            {
                category.AccountId = account.Id;
                category.AccountCode = account.AccountCode;
                category.AccountName = account.AccountName;
            }
        }

        category.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(category, "Expense category updated successfully."));
    }

    [HttpDelete("categories/{id}")]
    public async Task<IActionResult> DeleteCategory(string id)
    {
        var category = await _db.ExpenseCategories.FirstOrDefaultAsync(c => c.Id == id);
        if (category == null)
            return NotFound(ApiResponse.Fail("Expense category not found."));

        if (category.IsSystem)
            return BadRequest(ApiResponse.Fail("System default categories cannot be deleted. You may deactivate them instead."));

        var hasTransactions = await _db.ExpenseTransactions.AnyAsync(t => t.CategoryId == id);
        if (hasTransactions)
            return BadRequest(ApiResponse.Fail("Cannot delete this category because expense records are attached to it. Please deactivate it instead."));

        _db.ExpenseCategories.Remove(category);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok("Expense category deleted successfully."));
    }

    #endregion

    #region 8. Payment Accounts (Cash, Bank, Wallets, and Payables)

    [HttpGet("payment-accounts")]
    public async Task<IActionResult> GetPaymentAccounts()
    {
        var hotelId = await GetCurrentHotelIdAsync();
        await EnsureStandardAccountsAndCategoriesAsync(hotelId);

        // Load all active cash registers/drawers, bank accounts, digital wallets, and expense payables
        var accounts = await _db.Accounts
            .Where(a => !a.IsGroup && a.IsActive &&
                ((a.AccountType == "ASSET" &&
                  (a.SubCategory == "Cash & Cash Equivalents" ||
                   a.SubCategory == "Bank Accounts" ||
                   a.SubCategory == "Digital Wallets" ||
                   a.AccountCode.StartsWith("101") ||
                   a.AccountCode.StartsWith("102") ||
                   a.AccountCode.StartsWith("103") ||
                   a.AccountCode.StartsWith("104") ||
                   a.AccountCode.StartsWith("105") ||
                   a.AccountCode.StartsWith("107"))) ||
                 (a.AccountType == "LIABILITY" &&
                  (a.AccountCode == "2025" || a.AccountCode == "2010" || a.SubCategory == "Payables"))))
            .OrderBy(a => a.AccountCode)
            .Select(a => new
            {
                a.Id,
                a.AccountCode,
                a.AccountName,
                AccountType = a.AccountType == "LIABILITY" ? "PAYABLE" : (a.SubCategory == "Digital Wallets" || a.WalletProvider != null ? "WALLET" : (a.SubCategory == "Bank Accounts" || a.BankName != null ? "BANK" : "CASH")),
                Classification = a.AccountType,
                a.SubCategory,
                a.BranchOrOutlet,
                a.BankName,
                a.AccountNumber,
                a.WalletProvider,
                a.MerchantId,
                a.CurrentBalance
            })
            .ToListAsync();

        return Ok(ApiResponse.Ok(accounts));
    }

    #endregion
}


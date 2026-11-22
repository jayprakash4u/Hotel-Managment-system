using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/income")]
public class IncomeController : ControllerBase
{
    private readonly HospitalityDbContext _db;
    private readonly ILogger<IncomeController> _logger;

    public IncomeController(HospitalityDbContext db, ILogger<IncomeController> logger)
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

    public static List<IncomeCategory> GetStandardIncomeCategories(string hotelId, List<Account> accounts)
    {
        var categories = new List<IncomeCategory>();

        void AddCategory(string name, string type, string code, string desc, int order)
        {
            var acc = accounts.FirstOrDefault(a => a.AccountCode == code);
            if (acc != null)
            {
                categories.Add(new IncomeCategory
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

        // Operating Income
        AddCategory("Catering Income", "OPERATING", "4310", "Outdoor catering, offsite food deliveries and corporate meal packages", 1);
        AddCategory("Event / Party Income", "OPERATING", "4320", "Private hall reservations, birthday and anniversary party bookings", 2);
        AddCategory("Delivery Service Income", "OPERATING", "4330", "Direct home delivery packaging and courier fees outside POS", 3);
        AddCategory("Service Income", "OPERATING", "4340", "Specialized hospitality services and setup charges", 4);
        AddCategory("Other Operating Income", "OPERATING", "4350", "Miscellaneous daily operational earnings", 5);

        // Non-Operating Income
        AddCategory("Bank Interest Income", "NON_OPERATING", "4910", "Interest credited on bank accounts and savings deposits", 6);
        AddCategory("Discount Received", "NON_OPERATING", "4920", "Early payment settlement and trade discounts received", 7);
        AddCategory("Asset Disposal Gain", "NON_OPERATING", "4930", "Gains from disposal of used equipment, old furniture and scrap", 8);
        AddCategory("Other Non-Operating Income", "NON_OPERATING", "4990", "Secondary non-operating gains and dividends", 9);

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

        // 2. Ensure Standard Income Accounts exist if added recently
        var existingIncomeAccounts = await _db.Accounts
            .Where(a => a.AccountCode.StartsWith("43") || a.AccountCode.StartsWith("49"))
            .ToListAsync();

        var missingAccounts = new List<Account>();
        void CheckAndAdd(string code, string name, string subCat, string desc)
        {
            if (!existingIncomeAccounts.Any(a => a.AccountCode == code))
            {
                missingAccounts.Add(new Account
                {
                    HotelId = hotelId,
                    AccountCode = code,
                    AccountName = name,
                    AccountType = "REVENUE",
                    SubCategory = subCat,
                    NormalBalance = "CREDIT",
                    Description = desc,
                    IsActive = true
                });
            }
        }

        CheckAndAdd("4310", "Catering Income", "Operating Revenue", "Outdoor & offsite catering packages");
        CheckAndAdd("4320", "Event & Party Income", "Operating Revenue", "Private functions and party reservations");
        CheckAndAdd("4330", "Delivery Service Income", "Operating Revenue", "Packaging and delivery fees outside POS");
        CheckAndAdd("4340", "Service Income", "Operating Revenue", "Custom hospitality support charges");
        CheckAndAdd("4350", "Other Operating Income", "Operating Revenue", "Miscellaneous operating revenues");
        CheckAndAdd("4910", "Bank Interest Income", "Other Revenue", "Bank savings interest earned");
        CheckAndAdd("4920", "Discount Received", "Other Revenue", "Discounts received on supplier settlements");
        CheckAndAdd("4930", "Asset Disposal Gain", "Other Revenue", "Gain on disposal of fixed assets or scrap");
        CheckAndAdd("4990", "Other Non-Operating Income", "Other Revenue", "Non-core business earnings");

        if (missingAccounts.Count > 0)
        {
            _db.Accounts.AddRange(missingAccounts);
            await _db.SaveChangesAsync();
        }

        // 3. Ensure Standard Categories exist
        var categoriesCount = await _db.IncomeCategories.CountAsync();
        if (categoriesCount == 0)
        {
            var allAccounts = await _db.Accounts.ToListAsync();
            var seedCategories = GetStandardIncomeCategories(hotelId, allAccounts);
            _db.IncomeCategories.AddRange(seedCategories);
            await _db.SaveChangesAsync();
        }
    }

    #endregion

    #region 1. Summary & Reports Endpoints

    [HttpGet("summary")]
    public async Task<IActionResult> GetIncomeSummary([FromQuery] DateTime? dateFrom, [FromQuery] DateTime? dateTo)
    {
        var hotelId = await GetCurrentHotelIdAsync();
        await EnsureStandardAccountsAndCategoriesAsync(hotelId);

        var query = _db.IncomeTransactions.AsQueryable();

        if (dateFrom.HasValue)
            query = query.Where(t => t.IncomeDate >= dateFrom.Value);

        if (dateTo.HasValue)
            query = query.Where(t => t.IncomeDate <= dateTo.Value.AddDays(1).AddTicks(-1));

        var transactions = await query.ToListAsync();

        var posted = transactions.Where(t => t.Status == "POSTED").ToList();
        var drafts = transactions.Where(t => t.Status == "DRAFT").ToList();

        var today = DateTime.UtcNow.Date;
        var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var totalIncome = posted.Sum(t => t.Amount);
        var thisMonthIncome = _db.IncomeTransactions
            .Where(t => t.Status == "POSTED" && t.IncomeDate >= startOfMonth)
            .Sum(t => t.Amount);

        var todayIncome = _db.IncomeTransactions
            .Where(t => t.Status == "POSTED" && t.IncomeDate >= today)
            .Sum(t => t.Amount);

        var operatingIncome = posted.Where(t => t.CategoryType == "OPERATING").Sum(t => t.Amount);
        var nonOperatingIncome = posted.Where(t => t.CategoryType == "NON_OPERATING").Sum(t => t.Amount);

        return Ok(ApiResponse.Ok(new
        {
            TotalIncome = totalIncome,
            ThisMonthIncome = thisMonthIncome,
            TodayIncome = todayIncome,
            TotalDraftIncome = drafts.Sum(t => t.Amount),
            DraftCount = drafts.Count,
            TotalPostedCount = posted.Count,
            OperatingIncome = operatingIncome,
            NonOperatingIncome = nonOperatingIncome
        }));
    }

    [HttpGet("reports")]
    public async Task<IActionResult> GetIncomeReports([FromQuery] DateTime? dateFrom, [FromQuery] DateTime? dateTo)
    {
        var query = _db.IncomeTransactions
            .Where(t => t.Status == "POSTED")
            .AsQueryable();

        if (dateFrom.HasValue)
            query = query.Where(t => t.IncomeDate >= dateFrom.Value);

        if (dateTo.HasValue)
            query = query.Where(t => t.IncomeDate <= dateTo.Value.AddDays(1).AddTicks(-1));

        var items = await query.ToListAsync();
        var total = items.Sum(t => t.Amount);

        // Group by Category
        var byCategory = items
            .GroupBy(t => new { t.CategoryId, t.CategoryName, t.CategoryType })
            .Select(g => new
            {
                g.Key.CategoryId,
                g.Key.CategoryName,
                g.Key.CategoryType,
                Count = g.Count(),
                TotalAmount = g.Sum(x => x.Amount),
                Percentage = total > 0 ? Math.Round((g.Sum(x => x.Amount) / total) * 100, 2) : 0
            })
            .OrderByDescending(x => x.TotalAmount)
            .ToList();

        // Group by Receiving Account
        var byAccount = items
            .GroupBy(t => new { t.ReceivingAccountId, t.ReceivingAccountName, t.ReceivingAccountCode })
            .Select(g => new
            {
                g.Key.ReceivingAccountId,
                g.Key.ReceivingAccountName,
                g.Key.ReceivingAccountCode,
                Count = g.Count(),
                TotalAmount = g.Sum(x => x.Amount),
                Percentage = total > 0 ? Math.Round((g.Sum(x => x.Amount) / total) * 100, 2) : 0
            })
            .OrderByDescending(x => x.TotalAmount)
            .ToList();

        // Operating vs Non-Operating Breakdown
        var operatingTotal = items.Where(t => t.CategoryType == "OPERATING").Sum(t => t.Amount);
        var nonOperatingTotal = items.Where(t => t.CategoryType == "NON_OPERATING").Sum(t => t.Amount);

        return Ok(ApiResponse.Ok(new
        {
            TotalIncome = total,
            OperatingTotal = operatingTotal,
            NonOperatingTotal = nonOperatingTotal,
            OperatingPercentage = total > 0 ? Math.Round((operatingTotal / total) * 100, 2) : 0,
            NonOperatingPercentage = total > 0 ? Math.Round((nonOperatingTotal / total) * 100, 2) : 0,
            ByCategory = byCategory,
            ByAccount = byAccount
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
        [FromQuery] string? receivingAccountId,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        var hotelId = await GetCurrentHotelIdAsync();
        await EnsureStandardAccountsAndCategoriesAsync(hotelId);

        var query = _db.IncomeTransactions.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower();
            query = query.Where(t =>
                t.VoucherNumber.ToLower().Contains(q) ||
                t.Description.ToLower().Contains(q) ||
                (t.ReferenceNumber != null && t.ReferenceNumber.ToLower().Contains(q)) ||
                (t.PayerName != null && t.PayerName.ToLower().Contains(q)) ||
                t.CategoryName.ToLower().Contains(q));
        }

        if (dateFrom.HasValue)
            query = query.Where(t => t.IncomeDate >= dateFrom.Value);

        if (dateTo.HasValue)
            query = query.Where(t => t.IncomeDate <= dateTo.Value.AddDays(1).AddTicks(-1));

        if (!string.IsNullOrWhiteSpace(categoryId) && !categoryId.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            query = query.Where(t => t.CategoryId == categoryId);

        if (!string.IsNullOrWhiteSpace(categoryType) && !categoryType.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            query = query.Where(t => t.CategoryType == categoryType.ToUpper());

        if (!string.IsNullOrWhiteSpace(receivingAccountId) && !receivingAccountId.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            query = query.Where(t => t.ReceivingAccountId == receivingAccountId);

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            query = query.Where(t => t.Status == status.ToUpper());

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(t => t.IncomeDate)
            .ThenByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new
            {
                t.Id,
                t.VoucherNumber,
                t.IncomeDate,
                t.CategoryId,
                t.CategoryName,
                t.CategoryType,
                t.IncomeAccountId,
                t.IncomeAccountCode,
                t.IncomeAccountName,
                t.Description,
                t.Amount,
                t.ReceivedThrough,
                t.ReceivingAccountId,
                t.ReceivingAccountCode,
                t.ReceivingAccountName,
                t.ReferenceNumber,
                t.PayerName,
                t.AttachmentUrl,
                t.Notes,
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
                t.CreatedAt
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
        var item = await _db.IncomeTransactions
            .FirstOrDefaultAsync(t => t.Id == id);

        if (item == null)
            return NotFound(ApiResponse.Fail("Income transaction record not found"));

        return Ok(ApiResponse.Ok(item));
    }

    #endregion

    #region 3. Create, Update, Delete (Draft Management)

    public class CreateIncomeDto
    {
        public DateTime IncomeDate { get; set; }
        public string CategoryId { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public double Amount { get; set; }
        public string ReceivedThrough { get; set; } = "CASH"; // CASH, BANK, WALLET, CHEQUE, OTHER
        public string ReceivingAccountId { get; set; } = string.Empty;
        public string? ReferenceNumber { get; set; }
        public string? PayerName { get; set; }
        public string? AttachmentUrl { get; set; }
        public string? Notes { get; set; }
        public string? BranchOrOutlet { get; set; }
        public bool AutoPost { get; set; } = false;
        public string? CreatedBy { get; set; }
    }

    [HttpPost("transactions")]
    public async Task<IActionResult> CreateTransaction([FromBody] CreateIncomeDto dto)
    {
        if (dto.Amount <= 0)
            return BadRequest(ApiResponse.Fail("Income amount must be greater than zero."));

        if (string.IsNullOrWhiteSpace(dto.Description))
            return BadRequest(ApiResponse.Fail("Income description is mandatory."));

        var hotelId = await GetCurrentHotelIdAsync();
        await EnsureStandardAccountsAndCategoriesAsync(hotelId);

        // Validate Category
        var category = await _db.IncomeCategories.FirstOrDefaultAsync(c => c.Id == dto.CategoryId);
        if (category == null)
            return BadRequest(ApiResponse.Fail("Invalid income category selected."));

        // Validate Receiving Account (Asset: Cash drawer or Bank account or Digital Wallet)
        var receivingAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == dto.ReceivingAccountId && a.AccountType == "ASSET" && !a.IsGroup);
        if (receivingAcc == null)
            return BadRequest(ApiResponse.Fail("Invalid receiving account. Must be an active Cash, Bank, or Digital Wallet account."));

        var today = DateTime.UtcNow;
        var seq = await _db.IncomeTransactions.CountAsync() + 1;
        var voucherNumber = $"INC-{today.Year}-{seq:D4}";

        var transaction = new IncomeTransaction
        {
            HotelId = hotelId,
            VoucherNumber = voucherNumber,
            IncomeDate = dto.IncomeDate != default ? dto.IncomeDate : today,
            CategoryId = category.Id,
            CategoryName = category.CategoryName,
            CategoryType = category.CategoryType,
            IncomeAccountId = category.AccountId,
            IncomeAccountCode = category.AccountCode,
            IncomeAccountName = category.AccountName,
            Description = dto.Description.Trim(),
            Amount = Math.Round(dto.Amount, 2),
            ReceivedThrough = string.IsNullOrWhiteSpace(dto.ReceivedThrough) ? "CASH" : dto.ReceivedThrough.ToUpper(),
            ReceivingAccountId = receivingAcc.Id,
            ReceivingAccountCode = receivingAcc.AccountCode,
            ReceivingAccountName = receivingAcc.AccountName,
            ReferenceNumber = dto.ReferenceNumber?.Trim(),
            PayerName = dto.PayerName?.Trim(),
            AttachmentUrl = dto.AttachmentUrl?.Trim(),
            Notes = dto.Notes?.Trim(),
            BranchOrOutlet = string.IsNullOrWhiteSpace(dto.BranchOrOutlet) ? receivingAcc.BranchOrOutlet ?? "Main Restaurant" : dto.BranchOrOutlet.Trim(),
            Status = dto.AutoPost ? "POSTED" : "DRAFT",
            CreatedBy = string.IsNullOrWhiteSpace(dto.CreatedBy) ? "Staff" : dto.CreatedBy.Trim(),
            PostedBy = dto.AutoPost ? (dto.CreatedBy ?? "Staff") : null,
            PostedAt = dto.AutoPost ? today : null
        };

        // If AutoPost is requested, create balanced double-entry JournalEntry immediately
        if (dto.AutoPost)
        {
            var jvSeq = await _db.JournalEntries.CountAsync() + 1;
            var jvNumber = $"JV-INC-{today.Year}-{jvSeq:D4}";

            var narration = $"[Income Voucher {voucherNumber}] {category.CategoryName}: {transaction.Description}";
            var journalEntry = new JournalEntry
            {
                HotelId = hotelId,
                EntryNumber = jvNumber,
                EntryDate = transaction.IncomeDate,
                EntryType = "GENERAL",
                SourceModule = "INCOME",
                SourceTransactionId = transaction.Id,
                Reference = transaction.ReferenceNumber ?? voucherNumber,
                Description = narration,
                Status = "POSTED",
                CreatedBy = transaction.CreatedBy,
                PostedBy = transaction.PostedBy,
                PostedAt = today,
                TotalDebit = transaction.Amount,
                TotalCredit = transaction.Amount
            };

            // Debit: Receiving Account (Asset Increases)
            journalEntry.Lines.Add(new JournalEntryLine
            {
                JournalEntryId = journalEntry.Id,
                AccountId = receivingAcc.Id,
                AccountCode = receivingAcc.AccountCode,
                AccountName = receivingAcc.AccountName,
                Debit = transaction.Amount,
                Credit = 0,
                LineDescription = $"{transaction.ReceivedThrough} Receipt: {transaction.Description}"
            });

            // Credit: Income Account (Revenue Increases)
            journalEntry.Lines.Add(new JournalEntryLine
            {
                JournalEntryId = journalEntry.Id,
                AccountId = category.AccountId,
                AccountCode = category.AccountCode,
                AccountName = category.AccountName,
                Debit = 0,
                Credit = transaction.Amount,
                LineDescription = $"{category.CategoryName} earned ({transaction.VoucherNumber})"
            });

            _db.JournalEntries.Add(journalEntry);

            // Update receiving account current balance
            receivingAcc.CurrentBalance += transaction.Amount;

            transaction.JournalEntryId = journalEntry.Id;
            transaction.JournalEntryNumber = journalEntry.EntryNumber;
        }

        _db.IncomeTransactions.Add(transaction);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(transaction, dto.AutoPost ? $"Income voucher {voucherNumber} posted to General Ledger." : $"Income voucher {voucherNumber} saved as Draft."));
    }

    [HttpPut("transactions/{id}")]
    public async Task<IActionResult> UpdateTransaction(string id, [FromBody] CreateIncomeDto dto)
    {
        var transaction = await _db.IncomeTransactions.FirstOrDefaultAsync(t => t.Id == id);
        if (transaction == null)
            return NotFound(ApiResponse.Fail("Income transaction not found."));

        if (transaction.Status != "DRAFT")
            return BadRequest(ApiResponse.Fail("Posted or reversed income transactions cannot be edited. Please reverse and create a new record if adjustments are needed."));

        if (dto.Amount <= 0)
            return BadRequest(ApiResponse.Fail("Income amount must be greater than zero."));

        var category = await _db.IncomeCategories.FirstOrDefaultAsync(c => c.Id == dto.CategoryId);
        if (category == null)
            return BadRequest(ApiResponse.Fail("Invalid income category selected."));

        var receivingAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == dto.ReceivingAccountId && a.AccountType == "ASSET" && !a.IsGroup);
        if (receivingAcc == null)
            return BadRequest(ApiResponse.Fail("Invalid receiving account."));

        transaction.IncomeDate = dto.IncomeDate != default ? dto.IncomeDate : transaction.IncomeDate;
        transaction.CategoryId = category.Id;
        transaction.CategoryName = category.CategoryName;
        transaction.CategoryType = category.CategoryType;
        transaction.IncomeAccountId = category.AccountId;
        transaction.IncomeAccountCode = category.AccountCode;
        transaction.IncomeAccountName = category.AccountName;
        transaction.Description = dto.Description.Trim();
        transaction.Amount = Math.Round(dto.Amount, 2);
        transaction.ReceivedThrough = string.IsNullOrWhiteSpace(dto.ReceivedThrough) ? transaction.ReceivedThrough : dto.ReceivedThrough.ToUpper();
        transaction.ReceivingAccountId = receivingAcc.Id;
        transaction.ReceivingAccountCode = receivingAcc.AccountCode;
        transaction.ReceivingAccountName = receivingAcc.AccountName;
        transaction.ReferenceNumber = dto.ReferenceNumber?.Trim();
        transaction.PayerName = dto.PayerName?.Trim();
        transaction.AttachmentUrl = dto.AttachmentUrl?.Trim();
        transaction.Notes = dto.Notes?.Trim();
        transaction.BranchOrOutlet = string.IsNullOrWhiteSpace(dto.BranchOrOutlet) ? transaction.BranchOrOutlet : dto.BranchOrOutlet.Trim();
        transaction.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(transaction, $"Income voucher {transaction.VoucherNumber} updated successfully."));
    }

    [HttpDelete("transactions/{id}")]
    public async Task<IActionResult> DeleteTransaction(string id)
    {
        var transaction = await _db.IncomeTransactions.FirstOrDefaultAsync(t => t.Id == id);
        if (transaction == null)
            return NotFound(ApiResponse.Fail("Income transaction not found."));

        if (transaction.Status != "DRAFT")
            return BadRequest(ApiResponse.Fail("Only Draft income records can be deleted. Posted income must be reversed."));

        _db.IncomeTransactions.Remove(transaction);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok("Draft income voucher deleted successfully."));
    }

    #endregion

    #region 4. Posting & Reversal Workflow

    public class PostActionDto
    {
        public string? PostedBy { get; set; }
    }

    [HttpPost("transactions/{id}/post")]
    public async Task<IActionResult> PostTransaction(string id, [FromBody] PostActionDto dto)
    {
        var transaction = await _db.IncomeTransactions.FirstOrDefaultAsync(t => t.Id == id);
        if (transaction == null)
            return NotFound(ApiResponse.Fail("Income transaction not found."));

        if (transaction.Status == "POSTED")
            return BadRequest(ApiResponse.Fail("This income voucher is already posted."));

        if (transaction.Status == "REVERSED")
            return BadRequest(ApiResponse.Fail("Reversed income vouchers cannot be re-posted."));

        var receivingAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == transaction.ReceivingAccountId);
        if (receivingAcc == null)
            return BadRequest(ApiResponse.Fail("Receiving account not found in Chart of Accounts."));

        var incomeAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == transaction.IncomeAccountId);
        if (incomeAcc == null)
            return BadRequest(ApiResponse.Fail("Income account not found in Chart of Accounts."));

        var hotelId = await GetCurrentHotelIdAsync();
        var today = DateTime.UtcNow;
        var jvSeq = await _db.JournalEntries.CountAsync() + 1;
        var jvNumber = $"JV-INC-{today.Year}-{jvSeq:D4}";

        var narration = $"[Income Voucher {transaction.VoucherNumber}] {transaction.CategoryName}: {transaction.Description}";
        var journalEntry = new JournalEntry
        {
            HotelId = hotelId,
            EntryNumber = jvNumber,
            EntryDate = transaction.IncomeDate,
            EntryType = "GENERAL",
            SourceModule = "INCOME",
            SourceTransactionId = transaction.Id,
            Reference = transaction.ReferenceNumber ?? transaction.VoucherNumber,
            Description = narration,
            Status = "POSTED",
            CreatedBy = transaction.CreatedBy,
            PostedBy = string.IsNullOrWhiteSpace(dto.PostedBy) ? "Accountant" : dto.PostedBy.Trim(),
            PostedAt = today,
            TotalDebit = transaction.Amount,
            TotalCredit = transaction.Amount
        };

        // Debit: Receiving Account (Asset Increases)
        journalEntry.Lines.Add(new JournalEntryLine
        {
            JournalEntryId = journalEntry.Id,
            AccountId = receivingAcc.Id,
            AccountCode = receivingAcc.AccountCode,
            AccountName = receivingAcc.AccountName,
            Debit = transaction.Amount,
            Credit = 0,
            LineDescription = $"{transaction.ReceivedThrough} Receipt: {transaction.Description}"
        });

        // Credit: Income Account (Revenue Increases)
        journalEntry.Lines.Add(new JournalEntryLine
        {
            JournalEntryId = journalEntry.Id,
            AccountId = incomeAcc.Id,
            AccountCode = incomeAcc.AccountCode,
            AccountName = incomeAcc.AccountName,
            Debit = 0,
            Credit = transaction.Amount,
            LineDescription = $"{transaction.CategoryName} earned ({transaction.VoucherNumber})"
        });

        _db.JournalEntries.Add(journalEntry);

        // Update receiving account balance
        receivingAcc.CurrentBalance += transaction.Amount;

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
            transaction.Amount,
            ReceivingAccountNewBalance = receivingAcc.CurrentBalance
        }, $"Income voucher {transaction.VoucherNumber} posted successfully. Journal voucher {journalEntry.EntryNumber} created."));
    }

    public class ReverseActionDto
    {
        public string Reason { get; set; } = string.Empty;
        public string? ReversedBy { get; set; }
    }

    [HttpPost("transactions/{id}/reverse")]
    public async Task<IActionResult> ReverseTransaction(string id, [FromBody] ReverseActionDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Reason))
            return BadRequest(ApiResponse.Fail("Reversal reason is mandatory."));

        var transaction = await _db.IncomeTransactions.FirstOrDefaultAsync(t => t.Id == id);
        if (transaction == null)
            return NotFound(ApiResponse.Fail("Income transaction not found."));

        if (transaction.Status != "POSTED")
            return BadRequest(ApiResponse.Fail("Only Posted income transactions can be reversed."));

        var receivingAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == transaction.ReceivingAccountId);
        if (receivingAcc == null)
            return BadRequest(ApiResponse.Fail("Receiving account not found."));

        var incomeAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == transaction.IncomeAccountId);
        if (incomeAcc == null)
            return BadRequest(ApiResponse.Fail("Income account not found."));

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
            SourceModule = "INCOME",
            SourceTransactionId = transaction.Id,
            Reference = $"REV-{transaction.VoucherNumber}",
            Description = narration,
            Status = "POSTED",
            CreatedBy = string.IsNullOrWhiteSpace(dto.ReversedBy) ? "Accountant" : dto.ReversedBy.Trim(),
            PostedBy = string.IsNullOrWhiteSpace(dto.ReversedBy) ? "Accountant" : dto.ReversedBy.Trim(),
            PostedAt = today,
            TotalDebit = transaction.Amount,
            TotalCredit = transaction.Amount
        };

        // Reversal Double-Entry:
        // Debit: Income Account (Decreases Revenue)
        reversalEntry.Lines.Add(new JournalEntryLine
        {
            JournalEntryId = reversalEntry.Id,
            AccountId = incomeAcc.Id,
            AccountCode = incomeAcc.AccountCode,
            AccountName = incomeAcc.AccountName,
            Debit = transaction.Amount,
            Credit = 0,
            LineDescription = $"Reversal of Income {transaction.VoucherNumber}: {dto.Reason.Trim()}"
        });

        // Credit: Receiving Account (Decreases Cash/Bank/Wallet)
        reversalEntry.Lines.Add(new JournalEntryLine
        {
            JournalEntryId = reversalEntry.Id,
            AccountId = receivingAcc.Id,
            AccountCode = receivingAcc.AccountCode,
            AccountName = receivingAcc.AccountName,
            Debit = 0,
            Credit = transaction.Amount,
            LineDescription = $"Reversal adjustment for {transaction.VoucherNumber}"
        });

        _db.JournalEntries.Add(reversalEntry);

        // Deduct from receiving account balance
        receivingAcc.CurrentBalance -= transaction.Amount;

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
            ReceivingAccountNewBalance = receivingAcc.CurrentBalance
        }, $"Income voucher {transaction.VoucherNumber} reversed successfully. Reversal voucher {reversalEntry.EntryNumber} posted."));
    }

    #endregion

    #region 5. Configurable Categories & Receiving Accounts

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var hotelId = await GetCurrentHotelIdAsync();
        await EnsureStandardAccountsAndCategoriesAsync(hotelId);

        var categories = await _db.IncomeCategories
            .OrderBy(c => c.CategoryType)
            .ThenBy(c => c.DisplayOrder)
            .ThenBy(c => c.CategoryName)
            .ToListAsync();

        return Ok(ApiResponse.Ok(categories));
    }

    public class CreateCategoryDto
    {
        public string CategoryName { get; set; } = string.Empty;
        public string CategoryType { get; set; } = "OPERATING"; // OPERATING or NON_OPERATING
        public string AccountId { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int DisplayOrder { get; set; } = 0;
    }

    [HttpPost("categories")]
    public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.CategoryName))
            return BadRequest(ApiResponse.Fail("Category name is required."));

        var hotelId = await GetCurrentHotelIdAsync();

        var account = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == dto.AccountId);
        if (account == null)
            return BadRequest(ApiResponse.Fail("Invalid Chart of Accounts link."));

        var category = new IncomeCategory
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

        _db.IncomeCategories.Add(category);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(category, "Income category created successfully."));
    }

    [HttpPut("categories/{id}")]
    public async Task<IActionResult> UpdateCategory(string id, [FromBody] CreateCategoryDto dto)
    {
        var category = await _db.IncomeCategories.FirstOrDefaultAsync(c => c.Id == id);
        if (category == null)
            return NotFound(ApiResponse.Fail("Income category not found."));

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

        return Ok(ApiResponse.Ok(category, "Income category updated successfully."));
    }

    [HttpDelete("categories/{id}")]
    public async Task<IActionResult> DeleteCategory(string id)
    {
        var category = await _db.IncomeCategories.FirstOrDefaultAsync(c => c.Id == id);
        if (category == null)
            return NotFound(ApiResponse.Fail("Income category not found."));

        if (category.IsSystem)
            return BadRequest(ApiResponse.Fail("System default categories cannot be deleted. You may deactivate them instead."));

        var hasTransactions = await _db.IncomeTransactions.AnyAsync(t => t.CategoryId == id);
        if (hasTransactions)
            return BadRequest(ApiResponse.Fail("Cannot delete this category because transactions are attached to it. Please deactivate it instead."));

        _db.IncomeCategories.Remove(category);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok("Category deleted successfully."));
    }

    [HttpGet("receiving-accounts")]
    public async Task<IActionResult> GetReceivingAccounts()
    {
        var hotelId = await GetCurrentHotelIdAsync();
        await EnsureStandardAccountsAndCategoriesAsync(hotelId);

        // Load all active cash registers/drawers, bank accounts, and digital wallets
        var accounts = await _db.Accounts
            .Where(a => a.AccountType == "ASSET" && !a.IsGroup && a.IsActive &&
                (a.SubCategory == "Cash & Cash Equivalents" ||
                 a.SubCategory == "Bank Accounts" ||
                 a.SubCategory == "Digital Wallets" ||
                 a.AccountCode.StartsWith("101") ||
                 a.AccountCode.StartsWith("102") ||
                 a.AccountCode.StartsWith("103") ||
                 a.AccountCode.StartsWith("104") ||
                 a.AccountCode.StartsWith("105") ||
                 a.AccountCode.StartsWith("107")))
            .OrderBy(a => a.AccountCode)
            .Select(a => new
            {
                a.Id,
                a.AccountCode,
                a.AccountName,
                AccountType = a.SubCategory == "Digital Wallets" || a.WalletProvider != null ? "WALLET" : (a.SubCategory == "Bank Accounts" || a.BankName != null ? "BANK" : "CASH"),
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


using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/fixed-assets")]
public class FixedAssetsController : ControllerBase
{
    private readonly HospitalityDbContext _db;
    private readonly ILogger<FixedAssetsController> _logger;

    public FixedAssetsController(HospitalityDbContext db, ILogger<FixedAssetsController> logger)
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

    public static List<AssetCategory> GetStandardAssetCategories(string hotelId, List<Account> accounts)
    {
        var categories = new List<AssetCategory>();

        void AddCat(string name, string prefix, string costCode, string accumCode, string expCode, int lifeYears, string desc, int order)
        {
            var costAcc = accounts.FirstOrDefault(a => a.AccountCode == costCode);
            var accumAcc = accounts.FirstOrDefault(a => a.AccountCode == accumCode);
            var expAcc = accounts.FirstOrDefault(a => a.AccountCode == expCode);

            if (costAcc != null && accumAcc != null && expAcc != null)
            {
                categories.Add(new AssetCategory
                {
                    HotelId = hotelId,
                    CategoryName = name,
                    CodePrefix = prefix,
                    AssetAccountId = costAcc.Id,
                    AssetAccountCode = costAcc.AccountCode,
                    AssetAccountName = costAcc.AccountName,
                    AccumulatedDepreciationAccountId = accumAcc.Id,
                    AccumulatedDepreciationAccountCode = accumAcc.AccountCode,
                    AccumulatedDepreciationAccountName = accumAcc.AccountName,
                    DepreciationExpenseAccountId = expAcc.Id,
                    DepreciationExpenseAccountCode = expAcc.AccountCode,
                    DepreciationExpenseAccountName = expAcc.AccountName,
                    DefaultUsefulLifeYears = lifeYears,
                    DefaultDepreciationMethod = "STRAIGHT_LINE",
                    DefaultResidualValuePercentage = 0,
                    Description = desc,
                    IsSystem = true,
                    IsActive = true,
                    DisplayOrder = order
                });
            }
        }

        AddCat("Kitchen Equipment", "KIT", "1510", "1610", "5800", 5, "Commercial ranges, ovens, fryers, food processors and dishwashers", 1);
        AddCat("Refrigerators & Freezers", "REF", "1520", "1620", "5800", 5, "Commercial double-door chillers, walk-in coolers and deep freezers", 2);
        AddCat("Furniture & Fixtures", "FUR", "1500", "1600", "5810", 7, "Dining tables, dining chairs, bar stools, reception counter and sofas", 3);
        AddCat("Computers & IT Equipment", "IT", "1530", "1630", "5820", 3, "Touchscreen POS terminals, thermal printers, router and servers", 4);
        AddCat("Air Conditioning & HVAC", "AC", "1540", "1640", "5830", 5, "Dining hall split and cassette ACs and kitchen exhaust blowers", 5);
        AddCat("Vehicles & Delivery Vans", "VEH", "1550", "1650", "5840", 5, "Delivery motorbikes, scooters and food delivery vans", 6);
        AddCat("Building Improvements", "BLD", "1560", "1660", "5850", 10, "Interior decor modifications, false ceilings and flooring works", 7);
        AddCat("Electrical & Generator Equipment", "ELE", "1570", "1670", "5800", 7, "Diesel backup generator, electrical panels and UPS systems", 8);
        AddCat("Other Fixed Assets", "OFA", "1590", "1690", "5890", 5, "Miscellaneous restaurant capital tools and hospitality assets", 9);

        return categories;
    }

    private async Task EnsureStandardAccountsAndCategoriesAsync(string hotelId)
    {
        // 1. Ensure Standard Accounts exist
        var accountsCount = await _db.Accounts.CountAsync();
        if (accountsCount == 0)
        {
            var seedAccounts = AccountsController.GetStandardHospitalityAccounts(hotelId);
            _db.Accounts.AddRange(seedAccounts);
            await _db.SaveChangesAsync();
        }

        // 2. Ensure Standard Asset Categories exist
        var categoriesCount = await _db.AssetCategories.CountAsync();
        if (categoriesCount == 0)
        {
            var allAccounts = await _db.Accounts.ToListAsync();
            var seedCategories = GetStandardAssetCategories(hotelId, allAccounts);
            _db.AssetCategories.AddRange(seedCategories);
            await _db.SaveChangesAsync();
        }
    }

    #endregion

    #region 1. Summary & Reports Endpoints

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var hotelId = await GetCurrentHotelIdAsync();
        await EnsureStandardAccountsAndCategoriesAsync(hotelId);

        var assets = await _db.FixedAssets.ToListAsync();

        var activeAssets = assets.Where(a => a.Status == "ACTIVE").ToList();
        var fullyDepreciated = assets.Where(a => a.Status == "FULLY_DEPRECIATED").ToList();
        var disposed = assets.Where(a => a.Status == "DISPOSED").ToList();
        var drafts = assets.Where(a => a.Status == "DRAFT").ToList();

        var totalAssetCost = activeAssets.Sum(a => a.TotalCapitalizedCost) + fullyDepreciated.Sum(a => a.TotalCapitalizedCost);
        var totalAccumulatedDepreciation = activeAssets.Sum(a => a.AccumulatedDepreciation) + fullyDepreciated.Sum(a => a.AccumulatedDepreciation);
        var currentBookValue = activeAssets.Sum(a => a.CurrentBookValue) + fullyDepreciated.Sum(a => a.CurrentBookValue);

        return Ok(ApiResponse.Ok(new
        {
            TotalAssetCost = totalAssetCost,
            AccumulatedDepreciation = totalAccumulatedDepreciation,
            CurrentBookValue = currentBookValue,
            TotalActiveAssets = activeAssets.Count,
            FullyDepreciatedCount = fullyDepreciated.Count,
            DisposedCount = disposed.Count,
            DraftCount = drafts.Count,
            TotalAssetsCount = assets.Count
        }));
    }

    [HttpGet("reports")]
    public async Task<IActionResult> GetReports()
    {
        var assets = await _db.FixedAssets
            .Include(a => a.DepreciationEntries)
            .OrderBy(a => a.AssetCode)
            .ToListAsync();

        var activeAndDepr = assets.Where(a => a.Status == "ACTIVE" || a.Status == "FULLY_DEPRECIATED").ToList();
        var totalCost = activeAndDepr.Sum(a => a.TotalCapitalizedCost);
        var totalAccum = activeAndDepr.Sum(a => a.AccumulatedDepreciation);
        var totalBookValue = activeAndDepr.Sum(a => a.CurrentBookValue);

        // Group by Category
        var byCategory = activeAndDepr
            .GroupBy(a => new { a.CategoryId, a.CategoryName })
            .Select(g => new
            {
                g.Key.CategoryId,
                g.Key.CategoryName,
                Count = g.Count(),
                TotalCost = g.Sum(x => x.TotalCapitalizedCost),
                AccumulatedDepreciation = g.Sum(x => x.AccumulatedDepreciation),
                CurrentBookValue = g.Sum(x => x.CurrentBookValue),
                CostPercentage = totalCost > 0 ? Math.Round((g.Sum(x => x.TotalCapitalizedCost) / totalCost) * 100, 2) : 0
            })
            .OrderByDescending(x => x.TotalCost)
            .ToList();

        // Disposed Assets Summary
        var disposedAssets = assets.Where(a => a.Status == "DISPOSED").Select(a => new
        {
            a.Id,
            a.AssetCode,
            a.AssetName,
            a.CategoryName,
            a.PurchaseDate,
            a.TotalCapitalizedCost,
            a.DisposalDate,
            a.DisposalType,
            a.DisposalAmount,
            a.NetBookValueAtDisposal,
            a.GainOrLossAmount,
            a.IsGain,
            a.DisposalReason
        }).ToList();

        return Ok(ApiResponse.Ok(new
        {
            TotalCost = totalCost,
            TotalAccumulatedDepreciation = totalAccum,
            TotalBookValue = totalBookValue,
            ByCategory = byCategory,
            DisposedAssets = disposedAssets
        }));
    }

    #endregion

    #region 2. Asset Register Listing & Detail

    [HttpGet("assets")]
    public async Task<IActionResult> GetAssets(
        [FromQuery] string? search,
        [FromQuery] string? categoryId,
        [FromQuery] string? status,
        [FromQuery] string? location,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        var hotelId = await GetCurrentHotelIdAsync();
        await EnsureStandardAccountsAndCategoriesAsync(hotelId);

        var query = _db.FixedAssets.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower();
            query = query.Where(a =>
                a.AssetCode.ToLower().Contains(q) ||
                a.AssetName.ToLower().Contains(q) ||
                (a.SerialNumber != null && a.SerialNumber.ToLower().Contains(q)) ||
                (a.SupplierName != null && a.SupplierName.ToLower().Contains(q)) ||
                a.Location.ToLower().Contains(q) ||
                a.CategoryName.ToLower().Contains(q));
        }

        if (!string.IsNullOrWhiteSpace(categoryId) && !categoryId.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            query = query.Where(a => a.CategoryId == categoryId);

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            query = query.Where(a => a.Status == status.ToUpper());

        if (!string.IsNullOrWhiteSpace(location) && !location.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            query = query.Where(a => a.Location == location);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(a => a.AssetCode)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new
            {
                a.Id,
                a.AssetCode,
                a.AssetName,
                a.CategoryId,
                a.CategoryName,
                a.Location,
                a.Department,
                a.AssignedTo,
                a.SerialNumber,
                a.PurchaseDate,
                a.PurchaseCost,
                a.AdditionalCapitalizedCosts,
                a.TotalCapitalizedCost,
                a.UsefulLifeYears,
                a.ResidualValue,
                a.DepreciationMethod,
                a.AnnualDepreciation,
                a.MonthlyDepreciation,
                a.AccumulatedDepreciation,
                a.CurrentBookValue,
                a.Status,
                a.LastDepreciationDate,
                a.DepreciationPeriodsPostedCount,
                a.CreatedAt
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

    [HttpGet("assets/{id}")]
    public async Task<IActionResult> GetAssetById(string id)
    {
        var asset = await _db.FixedAssets
            .Include(a => a.DepreciationEntries.OrderBy(e => e.PeriodNumber))
            .Include(a => a.Movements.OrderByDescending(m => m.TransferDate))
            .FirstOrDefaultAsync(a => a.Id == id);

        if (asset == null)
            return NotFound(ApiResponse.Fail("Fixed asset record not found."));

        return Ok(ApiResponse.Ok(asset));
    }

    #endregion

    #region 3. Create, Update, Delete Asset

    public class CreateFixedAssetDto
    {
        // Basic Info
        public string AssetName { get; set; } = string.Empty;
        public string CategoryId { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Location { get; set; } = "Main Kitchen";
        public string Department { get; set; } = "Kitchen";
        public string? AssignedTo { get; set; }
        public string? SerialNumber { get; set; }
        public string? Barcode { get; set; }
        public string? BranchOrOutlet { get; set; }

        // Purchase Info
        public DateTime PurchaseDate { get; set; }
        public string? SupplierName { get; set; }
        public string? SupplierInvoiceNumber { get; set; }
        public double PurchaseCost { get; set; }
        public double AdditionalCapitalizedCosts { get; set; } = 0;
        public string AcquisitionPaymentMode { get; set; } = "BANK"; // BANK, CASH, CREDIT, OPENING_BALANCE
        public string? PaymentAccountId { get; set; }
        public string? PaymentReference { get; set; }
        public string? AttachmentUrl { get; set; }
        public string? Notes { get; set; }

        // Depreciation Info
        public string DepreciationMethod { get; set; } = "STRAIGHT_LINE";
        public int UsefulLifeYears { get; set; } = 5;
        public double ResidualValue { get; set; } = 0;
        public DateTime DepreciationStartDate { get; set; }
        public string DepreciationFrequency { get; set; } = "MONTHLY";

        public bool AutoCapitalize { get; set; } = true;
        public string? CreatedBy { get; set; }
    }

    [HttpPost("assets")]
    public async Task<IActionResult> CreateAsset([FromBody] CreateFixedAssetDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.AssetName))
            return BadRequest(ApiResponse.Fail("Asset name is mandatory."));

        if (dto.PurchaseCost <= 0)
            return BadRequest(ApiResponse.Fail("Asset purchase cost must be greater than zero."));

        if (dto.UsefulLifeYears <= 0)
            return BadRequest(ApiResponse.Fail("Useful life must be at least 1 year."));

        var hotelId = await GetCurrentHotelIdAsync();
        await EnsureStandardAccountsAndCategoriesAsync(hotelId);

        var category = await _db.AssetCategories.FirstOrDefaultAsync(c => c.Id == dto.CategoryId);
        if (category == null)
            return BadRequest(ApiResponse.Fail("Invalid asset category selected."));

        var today = DateTime.UtcNow;
        var purchaseDate = dto.PurchaseDate != default ? dto.PurchaseDate : today;
        var deprStartDate = dto.DepreciationStartDate != default ? dto.DepreciationStartDate : purchaseDate;

        var totalCost = Math.Round(dto.PurchaseCost + dto.AdditionalCapitalizedCosts, 2);
        var residualVal = Math.Round(dto.ResidualValue, 2);
        var depreciableAmt = Math.Max(0, totalCost - residualVal);

        var annualDepr = Math.Round(depreciableAmt / dto.UsefulLifeYears, 2);
        var monthlyDepr = Math.Round(annualDepr / 12, 2);
        var usefulLifeMonths = dto.UsefulLifeYears * 12;

        // Auto-generate Asset Code (e.g. FA-KIT-0001)
        var countInCat = await _db.FixedAssets.CountAsync(a => a.CategoryId == category.Id) + 1;
        var prefix = string.IsNullOrWhiteSpace(category.CodePrefix) ? "AST" : category.CodePrefix.ToUpper();
        var assetCode = $"FA-{prefix}-{countInCat:D4}";

        // Ensure uniqueness
        while (await _db.FixedAssets.AnyAsync(a => a.AssetCode == assetCode))
        {
            countInCat++;
            assetCode = $"FA-{prefix}-{countInCat:D4}";
        }

        Account? paymentAcc = null;
        if (dto.AcquisitionPaymentMode == "BANK" || dto.AcquisitionPaymentMode == "CASH")
        {
            if (!string.IsNullOrWhiteSpace(dto.PaymentAccountId))
                paymentAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == dto.PaymentAccountId && a.AccountType == "ASSET");
            if (paymentAcc == null)
                paymentAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountType == "ASSET" && (a.AccountCode == "1050" || a.AccountCode == "1010"));
        }
        else if (dto.AcquisitionPaymentMode == "CREDIT")
        {
            paymentAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "2010" && a.AccountType == "LIABILITY");
        }

        var asset = new FixedAsset
        {
            HotelId = hotelId,
            AssetCode = assetCode,
            AssetName = dto.AssetName.Trim(),
            CategoryId = category.Id,
            CategoryName = category.CategoryName,
            Description = dto.Description?.Trim(),
            Location = string.IsNullOrWhiteSpace(dto.Location) ? "Main Kitchen" : dto.Location.Trim(),
            Department = string.IsNullOrWhiteSpace(dto.Department) ? "Kitchen" : dto.Department.Trim(),
            AssignedTo = dto.AssignedTo?.Trim(),
            SerialNumber = dto.SerialNumber?.Trim(),
            Barcode = dto.Barcode?.Trim(),
            BranchOrOutlet = string.IsNullOrWhiteSpace(dto.BranchOrOutlet) ? "Main Restaurant" : dto.BranchOrOutlet.Trim(),

            PurchaseDate = purchaseDate,
            SupplierName = dto.SupplierName?.Trim(),
            SupplierInvoiceNumber = dto.SupplierInvoiceNumber?.Trim(),
            PurchaseCost = Math.Round(dto.PurchaseCost, 2),
            AdditionalCapitalizedCosts = Math.Round(dto.AdditionalCapitalizedCosts, 2),
            TotalCapitalizedCost = totalCost,

            AcquisitionPaymentMode = dto.AcquisitionPaymentMode.ToUpper(),
            PaymentAccountId = paymentAcc?.Id,
            PaymentAccountCode = paymentAcc?.AccountCode,
            PaymentAccountName = paymentAcc?.AccountName,
            PaymentReference = dto.PaymentReference?.Trim(),
            AttachmentUrl = dto.AttachmentUrl?.Trim(),
            Notes = dto.Notes?.Trim(),

            DepreciationMethod = "STRAIGHT_LINE",
            UsefulLifeYears = dto.UsefulLifeYears,
            UsefulLifeMonths = usefulLifeMonths,
            ResidualValue = residualVal,
            DepreciableAmount = depreciableAmt,
            AnnualDepreciation = annualDepr,
            MonthlyDepreciation = monthlyDepr,
            DepreciationStartDate = deprStartDate,
            DepreciationFrequency = "MONTHLY",

            AccumulatedDepreciation = 0,
            CurrentBookValue = totalCost,

            AssetAccountId = category.AssetAccountId,
            AssetAccountCode = category.AssetAccountCode,
            AssetAccountName = category.AssetAccountName,

            AccumulatedDepreciationAccountId = category.AccumulatedDepreciationAccountId,
            AccumulatedDepreciationAccountCode = category.AccumulatedDepreciationAccountCode,
            AccumulatedDepreciationAccountName = category.AccumulatedDepreciationAccountName,

            DepreciationExpenseAccountId = category.DepreciationExpenseAccountId,
            DepreciationExpenseAccountCode = category.DepreciationExpenseAccountCode,
            DepreciationExpenseAccountName = category.DepreciationExpenseAccountName,

            Status = dto.AutoCapitalize ? "ACTIVE" : "DRAFT",
            CreatedBy = string.IsNullOrWhiteSpace(dto.CreatedBy) ? "Staff" : dto.CreatedBy.Trim(),
            CreatedAt = today,
            UpdatedAt = today
        };

        // Generate Straight-Line Depreciation Schedule
        var scheduleOpening = totalCost;
        var scheduleAccum = 0.0;
        for (int m = 1; m <= usefulLifeMonths; m++)
        {
            var pDate = deprStartDate.AddMonths(m - 1);
            var pKey = $"{pDate.Year}-{pDate.Month:D2}";

            // Last month adjustment to hit residual value exactly
            var deprAmt = (m == usefulLifeMonths)
                ? Math.Round(scheduleOpening - residualVal, 2)
                : Math.Min(monthlyDepr, Math.Round(scheduleOpening - residualVal, 2));

            if (deprAmt < 0) deprAmt = 0;

            var closeVal = Math.Round(scheduleOpening - deprAmt, 2);
            scheduleAccum = Math.Round(scheduleAccum + deprAmt, 2);

            asset.DepreciationEntries.Add(new AssetDepreciationEntry
            {
                FixedAssetId = asset.Id,
                PeriodKey = pKey,
                PeriodNumber = m,
                PeriodDate = pDate,
                OpeningBookValue = scheduleOpening,
                DepreciationAmount = deprAmt,
                AccumulatedDepreciation = scheduleAccum,
                ClosingBookValue = closeVal,
                Status = "PENDING"
            });

            scheduleOpening = closeVal;
        }

        // If AutoCapitalize is requested and not Opening Balance, generate balanced Capitalization JournalEntry
        if (dto.AutoCapitalize && dto.AcquisitionPaymentMode != "OPENING_BALANCE" && paymentAcc != null)
        {
            var jvSeq = await _db.JournalEntries.CountAsync() + 1;
            var jvNumber = $"JV-AST-{today.Year}-{jvSeq:D4}";

            var narration = $"[Capitalization of {asset.AssetCode}] {asset.AssetName} ({category.CategoryName})";
            var journalEntry = new JournalEntry
            {
                HotelId = hotelId,
                EntryNumber = jvNumber,
                EntryDate = purchaseDate,
                EntryType = "GENERAL",
                SourceModule = "FIXED_ASSETS",
                SourceTransactionId = asset.Id,
                Reference = asset.AssetCode,
                Description = narration,
                Status = "POSTED",
                CreatedBy = asset.CreatedBy,
                PostedBy = asset.CreatedBy,
                PostedAt = today,
                TotalDebit = asset.TotalCapitalizedCost,
                TotalCredit = asset.TotalCapitalizedCost
            };

            // Debit: Fixed Asset Cost Account (Increases Asset)
            journalEntry.Lines.Add(new JournalEntryLine
            {
                JournalEntryId = journalEntry.Id,
                AccountId = category.AssetAccountId,
                AccountCode = category.AssetAccountCode,
                AccountName = category.AssetAccountName,
                Debit = asset.TotalCapitalizedCost,
                Credit = 0,
                LineDescription = narration
            });

            // Credit: Cash/Bank Asset OR Accounts Payable Liability
            journalEntry.Lines.Add(new JournalEntryLine
            {
                JournalEntryId = journalEntry.Id,
                AccountId = paymentAcc.Id,
                AccountCode = paymentAcc.AccountCode,
                AccountName = paymentAcc.AccountName,
                Debit = 0,
                Credit = asset.TotalCapitalizedCost,
                LineDescription = dto.AcquisitionPaymentMode == "CREDIT"
                    ? $"Vendor payable for asset purchase {asset.AssetCode}"
                    : $"Disbursement via {paymentAcc.AccountName} for {asset.AssetCode}"
            });

            _db.JournalEntries.Add(journalEntry);

            // Update Account Balance
            if (dto.AcquisitionPaymentMode == "CREDIT")
                paymentAcc.CurrentBalance += asset.TotalCapitalizedCost; // Increases liability
            else
                paymentAcc.CurrentBalance -= asset.TotalCapitalizedCost; // Decreases bank/cash

            var assetAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == category.AssetAccountId);
            if (assetAcc != null) assetAcc.CurrentBalance += asset.TotalCapitalizedCost;

            asset.AcquisitionJournalEntryId = journalEntry.Id;
            asset.AcquisitionJournalEntryNumber = journalEntry.EntryNumber;
        }

        _db.FixedAssets.Add(asset);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(asset, $"Fixed asset {asset.AssetCode} ({asset.AssetName}) registered successfully."));
    }

    [HttpPut("assets/{id}")]
    public async Task<IActionResult> UpdateAsset(string id, [FromBody] CreateFixedAssetDto dto)
    {
        var asset = await _db.FixedAssets.FirstOrDefaultAsync(a => a.Id == id);
        if (asset == null)
            return NotFound(ApiResponse.Fail("Fixed asset not found."));

        if (asset.Status == "DISPOSED")
            return BadRequest(ApiResponse.Fail("Cannot modify a disposed asset."));

        if (!string.IsNullOrWhiteSpace(dto.AssetName))
            asset.AssetName = dto.AssetName.Trim();

        asset.Description = dto.Description?.Trim();
        asset.SerialNumber = dto.SerialNumber?.Trim();
        asset.Barcode = dto.Barcode?.Trim();
        asset.AssignedTo = dto.AssignedTo?.Trim();
        asset.Notes = dto.Notes?.Trim();
        asset.SupplierName = dto.SupplierName?.Trim();
        asset.SupplierInvoiceNumber = dto.SupplierInvoiceNumber?.Trim();
        asset.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(asset, "Asset metadata updated successfully."));
    }

    [HttpDelete("assets/{id}")]
    public async Task<IActionResult> DeleteAsset(string id)
    {
        var asset = await _db.FixedAssets
            .Include(a => a.DepreciationEntries)
            .Include(a => a.Movements)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (asset == null)
            return NotFound(ApiResponse.Fail("Fixed asset not found."));

        if (asset.Status != "DRAFT")
            return BadRequest(ApiResponse.Fail("Only Draft assets can be deleted. Active and capitalized assets must be retired using the Asset Disposal workflow."));

        _db.AssetDepreciationEntries.RemoveRange(asset.DepreciationEntries);
        _db.AssetMovements.RemoveRange(asset.Movements);
        _db.FixedAssets.Remove(asset);

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok("Draft fixed asset deleted."));
    }

    #endregion

    #region 4. Depreciation Posting (Single & Batch)

    [HttpPost("assets/{id}/depreciation/post")]
    public async Task<IActionResult> PostAssetDepreciation(string id, [FromQuery] int? periodNumber)
    {
        var asset = await _db.FixedAssets
            .Include(a => a.DepreciationEntries)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (asset == null)
            return NotFound(ApiResponse.Fail("Fixed asset not found."));

        if (asset.Status != "ACTIVE")
            return BadRequest(ApiResponse.Fail($"Cannot post depreciation for asset with status '{asset.Status}'."));

        // Find the target pending entry
        AssetDepreciationEntry? targetEntry = null;
        if (periodNumber.HasValue)
        {
            targetEntry = asset.DepreciationEntries.FirstOrDefault(e => e.PeriodNumber == periodNumber.Value && e.Status == "PENDING");
        }
        else
        {
            targetEntry = asset.DepreciationEntries.Where(e => e.Status == "PENDING").OrderBy(e => e.PeriodNumber).FirstOrDefault();
        }

        if (targetEntry == null)
            return BadRequest(ApiResponse.Fail("No pending depreciation period found for this asset. It may already be fully depreciated."));

        if (targetEntry.DepreciationAmount <= 0)
            return BadRequest(ApiResponse.Fail("Depreciation amount for this period is zero."));

        var hotelId = await GetCurrentHotelIdAsync();
        var today = DateTime.UtcNow;
        var jvSeq = await _db.JournalEntries.CountAsync() + 1;
        var jvNumber = $"JV-DEP-{today.Year}-{jvSeq:D4}";

        var narration = $"[Depreciation {targetEntry.PeriodKey}] {asset.AssetCode} - {asset.AssetName} (Period {targetEntry.PeriodNumber})";

        // Double-Entry:
        // Debit: Depreciation Expense Account
        // Credit: Accumulated Depreciation Contra-Asset
        var journalEntry = new JournalEntry
        {
            HotelId = hotelId,
            EntryNumber = jvNumber,
            EntryDate = targetEntry.PeriodDate,
            EntryType = "GENERAL",
            SourceModule = "FIXED_ASSETS",
            SourceTransactionId = asset.Id,
            Reference = $"{asset.AssetCode}-{targetEntry.PeriodKey}",
            Description = narration,
            Status = "POSTED",
            CreatedBy = "Accountant",
            PostedBy = "Accountant",
            PostedAt = today,
            TotalDebit = targetEntry.DepreciationAmount,
            TotalCredit = targetEntry.DepreciationAmount
        };

        // Debit: Depreciation Expense Account
        journalEntry.Lines.Add(new JournalEntryLine
        {
            JournalEntryId = journalEntry.Id,
            AccountId = asset.DepreciationExpenseAccountId,
            AccountCode = asset.DepreciationExpenseAccountCode,
            AccountName = asset.DepreciationExpenseAccountName,
            Debit = targetEntry.DepreciationAmount,
            Credit = 0,
            LineDescription = narration
        });

        // Credit: Accumulated Depreciation Account
        journalEntry.Lines.Add(new JournalEntryLine
        {
            JournalEntryId = journalEntry.Id,
            AccountId = asset.AccumulatedDepreciationAccountId,
            AccountCode = asset.AccumulatedDepreciationAccountCode,
            AccountName = asset.AccumulatedDepreciationAccountName,
            Debit = 0,
            Credit = targetEntry.DepreciationAmount,
            LineDescription = narration
        });

        _db.JournalEntries.Add(journalEntry);

        // Update GL Account Balances
        var expAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == asset.DepreciationExpenseAccountId);
        if (expAcc != null) expAcc.CurrentBalance += targetEntry.DepreciationAmount;

        var accumAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == asset.AccumulatedDepreciationAccountId);
        if (accumAcc != null) accumAcc.CurrentBalance += targetEntry.DepreciationAmount;

        // Update Entry
        targetEntry.Status = "POSTED";
        targetEntry.JournalEntryId = journalEntry.Id;
        targetEntry.JournalEntryNumber = journalEntry.EntryNumber;
        targetEntry.PostedAt = today;
        targetEntry.PostedBy = "Accountant";
        targetEntry.UpdatedAt = today;

        // Update Asset Metrics
        asset.AccumulatedDepreciation = Math.Round(asset.AccumulatedDepreciation + targetEntry.DepreciationAmount, 2);
        asset.CurrentBookValue = Math.Round(asset.CurrentBookValue - targetEntry.DepreciationAmount, 2);
        asset.LastDepreciationDate = targetEntry.PeriodDate;
        asset.DepreciationPeriodsPostedCount++;

        if (asset.CurrentBookValue <= asset.ResidualValue + 0.01)
        {
            asset.CurrentBookValue = asset.ResidualValue;
            asset.Status = "FULLY_DEPRECIATED";
        }

        asset.UpdatedAt = today;
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            asset.AssetCode,
            targetEntry.PeriodKey,
            targetEntry.PeriodNumber,
            DepreciationAmount = targetEntry.DepreciationAmount,
            JournalEntryNumber = jvNumber,
            NewCurrentBookValue = asset.CurrentBookValue,
            NewAccumulatedDepreciation = asset.AccumulatedDepreciation,
            AssetStatus = asset.Status
        }, $"Monthly depreciation of Rs. {targetEntry.DepreciationAmount} posted for {asset.AssetCode}."));
    }

    public class BatchDepreciationDto
    {
        public int Year { get; set; }
        public int Month { get; set; } // 1 - 12
    }

    [HttpPost("depreciation/batch-run")]
    public async Task<IActionResult> RunBatchDepreciation([FromBody] BatchDepreciationDto dto)
    {
        if (dto.Year < 2020 || dto.Month < 1 || dto.Month > 12)
            return BadRequest(ApiResponse.Fail("Invalid year or month specified."));

        var targetKey = $"{dto.Year}-{dto.Month:D2}";
        var hotelId = await GetCurrentHotelIdAsync();

        var activeAssets = await _db.FixedAssets
            .Include(a => a.DepreciationEntries)
            .Where(a => a.Status == "ACTIVE")
            .ToListAsync();

        int postedAssetsCount = 0;
        double totalDepreciationBatch = 0;
        var today = DateTime.UtcNow;

        foreach (var asset in activeAssets)
        {
            var entry = asset.DepreciationEntries
                .FirstOrDefault(e => e.PeriodKey == targetKey && e.Status == "PENDING");

            if (entry == null || entry.DepreciationAmount <= 0) continue;

            var jvSeq = await _db.JournalEntries.CountAsync() + 1;
            var jvNumber = $"JV-DEP-{today.Year}-{jvSeq:D4}";

            var narration = $"[Batch Depreciation {targetKey}] {asset.AssetCode}: {asset.AssetName}";
            var journalEntry = new JournalEntry
            {
                HotelId = hotelId,
                EntryNumber = jvNumber,
                EntryDate = new DateTime(dto.Year, dto.Month, 1, 0, 0, 0, DateTimeKind.Utc),
                EntryType = "GENERAL",
                SourceModule = "FIXED_ASSETS",
                SourceTransactionId = asset.Id,
                Reference = $"{asset.AssetCode}-{targetKey}",
                Description = narration,
                Status = "POSTED",
                CreatedBy = "Depreciation Engine",
                PostedBy = "Depreciation Engine",
                PostedAt = today,
                TotalDebit = entry.DepreciationAmount,
                TotalCredit = entry.DepreciationAmount
            };

            journalEntry.Lines.Add(new JournalEntryLine
            {
                JournalEntryId = journalEntry.Id,
                AccountId = asset.DepreciationExpenseAccountId,
                AccountCode = asset.DepreciationExpenseAccountCode,
                AccountName = asset.DepreciationExpenseAccountName,
                Debit = entry.DepreciationAmount,
                Credit = 0,
                LineDescription = narration
            });

            journalEntry.Lines.Add(new JournalEntryLine
            {
                JournalEntryId = journalEntry.Id,
                AccountId = asset.AccumulatedDepreciationAccountId,
                AccountCode = asset.AccumulatedDepreciationAccountCode,
                AccountName = asset.AccumulatedDepreciationAccountName,
                Debit = 0,
                Credit = entry.DepreciationAmount,
                LineDescription = narration
            });

            _db.JournalEntries.Add(journalEntry);

            entry.Status = "POSTED";
            entry.JournalEntryId = journalEntry.Id;
            entry.JournalEntryNumber = journalEntry.EntryNumber;
            entry.PostedAt = today;
            entry.PostedBy = "Depreciation Engine";
            entry.UpdatedAt = today;

            asset.AccumulatedDepreciation = Math.Round(asset.AccumulatedDepreciation + entry.DepreciationAmount, 2);
            asset.CurrentBookValue = Math.Round(asset.CurrentBookValue - entry.DepreciationAmount, 2);
            asset.LastDepreciationDate = entry.PeriodDate;
            asset.DepreciationPeriodsPostedCount++;

            if (asset.CurrentBookValue <= asset.ResidualValue + 0.01)
            {
                asset.CurrentBookValue = asset.ResidualValue;
                asset.Status = "FULLY_DEPRECIATED";
            }

            asset.UpdatedAt = today;
            postedAssetsCount++;
            totalDepreciationBatch += entry.DepreciationAmount;
        }

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            PeriodKey = targetKey,
            ProcessedAssetsCount = postedAssetsCount,
            TotalDepreciationAmount = Math.Round(totalDepreciationBatch, 2)
        }, $"Batch depreciation for {targetKey} completed. Posted Rs. {totalDepreciationBatch:N2} across {postedAssetsCount} assets."));
    }

    #endregion

    #region 5. Asset Movement / Transfer

    public class TransferAssetDto
    {
        public string ToLocation { get; set; } = string.Empty;
        public string? ToDepartment { get; set; }
        public string? ToAssignedTo { get; set; }
        public string? Reason { get; set; }
        public string? TransferredBy { get; set; }
    }

    [HttpPost("assets/{id}/transfer")]
    public async Task<IActionResult> TransferAsset(string id, [FromBody] TransferAssetDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.ToLocation))
            return BadRequest(ApiResponse.Fail("Target transfer location is mandatory."));

        var asset = await _db.FixedAssets.FirstOrDefaultAsync(a => a.Id == id);
        if (asset == null)
            return NotFound(ApiResponse.Fail("Fixed asset not found."));

        if (asset.Status == "DISPOSED")
            return BadRequest(ApiResponse.Fail("Cannot transfer a disposed asset."));

        var movement = new AssetMovement
        {
            FixedAssetId = asset.Id,
            TransferDate = DateTime.UtcNow,
            FromLocation = asset.Location,
            ToLocation = dto.ToLocation.Trim(),
            FromDepartment = asset.Department,
            ToDepartment = string.IsNullOrWhiteSpace(dto.ToDepartment) ? asset.Department : dto.ToDepartment.Trim(),
            FromAssignedTo = asset.AssignedTo,
            ToAssignedTo = dto.ToAssignedTo?.Trim(),
            Reason = dto.Reason?.Trim(),
            TransferredBy = string.IsNullOrWhiteSpace(dto.TransferredBy) ? "Operations" : dto.TransferredBy.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.AssetMovements.Add(movement);

        // Update Asset Location
        asset.Location = movement.ToLocation;
        asset.Department = movement.ToDepartment ?? asset.Department;
        asset.AssignedTo = movement.ToAssignedTo;
        asset.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(asset, $"Asset {asset.AssetCode} transferred to {asset.Location}."));
    }

    #endregion

    #region 6. Asset Disposal & Derecognition

    public class DisposeAssetDto
    {
        public DateTime DisposalDate { get; set; }
        public string DisposalType { get; set; } = "SOLD"; // SOLD, SCRAPPED, WRITTEN_OFF, LOST_DAMAGED
        public double DisposalAmount { get; set; } = 0; // Sale proceeds
        public string? ReceivingAccountId { get; set; } // Cash or Bank Asset account if sold
        public string? Reason { get; set; }
        public string? Reference { get; set; }
        public string? DisposedBy { get; set; }
    }

    [HttpPost("assets/{id}/dispose")]
    public async Task<IActionResult> DisposeAsset(string id, [FromBody] DisposeAssetDto dto)
    {
        var asset = await _db.FixedAssets.FirstOrDefaultAsync(a => a.Id == id);
        if (asset == null)
            return NotFound(ApiResponse.Fail("Fixed asset not found."));

        if (asset.Status == "DISPOSED")
            return BadRequest(ApiResponse.Fail("This asset is already disposed."));

        var hotelId = await GetCurrentHotelIdAsync();
        var today = DateTime.UtcNow;
        var dispDate = dto.DisposalDate != default ? dto.DisposalDate : today;

        var disposalAmt = Math.Max(0, Math.Round(dto.DisposalAmount, 2));
        var netBookValue = Math.Round(asset.TotalCapitalizedCost - asset.AccumulatedDepreciation, 2);
        var gainOrLoss = Math.Round(disposalAmt - netBookValue, 2);
        var isGain = gainOrLoss >= 0;

        Account? recvAcc = null;
        if (disposalAmt > 0)
        {
            if (!string.IsNullOrWhiteSpace(dto.ReceivingAccountId))
                recvAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == dto.ReceivingAccountId && a.AccountType == "ASSET");
            if (recvAcc == null)
                recvAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountType == "ASSET" && a.AccountCode == "1050");
        }

        // Locate Gain Account (4930) or Loss Account (6200)
        var gainAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "4930" || a.AccountName.Contains("Disposal Gain"));
        var lossAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "6200" || a.AccountName.Contains("Disposal Loss"));

        // Create Balanced Disposal Journal Entry
        var jvSeq = await _db.JournalEntries.CountAsync() + 1;
        var jvNumber = $"JV-DISP-{today.Year}-{jvSeq:D4}";

        var narration = $"[Disposal of {asset.AssetCode}] {dto.DisposalType}: {asset.AssetName} (Proceeds: Rs. {disposalAmt:N2}, NBV: Rs. {netBookValue:N2})";
        var journalEntry = new JournalEntry
        {
            HotelId = hotelId,
            EntryNumber = jvNumber,
            EntryDate = dispDate,
            EntryType = "GENERAL",
            SourceModule = "FIXED_ASSETS",
            SourceTransactionId = asset.Id,
            Reference = dto.Reference ?? asset.AssetCode,
            Description = narration,
            Status = "POSTED",
            CreatedBy = string.IsNullOrWhiteSpace(dto.DisposedBy) ? "Accountant" : dto.DisposedBy.Trim(),
            PostedBy = string.IsNullOrWhiteSpace(dto.DisposedBy) ? "Accountant" : dto.DisposedBy.Trim(),
            PostedAt = today,
            TotalDebit = 0,
            TotalCredit = 0
        };

        // 1. Debit Cash/Bank for disposal proceeds (if sold)
        if (disposalAmt > 0 && recvAcc != null)
        {
            journalEntry.Lines.Add(new JournalEntryLine
            {
                JournalEntryId = journalEntry.Id,
                AccountId = recvAcc.Id,
                AccountCode = recvAcc.AccountCode,
                AccountName = recvAcc.AccountName,
                Debit = disposalAmt,
                Credit = 0,
                LineDescription = $"Sale proceeds for {asset.AssetCode}"
            });
            recvAcc.CurrentBalance += disposalAmt;
        }

        // 2. Debit Accumulated Depreciation (to derecognize/clear contra-asset)
        if (asset.AccumulatedDepreciation > 0)
        {
            journalEntry.Lines.Add(new JournalEntryLine
            {
                JournalEntryId = journalEntry.Id,
                AccountId = asset.AccumulatedDepreciationAccountId,
                AccountCode = asset.AccumulatedDepreciationAccountCode,
                AccountName = asset.AccumulatedDepreciationAccountName,
                Debit = asset.AccumulatedDepreciation,
                Credit = 0,
                LineDescription = $"Derecognize accumulated depreciation for {asset.AssetCode}"
            });

            var accumAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == asset.AccumulatedDepreciationAccountId);
            if (accumAcc != null) accumAcc.CurrentBalance -= asset.AccumulatedDepreciation;
        }

        // 3. Loss on Disposal (Debit) OR Gain on Disposal (Credit)
        if (!isGain && Math.Abs(gainOrLoss) > 0.01 && lossAcc != null)
        {
            journalEntry.Lines.Add(new JournalEntryLine
            {
                JournalEntryId = journalEntry.Id,
                AccountId = lossAcc.Id,
                AccountCode = lossAcc.AccountCode,
                AccountName = lossAcc.AccountName,
                Debit = Math.Abs(gainOrLoss),
                Credit = 0,
                LineDescription = $"Net loss on disposal of {asset.AssetCode}"
            });
            lossAcc.CurrentBalance += Math.Abs(gainOrLoss);
        }
        else if (isGain && gainOrLoss > 0.01 && gainAcc != null)
        {
            journalEntry.Lines.Add(new JournalEntryLine
            {
                JournalEntryId = journalEntry.Id,
                AccountId = gainAcc.Id,
                AccountCode = gainAcc.AccountCode,
                AccountName = gainAcc.AccountName,
                Debit = 0,
                Credit = gainOrLoss,
                LineDescription = $"Net gain on disposal of {asset.AssetCode}"
            });
            gainAcc.CurrentBalance += gainOrLoss;
        }

        // 4. Credit Original Fixed Asset Cost Account (to derecognize original asset cost)
        journalEntry.Lines.Add(new JournalEntryLine
        {
            JournalEntryId = journalEntry.Id,
            AccountId = asset.AssetAccountId,
            AccountCode = asset.AssetAccountCode,
            AccountName = asset.AssetAccountName,
            Debit = 0,
            Credit = asset.TotalCapitalizedCost,
            LineDescription = $"Derecognize original cost for {asset.AssetCode}"
        });

        var assetCostAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == asset.AssetAccountId);
        if (assetCostAcc != null) assetCostAcc.CurrentBalance -= asset.TotalCapitalizedCost;

        journalEntry.TotalDebit = journalEntry.Lines.Sum(l => l.Debit);
        journalEntry.TotalCredit = journalEntry.Lines.Sum(l => l.Credit);

        _db.JournalEntries.Add(journalEntry);

        // Update Asset
        asset.Status = "DISPOSED";
        asset.DisposalDate = dispDate;
        asset.DisposalType = dto.DisposalType.ToUpper();
        asset.DisposalAmount = disposalAmt;
        asset.DisposalReceivingAccountId = recvAcc?.Id;
        asset.DisposalReceivingAccountCode = recvAcc?.AccountCode;
        asset.DisposalReceivingAccountName = recvAcc?.AccountName;
        asset.NetBookValueAtDisposal = netBookValue;
        asset.GainOrLossAmount = gainOrLoss;
        asset.IsGain = isGain;
        asset.DisposalReason = dto.Reason?.Trim();
        asset.DisposalReference = dto.Reference?.Trim();
        asset.DisposalJournalEntryId = journalEntry.Id;
        asset.DisposalJournalEntryNumber = journalEntry.EntryNumber;
        asset.DisposedBy = journalEntry.PostedBy;
        asset.DisposedAt = today;
        asset.CurrentBookValue = 0;
        asset.UpdatedAt = today;

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            asset.AssetCode,
            asset.Status,
            NetBookValue = netBookValue,
            DisposalProceeds = disposalAmt,
            GainOrLoss = gainOrLoss,
            IsGain = isGain,
            JournalEntryNumber = jvNumber
        }, $"Asset {asset.AssetCode} derecognized successfully under voucher {jvNumber}. Gain/Loss: Rs. {gainOrLoss:N2}."));
    }

    #endregion

    #region 7. Configurable Asset Categories

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var hotelId = await GetCurrentHotelIdAsync();
        await EnsureStandardAccountsAndCategoriesAsync(hotelId);

        var categories = await _db.AssetCategories
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.CategoryName)
            .ToListAsync();

        return Ok(ApiResponse.Ok(categories));
    }

    public class CreateAssetCategoryDto
    {
        public string CategoryName { get; set; } = string.Empty;
        public string CodePrefix { get; set; } = "AST";
        public string AssetAccountId { get; set; } = string.Empty;
        public string AccumulatedDepreciationAccountId { get; set; } = string.Empty;
        public string DepreciationExpenseAccountId { get; set; } = string.Empty;
        public int DefaultUsefulLifeYears { get; set; } = 5;
        public double DefaultResidualValuePercentage { get; set; } = 0;
        public string? Description { get; set; }
        public int DisplayOrder { get; set; } = 0;
    }

    [HttpPost("categories")]
    public async Task<IActionResult> CreateCategory([FromBody] CreateAssetCategoryDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.CategoryName))
            return BadRequest(ApiResponse.Fail("Category name is required."));

        var hotelId = await GetCurrentHotelIdAsync();

        var costAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == dto.AssetAccountId);
        var accumAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == dto.AccumulatedDepreciationAccountId);
        var expAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == dto.DepreciationExpenseAccountId);

        if (costAcc == null || accumAcc == null || expAcc == null)
            return BadRequest(ApiResponse.Fail("Must link valid Cost, Accumulated Depreciation, and Depreciation Expense accounts."));

        var cat = new AssetCategory
        {
            HotelId = hotelId,
            CategoryName = dto.CategoryName.Trim(),
            CodePrefix = string.IsNullOrWhiteSpace(dto.CodePrefix) ? "AST" : dto.CodePrefix.Trim().ToUpper(),
            AssetAccountId = costAcc.Id,
            AssetAccountCode = costAcc.AccountCode,
            AssetAccountName = costAcc.AccountName,
            AccumulatedDepreciationAccountId = accumAcc.Id,
            AccumulatedDepreciationAccountCode = accumAcc.AccountCode,
            AccumulatedDepreciationAccountName = accumAcc.AccountName,
            DepreciationExpenseAccountId = expAcc.Id,
            DepreciationExpenseAccountCode = expAcc.AccountCode,
            DepreciationExpenseAccountName = expAcc.AccountName,
            DefaultUsefulLifeYears = dto.DefaultUsefulLifeYears > 0 ? dto.DefaultUsefulLifeYears : 5,
            DefaultResidualValuePercentage = dto.DefaultResidualValuePercentage,
            Description = dto.Description?.Trim(),
            DisplayOrder = dto.DisplayOrder,
            IsSystem = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.AssetCategories.Add(cat);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(cat, "Asset category created successfully."));
    }

    [HttpDelete("categories/{id}")]
    public async Task<IActionResult> DeleteCategory(string id)
    {
        var cat = await _db.AssetCategories.FirstOrDefaultAsync(c => c.Id == id);
        if (cat == null)
            return NotFound(ApiResponse.Fail("Category not found."));

        if (cat.IsSystem)
            return BadRequest(ApiResponse.Fail("System default categories cannot be deleted."));

        var hasAssets = await _db.FixedAssets.AnyAsync(a => a.CategoryId == id);
        if (hasAssets)
            return BadRequest(ApiResponse.Fail("Cannot delete this category because active or historical assets are attached to it."));

        _db.AssetCategories.Remove(cat);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok("Asset category deleted."));
    }

    #endregion

    #region 8. Acquisition & Disposal Accounts

    [HttpGet("accounts-metadata")]
    public async Task<IActionResult> GetAccountsMetadata()
    {
        var hotelId = await GetCurrentHotelIdAsync();
        await EnsureStandardAccountsAndCategoriesAsync(hotelId);

        var accounts = await _db.Accounts
            .Where(a => !a.IsGroup && a.IsActive)
            .OrderBy(a => a.AccountCode)
            .Select(a => new
            {
                a.Id,
                a.AccountCode,
                a.AccountName,
                a.AccountType,
                a.SubCategory,
                a.CurrentBalance
            })
            .ToListAsync();

        return Ok(ApiResponse.Ok(accounts));
    }

    #endregion
}


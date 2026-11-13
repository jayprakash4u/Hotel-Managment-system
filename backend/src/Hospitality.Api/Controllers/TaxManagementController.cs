using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/tax-management")]
public class TaxManagementController : ControllerBase
{
    private readonly HospitalityDbContext _db;
    private readonly ILogger<TaxManagementController> _logger;

    public TaxManagementController(HospitalityDbContext db, ILogger<TaxManagementController> logger)
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

    private async Task EnsureTaxAccountsAsync(string hotelId)
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

        Ensure("2050", "VAT / Sales Tax Collected Payable", "LIABILITY", "Tax Liabilities", "CREDIT", 0, "Government tax collected from customers");
        Ensure("2070", "TDS / Withholding Tax Payable", "LIABILITY", "Tax Liabilities", "CREDIT", 0, "Tax deducted at source on rent and services");
        Ensure("7010", "Corporate Income Tax Expense", "EXPENSE", "Income Tax", "DEBIT", 0, "Estimated corporate income tax on period net earnings");

        if (toAdd.Count > 0)
        {
            _db.Accounts.AddRange(toAdd);
            await _db.SaveChangesAsync();
        }
    }

    #region Data Transfer Models

    public class TaxSummaryResponse
    {
        public double TotalTaxLiability { get; set; }
        public double NetVatPayable { get; set; }
        public double OutputVatCollected { get; set; }
        public double InputVatPaid { get; set; }

        public double TotalTdsPayable { get; set; }
        public double TdsOnRent { get; set; }
        public double TdsOnServices { get; set; }
        public double TdsOnPayroll { get; set; }

        public double EstimatedCorporateTax { get; set; }
        public double TotalTaxPaidPeriod { get; set; }
        public string TaxPeriod { get; set; } = string.Empty;
        public string Status { get; set; } = "UP_TO_DATE";
    }

    public class TaxRecordItem
    {
        public string Id { get; set; } = string.Empty;
        public string VoucherNumber { get; set; } = string.Empty;
        public DateTime TransactionDate { get; set; }
        public string TaxType { get; set; } = string.Empty; // VAT, TDS, CORPORATE_TAX
        public string Category { get; set; } = string.Empty; // Sales VAT, Purchase VAT, Rent TDS, Contract TDS, etc.
        public string ReferenceNumber { get; set; } = string.Empty;
        public string PartyName { get; set; } = string.Empty;
        public double TaxableAmount { get; set; }
        public double TaxRate { get; set; }
        public double TaxAmount { get; set; }
        public string Status { get; set; } = "PENDING"; // PENDING, PAID, FILED
        public string? PaymentVoucherNumber { get; set; }
        public string SourceModule { get; set; } = "MANUAL";
    }

    public class RecordTaxPaymentDto
    {
        public string TaxType { get; set; } = "VAT"; // VAT, TDS, CORPORATE_TAX
        public double Amount { get; set; }
        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
        public string PaymentAccountId { get; set; } = string.Empty; // Cash or Bank Account ID
        public string ReferenceNumber { get; set; } = string.Empty; // Cheque or deposit challan #
        public string? TaxPeriod { get; set; } // e.g. "Ashwin 2083" or "Oct 2026"
        public string? Notes { get; set; }
    }

    #endregion

    #region 1. Tax Summary Endpoint

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        var hotelId = await GetCurrentHotelIdAsync();
        await EnsureTaxAccountsAsync(hotelId);

        var now = DateTime.UtcNow;
        var start = startDate.HasValue
            ? DateTime.SpecifyKind(startDate.Value.Date, DateTimeKind.Utc)
            : new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var end = endDate.HasValue
            ? DateTime.SpecifyKind(endDate.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc)
            : new DateTime(now.Year, now.Month, DateTime.DaysInMonth(now.Year, now.Month), 23, 59, 59, 999, DateTimeKind.Utc);

        // Fetch tax accounts
        var vatAccount = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "2050");
        var tdsAccount = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "2070");
        var taxExpenseAccount = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "7010");

        double outputVat = 0;
        double inputVat = 0;
        double vatPaid = 0;

        if (vatAccount != null)
        {
            var vatLines = await _db.JournalEntryLines
                .Where(l => l.AccountId == vatAccount.Id &&
                            l.JournalEntry != null &&
                            (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED") &&
                            l.JournalEntry.EntryDate >= start &&
                            l.JournalEntry.EntryDate <= end)
                .Select(l => new { l.Debit, l.Credit, l.JournalEntry!.SourceModule })
                .ToListAsync();

            outputVat = vatLines.Sum(l => l.Credit);
            inputVat = vatLines.Where(l => l.SourceModule != "TAX_PAYMENT").Sum(l => l.Debit);
            vatPaid = vatLines.Where(l => l.SourceModule == "TAX_PAYMENT").Sum(l => l.Debit);
        }

        double tdsRent = 0;
        double tdsServices = 0;
        double tdsPayroll = 0;
        double tdsPaid = 0;

        if (tdsAccount != null)
        {
            var tdsLines = await _db.JournalEntryLines
                .Where(l => l.AccountId == tdsAccount.Id &&
                            l.JournalEntry != null &&
                            (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED") &&
                            l.JournalEntry.EntryDate >= start &&
                            l.JournalEntry.EntryDate <= end)
                .Include(l => l.JournalEntry)
                .ToListAsync();

            foreach (var l in tdsLines)
            {
                if (l.Credit > 0)
                {
                    var desc = (l.LineDescription ?? l.JournalEntry?.Description ?? "").ToLowerInvariant();
                    if (desc.Contains("rent")) tdsRent += l.Credit;
                    else if (desc.Contains("salary") || desc.Contains("payroll")) tdsPayroll += l.Credit;
                    else tdsServices += l.Credit;
                }
                else if (l.Debit > 0)
                {
                    tdsPaid += l.Debit;
                }
            }
        }

        double totalTds = tdsRent + tdsServices + tdsPayroll;
        double netVat = Math.Max(0, outputVat - inputVat - vatPaid);
        double netTds = Math.Max(0, totalTds - tdsPaid);

        // Corporate tax estimate
        double corpTax = 0;
        if (taxExpenseAccount != null)
        {
            corpTax = await _db.JournalEntryLines
                .Where(l => l.AccountId == taxExpenseAccount.Id &&
                            l.JournalEntry != null &&
                            (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED") &&
                            l.JournalEntry.EntryDate >= start &&
                            l.JournalEntry.EntryDate <= end)
                .SumAsync(l => l.Debit - l.Credit);
        }

        var totalLiability = netVat + netTds + Math.Max(0, corpTax);

        var response = new TaxSummaryResponse
        {
            TotalTaxLiability = Math.Round(totalLiability, 2),
            NetVatPayable = Math.Round(netVat, 2),
            OutputVatCollected = Math.Round(outputVat, 2),
            InputVatPaid = Math.Round(inputVat, 2),

            TotalTdsPayable = Math.Round(netTds, 2),
            TdsOnRent = Math.Round(tdsRent, 2),
            TdsOnServices = Math.Round(tdsServices, 2),
            TdsOnPayroll = Math.Round(tdsPayroll, 2),

            EstimatedCorporateTax = Math.Round(Math.Max(0, corpTax), 2),
            TotalTaxPaidPeriod = Math.Round(vatPaid + tdsPaid, 2),
            TaxPeriod = $"{start:dd MMM yyyy} - {end:dd MMM yyyy}",
            Status = totalLiability > 0 ? "PAYMENT_DUE" : "UP_TO_DATE"
        };

        return Ok(ApiResponse.Ok(response, "Tax summary retrieved successfully."));
    }

    #endregion

    #region 2. Tax Records List Endpoint

    [HttpGet("records")]
    public async Task<IActionResult> GetRecords(
        [FromQuery] string? taxType = "ALL",
        [FromQuery] string? status = "ALL",
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        var hotelId = await GetCurrentHotelIdAsync();
        var now = DateTime.UtcNow;

        var start = startDate.HasValue ? DateTime.SpecifyKind(startDate.Value.Date, DateTimeKind.Utc) : new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var end = endDate.HasValue ? DateTime.SpecifyKind(endDate.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc) : new DateTime(now.Year, now.Month, DateTime.DaysInMonth(now.Year, now.Month), 23, 59, 59, 999, DateTimeKind.Utc);

        var vatAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "2050");
        var tdsAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "2070");
        var taxExpAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "7010");

        var targetAccIds = new List<string>();
        if (vatAcc != null && (taxType == "ALL" || taxType == "VAT")) targetAccIds.Add(vatAcc.Id);
        if (tdsAcc != null && (taxType == "ALL" || taxType == "TDS")) targetAccIds.Add(tdsAcc.Id);
        if (taxExpAcc != null && (taxType == "ALL" || taxType == "CORPORATE_TAX")) targetAccIds.Add(taxExpAcc.Id);

        var query = _db.JournalEntryLines
            .Where(l => targetAccIds.Contains(l.AccountId) &&
                        l.JournalEntry != null &&
                        (l.JournalEntry.Status == "POSTED" || l.JournalEntry.Status == "REVERSED") &&
                        l.JournalEntry.EntryDate >= start &&
                        l.JournalEntry.EntryDate <= end)
            .Include(l => l.JournalEntry)
            .Include(l => l.Account)
            .OrderByDescending(l => l.JournalEntry!.EntryDate)
            .AsQueryable();

        var lines = await query.ToListAsync();

        var records = new List<TaxRecordItem>();

        foreach (var l in lines)
        {
            var je = l.JournalEntry;
            var acc = l.Account;
            var isVat = acc?.AccountCode == "2050";
            var isTds = acc?.AccountCode == "2070";
            var isCorp = acc?.AccountCode == "7010";

            string recordTaxType = isVat ? "VAT" : (isTds ? "TDS" : "CORPORATE_TAX");
            double taxAmt = isVat ? (l.Credit > 0 ? l.Credit : l.Debit) : (isTds ? (l.Credit > 0 ? l.Credit : l.Debit) : l.Debit);
            double rate = isVat ? 13.0 : (isTds ? 10.0 : 25.0);
            double taxable = rate > 0 ? (taxAmt / rate) * 100 : taxAmt;

            string category = isVat ? (l.Credit > 0 ? "Output Sales VAT (13%)" : (je?.SourceModule == "TAX_PAYMENT" ? "VAT Settlement Paid" : "Input Purchase VAT"))
                                    : (isTds ? (l.Credit > 0 ? "TDS Deducted" : "TDS Settlement Paid") : "Corporate Tax Provision");

            bool isPayment = je?.SourceModule == "TAX_PAYMENT" || l.Debit > 0;
            string recStatus = isPayment ? "PAID" : "PENDING";

            if (!string.IsNullOrWhiteSpace(status) && status != "ALL" && !recStatus.Equals(status, StringComparison.OrdinalIgnoreCase))
                continue;

            records.Add(new TaxRecordItem
            {
                Id = l.Id,
                VoucherNumber = je?.EntryNumber ?? "JV-UNKNOWN",
                TransactionDate = je?.EntryDate ?? DateTime.UtcNow,
                TaxType = recordTaxType,
                Category = category,
                ReferenceNumber = je?.Reference ?? "-",
                PartyName = "IRD Nepal / Internal Tax Provision",
                TaxableAmount = Math.Round(taxable, 2),
                TaxRate = rate,
                TaxAmount = Math.Round(taxAmt, 2),
                Status = recStatus,
                PaymentVoucherNumber = isPayment ? je?.EntryNumber : null,
                SourceModule = je?.SourceModule ?? "MANUAL"
            });
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLowerInvariant();
            records = records.Where(r => r.VoucherNumber.ToLower().Contains(s) ||
                                         r.ReferenceNumber.ToLower().Contains(s) ||
                                         r.Category.ToLower().Contains(s)).ToList();
        }

        var total = records.Count;
        var paginated = records.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        return Ok(ApiResponse.Ok(new
        {
            totalCount = total,
            page,
            pageSize,
            records = paginated
        }, "Tax records retrieved successfully."));
    }

    #endregion

    #region 3. Record Tax Payment to Government

    [HttpPost("record-payment")]
    public async Task<IActionResult> RecordPayment([FromBody] RecordTaxPaymentDto dto)
    {
        if (dto.Amount <= 0)
            return BadRequest(ApiResponse.Fail("Payment amount must be greater than zero."));

        if (string.IsNullOrEmpty(dto.PaymentAccountId))
            return BadRequest(ApiResponse.Fail("Please select a valid cash or bank payment account."));

        var hotelId = await GetCurrentHotelIdAsync();
        var payAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == dto.PaymentAccountId);
        if (payAcc == null)
            return NotFound(ApiResponse.Fail("Payment bank/cash account not found."));

        string liabilityCode = dto.TaxType.ToUpperInvariant() switch
        {
            "VAT" => "2050",
            "TDS" => "2070",
            "CORPORATE_TAX" => "2050", // Or tax payable
            _ => "2050"
        };

        var taxLiabilityAcc = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == liabilityCode);
        if (taxLiabilityAcc == null)
            return NotFound(ApiResponse.Fail($"Tax liability account '{liabilityCode}' not found."));

        // Create Tax Settlement Journal Entry
        var currentYear = DateTime.UtcNow.Year;
        var lastCount = await _db.JournalEntries.CountAsync() + 1;
        var entryNumber = $"JV-TAX-{currentYear}-{lastCount:D4}";

        var narration = $"Government Tax Settlement: {dto.TaxType} deposit to Inland Revenue Department (IRD). Period: {dto.TaxPeriod ?? "Current"}. Ref: {dto.ReferenceNumber}";

        var je = new JournalEntry
        {
            HotelId = hotelId,
            EntryNumber = entryNumber,
            EntryDate = DateTime.SpecifyKind(dto.PaymentDate, DateTimeKind.Utc),
            EntryType = "ADJUSTMENT",
            Reference = dto.ReferenceNumber,
            Description = narration,
            TotalDebit = dto.Amount,
            TotalCredit = dto.Amount,
            Status = "POSTED",
            SourceModule = "TAX_PAYMENT",
            CreatedBy = User.Identity?.Name ?? "Accountant",
            PostedBy = User.Identity?.Name ?? "Accountant",
            PostedAt = DateTime.UtcNow
        };

        // Lines: Debit Tax Liability, Credit Bank/Cash
        je.Lines.Add(new JournalEntryLine
        {
            AccountId = taxLiabilityAcc.Id,
            AccountCode = taxLiabilityAcc.AccountCode,
            AccountName = taxLiabilityAcc.AccountName,
            LineDescription = $"Tax settlement: {dto.TaxType} payable cleared",
            Debit = dto.Amount,
            Credit = 0
        });

        je.Lines.Add(new JournalEntryLine
        {
            AccountId = payAcc.Id,
            AccountCode = payAcc.AccountCode,
            AccountName = payAcc.AccountName,
            LineDescription = $"Payment from {payAcc.AccountName} to IRD",
            Debit = 0,
            Credit = dto.Amount
        });

        _db.JournalEntries.Add(je);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            entryNumber = je.EntryNumber,
            paymentDate = je.EntryDate,
            amount = dto.Amount,
            taxType = dto.TaxType
        }, $"Tax payment of Rs. {dto.Amount:N2} recorded and journal voucher {je.EntryNumber} posted successfully."));
    }

    #endregion
}


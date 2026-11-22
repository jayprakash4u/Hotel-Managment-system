using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;
using System.Text.Json;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/suppliers")]
public class SuppliersController : ControllerBase
{
    private readonly HospitalityDbContext _db;

    public SuppliersController(HospitalityDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetSuppliers(
        [FromQuery] bool? activeOnly,
        [FromQuery] string? search,
        [FromQuery] string? category)
    {
        var query = _db.Suppliers
            .Include(s => s.Items)
            .Include(s => s.Purchases)
            .AsQueryable();

        // 1. Filter by Active status
        if (activeOnly == true)
        {
            query = query.Where(s => s.IsActive);
        }

        // 2. Filter by Category
        if (!string.IsNullOrWhiteSpace(category) && !category.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(s => s.Category.ToLower() == category.ToLower());
        }

        // 3. Search query
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(x =>
                x.Name.ToLower().Contains(s) ||
                x.Code.ToLower().Contains(s) ||
                x.Phone.ToLower().Contains(s) ||
                x.Email.ToLower().Contains(s) ||
                x.ContactName.ToLower().Contains(s) ||
                (x.PanVatNumber != null && x.PanVatNumber.ToLower().Contains(s))
            );
        }

        var suppliers = await query.OrderBy(s => s.Name).ToListAsync();

        // Ensure each supplier has a unique Code (auto-generate for legacy records without one)
        bool hasChanges = false;
        int nextCodeNumber = 101;
        foreach (var sup in suppliers)
        {
            if (string.IsNullOrWhiteSpace(sup.Code))
            {
                sup.Code = $"SUP-{nextCodeNumber++}";
                hasChanges = true;
            }
        }
        if (hasChanges)
        {
            await _db.SaveChangesAsync();
        }

        // Enrich with current balances from latest ledger entries
        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? string.Empty;

        var enriched = new List<object>();
        foreach (var sup in suppliers)
        {
            var latestEntry = await _db.SupplierLedgers
                .Where(e => e.HotelId == hotelId && e.SupplierId == sup.Id)
                .OrderByDescending(e => e.EntryDate)
                .ThenByDescending(e => e.CreatedAt)
                .FirstOrDefaultAsync();

            var currentBalance = latestEntry?.Balance ?? sup.OpeningBalance;
            var unpaidPurchasesCount = sup.Purchases.Count(p => p.DueAmount > 0 && p.Status != "CANCELLED");

            enriched.Add(new
            {
                id = sup.Id,
                name = sup.Name,
                code = sup.Code,
                contactPerson = sup.ContactPerson,
                contactName = sup.ContactName,
                phone = sup.Phone,
                email = sup.Email,
                address = sup.Address,
                panVatNumber = sup.PanVatNumber,
                category = sup.Category,
                supplierType = sup.SupplierType,
                branchOrOutlet = sup.BranchOrOutlet,
                notes = sup.Notes,
                isActive = sup.IsActive,
                creditLimit = sup.CreditLimit,
                paymentTermsDays = sup.PaymentTermsDays,
                openingBalance = sup.OpeningBalance,
                advanceBalance = sup.AdvanceBalance,
                currentBalance = currentBalance,
                unpaidInvoicesCount = unpaidPurchasesCount,
                totalPurchasesCount = sup.Purchases.Count,
                createdAt = sup.CreatedAt
            });
        }

        return Ok(ApiResponse.Ok(enriched));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetSupplierById(string id)
    {
        var supplier = await _db.Suppliers
            .Include(s => s.Items)
            .Include(s => s.Purchases)
            .FirstOrDefaultAsync(s => s.Id == id || s.Code.ToLower() == id.ToLower());

        if (supplier == null)
        {
            return NotFound(ApiResponse.Fail($"Supplier '{id}' not found."));
        }

        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? string.Empty;

        var latestEntry = await _db.SupplierLedgers
            .Where(e => e.HotelId == hotelId && e.SupplierId == supplier.Id)
            .OrderByDescending(e => e.EntryDate)
            .ThenByDescending(e => e.CreatedAt)
            .FirstOrDefaultAsync();

        var currentBalance = latestEntry?.Balance ?? supplier.OpeningBalance;
        var now = DateTime.UtcNow;

        var overdueAmount = supplier.Purchases
            .Where(p => p.DueAmount > 0 && p.Status != "CANCELLED" && p.DueDate.HasValue && p.DueDate.Value < now)
            .Sum(p => p.DueAmount);

        var totalPurchasesAmount = supplier.Purchases
            .Where(p => p.Status != "CANCELLED")
            .Sum(p => p.TotalAmount);

        var totalPaidAmount = supplier.Purchases
            .Where(p => p.Status != "CANCELLED")
            .Sum(p => p.PaidAmount);

        return Ok(ApiResponse.Ok(new
        {
            id = supplier.Id,
            name = supplier.Name,
            code = supplier.Code,
            contactPerson = supplier.ContactPerson,
            contactName = supplier.ContactName,
            phone = supplier.Phone,
            email = supplier.Email,
            address = supplier.Address,
            panVatNumber = supplier.PanVatNumber,
            category = supplier.Category,
            supplierType = supplier.SupplierType,
            branchOrOutlet = supplier.BranchOrOutlet,
            notes = supplier.Notes,
            isActive = supplier.IsActive,
            creditLimit = supplier.CreditLimit,
            paymentTermsDays = supplier.PaymentTermsDays,
            openingBalance = supplier.OpeningBalance,
            advanceBalance = supplier.AdvanceBalance,
            currentBalance = currentBalance,
            totalPurchasesAmount = totalPurchasesAmount,
            totalPaidAmount = totalPaidAmount,
            dueAmount = Math.Max(0, currentBalance),
            overdueAmount = overdueAmount,
            purchasesCount = supplier.Purchases.Count,
            itemsCount = supplier.Items.Count,
            createdAt = supplier.CreatedAt
        }));
    }

    public record CreateSupplierDto(
        string Name,
        string? ContactPerson,
        string? ContactName,
        string? Email,
        string? Phone,
        string? Address,
        string? PanVatNumber,
        string? Category,
        string? SupplierType,
        string? BranchOrOutlet,
        string? Notes,
        bool? IsActive,
        double? CreditLimit,
        int? PaymentTermsDays,
        double? OpeningBalance
    );

    [HttpPost]
    public async Task<IActionResult> CreateSupplier([FromBody] CreateSupplierDto req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
        {
            return BadRequest(ApiResponse.Fail("Supplier name is required."));
        }

        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? Guid.NewGuid().ToString("N");

        // Automatically generate unique Supplier Code
        var count = await _db.Suppliers.CountAsync();
        var candidateCode = $"SUP-{count + 101}";
        while (await _db.Suppliers.AnyAsync(s => s.Code == candidateCode))
        {
            count++;
            candidateCode = $"SUP-{count + 101}";
        }

        var contact = !string.IsNullOrWhiteSpace(req.ContactPerson)
            ? req.ContactPerson.Trim()
            : req.ContactName?.Trim() ?? string.Empty;

        var supplier = new Supplier
        {
            HotelId = hotelId,
            Code = candidateCode,
            Name = req.Name.Trim(),
            ContactName = contact,
            Email = req.Email?.Trim() ?? string.Empty,
            Phone = req.Phone?.Trim() ?? string.Empty,
            Address = req.Address?.Trim(),
            PanVatNumber = req.PanVatNumber?.Trim(),
            Category = !string.IsNullOrWhiteSpace(req.Category) ? req.Category.Trim() : "General",
            SupplierType = !string.IsNullOrWhiteSpace(req.SupplierType) ? req.SupplierType.Trim() : "Vendor",
            BranchOrOutlet = req.BranchOrOutlet?.Trim() ?? "Main Kitchen",
            Notes = req.Notes?.Trim(),
            IsActive = req.IsActive ?? true,
            CreditLimit = req.CreditLimit ?? 0,
            PaymentTermsDays = req.PaymentTermsDays ?? 0,
            OpeningBalance = req.OpeningBalance ?? 0,
            AdvanceBalance = 0,
            CreatedAt = DateTime.UtcNow
        };

        _db.Suppliers.Add(supplier);

        // If an opening balance is configured, record it as the initial ledger entry
        if (supplier.OpeningBalance != 0)
        {
            _db.SupplierLedgers.Add(new SupplierLedgerEntry
            {
                HotelId = hotelId,
                SupplierId = supplier.Id,
                EntryDate = DateTime.UtcNow,
                TransactionNumber = $"OB-{candidateCode}",
                Description = $"Opening Payable Balance for {supplier.Name}",
                CreditAmount = supplier.OpeningBalance > 0 ? supplier.OpeningBalance : 0,
                DebitAmount = supplier.OpeningBalance < 0 ? Math.Abs(supplier.OpeningBalance) : 0,
                Balance = supplier.OpeningBalance,
                ReferenceType = "OPENING_BALANCE",
                CreatedBy = "System",
                CreatedAt = DateTime.UtcNow
            });
        }

        await _db.SaveChangesAsync();
        return Ok(ApiResponse.Ok(supplier, $"Supplier '{supplier.Name}' created with code {supplier.Code}."));
    }

    public record UpdateSupplierDto(
        string Name,
        string? ContactPerson,
        string? ContactName,
        string? Email,
        string? Phone,
        string? Address,
        string? PanVatNumber,
        string? Category,
        string? SupplierType,
        string? BranchOrOutlet,
        string? Notes,
        bool? IsActive,
        double? CreditLimit,
        int? PaymentTermsDays,
        double? OpeningBalance
    );

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateSupplier(string id, [FromBody] UpdateSupplierDto req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
        {
            return BadRequest(ApiResponse.Fail("Supplier name is required."));
        }

        var supplier = await _db.Suppliers.FindAsync(id);
        if (supplier == null)
        {
            return NotFound(ApiResponse.Fail($"Supplier '{id}' not found."));
        }

        var contact = !string.IsNullOrWhiteSpace(req.ContactPerson)
            ? req.ContactPerson.Trim()
            : req.ContactName?.Trim() ?? string.Empty;

        supplier.Name = req.Name.Trim();
        supplier.ContactName = contact;
        supplier.Email = req.Email?.Trim() ?? string.Empty;
        supplier.Phone = req.Phone?.Trim() ?? string.Empty;
        supplier.Address = req.Address?.Trim();
        supplier.PanVatNumber = req.PanVatNumber?.Trim();
        if (!string.IsNullOrWhiteSpace(req.Category))
        {
            supplier.Category = req.Category.Trim();
        }
        if (!string.IsNullOrWhiteSpace(req.SupplierType))
        {
            supplier.SupplierType = req.SupplierType.Trim();
        }
        if (!string.IsNullOrWhiteSpace(req.BranchOrOutlet))
        {
            supplier.BranchOrOutlet = req.BranchOrOutlet.Trim();
        }
        supplier.Notes = req.Notes?.Trim();
        supplier.CreditLimit = req.CreditLimit ?? supplier.CreditLimit;
        supplier.PaymentTermsDays = req.PaymentTermsDays ?? supplier.PaymentTermsDays;
        supplier.OpeningBalance = req.OpeningBalance ?? supplier.OpeningBalance;
        if (req.IsActive.HasValue)
        {
            supplier.IsActive = req.IsActive.Value;
        }

        await _db.SaveChangesAsync();
        return Ok(ApiResponse.Ok(supplier, $"Supplier '{supplier.Name}' updated successfully."));
    }

    [HttpPatch("{id}/toggle-status")]
    public async Task<IActionResult> ToggleSupplierStatus(string id)
    {
        var supplier = await _db.Suppliers.FindAsync(id);
        if (supplier == null)
        {
            return NotFound(ApiResponse.Fail($"Supplier '{id}' not found."));
        }

        supplier.IsActive = !supplier.IsActive;
        await _db.SaveChangesAsync();

        var statusLabel = supplier.IsActive ? "activated" : "deactivated";
        return Ok(ApiResponse.Ok(supplier, $"Supplier '{supplier.Name}' has been {statusLabel}. Historical records are preserved."));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSupplier(string id)
    {
        var supplier = await _db.Suppliers
            .Include(s => s.Items)
            .Include(s => s.Purchases)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (supplier == null)
        {
            return NotFound(ApiResponse.Fail($"Supplier '{id}' not found."));
        }

        if (supplier.Purchases.Any() || supplier.Items.Any())
        {
            return BadRequest(ApiResponse.Fail(
                $"Cannot delete supplier '{supplier.Name}' because it has {supplier.Purchases.Count} purchase record(s) and {supplier.Items.Count} inventory item(s) linked to it. Please deactivate the supplier instead."
            ));
        }

        _db.Suppliers.Remove(supplier);
        await _db.SaveChangesAsync();
        return Ok(ApiResponse.Ok(supplier, $"Supplier '{supplier.Name}' deleted successfully."));
    }

    // =========================================================================
    // ENHANCED SUPPLIER LEDGER SUITE (STATEMENT, AGING, ALLOCATIONS, GL)
    // =========================================================================

    public record SupplierLedgerEntryDto(
        string Id,
        string EntryDate,
        string? TransactionNumber,
        string? PurchaseOrderId,
        string? PurchaseOrderNumber,
        string? PurchaseInvoiceNumber,
        string Description,
        double CreditAmount,
        double DebitAmount,
        double Balance,
        string? DueDate,
        string ReferenceType,
        string? ReferenceId,
        string? PaymentMode,
        string? BranchOrOutlet,
        string? JournalEntryId,
        string? Notes,
        string? CreatedBy,
        string Status
    );

    [HttpGet("{id}/ledger")]
    public async Task<IActionResult> GetSupplierLedger(
        string id,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] string? transactionType,
        [FromQuery] string? outlet,
        [FromQuery] bool outstandingOnly = false,
        [FromQuery] bool overdueOnly = false,
        [FromQuery] string? invoiceNumber = null
    )
    {
        var supplier = await _db.Suppliers.FindAsync(id);
        if (supplier == null)
        {
            return NotFound(ApiResponse.Fail($"Supplier '{id}' not found."));
        }

        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? string.Empty;

        // Calculate Period Opening Balance: entries strictly prior to startDate
        double periodOpeningBalance = supplier.OpeningBalance;
        if (startDate.HasValue)
        {
            var startUtc = DateTime.SpecifyKind(startDate.Value.Date, DateTimeKind.Utc);
            var priorCredits = await _db.SupplierLedgers
                .Where(l => l.HotelId == hotelId && l.SupplierId == id && l.EntryDate < startUtc && l.ReferenceType != "OPENING_BALANCE")
                .SumAsync(l => l.CreditAmount);

            var priorDebits = await _db.SupplierLedgers
                .Where(l => l.HotelId == hotelId && l.SupplierId == id && l.EntryDate < startUtc)
                .SumAsync(l => l.DebitAmount);

            periodOpeningBalance = Math.Round(supplier.OpeningBalance + priorCredits - priorDebits, 2);
        }

        var query = _db.SupplierLedgers
            .Include(l => l.PurchaseOrder)
            .Where(l => l.HotelId == hotelId && l.SupplierId == id);

        if (startDate.HasValue)
        {
            var startUtc = DateTime.SpecifyKind(startDate.Value.Date, DateTimeKind.Utc);
            query = query.Where(l => l.EntryDate >= startUtc);
        }

        if (endDate.HasValue)
        {
            var endUtc = DateTime.SpecifyKind(endDate.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
            query = query.Where(l => l.EntryDate <= endUtc);
        }

        if (!string.IsNullOrWhiteSpace(transactionType) && transactionType.ToUpper() != "ALL")
        {
            var tt = transactionType.Trim().ToUpper();
            query = query.Where(l => l.ReferenceType.ToUpper() == tt);
        }

        if (!string.IsNullOrWhiteSpace(outlet) && outlet.ToUpper() != "ALL")
        {
            var ot = outlet.Trim().ToUpper();
            query = query.Where(l => l.BranchOrOutlet != null && l.BranchOrOutlet.ToUpper() == ot);
        }

        if (!string.IsNullOrWhiteSpace(invoiceNumber))
        {
            var inv = invoiceNumber.Trim().ToLower();
            query = query.Where(l =>
                (l.PurchaseInvoiceNumber != null && l.PurchaseInvoiceNumber.ToLower().Contains(inv)) ||
                (l.PurchaseOrder != null && l.PurchaseOrder.PoNumber.ToLower().Contains(inv)) ||
                (l.PurchaseOrder != null && l.PurchaseOrder.InvoiceNumber != null && l.PurchaseOrder.InvoiceNumber.ToLower().Contains(inv))
            );
        }

        var rawEntries = await query
            .OrderBy(l => l.EntryDate)
            .ThenBy(l => l.CreatedAt)
            .ToListAsync();

        var now = DateTime.UtcNow;
        double currentRunning = periodOpeningBalance;
        var calculatedEntries = new List<SupplierLedgerEntryDto>();

        foreach (var e in rawEntries)
        {
            // If it is OPENING_BALANCE inside the period, don't double count if already in periodOpeningBalance
            if (e.ReferenceType == "OPENING_BALANCE" && startDate.HasValue)
            {
                continue;
            }

            currentRunning = Math.Round(currentRunning + e.CreditAmount - e.DebitAmount, 2);

            var status = "PAID";
            if (e.CreditAmount > 0)
            {
                if (e.DueDate.HasValue && now > e.DueDate.Value)
                    status = "OVERDUE";
                else if (currentRunning > 0)
                    status = "UNPAID";
            }
            else if (e.ReferenceType == "SUPPLIER_ADVANCE")
            {
                status = "ADVANCE";
            }

            if (outstandingOnly && currentRunning <= 0)
            {
                continue;
            }

            if (overdueOnly && status != "OVERDUE")
            {
                continue;
            }

            calculatedEntries.Add(new SupplierLedgerEntryDto(
                Id: e.Id,
                EntryDate: e.EntryDate.ToString("yyyy-MM-dd HH:mm"),
                TransactionNumber: e.TransactionNumber ?? e.ReferenceId ?? $"TXN-{e.Id.Substring(0, 8)}",
                PurchaseOrderId: e.PurchaseOrderId,
                PurchaseOrderNumber: e.PurchaseOrder?.PoNumber,
                PurchaseInvoiceNumber: e.PurchaseInvoiceNumber ?? e.PurchaseOrder?.InvoiceNumber,
                Description: e.Description,
                CreditAmount: e.CreditAmount,
                DebitAmount: e.DebitAmount,
                Balance: currentRunning,
                DueDate: e.DueDate?.ToString("yyyy-MM-dd"),
                ReferenceType: e.ReferenceType,
                ReferenceId: e.ReferenceId,
                PaymentMode: e.PaymentMode,
                BranchOrOutlet: e.BranchOrOutlet ?? e.PurchaseOrder?.BranchOrOutlet ?? "Main Kitchen",
                JournalEntryId: e.JournalEntryId ?? e.PurchaseOrder?.JournalEntryId,
                Notes: e.Notes,
                CreatedBy: e.CreatedBy ?? "Admin",
                Status: status
            ));
        }

        // Financial 9-Summary Metrics calculated accurately from actual transactions
        var totalPurchases = rawEntries
            .Where(e => e.ReferenceType == "PURCHASE_CREDIT" || e.ReferenceType == "CASH_PURCHASE" || e.ReferenceType == "PURCHASE_INVOICE")
            .Sum(e => e.CreditAmount);

        var totalPayments = rawEntries
            .Where(e => e.ReferenceType == "PAYMENT" || e.ReferenceType == "BANK_PAYMENT" || e.ReferenceType == "CASH_PAYMENT" || e.ReferenceType == "ADVANCE_ALLOCATION")
            .Sum(e => e.DebitAmount);

        var purchaseReturns = rawEntries
            .Where(e => e.ReferenceType == "PURCHASE_RETURN" || e.ReferenceType == "DEBIT_NOTE")
            .Sum(e => e.DebitAmount);

        var debitNotes = rawEntries
            .Where(e => e.ReferenceType == "DEBIT_NOTE")
            .Sum(e => e.DebitAmount);

        var creditNotes = rawEntries
            .Where(e => e.ReferenceType == "CREDIT_NOTE")
            .Sum(e => e.CreditAmount);

        // Get actual overdue unpaid purchase invoices
        var overdueAmount = await _db.PurchaseOrders
            .Where(p => p.HotelId == hotelId && p.SupplierId == id && p.DueAmount > 0 && p.Status != "CANCELLED" && p.DueDate.HasValue && p.DueDate.Value < now)
            .SumAsync(p => p.DueAmount);

        var outstandingPayable = Math.Max(0, currentRunning);
        var advanceBalance = supplier.AdvanceBalance + (currentRunning < 0 ? Math.Abs(currentRunning) : 0);

        var summary = new
        {
            openingPayableBalance = periodOpeningBalance,
            totalPurchases = Math.Round(totalPurchases, 2),
            totalPayments = Math.Round(totalPayments, 2),
            purchaseReturns = Math.Round(purchaseReturns, 2),
            debitNotes = Math.Round(debitNotes, 2),
            creditNotes = Math.Round(creditNotes, 2),
            outstandingPayable = Math.Round(outstandingPayable, 2),
            supplierAdvanceBalance = Math.Round(advanceBalance, 2),
            overdueAmount = Math.Round(overdueAmount, 2),
            creditLimit = supplier.CreditLimit,
            paymentTermsDays = supplier.PaymentTermsDays
        };

        return Ok(ApiResponse.Ok(new
        {
            supplier = new
            {
                id = supplier.Id,
                name = supplier.Name,
                code = supplier.Code,
                contactPerson = supplier.ContactPerson,
                phone = supplier.Phone,
                email = supplier.Email,
                address = supplier.Address,
                panVatNumber = supplier.PanVatNumber,
                category = supplier.Category,
                supplierType = supplier.SupplierType,
                branchOrOutlet = supplier.BranchOrOutlet,
                creditLimit = supplier.CreditLimit,
                paymentTermsDays = supplier.PaymentTermsDays,
                openingBalance = supplier.OpeningBalance,
                advanceBalance = supplier.AdvanceBalance,
                isActive = supplier.IsActive
            },
            periodOpeningBalance,
            closingBalance = currentRunning,
            summary,
            entries = calculatedEntries
        }));
    }

    [HttpGet("{id}/unpaid-purchases")]
    public async Task<IActionResult> GetUnpaidPurchases(string id)
    {
        var supplier = await _db.Suppliers.FindAsync(id);
        if (supplier == null)
        {
            return NotFound(ApiResponse.Fail($"Supplier '{id}' not found."));
        }

        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? string.Empty;

        var purchases = await _db.PurchaseOrders
            .Where(p => p.HotelId == hotelId && p.SupplierId == id && p.DueAmount > 0 && p.Status != "CANCELLED")
            .OrderBy(p => p.OrderedAt)
            .ToListAsync();

        var now = DateTime.UtcNow;
        var result = purchases.Select(p =>
        {
            var isOverdue = p.DueDate.HasValue && now > p.DueDate.Value;
            var daysOverdue = isOverdue ? (now - p.DueDate!.Value).Days : 0;

            return new
            {
                id = p.Id,
                purchaseNumber = p.PoNumber,
                supplierInvoiceNumber = p.InvoiceNumber,
                purchaseDate = p.OrderedAt.ToString("yyyy-MM-dd"),
                dueDate = p.DueDate?.ToString("yyyy-MM-dd"),
                isOverdue,
                daysOverdue,
                grandTotal = p.TotalAmount,
                paidAmount = p.PaidAmount,
                dueAmount = p.DueAmount,
                branchOrOutlet = p.BranchOrOutlet,
                status = p.Status,
                paymentStatus = p.PaymentStatus
            };
        });

        return Ok(ApiResponse.Ok(result));
    }

    public record SupplierPaymentAllocationDto(
        string PurchaseOrderId,
        double Amount
    );

    public record RecordSupplierPaymentRequest(
        double Amount,
        string PaymentMode, // Cash, Bank, QR, Card, Cheque
        string? PaymentDate,
        string? ReferenceNumber,
        string? Notes,
        string? VoucherNumber,
        string? BranchOrOutlet,
        string? PaidBy,
        List<SupplierPaymentAllocationDto>? Allocations
    );

    [HttpPost("{id}/payments")]
    public async Task<IActionResult> RecordSupplierPayment(string id, [FromBody] RecordSupplierPaymentRequest req)
    {
        var supplier = await _db.Suppliers.FindAsync(id);
        if (supplier == null)
        {
            return NotFound(ApiResponse.Fail($"Supplier '{id}' not found."));
        }

        if (req.Amount <= 0)
        {
            return BadRequest(ApiResponse.Fail("Payment amount must be greater than zero."));
        }

        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? string.Empty;

        using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            double totalAllocated = 0;
            var processedAllocations = new List<object>();

            if (req.Allocations != null && req.Allocations.Count > 0)
            {
                totalAllocated = req.Allocations.Sum(a => a.Amount);
                if (totalAllocated > req.Amount + 0.01)
                {
                    return BadRequest(ApiResponse.Fail($"Total allocated amount ({totalAllocated:N2}) exceeds payment amount ({req.Amount:N2})."));
                }

                foreach (var alloc in req.Allocations.Where(a => a.Amount > 0))
                {
                    var po = await _db.PurchaseOrders.FirstOrDefaultAsync(p => p.Id == alloc.PurchaseOrderId && p.SupplierId == id);
                    if (po == null) continue;

                    if (alloc.Amount > po.DueAmount + 0.01)
                    {
                        return BadRequest(ApiResponse.Fail($"Allocated amount {alloc.Amount:N2} exceeds outstanding invoice due {po.DueAmount:N2} for purchase {po.PoNumber}."));
                    }

                    po.PaidAmount = Math.Round(po.PaidAmount + alloc.Amount, 2);
                    po.DueAmount = Math.Max(0, Math.Round(po.TotalAmount - po.PaidAmount, 2));
                    po.PaymentStatus = po.DueAmount <= 0.01 ? "PAID" : "PARTIAL";

                    // Append payment record to PaymentsJson
                    var paymentRecord = new
                    {
                        paymentId = Guid.NewGuid().ToString("N"),
                        amount = alloc.Amount,
                        paymentMethod = req.PaymentMode,
                        paymentDate = req.PaymentDate ?? DateTime.UtcNow.ToString("yyyy-MM-dd"),
                        referenceNumber = req.ReferenceNumber,
                        paidBy = req.PaidBy ?? "Accounts Cashier",
                        notes = req.Notes
                    };

                    List<object> paymentsList = new();
                    if (!string.IsNullOrWhiteSpace(po.PaymentsJson))
                    {
                        try { paymentsList = JsonSerializer.Deserialize<List<object>>(po.PaymentsJson) ?? new(); } catch { }
                    }
                    paymentsList.Add(paymentRecord);
                    po.PaymentsJson = JsonSerializer.Serialize(paymentsList);

                    processedAllocations.Add(new
                    {
                        purchaseOrderId = po.Id,
                        purchaseNumber = po.PoNumber,
                        allocatedAmount = alloc.Amount
                    });
                }
            }

            // Unallocated portion becomes Supplier Advance
            double advancePortion = Math.Max(0, Math.Round(req.Amount - totalAllocated, 2));
            if (advancePortion > 0)
            {
                supplier.AdvanceBalance = Math.Round(supplier.AdvanceBalance + advancePortion, 2);
            }

            // Determine latest running balance
            var latestEntry = await _db.SupplierLedgers
                .Where(e => e.HotelId == hotelId && e.SupplierId == id)
                .OrderByDescending(e => e.EntryDate)
                .ThenByDescending(e => e.CreatedAt)
                .FirstOrDefaultAsync();

            var priorBal = latestEntry?.Balance ?? supplier.OpeningBalance;
            var newBal = Math.Round(priorBal - req.Amount, 2);

            var payDate = string.IsNullOrWhiteSpace(req.PaymentDate)
                ? DateTime.UtcNow
                : DateTime.Parse(req.PaymentDate).ToUniversalTime();

            var voucherNo = !string.IsNullOrWhiteSpace(req.VoucherNumber)
                ? req.VoucherNumber.Trim()
                : $"PV-{DateTime.UtcNow.Year}-{new Random().Next(1000, 9999)}";

            var ledgerEntry = new SupplierLedgerEntry
            {
                HotelId = hotelId,
                SupplierId = id,
                EntryDate = payDate,
                TransactionNumber = voucherNo,
                Description = string.IsNullOrWhiteSpace(req.Notes)
                    ? $"Payment to {supplier.Name} ({req.PaymentMode})"
                    : req.Notes,
                DebitAmount = req.Amount,
                CreditAmount = 0,
                Balance = newBal,
                ReferenceType = totalAllocated > 0 ? "PAYMENT" : "SUPPLIER_ADVANCE",
                ReferenceId = voucherNo,
                PaymentMode = req.PaymentMode,
                BranchOrOutlet = req.BranchOrOutlet ?? "Main Kitchen",
                AllocationsJson = JsonSerializer.Serialize(processedAllocations),
                Notes = req.Notes,
                CreatedBy = req.PaidBy ?? "Accounts Cashier",
                CreatedAt = DateTime.UtcNow
            };

            // Post balanced GL Journal Entry
            var apAccount = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "2010");
            var cashOrBankAccount = req.PaymentMode.ToUpper() == "BANK"
                ? await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "1050")
                : await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "1020");

            var advanceAssetAccount = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "1105")
                ?? await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "1100");

            if (apAccount != null && cashOrBankAccount != null)
            {
                var journalLines = new List<JournalEntryLine>();

                if (totalAllocated > 0)
                {
                    journalLines.Add(new JournalEntryLine
                    {
                        AccountId = apAccount.Id,
                        Debit = totalAllocated,
                        Credit = 0,
                        LineDescription = $"AP Reduced - Payment to {supplier.Name} ({voucherNo})"
                    });
                }

                if (advancePortion > 0 && advanceAssetAccount != null)
                {
                    journalLines.Add(new JournalEntryLine
                    {
                        AccountId = advanceAssetAccount.Id,
                        Debit = advancePortion,
                        Credit = 0,
                        LineDescription = $"Supplier Advance Asset - {supplier.Name} ({voucherNo})"
                    });
                }

                journalLines.Add(new JournalEntryLine
                {
                    AccountId = cashOrBankAccount.Id,
                    Debit = 0,
                    Credit = req.Amount,
                    LineDescription = $"Payment Disbursed - {supplier.Name} ({req.PaymentMode})"
                });

                var countJournals = await _db.JournalEntries.CountAsync();
                var journal = new JournalEntry
                {
                    HotelId = hotelId,
                    EntryNumber = $"JE-{DateTime.UtcNow.Year}-{(countJournals + 1001)}",
                    EntryDate = payDate,
                    Description = $"Supplier Payment - {supplier.Name} ({voucherNo})",
                    SourceModule = "SUPPLIER_LEDGER",
                    SourceTransactionId = ledgerEntry.Id,
                    Status = "POSTED",
                    TotalDebit = req.Amount,
                    TotalCredit = req.Amount,
                    CreatedBy = req.PaidBy ?? "Accounts Cashier",
                    Lines = journalLines
                };

                _db.JournalEntries.Add(journal);
                ledgerEntry.JournalEntryId = journal.Id;
            }

            _db.SupplierLedgers.Add(ledgerEntry);
            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            return Ok(ApiResponse.Ok(new
            {
                ledgerEntryId = ledgerEntry.Id,
                transactionNumber = voucherNo,
                totalPaid = req.Amount,
                allocatedAmount = totalAllocated,
                advancePortion = advancePortion,
                newBalance = newBal
            }, $"Payment of Rs. {req.Amount:N2} posted successfully for {supplier.Name}."));
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            return StatusCode(500, ApiResponse.Fail($"Failed to record supplier payment: {ex.Message}"));
        }
    }

    public record RecordSupplierAdvanceRequest(
        double Amount,
        string PaymentMode,
        string? PaymentDate,
        string? ReferenceNumber,
        string? Notes,
        string? BranchOrOutlet,
        string? PaidBy
    );

    [HttpPost("{id}/advances")]
    public async Task<IActionResult> RecordSupplierAdvance(string id, [FromBody] RecordSupplierAdvanceRequest req)
    {
        var supplier = await _db.Suppliers.FindAsync(id);
        if (supplier == null)
        {
            return NotFound(ApiResponse.Fail($"Supplier '{id}' not found."));
        }

        if (req.Amount <= 0)
        {
            return BadRequest(ApiResponse.Fail("Advance amount must be greater than zero."));
        }

        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? string.Empty;

        using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            supplier.AdvanceBalance = Math.Round(supplier.AdvanceBalance + req.Amount, 2);

            var latestEntry = await _db.SupplierLedgers
                .Where(e => e.HotelId == hotelId && e.SupplierId == id)
                .OrderByDescending(e => e.EntryDate)
                .ThenByDescending(e => e.CreatedAt)
                .FirstOrDefaultAsync();

            var priorBal = latestEntry?.Balance ?? supplier.OpeningBalance;
            var newBal = Math.Round(priorBal - req.Amount, 2);

            var payDate = string.IsNullOrWhiteSpace(req.PaymentDate)
                ? DateTime.UtcNow
                : DateTime.Parse(req.PaymentDate).ToUniversalTime();

            var advNo = $"ADV-{DateTime.UtcNow.Year}-{new Random().Next(1000, 9999)}";

            var entry = new SupplierLedgerEntry
            {
                HotelId = hotelId,
                SupplierId = id,
                EntryDate = payDate,
                TransactionNumber = advNo,
                Description = string.IsNullOrWhiteSpace(req.Notes)
                    ? $"Supplier Advance Paid to {supplier.Name} ({req.PaymentMode})"
                    : req.Notes,
                DebitAmount = req.Amount,
                CreditAmount = 0,
                Balance = newBal,
                ReferenceType = "SUPPLIER_ADVANCE",
                ReferenceId = advNo,
                PaymentMode = req.PaymentMode,
                BranchOrOutlet = req.BranchOrOutlet ?? "Main Kitchen",
                Notes = req.Notes,
                CreatedBy = req.PaidBy ?? "Accounts Cashier",
                CreatedAt = DateTime.UtcNow
            };

            // GL Posting: Debit Supplier Advance Asset (1105), Credit Cash/Bank
            var advAsset = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "1105")
                ?? await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "1100");

            var cashOrBank = req.PaymentMode.ToUpper() == "BANK"
                ? await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "1050")
                : await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "1020");

            if (advAsset != null && cashOrBank != null)
            {
                var countJournals = await _db.JournalEntries.CountAsync();
                var journal = new JournalEntry
                {
                    HotelId = hotelId,
                    EntryNumber = $"JE-{DateTime.UtcNow.Year}-{(countJournals + 1001)}",
                    EntryDate = payDate,
                    Description = $"Supplier Advance Disbursement - {supplier.Name} ({advNo})",
                    SourceModule = "SUPPLIER_ADVANCE",
                    SourceTransactionId = entry.Id,
                    Status = "POSTED",
                    TotalDebit = req.Amount,
                    TotalCredit = req.Amount,
                    CreatedBy = req.PaidBy ?? "Accounts Cashier",
                    Lines = new List<JournalEntryLine>
                    {
                        new JournalEntryLine
                        {
                            AccountId = advAsset.Id,
                            Debit = req.Amount,
                            Credit = 0,
                            LineDescription = $"Advance Prepayment to {supplier.Name} ({advNo})"
                        },
                        new JournalEntryLine
                        {
                            AccountId = cashOrBank.Id,
                            Debit = 0,
                            Credit = req.Amount,
                            LineDescription = $"Cash/Bank Disbursed for Advance ({req.PaymentMode})"
                        }
                    }
                };

                _db.JournalEntries.Add(journal);
                entry.JournalEntryId = journal.Id;
            }

            _db.SupplierLedgers.Add(entry);
            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            return Ok(ApiResponse.Ok(new
            {
                advanceReceiptNumber = advNo,
                amount = req.Amount,
                totalAdvanceBalance = supplier.AdvanceBalance
            }, $"Advance of Rs. {req.Amount:N2} recorded for {supplier.Name}."));
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            return StatusCode(500, ApiResponse.Fail($"Failed to record supplier advance: {ex.Message}"));
        }
    }

    public record AllocateSupplierAdvanceRequest(
        List<SupplierPaymentAllocationDto> Allocations,
        string? Notes,
        string? AuthorizedBy
    );

    [HttpPost("{id}/advances/allocate")]
    public async Task<IActionResult> AllocateSupplierAdvance(string id, [FromBody] AllocateSupplierAdvanceRequest req)
    {
        var supplier = await _db.Suppliers.FindAsync(id);
        if (supplier == null)
        {
            return NotFound(ApiResponse.Fail($"Supplier '{id}' not found."));
        }

        if (req.Allocations == null || req.Allocations.Count == 0)
        {
            return BadRequest(ApiResponse.Fail("Please select at least one purchase invoice to allocate advance."));
        }

        var totalAllocated = req.Allocations.Sum(a => a.Amount);
        if (totalAllocated <= 0)
        {
            return BadRequest(ApiResponse.Fail("Total allocated amount must be greater than zero."));
        }

        if (totalAllocated > supplier.AdvanceBalance + 0.01)
        {
            return BadRequest(ApiResponse.Fail($"Allocation amount ({totalAllocated:N2}) exceeds available advance balance ({supplier.AdvanceBalance:N2})."));
        }

        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? string.Empty;

        using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            var processedAllocations = new List<object>();

            foreach (var alloc in req.Allocations.Where(a => a.Amount > 0))
            {
                var po = await _db.PurchaseOrders.FirstOrDefaultAsync(p => p.Id == alloc.PurchaseOrderId && p.SupplierId == id);
                if (po == null) continue;

                if (alloc.Amount > po.DueAmount + 0.01)
                {
                    return BadRequest(ApiResponse.Fail($"Allocated amount {alloc.Amount:N2} exceeds invoice balance {po.DueAmount:N2} for purchase {po.PoNumber}."));
                }

                po.PaidAmount = Math.Round(po.PaidAmount + alloc.Amount, 2);
                po.DueAmount = Math.Max(0, Math.Round(po.TotalAmount - po.PaidAmount, 2));
                po.PaymentStatus = po.DueAmount <= 0.01 ? "PAID" : "PARTIAL";

                var allocRecord = new
                {
                    paymentId = Guid.NewGuid().ToString("N"),
                    amount = alloc.Amount,
                    paymentMethod = "SUPPLIER_ADVANCE",
                    paymentDate = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                    referenceNumber = "ADV-ALLOC",
                    paidBy = req.AuthorizedBy ?? "Store Incharge",
                    notes = req.Notes
                };

                List<object> paymentsList = new();
                if (!string.IsNullOrWhiteSpace(po.PaymentsJson))
                {
                    try { paymentsList = JsonSerializer.Deserialize<List<object>>(po.PaymentsJson) ?? new(); } catch { }
                }
                paymentsList.Add(allocRecord);
                po.PaymentsJson = JsonSerializer.Serialize(paymentsList);

                processedAllocations.Add(new
                {
                    purchaseOrderId = po.Id,
                    purchaseNumber = po.PoNumber,
                    allocatedAmount = alloc.Amount
                });
            }

            supplier.AdvanceBalance = Math.Max(0, Math.Round(supplier.AdvanceBalance - totalAllocated, 2));

            // Record Advance Allocation entry in ledger
            var latestEntry = await _db.SupplierLedgers
                .Where(e => e.HotelId == hotelId && e.SupplierId == id)
                .OrderByDescending(e => e.EntryDate)
                .ThenByDescending(e => e.CreatedAt)
                .FirstOrDefaultAsync();

            var currentBal = latestEntry?.Balance ?? supplier.OpeningBalance;

            var allocNumber = $"ALLOC-{DateTime.UtcNow.Year}-{new Random().Next(1000, 9999)}";

            var entry = new SupplierLedgerEntry
            {
                HotelId = hotelId,
                SupplierId = id,
                EntryDate = DateTime.UtcNow,
                TransactionNumber = allocNumber,
                Description = string.IsNullOrWhiteSpace(req.Notes)
                    ? $"Advance Balance Allocated against {processedAllocations.Count} purchase invoice(s)"
                    : req.Notes,
                DebitAmount = totalAllocated,
                CreditAmount = 0,
                Balance = Math.Round(currentBal - totalAllocated, 2),
                ReferenceType = "ADVANCE_ALLOCATION",
                ReferenceId = allocNumber,
                PaymentMode = "ADVANCE",
                BranchOrOutlet = "Main Kitchen",
                AllocationsJson = JsonSerializer.Serialize(processedAllocations),
                Notes = req.Notes,
                CreatedBy = req.AuthorizedBy ?? "Store Incharge",
                CreatedAt = DateTime.UtcNow
            };

            // GL Posting: Debit Accounts Payable (2010), Credit Supplier Advance Asset (1105)
            var apAccount = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "2010");
            var advAsset = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "1105")
                ?? await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "1100");

            if (apAccount != null && advAsset != null)
            {
                var countJournals = await _db.JournalEntries.CountAsync();
                var journal = new JournalEntry
                {
                    HotelId = hotelId,
                    EntryNumber = $"JE-{DateTime.UtcNow.Year}-{(countJournals + 1001)}",
                    EntryDate = DateTime.UtcNow,
                    Description = $"Advance Allocation to AP - {supplier.Name} ({allocNumber})",
                    SourceModule = "ADVANCE_ALLOCATION",
                    SourceTransactionId = entry.Id,
                    Status = "POSTED",
                    TotalDebit = totalAllocated,
                    TotalCredit = totalAllocated,
                    CreatedBy = req.AuthorizedBy ?? "Store Incharge",
                    Lines = new List<JournalEntryLine>
                    {
                        new JournalEntryLine
                        {
                            AccountId = apAccount.Id,
                            Debit = totalAllocated,
                            Credit = 0,
                            LineDescription = $"AP Reduced by Advance Allocation ({allocNumber})"
                        },
                        new JournalEntryLine
                        {
                            AccountId = advAsset.Id,
                            Debit = 0,
                            Credit = totalAllocated,
                            LineDescription = $"Advance Prepayment Asset Utilized ({allocNumber})"
                        }
                    }
                };

                _db.JournalEntries.Add(journal);
                entry.JournalEntryId = journal.Id;
            }

            _db.SupplierLedgers.Add(entry);
            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            return Ok(ApiResponse.Ok(new
            {
                allocationNumber = allocNumber,
                allocatedAmount = totalAllocated,
                remainingAdvance = supplier.AdvanceBalance
            }, $"Advance of Rs. {totalAllocated:N2} allocated successfully. Remaining advance: Rs. {supplier.AdvanceBalance:N2}."));
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            return StatusCode(500, ApiResponse.Fail($"Failed to allocate advance: {ex.Message}"));
        }
    }

    public record CreateSupplierAdjustmentRequest(
        string AdjustmentType, // DEBIT or CREDIT
        double Amount,
        string Reason,
        string? ReferenceNumber,
        string? ApprovedBy
    );

    [HttpPost("{id}/adjustments")]
    public async Task<IActionResult> CreateSupplierAdjustment(string id, [FromBody] CreateSupplierAdjustmentRequest req)
    {
        var supplier = await _db.Suppliers.FindAsync(id);
        if (supplier == null)
        {
            return NotFound(ApiResponse.Fail($"Supplier '{id}' not found."));
        }

        if (req.Amount <= 0)
        {
            return BadRequest(ApiResponse.Fail("Adjustment amount must be greater than zero."));
        }

        if (string.IsNullOrWhiteSpace(req.Reason))
        {
            return BadRequest(ApiResponse.Fail("Adjustment reason is mandatory."));
        }

        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? string.Empty;

        var isDebit = req.AdjustmentType.ToUpper() == "DEBIT";

        var latestEntry = await _db.SupplierLedgers
            .Where(e => e.HotelId == hotelId && e.SupplierId == id)
            .OrderByDescending(e => e.EntryDate)
            .ThenByDescending(e => e.CreatedAt)
            .FirstOrDefaultAsync();

        var priorBal = latestEntry?.Balance ?? supplier.OpeningBalance;
        var newBal = isDebit
            ? Math.Round(priorBal - req.Amount, 2)
            : Math.Round(priorBal + req.Amount, 2);

        var adjNumber = $"ADJ-{DateTime.UtcNow.Year}-{new Random().Next(1000, 9999)}";

        var entry = new SupplierLedgerEntry
        {
            HotelId = hotelId,
            SupplierId = id,
            EntryDate = DateTime.UtcNow,
            TransactionNumber = adjNumber,
            Description = $"Account Adjustment ({req.AdjustmentType}): {req.Reason}",
            DebitAmount = isDebit ? req.Amount : 0,
            CreditAmount = isDebit ? 0 : req.Amount,
            Balance = newBal,
            ReferenceType = "ACCOUNT_ADJUSTMENT",
            ReferenceId = req.ReferenceNumber ?? adjNumber,
            PaymentMode = "ADJUSTMENT",
            BranchOrOutlet = "Main Kitchen",
            Notes = req.Reason,
            CreatedBy = req.ApprovedBy ?? "Accounting Manager",
            CreatedAt = DateTime.UtcNow
        };

        // Post balanced GL Journal Entry
        var apAccount = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "2010");
        var expenseAccount = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "5200")
            ?? await _db.Accounts.FirstOrDefaultAsync(a => a.AccountType == "EXPENSE");

        if (apAccount != null && expenseAccount != null)
        {
            var countJournals = await _db.JournalEntries.CountAsync();
            var journal = new JournalEntry
            {
                HotelId = hotelId,
                EntryNumber = $"JE-{DateTime.UtcNow.Year}-{(countJournals + 1001)}",
                EntryDate = DateTime.UtcNow,
                Description = $"Supplier Adjustment ({req.AdjustmentType}) - {supplier.Name} ({adjNumber})",
                SourceModule = "SUPPLIER_ADJUSTMENT",
                SourceTransactionId = entry.Id,
                Status = "POSTED",
                TotalDebit = req.Amount,
                TotalCredit = req.Amount,
                CreatedBy = req.ApprovedBy ?? "Accounting Manager",
                Lines = isDebit
                    ? new List<JournalEntryLine>
                    {
                        new JournalEntryLine { AccountId = apAccount.Id, Debit = req.Amount, Credit = 0, LineDescription = $"AP Reduced - Adjustment {adjNumber}" },
                        new JournalEntryLine { AccountId = expenseAccount.Id, Debit = 0, Credit = req.Amount, LineDescription = $"Adjustment Credit to Expense/Income - {req.Reason}" }
                    }
                    : new List<JournalEntryLine>
                    {
                        new JournalEntryLine { AccountId = expenseAccount.Id, Debit = req.Amount, Credit = 0, LineDescription = $"Expense Debit for Supplier Adjustment - {req.Reason}" },
                        new JournalEntryLine { AccountId = apAccount.Id, Debit = 0, Credit = req.Amount, LineDescription = $"AP Increased - Adjustment {adjNumber}" }
                    }
            };

            _db.JournalEntries.Add(journal);
            entry.JournalEntryId = journal.Id;
        }

        _db.SupplierLedgers.Add(entry);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            adjustmentNumber = adjNumber,
            adjustmentType = req.AdjustmentType,
            amount = req.Amount,
            newBalance = newBal
        }, $"Adjustment of Rs. {req.Amount:N2} posted for {supplier.Name}. New balance: Rs. {newBal:N2}."));
    }

    [HttpGet("{id}/aging")]
    public async Task<IActionResult> GetSupplierAging(string id)
    {
        var supplier = await _db.Suppliers.FindAsync(id);
        if (supplier == null)
        {
            return NotFound(ApiResponse.Fail($"Supplier '{id}' not found."));
        }

        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? string.Empty;

        var purchases = await _db.PurchaseOrders
            .Where(p => p.HotelId == hotelId && p.SupplierId == id && p.DueAmount > 0 && p.Status != "CANCELLED")
            .OrderBy(p => p.OrderedAt)
            .ToListAsync();

        var now = DateTime.UtcNow;

        double currentNotDue = 0;
        double overdue1to30 = 0;
        double overdue31to60 = 0;
        double overdue61to90 = 0;
        double overdueAbove90 = 0;

        var detailedInvoices = new List<object>();

        foreach (var p in purchases)
        {
            var dueDate = p.DueDate ?? p.OrderedAt.AddDays(supplier.PaymentTermsDays > 0 ? supplier.PaymentTermsDays : 30);
            var isOverdue = now > dueDate;
            var daysOverdue = isOverdue ? (now - dueDate).Days : 0;

            if (!isOverdue)
            {
                currentNotDue += p.DueAmount;
            }
            else if (daysOverdue <= 30)
            {
                overdue1to30 += p.DueAmount;
            }
            else if (daysOverdue <= 60)
            {
                overdue31to60 += p.DueAmount;
            }
            else if (daysOverdue <= 90)
            {
                overdue61to90 += p.DueAmount;
            }
            else
            {
                overdueAbove90 += p.DueAmount;
            }

            detailedInvoices.Add(new
            {
                id = p.Id,
                purchaseNumber = p.PoNumber,
                supplierInvoiceNumber = p.InvoiceNumber,
                purchaseDate = p.OrderedAt.ToString("yyyy-MM-dd"),
                dueDate = dueDate.ToString("yyyy-MM-dd"),
                grandTotal = p.TotalAmount,
                paidAmount = p.PaidAmount,
                dueAmount = p.DueAmount,
                isOverdue,
                daysOverdue
            });
        }

        var totalOutstanding = purchases.Sum(p => p.DueAmount);
        var totalOverdue = overdue1to30 + overdue31to60 + overdue61to90 + overdueAbove90;

        return Ok(ApiResponse.Ok(new
        {
            supplierId = supplier.Id,
            supplierName = supplier.Name,
            supplierCode = supplier.Code,
            currentNotDue = Math.Round(currentNotDue, 2),
            overdue1to30 = Math.Round(overdue1to30, 2),
            overdue31to60 = Math.Round(overdue31to60, 2),
            overdue61to90 = Math.Round(overdue61to90, 2),
            overdueAbove90 = Math.Round(overdueAbove90, 2),
            totalOutstanding = Math.Round(totalOutstanding, 2),
            totalOverdue = Math.Round(totalOverdue, 2),
            invoices = detailedInvoices
        }));
    }

    [HttpGet("{id}/statement")]
    public async Task<IActionResult> GetSupplierStatement(
        string id,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate
    )
    {
        var supplier = await _db.Suppliers.FindAsync(id);
        if (supplier == null)
        {
            return NotFound(ApiResponse.Fail($"Supplier '{id}' not found."));
        }

        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? string.Empty;

        double periodOpeningBalance = supplier.OpeningBalance;
        if (startDate.HasValue)
        {
            var startUtc = DateTime.SpecifyKind(startDate.Value.Date, DateTimeKind.Utc);
            var priorCredits = await _db.SupplierLedgers
                .Where(l => l.HotelId == hotelId && l.SupplierId == id && l.EntryDate < startUtc && l.ReferenceType != "OPENING_BALANCE")
                .SumAsync(l => l.CreditAmount);

            var priorDebits = await _db.SupplierLedgers
                .Where(l => l.HotelId == hotelId && l.SupplierId == id && l.EntryDate < startUtc)
                .SumAsync(l => l.DebitAmount);

            periodOpeningBalance = Math.Round(supplier.OpeningBalance + priorCredits - priorDebits, 2);
        }

        var query = _db.SupplierLedgers
            .Include(l => l.PurchaseOrder)
            .Where(l => l.HotelId == hotelId && l.SupplierId == id);

        if (startDate.HasValue)
        {
            var startUtc = DateTime.SpecifyKind(startDate.Value.Date, DateTimeKind.Utc);
            query = query.Where(l => l.EntryDate >= startUtc);
        }

        if (endDate.HasValue)
        {
            var endUtc = DateTime.SpecifyKind(endDate.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
            query = query.Where(l => l.EntryDate <= endUtc);
        }

        var rawEntries = await query
            .OrderBy(l => l.EntryDate)
            .ThenBy(l => l.CreatedAt)
            .ToListAsync();

        double currentRunning = periodOpeningBalance;
        var statementRows = new List<object>();

        foreach (var e in rawEntries)
        {
            if (e.ReferenceType == "OPENING_BALANCE" && startDate.HasValue) continue;

            currentRunning = Math.Round(currentRunning + e.CreditAmount - e.DebitAmount, 2);

            statementRows.Add(new
            {
                date = e.EntryDate.ToString("yyyy-MM-dd"),
                referenceNumber = e.TransactionNumber ?? e.ReferenceId ?? "-",
                referenceType = e.ReferenceType,
                description = e.Description,
                purchaseInvoiceNumber = e.PurchaseInvoiceNumber ?? e.PurchaseOrder?.InvoiceNumber,
                debit = e.DebitAmount,
                credit = e.CreditAmount,
                runningBalance = currentRunning
            });
        }

        var unpaidPurchases = await _db.PurchaseOrders
            .Where(p => p.HotelId == hotelId && p.SupplierId == id && p.DueAmount > 0 && p.Status != "CANCELLED")
            .OrderBy(p => p.OrderedAt)
            .Select(p => new
            {
                id = p.Id,
                purchaseNumber = p.PoNumber,
                invoiceNumber = p.InvoiceNumber,
                purchaseDate = p.OrderedAt.ToString("yyyy-MM-dd"),
                dueDate = p.DueDate.HasValue ? p.DueDate.Value.ToString("yyyy-MM-dd") : "-",
                grandTotal = p.TotalAmount,
                paidAmount = p.PaidAmount,
                dueAmount = p.DueAmount
            })
            .ToListAsync();

        return Ok(ApiResponse.Ok(new
        {
            restaurantName = "Everest Family Restaurant & Hotel",
            restaurantAddress = "Main Road, Lakeside, Pokhara, Nepal",
            restaurantPan = "601234567",
            restaurantPhone = "+977-61-520000",
            statementNumber = $"STMT-{supplier.Code}-{DateTime.UtcNow:yyyyMMdd}",
            statementDate = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            startDate = startDate?.ToString("yyyy-MM-dd") ?? "All Time",
            endDate = endDate?.ToString("yyyy-MM-dd") ?? DateTime.UtcNow.ToString("yyyy-MM-dd"),
            supplier = new
            {
                name = supplier.Name,
                code = supplier.Code,
                contactPerson = supplier.ContactPerson,
                phone = supplier.Phone,
                email = supplier.Email,
                address = supplier.Address,
                panVatNumber = supplier.PanVatNumber,
                advanceBalance = supplier.AdvanceBalance
            },
            openingBalance = periodOpeningBalance,
            closingBalance = currentRunning,
            totalPurchases = Math.Round(rawEntries.Sum(e => e.CreditAmount), 2),
            totalPayments = Math.Round(rawEntries.Sum(e => e.DebitAmount), 2),
            transactions = statementRows,
            outstandingInvoices = unpaidPurchases
        }));
    }

    // =========================================================================
    // PAYABLES REPORTS (BACKWARD COMPATIBILITY)
    // =========================================================================

    [HttpGet("payables/outstanding")]
    public async Task<IActionResult> GetPayablesOutstanding()
    {
        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? string.Empty;

        var suppliers = await _db.Suppliers
            .Where(s => s.HotelId == hotelId)
            .ToListAsync();

        var now = DateTime.UtcNow;
        var report = new List<object>();

        foreach (var s in suppliers)
        {
            var latestEntry = await _db.SupplierLedgers
                .Where(e => e.HotelId == hotelId && e.SupplierId == s.Id)
                .OrderByDescending(e => e.EntryDate)
                .ThenByDescending(e => e.CreatedAt)
                .FirstOrDefaultAsync();

            var balance = latestEntry?.Balance ?? s.OpeningBalance;
            if (balance <= 0) continue;

            var dueDate = latestEntry?.DueDate;
            var isOverdue = dueDate.HasValue && now > dueDate.Value;

            report.Add(new
            {
                supplierId = s.Id,
                supplierName = s.Name,
                supplierCode = s.Code,
                outstandingBalance = balance,
                creditLimit = s.CreditLimit,
                paymentTermsDays = s.PaymentTermsDays,
                dueDate = dueDate?.ToString("yyyy-MM-dd"),
                isOverdue,
                daysOverdue = dueDate.HasValue && now > dueDate.Value
                    ? (now - dueDate.Value).Days
                    : 0
            });
        }

        var totalOutstanding = report.Sum(r => (double)((dynamic)r).outstandingBalance);

        return Ok(ApiResponse.Ok(new
        {
            totalOutstanding,
            supplierCount = report.Count,
            overdueCount = report.Count(r => ((dynamic)r).isOverdue),
            suppliers = report.OrderByDescending(r => ((dynamic)r).outstandingBalance)
        }));
    }

    [HttpGet("payables/ageing")]
    public async Task<IActionResult> GetPayablesAgeing()
    {
        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? string.Empty;

        var now = DateTime.UtcNow;
        var suppliers = await _db.Suppliers
            .Where(s => s.HotelId == hotelId)
            .ToListAsync();

        var ageing0to30 = 0.0;
        var ageing31to60 = 0.0;
        var ageing60plus = 0.0;
        var notDue = 0.0;

        foreach (var s in suppliers)
        {
            var latestEntry = await _db.SupplierLedgers
                .Where(e => e.HotelId == hotelId && e.SupplierId == s.Id)
                .OrderByDescending(e => e.EntryDate)
                .ThenByDescending(e => e.CreatedAt)
                .FirstOrDefaultAsync();

            var balance = latestEntry?.Balance ?? s.OpeningBalance;
            if (balance <= 0) continue;

            var dueDate = latestEntry?.DueDate;
            if (!dueDate.HasValue)
            {
                notDue += balance;
                continue;
            }

            var days = (now - dueDate.Value).Days;
            if (days <= 0)
                notDue += balance;
            else if (days <= 30)
                ageing0to30 += balance;
            else if (days <= 60)
                ageing31to60 += balance;
            else
                ageing60plus += balance;
        }

        return Ok(ApiResponse.Ok(new
        {
            notDue,
            ageing0to30,
            ageing31to60,
            ageing60plus,
            totalOverdue = ageing0to30 + ageing31to60 + ageing60plus
        }));
    }

    [HttpGet("payables/due-soon")]
    public async Task<IActionResult> GetPayablesDueSoon([FromQuery] int days = 7)
    {
        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? string.Empty;

        var now = DateTime.UtcNow;
        var cutoff = now.AddDays(days);

        var suppliers = await _db.Suppliers
            .Where(s => s.HotelId == hotelId)
            .ToListAsync();

        var dueSoon = new List<object>();

        foreach (var s in suppliers)
        {
            var latestEntry = await _db.SupplierLedgers
                .Where(e => e.HotelId == hotelId && e.SupplierId == s.Id)
                .OrderByDescending(e => e.EntryDate)
                .ThenByDescending(e => e.CreatedAt)
                .FirstOrDefaultAsync();

            var balance = latestEntry?.Balance ?? s.OpeningBalance;
            if (balance <= 0) continue;

            var dueDate = latestEntry?.DueDate;
            if (!dueDate.HasValue || now > dueDate.Value) continue;
            if (dueDate.Value > cutoff) continue;

            dueSoon.Add(new
            {
                supplierId = s.Id,
                supplierName = s.Name,
                supplierCode = s.Code,
                outstandingBalance = balance,
                dueDate = dueDate.Value.ToString("yyyy-MM-dd"),
                daysUntilDue = (dueDate.Value - now).Days
            });
        }

        return Ok(ApiResponse.Ok(new
        {
            windowDays = days,
            count = dueSoon.Count,
            suppliers = dueSoon.OrderBy(s => ((dynamic)s).dueDate)
        }));
    }
}

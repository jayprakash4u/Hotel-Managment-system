using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

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

        return Ok(ApiResponse.Ok(suppliers));
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

        return Ok(ApiResponse.Ok(supplier));
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
            Notes = req.Notes?.Trim(),
            IsActive = req.IsActive ?? true,
            CreditLimit = req.CreditLimit ?? 0,
            PaymentTermsDays = req.PaymentTermsDays ?? 0,
            OpeningBalance = req.OpeningBalance ?? 0,
            CreatedAt = DateTime.UtcNow
        };

        _db.Suppliers.Add(supplier);
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

    // ===================== SUPPLIER LEDGER =====================

    public record SupplierLedgerEntryDto(
        string Id,
        string EntryDate,
        string? PurchaseOrderId,
        string? PurchaseOrderNumber,
        string Description,
        double CreditAmount,
        double DebitAmount,
        double Balance,
        string? DueDate,
        string ReferenceType,
        string? ReferenceId,
        string? PaymentMode,
        string Status
    );

    [HttpGet("{id}/ledger")]
    public async Task<IActionResult> GetSupplierLedger(string id)
    {
        var supplier = await _db.Suppliers.FindAsync(id);
        if (supplier == null)
        {
            return NotFound(ApiResponse.Fail($"Supplier '{id}' not found."));
        }

        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? string.Empty;

        var entries = await _db.SupplierLedgers
            .Include(e => e.PurchaseOrder)
            .Where(e => e.HotelId == hotelId && e.SupplierId == id)
            .OrderBy(e => e.EntryDate)
            .ThenBy(e => e.CreatedAt)
            .ToListAsync();

        var now = DateTime.UtcNow;
        var dtos = entries.Select(e =>
        {
            var status = "PAID";
            if (e.Balance > 0)
            {
                if (e.DueDate.HasValue && now > e.DueDate.Value)
                    status = "OVERDUE";
                else if (e.CreditAmount > e.DebitAmount)
                    status = "PARTIAL";
                else
                    status = "UNPAID";
            }

            return new SupplierLedgerEntryDto(
                Id: e.Id,
                EntryDate: e.EntryDate.ToString("yyyy-MM-dd HH:mm"),
                PurchaseOrderId: e.PurchaseOrderId,
                PurchaseOrderNumber: e.PurchaseOrder?.PoNumber,
                Description: e.Description,
                CreditAmount: e.CreditAmount,
                DebitAmount: e.DebitAmount,
                Balance: e.Balance,
                DueDate: e.DueDate?.ToString("yyyy-MM-dd"),
                ReferenceType: e.ReferenceType,
                ReferenceId: e.ReferenceId,
                PaymentMode: e.PaymentMode,
                Status: status
            );
        });

        var lastEntry = entries.LastOrDefault();
        var summary = new
        {
            supplierId = supplier.Id,
            supplierName = supplier.Name,
            totalCredit = entries.Sum(e => e.CreditAmount),
            totalDebit = entries.Sum(e => e.DebitAmount),
            outstandingBalance = lastEntry?.Balance ?? 0,
            creditLimit = supplier.CreditLimit,
            paymentTermsDays = supplier.PaymentTermsDays,
            isOverdue = lastEntry?.Balance > 0 &&
                        lastEntry.DueDate.HasValue &&
                        now > lastEntry.DueDate.Value
        };

        return Ok(ApiResponse.Ok(new { entries = dtos, summary }));
    }

    public record RecordSupplierPaymentDto(
        double Amount,
        string PaymentMode, // Cash, Bank, Card
        string? PaymentDate,
        string? Description,
        string? CreatedBy
    );

    [HttpPost("{id}/ledger/payment")]
    public async Task<IActionResult> RecordSupplierPayment(string id, [FromBody] RecordSupplierPaymentDto req)
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

        // Get the latest balance from the ledger
        var latestEntry = await _db.SupplierLedgers
            .Where(e => e.HotelId == hotelId && e.SupplierId == id)
            .OrderByDescending(e => e.EntryDate)
            .ThenByDescending(e => e.CreatedAt)
            .FirstOrDefaultAsync();

        var currentBalance = latestEntry?.Balance ?? supplier.OpeningBalance;

        var newBalance = currentBalance - req.Amount;
        if (newBalance < 0)
        {
            return BadRequest(ApiResponse.Fail(
                $"Payment amount {req.Amount:N2} exceeds outstanding balance {currentBalance:N2}."
            ));
        }

        var paymentDate = string.IsNullOrWhiteSpace(req.PaymentDate)
            ? DateTime.UtcNow
            : DateTime.Parse(req.PaymentDate).ToUniversalTime();

        var entry = new SupplierLedgerEntry
        {
            HotelId = hotelId,
            SupplierId = id,
            EntryDate = paymentDate,
            Description = req.Description ?? $"Payment to {supplier.Name}",
            DebitAmount = req.Amount,
            CreditAmount = 0,
            Balance = newBalance,
            DueDate = null,
            ReferenceType = "PAYMENT",
            ReferenceId = null,
            PaymentMode = req.PaymentMode,
            CreatedBy = req.CreatedBy ?? "Admin",
            CreatedAt = DateTime.UtcNow
        };

        _db.SupplierLedgers.Add(entry);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(entry, $"Payment of {req.Amount:N2} recorded for {supplier.Name}. New balance: {newBalance:N2}."));
    }

    // ===================== PAYABLES REPORTS =====================

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
                notDue += balance; // not yet due
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
            if (!dueDate.HasValue || now > dueDate.Value) continue; // only upcoming, not overdue
            if (dueDate.Value > cutoff) continue; // beyond the window

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

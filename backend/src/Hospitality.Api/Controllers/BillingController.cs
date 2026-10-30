using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/billing")]
public class BillingController : ControllerBase
{
    private readonly HospitalityDbContext _db;
    private static readonly SemaphoreSlim _billNumberLock = new(1, 1);

    public BillingController(HospitalityDbContext db)
    {
        _db = db;
    }

    public record BillItemDto(
        string? ProductId,
        string Name,
        double UnitPrice,
        int Quantity,
        double Total,
        string? Category,
        string? Notes
    );

    public record BillPaymentRecordDto(
        string Id,
        double Amount,
        string PaymentMethod,
        DateTime PaymentDate,
        string? TransactionRef,
        string? ReceivedBy,
        string? Notes
    );

    public record RecordPaymentRequest(
        double Amount,
        string PaymentMethod, // CASH, CARD, UPI, ROOM_FOLIO, BANK_TRANSFER
        string? TransactionRef,
        string? ReceivedBy,
        string? Notes,
        string? IdempotencyKey
    );

    public record VoidBillRequest(
        string Reason,
        string? AuthorizedBy
    );

    /// <summary>
    /// Concurrency-safe helper to generate permanent sequential Bill Number: e.g. BILL-2026-000001
    /// </summary>
    public static async Task<string> GenerateBillNumberAsync(HospitalityDbContext db, string hotelId)
    {
        await _billNumberLock.WaitAsync();
        try
        {
            var year = DateTime.UtcNow.Year;
            var prefix = $"BILL-{year}-";

            // Find highest bill number for this hotel and year
            var existingBills = await db.Bills
                .Where(b => b.HotelId == hotelId && b.BillNumber.StartsWith(prefix))
                .Select(b => b.BillNumber)
                .ToListAsync();

            int maxSeq = 0;
            foreach (var num in existingBills)
            {
                if (num.Length > prefix.Length && int.TryParse(num.Substring(prefix.Length), out int seq))
                {
                    if (seq > maxSeq) maxSeq = seq;
                }
            }

            int nextSeq = maxSeq + 1;
            return $"{prefix}{nextSeq:D6}";
        }
        finally
        {
            _billNumberLock.Release();
        }
    }

    /// <summary>
    /// Get central bills and invoices list with filtering, searching, and financial summary
    /// </summary>
    [HttpGet("bills")]
    public async Task<IActionResult> GetBills(
        [FromQuery] string? search,
        [FromQuery] string? billingType,
        [FromQuery] string? paymentStatus,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? "";

        var query = _db.Bills.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(hotelId))
        {
            query = query.Where(b => b.HotelId == hotelId);
        }

        // Search query
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(b =>
                b.BillNumber.ToLower().Contains(s) ||
                (b.OrderNumber != null && b.OrderNumber.ToLower().Contains(s)) ||
                (b.BookingCode != null && b.BookingCode.ToLower().Contains(s)) ||
                (b.CustomerName != null && b.CustomerName.ToLower().Contains(s)) ||
                (b.CustomerPhone != null && b.CustomerPhone.ToLower().Contains(s)) ||
                (b.RoomNumber != null && b.RoomNumber.ToLower().Contains(s)) ||
                (b.TableNumber != null && b.TableNumber.ToLower().Contains(s))
            );
        }

        // Billing Type Filter
        if (!string.IsNullOrWhiteSpace(billingType) && billingType.ToUpper() != "ALL")
        {
            var bType = billingType.Trim().ToUpper();
            query = query.Where(b => b.BillingType.ToUpper() == bType);
        }

        // Payment Status Filter
        if (!string.IsNullOrWhiteSpace(paymentStatus) && paymentStatus.ToUpper() != "ALL")
        {
            var pStatus = paymentStatus.Trim().ToUpper();
            query = query.Where(b => b.PaymentStatus.ToUpper() == pStatus);
        }

        // Date Range Filter
        if (startDate.HasValue)
        {
            var startUtc = DateTime.SpecifyKind(startDate.Value.Date, DateTimeKind.Utc);
            query = query.Where(b => b.CreatedAt >= startUtc);
        }

        if (endDate.HasValue)
        {
            var endUtc = DateTime.SpecifyKind(endDate.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
            query = query.Where(b => b.CreatedAt <= endUtc);
        }

        // Summary calculations
        var totalBilled = await query.SumAsync(b => b.GrandTotal);
        var totalPaid = await query.SumAsync(b => b.AmountPaid);
        var totalDue = await query.SumAsync(b => b.BalanceDue);
        var totalItems = await query.CountAsync();

        var safePage = Math.Max(1, page);
        var safePageSize = Math.Clamp(pageSize, 1, 200);

        var bills = await query
            .OrderByDescending(b => b.CreatedAt)
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync();

        return Ok(ApiResponse.Ok(new
        {
            items = bills,
            totalItems,
            page = safePage,
            pageSize = safePageSize,
            totalPages = (int)Math.Ceiling(totalItems / (double)safePageSize),
            summary = new
            {
                totalBilled = Math.Round(totalBilled, 2),
                totalPaid = Math.Round(totalPaid, 2),
                totalDue = Math.Round(totalDue, 2),
                totalBills = totalItems
            }
        }));
    }

    /// <summary>
    /// Get single bill by ID or Bill Number
    /// </summary>
    [HttpGet("bills/{id}")]
    public async Task<IActionResult> GetBillById(string id)
    {
        var bill = await _db.Bills.FirstOrDefaultAsync(b => b.Id == id || b.BillNumber == id);
        if (bill == null)
        {
            return NotFound(ApiResponse.Fail($"Bill '{id}' not found."));
        }

        var hotel = await _db.Hotels.FindAsync(bill.HotelId) ?? await _db.Hotels.FirstOrDefaultAsync();

        return Ok(ApiResponse.Ok(new
        {
            bill,
            hotel = new
            {
                Name = hotel?.Name ?? "Aura Grand Resort & Spa",
                Address = hotel?.Address ?? "Lakeside Boulevard, Pokhara",
                City = "Pokhara",
                Country = "Nepal",
                Phone = "+977-61-460123",
                Email = "billing@auragrand.com",
                TaxId = "PAN-601948203",
                GstVatNumber = "VAT-10928374",
                CurrencySymbol = "Rs."
            }
        }));
    }

    /// <summary>
    /// Record partial or full payment against a bill
    /// </summary>
    [HttpPost("bills/{id}/payments")]
    public async Task<IActionResult> RecordPayment(string id, [FromBody] RecordPaymentRequest req)
    {
        if (req.Amount <= 0)
        {
            return BadRequest(ApiResponse.Fail("Payment amount must be greater than zero."));
        }

        var bill = await _db.Bills.FirstOrDefaultAsync(b => b.Id == id || b.BillNumber == id);
        if (bill == null)
        {
            return NotFound(ApiResponse.Fail($"Bill '{id}' not found."));
        }

        if (bill.PaymentStatus == "VOID")
        {
            return BadRequest(ApiResponse.Fail("Cannot record payment on a voided bill."));
        }

        if (bill.BalanceDue <= 0.01)
        {
            return BadRequest(ApiResponse.Fail("This bill is already fully settled."));
        }

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var paymentRecords = new List<BillPaymentRecordDto>();
            try
            {
                if (!string.IsNullOrWhiteSpace(bill.PaymentsJson))
                {
                    paymentRecords = JsonSerializer.Deserialize<List<BillPaymentRecordDto>>(bill.PaymentsJson) ?? new List<BillPaymentRecordDto>();
                }
            }
            catch
            {
                paymentRecords = new List<BillPaymentRecordDto>();
            }

            // Check duplicate idempotency key
            if (!string.IsNullOrWhiteSpace(req.IdempotencyKey))
            {
                var existing = paymentRecords.FirstOrDefault(p => p.TransactionRef == req.IdempotencyKey);
                if (existing != null)
                {
                    await transaction.RollbackAsync();
                    return Ok(ApiResponse.Ok(bill, "Duplicate payment request ignored (already recorded)."));
                }
            }

            var payAmount = Math.Round(req.Amount, 2);
            var newTotalPaid = Math.Round(bill.AmountPaid + payAmount, 2);
            var newBalanceDue = Math.Max(0, Math.Round(bill.GrandTotal - newTotalPaid, 2));

            var pMethod = string.IsNullOrWhiteSpace(req.PaymentMethod) ? "CASH" : req.PaymentMethod.Trim().ToUpper();

            paymentRecords.Add(new BillPaymentRecordDto(
                Id: $"PAY-{Guid.NewGuid():N}"[..12].ToUpper(),
                Amount: payAmount,
                PaymentMethod: pMethod,
                PaymentDate: DateTime.UtcNow,
                TransactionRef: req.TransactionRef ?? req.IdempotencyKey,
                ReceivedBy: req.ReceivedBy ?? "Cashier",
                Notes: req.Notes
            ));

            bill.AmountPaid = newTotalPaid;
            bill.BalanceDue = newBalanceDue;
            bill.PaymentStatus = newBalanceDue <= 0.01 ? "PAID" : "PARTIAL";
            bill.PaymentMethod = paymentRecords.Count == 1 ? pMethod : "SPLIT";
            bill.PaymentsJson = JsonSerializer.Serialize(paymentRecords);
            bill.UpdatedAt = DateTime.UtcNow;

            // If this bill links to a RestaurantOrder, update order payment state
            if (!string.IsNullOrWhiteSpace(bill.OrderId))
            {
                var order = await _db.RestaurantOrders.FindAsync(bill.OrderId);
                if (order != null)
                {
                    if (bill.PaymentStatus == "PAID")
                    {
                        order.IsPaid = true;
                        order.Status = "COMPLETED";
                        order.PaymentMethod = pMethod;
                    }
                    order.UpdatedAt = DateTime.UtcNow;
                }
            }

            // If this bill links to a Reservation, sync reservation paid amount
            if (!string.IsNullOrWhiteSpace(bill.ReservationId))
            {
                var res = await _db.Reservations.FindAsync(bill.ReservationId);
                if (res != null)
                {
                    res.PaidAmount = Math.Round(res.PaidAmount + payAmount, 2);
                    res.PaymentStatus = bill.PaymentStatus;
                    res.UpdatedAt = DateTime.UtcNow;
                }
            }

            // Update shift CashRegister if open
            var activeRegister = await _db.CashRegisters
                .Where(r => r.Status == "OPEN")
                .OrderByDescending(r => r.OpenedAt)
                .FirstOrDefaultAsync();

            if (activeRegister != null)
            {
                if (pMethod == "CASH")
                {
                    activeRegister.CashSales += payAmount;
                }
                else if (pMethod == "CARD" || pMethod == "UPI")
                {
                    activeRegister.CardSales += payAmount;
                }
            }

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(ApiResponse.Ok(bill, $"Payment of Rs. {payAmount:N2} recorded successfully via {pMethod}."));
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, ApiResponse.Fail($"Failed to record payment: {ex.Message}"));
        }
    }

    /// <summary>
    /// Void an unpaid or disputed bill with audit reason
    /// </summary>
    [HttpPost("bills/{id}/void")]
    public async Task<IActionResult> VoidBill(string id, [FromBody] VoidBillRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Reason))
        {
            return BadRequest(ApiResponse.Fail("A void reason is required for audit compliance."));
        }

        var bill = await _db.Bills.FirstOrDefaultAsync(b => b.Id == id || b.BillNumber == id);
        if (bill == null)
        {
            return NotFound(ApiResponse.Fail($"Bill '{id}' not found."));
        }

        if (bill.PaymentStatus == "VOID")
        {
            return BadRequest(ApiResponse.Fail("Bill is already voided."));
        }

        bill.PaymentStatus = "VOID";
        bill.Notes = $"{bill.Notes} | [VOIDED on {DateTime.UtcNow:yyyy-MM-dd HH:mm} by {req.AuthorizedBy ?? "Admin"}: {req.Reason}]".TrimStart(' ', '|');
        bill.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(bill, $"Bill {bill.BillNumber} has been voided."));
    }
}

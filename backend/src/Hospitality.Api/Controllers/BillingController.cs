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
                else if (pMethod == "CARD" || pMethod == "UPI" || pMethod == "ONLINE" || pMethod == "WALLET")
                {
                    activeRegister.CardSales += payAmount;
                }
            }

            // Sync with Customer & CustomerLedger if this is a credit customer's bill
            Customer? customer = null;
            if (!string.IsNullOrWhiteSpace(bill.CustomerId))
            {
                customer = await _db.Customers.FirstOrDefaultAsync(c => c.Id == bill.CustomerId);
            }
            if (customer == null && !string.IsNullOrWhiteSpace(bill.CustomerPhone))
            {
                customer = await _db.Customers.FirstOrDefaultAsync(c => c.Phone == bill.CustomerPhone.Trim() && c.HotelId == bill.HotelId);
            }

            if (customer != null)
            {
                customer.CurrentOutstanding = Math.Max(0, Math.Round(customer.CurrentOutstanding - payAmount, 2));
                customer.UpdatedAt = DateTime.UtcNow;

                _db.CustomerLedgers.Add(new CustomerLedgerEntry
                {
                    HotelId = bill.HotelId,
                    CustomerId = customer.Id,
                    BillId = bill.Id,
                    PaymentId = req.TransactionRef ?? req.IdempotencyKey,
                    EntryDate = DateTime.UtcNow,
                    Description = $"Payment received against {bill.BillNumber} via {pMethod} {(string.IsNullOrWhiteSpace(req.Notes) ? "" : $"· {req.Notes.Trim()}")}",
                    DebitAmount = 0,
                    CreditAmount = payAmount,
                    Balance = customer.CurrentOutstanding,
                    ReferenceType = "PAYMENT",
                    ReferenceId = bill.BillNumber,
                    PaymentMode = pMethod,
                    CreatedBy = req.ReceivedBy ?? "Cashier",
                    CreatedAt = DateTime.UtcNow
                });
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
    /// Void an unpaid or disputed bill with audit reason and reversal ledger entries
    /// </summary>
    [HttpPost("bills/{id}/void")]
    public async Task<IActionResult> VoidBill(string id, [FromBody] VoidBillRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Reason))
        {
            return BadRequest(ApiResponse.Fail("A void reason is required for audit compliance."));
        }

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var bill = await _db.Bills.FirstOrDefaultAsync(b => b.Id == id || b.BillNumber == id);
            if (bill == null)
            {
                await transaction.RollbackAsync();
                return NotFound(ApiResponse.Fail($"Bill '{id}' not found."));
            }

            if (bill.PaymentStatus == "VOID")
            {
                await transaction.RollbackAsync();
                return BadRequest(ApiResponse.Fail("Bill is already voided."));
            }

            var wasCredit = bill.PaymentMethod == "CREDIT" || bill.PaymentStatus == "CREDIT" || bill.PaymentStatus == "PARTIAL";

            // If it was a credit bill, reverse customer outstanding
            if (wasCredit && !string.IsNullOrWhiteSpace(bill.CustomerId))
            {
                var customer = await _db.Customers.FirstOrDefaultAsync(c => c.Id == bill.CustomerId);
                if (customer != null && bill.BalanceDue > 0)
                {
                    customer.CurrentOutstanding = Math.Max(0, Math.Round(customer.CurrentOutstanding - bill.BalanceDue, 2));
                    customer.UpdatedAt = DateTime.UtcNow;

                    _db.CustomerLedgers.Add(new CustomerLedgerEntry
                    {
                        HotelId = bill.HotelId,
                        CustomerId = customer.Id,
                        BillId = bill.Id,
                        EntryDate = DateTime.UtcNow,
                        Description = $"REVERSAL / VOID for Bill {bill.BillNumber}: {req.Reason.Trim()}",
                        DebitAmount = 0,
                        CreditAmount = bill.BalanceDue,
                        Balance = customer.CurrentOutstanding,
                        ReferenceType = "VOID_REVERSAL",
                        ReferenceId = bill.BillNumber,
                        PaymentMode = "REVERSAL",
                        CreatedBy = req.AuthorizedBy ?? "Admin",
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            bill.PaymentStatus = "VOID";
            bill.Notes = $"{bill.Notes} | [VOIDED on {DateTime.UtcNow:yyyy-MM-dd HH:mm} by {req.AuthorizedBy ?? "Admin"}: {req.Reason}]".TrimStart(' ', '|');
            bill.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(ApiResponse.Ok(bill, $"Bill {bill.BillNumber} has been voided."));
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, ApiResponse.Fail($"Failed to void bill: {ex.Message}"));
        }
    }

    // =========================================================================
    // CREDIT REPORTS (Part 7, Section 13)
    // =========================================================================

    /// <summary>
    /// Outstanding balance report by customer
    /// </summary>
    [HttpGet("reports/credit-outstanding-customers")]
    public async Task<IActionResult> GetOutstandingByCustomer()
    {
        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? "";

        var customers = await _db.Customers
            .AsNoTracking()
            .Where(c => c.HotelId == hotelId && c.CurrentOutstanding > 0)
            .OrderByDescending(c => c.CurrentOutstanding)
            .ToListAsync();

        var report = new List<object>();
        foreach (var c in customers)
        {
            var totalGiven = await _db.CustomerLedgers
                .Where(l => l.CustomerId == c.Id)
                .SumAsync(l => l.DebitAmount);

            var totalReceived = await _db.CustomerLedgers
                .Where(l => l.CustomerId == c.Id)
                .SumAsync(l => l.CreditAmount);

            var availableCredit = Math.Max(0, Math.Round(c.CreditLimit - c.CurrentOutstanding, 2));

            report.Add(new
            {
                c.Id,
                c.Name,
                c.Phone,
                c.Address,
                c.CustomerType,
                c.CreditLimit,
                TotalCreditGiven = Math.Round(totalGiven, 2),
                TotalPaymentReceived = Math.Round(totalReceived, 2),
                c.CurrentOutstanding,
                AvailableCredit = availableCredit,
                c.CreditStatus
            });
        }

        return Ok(ApiResponse.Ok(report));
    }

    /// <summary>
    /// Outstanding credit bills list with ageing days
    /// </summary>
    [HttpGet("reports/credit-outstanding-bills")]
    public async Task<IActionResult> GetOutstandingBills()
    {
        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? "";

        var bills = await _db.Bills
            .AsNoTracking()
            .Where(b => b.HotelId == hotelId &&
                        (b.PaymentStatus == "CREDIT" || b.PaymentStatus == "PARTIAL" || b.PaymentStatus == "UNPAID") &&
                        b.BalanceDue > 0)
            .OrderBy(b => b.CreatedAt)
            .ToListAsync();

        var now = DateTime.UtcNow;
        var report = bills.Select(b => new
        {
            b.Id,
            b.BillNumber,
            BillDate = b.CreatedAt,
            CustomerName = b.CustomerName ?? "Credit Customer",
            CustomerPhone = b.CustomerPhone,
            OriginalAmount = b.GrandTotal,
            PaidAmount = b.AmountPaid,
            RemainingDue = b.BalanceDue,
            AgeingDays = (int)Math.Max(0, (now - b.CreatedAt).TotalDays),
            b.PaymentStatus,
            b.PaymentMethod
        }).ToList();

        return Ok(ApiResponse.Ok(report));
    }

    /// <summary>
    /// Credit Ageing Report: 0-30 Days, 31-60 Days, 61+ Days
    /// </summary>
    [HttpGet("reports/credit-ageing")]
    public async Task<IActionResult> GetCreditAgeingReport()
    {
        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? "";

        var bills = await _db.Bills
            .AsNoTracking()
            .Where(b => b.HotelId == hotelId &&
                        (b.PaymentStatus == "CREDIT" || b.PaymentStatus == "PARTIAL" || b.PaymentStatus == "UNPAID") &&
                        b.BalanceDue > 0)
            .ToListAsync();

        var now = DateTime.UtcNow;
        double days0To30 = 0;
        int count0To30 = 0;
        double days31To60 = 0;
        int count31To60 = 0;
        double days61Plus = 0;
        int count61Plus = 0;

        foreach (var b in bills)
        {
            var age = (now - b.CreatedAt).TotalDays;
            if (age <= 30)
            {
                days0To30 += b.BalanceDue;
                count0To30++;
            }
            else if (age <= 60)
            {
                days31To60 += b.BalanceDue;
                count31To60++;
            }
            else
            {
                days61Plus += b.BalanceDue;
                count61Plus++;
            }
        }

        return Ok(ApiResponse.Ok(new
        {
            totalOutstanding = Math.Round(days0To30 + days31To60 + days61Plus, 2),
            bracket0To30 = new { count = count0To30, amount = Math.Round(days0To30, 2) },
            bracket31To60 = new { count = count31To60, amount = Math.Round(days31To60, 2) },
            bracket61Plus = new { count = count61Plus, amount = Math.Round(days61Plus, 2) }
        }));
    }

    /// <summary>
    /// Credit Given vs Credit Collected summary
    /// </summary>
    [HttpGet("reports/credit-summary")]
    public async Task<IActionResult> GetCreditSummary([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? "";

        var billsQuery = _db.Bills
            .AsNoTracking()
            .Where(b => b.HotelId == hotelId && (b.PaymentMethod == "CREDIT" || b.PaymentStatus == "CREDIT"));

        var paymentsQuery = _db.CustomerLedgers
            .AsNoTracking()
            .Where(l => l.HotelId == hotelId && l.ReferenceType == "PAYMENT");

        if (startDate.HasValue)
        {
            var sUtc = DateTime.SpecifyKind(startDate.Value.Date, DateTimeKind.Utc);
            billsQuery = billsQuery.Where(b => b.CreatedAt >= sUtc);
            paymentsQuery = paymentsQuery.Where(l => l.EntryDate >= sUtc);
        }

        if (endDate.HasValue)
        {
            var eUtc = DateTime.SpecifyKind(endDate.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
            billsQuery = billsQuery.Where(b => b.CreatedAt <= eUtc);
            paymentsQuery = paymentsQuery.Where(l => l.EntryDate <= eUtc);
        }

        var totalCreditBillsIssued = await billsQuery.CountAsync();
        var totalCreditGiven = Math.Round(await billsQuery.SumAsync(b => b.GrandTotal), 2);
        var totalCreditCollected = Math.Round(await paymentsQuery.SumAsync(l => l.CreditAmount), 2);
        var totalRemainingOutstanding = Math.Round(await _db.Customers.Where(c => c.HotelId == hotelId).SumAsync(c => c.CurrentOutstanding), 2);

        return Ok(ApiResponse.Ok(new
        {
            totalCreditBillsIssued,
            totalCreditGiven,
            totalCreditCollected,
            totalRemainingOutstanding
        }));
    }
}

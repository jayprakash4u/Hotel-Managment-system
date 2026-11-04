using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/customers")]
public class CustomersController : ControllerBase
{
    private readonly HospitalityDbContext _db;

    public CustomersController(HospitalityDbContext db)
    {
        _db = db;
    }

    public record CustomerDto(
        string Id,
        string Name,
        string Phone,
        string? Address,
        string CustomerType, // CASH, CREDIT
        double CreditLimit,
        string CreditStatus, // ACTIVE, BLOCKED
        double OpeningBalance,
        double CurrentOutstanding,
        double AvailableCredit,
        string? Notes,
        string? CreatedBy,
        DateTime CreatedAt,
        DateTime UpdatedAt
    );

    public record CreateCustomerRequest(
        string Name,
        string Phone,
        string? Address,
        string? CustomerType, // CASH or CREDIT
        double? CreditLimit,
        string? CreditStatus, // ACTIVE or BLOCKED
        double? OpeningBalance,
        string? Notes,
        string? CreatedBy
    );

    public record UpdateCustomerRequest(
        string Name,
        string Phone,
        string? Address,
        string? CustomerType,
        double? CreditLimit,
        string? CreditStatus,
        string? Notes,
        string? UpdatedBy
    );

    public record UpdateStatusRequest(
        string Status, // ACTIVE or BLOCKED
        string? Reason,
        string? UpdatedBy
    );

    public record ReceivePaymentRequest(
        double Amount,
        string PaymentMode, // CASH, ONLINE, WALLET
        List<string>? BillIds,
        DateTime? PaymentDate,
        string? ReferenceNumber,
        string? Notes,
        string? ReceivedBy
    );

    public record ManagerOverrideRequest(
        string CustomerId,
        string? BillId,
        string? BillNumber,
        double BillAmount,
        string Reason,
        string ApprovedBy
    );

    private async Task<string> GetHotelIdAsync()
    {
        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        return hotel?.Id ?? "hotel-default";
    }

    /// <summary>
    /// List all customers with searching and filtering
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetCustomers(
        [FromQuery] string? search,
        [FromQuery] string? filter // ALL, CASH, CREDIT, OUTSTANDING, BLOCKED
    )
    {
        var hotelId = await GetHotelIdAsync();
        var query = _db.Customers
            .AsNoTracking()
            .Where(c => c.HotelId == hotelId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower();
            query = query.Where(c => c.Name.ToLower().Contains(q) || c.Phone.Contains(q));
        }

        var filterType = (filter ?? "ALL").Trim().ToUpper();
        switch (filterType)
        {
            case "CASH":
                query = query.Where(c => c.CustomerType == "CASH");
                break;
            case "CREDIT":
                query = query.Where(c => c.CustomerType == "CREDIT");
                break;
            case "OUTSTANDING":
                query = query.Where(c => c.CurrentOutstanding > 0);
                break;
            case "BLOCKED":
                query = query.Where(c => c.CreditStatus == "BLOCKED");
                break;
        }

        var list = await query
            .OrderByDescending(c => c.UpdatedAt)
            .ToListAsync();

        var dtos = list.Select(c => new CustomerDto(
            c.Id,
            c.Name,
            c.Phone,
            c.Address,
            c.CustomerType,
            c.CreditLimit,
            c.CreditStatus,
            c.OpeningBalance,
            c.CurrentOutstanding,
            Math.Max(0, Math.Round(c.CreditLimit - c.CurrentOutstanding, 2)),
            c.Notes,
            c.CreatedBy,
            c.CreatedAt,
            c.UpdatedAt
        )).ToList();

        // Summary metrics
        var allHotelCustomers = await _db.Customers
            .AsNoTracking()
            .Where(c => c.HotelId == hotelId)
            .ToListAsync();

        var totalCustomers = allHotelCustomers.Count;
        var totalCreditCustomers = allHotelCustomers.Count(c => c.CustomerType == "CREDIT");
        var totalOutstanding = Math.Round(allHotelCustomers.Sum(c => c.CurrentOutstanding), 2);
        var totalAvailableCredit = Math.Round(allHotelCustomers
            .Where(c => c.CustomerType == "CREDIT" && c.CreditStatus == "ACTIVE")
            .Sum(c => Math.Max(0, c.CreditLimit - c.CurrentOutstanding)), 2);

        return Ok(ApiResponse.Ok(new
        {
            items = dtos,
            summary = new
            {
                totalCustomers,
                totalCreditCustomers,
                totalOutstanding,
                totalAvailableCredit
            }
        }));
    }

    /// <summary>
    /// Get single customer details with recent activity
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetCustomerById(string id)
    {
        var customer = await _db.Customers.FindAsync(id);
        if (customer == null)
        {
            return NotFound(ApiResponse.Fail("Customer not found."));
        }

        var availableCredit = Math.Max(0, Math.Round(customer.CreditLimit - customer.CurrentOutstanding, 2));

        var totalCreditGiven = await _db.CustomerLedgers
            .Where(l => l.CustomerId == id)
            .SumAsync(l => l.DebitAmount);

        var totalPaymentReceived = await _db.CustomerLedgers
            .Where(l => l.CustomerId == id)
            .SumAsync(l => l.CreditAmount);

        return Ok(ApiResponse.Ok(new
        {
            customer = new CustomerDto(
                customer.Id,
                customer.Name,
                customer.Phone,
                customer.Address,
                customer.CustomerType,
                customer.CreditLimit,
                customer.CreditStatus,
                customer.OpeningBalance,
                customer.CurrentOutstanding,
                availableCredit,
                customer.Notes,
                customer.CreatedBy,
                customer.CreatedAt,
                customer.UpdatedAt
            ),
            stats = new
            {
                totalCreditGiven = Math.Round(totalCreditGiven, 2),
                totalPaymentReceived = Math.Round(totalPaymentReceived, 2),
                currentOutstanding = customer.CurrentOutstanding,
                availableCredit
            }
        }));
    }

    /// <summary>
    /// Register new Cash or Credit Customer
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateCustomer([FromBody] CreateCustomerRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
        {
            return BadRequest(ApiResponse.Fail("Customer Name is mandatory."));
        }

        if (string.IsNullOrWhiteSpace(req.Phone))
        {
            return BadRequest(ApiResponse.Fail("Phone Number is mandatory."));
        }

        var cleanPhone = req.Phone.Trim();
        var hotelId = await GetHotelIdAsync();

        // Enforce uniqueness per phone
        var exists = await _db.Customers.AnyAsync(c => c.HotelId == hotelId && c.Phone == cleanPhone);
        if (exists)
        {
            return BadRequest(ApiResponse.Fail($"A customer with phone number '{cleanPhone}' is already registered."));
        }

        var cType = (req.CustomerType ?? "CASH").Trim().ToUpper();
        if (cType != "CREDIT" && cType != "CASH")
        {
            cType = "CASH";
        }

        var creditLimit = Math.Max(0, req.CreditLimit ?? 0);
        if (cType == "CASH")
        {
            creditLimit = 0; // Cash customers have 0 credit limit
        }

        var creditStatus = (req.CreditStatus ?? "ACTIVE").Trim().ToUpper();
        if (creditStatus != "BLOCKED") creditStatus = "ACTIVE";

        var openingBal = Math.Max(0, req.OpeningBalance ?? 0);

        var customer = new Customer
        {
            HotelId = hotelId,
            Name = req.Name.Trim(),
            Phone = cleanPhone,
            Address = req.Address?.Trim(),
            CustomerType = cType,
            CreditLimit = creditLimit,
            CreditStatus = creditStatus,
            OpeningBalance = openingBal,
            CurrentOutstanding = openingBal,
            Notes = req.Notes?.Trim(),
            CreatedBy = req.CreatedBy ?? "Admin",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Customers.Add(customer);

        // If opening balance > 0, post opening ledger entry
        if (openingBal > 0)
        {
            var initialEntry = new CustomerLedgerEntry
            {
                HotelId = hotelId,
                CustomerId = customer.Id,
                EntryDate = DateTime.UtcNow,
                Description = "Initial / Migrated Opening Balance",
                DebitAmount = openingBal,
                CreditAmount = 0,
                Balance = openingBal,
                ReferenceType = "OPENING_BALANCE",
                ReferenceId = $"OPN-{customer.Id[..8].ToUpper()}",
                CreatedBy = req.CreatedBy ?? "Admin",
                CreatedAt = DateTime.UtcNow
            };
            _db.CustomerLedgers.Add(initialEntry);
        }

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(customer, "Customer registered successfully."));
    }

    /// <summary>
    /// Update Customer details
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCustomer(string id, [FromBody] UpdateCustomerRequest req)
    {
        var customer = await _db.Customers.FindAsync(id);
        if (customer == null)
        {
            return NotFound(ApiResponse.Fail("Customer not found."));
        }

        if (string.IsNullOrWhiteSpace(req.Name))
        {
            return BadRequest(ApiResponse.Fail("Customer Name is mandatory."));
        }

        if (string.IsNullOrWhiteSpace(req.Phone))
        {
            return BadRequest(ApiResponse.Fail("Phone Number is mandatory."));
        }

        var cleanPhone = req.Phone.Trim();
        if (customer.Phone != cleanPhone)
        {
            var exists = await _db.Customers.AnyAsync(c => c.HotelId == customer.HotelId && c.Phone == cleanPhone && c.Id != id);
            if (exists)
            {
                return BadRequest(ApiResponse.Fail($"A customer with phone number '{cleanPhone}' is already registered."));
            }
            customer.Phone = cleanPhone;
        }

        customer.Name = req.Name.Trim();
        customer.Address = req.Address?.Trim();
        customer.Notes = req.Notes?.Trim();
        customer.UpdatedBy = req.UpdatedBy ?? "Admin";
        customer.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(req.CustomerType))
        {
            var cType = req.CustomerType.Trim().ToUpper();
            customer.CustomerType = (cType == "CREDIT") ? "CREDIT" : "CASH";
        }

        if (req.CreditLimit.HasValue)
        {
            customer.CreditLimit = Math.Max(0, req.CreditLimit.Value);
        }

        if (!string.IsNullOrWhiteSpace(req.CreditStatus))
        {
            var status = req.CreditStatus.Trim().ToUpper();
            customer.CreditStatus = (status == "BLOCKED") ? "BLOCKED" : "ACTIVE";
        }

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(customer, "Customer updated successfully."));
    }

    /// <summary>
    /// Block or Activate customer credit status
    /// </summary>
    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateCreditStatus(string id, [FromBody] UpdateStatusRequest req)
    {
        var customer = await _db.Customers.FindAsync(id);
        if (customer == null)
        {
            return NotFound(ApiResponse.Fail("Customer not found."));
        }

        var targetStatus = (req.Status ?? "ACTIVE").Trim().ToUpper();
        if (targetStatus != "BLOCKED") targetStatus = "ACTIVE";

        customer.CreditStatus = targetStatus;
        customer.UpdatedBy = req.UpdatedBy ?? "Admin";
        customer.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(req.Reason))
        {
            customer.Notes = string.IsNullOrEmpty(customer.Notes)
                ? $"Status changed to {targetStatus}: {req.Reason}"
                : $"{customer.Notes} | Status {targetStatus}: {req.Reason}";
        }

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            customer.Id,
            customer.Name,
            customer.CreditStatus,
            customer.CurrentOutstanding
        }, $"Customer is now {targetStatus}."));
    }

    /// <summary>
    /// Customer Ledger statement with transactions and running balance
    /// </summary>
    [HttpGet("{id}/ledger")]
    public async Task<IActionResult> GetCustomerLedger(
        string id,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate
    )
    {
        var customer = await _db.Customers.FindAsync(id);
        if (customer == null)
        {
            return NotFound(ApiResponse.Fail("Customer not found."));
        }

        var query = _db.CustomerLedgers
            .AsNoTracking()
            .Where(l => l.CustomerId == id);

        if (startDate.HasValue)
        {
            query = query.Where(l => l.EntryDate >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            var endOfDay = endDate.Value.Date.AddDays(1).AddTicks(-1);
            query = query.Where(l => l.EntryDate <= endOfDay);
        }

        var entries = await query
            .OrderBy(l => l.EntryDate)
            .ToListAsync();

        var totalDebit = Math.Round(entries.Sum(e => e.DebitAmount), 2);
        var totalCredit = Math.Round(entries.Sum(e => e.CreditAmount), 2);
        var availableCredit = Math.Max(0, Math.Round(customer.CreditLimit - customer.CurrentOutstanding, 2));

        return Ok(ApiResponse.Ok(new
        {
            customer = new
            {
                customer.Id,
                customer.Name,
                customer.Phone,
                customer.Address,
                customer.CustomerType,
                customer.CreditLimit,
                customer.CreditStatus,
                customer.CurrentOutstanding,
                availableCredit
            },
            summary = new
            {
                totalDebit,
                totalCredit,
                closingBalance = customer.CurrentOutstanding,
                availableCredit
            },
            entries
        }));
    }

    /// <summary>
    /// Get unpaid or partially paid credit bills for a customer
    /// </summary>
    [HttpGet("{id}/unpaid-bills")]
    public async Task<IActionResult> GetUnpaidBills(string id)
    {
        var customer = await _db.Customers.FindAsync(id);
        if (customer == null)
        {
            return NotFound(ApiResponse.Fail("Customer not found."));
        }

        var bills = await _db.Bills
            .AsNoTracking()
            .Where(b => (b.CustomerId == id || b.CustomerPhone == customer.Phone) &&
                        (b.PaymentStatus == "CREDIT" || b.PaymentStatus == "PARTIAL" || b.PaymentStatus == "UNPAID") &&
                        b.BalanceDue > 0)
            .OrderBy(b => b.CreatedAt)
            .ToListAsync();

        return Ok(ApiResponse.Ok(bills));
    }

    /// <summary>
    /// Receive Credit Payment (Part 5)
    /// Settles existing credit bills atomically without creating a new sales bill
    /// </summary>
    [HttpPost("{id}/payments")]
    public async Task<IActionResult> ReceivePayment(string id, [FromBody] ReceivePaymentRequest req)
    {
        if (req.Amount <= 0)
        {
            return BadRequest(ApiResponse.Fail("Payment amount must be greater than zero."));
        }

        var pMode = (req.PaymentMode ?? "CASH").Trim().ToUpper();
        if (pMode == "CREDIT")
        {
            return BadRequest(ApiResponse.Fail("Credit cannot be used as a payment mode to settle credit balances. Choose Cash, Online, or Wallet."));
        }

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var customer = await _db.Customers.FirstOrDefaultAsync(c => c.Id == id);
            if (customer == null)
            {
                await transaction.RollbackAsync();
                return NotFound(ApiResponse.Fail("Customer not found."));
            }

            if (customer.CurrentOutstanding <= 0)
            {
                await transaction.RollbackAsync();
                return BadRequest(ApiResponse.Fail("Customer has zero outstanding balance."));
            }

            if (req.Amount > customer.CurrentOutstanding + 0.05)
            {
                await transaction.RollbackAsync();
                return BadRequest(ApiResponse.Fail($"Payment amount (Rs. {req.Amount:N2}) exceeds customer's current outstanding balance (Rs. {customer.CurrentOutstanding:N2})."));
            }

            // Find eligible unpaid / partial bills
            var billsQuery = _db.Bills
                .Where(b => (b.CustomerId == id || b.CustomerPhone == customer.Phone) &&
                            (b.PaymentStatus == "CREDIT" || b.PaymentStatus == "PARTIAL" || b.PaymentStatus == "UNPAID") &&
                            b.BalanceDue > 0);

            if (req.BillIds != null && req.BillIds.Count > 0)
            {
                billsQuery = billsQuery.Where(b => req.BillIds.Contains(b.Id));
            }

            var eligibleBills = await billsQuery.OrderBy(b => b.CreatedAt).ToListAsync();

            double remainingPaymentToAllocate = req.Amount;
            var paymentDate = req.PaymentDate ?? DateTime.UtcNow;
            var paymentRef = string.IsNullOrWhiteSpace(req.ReferenceNumber)
                ? $"PAY-{DateTime.UtcNow:yyMMdd}-{Random.Shared.Next(1000, 9999)}"
                : req.ReferenceNumber.Trim();

            var settledBillNumbers = new List<string>();

            foreach (var bill in eligibleBills)
            {
                if (remainingPaymentToAllocate <= 0.001) break;

                var alloc = Math.Min(remainingPaymentToAllocate, bill.BalanceDue);
                bill.AmountPaid = Math.Round(bill.AmountPaid + alloc, 2);
                bill.BalanceDue = Math.Max(0, Math.Round(bill.GrandTotal - bill.AmountPaid, 2));
                bill.OutstandingAmount = bill.BalanceDue;

                if (bill.BalanceDue <= 0.01)
                {
                    bill.PaymentStatus = "PAID";
                    bill.PaidAt = paymentDate;
                }
                else
                {
                    bill.PaymentStatus = "PARTIAL";
                }

                // Append payment record in Bill.PaymentsJson
                var payments = new List<object>();
                try
                {
                    if (!string.IsNullOrEmpty(bill.PaymentsJson) && bill.PaymentsJson != "[]")
                    {
                        var parsed = JsonSerializer.Deserialize<List<JsonElement>>(bill.PaymentsJson);
                        if (parsed != null)
                        {
                            foreach (var elem in parsed)
                            {
                                payments.Add(elem);
                            }
                        }
                    }
                }
                catch { }

                payments.Add(new
                {
                    id = $"REC-{Guid.NewGuid():N}"[..12].ToUpper(),
                    amount = alloc,
                    paymentMethod = pMode,
                    paymentDate = paymentDate,
                    transactionRef = paymentRef,
                    receivedBy = req.ReceivedBy ?? "Cashier",
                    notes = req.Notes ?? "Credit settlement payment"
                });

                bill.PaymentsJson = JsonSerializer.Serialize(payments);
                bill.UpdatedAt = DateTime.UtcNow;

                settledBillNumbers.Add(bill.BillNumber);
                remainingPaymentToAllocate -= alloc;
            }

            // Update customer outstanding balance
            customer.CurrentOutstanding = Math.Max(0, Math.Round(customer.CurrentOutstanding - req.Amount, 2));
            customer.UpdatedAt = DateTime.UtcNow;

            // Create Customer Ledger Entry (CREDIT entry reduces balance)
            var ledgerDesc = settledBillNumbers.Count > 0
                ? $"Credit payment via {pMode} against {string.Join(", ", settledBillNumbers)}"
                : $"Credit payment received via {pMode}";

            if (!string.IsNullOrWhiteSpace(req.Notes))
            {
                ledgerDesc += $" · {req.Notes.Trim()}";
            }

            var ledgerEntry = new CustomerLedgerEntry
            {
                HotelId = customer.HotelId,
                CustomerId = customer.Id,
                BillId = eligibleBills.FirstOrDefault()?.Id,
                PaymentId = paymentRef,
                EntryDate = paymentDate,
                Description = ledgerDesc,
                DebitAmount = 0,
                CreditAmount = Math.Round(req.Amount, 2),
                Balance = customer.CurrentOutstanding,
                ReferenceType = "PAYMENT",
                ReferenceId = paymentRef,
                PaymentMode = pMode,
                CreatedBy = req.ReceivedBy ?? "Cashier",
                CreatedAt = DateTime.UtcNow
            };

            _db.CustomerLedgers.Add(ledgerEntry);

            // Update CashRegister if Cash payment
            if (pMode == "CASH")
            {
                var activeRegister = await _db.CashRegisters
                    .Where(r => r.Status == "OPEN")
                    .OrderByDescending(r => r.OpenedAt)
                    .FirstOrDefaultAsync();

                if (activeRegister != null)
                {
                    activeRegister.CashSales = Math.Round(activeRegister.CashSales + req.Amount, 2);
                }
            }

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            var availableCredit = Math.Max(0, Math.Round(customer.CreditLimit - customer.CurrentOutstanding, 2));

            return Ok(ApiResponse.Ok(new
            {
                paymentRef,
                amountReceived = req.Amount,
                paymentMode = pMode,
                settledBills = settledBillNumbers,
                newOutstanding = customer.CurrentOutstanding,
                availableCredit,
                message = $"Successfully received Rs. {req.Amount:N2} via {pMode}."
            }));
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, ApiResponse.Fail($"Failed to record payment: {ex.Message}"));
        }
    }

    /// <summary>
    /// Manager Override for Exceeding Credit Limit (Part 3, Section 6)
    /// </summary>
    [HttpPost("override-credit")]
    public async Task<IActionResult> ManagerOverrideCredit([FromBody] ManagerOverrideRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Reason))
        {
            return BadRequest(ApiResponse.Fail("A reason is mandatory for manager credit limit override."));
        }

        if (string.IsNullOrWhiteSpace(req.ApprovedBy))
        {
            return BadRequest(ApiResponse.Fail("Approving manager identity is required."));
        }

        var customer = await _db.Customers.FindAsync(req.CustomerId);
        if (customer == null)
        {
            return NotFound(ApiResponse.Fail("Customer not found."));
        }

        if (customer.CreditStatus == "BLOCKED")
        {
            return BadRequest(ApiResponse.Fail("Blocked customers can NEVER receive credit, even with manager override."));
        }

        var availableCredit = Math.Max(0, Math.Round(customer.CreditLimit - customer.CurrentOutstanding, 2));
        var overrideAmount = Math.Max(0, req.BillAmount - availableCredit);

        var audit = new CreditOverrideAudit
        {
            HotelId = customer.HotelId,
            CustomerId = customer.Id,
            BillId = req.BillId,
            BillNumber = req.BillNumber,
            PreviousAvailableCredit = availableCredit,
            BillAmount = req.BillAmount,
            OverrideAmount = overrideAmount,
            Reason = req.Reason.Trim(),
            ApprovedBy = req.ApprovedBy.Trim(),
            ApprovedAt = DateTime.UtcNow
        };

        _db.CreditOverrideAudits.Add(audit);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            overrideId = audit.Id,
            customer = customer.Name,
            overrideAmount,
            approvedBy = audit.ApprovedBy,
            approvedAt = audit.ApprovedAt,
            message = $"Manager override approved for Rs. {overrideAmount:N2}."
        }));
    }
}


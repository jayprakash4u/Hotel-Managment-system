using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/customers")]
[Route("api/accounts/customers")]
public class CustomersController : ControllerBase
{
    private readonly HospitalityDbContext _db;

    public CustomersController(HospitalityDbContext db)
    {
        _db = db;
    }

    #region DTOs
    public record CustomerDto(
        string Id,
        string? CustomerCode,
        string Name,
        string Phone,
        string? Email,
        string? Address,
        string? PanVatNumber,
        string CustomerType, // CASH, CREDIT, CORPORATE, REGULAR
        double CreditLimit,
        int CreditTerms,
        string CreditStatus, // ACTIVE, BLOCKED, ON_HOLD
        double OpeningBalance,
        double CurrentOutstanding,
        double AdvanceBalance,
        double AvailableCredit,
        string BranchOrOutlet,
        string? Notes,
        string? CreatedBy,
        DateTime CreatedAt,
        DateTime UpdatedAt
    );

    public record CreateCustomerRequest(
        string Name,
        string? CustomerCode,
        string Phone,
        string? Email,
        string? Address,
        string? PanVatNumber,
        string? CustomerType, // CASH, CREDIT, CORPORATE
        double? CreditLimit,
        int? CreditTerms,
        string? CreditStatus, // ACTIVE, BLOCKED
        double? OpeningBalance,
        string? BranchOrOutlet,
        string? Notes,
        string? CreatedBy
    );

    public record UpdateCustomerRequest(
        string Name,
        string? CustomerCode,
        string Phone,
        string? Email,
        string? Address,
        string? PanVatNumber,
        string? CustomerType,
        double? CreditLimit,
        int? CreditTerms,
        string? CreditStatus,
        string? BranchOrOutlet,
        string? Notes,
        string? UpdatedBy
    );

    public record UpdateStatusRequest(
        string Status, // ACTIVE, BLOCKED, ON_HOLD
        string? Reason,
        string? UpdatedBy
    );

    public record InvoiceAllocationDto(
        string BillId,
        double Amount
    );

    public record ReceivePaymentRequest(
        double Amount,
        string PaymentMode, // CASH, ONLINE, WALLET, BANK_TRANSFER, CARD, UPI
        List<InvoiceAllocationDto>? Allocations,
        List<string>? BillIds,
        DateTime? PaymentDate,
        string? ReferenceNumber,
        string? Notes,
        string? ReceivedBy,
        string? Outlet
    );

    public record AllocateAdvanceRequest(
        List<InvoiceAllocationDto> Allocations,
        string? Notes,
        string? AuthorizedBy
    );

    public record AccountAdjustmentRequest(
        string AdjustmentType, // DEBIT (increases receivable), CREDIT (decreases receivable)
        double Amount,
        string Reason,
        string? ReferenceNumber,
        string? ApprovedBy
    );

    public record ManagerOverrideRequest(
        string CustomerId,
        string? BillId,
        string? BillNumber,
        double BillAmount,
        string Reason,
        string ApprovedBy
    );
    #endregion

    private async Task<string> GetHotelIdAsync()
    {
        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        return hotel?.Id ?? "hotel-default";
    }

    #region 1. List Customers with Searching, Filtering & Totals
    /// <summary>
    /// List all customers with advanced search and status filter
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetCustomers(
        [FromQuery] string? search,
        [FromQuery] string? filter // ALL, CASH, CREDIT, OUTSTANDING, BLOCKED, ADVANCE
    )
    {
        var hotelId = await GetHotelIdAsync();
        var query = _db.Customers
            .AsNoTracking()
            .Where(c => c.HotelId == hotelId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower();
            query = query.Where(c =>
                c.Name.ToLower().Contains(q) ||
                (c.CustomerCode != null && c.CustomerCode.ToLower().Contains(q)) ||
                c.Phone.Contains(q) ||
                (c.Email != null && c.Email.ToLower().Contains(q)) ||
                (c.Address != null && c.Address.ToLower().Contains(q)) ||
                (c.PanVatNumber != null && c.PanVatNumber.ToLower().Contains(q))
            );
        }

        var filterType = (filter ?? "ALL").Trim().ToUpper();
        switch (filterType)
        {
            case "CASH":
                query = query.Where(c => c.CustomerType == "CASH");
                break;
            case "CREDIT":
                query = query.Where(c => c.CustomerType == "CREDIT" || c.CustomerType == "CORPORATE");
                break;
            case "OUTSTANDING":
                query = query.Where(c => c.CurrentOutstanding > 0);
                break;
            case "ADVANCE":
                query = query.Where(c => c.AdvanceBalance > 0);
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
            c.CustomerCode ?? $"CUST-{c.Id[..6].ToUpper()}",
            c.Name,
            c.Phone,
            c.Email,
            c.Address,
            c.PanVatNumber,
            c.CustomerType,
            c.CreditLimit,
            c.CreditTerms,
            c.CreditStatus,
            c.OpeningBalance,
            c.CurrentOutstanding,
            c.AdvanceBalance,
            Math.Max(0, Math.Round(c.CreditLimit - c.CurrentOutstanding, 2)),
            c.BranchOrOutlet ?? "RESTAURANT",
            c.Notes,
            c.CreatedBy,
            c.CreatedAt,
            c.UpdatedAt
        )).ToList();

        // Overall summary metrics across hotel customers
        var allHotelCustomers = await _db.Customers
            .AsNoTracking()
            .Where(c => c.HotelId == hotelId)
            .ToListAsync();

        var totalCustomers = allHotelCustomers.Count;
        var totalCreditCustomers = allHotelCustomers.Count(c => c.CustomerType == "CREDIT" || c.CustomerType == "CORPORATE");
        var totalOutstanding = Math.Round(allHotelCustomers.Sum(c => c.CurrentOutstanding), 2);
        var totalAdvance = Math.Round(allHotelCustomers.Sum(c => c.AdvanceBalance), 2);
        var totalAvailableCredit = Math.Round(allHotelCustomers
            .Where(c => (c.CustomerType == "CREDIT" || c.CustomerType == "CORPORATE") && c.CreditStatus == "ACTIVE")
            .Sum(c => Math.Max(0, c.CreditLimit - c.CurrentOutstanding)), 2);

        return Ok(ApiResponse.Ok(new
        {
            items = dtos,
            summary = new
            {
                totalCustomers,
                totalCreditCustomers,
                totalOutstanding,
                totalAdvance,
                totalAvailableCredit
            }
        }));
    }
    #endregion

    #region 2. Get Customer Profile & Financial Summary
    /// <summary>
    /// Get single customer profile and real-time ledger stats
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

        var totalDebits = await _db.CustomerLedgers
            .Where(l => l.CustomerId == id)
            .SumAsync(l => l.DebitAmount);

        var totalCredits = await _db.CustomerLedgers
            .Where(l => l.CustomerId == id)
            .SumAsync(l => l.CreditAmount);

        var totalSales = await _db.Bills
            .Where(b => (b.CustomerId == id || b.CustomerPhone == customer.Phone) && b.TransactionStatus != "CANCELLED")
            .SumAsync(b => b.GrandTotal);

        var totalPayments = await _db.CustomerLedgers
            .Where(l => l.CustomerId == id && (l.ReferenceType == "PAYMENT" || l.ReferenceType == "CUSTOMER_ADVANCE"))
            .SumAsync(l => l.CreditAmount);

        var totalReturns = await _db.CustomerLedgers
            .Where(l => l.CustomerId == id && (l.ReferenceType == "SALES_RETURN" || l.ReferenceType == "CREDIT_NOTE"))
            .SumAsync(l => l.CreditAmount);

        return Ok(ApiResponse.Ok(new
        {
            customer = new CustomerDto(
                customer.Id,
                customer.CustomerCode ?? $"CUST-{customer.Id[..6].ToUpper()}",
                customer.Name,
                customer.Phone,
                customer.Email,
                customer.Address,
                customer.PanVatNumber,
                customer.CustomerType,
                customer.CreditLimit,
                customer.CreditTerms,
                customer.CreditStatus,
                customer.OpeningBalance,
                customer.CurrentOutstanding,
                customer.AdvanceBalance,
                availableCredit,
                customer.BranchOrOutlet ?? "RESTAURANT",
                customer.Notes,
                customer.CreatedBy,
                customer.CreatedAt,
                customer.UpdatedAt
            ),
            stats = new
            {
                openingBalance = customer.OpeningBalance,
                totalSales = Math.Round(totalSales, 2),
                totalPayments = Math.Round(totalPayments, 2),
                totalReturns = Math.Round(totalReturns, 2),
                outstandingBalance = customer.CurrentOutstanding,
                advanceBalance = customer.AdvanceBalance,
                availableCredit,
                totalDebits = Math.Round(totalDebits, 2),
                totalCredits = Math.Round(totalCredits, 2)
            }
        }));
    }
    #endregion

    #region 3. Create & Update Customer
    /// <summary>
    /// Register new Customer with auto-code, credit limit, and terms
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
        if (cType != "CREDIT" && cType != "CASH" && cType != "CORPORATE")
        {
            cType = "CASH";
        }

        var creditLimit = Math.Max(0, req.CreditLimit ?? 0);
        if (cType == "CASH")
        {
            creditLimit = 0;
        }

        var creditStatus = (req.CreditStatus ?? "ACTIVE").Trim().ToUpper();
        if (creditStatus != "BLOCKED" && creditStatus != "ON_HOLD") creditStatus = "ACTIVE";

        var openingBal = Math.Max(0, req.OpeningBalance ?? 0);

        // Auto-generate code if empty
        var customerCode = req.CustomerCode?.Trim();
        if (string.IsNullOrWhiteSpace(customerCode))
        {
            var count = await _db.Customers.CountAsync(c => c.HotelId == hotelId);
            customerCode = $"CUST-{(1001 + count):D4}";
        }

        var customer = new Customer
        {
            HotelId = hotelId,
            CustomerCode = customerCode,
            Name = req.Name.Trim(),
            Phone = cleanPhone,
            Email = req.Email?.Trim(),
            Address = req.Address?.Trim(),
            PanVatNumber = req.PanVatNumber?.Trim(),
            CustomerType = cType,
            CreditLimit = creditLimit,
            CreditTerms = req.CreditTerms.HasValue && req.CreditTerms.Value > 0 ? req.CreditTerms.Value : 30,
            CreditStatus = creditStatus,
            OpeningBalance = openingBal,
            CurrentOutstanding = openingBal,
            AdvanceBalance = 0,
            BranchOrOutlet = req.BranchOrOutlet ?? "RESTAURANT",
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
                DueDate = DateTime.UtcNow.AddDays(customer.CreditTerms),
                Description = "Initial / Migrated Opening Balance",
                DebitAmount = openingBal,
                CreditAmount = 0,
                Balance = openingBal,
                ReferenceType = "OPENING_BALANCE",
                ReferenceId = $"OPN-{customer.CustomerCode}",
                InvoiceNumber = null,
                PaymentStatus = "UNPAID",
                Outlet = customer.BranchOrOutlet ?? "RESTAURANT",
                CreatedBy = req.CreatedBy ?? "Admin",
                CreatedAt = DateTime.UtcNow
            };
            _db.CustomerLedgers.Add(initialEntry);
        }

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(customer, $"Customer {customer.CustomerCode} ({customer.Name}) registered successfully."));
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
        if (!string.IsNullOrWhiteSpace(req.CustomerCode)) customer.CustomerCode = req.CustomerCode.Trim();
        customer.Email = req.Email?.Trim();
        customer.Address = req.Address?.Trim();
        customer.PanVatNumber = req.PanVatNumber?.Trim();
        customer.Notes = req.Notes?.Trim();
        customer.BranchOrOutlet = req.BranchOrOutlet ?? customer.BranchOrOutlet;
        customer.UpdatedBy = req.UpdatedBy ?? "Admin";
        customer.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(req.CustomerType))
        {
            var cType = req.CustomerType.Trim().ToUpper();
            customer.CustomerType = (cType == "CREDIT" || cType == "CORPORATE") ? cType : "CASH";
        }

        if (req.CreditLimit.HasValue)
        {
            customer.CreditLimit = Math.Max(0, req.CreditLimit.Value);
        }

        if (req.CreditTerms.HasValue && req.CreditTerms.Value > 0)
        {
            customer.CreditTerms = req.CreditTerms.Value;
        }

        if (!string.IsNullOrWhiteSpace(req.CreditStatus))
        {
            var status = req.CreditStatus.Trim().ToUpper();
            customer.CreditStatus = (status == "BLOCKED" || status == "ON_HOLD") ? status : "ACTIVE";
        }

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(customer, "Customer updated successfully."));
    }

    /// <summary>
    /// Change customer credit status
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
        if (targetStatus != "BLOCKED" && targetStatus != "ON_HOLD") targetStatus = "ACTIVE";

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
        }, $"Customer credit status updated to {targetStatus}."));
    }
    #endregion

    #region 4. Customer Ledger Statement with Running Balance
    /// <summary>
    /// Comprehensive customer ledger with chronological running balance, date range, and transaction filters
    /// </summary>
    [HttpGet("{id}/ledger")]
    public async Task<IActionResult> GetCustomerLedger(
        string id,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] string? transactionType,
        [FromQuery] string? outlet,
        [FromQuery] bool outstandingOnly = false
    )
    {
        var customer = await _db.Customers.FindAsync(id);
        if (customer == null)
        {
            return NotFound(ApiResponse.Fail("Customer not found."));
        }

        // Calculate Period Opening Balance: entries strictly prior to startDate
        double periodOpeningBalance = customer.OpeningBalance;
        if (startDate.HasValue)
        {
            var startUtc = DateTime.SpecifyKind(startDate.Value.Date, DateTimeKind.Utc);
            var priorDebits = await _db.CustomerLedgers
                .Where(l => l.CustomerId == id && l.EntryDate < startUtc && l.ReferenceType != "OPENING_BALANCE")
                .SumAsync(l => l.DebitAmount);

            var priorCredits = await _db.CustomerLedgers
                .Where(l => l.CustomerId == id && l.EntryDate < startUtc)
                .SumAsync(l => l.CreditAmount);

            periodOpeningBalance = Math.Round(customer.OpeningBalance + priorDebits - priorCredits, 2);
        }

        var query = _db.CustomerLedgers
            .AsNoTracking()
            .Where(l => l.CustomerId == id);

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
            query = query.Where(l => l.Outlet.ToUpper() == ot);
        }

        var rawEntries = await query
            .OrderBy(l => l.EntryDate)
            .ThenBy(l => l.CreatedAt)
            .ToListAsync();

        // Calculate chronological running balance row-by-row
        double currentRunning = periodOpeningBalance;
        var calculatedEntries = new List<object>();

        foreach (var e in rawEntries)
        {
            // If it is OPENING_BALANCE inside the period, don't double count if already in periodOpeningBalance
            if (e.ReferenceType == "OPENING_BALANCE")
            {
                currentRunning = e.DebitAmount;
            }
            else
            {
                currentRunning = Math.Round(currentRunning + e.DebitAmount - e.CreditAmount, 2);
            }

            calculatedEntries.Add(new
            {
                id = e.Id,
                customerId = e.CustomerId,
                billId = e.BillId,
                invoiceNumber = e.InvoiceNumber ?? e.ReferenceId,
                paymentId = e.PaymentId,
                entryDate = e.EntryDate,
                dueDate = e.DueDate,
                description = e.Description,
                debitAmount = e.DebitAmount,
                creditAmount = e.CreditAmount,
                balance = currentRunning,
                referenceType = e.ReferenceType,
                referenceId = e.ReferenceId,
                paymentMode = e.PaymentMode,
                outlet = string.IsNullOrWhiteSpace(e.Outlet) ? "RESTAURANT" : e.Outlet,
                paymentStatus = e.PaymentStatus,
                createdBy = e.CreatedBy ?? "Cashier",
                journalEntryId = e.JournalEntryId
            });
        }

        var periodDebits = Math.Round(rawEntries.Sum(e => e.DebitAmount), 2);
        var periodCredits = Math.Round(rawEntries.Sum(e => e.CreditAmount), 2);
        var availableCredit = Math.Max(0, Math.Round(customer.CreditLimit - customer.CurrentOutstanding, 2));

        return Ok(ApiResponse.Ok(new
        {
            customer = new
            {
                customer.Id,
                customerCode = customer.CustomerCode ?? $"CUST-{customer.Id[..6].ToUpper()}",
                customer.Name,
                customer.Phone,
                customer.Email,
                customer.Address,
                customer.PanVatNumber,
                customer.CustomerType,
                customer.CreditLimit,
                customer.CreditTerms,
                customer.CreditStatus,
                customer.CurrentOutstanding,
                customer.AdvanceBalance,
                availableCredit,
                branchOrOutlet = customer.BranchOrOutlet ?? "RESTAURANT"
            },
            summary = new
            {
                openingBalance = periodOpeningBalance,
                periodDebits,
                periodCredits,
                closingBalance = customer.CurrentOutstanding,
                advanceBalance = customer.AdvanceBalance,
                availableCredit
            },
            entries = calculatedEntries
        }));
    }
    #endregion

    #region 5. Get Unpaid Bills & Invoices
    /// <summary>
    /// Get all unsettled or partially paid credit invoices for allocation
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
                        b.TransactionStatus != "CANCELLED" &&
                        b.BalanceDue > 0)
            .OrderBy(b => b.CreatedAt)
            .ToListAsync();

        var billDtos = bills.Select(b => new
        {
            id = b.Id,
            billNumber = b.BillNumber,
            orderNumber = b.OrderNumber,
            date = b.CreatedAt,
            dueDate = b.CreatedAt.AddDays(customer.CreditTerms),
            grandTotal = b.GrandTotal,
            amountPaid = b.AmountPaid,
            balanceDue = b.BalanceDue,
            paymentStatus = b.PaymentStatus,
            salesChannel = b.SalesChannel,
            outlet = b.Outlet
        }).ToList();

        return Ok(ApiResponse.Ok(billDtos));
    }
    #endregion

    #region 6. Record Payment & Multi-Invoice Allocation (with Advances & GL Postings)
    /// <summary>
    /// Record customer payment with selective invoice allocations, advances, and balanced journal entries
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
            return BadRequest(ApiResponse.Fail("Credit cannot be used as a payment mode to settle receivables."));
        }

        using var dbTransaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var customer = await _db.Customers.FirstOrDefaultAsync(c => c.Id == id);
            if (customer == null)
            {
                await dbTransaction.RollbackAsync();
                return NotFound(ApiResponse.Fail("Customer not found."));
            }

            var hotelId = customer.HotelId;
            var paymentDate = req.PaymentDate ?? DateTime.UtcNow;
            var paymentRef = string.IsNullOrWhiteSpace(req.ReferenceNumber)
                ? $"RCP-{DateTime.UtcNow:yyMMdd}-{Random.Shared.Next(1000, 9999)}"
                : req.ReferenceNumber.Trim();

            double totalAmount = Math.Round(req.Amount, 2);
            double allocatedAmount = 0;
            var settledBillNumbers = new List<string>();

            // 1. Process specific allocations if provided
            if (req.Allocations != null && req.Allocations.Count > 0)
            {
                foreach (var alloc in req.Allocations)
                {
                    if (alloc.Amount <= 0) continue;
                    var bill = await _db.Bills.FirstOrDefaultAsync(b => b.Id == alloc.BillId);
                    if (bill != null && bill.BalanceDue > 0)
                    {
                        var applyAmt = Math.Min(alloc.Amount, bill.BalanceDue);
                        bill.AmountPaid = Math.Round(bill.AmountPaid + applyAmt, 2);
                        bill.BalanceDue = Math.Max(0, Math.Round(bill.GrandTotal - bill.AmountPaid, 2));
                        bill.OutstandingAmount = bill.BalanceDue;
                        bill.PaymentStatus = bill.BalanceDue <= 0.01 ? "PAID" : "PARTIAL";
                        if (bill.BalanceDue <= 0.01) bill.PaidAt = paymentDate;

                        AppendBillPaymentRecord(bill, applyAmt, pMode, paymentRef, req.ReceivedBy, req.Notes);
                        allocatedAmount += applyAmt;
                        settledBillNumbers.Add(bill.BillNumber);
                    }
                }
            }
            // 2. Or fallback to auto-allocating FIFO against bills matching billIds or all open bills
            else if (req.BillIds != null && req.BillIds.Count > 0)
            {
                var targetBills = await _db.Bills
                    .Where(b => req.BillIds.Contains(b.Id) && b.BalanceDue > 0)
                    .OrderBy(b => b.CreatedAt)
                    .ToListAsync();

                double remaining = totalAmount;
                foreach (var bill in targetBills)
                {
                    if (remaining <= 0.001) break;
                    var applyAmt = Math.Min(remaining, bill.BalanceDue);
                    bill.AmountPaid = Math.Round(bill.AmountPaid + applyAmt, 2);
                    bill.BalanceDue = Math.Max(0, Math.Round(bill.GrandTotal - bill.AmountPaid, 2));
                    bill.OutstandingAmount = bill.BalanceDue;
                    bill.PaymentStatus = bill.BalanceDue <= 0.01 ? "PAID" : "PARTIAL";
                    if (bill.BalanceDue <= 0.01) bill.PaidAt = paymentDate;

                    AppendBillPaymentRecord(bill, applyAmt, pMode, paymentRef, req.ReceivedBy, req.Notes);
                    allocatedAmount += applyAmt;
                    remaining -= applyAmt;
                    settledBillNumbers.Add(bill.BillNumber);
                }
            }

            allocatedAmount = Math.Round(allocatedAmount, 2);
            double advanceAmount = Math.Max(0, Math.Round(totalAmount - allocatedAmount, 2));

            // 3. Update customer outstanding and advance balance
            if (allocatedAmount > 0)
            {
                customer.CurrentOutstanding = Math.Max(0, Math.Round(customer.CurrentOutstanding - allocatedAmount, 2));
            }

            if (advanceAmount > 0)
            {
                customer.AdvanceBalance = Math.Round(customer.AdvanceBalance + advanceAmount, 2);
            }
            customer.UpdatedAt = DateTime.UtcNow;

            // 4. Create Customer Ledger Entry
            var desc = settledBillNumbers.Count > 0
                ? $"Payment received via {pMode} against {string.Join(", ", settledBillNumbers)}"
                : $"Customer receipt via {pMode}";

            if (advanceAmount > 0)
            {
                desc += $" (Includes Rs. {advanceAmount:N2} Advance Deposit)";
            }

            if (!string.IsNullOrWhiteSpace(req.Notes))
            {
                desc += $" · {req.Notes.Trim()}";
            }

            var ledgerEntry = new CustomerLedgerEntry
            {
                HotelId = hotelId,
                CustomerId = customer.Id,
                PaymentId = paymentRef,
                EntryDate = paymentDate,
                Description = desc,
                DebitAmount = 0,
                CreditAmount = totalAmount,
                Balance = customer.CurrentOutstanding,
                ReferenceType = advanceAmount > 0 && allocatedAmount == 0 ? "CUSTOMER_ADVANCE" : "PAYMENT",
                ReferenceId = paymentRef,
                InvoiceNumber = settledBillNumbers.Count == 1 ? settledBillNumbers[0] : null,
                PaymentMode = pMode,
                Outlet = req.Outlet ?? customer.BranchOrOutlet ?? "RESTAURANT",
                PaymentStatus = "PAID",
                CreatedBy = req.ReceivedBy ?? "Cashier",
                CreatedAt = DateTime.UtcNow
            };

            _db.CustomerLedgers.Add(ledgerEntry);

            // 5. Post Balanced Double-Entry Journal to General Ledger
            await PostCustomerPaymentJournalEntryAsync(_db, customer, totalAmount, allocatedAmount, advanceAmount, pMode, paymentRef, req.ReceivedBy ?? "Cashier");

            // 6. Sync active CashRegister if Cash
            if (pMode == "CASH")
            {
                var activeRegister = await _db.CashRegisters
                    .Where(r => r.Status == "OPEN")
                    .OrderByDescending(r => r.OpenedAt)
                    .FirstOrDefaultAsync();

                if (activeRegister != null)
                {
                    activeRegister.CashSales = Math.Round(activeRegister.CashSales + totalAmount, 2);
                }
            }

            await _db.SaveChangesAsync();
            await dbTransaction.CommitAsync();

            var availableCredit = Math.Max(0, Math.Round(customer.CreditLimit - customer.CurrentOutstanding, 2));

            return Ok(ApiResponse.Ok(new
            {
                paymentRef,
                amountReceived = totalAmount,
                allocatedAmount,
                advanceAmount,
                settledBills = settledBillNumbers,
                newOutstanding = customer.CurrentOutstanding,
                newAdvanceBalance = customer.AdvanceBalance,
                availableCredit,
                message = $"Payment of Rs. {totalAmount:N2} recorded successfully via {pMode}."
            }));
        }
        catch (Exception ex)
        {
            await dbTransaction.RollbackAsync();
            return StatusCode(500, ApiResponse.Fail($"Failed to record payment: {ex.Message}"));
        }
    }
    #endregion

    #region 7. Allocate Customer Advance to Invoices
    /// <summary>
    /// Apply customer advance balance to outstanding credit invoices
    /// </summary>
    [HttpPost("{id}/advances/allocate")]
    public async Task<IActionResult> AllocateAdvance(string id, [FromBody] AllocateAdvanceRequest req)
    {
        if (req.Allocations == null || req.Allocations.Count == 0)
        {
            return BadRequest(ApiResponse.Fail("Please specify at least one invoice allocation."));
        }

        var totalToApply = Math.Round(req.Allocations.Sum(a => a.Amount), 2);
        if (totalToApply <= 0)
        {
            return BadRequest(ApiResponse.Fail("Allocation amount must be greater than zero."));
        }

        using var dbTransaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var customer = await _db.Customers.FirstOrDefaultAsync(c => c.Id == id);
            if (customer == null)
            {
                await dbTransaction.RollbackAsync();
                return NotFound(ApiResponse.Fail("Customer not found."));
            }

            if (customer.AdvanceBalance < totalToApply - 0.01)
            {
                await dbTransaction.RollbackAsync();
                return BadRequest(ApiResponse.Fail($"Allocation amount (Rs. {totalToApply:N2}) exceeds available advance balance (Rs. {customer.AdvanceBalance:N2})."));
            }

            var settledBillNumbers = new List<string>();

            foreach (var alloc in req.Allocations)
            {
                if (alloc.Amount <= 0) continue;
                var bill = await _db.Bills.FirstOrDefaultAsync(b => b.Id == alloc.BillId);
                if (bill != null && bill.BalanceDue > 0)
                {
                    var applyAmt = Math.Min(alloc.Amount, bill.BalanceDue);
                    bill.AmountPaid = Math.Round(bill.AmountPaid + applyAmt, 2);
                    bill.BalanceDue = Math.Max(0, Math.Round(bill.GrandTotal - bill.AmountPaid, 2));
                    bill.OutstandingAmount = bill.BalanceDue;
                    bill.PaymentStatus = bill.BalanceDue <= 0.01 ? "PAID" : "PARTIAL";

                    AppendBillPaymentRecord(bill, applyAmt, "ADVANCE_ADJUSTMENT", $"ADV-APPLY-{bill.BillNumber}", req.AuthorizedBy, "Advance applied");
                    settledBillNumbers.Add(bill.BillNumber);
                }
            }

            // Deduct advance balance and outstanding
            customer.AdvanceBalance = Math.Max(0, Math.Round(customer.AdvanceBalance - totalToApply, 2));
            customer.CurrentOutstanding = Math.Max(0, Math.Round(customer.CurrentOutstanding - totalToApply, 2));
            customer.UpdatedAt = DateTime.UtcNow;

            // Post Ledger entry
            var ledgerEntry = new CustomerLedgerEntry
            {
                HotelId = customer.HotelId,
                CustomerId = customer.Id,
                EntryDate = DateTime.UtcNow,
                Description = $"Advance payment applied against {string.Join(", ", settledBillNumbers)} {(string.IsNullOrWhiteSpace(req.Notes) ? "" : $"· {req.Notes.Trim()}")}",
                DebitAmount = 0,
                CreditAmount = totalToApply,
                Balance = customer.CurrentOutstanding,
                ReferenceType = "ADVANCE_ADJUSTMENT",
                ReferenceId = $"ADV-{Guid.NewGuid():N}"[..10].ToUpper(),
                PaymentMode = "ADVANCE",
                Outlet = customer.BranchOrOutlet ?? "RESTAURANT",
                PaymentStatus = "PAID",
                CreatedBy = req.AuthorizedBy ?? "Accountant",
                CreatedAt = DateTime.UtcNow
            };

            _db.CustomerLedgers.Add(ledgerEntry);

            // Post Journal Entry: Debit Customer Advance Deposit (2020), Credit Accounts Receivable (1100)
            await PostAdvanceAllocationJournalEntryAsync(_db, customer, totalToApply, string.Join(", ", settledBillNumbers), req.AuthorizedBy ?? "Accountant");

            await _db.SaveChangesAsync();
            await dbTransaction.CommitAsync();

            return Ok(ApiResponse.Ok(new
            {
                appliedAmount = totalToApply,
                newAdvanceBalance = customer.AdvanceBalance,
                newOutstanding = customer.CurrentOutstanding,
                settledBills = settledBillNumbers,
                message = $"Successfully allocated Rs. {totalToApply:N2} advance."
            }));
        }
        catch (Exception ex)
        {
            await dbTransaction.RollbackAsync();
            return StatusCode(500, ApiResponse.Fail($"Failed to allocate advance: {ex.Message}"));
        }
    }
    #endregion

    #region 8. Customer Account Adjustments (Debit / Credit Notes)
    /// <summary>
    /// Controlled Debit or Credit adjustment for customer ledger with audit trail and journal entry
    /// </summary>
    [HttpPost("{id}/adjustments")]
    public async Task<IActionResult> CreateAdjustment(string id, [FromBody] AccountAdjustmentRequest req)
    {
        if (req.Amount <= 0)
        {
            return BadRequest(ApiResponse.Fail("Adjustment amount must be greater than zero."));
        }

        if (string.IsNullOrWhiteSpace(req.Reason))
        {
            return BadRequest(ApiResponse.Fail("An adjustment reason is mandatory."));
        }

        var adjType = (req.AdjustmentType ?? "CREDIT").Trim().ToUpper();
        if (adjType != "DEBIT" && adjType != "CREDIT")
        {
            return BadRequest(ApiResponse.Fail("AdjustmentType must be DEBIT or CREDIT."));
        }

        using var dbTransaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var customer = await _db.Customers.FirstOrDefaultAsync(c => c.Id == id);
            if (customer == null)
            {
                await dbTransaction.RollbackAsync();
                return NotFound(ApiResponse.Fail("Customer not found."));
            }

            var refNumber = string.IsNullOrWhiteSpace(req.ReferenceNumber)
                ? $"ADJ-{DateTime.UtcNow:yyMMdd}-{Random.Shared.Next(1000, 9999)}"
                : req.ReferenceNumber.Trim();

            var amt = Math.Round(req.Amount, 2);

            if (adjType == "DEBIT")
            {
                // DEBIT increases customer balance
                customer.CurrentOutstanding = Math.Round(customer.CurrentOutstanding + amt, 2);

                _db.CustomerLedgers.Add(new CustomerLedgerEntry
                {
                    HotelId = customer.HotelId,
                    CustomerId = customer.Id,
                    EntryDate = DateTime.UtcNow,
                    Description = $"Debit Adjustment: {req.Reason.Trim()}",
                    DebitAmount = amt,
                    CreditAmount = 0,
                    Balance = customer.CurrentOutstanding,
                    ReferenceType = "DEBIT_NOTE",
                    ReferenceId = refNumber,
                    Outlet = customer.BranchOrOutlet ?? "RESTAURANT",
                    CreatedBy = req.ApprovedBy ?? "Admin",
                    CreatedAt = DateTime.UtcNow
                });

                // Journal: Debit Accounts Receivable (1100), Credit Other Revenue (4900)
                await PostAdjustmentJournalEntryAsync(_db, customer, amt, true, req.Reason, refNumber, req.ApprovedBy ?? "Admin");
            }
            else
            {
                // CREDIT decreases customer balance
                customer.CurrentOutstanding = Math.Max(0, Math.Round(customer.CurrentOutstanding - amt, 2));

                _db.CustomerLedgers.Add(new CustomerLedgerEntry
                {
                    HotelId = customer.HotelId,
                    CustomerId = customer.Id,
                    EntryDate = DateTime.UtcNow,
                    Description = $"Credit Adjustment: {req.Reason.Trim()}",
                    DebitAmount = 0,
                    CreditAmount = amt,
                    Balance = customer.CurrentOutstanding,
                    ReferenceType = "CREDIT_NOTE",
                    ReferenceId = refNumber,
                    Outlet = customer.BranchOrOutlet ?? "RESTAURANT",
                    CreatedBy = req.ApprovedBy ?? "Admin",
                    CreatedAt = DateTime.UtcNow
                });

                // Journal: Debit Discount / Bad Debt Expense (5700), Credit Accounts Receivable (1100)
                await PostAdjustmentJournalEntryAsync(_db, customer, amt, false, req.Reason, refNumber, req.ApprovedBy ?? "Admin");
            }

            customer.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            await dbTransaction.CommitAsync();

            return Ok(ApiResponse.Ok(new
            {
                adjustmentType = adjType,
                amount = amt,
                refNumber,
                newOutstanding = customer.CurrentOutstanding,
                message = $"{adjType} adjustment of Rs. {amt:N2} approved and posted."
            }));
        }
        catch (Exception ex)
        {
            await dbTransaction.RollbackAsync();
            return StatusCode(500, ApiResponse.Fail($"Failed to create adjustment: {ex.Message}"));
        }
    }
    #endregion

    #region 9. Customer Aging Analysis
    /// <summary>
    /// Calculate customer receivables aging breakdown based on invoice due dates
    /// </summary>
    [HttpGet("{id}/aging")]
    public async Task<IActionResult> GetCustomerAging(string id)
    {
        var customer = await _db.Customers.FindAsync(id);
        if (customer == null)
        {
            return NotFound(ApiResponse.Fail("Customer not found."));
        }

        var openBills = await _db.Bills
            .AsNoTracking()
            .Where(b => (b.CustomerId == id || b.CustomerPhone == customer.Phone) &&
                        (b.PaymentStatus == "CREDIT" || b.PaymentStatus == "PARTIAL" || b.PaymentStatus == "UNPAID") &&
                        b.TransactionStatus != "CANCELLED" &&
                        b.BalanceDue > 0)
            .OrderBy(b => b.CreatedAt)
            .ToListAsync();

        var today = DateTime.UtcNow.Date;
        double currentNotDue = 0;
        double days1To30 = 0;
        double days31To60 = 0;
        double days61To90 = 0;
        double above90Days = 0;

        var invoiceAgingList = new List<object>();

        foreach (var bill in openBills)
        {
            var dueDate = bill.CreatedAt.AddDays(customer.CreditTerms);
            var daysOverdue = (today - dueDate.Date).Days;
            string bucket;

            if (daysOverdue <= 0)
            {
                bucket = "CURRENT";
                currentNotDue += bill.BalanceDue;
            }
            else if (daysOverdue <= 30)
            {
                bucket = "1_30_DAYS";
                days1To30 += bill.BalanceDue;
            }
            else if (daysOverdue <= 60)
            {
                bucket = "31_60_DAYS";
                days31To60 += bill.BalanceDue;
            }
            else if (daysOverdue <= 90)
            {
                bucket = "61_90_DAYS";
                days61To90 += bill.BalanceDue;
            }
            else
            {
                bucket = "ABOVE_90_DAYS";
                above90Days += bill.BalanceDue;
            }

            invoiceAgingList.Add(new
            {
                billId = bill.Id,
                billNumber = bill.BillNumber,
                orderNumber = bill.OrderNumber,
                invoiceDate = bill.CreatedAt,
                dueDate,
                grandTotal = bill.GrandTotal,
                amountPaid = bill.AmountPaid,
                balanceDue = bill.BalanceDue,
                daysOverdue = Math.Max(0, daysOverdue),
                agingBucket = bucket
            });
        }

        return Ok(ApiResponse.Ok(new
        {
            customer = new
            {
                customer.Id,
                customer.Name,
                customer.Phone,
                customer.CreditLimit,
                customer.CreditTerms,
                customer.CurrentOutstanding,
                customer.AdvanceBalance
            },
            agingSummary = new
            {
                currentNotDue = Math.Round(currentNotDue, 2),
                days1To30 = Math.Round(days1To30, 2),
                days31To60 = Math.Round(days31To60, 2),
                days61To90 = Math.Round(days61To90, 2),
                above90Days = Math.Round(above90Days, 2),
                totalOverdue = Math.Round(days1To30 + days31To60 + days61To90 + above90Days, 2),
                totalReceivable = Math.Round(customer.CurrentOutstanding, 2)
            },
            invoices = invoiceAgingList
        }));
    }
    #endregion

    #region 10. Customer Statement (Print / Export Ready)
    /// <summary>
    /// Generate complete statement of account for customer statement printing & export
    /// </summary>
    [HttpGet("{id}/statement")]
    public async Task<IActionResult> GetCustomerStatement(
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

        var hotel = await _db.Hotels.FindAsync(customer.HotelId) ?? await _db.Hotels.FirstOrDefaultAsync();

        var start = startDate ?? DateTime.UtcNow.AddMonths(-1);
        var end = endDate ?? DateTime.UtcNow;

        var ledgerResult = await GetCustomerLedger(id, start, end, "ALL", "ALL", false) as OkObjectResult;
        var ledgerData = ledgerResult?.Value;

        return Ok(ApiResponse.Ok(new
        {
            hotel = new
            {
                name = hotel?.Name ?? "Everest Family Restaurant & Resort",
                address = hotel?.Address ?? "Lakeside Boulevard, Pokhara",
                phone = "+977-61-460123",
                email = "accounts@everestfamilyrestaurant.com",
                panVat = "PAN-601948203",
                currency = hotel?.Currency ?? "NPR",
                currencySymbol = "Rs."
            },
            statementPeriod = new
            {
                startDate = start,
                endDate = end
            },
            ledger = ledgerData
        }));
    }
    #endregion

    #region 11. Manager Override
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
    #endregion

    #region Helpers & Accounting Postings
    private static void AppendBillPaymentRecord(Bill bill, double amount, string paymentMode, string refNumber, string? receivedBy, string? notes)
    {
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
            amount = amount,
            paymentMethod = paymentMode,
            paymentDate = DateTime.UtcNow,
            transactionRef = refNumber,
            receivedBy = receivedBy ?? "Cashier",
            notes = notes ?? "Customer Ledger Payment"
        });

        bill.PaymentsJson = JsonSerializer.Serialize(payments);
        bill.UpdatedAt = DateTime.UtcNow;
    }

    private static async Task PostCustomerPaymentJournalEntryAsync(
        HospitalityDbContext db,
        Customer customer,
        double totalAmount,
        double allocatedAmount,
        double advanceAmount,
        string pMode,
        string paymentRef,
        string receivedBy)
    {
        var accounts = await db.Accounts.Where(a => a.HotelId == customer.HotelId).ToListAsync();
        if (accounts.Count == 0)
        {
            accounts = AccountsController.GetStandardHospitalityAccounts(customer.HotelId);
            db.Accounts.AddRange(accounts);
            await db.SaveChangesAsync();
        }

        var cashAccount = accounts.FirstOrDefault(a => a.AccountCode == "1020") ?? accounts.FirstOrDefault(a => a.AccountCode == "1010") ?? accounts[0];
        var bankAccount = accounts.FirstOrDefault(a => a.AccountCode == "1050") ?? cashAccount;
        var clearingAccount = accounts.FirstOrDefault(a => a.AccountCode == "1060") ?? cashAccount;
        var arAccount = accounts.FirstOrDefault(a => a.AccountCode == "1100") ?? accounts.FirstOrDefault(a => a.AccountCode == "1110") ?? cashAccount;
        var advanceAccount = accounts.FirstOrDefault(a => a.AccountCode == "2020") ?? arAccount;

        var targetPaymentAcc = pMode switch
        {
            "CASH" => cashAccount,
            "CARD" or "UPI" or "ONLINE" or "WALLET" => clearingAccount,
            "BANK" or "BANK_TRANSFER" => bankAccount,
            _ => cashAccount
        };

        var year = DateTime.UtcNow.Year;
        var prefix = $"JV-{year}-";
        var countThisYear = await db.JournalEntries.CountAsync(j => j.EntryNumber.StartsWith(prefix));
        var entryNumber = $"{prefix}{(countThisYear + 1):D4}";

        var entry = new JournalEntry
        {
            HotelId = customer.HotelId,
            EntryNumber = entryNumber,
            EntryDate = DateTime.UtcNow,
            EntryType = "GENERAL",
            Reference = paymentRef,
            Description = $"Customer Receipt {paymentRef} from {customer.Name} ({customer.CustomerCode}) via {pMode}",
            SourceModule = "CUSTOMER_RECEIPT",
            SourceTransactionId = customer.Id,
            CreatedBy = receivedBy,
            PostedBy = receivedBy,
            PostedAt = DateTime.UtcNow,
            Status = "POSTED",
            TotalDebit = totalAmount,
            TotalCredit = totalAmount,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // 1. Debit Payment Account (Cash / Bank / Clearing)
        entry.Lines.Add(new JournalEntryLine
        {
            JournalEntryId = entry.Id,
            AccountId = targetPaymentAcc.Id,
            AccountCode = targetPaymentAcc.AccountCode,
            AccountName = targetPaymentAcc.AccountName,
            LineDescription = $"Receipt via {pMode} from {customer.Name}",
            Debit = totalAmount,
            Credit = 0
        });
        ApplyAccountDelta(targetPaymentAcc, totalAmount, 0);

        // 2. Credit Accounts Receivable (Allocated portion)
        if (allocatedAmount > 0)
        {
            entry.Lines.Add(new JournalEntryLine
            {
                JournalEntryId = entry.Id,
                AccountId = arAccount.Id,
                AccountCode = arAccount.AccountCode,
                AccountName = arAccount.AccountName,
                LineDescription = $"Settlement of Accounts Receivable for {customer.Name}",
                Debit = 0,
                Credit = allocatedAmount
            });
            ApplyAccountDelta(arAccount, 0, allocatedAmount);
        }

        // 3. Credit Customer Advance Deposit Liability (Unallocated advance portion)
        if (advanceAmount > 0)
        {
            entry.Lines.Add(new JournalEntryLine
            {
                JournalEntryId = entry.Id,
                AccountId = advanceAccount.Id,
                AccountCode = advanceAccount.AccountCode,
                AccountName = advanceAccount.AccountName,
                LineDescription = $"Customer Advance Deposit held for {customer.Name}",
                Debit = 0,
                Credit = advanceAmount
            });
            ApplyAccountDelta(advanceAccount, 0, advanceAmount);
        }

        db.JournalEntries.Add(entry);
    }

    private static async Task PostAdvanceAllocationJournalEntryAsync(
        HospitalityDbContext db,
        Customer customer,
        double amount,
        string billRefs,
        string authorizedBy)
    {
        var accounts = await db.Accounts.Where(a => a.HotelId == customer.HotelId).ToListAsync();
        var arAccount = accounts.FirstOrDefault(a => a.AccountCode == "1100") ?? accounts.FirstOrDefault(a => a.AccountCode == "1110") ?? accounts[0];
        var advanceAccount = accounts.FirstOrDefault(a => a.AccountCode == "2020") ?? arAccount;

        var year = DateTime.UtcNow.Year;
        var prefix = $"JV-{year}-";
        var countThisYear = await db.JournalEntries.CountAsync(j => j.EntryNumber.StartsWith(prefix));
        var entryNumber = $"{prefix}{(countThisYear + 1):D4}";

        var entry = new JournalEntry
        {
            HotelId = customer.HotelId,
            EntryNumber = entryNumber,
            EntryDate = DateTime.UtcNow,
            EntryType = "ADJUSTMENT",
            Reference = $"ADV-ALLOC-{customer.CustomerCode}",
            Description = $"Application of Advance Deposit against {billRefs} for {customer.Name}",
            SourceModule = "CUSTOMER_ADVANCE",
            SourceTransactionId = customer.Id,
            CreatedBy = authorizedBy,
            PostedBy = authorizedBy,
            PostedAt = DateTime.UtcNow,
            Status = "POSTED",
            TotalDebit = amount,
            TotalCredit = amount,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Debit: Customer Advance Deposit Liability (2020)
        entry.Lines.Add(new JournalEntryLine
        {
            JournalEntryId = entry.Id,
            AccountId = advanceAccount.Id,
            AccountCode = advanceAccount.AccountCode,
            AccountName = advanceAccount.AccountName,
            LineDescription = $"Advance deposit cleared for {customer.Name}",
            Debit = amount,
            Credit = 0
        });
        ApplyAccountDelta(advanceAccount, amount, 0);

        // Credit: Accounts Receivable (1100)
        entry.Lines.Add(new JournalEntryLine
        {
            JournalEntryId = entry.Id,
            AccountId = arAccount.Id,
            AccountCode = arAccount.AccountCode,
            AccountName = arAccount.AccountName,
            LineDescription = $"Receivable settled from advance for {customer.Name}",
            Debit = 0,
            Credit = amount
        });
        ApplyAccountDelta(arAccount, 0, amount);

        db.JournalEntries.Add(entry);
    }

    private static async Task PostAdjustmentJournalEntryAsync(
        HospitalityDbContext db,
        Customer customer,
        double amount,
        bool isDebit,
        string reason,
        string refNumber,
        string approvedBy)
    {
        var accounts = await db.Accounts.Where(a => a.HotelId == customer.HotelId).ToListAsync();
        var arAccount = accounts.FirstOrDefault(a => a.AccountCode == "1100") ?? accounts.FirstOrDefault(a => a.AccountCode == "1110") ?? accounts[0];
        var otherIncomeAccount = accounts.FirstOrDefault(a => a.AccountCode == "4900") ?? accounts.FirstOrDefault(a => a.AccountType == "REVENUE") ?? accounts[0];
        var discountExpenseAccount = accounts.FirstOrDefault(a => a.AccountCode == "5700") ?? accounts.FirstOrDefault(a => a.AccountType == "EXPENSE") ?? accounts[0];

        var year = DateTime.UtcNow.Year;
        var prefix = $"JV-{year}-";
        var countThisYear = await db.JournalEntries.CountAsync(j => j.EntryNumber.StartsWith(prefix));
        var entryNumber = $"{prefix}{(countThisYear + 1):D4}";

        var entry = new JournalEntry
        {
            HotelId = customer.HotelId,
            EntryNumber = entryNumber,
            EntryDate = DateTime.UtcNow,
            EntryType = "ADJUSTMENT",
            Reference = refNumber,
            Description = $"Customer Account Adjustment ({ (isDebit ? "Debit" : "Credit") }): {reason} - {customer.Name}",
            SourceModule = "CUSTOMER_ADJUSTMENT",
            SourceTransactionId = customer.Id,
            CreatedBy = approvedBy,
            PostedBy = approvedBy,
            PostedAt = DateTime.UtcNow,
            Status = "POSTED",
            TotalDebit = amount,
            TotalCredit = amount,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        if (isDebit)
        {
            // Debit: Accounts Receivable (1100), Credit: Other Revenue (4900)
            entry.Lines.Add(new JournalEntryLine
            {
                JournalEntryId = entry.Id,
                AccountId = arAccount.Id,
                AccountCode = arAccount.AccountCode,
                AccountName = arAccount.AccountName,
                LineDescription = $"Debit Adjustment on {customer.Name}",
                Debit = amount,
                Credit = 0
            });
            ApplyAccountDelta(arAccount, amount, 0);

            entry.Lines.Add(new JournalEntryLine
            {
                JournalEntryId = entry.Id,
                AccountId = otherIncomeAccount.Id,
                AccountCode = otherIncomeAccount.AccountCode,
                AccountName = otherIncomeAccount.AccountName,
                LineDescription = $"Adjustment fee/income from {customer.Name}",
                Debit = 0,
                Credit = amount
            });
            ApplyAccountDelta(otherIncomeAccount, 0, amount);
        }
        else
        {
            // Debit: Discount / Bad Debt Expense (5700), Credit: Accounts Receivable (1100)
            entry.Lines.Add(new JournalEntryLine
            {
                JournalEntryId = entry.Id,
                AccountId = discountExpenseAccount.Id,
                AccountCode = discountExpenseAccount.AccountCode,
                AccountName = discountExpenseAccount.AccountName,
                LineDescription = $"Credit Adjustment / write-off for {customer.Name}",
                Debit = amount,
                Credit = 0
            });
            ApplyAccountDelta(discountExpenseAccount, amount, 0);

            entry.Lines.Add(new JournalEntryLine
            {
                JournalEntryId = entry.Id,
                AccountId = arAccount.Id,
                AccountCode = arAccount.AccountCode,
                AccountName = arAccount.AccountName,
                LineDescription = $"Reduction of receivable for {customer.Name}",
                Debit = 0,
                Credit = amount
            });
            ApplyAccountDelta(arAccount, 0, amount);
        }

        db.JournalEntries.Add(entry);
    }

    private static void ApplyAccountDelta(Account acc, double debit, double credit)
    {
        if (acc.NormalBalance == "DEBIT")
        {
            acc.CurrentBalance += (debit - credit);
        }
        else
        {
            acc.CurrentBalance += (credit - debit);
        }
    }
    #endregion
}

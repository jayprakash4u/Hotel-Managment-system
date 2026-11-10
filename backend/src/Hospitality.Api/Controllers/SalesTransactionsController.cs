using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/sales-transactions")]
[Route("api/accounts/sales-transactions")]
public class SalesTransactionsController : ControllerBase
{
    private readonly HospitalityDbContext _db;

    public SalesTransactionsController(HospitalityDbContext db)
    {
        _db = db;
    }

    #region DTOs
    public record SalesItemDto(
        string? ProductId,
        string Name,
        int Quantity,
        double UnitPrice,
        double DiscountAmount,
        string? Notes
    );

    public record SalesPaymentRecordDto(
        string Id,
        double Amount,
        string PaymentMethod,
        DateTime PaymentDate,
        string? TransactionRef,
        string? ReceivedBy,
        string? Notes
    );

    public record SalesReturnItemDto(
        string Name,
        int Quantity,
        double UnitPrice,
        string? Reason,
        bool RestockInventory
    );

    public record SalesReturnRecordDto(
        string ReturnId,
        DateTime ReturnDate,
        string ReturnedBy,
        string Reason,
        double ReturnSubtotal,
        double ReturnTax,
        double TotalRefundAmount,
        List<SalesReturnItemDto> Items
    );

    public record CreateSalesTransactionRequest(
        string? CustomerId,
        string? CustomerName,
        string? CustomerPhone,
        string? CustomerAddress,
        string? SalesChannel, // POS, DINE_IN, TAKEAWAY, DELIVERY, ONLINE, ROOM_SERVICE
        string? Outlet, // RESTAURANT, ROOFTOP_BAR, ZENITH_SPA, ROOM_SERVICE
        string? TableNumber,
        string? RoomNumber,
        string? CashierOrStaff,
        List<SalesItemDto> Items,
        double? InvoiceDiscountAmount,
        double? TaxRatePercent, // Default 10%
        double? ServiceChargePercent, // Default 5%
        double? DeliveryCharge,
        double? PackingCharge,
        List<SalesPaymentRecordDto>? Payments,
        string? Notes
    );

    public record RecordPaymentRequest(
        double Amount,
        string PaymentMethod,
        string? TransactionRef,
        string? ReceivedBy,
        string? Notes,
        string? IdempotencyKey
    );

    public record ProcessReturnRequest(
        List<SalesReturnItemDto> ReturnItems,
        string Reason,
        string? AuthorizedBy,
        string? RefundPaymentMethod // CASH, BANK, CREDIT_NOTE
    );

    public record CancelTransactionRequest(
        string Reason,
        string? AuthorizedBy
    );
    #endregion

    #region 1. List Sales Transactions with Filters & Summary
    /// <summary>
    /// Get paginated list of sales transactions with comprehensive ERP filters and KPI summary
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetSalesTransactions(
        [FromQuery] string? search,
        [FromQuery] string? salesChannel,
        [FromQuery] string? outlet,
        [FromQuery] string? paymentMethod,
        [FromQuery] string? paymentStatus,
        [FromQuery] string? transactionStatus,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] string? sortBy = "createdAt",
        [FromQuery] string? sortOrder = "desc")
    {
        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? "";

        var query = _db.Bills.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(hotelId))
        {
            query = query.Where(b => b.HotelId == hotelId);
        }

        // Search across invoice, order, customer name, phone, table, room, cashier
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(b =>
                b.BillNumber.ToLower().Contains(s) ||
                (b.OrderNumber != null && b.OrderNumber.ToLower().Contains(s)) ||
                (b.CustomerName != null && b.CustomerName.ToLower().Contains(s)) ||
                (b.CustomerPhone != null && b.CustomerPhone.ToLower().Contains(s)) ||
                (b.TableNumber != null && b.TableNumber.ToLower().Contains(s)) ||
                (b.RoomNumber != null && b.RoomNumber.ToLower().Contains(s)) ||
                (b.ServerOrStaff != null && b.ServerOrStaff.ToLower().Contains(s))
            );
        }

        // Sales Channel Filter
        if (!string.IsNullOrWhiteSpace(salesChannel) && salesChannel.ToUpper() != "ALL")
        {
            var ch = salesChannel.Trim().ToUpper();
            query = query.Where(b => b.SalesChannel.ToUpper() == ch || b.BillingType.ToUpper() == ch);
        }

        // Outlet Filter
        if (!string.IsNullOrWhiteSpace(outlet) && outlet.ToUpper() != "ALL")
        {
            var ot = outlet.Trim().ToUpper();
            query = query.Where(b => b.Outlet.ToUpper() == ot);
        }

        // Payment Method Filter
        if (!string.IsNullOrWhiteSpace(paymentMethod) && paymentMethod.ToUpper() != "ALL")
        {
            var pm = paymentMethod.Trim().ToUpper();
            query = query.Where(b => b.PaymentMethod.ToUpper() == pm);
        }

        // Payment Status Filter
        if (!string.IsNullOrWhiteSpace(paymentStatus) && paymentStatus.ToUpper() != "ALL")
        {
            var ps = paymentStatus.Trim().ToUpper();
            query = query.Where(b => b.PaymentStatus.ToUpper() == ps);
        }

        // Transaction Status Filter
        if (!string.IsNullOrWhiteSpace(transactionStatus) && transactionStatus.ToUpper() != "ALL")
        {
            var ts = transactionStatus.Trim().ToUpper();
            query = query.Where(b => b.TransactionStatus.ToUpper() == ts);
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

        // Aggregate Summary Cards (avoiding cancelled/void sales)
        var validSalesQuery = query.Where(b => b.TransactionStatus != "CANCELLED" && b.PaymentStatus != "VOID");

        var totalSales = await validSalesQuery.SumAsync(b => b.GrandTotal);
        var totalInvoices = await query.CountAsync();
        var paidSales = await validSalesQuery.SumAsync(b => b.AmountPaid);
        var unpaidSales = await validSalesQuery.Where(b => b.BalanceDue > 0).SumAsync(b => b.BalanceDue);
        var partiallyPaidCount = await validSalesQuery.Where(b => b.PaymentStatus == "PARTIAL").CountAsync();
        var salesReturnsCount = await query.Where(b => b.TransactionStatus == "RETURNED" || b.TransactionStatus == "PARTIALLY_RETURNED").CountAsync();
        var refundAmount = await query.SumAsync(b => b.RefundAmount);
        var netSales = Math.Max(0, Math.Round(totalSales - refundAmount, 2));

        // Pagination & Sorting
        var safePage = Math.Max(1, page);
        var safePageSize = Math.Clamp(pageSize, 1, 200);

        var isAsc = sortOrder?.ToLower() == "asc";
        query = (sortBy?.ToLower()) switch
        {
            "invoicenumber" or "billnumber" => isAsc ? query.OrderBy(b => b.BillNumber) : query.OrderByDescending(b => b.BillNumber),
            "grandtotal" => isAsc ? query.OrderBy(b => b.GrandTotal) : query.OrderByDescending(b => b.GrandTotal),
            "amountpaid" => isAsc ? query.OrderBy(b => b.AmountPaid) : query.OrderByDescending(b => b.AmountPaid),
            "balancedue" => isAsc ? query.OrderBy(b => b.BalanceDue) : query.OrderByDescending(b => b.BalanceDue),
            _ => isAsc ? query.OrderBy(b => b.CreatedAt) : query.OrderByDescending(b => b.CreatedAt)
        };

        var rawBills = await query
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync();

        var items = rawBills.Select(b => new
        {
            id = b.Id,
            hotelId = b.HotelId,
            billNumber = b.BillNumber,
            billingType = b.BillingType,
            salesChannel = string.IsNullOrWhiteSpace(b.SalesChannel) ? b.BillingType : b.SalesChannel,
            outlet = string.IsNullOrWhiteSpace(b.Outlet) ? "RESTAURANT" : b.Outlet,
            orderId = b.OrderId,
            orderNumber = b.OrderNumber,
            tableNumber = b.TableNumber,
            roomNumber = b.RoomNumber,
            serverOrStaff = b.ServerOrStaff ?? "Cashier",
            customerId = b.CustomerId,
            customerName = string.IsNullOrWhiteSpace(b.CustomerName) ? "Walk-in Customer" : b.CustomerName,
            customerPhone = b.CustomerPhone,
            subtotal = b.Subtotal,
            discountAmount = b.DiscountAmount,
            discountPercent = b.DiscountPercent,
            taxAmount = b.TaxAmount,
            serviceCharge = b.ServiceCharge,
            deliveryCharge = b.DeliveryCharge,
            packingCharge = b.PackingCharge,
            roundOff = b.RoundOff,
            grandTotal = b.GrandTotal,
            amountPaid = b.AmountPaid,
            balanceDue = b.BalanceDue,
            refundAmount = b.RefundAmount,
            paymentStatus = b.PaymentStatus,
            paymentMethod = b.PaymentMethod,
            transactionStatus = string.IsNullOrWhiteSpace(b.TransactionStatus) ? "COMPLETED" : b.TransactionStatus,
            paidAt = b.PaidAt,
            notes = b.Notes,
            createdAt = b.CreatedAt,
            updatedAt = b.UpdatedAt,
            itemsCount = CountItemsInJson(b.ItemsJson)
        }).ToList();

        return Ok(ApiResponse.Ok(new
        {
            items,
            totalItems = totalInvoices,
            page = safePage,
            pageSize = safePageSize,
            totalPages = (int)Math.Ceiling(totalInvoices / (double)safePageSize),
            summary = new
            {
                totalSales = Math.Round(totalSales, 2),
                totalInvoices,
                paidSales = Math.Round(paidSales, 2),
                unpaidSales = Math.Round(unpaidSales, 2),
                partiallyPaidCount,
                salesReturnsCount,
                refundAmount = Math.Round(refundAmount, 2),
                netSales
            }
        }));
    }
    #endregion

    #region 2. Get Transaction Details (with Items, Payments, Returns & Journal Entry)
    /// <summary>
    /// View detailed sales transaction including line items, payments, returns, and double-entry accounting lines
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetSalesTransactionById(string id)
    {
        var bill = await _db.Bills.FirstOrDefaultAsync(b => b.Id == id || b.BillNumber == id);
        if (bill == null)
        {
            return NotFound(ApiResponse.Fail($"Sales transaction '{id}' not found."));
        }

        var hotel = await _db.Hotels.FindAsync(bill.HotelId) ?? await _db.Hotels.FirstOrDefaultAsync();

        // Customer details if any
        Customer? customer = null;
        if (!string.IsNullOrWhiteSpace(bill.CustomerId))
        {
            customer = await _db.Customers.AsNoTracking().FirstOrDefaultAsync(c => c.Id == bill.CustomerId);
        }

        // Linked Journal Entry (Accounting Audit Trail)
        var journalEntry = await _db.JournalEntries
            .AsNoTracking()
            .Include(j => j.Lines)
            .Where(j => j.SourceTransactionId == bill.Id || j.Reference == bill.BillNumber)
            .OrderByDescending(j => j.CreatedAt)
            .FirstOrDefaultAsync();

        // Linked Restaurant Order if any
        RestaurantOrder? order = null;
        if (!string.IsNullOrWhiteSpace(bill.OrderId))
        {
            order = await _db.RestaurantOrders.AsNoTracking().FirstOrDefaultAsync(o => o.Id == bill.OrderId);
        }

        object itemsParsed;
        try
        {
            itemsParsed = JsonSerializer.Deserialize<object>(bill.ItemsJson) ?? new List<object>();
        }
        catch
        {
            itemsParsed = new List<object>();
        }

        object paymentsParsed;
        try
        {
            paymentsParsed = JsonSerializer.Deserialize<object>(bill.PaymentsJson) ?? new List<object>();
        }
        catch
        {
            paymentsParsed = new List<object>();
        }

        object returnsParsed;
        try
        {
            returnsParsed = JsonSerializer.Deserialize<object>(bill.ReturnsJson) ?? new List<object>();
        }
        catch
        {
            returnsParsed = new List<object>();
        }

        return Ok(ApiResponse.Ok(new
        {
            transaction = new
            {
                id = bill.Id,
                hotelId = bill.HotelId,
                billNumber = bill.BillNumber,
                billingType = bill.BillingType,
                salesChannel = string.IsNullOrWhiteSpace(bill.SalesChannel) ? bill.BillingType : bill.SalesChannel,
                outlet = string.IsNullOrWhiteSpace(bill.Outlet) ? "RESTAURANT" : bill.Outlet,
                orderId = bill.OrderId,
                orderNumber = bill.OrderNumber,
                tableNumber = bill.TableNumber,
                roomNumber = bill.RoomNumber,
                serverOrStaff = bill.ServerOrStaff ?? "Cashier",
                customerId = bill.CustomerId,
                customerName = string.IsNullOrWhiteSpace(bill.CustomerName) ? "Walk-in Customer" : bill.CustomerName,
                customerPhone = bill.CustomerPhone,
                customer = customer != null ? new
                {
                    customer.Id,
                    customer.Name,
                    customer.Phone,
                    customer.Address,
                    customer.CustomerType,
                    customer.CurrentOutstanding,
                    customer.CreditLimit
                } : null,
                subtotal = bill.Subtotal,
                discountAmount = bill.DiscountAmount,
                discountPercent = bill.DiscountPercent,
                taxableAmount = Math.Max(0, bill.Subtotal - bill.DiscountAmount),
                taxAmount = bill.TaxAmount,
                serviceCharge = bill.ServiceCharge,
                deliveryCharge = bill.DeliveryCharge,
                packingCharge = bill.PackingCharge,
                roundOff = bill.RoundOff,
                grandTotal = bill.GrandTotal,
                amountPaid = bill.AmountPaid,
                balanceDue = bill.BalanceDue,
                refundAmount = bill.RefundAmount,
                paymentStatus = bill.PaymentStatus,
                paymentMethod = bill.PaymentMethod,
                transactionStatus = string.IsNullOrWhiteSpace(bill.TransactionStatus) ? "COMPLETED" : bill.TransactionStatus,
                cancellationReason = bill.CancellationReason,
                cancelledBy = bill.CancelledBy,
                cancelledAt = bill.CancelledAt,
                returnReason = bill.ReturnReason,
                returnedBy = bill.ReturnedBy,
                returnedAt = bill.ReturnedAt,
                notes = bill.Notes,
                createdAt = bill.CreatedAt,
                updatedAt = bill.UpdatedAt,
                paidAt = bill.PaidAt,
                items = itemsParsed,
                payments = paymentsParsed,
                returns = returnsParsed
            },
            accounting = journalEntry != null ? new
            {
                id = journalEntry.Id,
                entryNumber = journalEntry.EntryNumber,
                entryDate = journalEntry.EntryDate,
                reference = journalEntry.Reference,
                description = journalEntry.Description,
                totalDebit = journalEntry.TotalDebit,
                totalCredit = journalEntry.TotalCredit,
                status = journalEntry.Status,
                lines = journalEntry.Lines.Select(l => new
                {
                    l.Id,
                    l.AccountId,
                    l.AccountCode,
                    l.AccountName,
                    l.LineDescription,
                    l.Debit,
                    l.Credit
                })
            } : null,
            hotel = new
            {
                name = hotel?.Name ?? "Everest Family Restaurant & Resort",
                slug = hotel?.Slug ?? "everest-restaurant",
                address = hotel?.Address ?? "Lakeside Boulevard, Pokhara",
                city = "Pokhara",
                country = "Nepal",
                phone = "+977-61-460123",
                email = "info@everestfamilyrestaurant.com",
                panVat = "PAN-601948203",
                currency = hotel?.Currency ?? "NPR",
                currencySymbol = "Rs."
            }
        }));
    }
    #endregion

    #region 3. Create New Sales Transaction (with Inventory & Accounting)
    /// <summary>
    /// Create a complete sales transaction with automatic stock deduction and balanced journal entries
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateSalesTransaction([FromBody] CreateSalesTransactionRequest req)
    {
        if (req.Items == null || req.Items.Count == 0)
        {
            return BadRequest(ApiResponse.Fail("Sales transaction must contain at least one line item."));
        }

        foreach (var it in req.Items)
        {
            if (it.Quantity <= 0)
            {
                return BadRequest(ApiResponse.Fail($"Invalid quantity ({it.Quantity}) for item '{it.Name}'. Must be at least 1."));
            }
            if (it.UnitPrice < 0)
            {
                return BadRequest(ApiResponse.Fail($"Invalid price ({it.UnitPrice}) for item '{it.Name}'. Price cannot be negative."));
            }
        }

        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? "hotel-default";

        using var dbTransaction = await _db.Database.BeginTransactionAsync();
        try
        {
            // 1. Stock validation & deduction
            foreach (var item in req.Items)
            {
                POSProduct? product = null;
                if (!string.IsNullOrWhiteSpace(item.ProductId))
                {
                    product = await _db.POSProducts.FirstOrDefaultAsync(p => p.Id == item.ProductId);
                }
                if (product == null && !string.IsNullOrWhiteSpace(item.Name))
                {
                    var cleanName = item.Name.Trim().ToLower();
                    product = await _db.POSProducts.FirstOrDefaultAsync(p => p.Name.ToLower() == cleanName);
                }

                if (product != null && product.TrackStock)
                {
                    if (!product.IsAvailable || product.Stock < item.Quantity)
                    {
                        await dbTransaction.RollbackAsync();
                        return BadRequest(ApiResponse.Fail($"Insufficient stock for '{product.Name}'. Available: {product.Stock}, Requested: {item.Quantity}."));
                    }

                    product.Stock -= item.Quantity;
                    if (product.Stock <= 0)
                    {
                        product.Stock = 0;
                        product.IsAvailable = false;
                    }

                    // Also check linked restaurant inventory item
                    var invItem = await _db.InventoryItems.FirstOrDefaultAsync(i =>
                        (product.InventoryItemId != null && i.Id == product.InventoryItemId) ||
                        (i.Department == "RESTAURANT" && i.Name.ToLower() == product.Name.ToLower()));

                    if (invItem != null && invItem.TrackStock)
                    {
                        invItem.CurrentStock = Math.Max(0, invItem.CurrentStock - item.Quantity);
                        invItem.LastRestocked = DateTime.UtcNow;

                        _db.StockMovements.Add(new StockMovement
                        {
                            ItemId = invItem.Id,
                            Department = "RESTAURANT",
                            Quantity = -item.Quantity,
                            Type = "SALES_CONSUMPTION",
                            Reason = $"Direct Sale Consumption - Item: {item.Name}",
                            PerformedBy = req.CashierOrStaff ?? "Cashier",
                            CreatedAt = DateTime.UtcNow
                        });
                    }
                }
            }

            // 2. Financial Calculations
            var rawItemSubtotal = req.Items.Sum(i => i.UnitPrice * i.Quantity);
            var itemDiscounts = req.Items.Sum(i => Math.Max(0, i.DiscountAmount));
            var invoiceDiscount = Math.Max(0, req.InvoiceDiscountAmount ?? 0);
            var totalDiscount = Math.Round(itemDiscounts + invoiceDiscount, 2);

            var subtotalAfterItemDiscounts = Math.Max(0, rawItemSubtotal - itemDiscounts);
            var taxableAmount = Math.Max(0, subtotalAfterItemDiscounts - invoiceDiscount);

            var taxRate = req.TaxRatePercent ?? 10.0; // Default 10% VAT
            var serviceRate = req.ServiceChargePercent ?? 0.0;

            var taxAmount = Math.Round(taxableAmount * (taxRate / 100.0), 2);
            var serviceCharge = Math.Round(taxableAmount * (serviceRate / 100.0), 2);
            var deliveryCharge = Math.Max(0, req.DeliveryCharge ?? 0);
            var packingCharge = Math.Max(0, req.PackingCharge ?? 0);

            var grandTotal = Math.Round(taxableAmount + taxAmount + serviceCharge + deliveryCharge + packingCharge, 2);

            // 3. Payment handling
            var paymentRecords = new List<SalesPaymentRecordDto>();
            double totalPaid = 0;

            if (req.Payments != null && req.Payments.Count > 0)
            {
                foreach (var p in req.Payments)
                {
                    if (p.Amount > 0)
                    {
                        var pAmount = Math.Round(p.Amount, 2);
                        totalPaid += pAmount;
                        paymentRecords.Add(new SalesPaymentRecordDto(
                            Id: $"PAY-{Guid.NewGuid():N}"[..12].ToUpper(),
                            Amount: pAmount,
                            PaymentMethod: string.IsNullOrWhiteSpace(p.PaymentMethod) ? "CASH" : p.PaymentMethod.Trim().ToUpper(),
                            PaymentDate: DateTime.UtcNow,
                            TransactionRef: p.TransactionRef,
                            ReceivedBy: req.CashierOrStaff ?? "Cashier",
                            Notes: p.Notes
                        ));
                    }
                }
            }

            totalPaid = Math.Round(totalPaid, 2);
            var balanceDue = Math.Max(0, Math.Round(grandTotal - totalPaid, 2));

            // Customer resolution
            Customer? customer = null;
            if (!string.IsNullOrWhiteSpace(req.CustomerId))
            {
                customer = await _db.Customers.FirstOrDefaultAsync(c => c.Id == req.CustomerId);
            }
            if (customer == null && !string.IsNullOrWhiteSpace(req.CustomerPhone))
            {
                customer = await _db.Customers.FirstOrDefaultAsync(c => c.Phone == req.CustomerPhone.Trim() && c.HotelId == hotelId);
            }

            var isCredit = balanceDue > 0.01;
            var paymentStatus = balanceDue <= 0.01 ? "PAID" : (totalPaid > 0 ? "PARTIAL" : (isCredit ? "CREDIT" : "UNPAID"));
            var primaryPaymentMethod = paymentRecords.Count switch
            {
                0 => isCredit ? "CREDIT" : "UNPAID",
                1 => paymentRecords[0].PaymentMethod,
                _ => "SPLIT"
            };

            // 4. Generate Unique Sequential Bill Number
            var billNumber = await BillingController.GenerateBillNumberAsync(_db, hotelId);

            var channel = string.IsNullOrWhiteSpace(req.SalesChannel) ? "POS" : req.SalesChannel.Trim().ToUpper();
            var outlet = string.IsNullOrWhiteSpace(req.Outlet) ? "RESTAURANT" : req.Outlet.Trim().ToUpper();

            var bill = new Bill
            {
                HotelId = hotelId,
                BillNumber = billNumber,
                BillingType = channel,
                SalesChannel = channel,
                Outlet = outlet,
                TableNumber = req.TableNumber,
                RoomNumber = req.RoomNumber,
                ServerOrStaff = req.CashierOrStaff ?? "Cashier",
                CustomerId = customer?.Id,
                CustomerName = customer?.Name ?? (string.IsNullOrWhiteSpace(req.CustomerName) ? "Walk-in Customer" : req.CustomerName.Trim()),
                CustomerPhone = customer?.Phone ?? req.CustomerPhone?.Trim(),
                Subtotal = rawItemSubtotal,
                DiscountAmount = totalDiscount,
                DiscountPercent = rawItemSubtotal > 0 ? Math.Round((totalDiscount / rawItemSubtotal) * 100.0, 1) : 0,
                TaxAmount = taxAmount,
                ServiceCharge = serviceCharge,
                DeliveryCharge = deliveryCharge,
                PackingCharge = packingCharge,
                GrandTotal = grandTotal,
                AmountPaid = totalPaid,
                BalanceDue = balanceDue,
                OutstandingAmount = balanceDue,
                PaymentStatus = paymentStatus,
                PaymentMethod = primaryPaymentMethod,
                TransactionStatus = "COMPLETED",
                PaidAt = totalPaid >= grandTotal ? DateTime.UtcNow : null,
                ItemsJson = JsonSerializer.Serialize(req.Items.Select(i => new
                {
                    productId = i.ProductId,
                    name = i.Name,
                    quantity = i.Quantity,
                    unitPrice = i.UnitPrice,
                    discount = i.DiscountAmount,
                    total = Math.Round((i.UnitPrice * i.Quantity) - i.DiscountAmount, 2),
                    notes = i.Notes
                })),
                PaymentsJson = JsonSerializer.Serialize(paymentRecords),
                ReturnsJson = "[]",
                Notes = req.Notes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.Bills.Add(bill);

            // 5. Update Customer Ledger if Credit or Outstanding
            if (customer != null && balanceDue > 0.01)
            {
                customer.CurrentOutstanding = Math.Round(customer.CurrentOutstanding + balanceDue, 2);
                customer.UpdatedAt = DateTime.UtcNow;

                _db.CustomerLedgers.Add(new CustomerLedgerEntry
                {
                    HotelId = hotelId,
                    CustomerId = customer.Id,
                    BillId = bill.Id,
                    EntryDate = DateTime.UtcNow,
                    Description = $"Credit Sale Invoice {bill.BillNumber} ({channel})",
                    DebitAmount = balanceDue,
                    CreditAmount = 0,
                    Balance = customer.CurrentOutstanding,
                    ReferenceType = "INVOICE",
                    ReferenceId = bill.BillNumber,
                    PaymentMode = primaryPaymentMethod,
                    CreatedBy = req.CashierOrStaff ?? "Cashier",
                    CreatedAt = DateTime.UtcNow
                });
            }

            // 6. Update Active Cash Register
            var activeRegister = await _db.CashRegisters
                .Where(r => r.Status == "OPEN")
                .OrderByDescending(r => r.OpenedAt)
                .FirstOrDefaultAsync();

            if (activeRegister != null && paymentRecords.Count > 0)
            {
                foreach (var p in paymentRecords)
                {
                    if (p.PaymentMethod == "CASH")
                        activeRegister.CashSales += p.Amount;
                    else
                        activeRegister.CardSales += p.Amount;
                }
            }

            // 7. Automatic Balanced Double-Entry Journal Posting to General Ledger
            await PostSalesJournalEntryAsync(_db, bill, paymentRecords, taxableAmount, taxAmount, serviceCharge, deliveryCharge + packingCharge, hotelId);

            await _db.SaveChangesAsync();
            await dbTransaction.CommitAsync();

            return Ok(ApiResponse.Ok(new
            {
                id = bill.Id,
                billNumber = bill.BillNumber,
                grandTotal = bill.GrandTotal,
                amountPaid = bill.AmountPaid,
                balanceDue = bill.BalanceDue,
                paymentStatus = bill.PaymentStatus,
                transactionStatus = bill.TransactionStatus
            }, $"Sales transaction {bill.BillNumber} recorded successfully."));
        }
        catch (Exception ex)
        {
            await dbTransaction.RollbackAsync();
            return StatusCode(500, ApiResponse.Fail($"Failed to create sales transaction: {ex.Message}"));
        }
    }
    #endregion

    #region 4. Record Payment against Invoice
    /// <summary>
    /// Record partial or full payment against an existing unpaid or partial sales invoice
    /// </summary>
    [HttpPost("{id}/payments")]
    public async Task<IActionResult> RecordPayment(string id, [FromBody] RecordPaymentRequest req)
    {
        if (req.Amount <= 0)
        {
            return BadRequest(ApiResponse.Fail("Payment amount must be greater than zero."));
        }

        var bill = await _db.Bills.FirstOrDefaultAsync(b => b.Id == id || b.BillNumber == id);
        if (bill == null)
        {
            return NotFound(ApiResponse.Fail($"Sales transaction '{id}' not found."));
        }

        if (bill.TransactionStatus == "CANCELLED" || bill.PaymentStatus == "VOID")
        {
            return BadRequest(ApiResponse.Fail("Cannot record payment on a cancelled or voided transaction."));
        }

        if (bill.BalanceDue <= 0.01)
        {
            return BadRequest(ApiResponse.Fail($"Invoice {bill.BillNumber} is already fully paid."));
        }

        var payAmount = Math.Round(req.Amount, 2);
        if (payAmount > bill.BalanceDue + 0.01)
        {
            return BadRequest(ApiResponse.Fail($"Payment amount (Rs. {payAmount:N2}) exceeds outstanding balance (Rs. {bill.BalanceDue:N2})."));
        }

        using var dbTransaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var payments = new List<SalesPaymentRecordDto>();
            try
            {
                if (!string.IsNullOrWhiteSpace(bill.PaymentsJson))
                {
                    payments = JsonSerializer.Deserialize<List<SalesPaymentRecordDto>>(bill.PaymentsJson) ?? new List<SalesPaymentRecordDto>();
                }
            }
            catch
            {
                payments = new List<SalesPaymentRecordDto>();
            }

            // Duplicate idempotency check
            if (!string.IsNullOrWhiteSpace(req.IdempotencyKey))
            {
                var existing = payments.FirstOrDefault(p => p.TransactionRef == req.IdempotencyKey);
                if (existing != null)
                {
                    await dbTransaction.RollbackAsync();
                    return Ok(ApiResponse.Ok(bill, "Duplicate payment request ignored (already recorded)."));
                }
            }

            var pMethod = string.IsNullOrWhiteSpace(req.PaymentMethod) ? "CASH" : req.PaymentMethod.Trim().ToUpper();

            payments.Add(new SalesPaymentRecordDto(
                Id: $"PAY-{Guid.NewGuid():N}"[..12].ToUpper(),
                Amount: payAmount,
                PaymentMethod: pMethod,
                PaymentDate: DateTime.UtcNow,
                TransactionRef: req.TransactionRef ?? req.IdempotencyKey,
                ReceivedBy: req.ReceivedBy ?? "Cashier",
                Notes: req.Notes
            ));

            bill.AmountPaid = Math.Round(bill.AmountPaid + payAmount, 2);
            bill.BalanceDue = Math.Max(0, Math.Round(bill.GrandTotal - bill.AmountPaid, 2));
            bill.OutstandingAmount = bill.BalanceDue;
            bill.PaymentStatus = bill.BalanceDue <= 0.01 ? "PAID" : "PARTIAL";
            bill.PaymentMethod = payments.Count == 1 ? pMethod : "SPLIT";
            bill.PaymentsJson = JsonSerializer.Serialize(payments);
            bill.UpdatedAt = DateTime.UtcNow;
            if (bill.BalanceDue <= 0.01)
            {
                bill.PaidAt = DateTime.UtcNow;
            }

            // Update Customer Ledger if linked
            if (!string.IsNullOrWhiteSpace(bill.CustomerId))
            {
                var customer = await _db.Customers.FirstOrDefaultAsync(c => c.Id == bill.CustomerId);
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
                        Description = $"Payment received against Invoice {bill.BillNumber} via {pMethod}",
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
            }

            // Post Receipt Journal Entry (Debit: Cash/Bank, Credit: Accounts Receivable)
            await PostReceiptJournalEntryAsync(_db, bill, payAmount, pMethod, req.ReceivedBy ?? "Cashier");

            await _db.SaveChangesAsync();
            await dbTransaction.CommitAsync();

            return Ok(ApiResponse.Ok(new
            {
                id = bill.Id,
                billNumber = bill.BillNumber,
                amountPaid = bill.AmountPaid,
                balanceDue = bill.BalanceDue,
                paymentStatus = bill.PaymentStatus
            }, $"Payment of Rs. {payAmount:N2} recorded successfully via {pMethod}."));
        }
        catch (Exception ex)
        {
            await dbTransaction.RollbackAsync();
            return StatusCode(500, ApiResponse.Fail($"Failed to record payment: {ex.Message}"));
        }
    }
    #endregion

    #region 5. Process Controlled Sales Return & Refund
    /// <summary>
    /// Process controlled full or partial return of sales items, reverse tax, restock inventory and post reversal journal
    /// </summary>
    [HttpPost("{id}/return")]
    public async Task<IActionResult> ProcessReturn(string id, [FromBody] ProcessReturnRequest req)
    {
        if (req.ReturnItems == null || req.ReturnItems.Count == 0)
        {
            return BadRequest(ApiResponse.Fail("Return must specify at least one item to return."));
        }

        if (string.IsNullOrWhiteSpace(req.Reason))
        {
            return BadRequest(ApiResponse.Fail("A return reason is required for audit compliance."));
        }

        var bill = await _db.Bills.FirstOrDefaultAsync(b => b.Id == id || b.BillNumber == id);
        if (bill == null)
        {
            return NotFound(ApiResponse.Fail($"Sales transaction '{id}' not found."));
        }

        if (bill.TransactionStatus == "CANCELLED" || bill.PaymentStatus == "VOID")
        {
            return BadRequest(ApiResponse.Fail("Cannot return a cancelled or voided sale."));
        }

        using var dbTransaction = await _db.Database.BeginTransactionAsync();
        try
        {
            double returnSubtotal = 0;
            foreach (var retItem in req.ReturnItems)
            {
                if (retItem.Quantity <= 0)
                {
                    await dbTransaction.RollbackAsync();
                    return BadRequest(ApiResponse.Fail($"Invalid return quantity for '{retItem.Name}'."));
                }

                returnSubtotal += (retItem.UnitPrice * retItem.Quantity);

                // Inventory restoration if restockable
                if (retItem.RestockInventory)
                {
                    var product = await _db.POSProducts.FirstOrDefaultAsync(p => p.Name.ToLower() == retItem.Name.Trim().ToLower());
                    if (product != null && product.TrackStock)
                    {
                        product.Stock += retItem.Quantity;
                        product.IsAvailable = true;

                        var invItem = await _db.InventoryItems.FirstOrDefaultAsync(i =>
                            i.Department == "RESTAURANT" && i.Name.ToLower() == retItem.Name.Trim().ToLower());

                        if (invItem != null && invItem.TrackStock)
                        {
                            invItem.CurrentStock += retItem.Quantity;
                            invItem.LastRestocked = DateTime.UtcNow;

                            _db.StockMovements.Add(new StockMovement
                            {
                                ItemId = invItem.Id,
                                Department = "RESTAURANT",
                                Quantity = retItem.Quantity,
                                Type = "SALES_RETURN",
                                Reason = $"Restock from Return on {bill.BillNumber}: {req.Reason.Trim()}",
                                PerformedBy = req.AuthorizedBy ?? "Staff",
                                CreatedAt = DateTime.UtcNow
                            });
                        }
                    }
                }
            }

            returnSubtotal = Math.Round(returnSubtotal, 2);
            var returnTax = Math.Round(returnSubtotal * 0.10, 2); // 10% VAT reversal
            var totalRefundAmount = Math.Round(returnSubtotal + returnTax, 2);

            var returnsList = new List<SalesReturnRecordDto>();
            try
            {
                if (!string.IsNullOrWhiteSpace(bill.ReturnsJson))
                {
                    returnsList = JsonSerializer.Deserialize<List<SalesReturnRecordDto>>(bill.ReturnsJson) ?? new List<SalesReturnRecordDto>();
                }
            }
            catch
            {
                returnsList = new List<SalesReturnRecordDto>();
            }

            var returnRecord = new SalesReturnRecordDto(
                ReturnId: $"RET-{Guid.NewGuid():N}"[..10].ToUpper(),
                ReturnDate: DateTime.UtcNow,
                ReturnedBy: req.AuthorizedBy ?? "Staff",
                Reason: req.Reason.Trim(),
                ReturnSubtotal: returnSubtotal,
                ReturnTax: returnTax,
                TotalRefundAmount: totalRefundAmount,
                Items: req.ReturnItems
            );
            returnsList.Add(returnRecord);

            bill.ReturnsJson = JsonSerializer.Serialize(returnsList);
            bill.RefundAmount = Math.Round(bill.RefundAmount + totalRefundAmount, 2);
            bill.ReturnReason = req.Reason.Trim();
            bill.ReturnedBy = req.AuthorizedBy ?? "Staff";
            bill.ReturnedAt = DateTime.UtcNow;

            // Check if full return or partial return
            if (bill.RefundAmount >= bill.GrandTotal - 1.0)
            {
                bill.TransactionStatus = "RETURNED";
                bill.PaymentStatus = "REFUNDED";
            }
            else
            {
                bill.TransactionStatus = "PARTIALLY_RETURNED";
            }
            bill.UpdatedAt = DateTime.UtcNow;

            // Post Reversal Journal Entry to General Ledger
            await PostReturnJournalEntryAsync(_db, bill, returnSubtotal, returnTax, totalRefundAmount, req.RefundPaymentMethod ?? "CASH", req.AuthorizedBy ?? "Staff");

            await _db.SaveChangesAsync();
            await dbTransaction.CommitAsync();

            return Ok(ApiResponse.Ok(new
            {
                id = bill.Id,
                billNumber = bill.BillNumber,
                refundAmount = bill.RefundAmount,
                transactionStatus = bill.TransactionStatus,
                paymentStatus = bill.PaymentStatus
            }, $"Sales return of Rs. {totalRefundAmount:N2} processed successfully."));
        }
        catch (Exception ex)
        {
            await dbTransaction.RollbackAsync();
            return StatusCode(500, ApiResponse.Fail($"Failed to process return: {ex.Message}"));
        }
    }
    #endregion

    #region 6. Controlled Cancellation & Void
    /// <summary>
    /// Cancel and void a sales transaction with mandatory audit reason, reversing customer credit and ledger
    /// </summary>
    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> CancelTransaction(string id, [FromBody] CancelTransactionRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Reason))
        {
            return BadRequest(ApiResponse.Fail("A cancellation reason is required for audit compliance."));
        }

        var bill = await _db.Bills.FirstOrDefaultAsync(b => b.Id == id || b.BillNumber == id);
        if (bill == null)
        {
            return NotFound(ApiResponse.Fail($"Sales transaction '{id}' not found."));
        }

        if (bill.TransactionStatus == "CANCELLED" || bill.PaymentStatus == "VOID")
        {
            return BadRequest(ApiResponse.Fail("Transaction is already cancelled."));
        }

        using var dbTransaction = await _db.Database.BeginTransactionAsync();
        try
        {
            // 1. If credit customer, reverse outstanding balance
            if (!string.IsNullOrWhiteSpace(bill.CustomerId) && bill.BalanceDue > 0)
            {
                var customer = await _db.Customers.FirstOrDefaultAsync(c => c.Id == bill.CustomerId);
                if (customer != null)
                {
                    customer.CurrentOutstanding = Math.Max(0, Math.Round(customer.CurrentOutstanding - bill.BalanceDue, 2));
                    customer.UpdatedAt = DateTime.UtcNow;

                    _db.CustomerLedgers.Add(new CustomerLedgerEntry
                    {
                        HotelId = bill.HotelId,
                        CustomerId = customer.Id,
                        BillId = bill.Id,
                        EntryDate = DateTime.UtcNow,
                        Description = $"VOID / CANCELLATION of {bill.BillNumber}: {req.Reason.Trim()}",
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

            // 2. Mark Bill as CANCELLED and VOID
            bill.TransactionStatus = "CANCELLED";
            bill.PaymentStatus = "VOID";
            bill.CancellationReason = req.Reason.Trim();
            bill.CancelledBy = req.AuthorizedBy ?? "Admin";
            bill.CancelledAt = DateTime.UtcNow;
            bill.Notes = $"{bill.Notes} | [CANCELLED on {DateTime.UtcNow:yyyy-MM-dd HH:mm} by {req.AuthorizedBy ?? "Admin"}: {req.Reason.Trim()}]".TrimStart(' ', '|');
            bill.UpdatedAt = DateTime.UtcNow;

            // 3. Reverse associated Journal Entry
            var journalEntry = await _db.JournalEntries
                .Include(j => j.Lines)
                .Where(j => j.SourceTransactionId == bill.Id || j.Reference == bill.BillNumber)
                .FirstOrDefaultAsync();

            if (journalEntry != null && journalEntry.Status == "POSTED")
            {
                journalEntry.Status = "REVERSED";
                journalEntry.UpdatedAt = DateTime.UtcNow;

                // Reverse account balances
                foreach (var line in journalEntry.Lines)
                {
                    var acc = await _db.Accounts.FindAsync(line.AccountId);
                    if (acc != null)
                    {
                        if (acc.NormalBalance == "DEBIT")
                        {
                            acc.CurrentBalance -= (line.Debit - line.Credit);
                        }
                        else
                        {
                            acc.CurrentBalance -= (line.Credit - line.Debit);
                        }
                    }
                }
            }

            await _db.SaveChangesAsync();
            await dbTransaction.CommitAsync();

            return Ok(ApiResponse.Ok(new
            {
                id = bill.Id,
                billNumber = bill.BillNumber,
                transactionStatus = bill.TransactionStatus,
                paymentStatus = bill.PaymentStatus
            }, $"Sales transaction {bill.BillNumber} cancelled and voided."));
        }
        catch (Exception ex)
        {
            await dbTransaction.RollbackAsync();
            return StatusCode(500, ApiResponse.Fail($"Failed to cancel transaction: {ex.Message}"));
        }
    }
    #endregion

    #region 7. Helpers (Menu Items, Customers, Export)
    /// <summary>
    /// Helper: Get menu items for sales creation
    /// </summary>
    [HttpGet("menu-items")]
    public async Task<IActionResult> GetMenuItems([FromQuery] string? search)
    {
        var query = _db.POSProducts.AsNoTracking().Where(p => p.IsAvailable);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(s) || p.Category.ToLower().Contains(s));
        }

        var items = await query.OrderBy(p => p.Category).ThenBy(p => p.Name).Take(100).ToListAsync();
        return Ok(ApiResponse.Ok(items));
    }

    /// <summary>
    /// Helper: Get customers for sales selection
    /// </summary>
    [HttpGet("customers")]
    public async Task<IActionResult> GetCustomers([FromQuery] string? search)
    {
        var query = _db.Customers.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(c => c.Name.ToLower().Contains(s) || c.Phone.Contains(s));
        }

        var customers = await query.OrderBy(c => c.Name).Take(50).ToListAsync();
        return Ok(ApiResponse.Ok(customers));
    }
    #endregion

    #region Accounting Double-Entry Helpers
    private static async Task PostSalesJournalEntryAsync(
        HospitalityDbContext db,
        Bill bill,
        List<SalesPaymentRecordDto> payments,
        double taxableAmount,
        double taxAmount,
        double serviceCharge,
        double otherCharges,
        string hotelId)
    {
        // Fetch standard accounts or ensure created
        var accounts = await db.Accounts.Where(a => a.HotelId == hotelId).ToListAsync();
        if (accounts.Count == 0)
        {
            accounts = AccountsController.GetStandardHospitalityAccounts(hotelId);
            db.Accounts.AddRange(accounts);
            await db.SaveChangesAsync();
        }

        var cashAccount = accounts.FirstOrDefault(a => a.AccountCode == "1020") ?? accounts.FirstOrDefault(a => a.AccountCode == "1010") ?? accounts[0];
        var bankAccount = accounts.FirstOrDefault(a => a.AccountCode == "1050") ?? cashAccount;
        var clearingAccount = accounts.FirstOrDefault(a => a.AccountCode == "1060") ?? cashAccount;
        var arAccount = accounts.FirstOrDefault(a => a.AccountCode == "1100") ?? accounts.FirstOrDefault(a => a.AccountCode == "1110") ?? cashAccount;
        var revenueAccount = accounts.FirstOrDefault(a => a.AccountCode == "4100") ?? accounts.FirstOrDefault(a => a.AccountType == "REVENUE") ?? accounts[0];
        var taxAccount = accounts.FirstOrDefault(a => a.AccountCode == "2050") ?? accounts.FirstOrDefault(a => a.AccountType == "LIABILITY") ?? accounts[0];
        var serviceAccount = accounts.FirstOrDefault(a => a.AccountCode == "2060") ?? taxAccount;
        var miscIncomeAccount = accounts.FirstOrDefault(a => a.AccountCode == "4900") ?? revenueAccount;

        var year = DateTime.UtcNow.Year;
        var prefix = $"JV-{year}-";
        var countThisYear = await db.JournalEntries.CountAsync(j => j.EntryNumber.StartsWith(prefix));
        var entryNumber = $"{prefix}{(countThisYear + 1):D4}";

        var entry = new JournalEntry
        {
            HotelId = hotelId,
            EntryNumber = entryNumber,
            EntryDate = DateTime.UtcNow,
            EntryType = "GENERAL",
            Reference = bill.BillNumber,
            Description = $"Sales Invoice {bill.BillNumber} ({bill.SalesChannel}) - {bill.CustomerName}",
            SourceModule = "SALES",
            SourceTransactionId = bill.Id,
            CreatedBy = bill.ServerOrStaff ?? "Cashier",
            PostedBy = bill.ServerOrStaff ?? "Cashier",
            PostedAt = DateTime.UtcNow,
            Status = "POSTED",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        double totalDebit = 0;
        double totalCredit = 0;

        // 1. Debits: Payments
        if (payments.Count > 0)
        {
            foreach (var p in payments)
            {
                var targetAcc = p.PaymentMethod switch
                {
                    "CASH" => cashAccount,
                    "CARD" or "UPI" or "ONLINE" or "WALLET" => clearingAccount,
                    "BANK" or "BANK_TRANSFER" => bankAccount,
                    _ => cashAccount
                };

                entry.Lines.Add(new JournalEntryLine
                {
                    JournalEntryId = entry.Id,
                    AccountId = targetAcc.Id,
                    AccountCode = targetAcc.AccountCode,
                    AccountName = targetAcc.AccountName,
                    LineDescription = $"Payment received via {p.PaymentMethod} for {bill.BillNumber}",
                    Debit = p.Amount,
                    Credit = 0
                });
                totalDebit += p.Amount;
                ApplyAccountDelta(targetAcc, p.Amount, 0);
            }
        }

        // 2. Debits: Outstanding / Accounts Receivable
        if (bill.BalanceDue > 0.01)
        {
            entry.Lines.Add(new JournalEntryLine
            {
                JournalEntryId = entry.Id,
                AccountId = arAccount.Id,
                AccountCode = arAccount.AccountCode,
                AccountName = arAccount.AccountName,
                LineDescription = $"Accounts Receivable balance on {bill.BillNumber}",
                Debit = bill.BalanceDue,
                Credit = 0
            });
            totalDebit += bill.BalanceDue;
            ApplyAccountDelta(arAccount, bill.BalanceDue, 0);
        }

        // 3. Credits: Food & Dining Revenue
        if (taxableAmount > 0)
        {
            entry.Lines.Add(new JournalEntryLine
            {
                JournalEntryId = entry.Id,
                AccountId = revenueAccount.Id,
                AccountCode = revenueAccount.AccountCode,
                AccountName = revenueAccount.AccountName,
                LineDescription = $"Food & Dining Sales Revenue for {bill.BillNumber}",
                Debit = 0,
                Credit = taxableAmount
            });
            totalCredit += taxableAmount;
            ApplyAccountDelta(revenueAccount, 0, taxableAmount);
        }

        // 4. Credits: VAT / Sales Tax Payable
        if (taxAmount > 0)
        {
            entry.Lines.Add(new JournalEntryLine
            {
                JournalEntryId = entry.Id,
                AccountId = taxAccount.Id,
                AccountCode = taxAccount.AccountCode,
                AccountName = taxAccount.AccountName,
                LineDescription = $"VAT / Sales Tax Collected on {bill.BillNumber}",
                Debit = 0,
                Credit = taxAmount
            });
            totalCredit += taxAmount;
            ApplyAccountDelta(taxAccount, 0, taxAmount);
        }

        // 5. Credits: Service Charge Payable
        if (serviceCharge > 0)
        {
            entry.Lines.Add(new JournalEntryLine
            {
                JournalEntryId = entry.Id,
                AccountId = serviceAccount.Id,
                AccountCode = serviceAccount.AccountCode,
                AccountName = serviceAccount.AccountName,
                LineDescription = $"Staff Service Charge Payable on {bill.BillNumber}",
                Debit = 0,
                Credit = serviceCharge
            });
            totalCredit += serviceCharge;
            ApplyAccountDelta(serviceAccount, 0, serviceCharge);
        }

        // 6. Credits: Other Charges (Delivery + Packing)
        if (otherCharges > 0)
        {
            entry.Lines.Add(new JournalEntryLine
            {
                JournalEntryId = entry.Id,
                AccountId = miscIncomeAccount.Id,
                AccountCode = miscIncomeAccount.AccountCode,
                AccountName = miscIncomeAccount.AccountName,
                LineDescription = $"Delivery / Packing Charges on {bill.BillNumber}",
                Debit = 0,
                Credit = otherCharges
            });
            totalCredit += otherCharges;
            ApplyAccountDelta(miscIncomeAccount, 0, otherCharges);
        }

        entry.TotalDebit = Math.Round(totalDebit, 2);
        entry.TotalCredit = Math.Round(totalCredit, 2);

        db.JournalEntries.Add(entry);
    }

    private static async Task PostReceiptJournalEntryAsync(
        HospitalityDbContext db,
        Bill bill,
        double payAmount,
        string pMethod,
        string receivedBy)
    {
        var accounts = await db.Accounts.Where(a => a.HotelId == bill.HotelId).ToListAsync();
        var cashAccount = accounts.FirstOrDefault(a => a.AccountCode == "1020") ?? accounts.FirstOrDefault(a => a.AccountCode == "1010") ?? accounts[0];
        var bankAccount = accounts.FirstOrDefault(a => a.AccountCode == "1050") ?? cashAccount;
        var clearingAccount = accounts.FirstOrDefault(a => a.AccountCode == "1060") ?? cashAccount;
        var arAccount = accounts.FirstOrDefault(a => a.AccountCode == "1100") ?? accounts.FirstOrDefault(a => a.AccountCode == "1110") ?? cashAccount;

        var targetAcc = pMethod switch
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
            HotelId = bill.HotelId,
            EntryNumber = entryNumber,
            EntryDate = DateTime.UtcNow,
            EntryType = "GENERAL",
            Reference = bill.BillNumber,
            Description = $"Payment receipt of Rs. {payAmount:N2} against {bill.BillNumber} via {pMethod}",
            SourceModule = "SALES",
            SourceTransactionId = bill.Id,
            CreatedBy = receivedBy,
            PostedBy = receivedBy,
            PostedAt = DateTime.UtcNow,
            Status = "POSTED",
            TotalDebit = payAmount,
            TotalCredit = payAmount,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Debit: Cash/Bank/Clearing
        entry.Lines.Add(new JournalEntryLine
        {
            JournalEntryId = entry.Id,
            AccountId = targetAcc.Id,
            AccountCode = targetAcc.AccountCode,
            AccountName = targetAcc.AccountName,
            LineDescription = $"Payment received via {pMethod} for {bill.BillNumber}",
            Debit = payAmount,
            Credit = 0
        });
        ApplyAccountDelta(targetAcc, payAmount, 0);

        // Credit: Accounts Receivable
        entry.Lines.Add(new JournalEntryLine
        {
            JournalEntryId = entry.Id,
            AccountId = arAccount.Id,
            AccountCode = arAccount.AccountCode,
            AccountName = arAccount.AccountName,
            LineDescription = $"Clearance of Accounts Receivable for {bill.BillNumber}",
            Debit = 0,
            Credit = payAmount
        });
        ApplyAccountDelta(arAccount, 0, payAmount);

        db.JournalEntries.Add(entry);
    }

    private static async Task PostReturnJournalEntryAsync(
        HospitalityDbContext db,
        Bill bill,
        double returnSubtotal,
        double returnTax,
        double totalRefundAmount,
        string refundMethod,
        string authorizedBy)
    {
        var accounts = await db.Accounts.Where(a => a.HotelId == bill.HotelId).ToListAsync();
        var cashAccount = accounts.FirstOrDefault(a => a.AccountCode == "1020") ?? accounts.FirstOrDefault(a => a.AccountCode == "1010") ?? accounts[0];
        var bankAccount = accounts.FirstOrDefault(a => a.AccountCode == "1050") ?? cashAccount;
        var clearingAccount = accounts.FirstOrDefault(a => a.AccountCode == "1060") ?? cashAccount;
        var arAccount = accounts.FirstOrDefault(a => a.AccountCode == "1100") ?? accounts.FirstOrDefault(a => a.AccountCode == "1110") ?? cashAccount;
        var revenueAccount = accounts.FirstOrDefault(a => a.AccountCode == "4100") ?? accounts.FirstOrDefault(a => a.AccountType == "REVENUE") ?? accounts[0];
        var taxAccount = accounts.FirstOrDefault(a => a.AccountCode == "2050") ?? accounts.FirstOrDefault(a => a.AccountType == "LIABILITY") ?? accounts[0];

        var refundAcc = refundMethod switch
        {
            "CASH" => cashAccount,
            "CARD" or "UPI" or "ONLINE" => clearingAccount,
            "BANK" => bankAccount,
            "CREDIT_NOTE" => arAccount,
            _ => cashAccount
        };

        var year = DateTime.UtcNow.Year;
        var prefix = $"JV-{year}-";
        var countThisYear = await db.JournalEntries.CountAsync(j => j.EntryNumber.StartsWith(prefix));
        var entryNumber = $"{prefix}{(countThisYear + 1):D4}";

        var entry = new JournalEntry
        {
            HotelId = bill.HotelId,
            EntryNumber = entryNumber,
            EntryDate = DateTime.UtcNow,
            EntryType = "ADJUSTMENT",
            Reference = bill.BillNumber,
            Description = $"Sales Return & Refund for {bill.BillNumber}",
            SourceModule = "SALES",
            SourceTransactionId = bill.Id,
            CreatedBy = authorizedBy,
            PostedBy = authorizedBy,
            PostedAt = DateTime.UtcNow,
            Status = "POSTED",
            TotalDebit = totalRefundAmount,
            TotalCredit = totalRefundAmount,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // 1. Debit Revenue
        if (returnSubtotal > 0)
        {
            entry.Lines.Add(new JournalEntryLine
            {
                JournalEntryId = entry.Id,
                AccountId = revenueAccount.Id,
                AccountCode = revenueAccount.AccountCode,
                AccountName = revenueAccount.AccountName,
                LineDescription = $"Reversal of Sales Revenue on return of {bill.BillNumber}",
                Debit = returnSubtotal,
                Credit = 0
            });
            ApplyAccountDelta(revenueAccount, returnSubtotal, 0);
        }

        // 2. Debit Tax
        if (returnTax > 0)
        {
            entry.Lines.Add(new JournalEntryLine
            {
                JournalEntryId = entry.Id,
                AccountId = taxAccount.Id,
                AccountCode = taxAccount.AccountCode,
                AccountName = taxAccount.AccountName,
                LineDescription = $"Reversal of VAT / Sales Tax on return of {bill.BillNumber}",
                Debit = returnTax,
                Credit = 0
            });
            ApplyAccountDelta(taxAccount, returnTax, 0);
        }

        // 3. Credit Refund Account (Cash, Bank, AR)
        entry.Lines.Add(new JournalEntryLine
        {
            JournalEntryId = entry.Id,
            AccountId = refundAcc.Id,
            AccountCode = refundAcc.AccountCode,
            AccountName = refundAcc.AccountName,
            LineDescription = $"Refund paid via {refundMethod} for return of {bill.BillNumber}",
            Debit = 0,
            Credit = totalRefundAmount
        });
        ApplyAccountDelta(refundAcc, 0, totalRefundAmount);

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

    private static int CountItemsInJson(string itemsJson)
    {
        if (string.IsNullOrWhiteSpace(itemsJson)) return 0;
        try
        {
            using var doc = JsonDocument.Parse(itemsJson);
            return doc.RootElement.ValueKind == JsonValueKind.Array ? doc.RootElement.GetArrayLength() : 0;
        }
        catch
        {
            return 0;
        }
    }
    #endregion
}


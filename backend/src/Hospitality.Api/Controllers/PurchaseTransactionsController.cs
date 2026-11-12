using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/purchase-transactions")]
[Route("api/accounts/purchase-transactions")]
public class PurchaseTransactionsController : ControllerBase
{
    private readonly HospitalityDbContext _db;

    public PurchaseTransactionsController(HospitalityDbContext db)
    {
        _db = db;
    }

    #region DTOs

    public record PurchaseItemDto(
        string? ItemId,
        string ItemName,
        string? ItemCode,
        string? Category,
        string? Unit,
        string? PurchaseUnit,
        double ConversionFactor,
        double Quantity,
        double ReceivedQuantity,
        double UnitCost,
        double DiscountAmount,
        double TaxRate,
        double TaxAmount,
        double TotalCost,
        string? Department,
        string? Warehouse,
        string? BatchNumber,
        DateTime? ExpiryDate,
        string? Notes
    );

    public record PurchasePaymentRecordDto(
        string PaymentId,
        double Amount,
        string PaymentMethod,
        DateTime PaymentDate,
        string? ReferenceNumber,
        string? PaidBy,
        string? CashOrBankAccount,
        string? Notes
    );

    public record PurchaseReturnItemDto(
        string ItemName,
        string? ItemId,
        double ReturnQuantity,
        double UnitCost,
        double ReturnSubtotal,
        double TaxAmount,
        double TotalRefundAmount,
        string? Reason,
        bool DeductStock
    );

    public record PurchaseReturnRecordDto(
        string ReturnId,
        string ReturnNumber,
        DateTime ReturnDate,
        string ReturnedBy,
        string Reason,
        double ReturnSubtotal,
        double ReturnTax,
        double TotalRefundAmount,
        string? DebitNoteNumber,
        List<PurchaseReturnItemDto> Items
    );

    public record CreatePurchaseTransactionRequest(
        string? PoNumber,
        string? SupplierInvoiceNumber,
        string? SupplierId,
        string? SupplierName,
        string? PanVatNumber,
        DateTime? PurchaseDate,
        DateTime? InvoiceDate,
        DateTime? DueDate,
        string? PurchaseOrderRef,
        string? GrnNumber,
        string? BranchOrOutlet, // Restaurant Main, Rooftop Bar, Hotel
        string? Warehouse, // Central Store, Dry Kitchen, Cold Room
        string? PurchaseType, // INVENTORY, CASH, CREDIT, EXPENSE, FIXED_ASSET
        string? PaymentMethod, // Cash, Bank, QR, Card, Credit, Split
        string? PaymentStatus, // Paid, Partially Paid, Unpaid
        string? ReceivingStatus, // PENDING, PARTIALLY_RECEIVED, FULLY_RECEIVED
        string? Status, // DRAFT, POSTED, APPROVED
        double? Subtotal,
        double? ItemDiscounts,
        double? InvoiceDiscount,
        double? Tax,
        double? FreightCharges,
        double? AdditionalCharges,
        double? RoundOff,
        double? TotalAmount,
        double? PaidAmount,
        List<PurchaseItemDto> Items,
        string? Notes,
        string? CreatedBy,
        string? IdempotencyKey
    );

    public record RecordPurchasePaymentRequest(
        double Amount,
        string PaymentMethod,
        string? ReferenceNumber,
        DateTime? PaymentDate,
        string? CashOrBankAccount,
        string? Notes,
        string? PaidBy
    );

    public record ProcessPurchaseReturnRequest(
        List<PurchaseReturnItemDto> ReturnItems,
        string Reason,
        string? AuthorizedBy,
        string? RefundMethod // CASH, BANK, DEBIT_NOTE / AP_DEDUCTION
    );

    public record ReceivePurchaseGoodsRequest(
        List<PurchaseItemDto>? Items,
        string? GrnNumber,
        DateTime? ReceivedDate,
        string? Warehouse,
        string? ReceivedBy,
        string? Notes
    );

    #endregion

    #region Helper Methods

    private static List<PurchaseItemDto> ParseItems(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new List<PurchaseItemDto>();
        try
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            return JsonSerializer.Deserialize<List<PurchaseItemDto>>(json, options) ?? new List<PurchaseItemDto>();
        }
        catch
        {
            return new List<PurchaseItemDto>();
        }
    }

    private static List<PurchasePaymentRecordDto> ParsePayments(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new List<PurchasePaymentRecordDto>();
        try
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            return JsonSerializer.Deserialize<List<PurchasePaymentRecordDto>>(json, options) ?? new List<PurchasePaymentRecordDto>();
        }
        catch
        {
            return new List<PurchasePaymentRecordDto>();
        }
    }

    private static List<PurchaseReturnRecordDto> ParseReturns(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new List<PurchaseReturnRecordDto>();
        try
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            return JsonSerializer.Deserialize<List<PurchaseReturnRecordDto>>(json, options) ?? new List<PurchaseReturnRecordDto>();
        }
        catch
        {
            return new List<PurchaseReturnRecordDto>();
        }
    }

    #endregion

    #region Endpoints

    /// <summary>
    /// Generates next unique purchase number (e.g. PUR-2026-0001)
    /// </summary>
    [HttpGet("next-number")]
    public async Task<IActionResult> GetNextPurchaseNumber()
    {
        var year = DateTime.UtcNow.Year;
        var prefix = $"PUR-{year}-";
        var count = await _db.PurchaseOrders
            .Where(p => p.PoNumber.StartsWith(prefix))
            .CountAsync();

        var nextNum = $"{prefix}{(count + 1):D4}";
        return Ok(ApiResponse.Ok(new { nextNumber = nextNum }));
    }

    /// <summary>
    /// Lists all purchase transactions with advanced filters, pagination, and summary KPIs.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetPurchaseTransactions(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] string? search = null,
        [FromQuery] string? supplierId = null,
        [FromQuery] string? purchaseType = null,
        [FromQuery] string? paymentStatus = null,
        [FromQuery] string? receivingStatus = null,
        [FromQuery] string? status = null,
        [FromQuery] string? outlet = null,
        [FromQuery] string? warehouse = null,
        [FromQuery] string? createdBy = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        var query = _db.PurchaseOrders
            .Include(p => p.Supplier)
            .AsQueryable();

        // Date range filter
        if (fromDate.HasValue)
        {
            var f = DateTime.SpecifyKind(fromDate.Value.Date, DateTimeKind.Utc);
            query = query.Where(p => p.OrderedAt >= f);
        }
        if (toDate.HasValue)
        {
            var t = DateTime.SpecifyKind(toDate.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
            query = query.Where(p => p.OrderedAt <= t);
        }

        // Supplier filter
        if (!string.IsNullOrWhiteSpace(supplierId) && !supplierId.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(p => p.SupplierId == supplierId);
        }

        // Purchase Type
        if (!string.IsNullOrWhiteSpace(purchaseType) && !purchaseType.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            var pt = purchaseType.Trim().ToUpper();
            query = query.Where(p => p.PurchaseType.ToUpper() == pt);
        }

        // Payment Status
        if (!string.IsNullOrWhiteSpace(paymentStatus) && !paymentStatus.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            var ps = paymentStatus.Trim().ToUpper();
            query = query.Where(p => p.PaymentStatus.ToUpper() == ps);
        }

        // Receiving Status
        if (!string.IsNullOrWhiteSpace(receivingStatus) && !receivingStatus.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            var rs = receivingStatus.Trim().ToUpper();
            query = query.Where(p => p.ReceivingStatus.ToUpper() == rs);
        }

        // Transaction Status
        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            var st = status.Trim().ToUpper();
            query = query.Where(p => p.Status.ToUpper() == st);
        }

        // Branch / Outlet
        if (!string.IsNullOrWhiteSpace(outlet) && !outlet.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(p => p.BranchOrOutlet != null && p.BranchOrOutlet.ToUpper() == outlet.Trim().ToUpper());
        }

        // Warehouse
        if (!string.IsNullOrWhiteSpace(warehouse) && !warehouse.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(p => p.Warehouse != null && p.Warehouse.ToUpper() == warehouse.Trim().ToUpper());
        }

        // CreatedBy
        if (!string.IsNullOrWhiteSpace(createdBy) && !createdBy.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(p => p.CreatedBy.ToLower() == createdBy.Trim().ToLower());
        }

        // Free-text Search (PO number, invoice number, supplier name, notes)
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(p =>
                p.PoNumber.ToLower().Contains(s) ||
                (p.InvoiceNumber != null && p.InvoiceNumber.ToLower().Contains(s)) ||
                (p.SupplierName != null && p.SupplierName.ToLower().Contains(s)) ||
                (p.Supplier != null && p.Supplier.Name.ToLower().Contains(s)) ||
                (p.Notes != null && p.Notes.ToLower().Contains(s))
            );
        }

        // Calculate Summary KPIs before pagination across all matching records (excluding CANCELLED)
        var validPurchases = await query.Where(p => p.Status != "CANCELLED").ToListAsync();
        var allPurchasesList = await query.ToListAsync();

        double totalPurchasesSum = validPurchases.Sum(p => p.TotalAmount);
        int totalInvoicesCount = allPurchasesList.Count;
        double paidPurchasesSum = validPurchases.Sum(p => p.PaidAmount > 0 ? p.PaidAmount : (p.PaymentStatus == "Paid" ? p.TotalAmount : 0));
        double unpaidPurchasesSum = validPurchases.Sum(p => p.DueAmount > 0 ? p.DueAmount : (p.PaymentStatus == "Unpaid" ? p.TotalAmount : 0));
        int partiallyPaidCount = validPurchases.Count(p => p.PaymentStatus == "Partially Paid" || (p.PaidAmount > 0 && p.PaidAmount < p.TotalAmount));

        // Returns calculation
        double purchaseReturnsSum = 0;
        foreach (var p in validPurchases)
        {
            var rets = ParseReturns(p.ReturnsJson);
            purchaseReturnsSum += rets.Sum(r => r.TotalRefundAmount);
        }

        double outstandingPayablesSum = Math.Max(0, unpaidPurchasesSum - purchaseReturnsSum);

        var totalCount = allPurchasesList.Count;
        var totalPages = Math.Max(1, (int)Math.Ceiling(totalCount / (double)pageSize));
        page = Math.Clamp(page, 1, totalPages);

        var items = await query
            .OrderByDescending(p => p.OrderedAt)
            .ThenByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var rows = items.Select(p =>
        {
            var pItems = ParseItems(p.ItemsJson);
            var payments = ParsePayments(p.PaymentsJson);
            var returns = ParseReturns(p.ReturnsJson);

            var paid = p.PaidAmount > 0 ? p.PaidAmount : (p.PaymentStatus == "Paid" ? p.TotalAmount : payments.Sum(x => x.Amount));
            var due = p.DueAmount > 0 ? p.DueAmount : Math.Max(0, p.TotalAmount - paid - returns.Sum(r => r.TotalRefundAmount));

            return new
            {
                id = p.Id,
                purchaseNumber = p.PoNumber,
                supplierInvoiceNumber = p.InvoiceNumber ?? "—",
                purchaseDate = p.OrderedAt,
                invoiceDate = p.InvoiceDate ?? p.OrderedAt,
                dueDate = p.DueDate,
                supplierId = p.SupplierId,
                supplierName = p.Supplier?.Name ?? p.SupplierName ?? "Unregistered Supplier",
                supplierCode = p.Supplier?.Code ?? "—",
                panVatNumber = p.PanVatNumber ?? p.Supplier?.PanVatNumber ?? "—",
                purchaseType = p.PurchaseType ?? "INVENTORY",
                branchOrOutlet = p.BranchOrOutlet ?? "Restaurant Main",
                warehouse = p.Warehouse ?? "Central Store",
                purchaseOrderRef = p.PurchaseOrderRef ?? "—",
                grnNumber = p.GrnNumber ?? "—",
                subtotal = Math.Round(p.Subtotal, 2),
                discount = Math.Round(p.Discount, 2),
                tax = Math.Round(p.Tax, 2),
                freightCharges = Math.Round(p.FreightCharges, 2),
                additionalCharges = Math.Round(p.AdditionalCharges, 2),
                roundOff = Math.Round(p.RoundOff, 2),
                grandTotal = Math.Round(p.TotalAmount, 2),
                paidAmount = Math.Round(paid, 2),
                dueAmount = Math.Round(due, 2),
                paymentMethod = p.PaymentMethod ?? "Cash",
                paymentStatus = p.PaymentStatus ?? (due <= 0 ? "Paid" : (paid > 0 ? "Partially Paid" : "Unpaid")),
                receivingStatus = p.ReceivingStatus ?? "FULLY_RECEIVED",
                transactionStatus = p.Status ?? "POSTED",
                createdBy = p.CreatedBy ?? "Admin",
                approvedBy = p.ApprovedBy ?? "—",
                journalEntryId = p.JournalEntryId,
                notes = p.Notes,
                itemsCount = pItems.Count,
                itemsSummary = string.Join(", ", pItems.Take(3).Select(i => $"{i.ItemName} ({i.Quantity} {i.Unit ?? "unit"})")) + (pItems.Count > 3 ? "..." : "")
            };
        }).ToList();

        return Ok(ApiResponse.Ok(new
        {
            items = rows,
            totalCount,
            page,
            pageSize,
            totalPages,
            summary = new
            {
                totalPurchases = Math.Round(totalPurchasesSum, 2),
                totalPurchaseInvoices = totalInvoicesCount,
                paidPurchases = Math.Round(paidPurchasesSum, 2),
                unpaidPurchases = Math.Round(unpaidPurchasesSum, 2),
                partiallyPaidPurchases = partiallyPaidCount,
                purchaseReturns = Math.Round(purchaseReturnsSum, 2),
                outstandingPayables = Math.Round(outstandingPayablesSum, 2)
            }
        }));
    }

    /// <summary>
    /// Gets full details of a single purchase transaction.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetPurchaseById(string id)
    {
        var p = await _db.PurchaseOrders
            .Include(x => x.Supplier)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (p == null)
        {
            return NotFound(ApiResponse.Fail($"Purchase '{id}' not found."));
        }

        var items = ParseItems(p.ItemsJson);
        var payments = ParsePayments(p.PaymentsJson);
        var returns = ParseReturns(p.ReturnsJson);

        var paid = p.PaidAmount > 0 ? p.PaidAmount : (p.PaymentStatus == "Paid" ? p.TotalAmount : payments.Sum(x => x.Amount));
        var due = p.DueAmount > 0 ? p.DueAmount : Math.Max(0, p.TotalAmount - paid - returns.Sum(r => r.TotalRefundAmount));

        // Get linked journal entry if any
        JournalEntry? journal = null;
        if (!string.IsNullOrWhiteSpace(p.JournalEntryId))
        {
            journal = await _db.JournalEntries
                .Include(j => j.Lines)
                .ThenInclude(l => l.Account)
                .FirstOrDefaultAsync(j => j.Id == p.JournalEntryId);
        }

        return Ok(ApiResponse.Ok(new
        {
            id = p.Id,
            purchaseNumber = p.PoNumber,
            supplierInvoiceNumber = p.InvoiceNumber,
            purchaseDate = p.OrderedAt,
            invoiceDate = p.InvoiceDate ?? p.OrderedAt,
            dueDate = p.DueDate,
            supplierId = p.SupplierId,
            supplier = p.Supplier != null ? new
            {
                id = p.Supplier.Id,
                name = p.Supplier.Name,
                code = p.Supplier.Code,
                phone = p.Supplier.Phone,
                email = p.Supplier.Email,
                address = p.Supplier.Address,
                panVatNumber = p.Supplier.PanVatNumber,
                creditLimit = p.Supplier.CreditLimit,
                paymentTermsDays = p.Supplier.PaymentTermsDays
            } : null,
            supplierName = p.Supplier?.Name ?? p.SupplierName ?? "Unregistered Supplier",
            panVatNumber = p.PanVatNumber ?? p.Supplier?.PanVatNumber,
            purchaseType = p.PurchaseType ?? "INVENTORY",
            branchOrOutlet = p.BranchOrOutlet ?? "Restaurant Main",
            warehouse = p.Warehouse ?? "Central Store",
            purchaseOrderRef = p.PurchaseOrderRef,
            grnNumber = p.GrnNumber,
            subtotal = Math.Round(p.Subtotal, 2),
            discount = Math.Round(p.Discount, 2),
            tax = Math.Round(p.Tax, 2),
            freightCharges = Math.Round(p.FreightCharges, 2),
            additionalCharges = Math.Round(p.AdditionalCharges, 2),
            roundOff = Math.Round(p.RoundOff, 2),
            grandTotal = Math.Round(p.TotalAmount, 2),
            paidAmount = Math.Round(paid, 2),
            dueAmount = Math.Round(due, 2),
            paymentMethod = p.PaymentMethod ?? "Cash",
            paymentStatus = p.PaymentStatus ?? "Paid",
            receivingStatus = p.ReceivingStatus ?? "FULLY_RECEIVED",
            transactionStatus = p.Status ?? "POSTED",
            notes = p.Notes,
            attachmentUrl = p.AttachmentUrl,
            createdBy = p.CreatedBy,
            approvedBy = p.ApprovedBy,
            items,
            payments,
            returns,
            journal = journal != null ? new
            {
                id = journal.Id,
                entryNumber = journal.EntryNumber,
                entryDate = journal.EntryDate,
                status = journal.Status,
                description = journal.Description,
                totalDebit = journal.TotalDebit,
                totalCredit = journal.TotalCredit,
                lines = journal.Lines.Select(l => new
                {
                    accountId = l.AccountId,
                    accountCode = l.Account?.AccountCode,
                    accountName = l.Account?.AccountName,
                    debit = l.Debit,
                    credit = l.Credit,
                    description = l.LineDescription
                })
            } : null
        }));
    }

    /// <summary>
    /// Creates a complete Purchase Transaction with inventory update, supplier ledger, and double-entry GL journal posting.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreatePurchaseTransaction([FromBody] CreatePurchaseTransactionRequest req)
    {
        if (req.Items == null || req.Items.Count == 0)
        {
            return BadRequest(ApiResponse.Fail("At least one purchase item is required."));
        }

        foreach (var item in req.Items)
        {
            if (string.IsNullOrWhiteSpace(item.ItemName))
            {
                return BadRequest(ApiResponse.Fail("Item name cannot be empty."));
            }
            if (item.Quantity <= 0)
            {
                return BadRequest(ApiResponse.Fail($"Quantity for '{item.ItemName}' must be greater than zero."));
            }
            if (item.UnitCost < 0)
            {
                return BadRequest(ApiResponse.Fail($"Unit cost for '{item.ItemName}' cannot be negative."));
            }
        }

        using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            var hotel = await _db.Hotels.FirstOrDefaultAsync();
            var hotelId = hotel?.Id ?? "hotel-default";

            // Resolve Supplier
            Supplier? supplier = null;
            string? supplierId = req.SupplierId;
            string supplierName = req.SupplierName?.Trim() ?? "Walk-in Supplier";
            string? panVatNumber = req.PanVatNumber?.Trim();

            if (!string.IsNullOrWhiteSpace(supplierId))
            {
                supplier = await _db.Suppliers.FindAsync(supplierId);
                if (supplier != null)
                {
                    supplierName = supplier.Name;
                    if (string.IsNullOrWhiteSpace(panVatNumber))
                    {
                        panVatNumber = supplier.PanVatNumber;
                    }
                }
            }

            // Purchase numbers
            var year = DateTime.UtcNow.Year;
            var poNumber = !string.IsNullOrWhiteSpace(req.PoNumber)
                ? req.PoNumber
                : $"PUR-{year}-{Random.Shared.Next(1000, 9999)}";

            var purchaseDate = req.PurchaseDate?.ToUniversalTime() ?? DateTime.UtcNow;
            var invoiceDate = req.InvoiceDate?.ToUniversalTime() ?? purchaseDate;

            // Compute due date from supplier terms if not specified
            DateTime? dueDate = req.DueDate?.ToUniversalTime();
            if (!dueDate.HasValue && supplier != null && supplier.PaymentTermsDays > 0)
            {
                dueDate = purchaseDate.AddDays(supplier.PaymentTermsDays);
            }

            // Calculate Subtotal, Discounts, Taxes & Grand Total
            var subtotal = req.Subtotal ?? req.Items.Sum(i => i.Quantity * i.UnitCost);
            var itemDiscounts = req.ItemDiscounts ?? req.Items.Sum(i => i.DiscountAmount);
            var invoiceDiscount = req.InvoiceDiscount ?? 0;
            var totalDiscount = itemDiscounts + invoiceDiscount;
            var taxAmount = req.Tax ?? req.Items.Sum(i => i.TaxAmount);
            var freight = req.FreightCharges ?? 0;
            var additional = req.AdditionalCharges ?? 0;
            var roundOff = req.RoundOff ?? 0;

            var grandTotal = req.TotalAmount.HasValue && req.TotalAmount.Value > 0
                ? req.TotalAmount.Value
                : Math.Max(0, subtotal - totalDiscount + taxAmount + freight + additional + roundOff);

            var paymentMethod = !string.IsNullOrWhiteSpace(req.PaymentMethod) ? req.PaymentMethod : "Cash";
            var isCredit = paymentMethod.Equals("Credit", StringComparison.OrdinalIgnoreCase);

            var paidAmount = isCredit ? 0 : (req.PaidAmount ?? grandTotal);
            paidAmount = Math.Clamp(paidAmount, 0, grandTotal);
            var dueAmount = Math.Max(0, grandTotal - paidAmount);

            var paymentStatus = dueAmount <= 0.01 ? "Paid" : (paidAmount > 0 ? "Partially Paid" : "Unpaid");
            var receivingStatus = !string.IsNullOrWhiteSpace(req.ReceivingStatus) ? req.ReceivingStatus : "FULLY_RECEIVED";
            var status = !string.IsNullOrWhiteSpace(req.Status) ? req.Status : "POSTED";

            // Credit purchase checks
            if (isCredit && supplier != null)
            {
                if (!supplier.IsActive)
                {
                    return BadRequest(ApiResponse.Fail($"Cannot make credit purchase from inactive supplier '{supplier.Name}'."));
                }

                // Check credit limit
                var latestLedger = await _db.SupplierLedgers
                    .Where(l => l.SupplierId == supplier.Id)
                    .OrderByDescending(l => l.EntryDate)
                    .ThenByDescending(l => l.CreatedAt)
                    .FirstOrDefaultAsync();

                var currentBal = latestLedger?.Balance ?? supplier.OpeningBalance;
                var projected = currentBal + dueAmount;
                if (supplier.CreditLimit > 0 && projected > supplier.CreditLimit)
                {
                    return BadRequest(ApiResponse.Fail(
                        $"Credit limit exceeded for supplier '{supplier.Name}'. Current: Rs. {currentBal:N2}, New Due: Rs. {dueAmount:N2}, Projected: Rs. {projected:N2}, Limit: Rs. {supplier.CreditLimit:N2}."
                    ));
                }
            }

            // Build initial payment record if paid
            var initialPayments = new List<PurchasePaymentRecordDto>();
            if (paidAmount > 0)
            {
                initialPayments.Add(new PurchasePaymentRecordDto(
                    PaymentId: Guid.NewGuid().ToString("N"),
                    Amount: paidAmount,
                    PaymentMethod: paymentMethod,
                    PaymentDate: purchaseDate,
                    ReferenceNumber: req.SupplierInvoiceNumber ?? poNumber,
                    PaidBy: req.CreatedBy ?? "Admin",
                    CashOrBankAccount: paymentMethod == "Cash" ? "Cash in Hand" : "Commercial Bank",
                    Notes: "Initial payment on purchase creation"
                ));
            }

            var po = new PurchaseOrder
            {
                HotelId = hotelId,
                PoNumber = poNumber,
                InvoiceNumber = req.SupplierInvoiceNumber?.Trim(),
                PanVatNumber = panVatNumber,
                SupplierId = supplierId,
                SupplierName = supplierName,
                PurchaseType = req.PurchaseType ?? (isCredit ? "CREDIT" : "INVENTORY"),
                Subtotal = subtotal,
                Discount = totalDiscount,
                Tax = taxAmount,
                FreightCharges = freight,
                AdditionalCharges = additional,
                RoundOff = roundOff,
                TotalAmount = grandTotal,
                PaidAmount = paidAmount,
                DueAmount = dueAmount,
                PaymentMethod = paymentMethod,
                PaymentStatus = paymentStatus,
                ReceivingStatus = receivingStatus,
                Status = status,
                BranchOrOutlet = req.BranchOrOutlet ?? "Restaurant Main",
                Warehouse = req.Warehouse ?? "Central Store",
                PurchaseOrderRef = req.PurchaseOrderRef,
                GrnNumber = req.GrnNumber ?? (!string.IsNullOrWhiteSpace(req.PurchaseOrderRef) ? $"GRN-{year}-{Random.Shared.Next(1000, 9999)}" : null),
                Notes = req.Notes?.Trim(),
                CreatedBy = req.CreatedBy ?? "Admin",
                ItemsJson = JsonSerializer.Serialize(req.Items),
                PaymentsJson = JsonSerializer.Serialize(initialPayments),
                ReturnsJson = "[]",
                OrderedAt = purchaseDate,
                InvoiceDate = invoiceDate,
                ReceivedAt = receivingStatus == "FULLY_RECEIVED" ? purchaseDate : null,
                DueDate = dueDate
            };

            _db.PurchaseOrders.Add(po);

            // Inventory receiving updates if goods are accepted & receivingStatus is FULLY_RECEIVED
            if (receivingStatus == "FULLY_RECEIVED" && status != "DRAFT")
            {
                foreach (var line in req.Items)
                {
                    var dept = !string.IsNullOrWhiteSpace(line.Department) ? line.Department.ToUpper() : "RESTAURANT";
                    InventoryItem? invItem = null;

                    if (!string.IsNullOrWhiteSpace(line.ItemId))
                    {
                        invItem = await _db.InventoryItems.FirstOrDefaultAsync(i => i.Id == line.ItemId);
                    }
                    if (invItem == null)
                    {
                        invItem = await _db.InventoryItems.FirstOrDefaultAsync(i => i.Department == dept && i.Name.ToLower() == line.ItemName.ToLower());
                    }

                    var factor = line.ConversionFactor > 0 ? line.ConversionFactor : (invItem?.ConversionFactor > 0 ? invItem.ConversionFactor : 1.0);
                    var qtyToAdd = (int)Math.Round(line.Quantity * factor);

                    if (invItem != null)
                    {
                        if (invItem.TrackStock)
                        {
                            var prevBal = invItem.CurrentStock;
                            invItem.CurrentStock += qtyToAdd;
                            invItem.LastRestocked = purchaseDate;
                            if (line.UnitCost > 0)
                            {
                                // Weighted average cost calculation
                                var totalOldVal = prevBal * invItem.CostPerUnit;
                                var totalNewVal = line.Quantity * line.UnitCost;
                                if (invItem.CurrentStock > 0)
                                {
                                    invItem.CostPerUnit = Math.Round((totalOldVal + totalNewVal) / invItem.CurrentStock, 2);
                                }
                            }

                            _db.StockMovements.Add(new StockMovement
                            {
                                ItemId = invItem.Id,
                                Quantity = qtyToAdd,
                                PreviousBalance = prevBal,
                                ResultingBalance = invItem.CurrentStock,
                                Type = "PURCHASE",
                                ReferenceNumber = po.PoNumber,
                                Department = invItem.Department,
                                Reason = $"Purchase {po.PoNumber}" + (!string.IsNullOrWhiteSpace(po.InvoiceNumber) ? $" (Inv #{po.InvoiceNumber})" : ""),
                                PerformedBy = po.CreatedBy,
                                CreatedAt = purchaseDate
                            });
                        }
                    }
                    else
                    {
                        // Create item if it doesn't exist
                        var isTrack = !new[] { "FOOD_RAW", "PANTRY", "LINEN", "CLEANING_SUPPLIES", "EQUIPMENT" }.Contains(line.Category?.ToUpper());
                        var newItem = new InventoryItem
                        {
                            HotelId = hotelId,
                            Department = dept,
                            Name = line.ItemName.Trim(),
                            Category = !string.IsNullOrWhiteSpace(line.Category) ? line.Category.ToUpper() : "PANTRY",
                            Sku = $"{(dept == "HOTEL" ? "HOT" : "RST")}-PUR-{Random.Shared.Next(100, 999)}",
                            TrackStock = isTrack,
                            CurrentStock = isTrack ? qtyToAdd : 0,
                            MinThreshold = isTrack ? 5 : 0,
                            Unit = !string.IsNullOrWhiteSpace(line.Unit) ? line.Unit : "pieces",
                            PurchaseUnit = line.PurchaseUnit,
                            ConversionFactor = factor,
                            CostPerUnit = line.UnitCost > 0 ? Math.Round(line.UnitCost / factor, 2) : 0,
                            SupplierId = supplierId,
                            LastRestocked = purchaseDate
                        };
                        _db.InventoryItems.Add(newItem);

                        if (isTrack && qtyToAdd > 0)
                        {
                            _db.StockMovements.Add(new StockMovement
                            {
                                ItemId = newItem.Id,
                                Quantity = qtyToAdd,
                                PreviousBalance = 0,
                                ResultingBalance = qtyToAdd,
                                Type = "PURCHASE",
                                ReferenceNumber = po.PoNumber,
                                Department = dept,
                                Reason = $"Initial Purchase {po.PoNumber}",
                                PerformedBy = po.CreatedBy,
                                CreatedAt = purchaseDate
                            });
                        }
                    }
                }
            }

            // Supplier Ledger Updates
            if (supplier != null && status != "DRAFT")
            {
                var latestLedger = await _db.SupplierLedgers
                    .Where(l => l.SupplierId == supplier.Id)
                    .OrderByDescending(l => l.EntryDate)
                    .ThenByDescending(l => l.CreatedAt)
                    .FirstOrDefaultAsync();

                var currentBal = latestLedger?.Balance ?? supplier.OpeningBalance;

                // 1. Purchase invoice credit entry (increases payable)
                var runningBalAfterInvoice = currentBal + grandTotal;
                var purchaseLedgerEntry = new SupplierLedgerEntry
                {
                    HotelId = hotelId,
                    SupplierId = supplier.Id,
                    PurchaseOrderId = po.Id,
                    TransactionNumber = po.PoNumber,
                    PurchaseInvoiceNumber = po.InvoiceNumber,
                    BranchOrOutlet = po.BranchOrOutlet,
                    EntryDate = purchaseDate,
                    Description = $"Purchase {po.PoNumber}" + (!string.IsNullOrWhiteSpace(po.InvoiceNumber) ? $" (Inv #{po.InvoiceNumber})" : ""),
                    CreditAmount = grandTotal,
                    DebitAmount = 0,
                    Balance = runningBalAfterInvoice,
                    DueDate = dueDate,
                    ReferenceType = (paidAmount >= grandTotal && grandTotal > 0) ? "CASH_PURCHASE" : "PURCHASE_CREDIT",
                    ReferenceId = po.Id,
                    PaymentMode = paymentMethod,
                    CreatedBy = po.CreatedBy,
                    CreatedAt = DateTime.UtcNow
                };
                _db.SupplierLedgers.Add(purchaseLedgerEntry);

                // 2. Immediate payment debit entry (if paidAmount > 0)
                if (paidAmount > 0)
                {
                    var finalBal = runningBalAfterInvoice - paidAmount;
                    var paymentVoucherNo = $"PV-{DateTime.UtcNow.Year}-{Random.Shared.Next(1000, 9999)}";
                    _db.SupplierLedgers.Add(new SupplierLedgerEntry
                    {
                        HotelId = hotelId,
                        SupplierId = supplier.Id,
                        PurchaseOrderId = po.Id,
                        TransactionNumber = paymentVoucherNo,
                        PurchaseInvoiceNumber = po.InvoiceNumber,
                        BranchOrOutlet = po.BranchOrOutlet,
                        EntryDate = purchaseDate.AddSeconds(1),
                        Description = $"Immediate payment on {po.PoNumber} ({paymentMethod})",
                        CreditAmount = 0,
                        DebitAmount = paidAmount,
                        Balance = finalBal,
                        DueDate = null,
                        ReferenceType = "PAYMENT",
                        ReferenceId = paymentVoucherNo,
                        PaymentMode = paymentMethod,
                        CreatedBy = po.CreatedBy,
                        CreatedAt = DateTime.UtcNow.AddSeconds(1)
                    });
                }
            }

            // Double-entry General Ledger Integration
            if (status == "POSTED")
            {
                var inventoryAccount = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "1200")
                                       ?? await _db.Accounts.FirstOrDefaultAsync(a => a.AccountType == "ASSET" && a.SubCategory == "Inventory");

                var apAccount = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "2010")
                                ?? await _db.Accounts.FirstOrDefaultAsync(a => a.AccountType == "LIABILITY" && a.AccountName.Contains("Payable"));

                var cashAccount = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "1020")
                                  ?? await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "1010");

                var bankAccount = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "1050")
                                  ?? await _db.Accounts.FirstOrDefaultAsync(a => a.AccountType == "ASSET" && a.SubCategory == "Bank Accounts");

                var taxAccount = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "2050")
                                 ?? await _db.Accounts.FirstOrDefaultAsync(a => a.AccountType == "ASSET" && a.AccountName.Contains("VAT"));

                if (inventoryAccount != null)
                {
                    var journal = new JournalEntry
                    {
                        HotelId = hotelId,
                        EntryNumber = $"JV-{DateTime.UtcNow.Year}-{Random.Shared.Next(10000, 99999)}",
                        EntryDate = purchaseDate,
                        EntryType = "GENERAL",
                        Reference = po.PoNumber,
                        Description = $"Purchase Invoice {po.PoNumber} - {supplierName}",
                        Status = "POSTED",
                        SourceModule = "PURCHASES",
                        CreatedBy = po.CreatedBy,
                        CreatedAt = DateTime.UtcNow
                    };

                    double totalDebits = 0;
                    double totalCredits = 0;

                    // Debit: Inventory (Goods subtotal minus discounts + freight)
                    var netInventoryCost = Math.Max(0, subtotal - totalDiscount + freight + additional);
                    if (netInventoryCost > 0)
                    {
                        journal.Lines.Add(new JournalEntryLine
                        {
                            AccountId = inventoryAccount.Id,
                            Debit = netInventoryCost,
                            Credit = 0,
                            LineDescription = $"Inventory Purchases - {po.PoNumber}"
                        });
                        totalDebits += netInventoryCost;
                    }

                    // Debit: Input VAT / Tax
                    if (taxAmount > 0 && taxAccount != null)
                    {
                        journal.Lines.Add(new JournalEntryLine
                        {
                            AccountId = taxAccount.Id,
                            Debit = taxAmount,
                            Credit = 0,
                            LineDescription = $"Input Tax / VAT on Purchase {po.PoNumber}"
                        });
                        totalDebits += taxAmount;
                    }

                    // Credit: Cash / Bank for Paid portion
                    if (paidAmount > 0)
                    {
                        var paymentAcc = (paymentMethod == "Cash" ? cashAccount : bankAccount) ?? cashAccount;
                        if (paymentAcc != null)
                        {
                            journal.Lines.Add(new JournalEntryLine
                            {
                                AccountId = paymentAcc.Id,
                                Debit = 0,
                                Credit = paidAmount,
                                LineDescription = $"{paymentMethod} Paid for Purchase {po.PoNumber}"
                            });
                            totalCredits += paidAmount;
                        }
                    }

                    // Credit: Accounts Payable for Due portion
                    if (dueAmount > 0 && apAccount != null)
                    {
                        journal.Lines.Add(new JournalEntryLine
                        {
                            AccountId = apAccount.Id,
                            Debit = 0,
                            Credit = dueAmount,
                            LineDescription = $"Payable to {supplierName} - {po.PoNumber}"
                        });
                        totalCredits += dueAmount;
                    }

                    journal.TotalDebit = Math.Round(totalDebits, 2);
                    journal.TotalCredit = Math.Round(totalCredits, 2);

                    _db.JournalEntries.Add(journal);
                    po.JournalEntryId = journal.Id;
                }
            }

            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            return Ok(ApiResponse.Ok(new
            {
                id = po.Id,
                purchaseNumber = po.PoNumber,
                supplierName = po.SupplierName,
                grandTotal = po.TotalAmount,
                paidAmount = po.PaidAmount,
                dueAmount = po.DueAmount,
                paymentStatus = po.PaymentStatus,
                status = po.Status
            }, $"Purchase transaction '{po.PoNumber}' created successfully."));
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            return BadRequest(ApiResponse.Fail($"Failed to create purchase transaction: {ex.Message}"));
        }
    }

    /// <summary>
    /// Records supplier payment against an existing purchase invoice.
    /// </summary>
    [HttpPost("{id}/payments")]
    public async Task<IActionResult> RecordPurchasePayment(string id, [FromBody] RecordPurchasePaymentRequest req)
    {
        var po = await _db.PurchaseOrders
            .Include(p => p.Supplier)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (po == null)
        {
            return NotFound(ApiResponse.Fail($"Purchase '{id}' not found."));
        }

        if (req.Amount <= 0)
        {
            return BadRequest(ApiResponse.Fail("Payment amount must be greater than zero."));
        }

        var currentDue = po.DueAmount;
        if (req.Amount > currentDue + 0.01)
        {
            return BadRequest(ApiResponse.Fail($"Payment amount Rs. {req.Amount:N2} exceeds invoice balance due of Rs. {currentDue:N2}."));
        }

        using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            var payments = ParsePayments(po.PaymentsJson);
            var paymentDate = req.PaymentDate?.ToUniversalTime() ?? DateTime.UtcNow;

            var newPmt = new PurchasePaymentRecordDto(
                PaymentId: Guid.NewGuid().ToString("N"),
                Amount: req.Amount,
                PaymentMethod: req.PaymentMethod,
                PaymentDate: paymentDate,
                ReferenceNumber: req.ReferenceNumber ?? po.InvoiceNumber ?? po.PoNumber,
                PaidBy: req.PaidBy ?? "Admin",
                CashOrBankAccount: req.CashOrBankAccount ?? (req.PaymentMethod == "Cash" ? "Cash in Hand" : "Commercial Bank"),
                Notes: req.Notes
            );

            payments.Add(newPmt);
            po.PaymentsJson = JsonSerializer.Serialize(payments);

            po.PaidAmount += req.Amount;
            po.DueAmount = Math.Max(0, po.TotalAmount - po.PaidAmount);
            po.PaymentStatus = po.DueAmount <= 0.01 ? "Paid" : "Partially Paid";

            // Record Supplier Ledger Debit Entry (decreases payable)
            if (!string.IsNullOrWhiteSpace(po.SupplierId))
            {
                var latestLedger = await _db.SupplierLedgers
                    .Where(l => l.SupplierId == po.SupplierId)
                    .OrderByDescending(l => l.EntryDate)
                    .ThenByDescending(l => l.CreatedAt)
                    .FirstOrDefaultAsync();

                var currentBal = latestLedger?.Balance ?? po.Supplier?.OpeningBalance ?? 0;
                var newBal = Math.Max(0, currentBal - req.Amount);

                var paymentVoucher = $"PV-{DateTime.UtcNow.Year}-{Random.Shared.Next(1000, 9999)}";
                _db.SupplierLedgers.Add(new SupplierLedgerEntry
                {
                    HotelId = po.HotelId,
                    SupplierId = po.SupplierId,
                    PurchaseOrderId = po.Id,
                    TransactionNumber = paymentVoucher,
                    PurchaseInvoiceNumber = po.InvoiceNumber,
                    BranchOrOutlet = po.BranchOrOutlet,
                    EntryDate = paymentDate,
                    Description = $"Payment for {po.PoNumber}" + (!string.IsNullOrWhiteSpace(po.InvoiceNumber) ? $" (Inv #{po.InvoiceNumber})" : ""),
                    DebitAmount = req.Amount,
                    CreditAmount = 0,
                    Balance = newBal,
                    ReferenceType = "PAYMENT",
                    ReferenceId = paymentVoucher,
                    PaymentMode = req.PaymentMethod,
                    CreatedBy = req.PaidBy ?? "Admin",
                    CreatedAt = DateTime.UtcNow
                });
            }

            // Post General Ledger Journal Entry for payment: Debit AP, Credit Cash/Bank
            var apAccount = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "2010")
                            ?? await _db.Accounts.FirstOrDefaultAsync(a => a.AccountType == "LIABILITY" && a.AccountName.Contains("Payable"));

            var cashAccount = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "1020")
                              ?? await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "1010");

            var bankAccount = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "1050")
                              ?? await _db.Accounts.FirstOrDefaultAsync(a => a.AccountType == "ASSET" && a.SubCategory == "Bank Accounts");

            var paymentAcc = (req.PaymentMethod == "Cash" ? cashAccount : bankAccount) ?? cashAccount;

            if (apAccount != null && paymentAcc != null)
            {
                var journal = new JournalEntry
                {
                    HotelId = po.HotelId,
                    EntryNumber = $"JV-{DateTime.UtcNow.Year}-{Random.Shared.Next(10000, 99999)}",
                    EntryDate = paymentDate,
                    EntryType = "GENERAL",
                    Reference = po.PoNumber,
                    Description = $"Payment to {po.SupplierName} - {po.PoNumber}",
                    Status = "POSTED",
                    SourceModule = "PURCHASES",
                    CreatedBy = req.PaidBy ?? "Admin",
                    TotalDebit = req.Amount,
                    TotalCredit = req.Amount,
                    CreatedAt = DateTime.UtcNow,
                    Lines = new List<JournalEntryLine>
                    {
                        new JournalEntryLine
                        {
                            AccountId = apAccount.Id,
                            Debit = req.Amount,
                            Credit = 0,
                            LineDescription = $"Payable Cleared - {po.SupplierName} ({po.PoNumber})"
                        },
                        new JournalEntryLine
                        {
                            AccountId = paymentAcc.Id,
                            Debit = 0,
                            Credit = req.Amount,
                            LineDescription = $"{req.PaymentMethod} Outflow for Purchase {po.PoNumber}"
                        }
                    }
                };
                _db.JournalEntries.Add(journal);
            }

            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            return Ok(ApiResponse.Ok(new
            {
                paidAmount = po.PaidAmount,
                dueAmount = po.DueAmount,
                paymentStatus = po.PaymentStatus
            }, $"Payment of Rs. {req.Amount:N2} recorded successfully. Remaining due: Rs. {po.DueAmount:N2}."));
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            return BadRequest(ApiResponse.Fail($"Failed to record payment: {ex.Message}"));
        }
    }

    /// <summary>
    /// Processes purchase return / debit note, adjusting inventory, supplier payable, and accounting.
    /// </summary>
    [HttpPost("{id}/returns")]
    public async Task<IActionResult> ProcessPurchaseReturn(string id, [FromBody] ProcessPurchaseReturnRequest req)
    {
        var po = await _db.PurchaseOrders
            .Include(p => p.Supplier)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (po == null)
        {
            return NotFound(ApiResponse.Fail($"Purchase '{id}' not found."));
        }

        if (req.ReturnItems == null || req.ReturnItems.Count == 0)
        {
            return BadRequest(ApiResponse.Fail("Please select at least one item to return."));
        }

        if (string.IsNullOrWhiteSpace(req.Reason))
        {
            return BadRequest(ApiResponse.Fail("Return reason is required."));
        }

        using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            var purchasedItems = ParseItems(po.ItemsJson);
            var existingReturns = ParseReturns(po.ReturnsJson);

            double returnSubtotal = 0;
            double returnTax = 0;

            foreach (var ret in req.ReturnItems)
            {
                var matched = purchasedItems.FirstOrDefault(i => i.ItemName.Equals(ret.ItemName, StringComparison.OrdinalIgnoreCase));
                if (matched == null)
                {
                    return BadRequest(ApiResponse.Fail($"Item '{ret.ItemName}' was not part of original purchase {po.PoNumber}."));
                }

                // Check prior returned quantity
                var previouslyReturned = existingReturns
                    .SelectMany(r => r.Items)
                    .Where(ri => ri.ItemName.Equals(ret.ItemName, StringComparison.OrdinalIgnoreCase))
                    .Sum(ri => ri.ReturnQuantity);

                var remainingEligible = matched.Quantity - previouslyReturned;
                if (ret.ReturnQuantity > remainingEligible)
                {
                    return BadRequest(ApiResponse.Fail($"Return quantity ({ret.ReturnQuantity}) for '{ret.ItemName}' exceeds eligible remaining purchased quantity ({remainingEligible})."));
                }

                var lineSub = ret.ReturnQuantity * (ret.UnitCost > 0 ? ret.UnitCost : matched.UnitCost);
                var lineTax = matched.TaxRate > 0 ? lineSub * (matched.TaxRate / 100.0) : 0;

                returnSubtotal += lineSub;
                returnTax += lineTax;

                // Inventory deduction if goods were received
                if (ret.DeductStock && po.ReceivingStatus == "FULLY_RECEIVED")
                {
                    var invItem = await _db.InventoryItems.FirstOrDefaultAsync(i => i.Id == ret.ItemId || i.Name.ToLower() == ret.ItemName.ToLower());
                    if (invItem != null && invItem.TrackStock)
                    {
                        var prevBal = invItem.CurrentStock;
                        var factor = invItem.ConversionFactor > 0 ? invItem.ConversionFactor : 1.0;
                        var qtyToDeduct = (int)Math.Round(ret.ReturnQuantity * factor);

                        invItem.CurrentStock = Math.Max(0, invItem.CurrentStock - qtyToDeduct);

                        _db.StockMovements.Add(new StockMovement
                        {
                            ItemId = invItem.Id,
                            Quantity = -qtyToDeduct,
                            PreviousBalance = prevBal,
                            ResultingBalance = invItem.CurrentStock,
                            Type = "RETURN",
                            ReferenceNumber = po.PoNumber,
                            Department = invItem.Department,
                            Reason = $"Purchase Return {po.PoNumber}: {req.Reason}",
                            PerformedBy = req.AuthorizedBy ?? "Admin",
                            CreatedAt = DateTime.UtcNow
                        });
                    }
                }
            }

            var totalRefund = returnSubtotal + returnTax;
            var returnNum = $"PR-{DateTime.UtcNow.Year}-{Random.Shared.Next(1000, 9999)}";
            var debitNoteNum = $"DN-{DateTime.UtcNow.Year}-{Random.Shared.Next(1000, 9999)}";

            var returnRecord = new PurchaseReturnRecordDto(
                ReturnId: Guid.NewGuid().ToString("N"),
                ReturnNumber: returnNum,
                ReturnDate: DateTime.UtcNow,
                ReturnedBy: req.AuthorizedBy ?? "Admin",
                Reason: req.Reason,
                ReturnSubtotal: Math.Round(returnSubtotal, 2),
                ReturnTax: Math.Round(returnTax, 2),
                TotalRefundAmount: Math.Round(totalRefund, 2),
                DebitNoteNumber: debitNoteNum,
                Items: req.ReturnItems
            );

            existingReturns.Add(returnRecord);
            po.ReturnsJson = JsonSerializer.Serialize(existingReturns);

            // Deduct due amount or update status
            po.DueAmount = Math.Max(0, po.DueAmount - totalRefund);
            if (po.DueAmount <= 0.01)
            {
                po.PaymentStatus = "Paid";
            }

            // Update supplier ledger if credit purchase
            if (!string.IsNullOrWhiteSpace(po.SupplierId))
            {
                var latestLedger = await _db.SupplierLedgers
                    .Where(l => l.SupplierId == po.SupplierId)
                    .OrderByDescending(l => l.EntryDate)
                    .ThenByDescending(l => l.CreatedAt)
                    .FirstOrDefaultAsync();

                var currentBal = latestLedger?.Balance ?? po.Supplier?.OpeningBalance ?? 0;
                var newBal = Math.Max(0, currentBal - totalRefund);

                _db.SupplierLedgers.Add(new SupplierLedgerEntry
                {
                    HotelId = po.HotelId,
                    SupplierId = po.SupplierId,
                    PurchaseOrderId = po.Id,
                    TransactionNumber = debitNoteNum,
                    PurchaseInvoiceNumber = po.InvoiceNumber,
                    BranchOrOutlet = po.BranchOrOutlet,
                    EntryDate = DateTime.UtcNow,
                    Description = $"Purchase Return {returnNum} / Debit Note {debitNoteNum} ({req.Reason})",
                    DebitAmount = totalRefund,
                    CreditAmount = 0,
                    Balance = newBal,
                    ReferenceType = "DEBIT_NOTE",
                    ReferenceId = debitNoteNum,
                    CreatedBy = req.AuthorizedBy ?? "Admin",
                    CreatedAt = DateTime.UtcNow
                });
            }

            // Post double-entry reversal: Debit AP, Credit Inventory
            var apAccount = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "2010");
            var inventoryAccount = await _db.Accounts.FirstOrDefaultAsync(a => a.AccountCode == "1200");

            if (apAccount != null && inventoryAccount != null)
            {
                var journal = new JournalEntry
                {
                    HotelId = po.HotelId,
                    EntryNumber = $"JV-{DateTime.UtcNow.Year}-{Random.Shared.Next(10000, 99999)}",
                    EntryDate = DateTime.UtcNow,
                    EntryType = "ADJUSTMENT",
                    Reference = debitNoteNum,
                    Description = $"Debit Note {debitNoteNum} / Purchase Return {returnNum} - {po.PoNumber}",
                    Status = "POSTED",
                    SourceModule = "PURCHASES",
                    CreatedBy = req.AuthorizedBy ?? "Admin",
                    TotalDebit = totalRefund,
                    TotalCredit = totalRefund,
                    CreatedAt = DateTime.UtcNow,
                    Lines = new List<JournalEntryLine>
                    {
                        new JournalEntryLine
                        {
                            AccountId = apAccount.Id,
                            Debit = totalRefund,
                            Credit = 0,
                            LineDescription = $"Supplier AP Reduced - Debit Note {debitNoteNum}"
                        },
                        new JournalEntryLine
                        {
                            AccountId = inventoryAccount.Id,
                            Debit = 0,
                            Credit = totalRefund,
                            LineDescription = $"Inventory Returned to Supplier - {returnNum}"
                        }
                    }
                };
                _db.JournalEntries.Add(journal);
            }

            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            return Ok(ApiResponse.Ok(new
            {
                returnNumber = returnNum,
                debitNoteNumber = debitNoteNum,
                totalRefundAmount = totalRefund,
                dueAmount = po.DueAmount
            }, $"Purchase return '{returnNum}' and Debit Note '{debitNoteNum}' processed successfully."));
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            return BadRequest(ApiResponse.Fail($"Failed to process purchase return: {ex.Message}"));
        }
    }

    /// <summary>
    /// Records Goods Received Note (GRN) arrival and adds accepted goods to inventory.
    /// </summary>
    [HttpPost("{id}/receive")]
    public async Task<IActionResult> ReceivePurchaseGoods(string id, [FromBody] ReceivePurchaseGoodsRequest req)
    {
        var po = await _db.PurchaseOrders.FindAsync(id);
        if (po == null)
        {
            return NotFound(ApiResponse.Fail($"Purchase '{id}' not found."));
        }

        if (po.ReceivingStatus == "FULLY_RECEIVED")
        {
            return BadRequest(ApiResponse.Fail("Goods for this purchase order have already been fully received."));
        }

        using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            var grnNumber = req.GrnNumber ?? $"GRN-{DateTime.UtcNow.Year}-{Random.Shared.Next(1000, 9999)}";
            var receivedDate = req.ReceivedDate?.ToUniversalTime() ?? DateTime.UtcNow;

            var itemsToReceive = req.Items != null && req.Items.Count > 0
                ? req.Items
                : ParseItems(po.ItemsJson);

            foreach (var line in itemsToReceive)
            {
                var dept = !string.IsNullOrWhiteSpace(line.Department) ? line.Department.ToUpper() : "RESTAURANT";
                InventoryItem? invItem = null;

                if (!string.IsNullOrWhiteSpace(line.ItemId))
                {
                    invItem = await _db.InventoryItems.FirstOrDefaultAsync(i => i.Id == line.ItemId);
                }
                if (invItem == null)
                {
                    invItem = await _db.InventoryItems.FirstOrDefaultAsync(i => i.Department == dept && i.Name.ToLower() == line.ItemName.ToLower());
                }

                var factor = line.ConversionFactor > 0 ? line.ConversionFactor : (invItem?.ConversionFactor > 0 ? invItem.ConversionFactor : 1.0);
                var qtyToAdd = (int)Math.Round(line.Quantity * factor);

                if (invItem != null && invItem.TrackStock)
                {
                    var prevBal = invItem.CurrentStock;
                    invItem.CurrentStock += qtyToAdd;
                    invItem.LastRestocked = receivedDate;

                    _db.StockMovements.Add(new StockMovement
                    {
                        ItemId = invItem.Id,
                        Quantity = qtyToAdd,
                        PreviousBalance = prevBal,
                        ResultingBalance = invItem.CurrentStock,
                        Type = "PURCHASE",
                        ReferenceNumber = po.PoNumber,
                        Department = invItem.Department,
                        Reason = $"GRN Receiving {grnNumber} for Purchase {po.PoNumber}",
                        PerformedBy = req.ReceivedBy ?? "Store Manager",
                        CreatedAt = receivedDate
                    });
                }
            }

            po.ReceivingStatus = "FULLY_RECEIVED";
            po.GrnNumber = grnNumber;
            po.ReceivedAt = receivedDate;

            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            return Ok(ApiResponse.Ok(new
            {
                grnNumber,
                receivingStatus = po.ReceivingStatus,
                receivedAt = po.ReceivedAt
            }, $"GRN '{grnNumber}' recorded successfully. Inventory updated."));
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            return BadRequest(ApiResponse.Fail($"Failed to record GRN: {ex.Message}"));
        }
    }

    /// <summary>
    /// Cancels a purchase order or draft purchase.
    /// </summary>
    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> CancelPurchase(string id, [FromBody] JsonElement body)
    {
        var po = await _db.PurchaseOrders.FindAsync(id);
        if (po == null)
        {
            return NotFound(ApiResponse.Fail($"Purchase '{id}' not found."));
        }

        if (po.Status == "CANCELLED")
        {
            return BadRequest(ApiResponse.Fail("Purchase transaction is already cancelled."));
        }

        var reason = body.TryGetProperty("reason", out var rProp) ? rProp.GetString() : "Cancelled by User";

        using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            po.Status = "CANCELLED";
            po.Notes = (po.Notes + $" | Cancelled: {reason}").Trim();

            // Reverse inventory movements if stock was received
            var movements = await _db.StockMovements
                .Where(m => m.ReferenceNumber == po.PoNumber && m.Type == "PURCHASE")
                .ToListAsync();

            foreach (var m in movements)
            {
                var invItem = await _db.InventoryItems.FindAsync(m.ItemId);
                if (invItem != null && invItem.TrackStock)
                {
                    var prevBal = invItem.CurrentStock;
                    invItem.CurrentStock = Math.Max(0, invItem.CurrentStock - m.Quantity);

                    _db.StockMovements.Add(new StockMovement
                    {
                        ItemId = invItem.Id,
                        Quantity = -m.Quantity,
                        PreviousBalance = prevBal,
                        ResultingBalance = invItem.CurrentStock,
                        Type = "ADJUSTMENT",
                        ReferenceNumber = po.PoNumber,
                        Department = invItem.Department,
                        Reason = $"Cancellation of Purchase {po.PoNumber}",
                        PerformedBy = "Admin",
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            // Reverse Supplier Ledger entry if due balance existed
            if (!string.IsNullOrWhiteSpace(po.SupplierId) && po.DueAmount > 0)
            {
                var latestLedger = await _db.SupplierLedgers
                    .Where(l => l.SupplierId == po.SupplierId)
                    .OrderByDescending(l => l.EntryDate)
                    .ThenByDescending(l => l.CreatedAt)
                    .FirstOrDefaultAsync();

                var currentBal = latestLedger?.Balance ?? 0;
                var newBal = Math.Max(0, currentBal - po.DueAmount);

                _db.SupplierLedgers.Add(new SupplierLedgerEntry
                {
                    HotelId = po.HotelId,
                    SupplierId = po.SupplierId,
                    PurchaseOrderId = po.Id,
                    EntryDate = DateTime.UtcNow,
                    Description = $"Cancellation reversal of {po.PoNumber}",
                    DebitAmount = po.DueAmount,
                    CreditAmount = 0,
                    Balance = newBal,
                    ReferenceType = "VOID_REVERSAL",
                    ReferenceId = po.Id,
                    CreatedBy = "Admin",
                    CreatedAt = DateTime.UtcNow
                });
            }

            // Void Journal Entry if one was posted
            if (!string.IsNullOrWhiteSpace(po.JournalEntryId))
            {
                var journal = await _db.JournalEntries.FindAsync(po.JournalEntryId);
                if (journal != null && journal.Status == "POSTED")
                {
                    journal.Status = "REVERSED";
                    journal.Description = $"{journal.Description} (REVERSED: {reason})";
                }
            }

            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            return Ok(ApiResponse.Ok(new { status = po.Status }, $"Purchase '{po.PoNumber}' cancelled successfully."));
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            return BadRequest(ApiResponse.Fail($"Failed to cancel purchase: {ex.Message}"));
        }
    }

    /// <summary>
    /// Gets existing approved Purchase Orders that can be converted into purchase transactions.
    /// </summary>
    [HttpGet("purchase-orders")]
    public async Task<IActionResult> GetPendingPurchaseOrders()
    {
        var pos = await _db.PurchaseOrders
            .Include(p => p.Supplier)
            .Where(p => p.Status != "CANCELLED")
            .OrderByDescending(p => p.OrderedAt)
            .Take(50)
            .ToListAsync();

        var result = pos.Select(p => new
        {
            id = p.Id,
            poNumber = p.PoNumber,
            orderedAt = p.OrderedAt,
            supplierId = p.SupplierId,
            supplierName = p.Supplier != null ? p.Supplier.Name : (p.SupplierName ?? "Unregistered"),
            panVatNumber = p.PanVatNumber ?? p.Supplier?.PanVatNumber,
            totalAmount = p.TotalAmount,
            status = p.Status,
            receivingStatus = p.ReceivingStatus,
            itemsJson = p.ItemsJson
        }).ToList();

        return Ok(ApiResponse.Ok(result));
    }

    #endregion
}

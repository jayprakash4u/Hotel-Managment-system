using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Collections.Concurrent;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/inventory")]
public class InventoryController : ControllerBase
{
    private readonly HospitalityDbContext _db;
    private static readonly ConcurrentDictionary<string, DateTime> _processedTransfers = new();
    private static readonly ConcurrentDictionary<string, DateTime> _processedAddStocks = new();

    public InventoryController(HospitalityDbContext db)
    {
        _db = db;
    }

    // =========================================================================
    // 1. INVENTORY ITEMS (FILTERED BY DEPARTMENT: HOTEL / RESTAURANT)
    // =========================================================================

    private class ParsedItemLine
    {
        public string? ItemId { get; set; }
        public string? ItemCode { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public string? Category { get; set; }
        public double Quantity { get; set; }
        public string? PurchaseUnit { get; set; }
        public string? StockUnit { get; set; }
        public string? Unit { get; set; }
        public double StockQuantity { get; set; }
        public double ConversionFactor { get; set; } = 1.0;
        public double TotalCost { get; set; }
        public double UnitCost { get; set; }
        public bool? TrackStock { get; set; }
    }

    private static List<ParsedItemLine> ParsePurchaseOrderItems(string? itemsJson)
    {
        var list = new List<ParsedItemLine>();
        if (string.IsNullOrWhiteSpace(itemsJson)) return list;

        try
        {
            using var doc = JsonDocument.Parse(itemsJson);
            if (doc.RootElement.ValueKind != JsonValueKind.Array) return list;

            foreach (var el in doc.RootElement.EnumerateArray())
            {
                var line = new ParsedItemLine();
                if (el.TryGetProperty("itemId", out var idProp) && idProp.ValueKind == JsonValueKind.String)
                    line.ItemId = idProp.GetString();
                else if (el.TryGetProperty("id", out var id2) && id2.ValueKind == JsonValueKind.String)
                    line.ItemId = id2.GetString();

                if (el.TryGetProperty("itemCode", out var codeProp) && codeProp.ValueKind == JsonValueKind.String)
                    line.ItemCode = codeProp.GetString();
                else if (el.TryGetProperty("sku", out var skuProp) && skuProp.ValueKind == JsonValueKind.String)
                    line.ItemCode = skuProp.GetString();
                else if (el.TryGetProperty("code", out var code2) && code2.ValueKind == JsonValueKind.String)
                    line.ItemCode = code2.GetString();

                if (el.TryGetProperty("itemName", out var nameProp) && nameProp.ValueKind == JsonValueKind.String)
                    line.ItemName = nameProp.GetString() ?? "";
                else if (el.TryGetProperty("name", out var name2) && name2.ValueKind == JsonValueKind.String)
                    line.ItemName = name2.GetString() ?? "";

                if (el.TryGetProperty("category", out var catProp) && catProp.ValueKind == JsonValueKind.String)
                    line.Category = catProp.GetString();

                if (el.TryGetProperty("quantity", out var qProp) && qProp.TryGetDouble(out var q))
                    line.Quantity = q;

                if (el.TryGetProperty("purchaseUnit", out var puProp) && puProp.ValueKind == JsonValueKind.String)
                    line.PurchaseUnit = puProp.GetString();
                else if (el.TryGetProperty("unit", out var uProp) && uProp.ValueKind == JsonValueKind.String)
                    line.PurchaseUnit = uProp.GetString();

                if (el.TryGetProperty("unit", out var unProp) && unProp.ValueKind == JsonValueKind.String)
                    line.Unit = unProp.GetString();

                if (el.TryGetProperty("stockUnit", out var suProp) && suProp.ValueKind == JsonValueKind.String)
                    line.StockUnit = suProp.GetString();

                if (el.TryGetProperty("conversionFactor", out var cfProp) && cfProp.TryGetDouble(out var cf) && cf > 0)
                    line.ConversionFactor = cf;

                if (el.TryGetProperty("stockQuantity", out var sqProp) && sqProp.TryGetDouble(out var sq))
                    line.StockQuantity = sq;
                else if (el.TryGetProperty("stockQty", out var sq2) && sq2.TryGetDouble(out var sqVal))
                    line.StockQuantity = sqVal;

                if (el.TryGetProperty("totalCost", out var tcProp) && tcProp.TryGetDouble(out var tc))
                    line.TotalCost = tc;
                else if (el.TryGetProperty("total", out var totProp) && totProp.TryGetDouble(out var tot))
                    line.TotalCost = tot;

                if (el.TryGetProperty("unitCost", out var ucProp) && ucProp.TryGetDouble(out var uc))
                    line.UnitCost = uc;
                else if (el.TryGetProperty("unitPrice", out var upProp) && upProp.TryGetDouble(out var up))
                    line.UnitCost = up;

                if (line.TotalCost <= 0 && line.UnitCost > 0 && line.Quantity > 0)
                {
                    line.TotalCost = Math.Round(line.UnitCost * line.Quantity, 2);
                }

                if (el.TryGetProperty("trackStock", out var tsProp) && (tsProp.ValueKind == JsonValueKind.True || tsProp.ValueKind == JsonValueKind.False))
                    line.TrackStock = tsProp.GetBoolean();

                list.Add(line);
            }
        }
        catch
        {
            // Ignore corrupted json rows
        }

        return list;
    }

    private async Task EnrichInventoryItemsAsync(List<InventoryItem> items)
    {
        if (items == null || items.Count == 0) return;

        var itemIds = items.Select(i => i.Id).ToHashSet();

        // Load confirmed purchase orders (where Status != "CANCELLED") ordered by OrderedAt asc
        var confirmedPos = await _db.PurchaseOrders
            .Include(p => p.Supplier)
            .Where(p => p.Status != "CANCELLED")
            .OrderBy(p => p.OrderedAt)
            .ToListAsync();

        // Pre-parse items from all confirmed POs
        var parsedPos = confirmedPos.Select(po => new
        {
            Po = po,
            Lines = ParsePurchaseOrderItems(po.ItemsJson)
        }).ToList();

        // Load stock movements for these items
        var movements = await _db.StockMovements
            .Where(m => itemIds.Contains(m.ItemId))
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();

        var movementsByItem = movements.GroupBy(m => m.ItemId).ToDictionary(g => g.Key, g => g.ToList());

        foreach (var item in items)
        {
            // Find all confirmed purchase lines matching this item
            var itemPurchases = new List<(PurchaseOrder Po, ParsedItemLine Line)>();

            foreach (var p in parsedPos)
            {
                var matchedLine = p.Lines.FirstOrDefault(l =>
                    (!string.IsNullOrWhiteSpace(l.ItemId) && l.ItemId == item.Id) ||
                    (!string.IsNullOrWhiteSpace(l.ItemName) && l.ItemName.Trim().Equals(item.Name.Trim(), StringComparison.OrdinalIgnoreCase))
                );

                if (matchedLine != null)
                {
                    if (matchedLine.TotalCost <= 0 && p.Lines.Count == 1 && p.Po.TotalAmount > 0)
                    {
                        matchedLine.TotalCost = p.Po.TotalAmount;
                    }
                    itemPurchases.Add((p.Po, matchedLine));
                }
            }

            // Movements for this item
            movementsByItem.TryGetValue(item.Id, out var itemMovements);
            itemMovements ??= new List<StockMovement>();

            // 1. Purchase Amounts & Dates calculation
            if (itemPurchases.Count > 0)
            {
                // Total Purchase Amount: Cumulative recorded purchase spending for this inventory item
                item.TotalPurchaseAmount = Math.Round(itemPurchases.Sum(ip => ip.Line.TotalCost), 2);

                var latest = itemPurchases.Last();
                item.LastPurchaseDate = latest.Po.OrderedAt;
                var pu = !string.IsNullOrWhiteSpace(latest.Line.PurchaseUnit) ? latest.Line.PurchaseUnit : item.Unit;
                item.LastPurchaseQuantity = $"{latest.Line.Quantity} {pu}";
                item.LastPurchaseAmount = Math.Round(latest.Line.TotalCost, 2);
                item.LastSupplierName = latest.Po.Supplier?.Name ?? latest.Po.SupplierName ?? (item.Supplier?.Name ?? "Walk-in / Unregistered Supplier");

                if (itemPurchases.Count >= 2)
                {
                    var prev = itemPurchases[itemPurchases.Count - 2];
                    item.PreviousPurchaseDate = prev.Po.OrderedAt;
                    item.PreviousPurchaseAmount = Math.Round(prev.Line.TotalCost, 2);
                }
                else
                {
                    item.PreviousPurchaseDate = null;
                    item.PreviousPurchaseAmount = null;
                }
            }
            else
            {
                item.TotalPurchaseAmount = 0;
                item.LastPurchaseAmount = null;
                item.PreviousPurchaseAmount = null;
                item.LastPurchaseDate = null;
                item.PreviousPurchaseDate = null;
                item.LastPurchaseQuantity = null;
                item.LastSupplierName = item.Supplier?.Name ?? "—";
            }

            // 2. Stock Quantities calculation
            if (!item.TrackStock)
            {
                item.PreviousStock = null;
                item.RecentlyAddedStock = null;
                item.StockStatus = "NOT_TRACKED";
            }
            else
            {
                if (itemPurchases.Count > 0)
                {
                    var latest = itemPurchases.Last();
                    var factor = latest.Line.ConversionFactor > 0 ? latest.Line.ConversionFactor : (item.ConversionFactor > 0 ? item.ConversionFactor : 1.0);
                    item.RecentlyAddedStock = (int)Math.Round(latest.Line.Quantity * factor);

                    // Previous Stock: Stock quantity immediately before the latest confirmed purchase
                    var purchaseMovements = itemMovements.Where(m => m.Type == "PURCHASE").OrderBy(m => m.CreatedAt).ToList();
                    var latestPurchaseMovement = purchaseMovements.LastOrDefault();

                    if (latestPurchaseMovement != null && latestPurchaseMovement.PreviousBalance.HasValue)
                    {
                        item.PreviousStock = latestPurchaseMovement.PreviousBalance.Value;
                    }
                    else if (latestPurchaseMovement != null)
                    {
                        var prevMovements = itemMovements.Where(m => m.CreatedAt < latestPurchaseMovement.CreatedAt).ToList();
                        item.PreviousStock = prevMovements.LastOrDefault()?.ResultingBalance ?? 0;
                    }
                    else
                    {
                        item.PreviousStock = 0;
                    }
                }
                else
                {
                    item.RecentlyAddedStock = 0;
                    item.PreviousStock = 0;
                }

                // Current Stock Status
                if (item.CurrentStock <= 0)
                {
                    item.StockStatus = "OUT_OF_STOCK";
                }
                else if (item.MinThreshold > 0 && item.CurrentStock <= item.MinThreshold)
                {
                    item.StockStatus = "LOW_STOCK";
                }
                else
                {
                    item.StockStatus = "IN_STOCK";
                }
            }
        }
    }

    [HttpGet]
    [HttpGet("items")]
    public async Task<IActionResult> GetInventory(
        [FromQuery] string? department,
        [FromQuery] string? category,
        [FromQuery] string? search,
        [FromQuery] bool? lowStockOnly)
    {
        var query = _db.InventoryItems.Include(i => i.Supplier).AsQueryable();

        // Filter by Department (HOTEL or RESTAURANT)
        if (!string.IsNullOrWhiteSpace(department) && !department.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            var dept = department.Trim().ToUpper();
            query = query.Where(i => i.Department.ToUpper() == dept);
        }

        // Filter by Category
        if (!string.IsNullOrWhiteSpace(category) && !category.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(i => i.Category.ToLower() == category.ToLower());
        }

        // Search by Name, SKU, or Category
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(i =>
                i.Name.ToLower().Contains(s) ||
                i.Sku.ToLower().Contains(s) ||
                i.Category.ToLower().Contains(s)
            );
        }

        // Low stock filter
        if (lowStockOnly == true)
        {
            query = query.Where(i => i.CurrentStock <= i.MinThreshold);
        }

        var items = await query.OrderBy(i => i.Name).ToListAsync();
        await EnrichInventoryItemsAsync(items);

        return Ok(ApiResponse.Ok(items));
    }

    [HttpGet("items/{id}")]
    public async Task<IActionResult> GetItemById(string id)
    {
        var item = await _db.InventoryItems
            .Include(i => i.Supplier)
            .Include(i => i.Movements.OrderByDescending(m => m.CreatedAt).Take(20))
            .FirstOrDefaultAsync(i => i.Id == id || i.Sku.ToLower() == id.ToLower());

        if (item == null)
        {
            return NotFound(ApiResponse.Fail($"Item '{id}' not found."));
        }

        await EnrichInventoryItemsAsync(new List<InventoryItem> { item });
        return Ok(ApiResponse.Ok(item));
    }

    [HttpGet("items/{id}/history")]
    public async Task<IActionResult> GetItemHistory(string id)
    {
        var item = await _db.InventoryItems
            .Include(i => i.Supplier)
            .FirstOrDefaultAsync(i => i.Id == id || i.Sku.ToLower() == id.ToLower());

        if (item == null)
        {
            return NotFound(ApiResponse.Fail($"Item '{id}' not found."));
        }

        await EnrichInventoryItemsAsync(new List<InventoryItem> { item });

        var movements = await _db.StockMovements
            .Where(m => m.ItemId == item.Id)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();

        // Load confirmed purchases matching this item to attach exact purchase amounts & units
        var confirmedPos = await _db.PurchaseOrders
            .Include(p => p.Supplier)
            .Where(p => p.Status != "CANCELLED")
            .OrderBy(p => p.OrderedAt)
            .ToListAsync();

        var poList = confirmedPos.Select(po => new
        {
            Po = po,
            Lines = ParsePurchaseOrderItems(po.ItemsJson)
        }).ToList();

        int totalStockAdded = movements.Where(m => m.Quantity > 0).Sum(m => m.Quantity);
        int totalStockRemoved = movements.Where(m => m.Quantity < 0).Sum(m => Math.Abs(m.Quantity));

        var initialMovement = movements.FirstOrDefault(m => m.Type == "INITIAL_STOCK");
        int openingStock = initialMovement != null
            ? initialMovement.Quantity
            : Math.Max(0, item.CurrentStock - totalStockAdded + totalStockRemoved);

        int runningBalance = openingStock;
        var historyRows = new List<object>();

        foreach (var m in movements)
        {
            int stockIn = m.Quantity > 0 ? m.Quantity : 0;
            int stockOut = m.Quantity < 0 ? Math.Abs(m.Quantity) : 0;

            if (m.Type == "INITIAL_STOCK")
            {
                runningBalance = m.Quantity;
            }
            else
            {
                runningBalance += m.Quantity;
            }

            var balance = m.ResultingBalance ?? runningBalance;

            string activity = m.Type switch
            {
                "PURCHASE" => "Confirmed Purchase",
                "INITIAL_STOCK" => "Opening Stock",
                "POS_CONSUMPTION" or "SALE" or "DINE_IN" => "Sale / Consumption",
                "HOUSEKEEPING_USAGE" => "Housekeeping Usage",
                "KITCHEN_USAGE" => "Kitchen Usage",
                "TRANSFER_IN" => "Stock Transfer In",
                "TRANSFER_OUT" => "Stock Transfer Out",
                "ADJUSTMENT_IN" or "ADJUSTMENT_OUT" or "ADJUSTMENT" => "Stock Adjustment",
                "RETURN" => "Vendor Return",
                _ => m.Type
            };

            string reference = !string.IsNullOrWhiteSpace(m.TransferNumber)
                ? m.TransferNumber
                : (!string.IsNullOrWhiteSpace(m.Reason) ? m.Reason : m.Id.Substring(0, Math.Min(8, m.Id.Length)));

            // Try to match purchase details if this was a purchase
            double? purchaseAmount = null;
            string? purchaseQuantity = null;
            string? supplierName = null;

            if (m.Type == "PURCHASE")
            {
                var matchedPo = poList.FirstOrDefault(p =>
                    Math.Abs((p.Po.OrderedAt - m.CreatedAt).TotalHours) < 24 &&
                    p.Lines.Any(l => (!string.IsNullOrWhiteSpace(l.ItemId) && l.ItemId == item.Id) ||
                                     (!string.IsNullOrWhiteSpace(l.ItemName) && l.ItemName.Trim().Equals(item.Name.Trim(), StringComparison.OrdinalIgnoreCase)))
                );

                if (matchedPo != null)
                {
                    var line = matchedPo.Lines.First(l => (!string.IsNullOrWhiteSpace(l.ItemId) && l.ItemId == item.Id) ||
                                                          (!string.IsNullOrWhiteSpace(l.ItemName) && l.ItemName.Trim().Equals(item.Name.Trim(), StringComparison.OrdinalIgnoreCase)));
                    purchaseAmount = line.TotalCost > 0 ? line.TotalCost : (matchedPo.Po.TotalAmount > 0 ? matchedPo.Po.TotalAmount : null);
                    var pu = !string.IsNullOrWhiteSpace(line.PurchaseUnit) ? line.PurchaseUnit : item.Unit;
                    purchaseQuantity = $"{line.Quantity} {pu}";
                    supplierName = matchedPo.Po.Supplier?.Name ?? matchedPo.Po.SupplierName ?? "Walk-in Supplier";
                }
            }

            historyRows.Add(new
            {
                id = m.Id,
                date = m.CreatedAt,
                activity,
                rawType = m.Type,
                reference,
                purchaseQuantity,
                purchaseAmount,
                supplierName,
                stockIn,
                stockOut,
                balance,
                reason = m.Reason,
                performedBy = m.PerformedBy
            });
        }

        historyRows.Reverse();

        var result = new
        {
            item = new
            {
                id = item.Id,
                name = item.Name,
                department = item.Department,
                category = item.Category,
                sku = item.Sku,
                unit = item.Unit,
                purchaseUnit = item.PurchaseUnit,
                conversionFactor = item.ConversionFactor,
                trackStock = item.TrackStock,
                previousStock = item.PreviousStock,
                recentlyAddedStock = item.RecentlyAddedStock,
                currentStock = item.CurrentStock,
                minThreshold = item.MinThreshold,
                previousPurchaseDate = item.PreviousPurchaseDate,
                lastPurchaseDate = item.LastPurchaseDate,
                lastPurchaseQuantity = item.LastPurchaseQuantity,
                previousPurchaseAmount = item.PreviousPurchaseAmount,
                lastPurchaseAmount = item.LastPurchaseAmount,
                totalPurchaseAmount = item.TotalPurchaseAmount,
                lastSupplier = item.LastSupplierName,
                stockStatus = item.StockStatus
            },
            summary = new
            {
                openingStock,
                totalStockAdded,
                totalStockRemoved,
                currentStock = item.CurrentStock,
                totalPurchaseAmount = item.TotalPurchaseAmount
            },
            history = historyRows
        };

        return Ok(ApiResponse.Ok(result));
    }

    [HttpGet("items/{id}/purchases")]
    public async Task<IActionResult> GetItemPurchases(string id)
    {
        var item = await _db.InventoryItems
            .Include(i => i.Supplier)
            .FirstOrDefaultAsync(i => i.Id == id || i.Sku.ToLower() == id.ToLower());

        if (item == null)
        {
            return NotFound(ApiResponse.Fail($"Item '{id}' not found."));
        }

        var confirmedPos = await _db.PurchaseOrders
            .Include(p => p.Supplier)
            .Where(p => p.Status != "CANCELLED")
            .OrderBy(p => p.OrderedAt)
            .ToListAsync();

        var transactions = new List<object>();
        double totalItemPurchaseAmount = 0;
        double totalQuantityPurchased = 0;
        DateTime? firstPurchaseDate = null;
        DateTime? lastPurchaseDate = null;
        int sn = 1;

        foreach (var po in confirmedPos)
        {
            var lines = ParsePurchaseOrderItems(po.ItemsJson);
            var matchingLines = lines.Where(l =>
                (!string.IsNullOrEmpty(l.ItemId) && (l.ItemId == item.Id || l.ItemId == item.Sku)) ||
                (!string.IsNullOrEmpty(l.ItemCode) && l.ItemCode.Equals(item.Sku, StringComparison.OrdinalIgnoreCase)) ||
                (!string.IsNullOrEmpty(l.ItemName) && l.ItemName.Equals(item.Name, StringComparison.OrdinalIgnoreCase))
            ).ToList();

            foreach (var line in matchingLines)
            {
                double factor = line.ConversionFactor > 0 ? line.ConversionFactor : (item.ConversionFactor > 0 ? item.ConversionFactor : 1.0);
                double convertedQty = line.StockQuantity > 0 ? line.StockQuantity : (line.Quantity * factor);
                double lineCost = line.TotalCost > 0 ? line.TotalCost : po.TotalAmount;

                totalItemPurchaseAmount += lineCost;
                totalQuantityPurchased += convertedQty;

                if (!firstPurchaseDate.HasValue || po.OrderedAt < firstPurchaseDate.Value)
                    firstPurchaseDate = po.OrderedAt;
                if (!lastPurchaseDate.HasValue || po.OrderedAt > lastPurchaseDate.Value)
                    lastPurchaseDate = po.OrderedAt;

                string supplierName = po.Supplier?.Name ?? po.SupplierName ?? "Walk-in / Unregistered Supplier";

                transactions.Add(new
                {
                    sn = sn++,
                    purchaseId = po.Id,
                    purchaseNumber = po.PoNumber,
                    purchaseDate = po.OrderedAt,
                    supplierName,
                    supplierId = po.SupplierId,
                    supplierPhone = po.Supplier?.Phone,
                    supplierEmail = po.Supplier?.Email,
                    supplierAddress = po.Supplier?.Address,
                    supplierPan = po.Supplier?.PanVatNumber ?? po.PanVatNumber,
                    purchaseQuantity = line.Quantity,
                    purchaseUnit = line.PurchaseUnit ?? item.PurchaseUnit ?? item.Unit,
                    stockUnit = item.Unit,
                    conversionFactor = factor,
                    convertedStockQuantity = convertedQty,
                    totalPurchaseAmount = lineCost,
                    purchaseType = po.PurchaseType ?? "FULL",
                    paymentMethod = po.PaymentMethod ?? "Cash",
                    paymentStatus = po.PaymentStatus ?? "Paid",
                    invoiceNumber = !string.IsNullOrWhiteSpace(po.InvoiceNumber) ? po.InvoiceNumber : "—",
                    status = po.Status,
                    subtotal = po.Subtotal,
                    discount = po.Discount,
                    tax = po.Tax,
                    additionalCharges = po.AdditionalCharges,
                    notes = po.Notes,
                    attachmentUrl = po.AttachmentUrl,
                    createdBy = po.CreatedBy ?? "Admin",
                    createdAt = po.OrderedAt
                });
            }
        }

        // Return latest first
        var sortedTransactions = transactions.AsEnumerable().Reverse().ToList();

        var summary = new
        {
            itemId = item.Id,
            itemName = item.Name,
            itemCode = item.Sku,
            category = item.Category,
            department = item.Department,
            stockUnit = item.Unit,
            purchaseUnit = item.PurchaseUnit ?? item.Unit,
            trackStock = item.TrackStock,
            currentStock = item.CurrentStock,
            totalQuantityPurchased,
            totalPurchaseAmount = totalItemPurchaseAmount,
            firstPurchaseDate,
            lastPurchaseDate,
            totalTransactions = sortedTransactions.Count
        };

        return Ok(ApiResponse.Ok(new
        {
            summary,
            transactions = sortedTransactions
        }));
    }

    public record CreateInventoryItemRequest(
        string Name,
        string? Department,
        string Category,
        string? Sku,
        int CurrentStock,
        int MinThreshold,
        string Unit,
        double CostPerUnit,
        string? SupplierId,
        bool? TrackStock = true,
        string? PurchaseUnit = null,
        double? ConversionFactor = 1.0,
        int? OpeningStock = 0
    );

    [HttpPost("items")]
    public async Task<IActionResult> CreateInventoryItem([FromBody] CreateInventoryItemRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
        {
            return BadRequest(ApiResponse.Fail("Item name is required."));
        }

        var dept = (req.Department ?? "HOTEL").Trim().ToUpper();
        if (dept != "HOTEL" && dept != "RESTAURANT")
        {
            dept = "HOTEL";
        }

        // Validate uniqueness: prevent duplicate item in the same department
        var existing = await _db.InventoryItems.FirstOrDefaultAsync(i =>
            i.Department.ToUpper() == dept &&
            i.Name.ToLower() == req.Name.Trim().ToLower());
        if (existing != null)
        {
            return BadRequest(ApiResponse.Fail($"An item named '{req.Name.Trim()}' already exists in {dept} Inventory."));
        }

        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? Guid.NewGuid().ToString("N");

        var sku = req.Sku?.Trim().ToUpper();
        if (string.IsNullOrWhiteSpace(sku))
        {
            var prefix = dept == "HOTEL" ? "HOT" : "RES";
            var catPrefix = req.Category.Length >= 3 ? req.Category.Substring(0, 3).ToUpper() : "ITM";
            sku = $"{prefix}-{catPrefix}-{Random.Shared.Next(100, 999)}";
        }

        var isTrackStock = req.TrackStock ?? true;

        var factor = req.ConversionFactor.HasValue && req.ConversionFactor.Value > 0 ? req.ConversionFactor.Value : 1.0;
        var openingStock = (isTrackStock && req.OpeningStock.HasValue && req.OpeningStock.Value > 0) ? req.OpeningStock.Value : 0;

        var item = new InventoryItem
        {
            HotelId = hotelId,
            Name = req.Name.Trim(),
            Department = dept,
            Category = req.Category.Trim().ToUpper(),
            Sku = sku,
            TrackStock = isTrackStock,
            CurrentStock = openingStock,
            MinThreshold = isTrackStock ? req.MinThreshold : 0,
            Unit = string.IsNullOrWhiteSpace(req.Unit) ? "pieces" : req.Unit.Trim(),
            PurchaseUnit = req.PurchaseUnit,
            ConversionFactor = factor,
            CostPerUnit = req.CostPerUnit,
            SupplierId = req.SupplierId,
            LastRestocked = DateTime.UtcNow
        };

        _db.InventoryItems.Add(item);

        if (isTrackStock && openingStock > 0)
        {
            _db.StockMovements.Add(new StockMovement
            {
                ItemId = item.Id,
                Department = dept,
                Quantity = openingStock,
                PreviousBalance = 0,
                ResultingBalance = openingStock,
                Type = "OPENING_STOCK",
                ReferenceNumber = $"OPN-{item.Sku}",
                Reason = "Initial Opening Stock Balance",
                PerformedBy = "Inventory Manager",
                CreatedAt = DateTime.UtcNow
            });
        }

        await _db.SaveChangesAsync();

        var desc = isTrackStock ? "configured for stock tracking (resale)" : "configured for purchase history only (no stock balance)";
        return Ok(ApiResponse.Ok(item, $"Item '{item.Name}' registered in {dept} Inventory ({desc})."));
    }

    public record UpdateInventoryItemRequest(
        string Name,
        string Category,
        int MinThreshold,
        string Unit,
        double CostPerUnit,
        string? SupplierId,
        bool? TrackStock,
        string? PurchaseUnit = null,
        double? ConversionFactor = 1.0
    );

    [HttpPut("items/{id}")]
    public async Task<IActionResult> UpdateInventoryItem(string id, [FromBody] UpdateInventoryItemRequest req)
    {
        var item = await _db.InventoryItems.FindAsync(id);
        if (item == null)
        {
            return NotFound(ApiResponse.Fail($"Item '{id}' not found."));
        }

        item.Name = req.Name.Trim();
        item.Category = req.Category.Trim().ToUpper();
        if (req.TrackStock.HasValue)
        {
            item.TrackStock = req.TrackStock.Value;
        }
        item.MinThreshold = item.TrackStock ? req.MinThreshold : 0;
        item.Unit = req.Unit.Trim();
        if (!string.IsNullOrWhiteSpace(req.PurchaseUnit))
        {
            item.PurchaseUnit = req.PurchaseUnit.Trim();
        }
        if (req.ConversionFactor.HasValue && req.ConversionFactor.Value > 0)
        {
            item.ConversionFactor = req.ConversionFactor.Value;
        }
        item.CostPerUnit = req.CostPerUnit;
        item.SupplierId = req.SupplierId;

        await _db.SaveChangesAsync();
        return Ok(ApiResponse.Ok(item, $"Item '{item.Name}' updated successfully."));
    }

    [HttpDelete("items/{id}")]
    public async Task<IActionResult> DeleteInventoryItem(string id)
    {
        var item = await _db.InventoryItems.FindAsync(id);
        if (item == null)
        {
            return NotFound(ApiResponse.Fail($"Item '{id}' not found."));
        }

        _db.InventoryItems.Remove(item);
        await _db.SaveChangesAsync();
        return Ok(ApiResponse.Ok(item, $"Item '{item.Name}' deleted from {item.Department} Inventory."));
    }

    // =========================================================================
    // 2. STOCK ADJUSTMENT & MANUAL USAGE DEDUCTION (HOTEL / RESTAURANT)
    // =========================================================================

    public record UpdateStockRequest(string Id, int? QuantityToAdd, int? NewStock, string? Reason, string? PerformedBy);

    [HttpPatch]
    [HttpPatch("stock")]
    public async Task<IActionResult> UpdateStock([FromBody] UpdateStockRequest req)
    {
        var item = await _db.InventoryItems.FindAsync(req.Id);
        if (item == null)
        {
            return NotFound(ApiResponse.Fail("Inventory item not found."));
        }

        int delta = 0;
        if (req.NewStock.HasValue)
        {
            delta = req.NewStock.Value - item.CurrentStock;
            item.CurrentStock = req.NewStock.Value;
        }
        else if (req.QuantityToAdd.HasValue)
        {
            delta = req.QuantityToAdd.Value;
            item.CurrentStock += delta;
        }

        item.LastRestocked = DateTime.UtcNow;

        if (delta != 0)
        {
            _db.StockMovements.Add(new StockMovement
            {
                ItemId = item.Id,
                Department = item.Department,
                Quantity = delta,
                Type = delta > 0 ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT",
                Reason = req.Reason ?? "Manual inventory adjustment",
                PerformedBy = req.PerformedBy ?? "Inventory Manager",
                CreatedAt = DateTime.UtcNow
            });
        }

        await _db.SaveChangesAsync();
        return Ok(ApiResponse.Ok(item, $"Stock updated for {item.Name} to {item.CurrentStock} {item.Unit}."));
    }

    // =========================================================================
    // 2B. ADD STOCK (ITEM, QUANTITY, UNIT, TOTAL COST, SUPPLIER, DATE, INVOICE)
    // =========================================================================

    public record AddStockRequest(
        string ItemId,
        double QuantityAdded,
        string Unit,
        double TotalCost,
        string? SupplierId,
        DateTime? PurchaseDate,
        string? InvoiceNumber,
        string? PerformedBy,
        string? IdempotencyKey
    );

    [HttpPost("add-stock")]
    public async Task<IActionResult> AddStock([FromBody] AddStockRequest req)
    {
        // 1. Validation
        if (string.IsNullOrWhiteSpace(req.ItemId))
        {
            return BadRequest(ApiResponse.Fail("Item Name is required. Please select an inventory item."));
        }

        if (req.QuantityAdded <= 0)
        {
            return BadRequest(ApiResponse.Fail("Quantity Added must be greater than zero."));
        }

        if (string.IsNullOrWhiteSpace(req.Unit))
        {
            return BadRequest(ApiResponse.Fail("Unit is required."));
        }

        if (req.TotalCost < 0)
        {
            return BadRequest(ApiResponse.Fail("Total Cost must be zero or greater."));
        }

        var purchaseDate = req.PurchaseDate ?? DateTime.UtcNow;

        // 2. Prevent duplicate submissions caused by repeated clicks
        if (!string.IsNullOrWhiteSpace(req.IdempotencyKey))
        {
            if (_processedAddStocks.TryGetValue(req.IdempotencyKey, out var processedTime))
            {
                if (DateTime.UtcNow - processedTime < TimeSpan.FromMinutes(10))
                {
                    var existingItem = await _db.InventoryItems.FindAsync(req.ItemId);
                    return Ok(ApiResponse.Ok(new
                    {
                        item = existingItem,
                        message = "Duplicate submission prevented. Purchase was already saved."
                    }, "Duplicate submission prevented by idempotency lock."));
                }
            }
        }

        // 3. Database Transaction
        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var item = await _db.InventoryItems.Include(i => i.Supplier).FirstOrDefaultAsync(i => i.Id == req.ItemId);
            if (item == null)
            {
                await transaction.RollbackAsync();
                return NotFound(ApiResponse.Fail("Selected inventory item was not found."));
            }

            int? previousBalance = null;
            int? newBalance = null;
            StockMovement? movement = null;

            // Behavior 1: Products Bought for Resale (TrackStock == true)
            // Examples: Beer, Coca-Cola, Bottled Water, Packaged Juice, Snacks
            if (item.TrackStock)
            {
                previousBalance = item.CurrentStock;
                var addInt = (int)Math.Round(req.QuantityAdded);
                newBalance = previousBalance + addInt;

                // Update item stock and unit
                item.CurrentStock = newBalance.Value;
                item.Unit = req.Unit.Trim();
                item.LastRestocked = purchaseDate;

                if (!string.IsNullOrWhiteSpace(req.SupplierId))
                {
                    item.SupplierId = req.SupplierId;
                }

                if (req.QuantityAdded > 0 && req.TotalCost >= 0)
                {
                    item.CostPerUnit = Math.Round(req.TotalCost / req.QuantityAdded, 2);
                }

                // Create StockMovement audit record with previous and resulting balance
                var invoiceText = !string.IsNullOrWhiteSpace(req.InvoiceNumber) ? $" (Invoice: {req.InvoiceNumber.Trim()})" : "";
                var reason = $"Stock purchase of {req.QuantityAdded} {item.Unit}{invoiceText}. Previous: {previousBalance}, New Balance: {newBalance} {item.Unit}. Total Cost: Rs. {req.TotalCost:N2}";

                movement = new StockMovement
                {
                    ItemId = item.Id,
                    Department = item.Department,
                    Quantity = addInt,
                    PreviousBalance = previousBalance,
                    ResultingBalance = newBalance,
                    Type = "PURCHASE",
                    Reason = reason,
                    PerformedBy = req.PerformedBy ?? "Inventory Manager",
                    CreatedAt = purchaseDate
                };
                _db.StockMovements.Add(movement);

                // Automatically synchronize stock with any linked POS product for resale
                var linkedProducts = await _db.POSProducts
                    .Where(p => p.InventoryItemId == item.Id || (p.TrackStock && p.Name.ToLower() == item.Name.ToLower()))
                    .ToListAsync();
                foreach (var lp in linkedProducts)
                {
                    lp.Stock += addInt;
                    lp.TrackStock = true;
                    if (lp.Stock > 0)
                    {
                        lp.IsAvailable = true;
                    }
                }
            }
            else
            {
                // Behavior 2: All Other Purchases — Purchase History Only (TrackStock == false)
                // Examples: Kitchen ingredients, Equipment, Hotel supplies, Cleaning supplies
                // - Do NOT track remaining stock.
                // - Do NOT create a stock balance or StockMovement.
                item.Unit = req.Unit.Trim();
                item.LastRestocked = purchaseDate;

                if (!string.IsNullOrWhiteSpace(req.SupplierId))
                {
                    item.SupplierId = req.SupplierId;
                }

                if (req.QuantityAdded > 0 && req.TotalCost >= 0)
                {
                    item.CostPerUnit = Math.Round(req.TotalCost / req.QuantityAdded, 2);
                }
            }

            // Both behaviors: Record the purchase order to preserve purchase history and supplier information
            var poNumber = !string.IsNullOrWhiteSpace(req.InvoiceNumber)
                ? $"INV-{req.InvoiceNumber.Trim()}"
                : $"PO-{purchaseDate.Year}-{Random.Shared.Next(1000, 9999)}";

            var po = new PurchaseOrder
            {
                HotelId = item.HotelId,
                SupplierId = !string.IsNullOrWhiteSpace(req.SupplierId) ? req.SupplierId : null,
                InvoiceNumber = req.InvoiceNumber?.Trim(),
                TotalAmount = req.TotalCost,
                Status = "RECEIVED",
                PoNumber = poNumber,
                ItemsJson = JsonSerializer.Serialize(new[]
                {
                    new
                    {
                        itemId = item.Id,
                        itemName = item.Name,
                        category = item.Category,
                        department = item.Department,
                        quantity = req.QuantityAdded,
                        unit = req.Unit.Trim(),
                        totalCost = req.TotalCost,
                        invoiceNumber = req.InvoiceNumber?.Trim(),
                        previousBalance,
                        resultingBalance = newBalance,
                        trackStock = item.TrackStock,
                        purchaseDate
                    }
                }),
                AllocationsJson = JsonSerializer.Serialize(new[]
                {
                    new
                    {
                        itemName = item.Name,
                        quantity = req.QuantityAdded,
                        hotelQty = item.Department == "HOTEL" ? req.QuantityAdded : 0,
                        restaurantQty = item.Department == "RESTAURANT" ? req.QuantityAdded : 0
                    }
                }),
                OrderedAt = purchaseDate,
                ReceivedAt = purchaseDate
            };
            _db.PurchaseOrders.Add(po);

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            if (!string.IsNullOrWhiteSpace(req.IdempotencyKey))
            {
                _processedAddStocks[req.IdempotencyKey] = DateTime.UtcNow;
            }

            var result = new
            {
                item = new
                {
                    id = item.Id,
                    name = item.Name,
                    department = item.Department,
                    sku = item.Sku,
                    trackStock = item.TrackStock,
                    previousBalance,
                    resultingBalance = newBalance,
                    currentStock = item.TrackStock ? item.CurrentStock : 0,
                    unit = item.Unit,
                    costPerUnit = item.CostPerUnit
                },
                purchase = new
                {
                    id = po.Id,
                    poNumber = po.PoNumber,
                    invoiceNumber = po.InvoiceNumber,
                    totalCost = po.TotalAmount,
                    quantityAdded = req.QuantityAdded,
                    purchaseDate = po.OrderedAt,
                    supplierId = po.SupplierId
                },
                movement = movement != null ? new
                {
                    id = movement.Id,
                    quantity = movement.Quantity,
                    previousBalance = movement.PreviousBalance,
                    resultingBalance = movement.ResultingBalance,
                    reason = movement.Reason,
                    createdAt = movement.CreatedAt
                } : null
            };

            var successMsg = item.TrackStock
                ? $"Stock purchase of {req.QuantityAdded} {item.Unit} saved. Current stock is now {item.CurrentStock} {item.Unit}."
                : $"Purchase recorded for '{item.Name}' ({req.QuantityAdded} {item.Unit}, Rs. {req.TotalCost:N2}). Saved to purchase history without stock tracking.";

            return Ok(ApiResponse.Ok(result, successMsg));
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, ApiResponse.Fail($"Failed to save purchase: {ex.Message}"));
        }
    }

    public record RecordUsageRequest(
        string ItemId,
        int Quantity,
        string Department,
        string? Reason,
        string? PerformedBy
    );

    [HttpPost("usage")]
    public async Task<IActionResult> RecordUsage([FromBody] RecordUsageRequest req)
    {
        if (req.Quantity <= 0)
        {
            return BadRequest(ApiResponse.Fail("Usage quantity must be greater than zero."));
        }

        var item = await _db.InventoryItems.FindAsync(req.ItemId);
        if (item == null)
        {
            return NotFound(ApiResponse.Fail("Inventory item not found."));
        }

        var dept = (req.Department ?? item.Department).Trim().ToUpper();
        if (item.Department.ToUpper() != dept)
        {
            return BadRequest(ApiResponse.Fail($"Item '{item.Name}' belongs to {item.Department} Inventory, cannot deduct under {dept}."));
        }

        if (item.CurrentStock < req.Quantity)
        {
            return BadRequest(ApiResponse.Fail($"Insufficient stock for '{item.Name}' in {item.Department} Inventory. Available: {item.CurrentStock}, Requested: {req.Quantity}."));
        }

        item.CurrentStock -= req.Quantity;
        item.LastRestocked = DateTime.UtcNow;

        var movement = new StockMovement
        {
            ItemId = item.Id,
            Department = item.Department,
            Quantity = -req.Quantity,
            Type = dept == "HOTEL" ? "HOUSEKEEPING_USAGE" : "KITCHEN_USAGE",
            Reason = req.Reason ?? $"{dept} stock usage",
            PerformedBy = req.PerformedBy ?? "Staff",
            CreatedAt = DateTime.UtcNow
        };

        _db.StockMovements.Add(movement);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(item, $"Deducted {req.Quantity} {item.Unit} from {item.Department} Inventory. Remaining: {item.CurrentStock}."));
    }

    // =========================================================================
    // 3. SHARED PURCHASING WORKFLOW (ALLOCATE TO HOTEL / RESTAURANT / BOTH)
    // =========================================================================

    [HttpGet("purchases")]
    public async Task<IActionResult> GetPurchases(
        [FromQuery] string? search,
        [FromQuery] string? purchaseType,
        [FromQuery] string? supplierId,
        [FromQuery] string? paymentStatus,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate)
    {
        var query = _db.PurchaseOrders
            .Include(p => p.Supplier)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(purchaseType) && !purchaseType.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(p => p.PurchaseType.ToUpper() == purchaseType.Trim().ToUpper());
        }

        if (!string.IsNullOrWhiteSpace(supplierId) && !supplierId.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            if (supplierId.Equals("WALK_IN", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.SupplierId == null || p.SupplierId == "");
            }
            else
            {
                query = query.Where(p => p.SupplierId == supplierId);
            }
        }

        if (!string.IsNullOrWhiteSpace(paymentStatus) && !paymentStatus.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(p => p.PaymentStatus.ToLower() == paymentStatus.Trim().ToLower());
        }

        if (fromDate.HasValue)
        {
            query = query.Where(p => p.OrderedAt >= fromDate.Value.ToUniversalTime());
        }

        if (toDate.HasValue)
        {
            query = query.Where(p => p.OrderedAt <= toDate.Value.ToUniversalTime().AddDays(1));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(p =>
                p.PoNumber.ToLower().Contains(s) ||
                (p.InvoiceNumber != null && p.InvoiceNumber.ToLower().Contains(s)) ||
                (p.PanVatNumber != null && p.PanVatNumber.ToLower().Contains(s)) ||
                (p.SupplierName != null && p.SupplierName.ToLower().Contains(s)) ||
                (p.Supplier != null && p.Supplier.Name.ToLower().Contains(s)) ||
                p.ItemsJson.ToLower().Contains(s)
            );
        }

        var purchases = await query
            .OrderByDescending(p => p.OrderedAt)
            .ToListAsync();

        return Ok(ApiResponse.Ok(purchases));
    }

    public record PurchaseLineItemDto(
        string? ItemId,
        string ItemName,
        string? Category,
        string? Department,
        double Quantity,
        string Unit,
        double UnitCost,
        double TotalCost,
        double ConversionFactor = 1.0,
        string? PurchaseUnit = null,
        int? HotelQuantity = null,
        int? RestaurantQuantity = null
    );

    public record CreatePurchaseRecordRequest(
        string? PurchaseType,
        DateTime? PurchaseDate,
        string? SupplierId,
        string? SupplierName,
        string? InvoiceNumber,
        string? PanVatNumber,
        List<PurchaseLineItemDto>? Items,
        double TotalAmount,
        double Subtotal = 0,
        double Discount = 0,
        double Tax = 0,
        double AdditionalCharges = 0,
        string? PaymentMethod = "Cash",
        string? PaymentStatus = "Paid",
        string? Notes = null,
        string? AttachmentUrl = null,
        string? PoNumber = null,
        string? CreatedBy = "Admin",
        string? IdempotencyKey = null
    );

    [HttpPost("purchases")]
    public async Task<IActionResult> CreatePurchaseOrder([FromBody] CreatePurchaseRecordRequest req)
    {
        if (req.Items == null || req.Items.Count == 0)
        {
            return BadRequest(ApiResponse.Fail("At least one purchase item is required."));
        }

        // Validate items
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
        }

        // 1. Idempotency Check (prevent accidental double submission)
        if (!string.IsNullOrWhiteSpace(req.IdempotencyKey))
        {
            if (_processedAddStocks.TryGetValue(req.IdempotencyKey, out var processedTime))
            {
                if (DateTime.UtcNow - processedTime < TimeSpan.FromMinutes(10))
                {
                    var existingPo = await _db.PurchaseOrders
                        .Include(p => p.Supplier)
                        .OrderByDescending(p => p.OrderedAt)
                        .FirstOrDefaultAsync();

                    return Ok(ApiResponse.Ok(existingPo, "Duplicate submission prevented. Purchase record was already saved."));
                }
            }
        }

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var hotel = await _db.Hotels.FirstOrDefaultAsync();
            var hotelId = hotel?.Id ?? Guid.NewGuid().ToString("N");

            // Handle Supplier Resolution
            string? supplierId = null;
            string supplierName = "Walk-in / Unregistered Supplier";
            string? panVatNumber = req.PanVatNumber?.Trim();

            if (!string.IsNullOrWhiteSpace(req.SupplierId))
            {
                var sup = await _db.Suppliers.FindAsync(req.SupplierId);
                if (sup != null)
                {
                    supplierId = sup.Id;
                    supplierName = sup.Name;
                    if (string.IsNullOrWhiteSpace(panVatNumber))
                    {
                        panVatNumber = sup.PanVatNumber;
                    }
                }
            }
            else if (!string.IsNullOrWhiteSpace(req.SupplierName) && !req.SupplierName.Equals("Walk-in", StringComparison.OrdinalIgnoreCase))
            {
                supplierName = req.SupplierName.Trim();
            }

            var poNumber = !string.IsNullOrWhiteSpace(req.PoNumber)
                ? req.PoNumber
                : $"PO-{DateTime.UtcNow.Year}-{Random.Shared.Next(1000, 9999)}";

            var purchaseDate = req.PurchaseDate?.ToUniversalTime() ?? DateTime.UtcNow;
            var isSimple = req.PurchaseType?.ToUpper() == "SIMPLE";

            // Calculate Subtotal and GrandTotal
            var calculatedSubtotal = req.Items.Sum(i => i.Quantity * i.UnitCost);
            var subtotal = req.Subtotal > 0 ? req.Subtotal : calculatedSubtotal;
            var grandTotal = req.TotalAmount > 0
                ? req.TotalAmount
                : Math.Max(0, subtotal - req.Discount + req.Tax + req.AdditionalCharges);

            // --- Credit Purchase Business Rules ---
            var paymentMethod = !string.IsNullOrWhiteSpace(req.PaymentMethod) ? req.PaymentMethod : "Cash";
            var isCredit = paymentMethod.Equals("Credit", StringComparison.OrdinalIgnoreCase);
            DateTime? poDueDate = null;

            if (isCredit && !string.IsNullOrWhiteSpace(supplierId))
            {
                var sup = await _db.Suppliers.FindAsync(supplierId);
                if (sup != null)
                {
                    if (!sup.IsActive)
                    {
                        return BadRequest(ApiResponse.Fail(
                            $"Cannot make a credit purchase from inactive supplier '{sup.Name}'."
                        ));
                    }

                    // Calculate due date from supplier payment terms
                    var termsDays = sup.PaymentTermsDays > 0 ? sup.PaymentTermsDays : 0;
                    poDueDate = purchaseDate.AddDays(termsDays);

                    // Check credit limit against outstanding balance + new purchase
                    var latestLedger = await _db.SupplierLedgers
                        .Where(l => l.HotelId == hotelId && l.SupplierId == sup.Id)
                        .OrderByDescending(l => l.EntryDate)
                        .ThenByDescending(l => l.CreatedAt)
                        .FirstOrDefaultAsync();

                    var currentOutstanding = latestLedger?.Balance ?? sup.OpeningBalance;
                    var projectedOutstanding = currentOutstanding + grandTotal;

                    if (sup.CreditLimit > 0 && projectedOutstanding > sup.CreditLimit)
                    {
                        return BadRequest(ApiResponse.Fail(
                            $"Credit limit exceeded for supplier '{sup.Name}'. " +
                            $"Current outstanding: {currentOutstanding:N2}, " +
                            $"This purchase: {grandTotal:N2}, " +
                            $"Projected: {projectedOutstanding:N2}, " +
                            $"Credit limit: {sup.CreditLimit:N2}."
                        ));
                    }
                }
                else
                {
                    // Credit without a registered supplier is not allowed
                    return BadRequest(ApiResponse.Fail(
                        "Credit purchases require a registered supplier. Please select a supplier or use Cash payment."
                    ));
                }
            }

            var po = new PurchaseOrder
            {
                HotelId = hotelId,
                PoNumber = poNumber,
                InvoiceNumber = req.InvoiceNumber?.Trim(),
                PanVatNumber = panVatNumber,
                SupplierId = supplierId,
                SupplierName = supplierName,
                PurchaseType = isSimple ? "SIMPLE" : "FULL",
                Subtotal = subtotal,
                Discount = req.Discount,
                Tax = req.Tax,
                AdditionalCharges = req.AdditionalCharges,
                TotalAmount = grandTotal,
                PaymentMethod = paymentMethod,
                PaymentStatus = !string.IsNullOrWhiteSpace(req.PaymentStatus) ? req.PaymentStatus : "Paid",
                Status = "RECEIVED",
                Notes = req.Notes?.Trim(),
                AttachmentUrl = req.AttachmentUrl?.Trim(),
                CreatedBy = !string.IsNullOrWhiteSpace(req.CreatedBy) ? req.CreatedBy : "Admin",
                ItemsJson = JsonSerializer.Serialize(req.Items),
                AllocationsJson = JsonSerializer.Serialize(req.Items.Select(i => new
                {
                    itemName = i.ItemName,
                    quantity = i.Quantity,
                    hotelQty = i.HotelQuantity ?? (i.Department == "HOTEL" ? (int)Math.Round(i.Quantity) : 0),
                    restaurantQty = i.RestaurantQuantity ?? (i.Department != "HOTEL" ? (int)Math.Round(i.Quantity) : 0)
                })),
                OrderedAt = purchaseDate,
                ReceivedAt = purchaseDate,
                DueDate = poDueDate
            };

            _db.PurchaseOrders.Add(po);

            // Execute Inventory Updates according to business rules:
            // 1. Stock-tracked items (TrackStock == true) -> update stock using conversion factor.
            // 2. Non-stock-tracked items (TrackStock == false) -> record purchase without increasing inventory quantity.
            foreach (var lineItem in req.Items)
            {
                var dept = !string.IsNullOrWhiteSpace(lineItem.Department) ? lineItem.Department.ToUpper() : "RESTAURANT";
                InventoryItem? invItem = null;

                if (!string.IsNullOrWhiteSpace(lineItem.ItemId))
                {
                    invItem = await _db.InventoryItems.FirstOrDefaultAsync(i => i.Id == lineItem.ItemId);
                }
                if (invItem == null)
                {
                    invItem = await _db.InventoryItems.FirstOrDefaultAsync(i => i.Department == dept && i.Name.ToLower() == lineItem.ItemName.ToLower());
                }

                if (invItem != null)
                {
                    if (invItem.TrackStock)
                    {
                        var prevBalance = invItem.CurrentStock;
                        var factor = lineItem.ConversionFactor > 0
                            ? lineItem.ConversionFactor
                            : (invItem.ConversionFactor > 0 ? invItem.ConversionFactor : 1.0);

                        var stockQtyToAdd = (int)Math.Round(lineItem.Quantity * factor);
                        invItem.CurrentStock += stockQtyToAdd;
                        invItem.LastRestocked = purchaseDate;
                        if (lineItem.UnitCost > 0)
                        {
                            invItem.CostPerUnit = Math.Round(lineItem.UnitCost / factor, 2);
                        }
                        if (!string.IsNullOrWhiteSpace(supplierId))
                        {
                            invItem.SupplierId = supplierId;
                        }

                        // Audit StockMovement
                        var movement = new StockMovement
                        {
                            ItemId = invItem.Id,
                            Quantity = stockQtyToAdd,
                            PreviousBalance = prevBalance,
                            ResultingBalance = invItem.CurrentStock,
                            Type = "PURCHASE",
                            ReferenceNumber = po.PoNumber,
                            Department = invItem.Department,
                            Reason = $"Purchase {po.PoNumber} ({po.PurchaseType})" + (!string.IsNullOrWhiteSpace(po.InvoiceNumber) ? $" Inv #{po.InvoiceNumber}" : ""),
                            PerformedBy = po.CreatedBy,
                            CreatedAt = purchaseDate
                        };
                        _db.StockMovements.Add(movement);
                    }
                    else
                    {
                        // Non-stock-tracked item: record expense/cost and update last restocked date only
                        if (lineItem.UnitCost > 0)
                        {
                            invItem.CostPerUnit = lineItem.UnitCost;
                        }
                        invItem.LastRestocked = purchaseDate;
                    }
                }
                else
                {
                    // Create new inventory item if it doesn't exist
                    var isTrack = !new[] { "FOOD_RAW", "PANTRY", "LINEN", "CLEANING_SUPPLIES", "EQUIPMENT" }.Contains(lineItem.Category?.ToUpper());
                    var factor = lineItem.ConversionFactor > 0 ? lineItem.ConversionFactor : 1.0;
                    var stockQtyToAdd = isTrack ? (int)Math.Round(lineItem.Quantity * factor) : 0;

                    var newItem = new InventoryItem
                    {
                        HotelId = hotelId,
                        Department = dept,
                        Name = lineItem.ItemName.Trim(),
                        Category = !string.IsNullOrWhiteSpace(lineItem.Category) ? lineItem.Category.ToUpper() : (dept == "HOTEL" ? "GUEST_AMENITIES" : "PANTRY"),
                        Sku = $"{(dept == "HOTEL" ? "HOT" : "RST")}-PUR-{Random.Shared.Next(100, 999)}",
                        TrackStock = isTrack,
                        CurrentStock = stockQtyToAdd,
                        MinThreshold = isTrack ? 5 : 0,
                        Unit = !string.IsNullOrWhiteSpace(lineItem.Unit) ? lineItem.Unit : "pieces",
                        PurchaseUnit = lineItem.PurchaseUnit,
                        ConversionFactor = factor,
                        CostPerUnit = lineItem.UnitCost > 0 ? Math.Round(lineItem.UnitCost / factor, 2) : 0,
                        SupplierId = supplierId,
                        LastRestocked = purchaseDate
                    };
                    _db.InventoryItems.Add(newItem);

                    if (isTrack && stockQtyToAdd > 0)
                    {
                        _db.StockMovements.Add(new StockMovement
                        {
                            ItemId = newItem.Id,
                            Quantity = stockQtyToAdd,
                            PreviousBalance = 0,
                            ResultingBalance = stockQtyToAdd,
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

            // --- Supplier Ledger Entry for Credit Purchases ---
            if (isCredit && !string.IsNullOrWhiteSpace(supplierId) && grandTotal > 0)
            {
                var sup = await _db.Suppliers.FindAsync(supplierId);

                var latestLedger = await _db.SupplierLedgers
                    .Where(l => l.HotelId == hotelId && l.SupplierId == supplierId)
                    .OrderByDescending(l => l.EntryDate)
                    .ThenByDescending(l => l.CreatedAt)
                    .FirstOrDefaultAsync();

                var openingBalance = latestLedger?.Balance ?? sup?.OpeningBalance ?? 0;

                _db.SupplierLedgers.Add(new SupplierLedgerEntry
                {
                    HotelId = hotelId,
                    SupplierId = supplierId,
                    PurchaseOrderId = po.Id,
                    EntryDate = purchaseDate,
                    Description = $"Credit purchase {po.PoNumber}" +
                                  (!string.IsNullOrWhiteSpace(po.InvoiceNumber) ? $" (Inv #{po.InvoiceNumber})" : ""),
                    CreditAmount = grandTotal,
                    DebitAmount = 0,
                    Balance = openingBalance + grandTotal,
                    DueDate = poDueDate,
                    ReferenceType = "PURCHASE_CREDIT",
                    ReferenceId = po.Id,
                    PaymentMode = paymentMethod,
                    CreatedBy = po.CreatedBy,
                    CreatedAt = DateTime.UtcNow
                });
            }

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            if (!string.IsNullOrWhiteSpace(req.IdempotencyKey))
            {
                _processedAddStocks[req.IdempotencyKey] = DateTime.UtcNow;
            }

            return Ok(ApiResponse.Ok(po, $"Purchase {po.PoNumber} recorded successfully for Rs. {po.TotalAmount:N2}."));
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, ApiResponse.Fail($"Failed to record purchase: {ex.Message}"));
        }
    }

        public record UpdatePORequest(string Id, string Status);

    [HttpPatch("purchases")]
    public async Task<IActionResult> UpdatePurchaseOrder([FromBody] UpdatePORequest req)
    {
        var po = await _db.PurchaseOrders.FindAsync(req.Id);
        if (po == null)
        {
            return NotFound(ApiResponse.Fail("Purchase order not found."));
        }

        var oldStatus = po.Status?.ToUpper();
        var newStatus = req.Status.Trim().ToUpper();

        if (oldStatus == "RECEIVED" && newStatus == "CANCELLED")
        {
            // Reverse stock for tracked items
            var lines = ParsePurchaseOrderItems(po.ItemsJson);
            foreach (var line in lines)
            {
                var invItem = await _db.InventoryItems.FirstOrDefaultAsync(i =>
                    (!string.IsNullOrEmpty(line.ItemId) && (i.Id == line.ItemId || i.Sku == line.ItemId)) ||
                    (!string.IsNullOrEmpty(line.ItemCode) && i.Sku.ToLower() == line.ItemCode.ToLower()) ||
                    i.Name.ToLower() == line.ItemName.ToLower()
                );

                if (invItem != null && invItem.TrackStock)
                {
                    double factor = line.ConversionFactor > 0 ? line.ConversionFactor : (invItem.ConversionFactor > 0 ? invItem.ConversionFactor : 1.0);
                    int stockQtyToReverse = (int)Math.Round(line.Quantity * factor);
                    int prev = invItem.CurrentStock;
                    invItem.CurrentStock = Math.Max(0, invItem.CurrentStock - stockQtyToReverse);

                    _db.StockMovements.Add(new StockMovement
                    {
                        ItemId = invItem.Id,
                        Quantity = -stockQtyToReverse,
                        PreviousBalance = prev,
                        ResultingBalance = invItem.CurrentStock,
                        Type = "PURCHASE_RETURN",
                        ReferenceNumber = po.PoNumber,
                        Department = invItem.Department,
                        Reason = $"Purchase Order {po.PoNumber} Cancelled & Reversed",
                        PerformedBy = "Inventory Manager",
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }
        }
        else if (oldStatus == "CANCELLED" && newStatus == "RECEIVED")
        {
            // Re-apply stock
            var lines = ParsePurchaseOrderItems(po.ItemsJson);
            foreach (var line in lines)
            {
                var invItem = await _db.InventoryItems.FirstOrDefaultAsync(i =>
                    (!string.IsNullOrEmpty(line.ItemId) && (i.Id == line.ItemId || i.Sku == line.ItemId)) ||
                    (!string.IsNullOrEmpty(line.ItemCode) && i.Sku.ToLower() == line.ItemCode.ToLower()) ||
                    i.Name.ToLower() == line.ItemName.ToLower()
                );

                if (invItem != null && invItem.TrackStock)
                {
                    double factor = line.ConversionFactor > 0 ? line.ConversionFactor : (invItem.ConversionFactor > 0 ? invItem.ConversionFactor : 1.0);
                    int stockQtyToAdd = (int)Math.Round(line.Quantity * factor);
                    int prev = invItem.CurrentStock;
                    invItem.CurrentStock += stockQtyToAdd;

                    _db.StockMovements.Add(new StockMovement
                    {
                        ItemId = invItem.Id,
                        Quantity = stockQtyToAdd,
                        PreviousBalance = prev,
                        ResultingBalance = invItem.CurrentStock,
                        Type = "PURCHASE",
                        ReferenceNumber = po.PoNumber,
                        Department = invItem.Department,
                        Reason = $"Purchase Order {po.PoNumber} Re-activated",
                        PerformedBy = "Inventory Manager",
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }
        }

        po.Status = newStatus;
        if (po.Status == "RECEIVED")
        {
            po.ReceivedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return Ok(ApiResponse.Ok(po, $"Purchase Order {po.PoNumber} status updated to {po.Status}."));
    }

    // =========================================================================
    // 4. INTER-DEPARTMENT STOCK TRANSFERS (HOTEL <-> RESTAURANT)
    // =========================================================================

    public record StockTransferRequest(
        string SourceDepartment,
        string DestinationDepartment,
        string SourceItemId,
        string? DestinationItemId,
        int Quantity,
        string? Reason,
        string? PerformedBy,
        string? IdempotencyKey
    );

    [HttpPost("transfers")]
    public async Task<IActionResult> TransferStock([FromBody] StockTransferRequest req)
    {
        if (req.Quantity <= 0)
        {
            return BadRequest(ApiResponse.Fail("Transfer quantity must be greater than zero."));
        }

        var srcDept = req.SourceDepartment.Trim().ToUpper();
        var destDept = req.DestinationDepartment.Trim().ToUpper();

        if (srcDept == destDept)
        {
            return BadRequest(ApiResponse.Fail("Source and Destination departments must be different."));
        }

        if ((srcDept != "HOTEL" && srcDept != "RESTAURANT") || (destDept != "HOTEL" && destDept != "RESTAURANT"))
        {
            return BadRequest(ApiResponse.Fail("Departments must be either HOTEL or RESTAURANT."));
        }

        // Idempotency check: prevent duplicate submissions
        if (!string.IsNullOrWhiteSpace(req.IdempotencyKey))
        {
            if (_processedTransfers.TryGetValue(req.IdempotencyKey, out var processedTime))
            {
                if (DateTime.UtcNow - processedTime < TimeSpan.FromMinutes(10))
                {
                    return Ok(ApiResponse.Ok(new { message = "Transfer already processed." }, "Duplicate transfer prevented by idempotency lock."));
                }
            }
        }

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var sourceItem = await _db.InventoryItems.FindAsync(req.SourceItemId);
            if (sourceItem == null)
            {
                return NotFound(ApiResponse.Fail($"Source inventory item '{req.SourceItemId}' not found."));
            }

            if (sourceItem.Department.ToUpper() != srcDept)
            {
                return BadRequest(ApiResponse.Fail($"Item '{sourceItem.Name}' is not in {srcDept} Inventory. Found in {sourceItem.Department}."));
            }

            if (sourceItem.CurrentStock < req.Quantity)
            {
                return BadRequest(ApiResponse.Fail($"Insufficient stock in {srcDept} for '{sourceItem.Name}'. Available: {sourceItem.CurrentStock}, Requested: {req.Quantity}."));
            }

            // Find or create matching item in destination department
            InventoryItem? destItem = null;
            if (!string.IsNullOrWhiteSpace(req.DestinationItemId))
            {
                destItem = await _db.InventoryItems.FirstOrDefaultAsync(i => i.Id == req.DestinationItemId && i.Department.ToUpper() == destDept);
            }
            if (destItem == null)
            {
                destItem = await _db.InventoryItems.FirstOrDefaultAsync(i => i.Department.ToUpper() == destDept && i.Name.ToLower() == sourceItem.Name.ToLower());
            }

            if (destItem == null)
            {
                var prefix = destDept == "HOTEL" ? "HOT" : "RES";
                destItem = new InventoryItem
                {
                    HotelId = sourceItem.HotelId,
                    Department = destDept,
                    Name = sourceItem.Name,
                    Category = destDept == "HOTEL" ? "GUEST_AMENITIES" : "BEVERAGES",
                    Sku = $"{prefix}-TRF-{Random.Shared.Next(100, 999)}",
                    CurrentStock = 0,
                    MinThreshold = sourceItem.MinThreshold,
                    Unit = sourceItem.Unit,
                    CostPerUnit = sourceItem.CostPerUnit,
                    SupplierId = sourceItem.SupplierId,
                    LastRestocked = DateTime.UtcNow
                };
                _db.InventoryItems.Add(destItem);
                await _db.SaveChangesAsync();
            }

            // Perform single transaction stock update
            sourceItem.CurrentStock -= req.Quantity;
            sourceItem.LastRestocked = DateTime.UtcNow;

            destItem.CurrentStock += req.Quantity;
            destItem.LastRestocked = DateTime.UtcNow;

            var transferNumber = $"TRF-{DateTime.UtcNow.Year}-{Random.Shared.Next(1000, 9999)}";
            var note = req.Reason ?? $"Inter-department transfer: {srcDept} -> {destDept}";

            // Outflow movement
            _db.StockMovements.Add(new StockMovement
            {
                ItemId = sourceItem.Id,
                Department = srcDept,
                SourceDepartment = srcDept,
                DestinationDepartment = destDept,
                Quantity = -req.Quantity,
                Type = "TRANSFER_OUT",
                TransferNumber = transferNumber,
                Reason = $"Transferred to {destDept}: {note}",
                PerformedBy = req.PerformedBy ?? "Authorized Manager",
                CreatedAt = DateTime.UtcNow
            });

            // Inflow movement
            _db.StockMovements.Add(new StockMovement
            {
                ItemId = destItem.Id,
                Department = destDept,
                SourceDepartment = srcDept,
                DestinationDepartment = destDept,
                Quantity = req.Quantity,
                Type = "TRANSFER_IN",
                TransferNumber = transferNumber,
                Reason = $"Transferred from {srcDept}: {note}",
                PerformedBy = req.PerformedBy ?? "Authorized Manager",
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            if (!string.IsNullOrWhiteSpace(req.IdempotencyKey))
            {
                _processedTransfers[req.IdempotencyKey] = DateTime.UtcNow;
            }

            var transferSummary = new
            {
                transferNumber,
                sourceDepartment = srcDept,
                destinationDepartment = destDept,
                itemName = sourceItem.Name,
                quantity = req.Quantity,
                unit = sourceItem.Unit,
                sourceRemainingStock = sourceItem.CurrentStock,
                destinationNewStock = destItem.CurrentStock,
                performedBy = req.PerformedBy ?? "Authorized Manager",
                createdAt = DateTime.UtcNow
            };

            return Ok(ApiResponse.Ok(transferSummary, $"Transferred {req.Quantity} {sourceItem.Unit} from {srcDept} to {destDept} successfully ({transferNumber})."));
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, ApiResponse.Fail($"Stock transfer failed: {ex.Message}"));
        }
    }

    [HttpGet("transfers")]
    public async Task<IActionResult> GetTransfers()
    {
        var transfers = await _db.StockMovements
            .Include(m => m.Item)
            .Where(m => m.Type == "TRANSFER_OUT" || !string.IsNullOrEmpty(m.TransferNumber))
            .OrderByDescending(m => m.CreatedAt)
            .Take(50)
            .Select(m => new
            {
                id = m.Id,
                transferNumber = m.TransferNumber ?? "TRF-HISTORIC",
                itemName = m.Item != null ? m.Item.Name : "Item",
                sku = m.Item != null ? m.Item.Sku : "",
                quantity = Math.Abs(m.Quantity),
                unit = m.Item != null ? m.Item.Unit : "pieces",
                sourceDepartment = m.SourceDepartment ?? m.Department,
                destinationDepartment = m.DestinationDepartment ?? (m.Department == "HOTEL" ? "RESTAURANT" : "HOTEL"),
                reason = m.Reason,
                performedBy = m.PerformedBy,
                createdAt = m.CreatedAt
            })
            .ToListAsync();

        return Ok(ApiResponse.Ok(transfers));
    }

    // =========================================================================
    // 5. MOVEMENTS AUDIT LOGS & STOCK ADJUSTMENT LEDGER
    // =========================================================================

    [HttpGet("movements")]
    public async Task<IActionResult> GetMovements(
        [FromQuery] string? department,
        [FromQuery] string? itemId,
        [FromQuery] string? movementType,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] string? search)
    {
        var query = _db.StockMovements.Include(m => m.Item).AsQueryable();

        if (!string.IsNullOrWhiteSpace(department) && !department.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            var dept = department.Trim().ToUpper();
            query = query.Where(m => m.Department.ToUpper() == dept);
        }

        if (!string.IsNullOrWhiteSpace(itemId) && !itemId.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(m => m.ItemId == itemId || (m.Item != null && m.Item.Sku == itemId));
        }

        if (!string.IsNullOrWhiteSpace(movementType) && !movementType.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            var mType = movementType.Trim().ToUpper();
            query = query.Where(m => m.Type.ToUpper() == mType);
        }

        if (fromDate.HasValue)
        {
            query = query.Where(m => m.CreatedAt >= fromDate.Value.ToUniversalTime());
        }

        if (toDate.HasValue)
        {
            query = query.Where(m => m.CreatedAt <= toDate.Value.ToUniversalTime());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(m =>
                (m.Item != null && (m.Item.Name.ToLower().Contains(s) || m.Item.Sku.ToLower().Contains(s))) ||
                (m.ReferenceNumber != null && m.ReferenceNumber.ToLower().Contains(s)) ||
                (m.TransferNumber != null && m.TransferNumber.ToLower().Contains(s)) ||
                (m.Reason != null && m.Reason.ToLower().Contains(s)) ||
                (m.PerformedBy != null && m.PerformedBy.ToLower().Contains(s))
            );
        }

        var movements = await query
            .OrderByDescending(m => m.CreatedAt)
            .Take(500)
            .ToListAsync();

        var result = movements.Select(m => new
        {
            id = m.Id,
            createdAt = m.CreatedAt,
            itemId = m.ItemId,
            itemName = m.Item?.Name ?? "Item",
            itemCode = m.Item?.Sku ?? "—",
            category = m.Item?.Category ?? "GENERAL",
            department = m.Department,
            movementType = m.Type,
            referenceNumber = !string.IsNullOrWhiteSpace(m.ReferenceNumber) ? m.ReferenceNumber : (!string.IsNullOrWhiteSpace(m.TransferNumber) ? m.TransferNumber : m.Id),
            quantityIn = m.Quantity > 0 ? m.Quantity : 0,
            quantityOut = m.Quantity < 0 ? Math.Abs(m.Quantity) : 0,
            quantity = m.Quantity,
            previousBalance = m.PreviousBalance,
            newBalance = m.ResultingBalance,
            stockUnit = m.Item?.Unit ?? "pieces",
            reason = m.Reason ?? "—",
            performedBy = m.PerformedBy
        });

        return Ok(ApiResponse.Ok(result));
    }

    public record StockAdjustmentRecordRequest(
        string ItemId,
        string AdjustmentType,
        int Quantity,
        string? Reason,
        string? PerformedBy
    );

    [HttpPost("adjustments")]
    public async Task<IActionResult> RecordStockAdjustment([FromBody] StockAdjustmentRecordRequest req)
    {
        if (req.Quantity <= 0)
        {
            return BadRequest(ApiResponse.Fail("Quantity must be greater than zero."));
        }

        var item = await _db.InventoryItems.FindAsync(req.ItemId);
        if (item == null)
        {
            return NotFound(ApiResponse.Fail($"Item '{req.ItemId}' not found."));
        }

        int prevBalance = item.CurrentStock;
        var adjType = req.AdjustmentType?.Trim().ToUpper() ?? "ADJUSTMENT_INCREASE";
        bool isIncrease = adjType == "ADJUSTMENT_INCREASE";

        int qtyChange = isIncrease ? req.Quantity : -req.Quantity;
        int newBalance = item.TrackStock ? Math.Max(0, prevBalance + qtyChange) : 0;

        if (item.TrackStock)
        {
            item.CurrentStock = newBalance;
        }

        var refNumber = $"ADJ-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(100, 999)}";
        var movement = new StockMovement
        {
            ItemId = item.Id,
            Department = item.Department,
            Quantity = qtyChange,
            PreviousBalance = prevBalance,
            ResultingBalance = newBalance,
            Type = adjType,
            ReferenceNumber = refNumber,
            Reason = req.Reason ?? $"Manual stock adjustment ({adjType})",
            PerformedBy = req.PerformedBy ?? "Inventory Manager",
            CreatedAt = DateTime.UtcNow
        };

        _db.StockMovements.Add(movement);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            item,
            movement,
            referenceNumber = refNumber
        }, $"Stock adjustment ({adjType}) recorded successfully. Reference: {refNumber}"));
    }

    [HttpGet("purchases/ledger")]
    public async Task<IActionResult> GetPurchasesLedger(
        [FromQuery] string? itemId,
        [FromQuery] string? search,
        [FromQuery] string? supplierId,
        [FromQuery] string? paymentStatus,
        [FromQuery] string? purchaseType,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate)
    {
        var items = await _db.InventoryItems.Include(i => i.Supplier).ToListAsync();
        var itemMap = items.ToDictionary(i => i.Id);
        var skuMap = items.GroupBy(i => i.Sku.ToLower()).ToDictionary(g => g.Key, g => g.First());

        var posQuery = _db.PurchaseOrders
            .Include(p => p.Supplier)
            .Where(p => p.Status != "CANCELLED")
            .AsQueryable();

        if (fromDate.HasValue) posQuery = posQuery.Where(p => p.OrderedAt >= fromDate.Value.ToUniversalTime());
        if (toDate.HasValue) posQuery = posQuery.Where(p => p.OrderedAt <= toDate.Value.ToUniversalTime());
        if (!string.IsNullOrWhiteSpace(purchaseType) && !purchaseType.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            posQuery = posQuery.Where(p => p.PurchaseType.ToUpper() == purchaseType.Trim().ToUpper());
        if (!string.IsNullOrWhiteSpace(paymentStatus) && !paymentStatus.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            posQuery = posQuery.Where(p => p.PaymentStatus.ToUpper() == paymentStatus.Trim().ToUpper());
        if (!string.IsNullOrWhiteSpace(supplierId) && !supplierId.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            if (supplierId.Equals("WALK_IN", StringComparison.OrdinalIgnoreCase))
                posQuery = posQuery.Where(p => p.SupplierId == null || p.SupplierId == "");
            else
                posQuery = posQuery.Where(p => p.SupplierId == supplierId);
        }

        var pos = await posQuery.OrderByDescending(p => p.OrderedAt).ToListAsync();
        var ledgerLines = new List<object>();
        int sn = 1;

        foreach (var po in pos)
        {
            var lines = ParsePurchaseOrderItems(po.ItemsJson);
            foreach (var line in lines)
            {
                InventoryItem? matchedItem = null;
                if (!string.IsNullOrEmpty(line.ItemId) && itemMap.TryGetValue(line.ItemId, out var foundById)) matchedItem = foundById;
                else if (!string.IsNullOrEmpty(line.ItemCode) && skuMap.TryGetValue(line.ItemCode.ToLower(), out var foundBySku)) matchedItem = foundBySku;
                else matchedItem = items.FirstOrDefault(i => i.Name.Equals(line.ItemName, StringComparison.OrdinalIgnoreCase));

                if (!string.IsNullOrWhiteSpace(itemId) && !itemId.Equals("ALL", StringComparison.OrdinalIgnoreCase))
                {
                    if (matchedItem == null || (matchedItem.Id != itemId && matchedItem.Sku != itemId))
                        continue;
                }

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var s = search.Trim().ToLower();
                    var match = po.PoNumber.ToLower().Contains(s) ||
                                (po.InvoiceNumber != null && po.InvoiceNumber.ToLower().Contains(s)) ||
                                line.ItemName.ToLower().Contains(s) ||
                                (line.ItemCode != null && line.ItemCode.ToLower().Contains(s)) ||
                                (po.SupplierName != null && po.SupplierName.ToLower().Contains(s));
                    if (!match) continue;
                }

                double factor = line.ConversionFactor > 0 ? line.ConversionFactor : (matchedItem != null && matchedItem.ConversionFactor > 0 ? matchedItem.ConversionFactor : 1.0);
                double convertedQty = line.StockQuantity > 0 ? line.StockQuantity : (line.Quantity * factor);
                double lineCost = line.TotalCost > 0 ? line.TotalCost : po.TotalAmount;
                string supplierName = po.Supplier?.Name ?? po.SupplierName ?? "Walk-in / Unregistered Supplier";

                ledgerLines.Add(new
                {
                    sn = sn++,
                    purchaseId = po.Id,
                    purchaseNumber = po.PoNumber,
                    purchaseDate = po.OrderedAt,
                    itemId = matchedItem?.Id,
                    itemCode = line.ItemCode ?? matchedItem?.Sku ?? "—",
                    itemName = line.ItemName ?? matchedItem?.Name ?? "Item",
                    category = line.Category ?? matchedItem?.Category ?? "GENERAL",
                    supplierName,
                    supplierId = po.SupplierId,
                    supplierPhone = po.Supplier?.Phone,
                    supplierEmail = po.Supplier?.Email,
                    supplierAddress = po.Supplier?.Address,
                    supplierPan = po.Supplier?.PanVatNumber ?? po.PanVatNumber,
                    purchaseQuantity = line.Quantity,
                    purchaseUnit = line.PurchaseUnit ?? matchedItem?.PurchaseUnit ?? matchedItem?.Unit ?? "unit",
                    stockUnit = matchedItem?.Unit ?? line.Unit ?? "unit",
                    conversionFactor = factor,
                    convertedStockQuantity = convertedQty,
                    totalPurchaseAmount = lineCost,
                    purchaseType = po.PurchaseType ?? "FULL",
                    paymentMethod = po.PaymentMethod ?? "Cash",
                    paymentStatus = po.PaymentStatus ?? "Paid",
                    invoiceNumber = !string.IsNullOrWhiteSpace(po.InvoiceNumber) ? po.InvoiceNumber : "—",
                    status = po.Status,
                    subtotal = po.Subtotal,
                    discount = po.Discount,
                    tax = po.Tax,
                    additionalCharges = po.AdditionalCharges,
                    notes = po.Notes,
                    attachmentUrl = po.AttachmentUrl,
                    createdBy = po.CreatedBy ?? "Admin",
                    createdAt = po.OrderedAt
                });
            }
        }

        return Ok(ApiResponse.Ok(ledgerLines));
    }

    // =========================================================================
    // 6. DEPARTMENT REPORTS & LOW STOCK ALERTS
    // =========================================================================

    [HttpGet("reports")]
    public async Task<IActionResult> GetReports([FromQuery] string? department)
    {
        var deptFilter = !string.IsNullOrWhiteSpace(department) && !department.Equals("ALL", StringComparison.OrdinalIgnoreCase)
            ? department.Trim().ToUpper()
            : null;

        var itemsQuery = _db.InventoryItems.Include(i => i.Supplier).AsQueryable();
        if (deptFilter != null)
        {
            itemsQuery = itemsQuery.Where(i => i.Department.ToUpper() == deptFilter);
        }

        var items = await itemsQuery.ToListAsync();

        var totalSkus = items.Count;
        var totalStockQuantity = items.Where(i => i.TrackStock).Sum(i => i.CurrentStock);
        var totalValuation = Math.Round(items.Where(i => i.TrackStock).Sum(i => i.CurrentStock * i.CostPerUnit), 2);

        var lowStockItems = items.Where(i => i.TrackStock && i.MinThreshold > 0 && i.CurrentStock <= i.MinThreshold).ToList();
        var outOfStockItems = items.Where(i => i.TrackStock && i.CurrentStock <= 0).ToList();

        // Department breakdown
        var hotelItems = items.Where(i => i.Department.ToUpper() == "HOTEL").ToList();
        var restaurantItems = items.Where(i => i.Department.ToUpper() == "RESTAURANT").ToList();

        var report = new
        {
            department = deptFilter ?? "ALL",
            totalSkus,
            totalStockQuantity,
            totalValuation,
            lowStockCount = lowStockItems.Count,
            outOfStockCount = outOfStockItems.Count,
            lowStockAlerts = lowStockItems.Select(i => new
            {
                id = i.Id,
                name = i.Name,
                sku = i.Sku,
                department = i.Department,
                category = i.Category,
                trackStock = i.TrackStock,
                currentStock = i.CurrentStock,
                minThreshold = i.MinThreshold,
                unit = i.Unit,
                unitCost = i.CostPerUnit,
                supplierName = i.Supplier?.Name ?? "Unassigned"
            }),
            breakdown = new
            {
                hotel = new
                {
                    skus = hotelItems.Count,
                    stockQuantity = hotelItems.Where(i => i.TrackStock).Sum(i => i.CurrentStock),
                    valuation = Math.Round(hotelItems.Where(i => i.TrackStock).Sum(i => i.CurrentStock * i.CostPerUnit), 2),
                    lowStock = hotelItems.Count(i => i.TrackStock && i.MinThreshold > 0 && i.CurrentStock <= i.MinThreshold)
                },
                restaurant = new
                {
                    skus = restaurantItems.Count,
                    stockQuantity = restaurantItems.Where(i => i.TrackStock).Sum(i => i.CurrentStock),
                    valuation = Math.Round(restaurantItems.Where(i => i.TrackStock).Sum(i => i.CurrentStock * i.CostPerUnit), 2),
                    lowStock = restaurantItems.Count(i => i.TrackStock && i.MinThreshold > 0 && i.CurrentStock <= i.MinThreshold)
                }
            }
        };

        return Ok(ApiResponse.Ok(report));
    }
}

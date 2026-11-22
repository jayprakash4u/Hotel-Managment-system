using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/accounts")]
public class ProductLedgerAndValuationController : ControllerBase
{
    private readonly HospitalityDbContext _db;

    public ProductLedgerAndValuationController(HospitalityDbContext db)
    {
        _db = db;
    }

    private class ParsedPoLine
    {
        public string? ItemId { get; set; }
        public string? ItemCode { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public double Quantity { get; set; }
        public double StockQuantity { get; set; }
        public string? Unit { get; set; }
        public double UnitCost { get; set; }
        public double TotalCost { get; set; }
    }

    private static List<ParsedPoLine> ParsePoItems(string? itemsJson)
    {
        var list = new List<ParsedPoLine>();
        if (string.IsNullOrWhiteSpace(itemsJson)) return list;

        try
        {
            using var doc = JsonDocument.Parse(itemsJson);
            if (doc.RootElement.ValueKind != JsonValueKind.Array) return list;

            foreach (var el in doc.RootElement.EnumerateArray())
            {
                var line = new ParsedPoLine();
                if (el.TryGetProperty("itemId", out var idProp) && idProp.ValueKind == JsonValueKind.String)
                    line.ItemId = idProp.GetString();
                else if (el.TryGetProperty("id", out var id2) && id2.ValueKind == JsonValueKind.String)
                    line.ItemId = id2.GetString();

                if (el.TryGetProperty("itemCode", out var codeProp) && codeProp.ValueKind == JsonValueKind.String)
                    line.ItemCode = codeProp.GetString();
                else if (el.TryGetProperty("sku", out var skuProp) && skuProp.ValueKind == JsonValueKind.String)
                    line.ItemCode = skuProp.GetString();

                if (el.TryGetProperty("itemName", out var nameProp) && nameProp.ValueKind == JsonValueKind.String)
                    line.ItemName = nameProp.GetString() ?? "";
                else if (el.TryGetProperty("name", out var name2) && name2.ValueKind == JsonValueKind.String)
                    line.ItemName = name2.GetString() ?? "";

                if (el.TryGetProperty("quantity", out var qProp) && qProp.TryGetDouble(out var q))
                    line.Quantity = q;

                if (el.TryGetProperty("stockQuantity", out var sqProp) && sqProp.TryGetDouble(out var sq))
                    line.StockQuantity = sq;
                else
                    line.StockQuantity = line.Quantity;

                if (el.TryGetProperty("unit", out var uProp) && uProp.ValueKind == JsonValueKind.String)
                    line.Unit = uProp.GetString();

                if (el.TryGetProperty("unitCost", out var ucProp) && ucProp.TryGetDouble(out var uc))
                    line.UnitCost = uc;
                else if (el.TryGetProperty("rate", out var rProp) && rProp.TryGetDouble(out var r))
                    line.UnitCost = r;
                else if (el.TryGetProperty("costPerUnit", out var cpuProp) && cpuProp.TryGetDouble(out var cpu))
                    line.UnitCost = cpu;

                if (el.TryGetProperty("totalCost", out var tcProp) && tcProp.TryGetDouble(out var tc))
                    line.TotalCost = tc;
                else if (el.TryGetProperty("total", out var totProp) && totProp.TryGetDouble(out var tot))
                    line.TotalCost = tot;
                else
                    line.TotalCost = line.StockQuantity > 0 ? line.StockQuantity * line.UnitCost : line.Quantity * line.UnitCost;

                if (line.UnitCost == 0 && line.StockQuantity > 0 && line.TotalCost > 0)
                    line.UnitCost = Math.Round(line.TotalCost / line.StockQuantity, 2);

                list.Add(line);
            }
        }
        catch
        {
            // Ignore corrupted JSON
        }

        return list;
    }

    // =========================================================================
    // 1. PRODUCT LEDGER
    // =========================================================================
    [HttpGet("product-ledger")]
    [HttpGet("/api/inventory/product-ledger")]
    public async Task<IActionResult> GetProductLedger(
        [FromQuery] string? itemId,
        [FromQuery] string? category,
        [FromQuery] string? department,
        [FromQuery] string? transactionType,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        [FromQuery] string? search,
        [FromQuery] string? costingMethod = "WEIGHTED_AVERAGE")
    {
        // 1. Query all inventory items for selector and summary
        var itemsQuery = _db.InventoryItems
            .Include(i => i.Supplier)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(department) && department.ToUpper() != "ALL")
        {
            itemsQuery = itemsQuery.Where(i => i.Department.ToUpper() == department.ToUpper());
        }

        if (!string.IsNullOrWhiteSpace(category) && category.ToUpper() != "ALL")
        {
            itemsQuery = itemsQuery.Where(i => i.Category.ToUpper() == category.ToUpper());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            itemsQuery = itemsQuery.Where(i => i.Name.ToLower().Contains(s) || i.Sku.ToLower().Contains(s));
        }

        var allItems = await itemsQuery.OrderBy(i => i.Name).ToListAsync();

        // 2. Determine target item
        InventoryItem? selectedItem = null;
        if (!string.IsNullOrWhiteSpace(itemId))
        {
            selectedItem = allItems.FirstOrDefault(i => i.Id == itemId || i.Sku.ToLower() == itemId.ToLower())
                ?? await _db.InventoryItems.Include(i => i.Supplier).FirstOrDefaultAsync(i => i.Id == itemId || i.Sku.ToLower() == itemId.ToLower());
        }
        else if (allItems.Count > 0)
        {
            selectedItem = allItems[0];
        }

        // Summary metrics across inventory
        var totalItemsCount = allItems.Count;
        var totalInventoryValuation = Math.Round(allItems.Where(i => i.TrackStock).Sum(i => i.CurrentStock * i.CostPerUnit), 2);

        if (selectedItem == null)
        {
            return Ok(ApiResponse.Ok(new
            {
                costingMethod = "Weighted Average Cost (Moving Average)",
                totalInventoryItems = totalItemsCount,
                totalInventoryValue = totalInventoryValuation,
                selectedItem = (object?)null,
                openingStockQty = 0,
                openingStockValue = 0.0,
                closingStockQty = 0,
                closingStockValue = 0.0,
                totalStockInQty = 0,
                totalStockOutQty = 0,
                entries = new List<object>(),
                items = allItems.Select(i => new
                {
                    id = i.Id,
                    name = i.Name,
                    sku = i.Sku,
                    category = i.Category,
                    department = i.Department,
                    unit = i.Unit,
                    currentStock = i.CurrentStock,
                    unitCost = i.CostPerUnit
                })
            }));
        }

        // 3. Load all movements for the selected item ordered chronologically
        var movements = await _db.StockMovements
            .Where(m => m.ItemId == selectedItem.Id)
            .OrderBy(m => m.CreatedAt)
            .AsNoTracking()
            .ToListAsync();

        // Load confirmed purchase orders to match unit costs for purchases
        var confirmedPos = await _db.PurchaseOrders
            .Include(p => p.Supplier)
            .Where(p => p.Status != "CANCELLED")
            .OrderBy(p => p.OrderedAt)
            .AsNoTracking()
            .ToListAsync();

        var poList = confirmedPos.Select(po => new
        {
            Po = po,
            Lines = ParsePoItems(po.ItemsJson)
        }).ToList();

        // Setup Moving Weighted Average Cost simulation
        double currentMovingCost = selectedItem.CostPerUnit > 0 ? selectedItem.CostPerUnit : 0;
        int runningQuantity = 0;
        double runningValue = 0;

        // Normalise date range
        DateTime? filterStart = dateFrom.HasValue ? DateTime.SpecifyKind(dateFrom.Value.Date, DateTimeKind.Utc) : null;
        DateTime? filterEnd = dateTo.HasValue ? DateTime.SpecifyKind(dateTo.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc) : null;

        int openingQty = 0;
        double openingVal = 0;
        double openingUnitCost = currentMovingCost;

        var fullLedgerRows = new List<ProductLedgerEntryDto>();

        foreach (var m in movements)
        {
            int qty = m.Quantity;
            bool isAdd = qty > 0;
            int qtyIn = isAdd ? qty : 0;
            int qtyOut = !isAdd ? Math.Abs(qty) : 0;

            string rawType = m.Type ?? "PURCHASE";
            string displayType = rawType switch
            {
                "INITIAL_STOCK" or "OPENING" => "Opening Stock",
                "PURCHASE" => "Purchase",
                "POS_CONSUMPTION" or "SALE" or "DINE_IN" => "Sale",
                "HOUSEKEEPING_USAGE" => "Housekeeping Usage",
                "KITCHEN_USAGE" => "Kitchen Usage",
                "TRANSFER_IN" => "Stock Transfer In",
                "TRANSFER_OUT" => "Stock Transfer Out",
                "ADJUSTMENT_IN" => "Stock Adjustment Increase",
                "ADJUSTMENT_OUT" => "Stock Adjustment Decrease",
                "ADJUSTMENT" => qty >= 0 ? "Stock Adjustment Increase" : "Stock Adjustment Decrease",
                "RETURN" or "PURCHASE_RETURN" => "Purchase Return",
                "SALES_RETURN" => "Sales Return",
                _ => rawType.Replace("_", " ")
            };

            // Reference resolution
            string refNumber = !string.IsNullOrWhiteSpace(m.ReferenceNumber) ? m.ReferenceNumber :
                               !string.IsNullOrWhiteSpace(m.TransferNumber) ? m.TransferNumber :
                               !string.IsNullOrWhiteSpace(m.Reason) && m.Reason.StartsWith("PO-") ? m.Reason :
                               ("MOV-" + m.Id.Substring(0, Math.Min(8, m.Id.Length)));

            string refType = m.ReferenceType ?? (rawType.Contains("PURCHASE") ? "PURCHASE" :
                                                rawType.Contains("SALE") || rawType.Contains("POS") ? "SALE" :
                                                rawType.Contains("ADJUST") ? "ADJUSTMENT" :
                                                rawType.Contains("TRANSFER") ? "TRANSFER" : "OTHER");

            // Match unit cost
            double transactionUnitCost = currentMovingCost;
            string description = m.Reason ?? (!string.IsNullOrWhiteSpace(m.Notes) ? m.Notes : displayType);

            if (rawType == "PURCHASE")
            {
                var matchedPo = poList.FirstOrDefault(p =>
                    Math.Abs((p.Po.OrderedAt - m.CreatedAt).TotalHours) < 48 &&
                    p.Lines.Any(l => (!string.IsNullOrWhiteSpace(l.ItemId) && l.ItemId == selectedItem.Id) ||
                                     (!string.IsNullOrWhiteSpace(l.ItemCode) && l.ItemCode.Equals(selectedItem.Sku, StringComparison.OrdinalIgnoreCase)) ||
                                     (!string.IsNullOrWhiteSpace(l.ItemName) && l.ItemName.Trim().Equals(selectedItem.Name.Trim(), StringComparison.OrdinalIgnoreCase)))
                );

                if (matchedPo != null)
                {
                    refNumber = matchedPo.Po.PoNumber;
                    refType = "PURCHASE";
                    var line = matchedPo.Lines.First(l => (!string.IsNullOrWhiteSpace(l.ItemId) && l.ItemId == selectedItem.Id) ||
                                                          (!string.IsNullOrWhiteSpace(l.ItemCode) && l.ItemCode.Equals(selectedItem.Sku, StringComparison.OrdinalIgnoreCase)) ||
                                                          (!string.IsNullOrWhiteSpace(l.ItemName) && l.ItemName.Trim().Equals(selectedItem.Name.Trim(), StringComparison.OrdinalIgnoreCase)));
                    if (line.UnitCost > 0)
                        transactionUnitCost = line.UnitCost;
                    else if (selectedItem.CostPerUnit > 0)
                        transactionUnitCost = selectedItem.CostPerUnit;

                    var supp = matchedPo.Po.Supplier?.Name ?? matchedPo.Po.SupplierName ?? "Supplier";
                    description = $"Received from {supp}" + (!string.IsNullOrWhiteSpace(matchedPo.Po.InvoiceNumber) ? $" (Inv #{matchedPo.Po.InvoiceNumber})" : "");
                }
                else if (selectedItem.CostPerUnit > 0)
                {
                    transactionUnitCost = selectedItem.CostPerUnit;
                    description = "Stock replenishment purchase";
                }
            }
            else if (rawType == "INITIAL_STOCK" || rawType == "OPENING")
            {
                if (selectedItem.CostPerUnit > 0) transactionUnitCost = selectedItem.CostPerUnit;
                description = "Opening inventory balance carried forward";
            }
            else if (rawType.Contains("SALE") || rawType.Contains("POS"))
            {
                transactionUnitCost = currentMovingCost;
                description = string.IsNullOrWhiteSpace(description) ? "Restaurant / Guest POS order consumption" : description;
            }

            // Update moving weighted average
            double stockInVal = 0;
            double stockOutVal = 0;

            if (isAdd)
            {
                stockInVal = Math.Round(qtyIn * transactionUnitCost, 2);
                int newQty = runningQuantity + qtyIn;
                if (newQty > 0)
                {
                    currentMovingCost = Math.Round(((runningQuantity * currentMovingCost) + stockInVal) / newQty, 2);
                }
                else
                {
                    currentMovingCost = transactionUnitCost;
                }
                runningQuantity = newQty;
                runningValue = Math.Round(runningQuantity * currentMovingCost, 2);
            }
            else
            {
                transactionUnitCost = currentMovingCost;
                stockOutVal = Math.Round(qtyOut * transactionUnitCost, 2);
                runningQuantity = Math.Max(0, runningQuantity - qtyOut);
                runningValue = Math.Round(runningQuantity * currentMovingCost, 2);
            }

            var entryDate = m.CreatedAt;

            // Before filterStart -> Contributes to opening balance
            if (filterStart.HasValue && entryDate < filterStart.Value)
            {
                openingQty = runningQuantity;
                openingVal = runningValue;
                openingUnitCost = currentMovingCost;
                continue;
            }

            // After filterEnd -> Skip from display period
            if (filterEnd.HasValue && entryDate > filterEnd.Value)
            {
                continue;
            }

            // Filter by transaction type if requested
            if (!string.IsNullOrWhiteSpace(transactionType) && transactionType.ToUpper() != "ALL")
            {
                var tt = transactionType.ToUpper();
                bool matches = false;
                if (tt == "PURCHASE" && rawType == "PURCHASE") matches = true;
                else if (tt == "SALE" && (rawType.Contains("SALE") || rawType.Contains("POS"))) matches = true;
                else if (tt == "OPENING" && (rawType == "INITIAL_STOCK" || rawType == "OPENING")) matches = true;
                else if (tt == "ADJUSTMENT" && (rawType.Contains("ADJUST"))) matches = true;
                else if (tt == "TRANSFER" && rawType.Contains("TRANSFER")) matches = true;
                else if (tt == "RETURN" && rawType.Contains("RETURN")) matches = true;

                if (!matches) continue;
            }

            fullLedgerRows.Add(new ProductLedgerEntryDto
            {
                Id = m.Id,
                Date = entryDate,
                ReferenceNumber = refNumber,
                ReferenceType = refType,
                TransactionType = displayType,
                RawType = rawType,
                Description = description,
                QuantityIn = qtyIn,
                QuantityOut = qtyOut,
                BalanceQuantity = m.ResultingBalance ?? runningQuantity,
                UnitCost = transactionUnitCost,
                StockInValue = stockInVal,
                StockOutValue = stockOutVal,
                BalanceValue = runningValue,
                Department = m.Department ?? selectedItem.Department,
                PerformedBy = m.PerformedBy
            });
        }

        // Summary for period
        int periodStockIn = fullLedgerRows.Sum(r => r.QuantityIn);
        int periodStockOut = fullLedgerRows.Sum(r => r.QuantityOut);
        int closingQty = fullLedgerRows.Count > 0 ? fullLedgerRows.Last().BalanceQuantity : (filterStart.HasValue ? openingQty : selectedItem.CurrentStock);
        double closingVal = fullLedgerRows.Count > 0 ? fullLedgerRows.Last().BalanceValue : (filterStart.HasValue ? openingVal : Math.Round(selectedItem.CurrentStock * selectedItem.CostPerUnit, 2));

        return Ok(ApiResponse.Ok(new
        {
            costingMethod = "Weighted Average Cost (Moving Average)",
            inventoryAssetAccount = "1200 / 1210 (Food & Beverage / Hotel Operating Supplies Inventory)",
            summary = new
            {
                totalInventoryItems = totalItemsCount,
                totalInventoryValue = totalInventoryValuation,
                openingStockQuantity = openingQty,
                openingStockValue = Math.Round(openingVal, 2),
                openingUnitCost = Math.Round(openingUnitCost, 2),
                closingStockQuantity = closingQty,
                closingStockValue = Math.Round(closingVal, 2),
                totalStockInQuantity = periodStockIn,
                totalStockOutQuantity = periodStockOut,
                netQuantityChange = periodStockIn - periodStockOut,
                currentSystemStock = selectedItem.CurrentStock,
                isReconciledWithInventory = (closingQty == selectedItem.CurrentStock)
            },
            selectedItem = new
            {
                id = selectedItem.Id,
                name = selectedItem.Name,
                sku = selectedItem.Sku,
                category = selectedItem.Category,
                department = selectedItem.Department,
                unit = selectedItem.Unit,
                purchaseUnit = selectedItem.PurchaseUnit,
                conversionFactor = selectedItem.ConversionFactor,
                currentStock = selectedItem.CurrentStock,
                minThreshold = selectedItem.MinThreshold,
                costPerUnit = selectedItem.CostPerUnit,
                totalValuation = Math.Round(selectedItem.CurrentStock * selectedItem.CostPerUnit, 2),
                supplierName = selectedItem.Supplier?.Name ?? "Unassigned",
                stockStatus = selectedItem.CurrentStock <= 0 ? "OUT_OF_STOCK" :
                              (selectedItem.MinThreshold > 0 && selectedItem.CurrentStock <= selectedItem.MinThreshold ? "LOW_STOCK" : "IN_STOCK")
            },
            entries = fullLedgerRows,
            items = allItems.Select(i => new
            {
                id = i.Id,
                name = i.Name,
                sku = i.Sku,
                category = i.Category,
                department = i.Department,
                unit = i.Unit,
                currentStock = i.CurrentStock,
                unitCost = i.CostPerUnit,
                totalValue = Math.Round(i.CurrentStock * i.CostPerUnit, 2)
            })
        }));
    }

    // =========================================================================
    // 2. INVENTORY VALUATION
    // =========================================================================
    [HttpGet("inventory-valuation")]
    [HttpGet("/api/inventory/valuation")]
    [HttpGet("valuation")]
    public async Task<IActionResult> GetInventoryValuation(
        [FromQuery] DateTime? asOfDate,
        [FromQuery] string? category,
        [FromQuery] string? department,
        [FromQuery] string? stockStatus,
        [FromQuery] string? search,
        [FromQuery] string? costingMethod = "WEIGHTED_AVERAGE")
    {
        var itemsQuery = _db.InventoryItems
            .Include(i => i.Supplier)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(department) && department.ToUpper() != "ALL")
        {
            itemsQuery = itemsQuery.Where(i => i.Department.ToUpper() == department.ToUpper());
        }

        if (!string.IsNullOrWhiteSpace(category) && category.ToUpper() != "ALL")
        {
            itemsQuery = itemsQuery.Where(i => i.Category.ToUpper() == category.ToUpper());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            itemsQuery = itemsQuery.Where(i => i.Name.ToLower().Contains(s) || i.Sku.ToLower().Contains(s));
        }

        var items = await itemsQuery.OrderBy(i => i.Category).ThenBy(i => i.Name).ToListAsync();

        // Handle As-Of Date calculation if past date is requested
        DateTime? targetDate = asOfDate.HasValue ? DateTime.SpecifyKind(asOfDate.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc) : null;

        var valuationRows = new List<ValuationItemDto>();
        int sn = 1;

        // If targetDate is specified, fetch movements that happened after targetDate to roll back
        Dictionary<string, int> movementsAfterDate = new();
        if (targetDate.HasValue)
        {
            var futureMovements = await _db.StockMovements
                .Where(m => m.CreatedAt > targetDate.Value)
                .GroupBy(m => m.ItemId)
                .Select(g => new { ItemId = g.Key, NetChange = g.Sum(x => x.Quantity) })
                .ToListAsync();

            movementsAfterDate = futureMovements.ToDictionary(f => f.ItemId, f => f.NetChange);
        }

        foreach (var item in items)
        {
            int qty = item.CurrentStock;
            if (targetDate.HasValue && movementsAfterDate.TryGetValue(item.Id, out int futureChange))
            {
                // Current = AsOf + FutureChange => AsOf = Current - FutureChange
                qty = Math.Max(0, item.CurrentStock - futureChange);
            }

            double unitCost = item.CostPerUnit;
            double totalVal = Math.Round(qty * unitCost, 2);

            string status = qty <= 0 ? "OUT_OF_STOCK" :
                           (item.MinThreshold > 0 && qty <= item.MinThreshold ? "LOW_STOCK" : "IN_STOCK");

            if (!string.IsNullOrWhiteSpace(stockStatus) && stockStatus.ToUpper() != "ALL")
            {
                if (!status.Equals(stockStatus.ToUpper(), StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }
            }

            valuationRows.Add(new ValuationItemDto
            {
                Sn = sn++,
                Id = item.Id,
                ItemCode = item.Sku,
                ItemName = item.Name,
                Category = item.Category,
                Department = item.Department,
                CurrentQuantity = qty,
                Unit = item.Unit,
                ValuationCost = unitCost,
                TotalStockValue = totalVal,
                StockStatus = status,
                MinThreshold = item.MinThreshold,
                SupplierName = item.Supplier?.Name ?? "Unassigned"
            });
        }

        // Summary Calculations
        double totalValuationValue = Math.Round(valuationRows.Sum(v => v.TotalStockValue), 2);
        int totalTrackedItems = valuationRows.Count;
        int inStockCount = valuationRows.Count(v => v.StockStatus == "IN_STOCK");
        int lowStockCount = valuationRows.Count(v => v.StockStatus == "LOW_STOCK");
        int outOfStockCount = valuationRows.Count(v => v.StockStatus == "OUT_OF_STOCK");

        // Group by Unit to display breakdown without invalidly adding mismatched units (e.g. bottles + kg)
        var unitBreakdown = valuationRows
            .GroupBy(v => string.IsNullOrWhiteSpace(v.Unit) ? "units" : v.Unit.ToLower())
            .Select(g => new
            {
                unit = g.Key,
                totalQuantity = g.Sum(x => x.CurrentQuantity),
                itemCount = g.Count()
            })
            .OrderByDescending(u => u.itemCount)
            .ToList();

        // Category-wise Breakdown
        var categoryBreakdown = valuationRows
            .GroupBy(v => v.Category)
            .Select(g =>
            {
                double catVal = Math.Round(g.Sum(x => x.TotalStockValue), 2);
                return new
                {
                    category = g.Key,
                    totalItems = g.Count(),
                    totalQuantity = g.Sum(x => x.CurrentQuantity),
                    stockValue = catVal,
                    percentageOfTotal = totalValuationValue > 0 ? Math.Round((catVal / totalValuationValue) * 100, 1) : 0
                };
            })
            .OrderByDescending(c => c.stockValue)
            .ToList();

        // Department-wise Breakdown
        var departmentBreakdown = valuationRows
            .GroupBy(v => v.Department.ToUpper())
            .Select(g =>
            {
                double deptVal = Math.Round(g.Sum(x => x.TotalStockValue), 2);
                return new
                {
                    department = g.Key,
                    totalItems = g.Count(),
                    stockValue = deptVal,
                    percentageOfTotal = totalValuationValue > 0 ? Math.Round((deptVal / totalValuationValue) * 100, 1) : 0
                };
            })
            .OrderByDescending(d => d.stockValue)
            .ToList();

        // General Ledger Integration & Reconciliation
        var glAccounts = await _db.Accounts
            .Where(a => a.AccountCode == "1200" || a.AccountCode == "1210")
            .AsNoTracking()
            .ToListAsync();

        var acct1200 = glAccounts.FirstOrDefault(a => a.AccountCode == "1200");
        var acct1210 = glAccounts.FirstOrDefault(a => a.AccountCode == "1210");

        double gl1200Balance = acct1200?.CurrentBalance ?? 0;
        double gl1210Balance = acct1210?.CurrentBalance ?? 0;
        double totalGlInventory = Math.Round(gl1200Balance + gl1210Balance, 2);
        double variance = Math.Round(totalValuationValue - totalGlInventory, 2);
        bool isReconciled = Math.Abs(variance) < 1.0;

        return Ok(ApiResponse.Ok(new
        {
            costingMethod = "Weighted Average Cost (Moving Average)",
            asOfDate = targetDate ?? DateTime.UtcNow,
            summary = new
            {
                totalInventoryValue = totalValuationValue,
                totalInventoryItems = totalTrackedItems,
                inStockCount,
                lowStockCount,
                outOfStockCount,
                unitBreakdown
            },
            glReconciliation = new
            {
                account1200Code = "1200",
                account1200Name = acct1200?.AccountName ?? "Food & Beverage Inventory Asset",
                account1200Balance = gl1200Balance,
                account1210Code = "1210",
                account1210Name = acct1210?.AccountName ?? "Hotel Operating Supplies Inventory",
                account1210Balance = gl1210Balance,
                totalGlBalance = totalGlInventory,
                physicalValuationTotal = totalValuationValue,
                variance,
                isReconciled,
                reconciliationStatus = isReconciled ? "RECONCILED" : "VARIANCE_DETECTED",
                note = isReconciled
                    ? "Physical inventory valuation matches General Ledger Asset Account (1200 & 1210)."
                    : $"A variance of NPR {Math.Abs(variance):N2} exists between physical inventory valuation and GL Asset balance. Recommended to review unposted purchase receipts or pending stock adjustments."
            },
            categoryBreakdown,
            departmentBreakdown,
            items = valuationRows
        }));
    }
}

public class ProductLedgerEntryDto
{
    public string Id { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string ReferenceNumber { get; set; } = string.Empty;
    public string ReferenceType { get; set; } = string.Empty;
    public string TransactionType { get; set; } = string.Empty;
    public string RawType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int QuantityIn { get; set; }
    public int QuantityOut { get; set; }
    public int BalanceQuantity { get; set; }
    public double UnitCost { get; set; }
    public double StockInValue { get; set; }
    public double StockOutValue { get; set; }
    public double BalanceValue { get; set; }
    public string Department { get; set; } = string.Empty;
    public string PerformedBy { get; set; } = string.Empty;
}

public class ValuationItemDto
{
    public int Sn { get; set; }
    public string Id { get; set; } = string.Empty;
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public int CurrentQuantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public double ValuationCost { get; set; }
    public double TotalStockValue { get; set; }
    public string StockStatus { get; set; } = string.Empty;
    public int MinThreshold { get; set; }
    public string SupplierName { get; set; } = string.Empty;
}

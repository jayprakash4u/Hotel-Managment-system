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

        return Ok(ApiResponse.Ok(item));
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
        string? SupplierId
    );

    [HttpPost("items")]
    public async Task<IActionResult> CreateInventoryItem([FromBody] CreateInventoryItemRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
        {
            return BadRequest(ApiResponse.Fail("Item name is required."));
        }

        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? Guid.NewGuid().ToString("N");

        var dept = (req.Department ?? "HOTEL").Trim().ToUpper();
        if (dept != "HOTEL" && dept != "RESTAURANT")
        {
            dept = "HOTEL";
        }

        var sku = req.Sku?.Trim().ToUpper();
        if (string.IsNullOrWhiteSpace(sku))
        {
            var prefix = dept == "HOTEL" ? "HOT" : "RES";
            var catPrefix = req.Category.Length >= 3 ? req.Category.Substring(0, 3).ToUpper() : "ITM";
            sku = $"{prefix}-{catPrefix}-{Random.Shared.Next(100, 999)}";
        }

        var item = new InventoryItem
        {
            HotelId = hotelId,
            Name = req.Name.Trim(),
            Department = dept,
            Category = req.Category.Trim().ToUpper(),
            Sku = sku,
            CurrentStock = req.CurrentStock,
            MinThreshold = req.MinThreshold,
            Unit = string.IsNullOrWhiteSpace(req.Unit) ? "pieces" : req.Unit.Trim(),
            CostPerUnit = req.CostPerUnit,
            SupplierId = req.SupplierId,
            LastRestocked = DateTime.UtcNow
        };

        _db.InventoryItems.Add(item);

        if (req.CurrentStock > 0)
        {
            _db.StockMovements.Add(new StockMovement
            {
                ItemId = item.Id,
                Department = dept,
                Quantity = req.CurrentStock,
                Type = "INITIAL_STOCK",
                Reason = "Initial inventory setup",
                PerformedBy = "Inventory Manager",
                CreatedAt = DateTime.UtcNow
            });
        }

        await _db.SaveChangesAsync();
        return Ok(ApiResponse.Ok(item, $"Inventory item '{item.Name}' added to {dept} Inventory."));
    }

    public record UpdateInventoryItemRequest(
        string Name,
        string Category,
        int MinThreshold,
        string Unit,
        double CostPerUnit,
        string? SupplierId
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
        item.MinThreshold = req.MinThreshold;
        item.Unit = req.Unit.Trim();
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
        int QuantityAdded,
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

        // 2. Prevent duplicate stock additions caused by repeated submissions
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
                        message = "Duplicate submission prevented. Stock was already added."
                    }, "Duplicate stock addition prevented by idempotency lock."));
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

            var previousBalance = item.CurrentStock;
            var newBalance = previousBalance + req.QuantityAdded;

            // Update item stock and unit
            item.CurrentStock = newBalance;
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

            var movement = new StockMovement
            {
                ItemId = item.Id,
                Department = item.Department,
                Quantity = req.QuantityAdded,
                PreviousBalance = previousBalance,
                ResultingBalance = newBalance,
                Type = "PURCHASE",
                Reason = reason,
                PerformedBy = req.PerformedBy ?? "Inventory Manager",
                CreatedAt = purchaseDate
            };
            _db.StockMovements.Add(movement);

            // Record the purchase order to preserve purchase history and supplier information
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
                        quantity = req.QuantityAdded,
                        unit = req.Unit.Trim(),
                        totalCost = req.TotalCost,
                        invoiceNumber = req.InvoiceNumber?.Trim(),
                        previousBalance,
                        resultingBalance = newBalance,
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
                    previousBalance,
                    resultingBalance = newBalance,
                    currentStock = item.CurrentStock,
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
                movement = new
                {
                    id = movement.Id,
                    quantity = movement.Quantity,
                    previousBalance = movement.PreviousBalance,
                    resultingBalance = movement.ResultingBalance,
                    reason = movement.Reason,
                    createdAt = movement.CreatedAt
                }
            };

            return Ok(ApiResponse.Ok(result, $"Successfully added {req.QuantityAdded} {item.Unit} to '{item.Name}'. New stock balance is {newBalance} {item.Unit}."));
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, ApiResponse.Fail($"Failed to save stock purchase: {ex.Message}"));
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
    public async Task<IActionResult> GetPurchases()
    {
        var purchases = await _db.PurchaseOrders
            .Include(p => p.Supplier)
            .OrderByDescending(p => p.OrderedAt)
            .ToListAsync();

        return Ok(ApiResponse.Ok(purchases));
    }

    public record PurchaseAllocationItemDto(
        string ItemName,
        string Unit,
        double UnitPrice,
        int Quantity,
        int HotelQuantity,
        int RestaurantQuantity,
        string? HotelItemId,
        string? RestaurantItemId,
        string? Category
    );

    public record CreateSharedPurchaseOrderRequest(
        string SupplierId,
        double TotalAmount,
        string? Notes,
        string? PoNumber,
        List<PurchaseAllocationItemDto> Items
    );

    [HttpPost("purchases")]
    public async Task<IActionResult> CreatePurchaseOrder([FromBody] CreateSharedPurchaseOrderRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.SupplierId))
        {
            return BadRequest(ApiResponse.Fail("Supplier is required for purchase orders."));
        }

        if (req.Items == null || req.Items.Count == 0)
        {
            return BadRequest(ApiResponse.Fail("At least one purchase item is required."));
        }

        // Validate allocation mathematics: hotelQuantity + restaurantQuantity must equal quantity
        foreach (var item in req.Items)
        {
            var allocatedTotal = item.HotelQuantity + item.RestaurantQuantity;
            if (allocatedTotal != item.Quantity)
            {
                return BadRequest(ApiResponse.Fail(
                    $"Allocated quantities for '{item.ItemName}' (Hotel: {item.HotelQuantity} + Restaurant: {item.RestaurantQuantity} = {allocatedTotal}) must equal total purchased quantity ({item.Quantity})."
                ));
            }
        }

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var hotel = await _db.Hotels.FirstOrDefaultAsync();
            var hotelId = hotel?.Id ?? Guid.NewGuid().ToString("N");

            var poNumber = !string.IsNullOrWhiteSpace(req.PoNumber)
                ? req.PoNumber
                : $"PO-{DateTime.UtcNow.Year}-{Random.Shared.Next(1000, 9999)}";

            var po = new PurchaseOrder
            {
                HotelId = hotelId,
                SupplierId = req.SupplierId,
                TotalAmount = req.TotalAmount,
                Status = "RECEIVED",
                PoNumber = poNumber,
                ItemsJson = JsonSerializer.Serialize(req.Items),
                AllocationsJson = JsonSerializer.Serialize(req.Items.Select(i => new
                {
                    itemName = i.ItemName,
                    quantity = i.Quantity,
                    hotelQty = i.HotelQuantity,
                    restaurantQty = i.RestaurantQuantity
                })),
                OrderedAt = DateTime.UtcNow,
                ReceivedAt = DateTime.UtcNow
            };

            _db.PurchaseOrders.Add(po);

            // Execute inventory balance updates based on allocated quantities
            foreach (var item in req.Items)
            {
                // Allocation to Hotel Inventory
                if (item.HotelQuantity > 0)
                {
                    InventoryItem? hotelItem = null;
                    if (!string.IsNullOrWhiteSpace(item.HotelItemId))
                    {
                        hotelItem = await _db.InventoryItems.FirstOrDefaultAsync(i => i.Id == item.HotelItemId && i.Department == "HOTEL");
                    }
                    if (hotelItem == null)
                    {
                        hotelItem = await _db.InventoryItems.FirstOrDefaultAsync(i => i.Department == "HOTEL" && i.Name.ToLower() == item.ItemName.ToLower());
                    }

                    if (hotelItem != null)
                    {
                        hotelItem.CurrentStock += item.HotelQuantity;
                        hotelItem.CostPerUnit = item.UnitPrice > 0 ? item.UnitPrice : hotelItem.CostPerUnit;
                        hotelItem.LastRestocked = DateTime.UtcNow;
                    }
                    else
                    {
                        hotelItem = new InventoryItem
                        {
                            HotelId = hotelId,
                            Department = "HOTEL",
                            Name = item.ItemName.Trim(),
                            Category = !string.IsNullOrWhiteSpace(item.Category) ? item.Category.ToUpper() : "GUEST_AMENITIES",
                            Sku = $"HOT-PUR-{Random.Shared.Next(100, 999)}",
                            CurrentStock = item.HotelQuantity,
                            MinThreshold = 10,
                            Unit = item.Unit,
                            CostPerUnit = item.UnitPrice,
                            SupplierId = req.SupplierId,
                            LastRestocked = DateTime.UtcNow
                        };
                        _db.InventoryItems.Add(hotelItem);
                    }

                    _db.StockMovements.Add(new StockMovement
                    {
                        ItemId = hotelItem.Id,
                        Department = "HOTEL",
                        Quantity = item.HotelQuantity,
                        Type = "PURCHASE",
                        Reason = $"Purchase Order {po.PoNumber} allocation",
                        PerformedBy = "Purchasing Officer",
                        CreatedAt = DateTime.UtcNow
                    });
                }

                // Allocation to Restaurant Inventory
                if (item.RestaurantQuantity > 0)
                {
                    InventoryItem? resItem = null;
                    if (!string.IsNullOrWhiteSpace(item.RestaurantItemId))
                    {
                        resItem = await _db.InventoryItems.FirstOrDefaultAsync(i => i.Id == item.RestaurantItemId && i.Department == "RESTAURANT");
                    }
                    if (resItem == null)
                    {
                        resItem = await _db.InventoryItems.FirstOrDefaultAsync(i => i.Department == "RESTAURANT" && i.Name.ToLower() == item.ItemName.ToLower());
                    }

                    if (resItem != null)
                    {
                        resItem.CurrentStock += item.RestaurantQuantity;
                        resItem.CostPerUnit = item.UnitPrice > 0 ? item.UnitPrice : resItem.CostPerUnit;
                        resItem.LastRestocked = DateTime.UtcNow;
                    }
                    else
                    {
                        resItem = new InventoryItem
                        {
                            HotelId = hotelId,
                            Department = "RESTAURANT",
                            Name = item.ItemName.Trim(),
                            Category = !string.IsNullOrWhiteSpace(item.Category) ? item.Category.ToUpper() : "BEVERAGES",
                            Sku = $"RES-PUR-{Random.Shared.Next(100, 999)}",
                            CurrentStock = item.RestaurantQuantity,
                            MinThreshold = 10,
                            Unit = item.Unit,
                            CostPerUnit = item.UnitPrice,
                            SupplierId = req.SupplierId,
                            LastRestocked = DateTime.UtcNow
                        };
                        _db.InventoryItems.Add(resItem);
                    }

                    _db.StockMovements.Add(new StockMovement
                    {
                        ItemId = resItem.Id,
                        Department = "RESTAURANT",
                        Quantity = item.RestaurantQuantity,
                        Type = "PURCHASE",
                        Reason = $"Purchase Order {po.PoNumber} allocation",
                        PerformedBy = "Purchasing Officer",
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(ApiResponse.Ok(po, $"Purchase Order {po.PoNumber} recorded and stock allocated to respective departments."));
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, ApiResponse.Fail($"Failed to record purchase order: {ex.Message}"));
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

        po.Status = req.Status.ToUpper();
        if (po.Status == "RECEIVED")
        {
            po.ReceivedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return Ok(ApiResponse.Ok(po, "Purchase Order updated successfully."));
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
    // 5. MOVEMENTS AUDIT LOGS
    // =========================================================================

    [HttpGet("movements")]
    public async Task<IActionResult> GetMovements([FromQuery] string? department)
    {
        var query = _db.StockMovements.Include(m => m.Item).AsQueryable();

        if (!string.IsNullOrWhiteSpace(department) && !department.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            var dept = department.Trim().ToUpper();
            query = query.Where(m => m.Department.ToUpper() == dept);
        }

        var movements = await query
            .OrderByDescending(m => m.CreatedAt)
            .Take(100)
            .ToListAsync();

        return Ok(ApiResponse.Ok(movements));
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
        var totalStockQuantity = items.Sum(i => i.CurrentStock);
        var totalValuation = Math.Round(items.Sum(i => i.CurrentStock * i.CostPerUnit), 2);

        var lowStockItems = items.Where(i => i.CurrentStock <= i.MinThreshold).ToList();
        var outOfStockItems = items.Where(i => i.CurrentStock <= 0).ToList();

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
                    stockQuantity = hotelItems.Sum(i => i.CurrentStock),
                    valuation = Math.Round(hotelItems.Sum(i => i.CurrentStock * i.CostPerUnit), 2),
                    lowStock = hotelItems.Count(i => i.CurrentStock <= i.MinThreshold)
                },
                restaurant = new
                {
                    skus = restaurantItems.Count,
                    stockQuantity = restaurantItems.Sum(i => i.CurrentStock),
                    valuation = Math.Round(restaurantItems.Sum(i => i.CurrentStock * i.CostPerUnit), 2),
                    lowStock = restaurantItems.Count(i => i.CurrentStock <= i.MinThreshold)
                }
            }
        };

        return Ok(ApiResponse.Ok(report));
    }
}

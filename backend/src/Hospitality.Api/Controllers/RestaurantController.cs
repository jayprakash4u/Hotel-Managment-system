using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;
using Hospitality.Api.Services;

namespace Hospitality.Api.Controllers;

[ApiController]
public class RestaurantController : ControllerBase
{
    private readonly HospitalityDbContext _db;

    public RestaurantController(HospitalityDbContext db)
    {
        _db = db;
    }

    [HttpGet("api/restaurant/orders")]
    public async Task<IActionResult> GetOrders(
        [FromQuery] string? outlet, 
        [FromQuery] string? status,
        [FromQuery] string? tableId,
        [FromQuery] string? orderType,
        [FromQuery] bool? activeOnly,
        [FromQuery] string? search)
    {
        var query = _db.RestaurantOrders
            .Include(o => o.Items)
            .Include(o => o.Table)
            .Include(o => o.Room)
            .Include(o => o.Guest)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(outlet))
        {
            query = query.Where(o => o.Outlet.ToUpper() == outlet.ToUpper());
        }

        if (activeOnly == true)
        {
            query = query.Where(o => o.Status != "COMPLETED" && o.Status != "CANCELLED");
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            var statuses = status.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                                 .Select(s => s.ToUpper())
                                 .ToList();
            if (statuses.Count == 1)
            {
                query = query.Where(o => o.Status.ToUpper() == statuses[0]);
            }
            else if (statuses.Count > 1)
            {
                query = query.Where(o => statuses.Contains(o.Status.ToUpper()));
            }
        }

        if (!string.IsNullOrWhiteSpace(tableId))
        {
            if (tableId.Equals("none", StringComparison.OrdinalIgnoreCase) || tableId.Equals("null", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(o => o.TableId == null);
            }
            else
            {
                query = query.Where(o => o.TableId == tableId);
            }
        }

        if (!string.IsNullOrWhiteSpace(orderType))
        {
            var types = orderType.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                                 .Select(t => t.ToUpper())
                                 .ToList();
            query = query.Where(o => types.Contains(o.OrderType.ToUpper()));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(o => 
                o.OrderNumber.ToLower().Contains(s) ||
                (o.Table != null && o.Table.TableNumber.ToLower().Contains(s)) ||
                (o.ServerName != null && o.ServerName.ToLower().Contains(s)) ||
                (o.Notes != null && o.Notes.ToLower().Contains(s)) ||
                o.Items.Any(i => i.ProductName.ToLower().Contains(s))
            );
        }

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return Ok(ApiResponse.Ok(orders));
    }

    [HttpGet("api/restaurant/orders/{id}")]
    public async Task<IActionResult> GetOrderById(string id)
    {
        var order = await _db.RestaurantOrders
            .Include(o => o.Items)
            .Include(o => o.Table)
            .Include(o => o.Room)
            .Include(o => o.Guest)
            .FirstOrDefaultAsync(o => o.Id == id || o.OrderNumber == id);

        if (order == null)
        {
            return NotFound(ApiResponse.Fail($"Order '{id}' not found."));
        }

        return Ok(ApiResponse.Ok(order));
    }

    [HttpGet("api/restaurant/tables/{tableId}/active-order")]
    public async Task<IActionResult> GetActiveTableOrder(string tableId)
    {
        var order = await _db.RestaurantOrders
            .Include(o => o.Items)
            .Include(o => o.Table)
            .Include(o => o.Room)
            .Include(o => o.Guest)
            .Where(o => o.TableId == tableId && o.Status != "COMPLETED" && o.Status != "CANCELLED")
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync();

        if (order == null)
        {
            return Ok(ApiResponse<RestaurantOrder?>.Ok(null, "No active order for this table."));
        }

        return Ok(ApiResponse.Ok(order));
    }

    private static readonly SemaphoreSlim _orderSeqLock = new(1, 1);
    private static int _lastOrderSeq = 0;
    private static int _lastKotSeq = 0;

    private async Task<string> GenerateUniqueOrderNumberAsync()
    {
        await _orderSeqLock.WaitAsync();
        try
        {
            if (_lastOrderSeq == 0)
            {
                var existingOrderNumbers = await _db.RestaurantOrders
                    .Where(o => o.OrderNumber.StartsWith("ORD-"))
                    .Select(o => o.OrderNumber)
                    .ToListAsync();

                int maxFound = 2000;
                foreach (var on in existingOrderNumbers)
                {
                    var clean = on.Replace("ORD-", "");
                    if (int.TryParse(clean, out int parsed) && parsed > maxFound)
                    {
                        maxFound = parsed;
                    }
                }
                _lastOrderSeq = maxFound;
            }

            _lastOrderSeq++;
            string orderNumber = $"ORD-{_lastOrderSeq:D4}";
            while (await _db.RestaurantOrders.AnyAsync(o => o.OrderNumber == orderNumber))
            {
                _lastOrderSeq++;
                orderNumber = $"ORD-{_lastOrderSeq:D4}";
            }

            return orderNumber;
        }
        finally
        {
            _orderSeqLock.Release();
        }
    }

    private async Task<string> GenerateUniqueKitchenTicketAsync()
    {
        await _orderSeqLock.WaitAsync();
        try
        {
            if (_lastKotSeq == 0)
            {
                var existingKot = await _db.RestaurantOrders
                    .Where(o => o.KotNumber.StartsWith("KOT-"))
                    .Select(o => o.KotNumber)
                    .ToListAsync();

                int maxFound = 200;
                foreach (var kot in existingKot)
                {
                    var clean = kot.Replace("KOT-", "");
                    if (int.TryParse(clean, out int parsed) && parsed > maxFound)
                    {
                        maxFound = parsed;
                    }
                }
                _lastKotSeq = maxFound;
            }

            _lastKotSeq++;
            return $"KOT-{_lastKotSeq}";
        }
        finally
        {
            _orderSeqLock.Release();
        }
    }

    public record CreateRestaurantOrderRequest(
        string? Outlet,
        string? TableId,
        string? RoomId,
        string? GuestId,
        string? OrderType,
        string? ServerName,
        string? PaymentMethod,
        string? Notes,
        List<RestaurantOrderItemDto>? Items
    );

    public record RestaurantOrderItemDto(
        string? ProductId,
        string? ProductName,
        double UnitPrice,
        int Quantity,
        string? Notes,
        string? Department = "KOT",
        int? DispatchedQuantity = 0,
        string? KotNumber = null,
        string? BotNumber = null
    );

    [HttpPost("api/restaurant/orders")]
    public async Task<IActionResult> CreateOrder([FromBody] CreateRestaurantOrderRequest req)
    {
        var items = req.Items ?? new List<RestaurantOrderItemDto>();

        foreach (var item in items)
        {
            if (item.Quantity <= 0)
            {
                return BadRequest(ApiResponse.Fail($"Invalid quantity ({item.Quantity}) for item '{item.ProductName}'. Quantity must be at least 1."));
            }
        }

        // Database transaction for concurrency and stock consistency
        using var transaction = await _db.Database.BeginTransactionAsync();

        try
        {
            // Stock Validation and Deduction for Tracked Products
            foreach (var item in items)
            {
                POSProduct? product = null;

                if (!string.IsNullOrWhiteSpace(item.ProductId))
                {
                    product = await _db.POSProducts.FirstOrDefaultAsync(p => p.Id == item.ProductId);
                }

                if (product == null && !string.IsNullOrWhiteSpace(item.ProductName))
                {
                    var cleanName = item.ProductName.Trim().ToLower();
                    product = await _db.POSProducts.FirstOrDefaultAsync(p => p.Name.ToLower() == cleanName);
                }

                if (product != null)
                {
                    if (product.TrackStock)
                    {
                        // Stocked product check
                        if (!product.IsAvailable || product.Stock <= 0)
                        {
                            await transaction.RollbackAsync();
                            return BadRequest(ApiResponse.Fail($"Product '{product.Name}' is out of stock / unavailable."));
                        }

                        if (product.Stock < item.Quantity)
                        {
                            await transaction.RollbackAsync();
                            return BadRequest(ApiResponse.Fail($"Insufficient stock for '{product.Name}'. Available: {product.Stock}, Requested: {item.Quantity}."));
                        }

                        // Deduct stock
                        product.Stock -= item.Quantity;

                        // When stock reaches 0, mark item unavailable for new orders
                        if (product.Stock <= 0)
                        {
                            product.Stock = 0;
                            product.IsAvailable = false;
                        }

                        // Requirement 3: Deduct stock from Restaurant Inventory only when linked to a tracked inventory item
                        InventoryItem? invItem = null;
                        if (!string.IsNullOrWhiteSpace(product.InventoryItemId))
                        {
                            invItem = await _db.InventoryItems.FirstOrDefaultAsync(i => i.Id == product.InventoryItemId && i.Department == "RESTAURANT");
                        }
                        else
                        {
                            invItem = await _db.InventoryItems.FirstOrDefaultAsync(i => i.Department == "RESTAURANT" && (i.Name.ToLower() == product.Name.ToLower() || (!string.IsNullOrEmpty(i.Sku) && i.Sku.ToLower() == product.Name.ToLower())));
                        }

                        if (invItem != null && invItem.TrackStock)
                        {
                            invItem.CurrentStock = Math.Max(0, invItem.CurrentStock - item.Quantity);
                            invItem.LastRestocked = DateTime.UtcNow;
                            _db.StockMovements.Add(new StockMovement
                            {
                                ItemId = invItem.Id,
                                Department = "RESTAURANT",
                                Quantity = -item.Quantity,
                                Type = "POS_CONSUMPTION",
                                Reason = "Restaurant Order sale deduction",
                                PerformedBy = req.ServerName ?? "Restaurant Staff",
                                CreatedAt = DateTime.UtcNow
                            });
                        }
                    }
                }
            }

            var hotel = await _db.Hotels.FirstOrDefaultAsync();
            var hotelId = hotel?.Id ?? Guid.NewGuid().ToString("N");

            // Requirement 10: Prevent multiple active dine-in orders from accidentally being created for the same occupied table.
            if (!string.IsNullOrWhiteSpace(req.TableId))
            {
                var existingOrder = await _db.RestaurantOrders
                    .Include(o => o.Items)
                    .Include(o => o.Table)
                    .FirstOrDefaultAsync(o => o.TableId == req.TableId && o.Status != "COMPLETED" && o.Status != "CANCELLED");

                if (existingOrder != null)
                {
                    // Append new items to the existing active order
                    foreach (var item in items)
                    {
                        existingOrder.Items.Add(new RestaurantOrderItem
                        {
                            OrderId = existingOrder.Id,
                            ProductId = item.ProductId ?? Guid.NewGuid().ToString("N"),
                            ProductName = item.ProductName ?? "Item",
                            UnitPrice = item.UnitPrice,
                            Quantity = item.Quantity,
                            Total = item.UnitPrice * item.Quantity,
                            Notes = item.Notes,
                            Department = !string.IsNullOrWhiteSpace(item.Department) ? item.Department : "KOT",
                            DispatchedQuantity = item.DispatchedQuantity ?? 0,
                            KotNumber = item.KotNumber,
                            BotNumber = item.BotNumber
                        });
                    }

                    var countKot = await _db.RestaurantOrders.CountAsync();
                    var supplementaryKot = $"KOT-{201 + countKot}";
                    existingOrder.KotNumber = string.IsNullOrWhiteSpace(existingOrder.KotNumber) 
                        ? supplementaryKot 
                        : $"{existingOrder.KotNumber}, {supplementaryKot}";

                    var newSubtotal = existingOrder.Items.Sum(i => i.UnitPrice * i.Quantity);
                    var newTax = Math.Round(newSubtotal * 0.10, 2);
                    var newService = Math.Round(newSubtotal * 0.05, 2);

                    existingOrder.Subtotal = newSubtotal;
                    existingOrder.Tax = newTax;
                    existingOrder.ServiceCharge = newService;
                    existingOrder.Total = newSubtotal + newTax + newService;
                    existingOrder.UpdatedAt = DateTime.UtcNow;

                    if (!string.IsNullOrWhiteSpace(req.Notes))
                    {
                        existingOrder.Notes = string.IsNullOrWhiteSpace(existingOrder.Notes) 
                            ? req.Notes 
                            : $"{existingOrder.Notes} | {req.Notes}";
                    }

                    // Ensure table status is OCCUPIED
                    var tableRef = await _db.RestaurantTables.FindAsync(req.TableId);
                    if (tableRef != null)
                    {
                        tableRef.Status = "OCCUPIED";
                    }

                    await _db.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return Ok(ApiResponse.Ok(existingOrder, $"Items added to active Order {existingOrder.OrderNumber} ({supplementaryKot})."));
                }
            }

            var orderNumber = await GenerateUniqueOrderNumberAsync();
            var kotNumber = await GenerateUniqueKitchenTicketAsync();
            var subtotal = items.Sum(i => i.UnitPrice * i.Quantity);
            var tax = Math.Round(subtotal * 0.10, 2);
            var service = Math.Round(subtotal * 0.05, 2);
            var total = subtotal + tax + service;

            var isDineIn = string.IsNullOrEmpty(req.RoomId);
            var defaultOrderType = isDineIn 
                ? (string.IsNullOrWhiteSpace(req.TableId) ? "NO_TABLE" : "DINE_IN") 
                : "ROOM_SERVICE";

            var order = new RestaurantOrder
            {
                HotelId = hotelId,
                OrderNumber = orderNumber,
                KotNumber = kotNumber,
                Outlet = req.Outlet ?? "RESTAURANT",
                TableId = req.TableId,
                RoomId = req.RoomId,
                GuestId = req.GuestId,
                Status = "RECEIVED",
                OrderType = req.OrderType ?? defaultOrderType,
                ServerName = req.ServerName ?? "Waiter",
                Subtotal = subtotal,
                Tax = tax,
                ServiceCharge = service,
                Total = total,
                PaymentMethod = req.PaymentMethod,
                IsPaid = false,
                Notes = req.Notes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            foreach (var item in items)
            {
                order.Items.Add(new RestaurantOrderItem
                {
                    OrderId = order.Id,
                    ProductId = item.ProductId ?? Guid.NewGuid().ToString("N"),
                    ProductName = item.ProductName ?? "Item",
                    UnitPrice = item.UnitPrice,
                    Quantity = item.Quantity,
                    Total = item.UnitPrice * item.Quantity,
                    Notes = item.Notes,
                    Department = !string.IsNullOrWhiteSpace(item.Department) ? item.Department : "KOT",
                    DispatchedQuantity = item.DispatchedQuantity ?? 0,
                    KotNumber = item.KotNumber,
                    BotNumber = item.BotNumber
                });
            }

            // If table is specified, validate walk-in availability and mark table as OCCUPIED
            if (!string.IsNullOrWhiteSpace(req.TableId))
            {
                var table = await _db.RestaurantTables.FindAsync(req.TableId);
                if (table != null)
                {
                    if (table.Status != "OCCUPIED")
                    {
                        var walkInCheck = await ValidateWalkInSeatingAsync(table);
                        if (!walkInCheck.CanSeat)
                        {
                            await transaction.RollbackAsync();
                            return BadRequest(ApiResponse.Fail(walkInCheck.Warning ?? "Table is not available for seating."));
                        }
                        table.Status = "OCCUPIED";
                    }
                }
            }

            // If immediate Room Service charge to folio is requested
            if (req.PaymentMethod == "ROOM_FOLIO" && !string.IsNullOrEmpty(req.RoomId))
            {
                var activeRes = await _db.Reservations
                    .FirstOrDefaultAsync(r => r.RoomId == req.RoomId && (r.Status == "CHECKED_IN" || r.Status == "CONFIRMED"));

                if (activeRes != null)
                {
                    activeRes.FolioItems.Add(new FolioItem
                    {
                        ReservationId = activeRes.Id,
                        Outlet = req.Outlet ?? "RESTAURANT",
                        Description = $"{req.Outlet ?? "Restaurant"} Order #{orderNumber}",
                        UnitPrice = total,
                        Quantity = 1,
                        Total = total,
                        Timestamp = DateTime.UtcNow,
                        BilledBy = req.ServerName ?? "Front Desk"
                    });
                    activeRes.TotalAmount += total;
                    order.IsPaid = true;
                }
            }

            _db.RestaurantOrders.Add(order);
            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(ApiResponse.Ok(order, $"Order {orderNumber} created successfully ({kotNumber})."));
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            var detail = ex.InnerException != null ? $"{ex.Message} -> {ex.InnerException.Message}" : ex.Message;
            return StatusCode(500, ApiResponse.Fail($"Failed to create restaurant order: {detail}"));
        }
    }

    public record AddOrderItemsRequest(
        List<RestaurantOrderItemDto> Items,
        string? Notes
    );

    [HttpPost("api/restaurant/orders/{id}/items")]
    public async Task<IActionResult> AddItemsToOrder(string id, [FromBody] AddOrderItemsRequest req)
    {
        if (req.Items == null || req.Items.Count == 0)
        {
            return BadRequest(ApiResponse.Fail("At least one item must be added."));
        }

        var order = await _db.RestaurantOrders
            .Include(o => o.Items)
            .Include(o => o.Table)
            .FirstOrDefaultAsync(o => o.Id == id || o.OrderNumber == id);

        if (order == null)
        {
            return NotFound(ApiResponse.Fail($"Order '{id}' not found."));
        }

        if (order.Status == "COMPLETED" || order.Status == "CANCELLED")
        {
            return BadRequest(ApiResponse.Fail($"Cannot add items to an order with status '{order.Status}'."));
        }

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            // Stock Validation and Deduction for Newly Added Items
            foreach (var item in req.Items)
            {
                if (item.Quantity <= 0)
                {
                    await transaction.RollbackAsync();
                    return BadRequest(ApiResponse.Fail($"Invalid quantity ({item.Quantity}) for '{item.ProductName}'."));
                }

                POSProduct? product = null;
                if (!string.IsNullOrWhiteSpace(item.ProductId))
                {
                    product = await _db.POSProducts.FirstOrDefaultAsync(p => p.Id == item.ProductId);
                }
                if (product == null && !string.IsNullOrWhiteSpace(item.ProductName))
                {
                    var clean = item.ProductName.Trim().ToLower();
                    product = await _db.POSProducts.FirstOrDefaultAsync(p => p.Name.ToLower() == clean);
                }

                if (product != null && product.TrackStock)
                {
                    if (!product.IsAvailable || product.Stock < item.Quantity)
                    {
                        await transaction.RollbackAsync();
                        return BadRequest(ApiResponse.Fail($"Insufficient stock for '{product.Name}'. Available: {product.Stock}, Requested: {item.Quantity}."));
                    }

                    product.Stock -= item.Quantity;
                    if (product.Stock <= 0)
                    {
                        product.Stock = 0;
                        product.IsAvailable = false;
                    }
                }

                order.Items.Add(new RestaurantOrderItem
                {
                    OrderId = order.Id,
                    ProductId = item.ProductId ?? Guid.NewGuid().ToString("N"),
                    ProductName = item.ProductName ?? "Item",
                    UnitPrice = item.UnitPrice,
                    Quantity = item.Quantity,
                    Total = item.UnitPrice * item.Quantity,
                    Notes = item.Notes,
                    Department = !string.IsNullOrWhiteSpace(item.Department) ? item.Department : "KOT",
                    DispatchedQuantity = item.DispatchedQuantity ?? 0,
                    KotNumber = item.KotNumber,
                    BotNumber = item.BotNumber
                });
            }

            var countKot = await _db.RestaurantOrders.CountAsync();
            var supplementaryKot = $"KOT-{201 + countKot}";
            order.KotNumber = string.IsNullOrWhiteSpace(order.KotNumber) 
                ? supplementaryKot 
                : $"{order.KotNumber}, {supplementaryKot}";

            var newSubtotal = order.Items.Sum(i => i.UnitPrice * i.Quantity);
            var newTax = Math.Round(newSubtotal * 0.10, 2);
            var newService = Math.Round(newSubtotal * 0.05, 2);

            order.Subtotal = newSubtotal;
            order.Tax = newTax;
            order.ServiceCharge = newService;
            order.Total = newSubtotal + newTax + newService;
            order.UpdatedAt = DateTime.UtcNow;

            if (!string.IsNullOrWhiteSpace(req.Notes))
            {
                order.Notes = string.IsNullOrWhiteSpace(order.Notes) ? req.Notes : $"{order.Notes} | {req.Notes}";
            }

            // Ensure table remains occupied
            if (!string.IsNullOrEmpty(order.TableId))
            {
                var table = await _db.RestaurantTables.FindAsync(order.TableId);
                if (table != null) table.Status = "OCCUPIED";
            }

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(ApiResponse.Ok(order, $"Items sent to kitchen ({supplementaryKot})."));
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, ApiResponse.Fail($"Failed to add items: {ex.Message}"));
        }
    }

    [HttpPut("api/restaurant/orders/{id}/items")]
    public async Task<IActionResult> UpdateOrderItems(string id, [FromBody] AddOrderItemsRequest req)
    {
        var order = await _db.RestaurantOrders
            .Include(o => o.Items)
            .Include(o => o.Table)
            .FirstOrDefaultAsync(o => o.Id == id || o.OrderNumber == id);

        if (order == null)
        {
            return NotFound(ApiResponse.Fail($"Order '{id}' not found."));
        }

        if (order.Status == "COMPLETED" || order.Status == "CANCELLED")
        {
            return BadRequest(ApiResponse.Fail($"Cannot modify an order with status '{order.Status}'."));
        }

        _db.RestaurantOrderItems.RemoveRange(order.Items);
        order.Items.Clear();

        if (req.Items != null)
        {
            foreach (var item in req.Items)
            {
                if (item.Quantity > 0)
                {
                    order.Items.Add(new RestaurantOrderItem
                    {
                        OrderId = order.Id,
                        ProductId = item.ProductId ?? Guid.NewGuid().ToString("N"),
                        ProductName = item.ProductName ?? "Item",
                        UnitPrice = item.UnitPrice,
                        Quantity = item.Quantity,
                        Total = item.UnitPrice * item.Quantity,
                        Notes = item.Notes,
                        Department = !string.IsNullOrWhiteSpace(item.Department) ? item.Department : "KOT",
                        DispatchedQuantity = item.DispatchedQuantity ?? 0,
                        KotNumber = item.KotNumber,
                        BotNumber = item.BotNumber
                    });
                }
            }
        }

        var newSubtotal = order.Items.Sum(i => i.UnitPrice * i.Quantity);
        var newTax = Math.Round(newSubtotal * 0.10, 2);
        var newService = Math.Round(newSubtotal * 0.05, 2);

        order.Subtotal = newSubtotal;
        order.Tax = newTax;
        order.ServiceCharge = newService;
        order.Total = newSubtotal + newTax + newService;
        order.UpdatedAt = DateTime.UtcNow;

        if (order.Items.Count > 0 && !string.IsNullOrEmpty(order.TableId))
        {
            var table = await _db.RestaurantTables.FindAsync(order.TableId);
            if (table != null) table.Status = "OCCUPIED";
        }

        await _db.SaveChangesAsync();
        return Ok(ApiResponse.Ok(order, "Order items updated successfully."));
    }

    [HttpPost("api/restaurant/orders/{id}/dispatch-kot")]
    public async Task<IActionResult> DispatchKot(string id)
    {
        var order = await _db.RestaurantOrders
            .Include(o => o.Items)
            .Include(o => o.Table)
            .FirstOrDefaultAsync(o => o.Id == id || o.OrderNumber == id);

        if (order == null)
        {
            return NotFound(ApiResponse.Fail($"Order '{id}' not found."));
        }

        // Only select items whose department is KOT (or empty default) and has pending quantity to dispatch
        var pendingItems = order.Items
            .Where(i => (string.IsNullOrWhiteSpace(i.Department) || i.Department == "KOT") && i.Quantity > i.DispatchedQuantity)
            .ToList();

        if (pendingItems.Count == 0)
        {
            return BadRequest(ApiResponse.Fail("No pending KOT items to dispatch. All kitchen items have already been printed."));
        }

        var countKot = await _db.RestaurantOrders.CountAsync();
        var kotTicket = $"KOT-{201 + countKot}";

        var dispatchedPayload = pendingItems.Select(i => new
        {
            ItemId = i.Id,
            ProductName = i.ProductName,
            DeltaQuantity = i.Quantity - i.DispatchedQuantity,
            TotalQuantity = i.Quantity,
            Notes = i.Notes,
            Department = "KOT"
        }).ToList();

        foreach (var item in pendingItems)
        {
            item.DispatchedQuantity = item.Quantity;
            item.KotNumber = kotTicket;
        }

        order.KotNumber = string.IsNullOrWhiteSpace(order.KotNumber)
            ? kotTicket
            : $"{order.KotNumber}, {kotTicket}";
        order.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            TicketNumber = kotTicket,
            Department = "KOT",
            OrderId = order.Id,
            OrderNumber = order.OrderNumber,
            TableNumber = order.Table?.TableNumber ?? "No Table",
            ServerName = order.ServerName,
            DispatchedAt = DateTime.UtcNow,
            Items = dispatchedPayload
        }, $"Dispatched {dispatchedPayload.Count} items to Kitchen ({kotTicket})."));
    }

    [HttpPost("api/restaurant/orders/{id}/dispatch-bot")]
    public async Task<IActionResult> DispatchBot(string id)
    {
        var order = await _db.RestaurantOrders
            .Include(o => o.Items)
            .Include(o => o.Table)
            .FirstOrDefaultAsync(o => o.Id == id || o.OrderNumber == id);

        if (order == null)
        {
            return NotFound(ApiResponse.Fail($"Order '{id}' not found."));
        }

        // Only select items whose department is BOT and has pending quantity to dispatch
        var pendingItems = order.Items
            .Where(i => i.Department == "BOT" && i.Quantity > i.DispatchedQuantity)
            .ToList();

        if (pendingItems.Count == 0)
        {
            return BadRequest(ApiResponse.Fail("No pending BOT items to dispatch. All beverage/bar items have already been printed."));
        }

        var countBot = await _db.RestaurantOrderItems.Where(i => !string.IsNullOrEmpty(i.BotNumber)).CountAsync();
        var botTicket = $"BOT-{101 + countBot}";

        var dispatchedPayload = pendingItems.Select(i => new
        {
            ItemId = i.Id,
            ProductName = i.ProductName,
            DeltaQuantity = i.Quantity - i.DispatchedQuantity,
            TotalQuantity = i.Quantity,
            Notes = i.Notes,
            Department = "BOT"
        }).ToList();

        foreach (var item in pendingItems)
        {
            item.DispatchedQuantity = item.Quantity;
            item.BotNumber = botTicket;
        }

        order.BotNumber = string.IsNullOrWhiteSpace(order.BotNumber)
            ? botTicket
            : $"{order.BotNumber}, {botTicket}";
        order.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            TicketNumber = botTicket,
            Department = "BOT",
            OrderId = order.Id,
            OrderNumber = order.OrderNumber,
            TableNumber = order.Table?.TableNumber ?? "No Table",
            ServerName = order.ServerName,
            DispatchedAt = DateTime.UtcNow,
            Items = dispatchedPayload
        }, $"Dispatched {dispatchedPayload.Count} items to Bar ({botTicket})."));
    }

    [HttpDelete("api/restaurant/orders/{orderId}/items/{itemId}")]
    public async Task<IActionResult> RemoveOrderItem(string orderId, string itemId)
    {
        var order = await _db.RestaurantOrders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId || o.OrderNumber == orderId);

        if (order == null)
        {
            return NotFound(ApiResponse.Fail($"Order '{orderId}' not found."));
        }

        var item = order.Items.FirstOrDefault(i => i.Id == itemId || i.ProductName.ToLower() == itemId.ToLower());
        if (item != null)
        {
            _db.RestaurantOrderItems.Remove(item);
            order.Items.Remove(item);

            var newSubtotal = order.Items.Sum(i => i.UnitPrice * i.Quantity);
            order.Subtotal = newSubtotal;
            order.Tax = Math.Round(newSubtotal * 0.10, 2);
            order.ServiceCharge = Math.Round(newSubtotal * 0.05, 2);
            order.Total = newSubtotal + order.Tax + order.ServiceCharge;
            order.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
        }

        return Ok(ApiResponse.Ok(order, "Item removed successfully."));
    }

    public record GenerateBillRequest(
        double? DiscountPercent,
        double? DiscountAmount,
        double? RoundOff,
        string? Remarks
    );

    [HttpPost("api/restaurant/orders/{id}/generate-bill")]
    public async Task<IActionResult> GenerateBill(string id, [FromBody] GenerateBillRequest? req)
    {
        var order = await _db.RestaurantOrders
            .Include(o => o.Items)
            .Include(o => o.Table)
            .FirstOrDefaultAsync(o => o.Id == id || o.OrderNumber == id);

        if (order == null)
        {
            return NotFound(ApiResponse.Fail($"Order '{id}' not found."));
        }

        order.Status = "BILLED";
        order.UpdatedAt = DateTime.UtcNow;

        if (req != null)
        {
            if (req.DiscountPercent.HasValue && req.DiscountPercent.Value > 0)
            {
                order.DiscountPercent = req.DiscountPercent.Value;
                var disc = Math.Round((order.Subtotal * order.DiscountPercent) / 100, 2);
                order.DiscountAmount = disc;
                order.Total = Math.Max(0, order.Subtotal - disc + order.Tax + order.ServiceCharge);
            }
            else if (req.DiscountAmount.HasValue && req.DiscountAmount.Value > 0)
            {
                order.DiscountAmount = req.DiscountAmount.Value;
                order.DiscountPercent = order.Subtotal > 0 ? Math.Round((order.DiscountAmount / order.Subtotal) * 100, 1) : 0;
                order.Total = Math.Max(0, order.Subtotal - order.DiscountAmount + order.Tax + order.ServiceCharge);
            }

            if (!string.IsNullOrWhiteSpace(req.Remarks))
            {
                order.Notes = string.IsNullOrWhiteSpace(order.Notes) ? req.Remarks : $"{order.Notes} | {req.Remarks}";
            }
        }

        if (order.Table != null)
        {
            order.Table.Status = "BILLED";
        }

        // Shared Billing System: Create or update permanent Bill
        var existingBill = await _db.Bills.FirstOrDefaultAsync(b => b.OrderId == order.Id);
        if (existingBill == null)
        {
            var billType = order.OrderType == "ROOM_SERVICE" ? "ROOM_SERVICE" : (order.TableId != null ? "TABLE_ORDER" : "WALK_IN");
            var billNo = await BillingController.GenerateBillNumberAsync(_db, order.HotelId);

            var itemsList = order.Items.Select(i => new
            {
                name = i.ProductName,
                quantity = i.Quantity,
                unitPrice = i.UnitPrice,
                total = i.Total,
                notes = i.Notes
            }).ToList();

            existingBill = new Bill
            {
                HotelId = order.HotelId,
                BillNumber = billNo,
                BillingType = billType,
                OrderId = order.Id,
                OrderNumber = order.OrderNumber,
                TableNumber = order.Table?.TableNumber,
                RoomNumber = order.Room?.Number,
                GuestId = order.GuestId,
                CustomerName = order.Guest != null ? $"{order.Guest.FirstName} {order.Guest.LastName}".Trim() : null,
                CustomerPhone = order.Guest?.Phone,
                ServerOrStaff = order.ServerName,
                Subtotal = order.Subtotal,
                DiscountAmount = order.DiscountAmount,
                DiscountPercent = order.DiscountPercent,
                TaxAmount = order.Tax,
                ServiceCharge = order.ServiceCharge,
                GrandTotal = order.Total,
                AmountPaid = 0,
                BalanceDue = order.Total,
                PaymentStatus = "UNPAID",
                PaymentMethod = "UNPAID",
                ItemsJson = System.Text.Json.JsonSerializer.Serialize(itemsList),
                PaymentsJson = "[]",
                Notes = order.Notes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.Bills.Add(existingBill);
        }
        else
        {
            // Concurrency & reprint safety: update existing financial snapshot without creating duplicate
            existingBill.Subtotal = order.Subtotal;
            existingBill.DiscountAmount = order.DiscountAmount;
            existingBill.DiscountPercent = order.DiscountPercent;
            existingBill.TaxAmount = order.Tax;
            existingBill.ServiceCharge = order.ServiceCharge;
            existingBill.GrandTotal = order.Total;
            existingBill.BalanceDue = Math.Max(0, order.Total - existingBill.AmountPaid);
            var itemsList = order.Items.Select(i => new
            {
                name = i.ProductName,
                quantity = i.Quantity,
                unitPrice = i.UnitPrice,
                total = i.Total,
                notes = i.Notes
            }).ToList();
            existingBill.ItemsJson = System.Text.Json.JsonSerializer.Serialize(itemsList);
            existingBill.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            order,
            bill = existingBill
        }, $"Bill {existingBill.BillNumber} generated for Order {order.OrderNumber}."));
    }

    public record SettleRestaurantOrderRequest(
        string PaymentMethod, // CASH, CARD, UPI, ROOM_FOLIO
        string? RoomNumber,
        string? RoomId,
        string? ReservationId,
        string? ServerName,
        double? PaidAmount,
        double? DiscountPercent,
        double? DiscountAmount,
        double? RoundOff,
        string? Remarks
    );

    [HttpPost("api/restaurant/orders/{id}/settle")]
    public async Task<IActionResult> SettleOrder(string id, [FromBody] SettleRestaurantOrderRequest req)
    {
        var order = await _db.RestaurantOrders
            .Include(o => o.Items)
            .Include(o => o.Table)
            .FirstOrDefaultAsync(o => o.Id == id || o.OrderNumber == id);

        if (order == null)
        {
            return NotFound(ApiResponse.Fail($"Order '{id}' not found."));
        }

        if (order.Status == "COMPLETED")
        {
            return Ok(ApiResponse.Ok(order, "Order is already completed and paid."));
        }

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var pMethod = (req.PaymentMethod ?? "CASH").ToUpper().Trim();

            // Handle discounts if provided at settlement
            if (req.DiscountPercent.HasValue && req.DiscountPercent.Value > 0)
            {
                order.DiscountPercent = req.DiscountPercent.Value;
                var disc = Math.Round((order.Subtotal * order.DiscountPercent) / 100, 2);
                order.DiscountAmount = disc;
                order.Total = Math.Max(0, order.Subtotal - disc + order.Tax + order.ServiceCharge);
            }
            else if (req.DiscountAmount.HasValue && req.DiscountAmount.Value > 0)
            {
                order.DiscountAmount = req.DiscountAmount.Value;
                order.DiscountPercent = order.Subtotal > 0 ? Math.Round((order.DiscountAmount / order.Subtotal) * 100, 1) : 0;
                order.Total = Math.Max(0, order.Subtotal - order.DiscountAmount + order.Tax + order.ServiceCharge);
            }

            // Requirement 9: Hotel Restaurant - Charge to Room
            if (pMethod == "ROOM_FOLIO")
            {
                Reservation? activeRes = null;

                if (!string.IsNullOrWhiteSpace(req.ReservationId))
                {
                    activeRes = await _db.Reservations
                        .Include(r => r.FolioItems)
                        .Include(r => r.Room)
                        .Include(r => r.Guest)
                        .FirstOrDefaultAsync(r => r.Id == req.ReservationId && r.Status == "CHECKED_IN");
                }

                if (activeRes == null && !string.IsNullOrWhiteSpace(req.RoomNumber))
                {
                    var cleanRNum = req.RoomNumber.Trim().ToLower();
                    activeRes = await _db.Reservations
                        .Include(r => r.FolioItems)
                        .Include(r => r.Room)
                        .Include(r => r.Guest)
                        .FirstOrDefaultAsync(r => r.Room != null && r.Room.Number.ToLower() == cleanRNum && r.Status == "CHECKED_IN");
                }

                if (activeRes == null && !string.IsNullOrWhiteSpace(req.RoomId))
                {
                    activeRes = await _db.Reservations
                        .Include(r => r.FolioItems)
                        .Include(r => r.Room)
                        .Include(r => r.Guest)
                        .FirstOrDefaultAsync(r => r.RoomId == req.RoomId && r.Status == "CHECKED_IN");
                }

                if (activeRes == null)
                {
                    await transaction.RollbackAsync();
                    return BadRequest(ApiResponse.Fail($"Could not verify active hotel stay for Room '{req.RoomNumber ?? req.RoomId}'. Ensure the guest is checked in."));
                }

                var tableLabel = order.Table?.TableNumber != null ? $"Table {order.Table.TableNumber}" : "Dining";
                var folioDescription = $"Restaurant Order #{order.OrderNumber} ({tableLabel})";

                activeRes.FolioItems.Add(new FolioItem
                {
                    ReservationId = activeRes.Id,
                    Outlet = "RESTAURANT",
                    Description = folioDescription,
                    UnitPrice = order.Total,
                    Quantity = 1,
                    Total = order.Total,
                    Timestamp = DateTime.UtcNow,
                    BilledBy = req.ServerName ?? order.ServerName ?? "Cashier"
                });

                activeRes.TotalAmount += order.Total;
                activeRes.UpdatedAt = DateTime.UtcNow;

                order.RoomId = activeRes.RoomId;
                order.GuestId = activeRes.GuestId;
            }

            order.PaymentMethod = pMethod;
            order.IsPaid = true;
            order.Status = "COMPLETED";
            order.UpdatedAt = DateTime.UtcNow;

            if (!string.IsNullOrWhiteSpace(req.Remarks))
            {
                order.Notes = string.IsNullOrWhiteSpace(order.Notes) ? req.Remarks : $"{order.Notes} | {req.Remarks}";
            }

            // Shift Accounting: Update active CashRegister if open
            var activeRegister = await _db.CashRegisters
                .Where(r => r.Status == "OPEN")
                .OrderByDescending(r => r.OpenedAt)
                .FirstOrDefaultAsync();

            if (activeRegister != null)
            {
                if (pMethod == "CASH")
                {
                    activeRegister.CashSales += order.Total;
                }
                else if (pMethod == "CARD" || pMethod == "UPI")
                {
                    activeRegister.CardSales += order.Total;
                }
            }

            // Shared Billing System: Create or finalize permanent Bill
            var billForOrder = await _db.Bills.FirstOrDefaultAsync(b => b.OrderId == order.Id);
            var itemsList = order.Items.Select(i => new
            {
                name = i.ProductName,
                quantity = i.Quantity,
                unitPrice = i.UnitPrice,
                total = i.Total,
                notes = i.Notes
            }).ToList();

            var paymentEntry = new
            {
                Id = $"PAY-{Guid.NewGuid():N}"[..12].ToUpper(),
                Amount = order.Total,
                PaymentMethod = pMethod,
                PaymentDate = DateTime.UtcNow,
                ReceivedBy = req.ServerName ?? order.ServerName ?? "Cashier",
                Notes = pMethod == "ROOM_FOLIO" ? $"Charged to Room {req.RoomNumber ?? order.Room?.Number}" : "Settled"
            };

            if (billForOrder == null)
            {
                var billType = order.OrderType == "ROOM_SERVICE" ? "ROOM_SERVICE" : (order.TableId != null ? "TABLE_ORDER" : "WALK_IN");
                var billNo = await BillingController.GenerateBillNumberAsync(_db, order.HotelId);

                billForOrder = new Bill
                {
                    HotelId = order.HotelId,
                    BillNumber = billNo,
                    BillingType = billType,
                    OrderId = order.Id,
                    OrderNumber = order.OrderNumber,
                    TableNumber = order.Table?.TableNumber,
                    RoomNumber = order.Room?.Number,
                    GuestId = order.GuestId,
                    CustomerName = order.Guest != null ? $"{order.Guest.FirstName} {order.Guest.LastName}".Trim() : null,
                    CustomerPhone = order.Guest?.Phone,
                    ServerOrStaff = req.ServerName ?? order.ServerName,
                    Subtotal = order.Subtotal,
                    DiscountAmount = order.DiscountAmount,
                    DiscountPercent = order.DiscountPercent,
                    TaxAmount = order.Tax,
                    ServiceCharge = order.ServiceCharge,
                    GrandTotal = order.Total,
                    AmountPaid = order.Total,
                    BalanceDue = 0,
                    PaymentStatus = "PAID",
                    PaymentMethod = pMethod,
                    ItemsJson = System.Text.Json.JsonSerializer.Serialize(itemsList),
                    PaymentsJson = System.Text.Json.JsonSerializer.Serialize(new[] { paymentEntry }),
                    Notes = order.Notes,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _db.Bills.Add(billForOrder);
            }
            else
            {
                billForOrder.AmountPaid = order.Total;
                billForOrder.BalanceDue = 0;
                billForOrder.PaymentStatus = "PAID";
                billForOrder.PaymentMethod = pMethod;
                billForOrder.ItemsJson = System.Text.Json.JsonSerializer.Serialize(itemsList);
                billForOrder.PaymentsJson = System.Text.Json.JsonSerializer.Serialize(new[] { paymentEntry });
                billForOrder.UpdatedAt = DateTime.UtcNow;
            }

            // Requirement 7: After successful payment and completion, release the table (if assigned)
            if (!string.IsNullOrWhiteSpace(order.TableId))
            {
                var table = await _db.RestaurantTables.FindAsync(order.TableId);
                if (table != null)
                {
                    table.Status = "FREE";
                    table.CleaningStatus = "DIRTY";
                }
            }

            // Complete linked table reservation if one exists
            if (!string.IsNullOrWhiteSpace(order.ReservationId))
            {
                var linkedRes = await _db.TableReservations.FindAsync(order.ReservationId);
                if (linkedRes != null && linkedRes.Status == "SEATED")
                {
                    linkedRes.Status = "COMPLETED";
                    linkedRes.UpdatedAt = DateTime.UtcNow;
                }
            }
            else
            {
                var linkedRes = await _db.TableReservations
                    .FirstOrDefaultAsync(r => r.OrderId == order.Id && r.Status == "SEATED");
                if (linkedRes != null)
                {
                    linkedRes.Status = "COMPLETED";
                    linkedRes.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(ApiResponse.Ok(new
            {
                Order = order,
                ReleasedTableId = order.TableId,
                Message = $"Order {order.OrderNumber} completed via {pMethod}." + (!string.IsNullOrWhiteSpace(order.TableId) ? " Table is now available." : "")
            }));
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, ApiResponse.Fail($"Failed to settle order: {ex.Message}"));
        }
    }

    public record AssignTableRequest(string TableId);

    [HttpPost("api/restaurant/orders/{id}/assign-table")]
    public async Task<IActionResult> AssignTable(string id, [FromBody] AssignTableRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.TableId))
        {
            return BadRequest(ApiResponse.Fail("Table ID is required to assign a table."));
        }

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var order = await _db.RestaurantOrders
                .Include(o => o.Items)
                .Include(o => o.Table)
                .FirstOrDefaultAsync(o => o.Id == id || o.OrderNumber == id);

            if (order == null)
            {
                return NotFound(ApiResponse.Fail($"Order '{id}' not found."));
            }

            if (order.Status == "COMPLETED" || order.Status == "CANCELLED")
            {
                return BadRequest(ApiResponse.Fail($"Cannot assign a table to a {order.Status.ToLower()} order."));
            }

            var targetTable = await _db.RestaurantTables
                .FirstOrDefaultAsync(t => t.Id == req.TableId);

            if (targetTable == null)
            {
                return NotFound(ApiResponse.Fail($"Table '{req.TableId}' not found."));
            }

            // Verify that the table is eligible and available - Requirement 8
            var existingActiveOrder = await _db.RestaurantOrders
                .FirstOrDefaultAsync(o => o.TableId == targetTable.Id && o.Id != order.Id && o.Status != "COMPLETED" && o.Status != "CANCELLED");

            if (existingActiveOrder != null || targetTable.Status == "OCCUPIED" || targetTable.Status == "BILLED")
            {
                return BadRequest(ApiResponse.Fail($"Table {targetTable.TableNumber} is currently occupied by active order #{existingActiveOrder?.OrderNumber ?? "another order"}. Please choose an available table."));
            }

            // If this order was previously assigned to a different table, release the old table
            if (!string.IsNullOrWhiteSpace(order.TableId) && order.TableId != targetTable.Id)
            {
                var oldTable = await _db.RestaurantTables.FindAsync(order.TableId);
                if (oldTable != null)
                {
                    oldTable.Status = "FREE";
                }
            }

            // Update order and table state consistently
            order.TableId = targetTable.Id;
            order.OrderType = "DINE_IN";
            order.UpdatedAt = DateTime.UtcNow;

            targetTable.Status = order.Status == "BILLED" ? "BILLED" : "OCCUPIED";

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            await _db.Entry(order).Reference(o => o.Table).LoadAsync();

            return Ok(ApiResponse.Ok(order, $"Table {targetTable.TableNumber} successfully assigned to Order {order.OrderNumber}."));
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, ApiResponse.Fail($"Failed to assign table: {ex.Message}"));
        }
    }

    [HttpGet("api/restaurant/verify-room/{roomNumber}")]
    public async Task<IActionResult> VerifyRoom(string roomNumber)
    {
        if (string.IsNullOrWhiteSpace(roomNumber))
        {
            return BadRequest(ApiResponse.Fail("Room number is required."));
        }

        var clean = roomNumber.Trim().ToLower();
        var res = await _db.Reservations
            .Include(r => r.Room)
            .Include(r => r.Guest)
            .FirstOrDefaultAsync(r => r.Room != null && r.Room.Number.ToLower() == clean && r.Status == "CHECKED_IN");

        if (res == null)
        {
            return Ok(ApiResponse.Fail($"No active checked-in stay found for Room '{roomNumber}'."));
        }

        return Ok(ApiResponse.Ok(new
        {
            Valid = true,
            ReservationId = res.Id,
            RoomId = res.RoomId,
            RoomNumber = res.Room?.Number,
            GuestId = res.GuestId,
            GuestName = $"{res.Guest?.FirstName} {res.Guest?.LastName}".Trim(),
            GuestPhone = res.Guest?.Phone,
            BookingCode = res.BookingCode,
            CheckIn = res.CheckIn,
            CheckOut = res.CheckOut,
            TotalAmount = res.TotalAmount,
            PaidAmount = res.PaidAmount
        }, "Active hotel stay verified successfully."));
    }

    public record UpdateRestaurantOrderStatusRequest(string Status, string? Notes);

    [HttpPatch("api/restaurant/orders/{id}/status")]
    public async Task<IActionResult> UpdateOrderStatus(string id, [FromBody] UpdateRestaurantOrderStatusRequest req)
    {
        var order = await _db.RestaurantOrders
            .Include(o => o.Items)
            .Include(o => o.Table)
            .FirstOrDefaultAsync(o => o.Id == id || o.OrderNumber == id);

        if (order == null)
        {
            return NotFound(ApiResponse.Fail($"Order '{id}' not found."));
        }

        var newStatus = req.Status.ToUpper().Trim();
        var oldStatus = order.Status.ToUpper().Trim();

        // Idempotency: if already cancelled, don't restore stock again
        if (newStatus == "CANCELLED" && oldStatus != "CANCELLED")
        {
            using var transaction = await _db.Database.BeginTransactionAsync();
            try
            {
                foreach (var item in order.Items)
                {
                    var product = await _db.POSProducts
                        .FirstOrDefaultAsync(p => p.Id == item.ProductId || p.Name.ToLower() == item.ProductName.ToLower());

                    if (product != null && product.TrackStock)
                    {
                        product.Stock += item.Quantity;
                        if (product.Stock > 0)
                        {
                            product.IsAvailable = true;
                        }
                    }
                }

                order.Status = "CANCELLED";
                order.UpdatedAt = DateTime.UtcNow;
                if (!string.IsNullOrWhiteSpace(req.Notes))
                {
                    order.Notes = string.IsNullOrEmpty(order.Notes) ? req.Notes : $"{order.Notes} | {req.Notes}";
                }

                // If table is associated, release table
                if (!string.IsNullOrEmpty(order.TableId))
                {
                    var table = await _db.RestaurantTables.FindAsync(order.TableId);
                    if (table != null) table.Status = "FREE";
                }

                await _db.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(ApiResponse.Ok(order, $"Order {order.OrderNumber} status updated to CANCELLED and stock restored."));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, ApiResponse.Fail($"Failed to cancel order: {ex.Message}"));
            }
        }

        order.Status = newStatus;
        order.UpdatedAt = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(req.Notes))
        {
            order.Notes = string.IsNullOrEmpty(order.Notes) ? req.Notes : $"{order.Notes} | {req.Notes}";
        }

        // If completed, release table
        if (newStatus == "COMPLETED" && !string.IsNullOrEmpty(order.TableId))
        {
            var table = await _db.RestaurantTables.FindAsync(order.TableId);
            if (table != null)
            {
                table.Status = "FREE";
                table.CleaningStatus = "DIRTY";
            }
        }

        await _db.SaveChangesAsync();
        return Ok(ApiResponse.Ok(order, $"Order {order.OrderNumber} status updated to {newStatus}."));
    }

    [HttpPost("api/restaurant/orders/{id}/cancel")]
    public async Task<IActionResult> CancelOrder(string id)
    {
        return await UpdateOrderStatus(id, new UpdateRestaurantOrderStatusRequest("CANCELLED", "Cancelled via cancel action"));
    }

    [HttpGet("api/restaurant/tables")]
    [HttpGet("api/tables")]
    public async Task<IActionResult> GetTables([FromQuery] string? date)
    {
        DateTime targetDate;
        var hotel = await _db.Hotels.AsNoTracking().FirstOrDefaultAsync();
        var hotelTz = TableReservationAlertService.ResolveTimeZone(hotel?.Timezone);
        var nowHotelLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, hotelTz);

        if (!string.IsNullOrWhiteSpace(date) && DateTime.TryParse(date, out var parsedDate))
        {
            targetDate = parsedDate.Date;
        }
        else
        {
            targetDate = nowHotelLocal.Date;
        }

        var targetUtcDate = DateTime.SpecifyKind(targetDate, DateTimeKind.Utc);
        bool isTargetToday = (targetDate.Date == nowHotelLocal.Date);

        IQueryable<RestaurantTable> query = _db.RestaurantTables;
        if (!isTargetToday)
        {
            query = query.AsNoTracking();
        }

        if (isTargetToday)
        {
            query = query
                .Include(t => t.Orders.Where(o => o.Status != "COMPLETED" && o.Status != "CANCELLED"))
                    .ThenInclude(o => o.Items);
        }

        var tables = await query
            .Include(t => t.Reservations.Where(r =>
                (r.Status == "CONFIRMED" || r.Status == "SEATED" || r.Status == "PENDING") &&
                r.ReservationDate.Date == targetUtcDate.Date))
            .OrderBy(t => t.TableNumber)
            .ToListAsync();

        bool hasStatusFix = false;
        foreach (var t in tables)
        {
            if (isTargetToday)
            {
                // Operational status must be kept separate from reservations.
                // If table has no active dining order but was previously marked RESERVED, restore operational status to FREE.
                if (t.Status == "RESERVED" && !t.Orders.Any(o => o.Status != "COMPLETED" && o.Status != "CANCELLED"))
                {
                    t.Status = "FREE";
                    hasStatusFix = true;
                }
            }
            else
            {
                // Active dining orders and seated guest occupancy are strictly for Today.
                // Tomorrow and future dates have no live orders; operational status is FREE unless OUT_OF_SERVICE.
                t.Orders = new List<RestaurantOrder>();
                if (t.Status != "OUT_OF_SERVICE" && t.Status != "MAINTENANCE")
                {
                    t.Status = "FREE";
                }
            }

            t.Reservations = t.Reservations
                .OrderBy(r => r.ReservationTime)
                .ToList();
        }

        if (hasStatusFix)
        {
            await _db.SaveChangesAsync();
        }

        return Ok(ApiResponse.Ok(tables));
    }

    [HttpPost("api/restaurant/tables/{id}/release")]
    [HttpPatch("api/restaurant/tables/{id}/release")]
    public async Task<IActionResult> ReleaseTable(string id)
    {
        var table = await _db.RestaurantTables.FindAsync(id);
        if (table == null)
        {
            return NotFound(ApiResponse.Fail($"Table '{id}' not found."));
        }

        table.Status = "FREE";
        table.CleaningStatus = "DIRTY";

        // Mark any remaining active orders as COMPLETED
        var activeOrders = await _db.RestaurantOrders
            .Where(o => o.TableId == id && o.Status != "COMPLETED" && o.Status != "CANCELLED")
            .ToListAsync();

        foreach (var o in activeOrders)
        {
            o.Status = "COMPLETED";
            o.IsPaid = true;
            o.UpdatedAt = DateTime.UtcNow;
        }

        // Also complete any seated table reservations for this table
        var seatedReservations = await _db.TableReservations
            .Where(r => r.TableId == id && r.Status == "SEATED")
            .ToListAsync();
        foreach (var sr in seatedReservations)
        {
            sr.Status = "COMPLETED";
            sr.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return Ok(ApiResponse.Ok(table, $"Table {table.TableNumber} released and is now Available."));
    }

    [HttpPost("api/restaurant/tables")]
    [HttpPost("api/tables")]
    public async Task<IActionResult> CreateTable([FromBody] RestaurantTable table)
    {
        if (string.IsNullOrWhiteSpace(table.TableNumber))
        {
            return BadRequest(ApiResponse.Fail("Table number is required."));
        }

        if (string.IsNullOrEmpty(table.HotelId))
        {
            var hotel = await _db.Hotels.FirstOrDefaultAsync();
            table.HotelId = hotel?.Id ?? Guid.NewGuid().ToString("N");
        }

        _db.RestaurantTables.Add(table);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(table, "Table created successfully."));
    }

    public record UpdateTableStatusRequest(
        string? Status,
        string? CleaningStatus,
        string? MaintenanceNotes
    );

    [HttpPatch("api/restaurant/tables/{id}/status")]
    public async Task<IActionResult> UpdateTableStatus(string id, [FromBody] UpdateTableStatusRequest req)
    {
        var table = await _db.RestaurantTables.FindAsync(id);
        if (table == null)
        {
            return NotFound(ApiResponse.Fail($"Table '{id}' not found."));
        }

        // Rule: Do not mark an occupied table clean or disrupt its active order
        if (!string.IsNullOrWhiteSpace(req.CleaningStatus))
        {
            var cleanReq = req.CleaningStatus.Trim().ToUpper();
            if (cleanReq == "CLEAN" && table.Status == "OCCUPIED")
            {
                return BadRequest(ApiResponse.Fail("Cannot mark an occupied table clean while guests are dining."));
            }
            table.CleaningStatus = cleanReq;
        }

        if (!string.IsNullOrWhiteSpace(req.Status))
        {
            var newStatus = req.Status.Trim().ToUpper();
            if (newStatus == "OUT_OF_SERVICE")
            {
                // Rule: Preserves actual cleaning status
                table.Status = "OUT_OF_SERVICE";
                if (!string.IsNullOrWhiteSpace(req.MaintenanceNotes))
                {
                    table.MaintenanceNotes = req.MaintenanceNotes;
                }
            }
            else if (newStatus == "AVAILABLE" || newStatus == "FREE")
            {
                // Returning table to service must preserve its actual cleaning status
                table.Status = "FREE";
            }
            else
            {
                table.Status = newStatus;
            }
        }

        if (req.MaintenanceNotes != null)
        {
            table.MaintenanceNotes = req.MaintenanceNotes;
        }

        await _db.SaveChangesAsync();
        return Ok(ApiResponse.Ok(table, $"Table {table.TableNumber} status updated."));
    }

    [HttpPost("api/restaurant/tables/{id}/mark-served")]
    public async Task<IActionResult> MarkTableServed(string id)
    {
        var orders = await _db.RestaurantOrders
            .Include(o => o.Items)
            .Where(o => o.TableId == id && o.Status != "COMPLETED" && o.Status != "CANCELLED")
            .ToListAsync();

        if (orders.Count == 0)
        {
            return BadRequest(ApiResponse.Fail("No active uncompleted order found on this table."));
        }

        foreach (var ord in orders)
        {
            ord.Status = "SERVED";
            ord.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return Ok(ApiResponse.Ok(orders, "All active items on table marked as SERVED."));
    }

    [HttpGet("api/restaurant/tables/{id}/history")]
    public async Task<IActionResult> GetTableOrderHistory(string id)
    {
        var orders = await _db.RestaurantOrders
            .Include(o => o.Items)
            .Where(o => o.TableId == id)
            .OrderByDescending(o => o.CreatedAt)
            .Take(10)
            .ToListAsync();

        return Ok(ApiResponse.Ok(orders));
    }

    // =========================================================================
    // RESTAURANT SETTINGS & WALK-IN SEATING LOGIC
    // =========================================================================

    public record SeatWalkInRequest(
        string? CustomerName,
        string? PhoneNumber,
        int? PartySize,
        string? ServerName,
        string? Notes,
        int? EstimatedDiningMinutes,
        int? CleaningBufferMinutes,
        string? SimulatedTime,
        string? Date
    );

    public record RestaurantSettingsDto(
        int EstimatedDiningMinutes = 90,
        int CleaningBufferMinutes = 15,
        int AdvanceAlertMinutes = 15
    );

    private static RestaurantSettingsDto _restaurantSettings = new(
        EstimatedDiningMinutes: 90,
        CleaningBufferMinutes: 15,
        AdvanceAlertMinutes: 15
    );

    [HttpGet("api/restaurant/settings")]
    public IActionResult GetRestaurantSettings()
    {
        return Ok(ApiResponse.Ok(_restaurantSettings));
    }

    [HttpPost("api/restaurant/settings")]
    [HttpPut("api/restaurant/settings")]
    public IActionResult UpdateRestaurantSettings([FromBody] RestaurantSettingsDto req)
    {
        var dining = req.EstimatedDiningMinutes > 0 ? req.EstimatedDiningMinutes : 90;
        var buffer = req.CleaningBufferMinutes >= 0 ? req.CleaningBufferMinutes : 15;
        var alert = req.AdvanceAlertMinutes > 0 ? req.AdvanceAlertMinutes : 15;

        _restaurantSettings = new RestaurantSettingsDto(dining, buffer, alert);
        return Ok(ApiResponse.Ok(_restaurantSettings, "Restaurant settings updated successfully."));
    }

    private async Task<(bool CanSeat, string? Warning, TableReservation? NextRes, int MinutesUntilRes, int RequiredMinutes)> ValidateWalkInSeatingAsync(
        RestaurantTable table,
        int? customDiningMinutes = null,
        int? customBufferMinutes = null,
        string? simulatedTimeStr = null,
        string? dateStr = null)
    {
        if (table.Status == "OUT_OF_SERVICE" || table.Status == "MAINTENANCE")
        {
            return (false, $"Table {table.TableNumber} is out of service and cannot seat customers.", null, 0, 0);
        }

        if (table.Status == "OCCUPIED")
        {
            return (false, $"Table {table.TableNumber} is currently occupied by active diners.", null, 0, 0);
        }

        var isDirty = (table.CleaningStatus ?? "").Trim().ToUpper() == "DIRTY";
        if (isDirty)
        {
            return (false, $"Table {table.TableNumber} is dirty. Please clean and prepare the table before seating new customers.", null, 0, 0);
        }

        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelTz = TableReservationAlertService.ResolveTimeZone(hotel?.Timezone);
        var nowHotelLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, hotelTz);
        var targetDate = nowHotelLocal.Date;

        if (!string.IsNullOrWhiteSpace(dateStr) && DateTime.TryParse(dateStr, out var parsedDate))
        {
            targetDate = parsedDate.Date;
        }

        if (!string.IsNullOrWhiteSpace(simulatedTimeStr) && TimeSpan.TryParse(simulatedTimeStr, out var simTs))
        {
            nowHotelLocal = targetDate.Add(simTs);
        }
        else if (targetDate != nowHotelLocal.Date)
        {
            nowHotelLocal = targetDate.Add(nowHotelLocal.TimeOfDay);
        }

        var nowUtc = TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(nowHotelLocal, DateTimeKind.Unspecified), hotelTz);

        var targetDateUtc = DateTime.SpecifyKind(targetDate, DateTimeKind.Utc);
        var endDateUtc = targetDateUtc.AddDays(2);

        var activeReservations = await _db.TableReservations
            .Where(r => r.TableId == table.Id &&
                        r.ReservationDate >= targetDateUtc &&
                        r.ReservationDate < endDateUtc &&
                        r.Status != "CANCELLED" &&
                        r.Status != "NO_SHOW" &&
                        r.Status != "COMPLETED")
            .OrderBy(r => r.ReservationDate)
            .ThenBy(r => r.ReservationTime)
            .ToListAsync();

        var diningMins = customDiningMinutes ?? _restaurantSettings.EstimatedDiningMinutes;
        var bufferMins = customBufferMinutes ?? _restaurantSettings.CleaningBufferMinutes;
        var requiredMins = diningMins + bufferMins;

        TableReservation? nextRes = null;
        int minutesUntilNext = int.MaxValue;

        foreach (var res in activeReservations)
        {
            var resStartUtc = TableReservationAlertService.GetReservationUtc(res.ReservationDate, res.ReservationTime, hotelTz);
            if (resStartUtc > nowUtc)
            {
                var diffMins = (int)(resStartUtc - nowUtc).TotalMinutes;
                if (diffMins < minutesUntilNext)
                {
                    minutesUntilNext = diffMins;
                    nextRes = res;
                }
            }
            else
            {
                var resEndUtc = resStartUtc.AddMinutes(res.DurationMinutes > 0 ? res.DurationMinutes : 120);
                if (nowUtc < resEndUtc)
                {
                    var cStart = FormatTime12h(res.ReservationTime);
                    return (false, $"This table is currently reserved for {res.CustomerName} ({cStart}). Walk-in customers cannot be seated during an active reservation slot.", res, 0, requiredMins);
                }
            }
        }

        if (nextRes != null)
        {
            if (minutesUntilNext < requiredMins)
            {
                var cStart = FormatTime12h(nextRes.ReservationTime);
                return (false, $"This table is reserved at {cStart}. Choose another table because there may not be enough time to finish service and prepare it.", nextRes, minutesUntilNext, requiredMins);
            }
        }

        return (true, null, nextRes, nextRes != null ? minutesUntilNext : 0, requiredMins);
    }

    [HttpGet("api/restaurant/tables/{id}/walkin-check")]
    public async Task<IActionResult> CheckWalkInAvailability(
        string id,
        [FromQuery] int? estimatedDiningMinutes,
        [FromQuery] int? diningMinutes,
        [FromQuery] int? cleaningBufferMinutes,
        [FromQuery] int? bufferMinutes,
        [FromQuery] string? simulatedTime,
        [FromQuery] string? date)
    {
        var table = await _db.RestaurantTables.FindAsync(id);
        if (table == null)
        {
            return NotFound(ApiResponse.Fail($"Table '{id}' not found."));
        }

        var dMins = estimatedDiningMinutes ?? diningMinutes;
        var bMins = cleaningBufferMinutes ?? bufferMinutes;
        var validation = await ValidateWalkInSeatingAsync(table, dMins, bMins, simulatedTime, date);

        return Ok(ApiResponse.Ok(new
        {
            TableId = table.Id,
            table.TableNumber,
            table.Capacity,
            PhysicalStatus = table.Status,
            table.CleaningStatus,
            IsAllowed = validation.CanSeat,
            CanSeat = validation.CanSeat,
            Warning = validation.Warning,
            NextReservation = validation.NextRes != null ? new
            {
                validation.NextRes.Id,
                validation.NextRes.ReservationCode,
                validation.NextRes.CustomerName,
                StartTime = FormatTime12h(validation.NextRes.ReservationTime),
                validation.NextRes.ReservationTime,
                validation.NextRes.PartySize,
                MinutesUntil = validation.MinutesUntilRes
            } : null,
            EstimatedMinutes = dMins ?? _restaurantSettings.EstimatedDiningMinutes,
            BufferMinutes = bMins ?? _restaurantSettings.CleaningBufferMinutes,
            RequiredMinutes = validation.RequiredMinutes,
            RemainingMinutes = validation.NextRes != null ? validation.MinutesUntilRes : (int?)null,
            MinutesUntilReservation = validation.NextRes != null ? validation.MinutesUntilRes : (int?)null
        }));
    }

    [HttpPost("api/restaurant/tables/{id}/seat-walkin")]
    public async Task<IActionResult> SeatWalkIn(string id, [FromBody] SeatWalkInRequest? req)
    {
        var table = await _db.RestaurantTables.FindAsync(id);
        if (table == null)
        {
            return NotFound(ApiResponse.Fail($"Table '{id}' not found."));
        }

        var validation = await ValidateWalkInSeatingAsync(
            table,
            req?.EstimatedDiningMinutes,
            req?.CleaningBufferMinutes,
            req?.SimulatedTime,
            req?.Date
        );

        if (!validation.CanSeat)
        {
            return BadRequest(ApiResponse.Fail(validation.Warning ?? "Table is not available for walk-in seating."));
        }

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            table.Status = "OCCUPIED";

            var hotel = await _db.Hotels.FirstOrDefaultAsync();
            var hotelId = hotel?.Id ?? Guid.NewGuid().ToString("N");

            var countOrders = await _db.RestaurantOrders.CountAsync();
            var orderNum = await GenerateUniqueOrderNumberAsync();
            var kotNum = await GenerateUniqueKitchenTicketAsync();

            var customerName = !string.IsNullOrWhiteSpace(req?.CustomerName)
                ? req.CustomerName.Trim()
                : "Walk-in Customer";

            var order = new RestaurantOrder
            {
                HotelId = hotelId,
                TableId = table.Id,
                OrderNumber = orderNum,
                KotNumber = kotNum,
                Outlet = "RESTAURANT",
                OrderType = "DINE_IN",
                ServerName = req?.ServerName ?? "Waiter",
                Status = "RECEIVED",
                Notes = string.IsNullOrWhiteSpace(req?.Notes)
                    ? customerName
                    : $"{customerName} | {req.Notes}".Trim(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.RestaurantOrders.Add(order);
            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(ApiResponse.Ok(new
            {
                Table = table,
                Order = order,
                NextReservation = validation.NextRes != null ? new
                {
                    StartTime = FormatTime12h(validation.NextRes.ReservationTime),
                    validation.NextRes.CustomerName,
                    validation.NextRes.PartySize,
                    MinutesRemaining = validation.MinutesUntilRes
                } : null,
                Message = $"Walk-in customer seated at Table {table.TableNumber}." +
                          (validation.NextRes != null ? $" Table reserved at {FormatTime12h(validation.NextRes.ReservationTime)} ({validation.MinutesUntilRes} mins remaining)." : "")
            }));
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, ApiResponse.Fail($"Failed to seat walk-in: {ex.Message}"));
        }
    }

    // =========================================================================
    // TABLE RESERVATIONS (AVAILABILITY, BOOKING, SEATING & CONCURRENCY)
    // =========================================================================

    public record CreateTableReservationRequest(
        string CustomerName,
        string PhoneNumber,
        DateTime ReservationDate,
        string? ReservationTime,
        string? EndTime,
        int? PartySize,
        int? DurationMinutes,
        int? BufferMinutes,
        string? TableId,
        string? SpecialRequests,
        string? InternalNotes,
        string? Status
    );

    public record UpdateTableReservationRequest(
        string? CustomerName,
        string? PhoneNumber,
        DateTime? ReservationDate,
        string? ReservationTime,
        string? EndTime,
        int? PartySize,
        int? DurationMinutes,
        int? BufferMinutes,
        string? TableId,
        string? SpecialRequests,
        string? InternalNotes,
        string? Status
    );

    public record UpdateReservationStatusRequest(
        string Status,
        string? Notes
    );

    public record SeatGuestsRequest(
        string? TableId,
        string? ServerName
    );

    private static string CalculateEndTime(string timeStr, int durationMinutes)
    {
        if (TimeSpan.TryParse(timeStr, out var ts))
        {
            var endTs = ts.Add(TimeSpan.FromMinutes(durationMinutes > 0 ? durationMinutes : 120));
            var hours = (int)endTs.TotalHours % 24;
            var mins = endTs.Minutes;
            return $"{hours:D2}:{mins:D2}";
        }
        return timeStr;
    }

    private static string FormatTime12h(string timeStr)
    {
        if (string.IsNullOrWhiteSpace(timeStr)) return "";
        var parts = timeStr.Split(':');
        if (int.TryParse(parts[0], out var hours))
        {
            var mins = parts.Length > 1 ? parts[1] : "00";
            var ampm = hours >= 12 ? "PM" : "AM";
            var h12 = hours % 12;
            if (h12 == 0) h12 = 12;
            return $"{h12}:{mins} {ampm}";
        }
        return timeStr;
    }

    private static DateTime ParseReservationDateTime(DateTime date, string timeStr, TimeZoneInfo? hotelTz = null)
    {
        if (hotelTz != null)
        {
            return TableReservationAlertService.GetReservationUtc(date, timeStr, hotelTz);
        }
        var baseDate = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
        if (TimeSpan.TryParse(timeStr, out var ts))
        {
            return baseDate.Add(ts);
        }
        if (DateTime.TryParse(timeStr, out var parsedDt))
        {
            return baseDate.Add(parsedDt.TimeOfDay);
        }
        return baseDate.AddHours(19);
    }

    private static bool ReservationsOverlap(DateTime startA, int durationA, DateTime startB, int durationB, int bufferMinutes = 15)
    {
        var durA = durationA > 0 ? durationA : 120;
        var durB = durationB > 0 ? durationB : 120;
        var endA = startA.AddMinutes(durA + bufferMinutes);
        var endB = startB.AddMinutes(durB + bufferMinutes);
        return startA < endB && endA > startB;
    }

    [HttpGet("api/restaurant/reservations")]
    public async Task<IActionResult> GetTableReservations(
        [FromQuery] DateTime? date,
        [FromQuery] string? status,
        [FromQuery] string? tableId,
        [FromQuery] string? search)
    {
        var query = _db.TableReservations
            .Include(r => r.Table)
            .Include(r => r.Guest)
            .AsQueryable();

        if (date.HasValue)
        {
            var targetUtcDate = DateTime.SpecifyKind(date.Value.Date, DateTimeKind.Utc);
            query = query.Where(r => r.ReservationDate.Date == targetUtcDate.Date);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            var statuses = status.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                                 .Select(s => s.ToUpper())
                                 .ToList();
            if (statuses.Count == 1)
            {
                query = query.Where(r => r.Status.ToUpper() == statuses[0]);
            }
            else if (statuses.Count > 1)
            {
                query = query.Where(r => statuses.Contains(r.Status.ToUpper()));
            }
        }

        if (!string.IsNullOrWhiteSpace(tableId))
        {
            query = query.Where(r => r.TableId == tableId);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(r => r.CustomerName.ToLower().Contains(s) || r.PhoneNumber.Contains(s) || r.ReservationCode.ToLower().Contains(s));
        }

        var reservations = await query
            .OrderBy(r => r.ReservationDate)
            .ThenBy(r => r.ReservationTime)
            .ToListAsync();

        return Ok(ApiResponse.Ok(reservations));
    }

    [HttpGet("api/restaurant/reservations/{id}")]
    public async Task<IActionResult> GetTableReservation(string id)
    {
        var res = await _db.TableReservations
            .Include(r => r.Table)
            .Include(r => r.Guest)
            .FirstOrDefaultAsync(r => r.Id == id || r.ReservationCode == id);

        if (res == null)
        {
            return NotFound(ApiResponse.Fail($"Table reservation '{id}' not found."));
        }

        return Ok(ApiResponse.Ok(res));
    }

    [HttpGet("api/restaurant/reservations/available-tables")]
    public async Task<IActionResult> GetAvailableTables(
        [FromQuery] DateTime? date,
        [FromQuery] string? time,
        [FromQuery] string? endTime,
        [FromQuery] int? partySize,
        [FromQuery] int? durationMinutes,
        [FromQuery] int? bufferMinutes,
        [FromQuery] string? excludeReservationId)
    {
        var hotel = await _db.Hotels.AsNoTracking().FirstOrDefaultAsync();
        var hotelTz = TableReservationAlertService.ResolveTimeZone(hotel?.Timezone);
        var nowHotelLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, hotelTz);

        var targetDate = date.HasValue ? DateTime.SpecifyKind(date.Value.Date, DateTimeKind.Utc) : DateTime.SpecifyKind(nowHotelLocal.Date, DateTimeKind.Utc);
        var timeStr = string.IsNullOrWhiteSpace(time) ? "19:00" : time.Trim();
        var guests = partySize ?? 2;
        var buffer = bufferMinutes ?? 15;
        var duration = durationMinutes ?? 120;

        if (!string.IsNullOrWhiteSpace(endTime))
        {
            if (TimeSpan.TryParse(timeStr, out var startTs) && TimeSpan.TryParse(endTime, out var endTs))
            {
                if (endTs <= startTs)
                {
                    return BadRequest(ApiResponse.Fail("End time must be later than start time."));
                }
                duration = (int)(endTs - startTs).TotalMinutes;
            }
        }

        var targetStart = ParseReservationDateTime(targetDate, timeStr, hotelTz);
        var targetEnd = targetStart.AddMinutes(duration);

        var allTables = await _db.RestaurantTables
            .Include(t => t.Orders.Where(o => o.Status != "COMPLETED" && o.Status != "CANCELLED"))
            .OrderBy(t => t.TableNumber)
            .ToListAsync();

        var query = _db.TableReservations
            .Where(r => r.Status != "CANCELLED" && r.Status != "NO_SHOW" && r.Status != "COMPLETED");

        if (!string.IsNullOrWhiteSpace(excludeReservationId))
        {
            query = query.Where(r => r.Id != excludeReservationId);
        }

        var activeReservations = await query.ToListAsync();

        var nowUtc = DateTime.UtcNow;
        var isForTodayNearNow = Math.Abs((targetStart - nowUtc).TotalHours) < 3;

        var results = allTables.Select(table =>
        {
            var capacityFits = table.Capacity >= guests;
            
            // Check overlapping reservations on this table
            var tableReservations = activeReservations
                .Where(r => r.TableId == table.Id && r.ReservationDate.Date == targetDate.Date)
                .ToList();

            TableReservation? conflictingRes = null;
            foreach (var r in tableReservations)
            {
                var rStart = ParseReservationDateTime(r.ReservationDate, r.ReservationTime, hotelTz);
                if (ReservationsOverlap(targetStart, duration, rStart, r.DurationMinutes, buffer))
                {
                    conflictingRes = r;
                    break;
                }
            }

            var isCurrentlyOccupied = isForTodayNearNow && (table.Status == "OCCUPIED" || table.Orders.Any());

            var isAvailable = capacityFits && conflictingRes == null && !isCurrentlyOccupied;

            string? conflictReason = null;
            if (!capacityFits)
            {
                conflictReason = $"Capacity too small ({table.Capacity} seats for {guests} guests)";
            }
            else if (conflictingRes != null)
            {
                var cStart = FormatTime12h(conflictingRes.ReservationTime);
                var cEnd = FormatTime12h(CalculateEndTime(conflictingRes.ReservationTime, conflictingRes.DurationMinutes));
                conflictReason = $"Time slot unavailable. This table is already booked from {cStart} to {cEnd}. Choose another time or table.";
            }
            else if (isCurrentlyOccupied)
            {
                conflictReason = "Table is currently occupied by active diners";
            }

            return new
            {
                table.Id,
                table.TableNumber,
                table.Section,
                table.Capacity,
                table.Status,
                IsAvailable = isAvailable,
                CapacityFits = capacityFits,
                ConflictReason = conflictReason,
                ConflictingReservation = conflictingRes != null ? new
                {
                    conflictingRes.Id,
                    conflictingRes.ReservationCode,
                    StartTime = FormatTime12h(conflictingRes.ReservationTime),
                    EndTime = FormatTime12h(CalculateEndTime(conflictingRes.ReservationTime, conflictingRes.DurationMinutes)),
                    conflictingRes.ReservationTime,
                    conflictingRes.DurationMinutes,
                    BufferMinutes = buffer
                } : null
            };
        }).ToList();

        var availableTables = results.Where(t => t.IsAvailable).ToList();

        return Ok(ApiResponse.Ok(new
        {
            RequestedDate = targetDate.ToString("yyyy-MM-dd"),
            RequestedTime = timeStr,
            RequestedEndTime = CalculateEndTime(timeStr, duration),
            PartySize = guests,
            DurationMinutes = duration,
            BufferMinutes = buffer,
            AvailableCount = availableTables.Count,
            TotalTables = results.Count,
            AvailableTables = availableTables,
            AllTables = results
        }));
    }

    [HttpPost("api/restaurant/reservations")]
    public async Task<IActionResult> CreateTableReservation([FromBody] CreateTableReservationRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.CustomerName))
        {
            return BadRequest(ApiResponse.Fail("Customer name is required for reservations."));
        }

        if (string.IsNullOrWhiteSpace(req.PhoneNumber))
        {
            return BadRequest(ApiResponse.Fail("Phone number is required for reservations."));
        }

        var timeStr = string.IsNullOrWhiteSpace(req.ReservationTime) ? "19:00" : req.ReservationTime.Trim();
        var buffer = req.BufferMinutes ?? 15;
        var duration = req.DurationMinutes.HasValue && req.DurationMinutes.Value > 0 ? req.DurationMinutes.Value : 120;

        if (!string.IsNullOrWhiteSpace(req.EndTime))
        {
            if (TimeSpan.TryParse(timeStr, out var startTs) && TimeSpan.TryParse(req.EndTime, out var endTs))
            {
                if (endTs <= startTs)
                {
                    return BadRequest(ApiResponse.Fail("End time must be later than start time."));
                }
                duration = (int)(endTs - startTs).TotalMinutes;
            }
        }

        var guests = req.PartySize.HasValue && req.PartySize.Value > 0 ? req.PartySize.Value : 2;
        var resDate = DateTime.SpecifyKind(req.ReservationDate.Date, DateTimeKind.Utc);
        
        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelTz = TableReservationAlertService.ResolveTimeZone(hotel?.Timezone);
        var targetStart = ParseReservationDateTime(resDate, timeStr, hotelTz);

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            RestaurantTable? table = null;
            if (!string.IsNullOrWhiteSpace(req.TableId))
            {
                table = await _db.RestaurantTables.FindAsync(req.TableId);
                if (table == null)
                {
                    await transaction.RollbackAsync();
                    return NotFound(ApiResponse.Fail($"Table '{req.TableId}' not found."));
                }

                // Prevent simultaneous booking requests on the same table from creating conflicting reservations
                try
                {
                    await _db.Database.ExecuteSqlRawAsync("SELECT pg_advisory_xact_lock(hashtext('table_res_' || {0}));", table.Id);
                }
                catch
                {
                    // If advisory locks not supported, transaction isolation applies
                }

                // Check for concurrent/overlapping active reservations on this table
                var activeResOnTable = await _db.TableReservations
                    .Where(r => r.TableId == table.Id &&
                                r.ReservationDate.Date == resDate.Date &&
                                r.Status != "CANCELLED" &&
                                r.Status != "NO_SHOW" &&
                                r.Status != "COMPLETED")
                    .ToListAsync();

                foreach (var existing in activeResOnTable)
                {
                    var exStart = ParseReservationDateTime(existing.ReservationDate, existing.ReservationTime, hotelTz);
                    if (ReservationsOverlap(targetStart, duration, exStart, existing.DurationMinutes, buffer))
                    {
                        await transaction.RollbackAsync();
                        var cStart = FormatTime12h(existing.ReservationTime);
                        var cEnd = FormatTime12h(CalculateEndTime(existing.ReservationTime, existing.DurationMinutes));
                        return Conflict(ApiResponse.Fail(
                            $"Time slot unavailable. This table is already booked from {cStart} to {cEnd}. Choose another time or table."));
                    }
                }
            }

            // Customer Linking: Reuse existing guest record if phone matches
            string? guestId = null;
            var cleanPhone = req.PhoneNumber.Trim();
            var existingGuest = await _db.Guests.FirstOrDefaultAsync(g => g.Phone == cleanPhone);
            if (existingGuest != null)
            {
                guestId = existingGuest.Id;
            }

            var hotelId = hotel?.Id ?? Guid.NewGuid().ToString("N");

            var count = await _db.TableReservations.CountAsync();
            var reservationCode = $"TR-{1001 + count}";

            var status = string.IsNullOrWhiteSpace(req.Status) ? "CONFIRMED" : req.Status.ToUpper().Trim();

            var reservation = new TableReservation
            {
                HotelId = hotelId,
                TableId = table?.Id,
                GuestId = guestId,
                CustomerName = req.CustomerName.Trim(),
                PhoneNumber = cleanPhone,
                ReservationDate = resDate,
                ReservationTime = timeStr,
                PartySize = guests,
                DurationMinutes = duration,
                Status = status,
                SpecialRequests = req.SpecialRequests,
                InternalNotes = req.InternalNotes,
                ReservationCode = reservationCode,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.TableReservations.Add(reservation);

            // Operational status remains separate: do NOT mutate physical table status to RESERVED.
            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            reservation.Table = table;
            reservation.Guest = existingGuest;

            return CreatedAtAction(nameof(GetTableReservation), new { id = reservation.Id }, ApiResponse.Ok(reservation, $"Reservation {reservationCode} created successfully."));
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, ApiResponse.Fail($"Failed to create reservation: {ex.Message}"));
        }
    }

    [HttpPut("api/restaurant/reservations/{id}")]
    public async Task<IActionResult> UpdateTableReservation(string id, [FromBody] UpdateTableReservationRequest req)
    {
        var res = await _db.TableReservations.FirstOrDefaultAsync(r => r.Id == id || r.ReservationCode == id);
        if (res == null)
        {
            return NotFound(ApiResponse.Fail($"Reservation '{id}' not found."));
        }

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var targetTableId = req.TableId ?? res.TableId;
            var targetDate = req.ReservationDate.HasValue 
                ? DateTime.SpecifyKind(req.ReservationDate.Value.Date, DateTimeKind.Utc) 
                : res.ReservationDate;
            var targetTime = !string.IsNullOrWhiteSpace(req.ReservationTime) ? req.ReservationTime.Trim() : res.ReservationTime;
            var targetDuration = req.DurationMinutes ?? res.DurationMinutes;
            var buffer = req.BufferMinutes ?? 15;

            if (!string.IsNullOrWhiteSpace(req.EndTime))
            {
                if (TimeSpan.TryParse(targetTime, out var startTs) && TimeSpan.TryParse(req.EndTime, out var endTs))
                {
                    if (endTs <= startTs)
                    {
                        await transaction.RollbackAsync();
                        return BadRequest(ApiResponse.Fail("End time must be later than start time."));
                    }
                    targetDuration = (int)(endTs - startTs).TotalMinutes;
                }
            }

            var hotel = await _db.Hotels.FirstOrDefaultAsync();
            var hotelTz = TableReservationAlertService.ResolveTimeZone(hotel?.Timezone);
            var targetStart = ParseReservationDateTime(targetDate, targetTime, hotelTz);

            if (!string.IsNullOrWhiteSpace(targetTableId))
            {
                var table = await _db.RestaurantTables.FindAsync(targetTableId);
                if (table == null)
                {
                    await transaction.RollbackAsync();
                    return NotFound(ApiResponse.Fail($"Table '{targetTableId}' not found."));
                }

                // Prevent simultaneous booking requests on the same table from creating conflicting reservations
                try
                {
                    await _db.Database.ExecuteSqlRawAsync("SELECT pg_advisory_xact_lock(hashtext('table_res_' || {0}));", table.Id);
                }
                catch
                {
                    // Fallback
                }

                // Check conflict against other active reservations on this table
                var activeResOnTable = await _db.TableReservations
                    .Where(r => r.Id != res.Id &&
                                r.TableId == targetTableId &&
                                r.ReservationDate.Date == targetDate.Date &&
                                r.Status != "CANCELLED" &&
                                r.Status != "NO_SHOW" &&
                                r.Status != "COMPLETED")
                    .ToListAsync();

                foreach (var existing in activeResOnTable)
                {
                    var exStart = ParseReservationDateTime(existing.ReservationDate, existing.ReservationTime, hotelTz);
                    if (ReservationsOverlap(targetStart, targetDuration, exStart, existing.DurationMinutes, buffer))
                    {
                        await transaction.RollbackAsync();
                        var cStart = FormatTime12h(existing.ReservationTime);
                        var cEnd = FormatTime12h(CalculateEndTime(existing.ReservationTime, existing.DurationMinutes));
                        return Conflict(ApiResponse.Fail(
                            $"Time slot unavailable. This table is already booked from {cStart} to {cEnd}. Choose another time or table."));
                    }
                }

                res.TableId = targetTableId;
            }
            else
            {
                res.TableId = null;
            }

            if (!string.IsNullOrWhiteSpace(req.CustomerName)) res.CustomerName = req.CustomerName.Trim();
            if (!string.IsNullOrWhiteSpace(req.PhoneNumber)) res.PhoneNumber = req.PhoneNumber.Trim();
            if (req.ReservationDate.HasValue) res.ReservationDate = targetDate;
            if (!string.IsNullOrWhiteSpace(req.ReservationTime)) res.ReservationTime = targetTime.Trim();
            if (req.PartySize.HasValue && req.PartySize.Value > 0) res.PartySize = req.PartySize.Value;
            if (req.DurationMinutes.HasValue && req.DurationMinutes.Value > 0) res.DurationMinutes = req.DurationMinutes.Value;
            if (req.SpecialRequests != null) res.SpecialRequests = req.SpecialRequests;
            if (req.InternalNotes != null) res.InternalNotes = req.InternalNotes;
            if (!string.IsNullOrWhiteSpace(req.Status)) res.Status = req.Status.ToUpper().Trim();

            // Cancel any active alerts if reservation was rescheduled or cancelled
            var activeAlertsToCancel = await _db.ReservationAlerts
                .Where(a => a.ReservationId == res.Id && a.Status == "ACTIVE")
                .ToListAsync();
            foreach (var a in activeAlertsToCancel)
            {
                a.Status = "CANCELLED";
                a.UpdatedAt = DateTime.UtcNow;
            }

            res.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(ApiResponse.Ok(res, $"Reservation {res.ReservationCode} updated successfully."));
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, ApiResponse.Fail($"Failed to update reservation: {ex.Message}"));
        }
    }

    [HttpPatch("api/restaurant/reservations/{id}/status")]
    public async Task<IActionResult> UpdateReservationStatus(string id, [FromBody] UpdateReservationStatusRequest req)
    {
        var res = await _db.TableReservations.FirstOrDefaultAsync(r => r.Id == id || r.ReservationCode == id);
        if (res == null)
        {
            return NotFound(ApiResponse.Fail($"Reservation '{id}' not found."));
        }

        var newStatus = req.Status.ToUpper().Trim();
        res.Status = newStatus;
        res.UpdatedAt = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(req.Notes))
        {
            res.InternalNotes = string.IsNullOrWhiteSpace(res.InternalNotes)
                ? req.Notes
                : $"{res.InternalNotes} | {req.Notes}";
        }

        // Cancel pending alerts if reservation is cancelled, no-show, or completed
        if (newStatus == "CANCELLED" || newStatus == "NO_SHOW" || newStatus == "COMPLETED")
        {
            var activeAlerts = await _db.ReservationAlerts
                .Where(a => a.ReservationId == res.Id && a.Status == "ACTIVE")
                .ToListAsync();
            foreach (var a in activeAlerts)
            {
                a.Status = "CANCELLED";
                a.UpdatedAt = DateTime.UtcNow;
            }
        }

        // Release or reserve table based on reservation status change
        if (!string.IsNullOrWhiteSpace(res.TableId))
        {
            var table = await _db.RestaurantTables.FindAsync(res.TableId);
            if (table != null)
            {
                if (newStatus == "CANCELLED" || newStatus == "NO_SHOW" || newStatus == "COMPLETED")
                {
                    var hasActiveOrder = await _db.RestaurantOrders
                        .AnyAsync(o => o.TableId == table.Id && o.Status != "COMPLETED" && o.Status != "CANCELLED");

                    if (!hasActiveOrder && table.Status == "RESERVED")
                    {
                        table.Status = "FREE";
                    }
                }
            }
        }

        await _db.SaveChangesAsync();
        return Ok(ApiResponse.Ok(res, $"Reservation {res.ReservationCode} status updated to {newStatus}."));
    }

    [HttpPost("api/restaurant/reservations/{id}/seat")]
    public async Task<IActionResult> SeatGuests(string id, [FromBody] SeatGuestsRequest? req)
    {
        var res = await _db.TableReservations
            .Include(r => r.Table)
            .Include(r => r.Guest)
            .FirstOrDefaultAsync(r => r.Id == id || r.ReservationCode == id);

        if (res == null)
        {
            return NotFound(ApiResponse.Fail($"Reservation '{id}' not found."));
        }

        if (res.Status == "COMPLETED" || res.Status == "CANCELLED")
        {
            return BadRequest(ApiResponse.Fail($"Cannot seat reservation '{res.ReservationCode}' with status {res.Status}."));
        }

        var targetTableId = req?.TableId ?? res.TableId;
        if (string.IsNullOrWhiteSpace(targetTableId))
        {
            return BadRequest(ApiResponse.Fail("Please select an available table to seat the guests."));
        }

        var table = await _db.RestaurantTables.FindAsync(targetTableId);
        if (table == null)
        {
            return NotFound(ApiResponse.Fail($"Table '{targetTableId}' not found."));
        }

        // Check if table is already occupied by another active order
        var existingActiveOrder = await _db.RestaurantOrders
            .FirstOrDefaultAsync(o => o.TableId == table.Id && o.Status != "COMPLETED" && o.Status != "CANCELLED");

        if (existingActiveOrder != null && existingActiveOrder.ReservationId != res.Id)
        {
            return BadRequest(ApiResponse.Fail($"Table {table.TableNumber} is currently occupied by active order #{existingActiveOrder.OrderNumber}. Please assign another available table."));
        }

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            // 1. Mark table as occupied
            table.Status = "OCCUPIED";

            // 2. Update reservation
            res.TableId = table.Id;
            res.Status = "SEATED";
            res.UpdatedAt = DateTime.UtcNow;

            // 3. Link or create restaurant order
            RestaurantOrder? order = existingActiveOrder;
            if (order == null)
            {
                var countOrders = await _db.RestaurantOrders.CountAsync();
                var orderNum = $"ORD-{101 + countOrders}";
                var kotNum = $"KOT-{201 + countOrders}";

                order = new RestaurantOrder
                {
                    HotelId = res.HotelId,
                    TableId = table.Id,
                    GuestId = res.GuestId,
                    ReservationId = res.Id,
                    OrderNumber = orderNum,
                    KotNumber = kotNum,
                    Outlet = "RESTAURANT",
                    OrderType = "DINE_IN",
                    ServerName = req?.ServerName ?? "Waiter",
                    Status = "RECEIVED",
                    Notes = $"Reservation {res.ReservationCode} - {res.CustomerName} ({res.PartySize} guests). {(string.IsNullOrWhiteSpace(res.SpecialRequests) ? "" : "Special: " + res.SpecialRequests)}".Trim(),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _db.RestaurantOrders.Add(order);
                await _db.SaveChangesAsync();
            }
            else
            {
                order.ReservationId = res.Id;
                if (!string.IsNullOrWhiteSpace(res.CustomerName))
                {
                    order.Notes = $"Reservation {res.ReservationCode} - {res.CustomerName}. {order.Notes}".Trim();
                }
            }

            res.OrderId = order.Id;

            // Acknowledge any active table preparation or overdue alerts
            var activeAlerts = await _db.ReservationAlerts
                .Where(a => a.ReservationId == res.Id && a.Status == "ACTIVE")
                .ToListAsync();
            foreach (var a in activeAlerts)
            {
                a.Status = "ACKNOWLEDGED";
                a.IsRead = true;
                a.AcknowledgedBy = !string.IsNullOrWhiteSpace(req?.ServerName) ? req.ServerName : "Staff (Seated)";
                a.AcknowledgedAt = DateTime.UtcNow;
                a.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(ApiResponse.Ok(new
            {
                Reservation = res,
                Table = table,
                Order = order,
                Message = $"Guests seated at Table {table.TableNumber}. Order #{order.OrderNumber} created and linked."
            }));
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, ApiResponse.Fail($"Failed to seat guests: {ex.Message}"));
        }
    }

    // =========================================================================
    // QUICK SALE / COUNTER SALE FEATURE
    // =========================================================================

    public record QuickSaleItemDto(
        string? ProductId,
        string? ProductName,
        double UnitPrice,
        int Quantity,
        string? Notes,
        string? Department = "KOT",
        string? Unit = null
    );

    public record QuickSaleRequest(
        List<QuickSaleItemDto> Items,
        string? PaymentMethod, // CASH, CARD, UPI, QR
        double? PaidAmount,
        double? DiscountPercent,
        double? DiscountAmount,
        double? Tax,
        double? ServiceCharge,
        string? ServerName,
        string? CustomerName,
        string? CustomerPhone,
        string? Notes,
        bool? SendToKitchen,
        string? Outlet
    );

    [HttpPost("api/restaurant/quick-sale")]
    public async Task<IActionResult> ProcessQuickSale([FromBody] QuickSaleRequest req)
    {
        if (req.Items == null || req.Items.Count == 0)
        {
            return BadRequest(ApiResponse.Fail("Quick sale must contain at least one item."));
        }

        foreach (var item in req.Items)
        {
            if (item.Quantity <= 0)
            {
                return BadRequest(ApiResponse.Fail($"Invalid quantity ({item.Quantity}) for item '{item.ProductName}'."));
            }
            if (item.UnitPrice < 0)
            {
                return BadRequest(ApiResponse.Fail($"Price cannot be negative for item '{item.ProductName}'."));
            }
        }

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            // 1. Stock Tracking & Validation for Tracked Items (Requirement 6)
            foreach (var item in req.Items)
            {
                POSProduct? product = null;
                if (!string.IsNullOrWhiteSpace(item.ProductId))
                {
                    product = await _db.POSProducts.FirstOrDefaultAsync(p => p.Id == item.ProductId);
                }
                if (product == null && !string.IsNullOrWhiteSpace(item.ProductName))
                {
                    var cleanName = item.ProductName.Trim().ToLower();
                    product = await _db.POSProducts.FirstOrDefaultAsync(p => p.Name.ToLower() == cleanName);
                }

                if (product != null && product.TrackStock)
                {
                    if (!product.IsAvailable || product.Stock <= 0)
                    {
                        await transaction.RollbackAsync();
                        return BadRequest(ApiResponse.Fail($"Product '{product.Name}' is out of stock / unavailable."));
                    }

                    if (product.Stock < item.Quantity)
                    {
                        await transaction.RollbackAsync();
                        return BadRequest(ApiResponse.Fail($"Insufficient stock for '{product.Name}'. Available: {product.Stock}, Requested: {item.Quantity}."));
                    }

                    // Deduct stock once per sale
                    product.Stock -= item.Quantity;
                    if (product.Stock <= 0)
                    {
                        product.Stock = 0;
                        product.IsAvailable = false;
                    }

                    // Deduct matching Restaurant inventory item stock if linked
                    InventoryItem? invItem = null;
                    if (!string.IsNullOrWhiteSpace(product.InventoryItemId))
                    {
                        invItem = await _db.InventoryItems.FirstOrDefaultAsync(i => i.Id == product.InventoryItemId && i.Department == "RESTAURANT");
                    }
                    else
                    {
                        invItem = await _db.InventoryItems.FirstOrDefaultAsync(i => i.Department == "RESTAURANT" && (i.Name.ToLower() == product.Name.ToLower() || (!string.IsNullOrEmpty(i.Sku) && i.Sku.ToLower() == product.Name.ToLower())));
                    }

                    if (invItem != null && invItem.TrackStock)
                    {
                        invItem.CurrentStock = Math.Max(0, invItem.CurrentStock - item.Quantity);
                        invItem.LastRestocked = DateTime.UtcNow;
                        _db.StockMovements.Add(new StockMovement
                        {
                            ItemId = invItem.Id,
                            Department = "RESTAURANT",
                            Quantity = -item.Quantity,
                            Type = "POS_CONSUMPTION",
                            Reason = "Quick Sale POS deduction",
                            PerformedBy = req.ServerName ?? "POS Cashier",
                            CreatedAt = DateTime.UtcNow
                        });
                    }
                }
            }

            var hotel = await _db.Hotels.FirstOrDefaultAsync();
            var hotelId = hotel?.Id ?? Guid.NewGuid().ToString("N");

            // 2. Financial & Billing Calculations
            var subtotal = Math.Round(req.Items.Sum(i => i.UnitPrice * i.Quantity), 2);
            var discAmt = req.DiscountAmount ?? 0;
            if (!req.DiscountAmount.HasValue && req.DiscountPercent.HasValue && req.DiscountPercent.Value > 0)
            {
                discAmt = Math.Round((subtotal * req.DiscountPercent.Value) / 100.0, 2);
            }
            discAmt = Math.Min(subtotal, Math.Max(0, discAmt));

            var netAfterDiscount = Math.Max(0, subtotal - discAmt);
            var tax = req.Tax ?? Math.Round(netAfterDiscount * 0.10, 2);
            var service = req.ServiceCharge ?? 0.0;
            var total = Math.Round(netAfterDiscount + tax + service, 2);

            var pMethod = string.IsNullOrWhiteSpace(req.PaymentMethod) ? "CASH" : req.PaymentMethod.Trim().ToUpper();
            if (pMethod == "QR") pMethod = "UPI";

            var count = await _db.RestaurantOrders.CountAsync();
            var orderNumber = $"ORD-{2001 + count}";
            var sendToKitchen = req.SendToKitchen ?? false;
            var kotNumber = sendToKitchen ? $"KOT-{101 + count}" : "";
            var status = sendToKitchen ? "RECEIVED" : "COMPLETED";

            // Optional customer linkage (no account required)
            string? guestId = null;
            if (!string.IsNullOrWhiteSpace(req.CustomerPhone))
            {
                var cleanPhone = req.CustomerPhone.Trim();
                var existingGuest = await _db.Guests.FirstOrDefaultAsync(g => g.Phone == cleanPhone);
                if (existingGuest != null)
                {
                    guestId = existingGuest.Id;
                }
            }

            var notesBuilder = new List<string>();
            if (!string.IsNullOrWhiteSpace(req.CustomerName))
            {
                notesBuilder.Add($"Customer: {req.CustomerName.Trim()}");
            }
            if (!string.IsNullOrWhiteSpace(req.CustomerPhone))
            {
                notesBuilder.Add($"Phone: {req.CustomerPhone.Trim()}");
            }
            if (!string.IsNullOrWhiteSpace(req.Notes))
            {
                notesBuilder.Add(req.Notes.Trim());
            }

            var order = new RestaurantOrder
            {
                HotelId = hotelId,
                TableId = null, // Counter sale is separate from tables
                RoomId = null,
                GuestId = guestId,
                OrderNumber = orderNumber,
                KotNumber = kotNumber,
                Outlet = req.Outlet ?? "RESTAURANT",
                Status = status,
                OrderType = "COUNTER_SALE",
                ServerName = req.ServerName ?? "Cashier",
                Subtotal = subtotal,
                DiscountAmount = discAmt,
                DiscountPercent = req.DiscountPercent ?? (subtotal > 0 ? Math.Round((discAmt / subtotal) * 100, 1) : 0),
                Tax = tax,
                ServiceCharge = service,
                Total = total,
                PaymentMethod = pMethod,
                IsPaid = true,
                Notes = notesBuilder.Count > 0 ? string.Join(" | ", notesBuilder) : null,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            foreach (var item in req.Items)
            {
                order.Items.Add(new RestaurantOrderItem
                {
                    ProductId = item.ProductId ?? Guid.NewGuid().ToString("N"),
                    ProductName = item.ProductName ?? "Item",
                    UnitPrice = item.UnitPrice,
                    Quantity = item.Quantity,
                    Total = Math.Round(item.UnitPrice * item.Quantity, 2),
                    Notes = item.Notes,
                    Department = !string.IsNullOrWhiteSpace(item.Department) ? item.Department : "KOT",
                    DispatchedQuantity = sendToKitchen ? item.Quantity : 0,
                    KotNumber = sendToKitchen && item.Department != "BOT" ? kotNumber : null
                });
            }

            // 3. Shift Accounting: Update active CashRegister if open
            var activeRegister = await _db.CashRegisters
                .Where(r => r.Status == "OPEN")
                .OrderByDescending(r => r.OpenedAt)
                .FirstOrDefaultAsync();

            if (activeRegister != null)
            {
                if (pMethod == "CASH")
                {
                    activeRegister.CashSales += total;
                }
                else if (pMethod == "CARD" || pMethod == "UPI")
                {
                    activeRegister.CardSales += total;
                }
            }

            // Shared Billing System: Generate permanent unique Bill Number & record
            var billNo = await BillingController.GenerateBillNumberAsync(_db, hotelId);
            var quickBill = new Bill
            {
                HotelId = hotelId,
                BillNumber = billNo,
                BillingType = "QUICK_BILL",
                OrderId = order.Id,
                OrderNumber = order.OrderNumber,
                CustomerName = string.IsNullOrWhiteSpace(req.CustomerName) ? "Counter Guest" : req.CustomerName.Trim(),
                CustomerPhone = req.CustomerPhone,
                ServerOrStaff = req.ServerName ?? "Cashier",
                Subtotal = subtotal,
                DiscountAmount = discAmt,
                DiscountPercent = req.DiscountPercent ?? (subtotal > 0 ? Math.Round((discAmt / subtotal) * 100, 1) : 0),
                TaxAmount = tax,
                ServiceCharge = service,
                RoundOff = 0,
                GrandTotal = total,
                AmountPaid = total,
                BalanceDue = 0,
                PaymentStatus = "PAID",
                PaymentMethod = pMethod,
                ItemsJson = System.Text.Json.JsonSerializer.Serialize(req.Items.Select(i => new
                {
                    name = i.ProductName,
                    quantity = i.Quantity,
                    unitPrice = i.UnitPrice,
                    total = Math.Round(i.UnitPrice * i.Quantity, 2),
                    notes = i.Notes
                })),
                PaymentsJson = System.Text.Json.JsonSerializer.Serialize(new[]
                {
                    new { Id = $"PAY-{Guid.NewGuid():N}"[..12].ToUpper(), Amount = total, PaymentMethod = pMethod, PaymentDate = DateTime.UtcNow, ReceivedBy = req.ServerName ?? "Cashier", Notes = "Quick Sale Cashier Receipt" }
                }),
                Notes = order.Notes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.Bills.Add(quickBill);

            _db.RestaurantOrders.Add(order);
            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            var paidAmount = req.PaidAmount ?? total;
            var changeDue = Math.Max(0, paidAmount - total);

            return Ok(ApiResponse.Ok(new
            {
                order,
                bill = quickBill,
                receipt = new
                {
                    billNumber = quickBill.BillNumber,
                    orderNumber = order.OrderNumber,
                    kotNumber = order.KotNumber,
                    status = order.Status,
                    outlet = order.Outlet,
                    orderType = order.OrderType,
                    cashierName = order.ServerName,
                    customerName = req.CustomerName,
                    customerPhone = req.CustomerPhone,
                    items = order.Items.Select(i => new
                    {
                        productId = i.ProductId,
                        productName = i.ProductName,
                        unitPrice = i.UnitPrice,
                        quantity = i.Quantity,
                        total = i.Total,
                        notes = i.Notes
                    }),
                    subtotal,
                    discountAmount = discAmt,
                    discountPercent = order.DiscountPercent,
                    tax,
                    serviceCharge = service,
                    total,
                    paymentMethod = pMethod,
                    paidAmount,
                    changeDue,
                    timestamp = order.CreatedAt
                },
                message = $"Quick sale {order.OrderNumber} completed successfully via {pMethod}. Permanent Bill {quickBill.BillNumber} created."
            }));
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, ApiResponse.Fail($"Failed to process quick sale: {ex.Message}"));
        }
    }

    [HttpGet("api/restaurant/daily-sales")]
    public async Task<IActionResult> GetDailySales([FromQuery] string? date)
    {
        DateTime targetDate = DateTime.UtcNow.Date;
        if (!string.IsNullOrWhiteSpace(date) && DateTime.TryParse(date, out var parsed))
        {
            targetDate = parsed.Date;
        }

        var startOfDay = DateTime.SpecifyKind(targetDate, DateTimeKind.Utc);
        var endOfDay = startOfDay.AddDays(1);

        var orders = await _db.RestaurantOrders
            .Include(o => o.Items)
            .Include(o => o.Table)
            .Where(o => o.CreatedAt >= startOfDay && o.CreatedAt < endOfDay && o.IsPaid)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        var totalSales = Math.Round(orders.Sum(o => o.Total), 2);
        var totalSubtotal = Math.Round(orders.Sum(o => o.Subtotal), 2);
        var totalTax = Math.Round(orders.Sum(o => o.Tax), 2);
        var totalDiscounts = Math.Round(orders.Sum(o => o.DiscountAmount), 2);

        var dineInSales = Math.Round(orders.Where(o => o.OrderType == "DINE_IN").Sum(o => o.Total), 2);
        var quickSales = Math.Round(orders.Where(o => o.OrderType == "COUNTER_SALE" || o.OrderType == "TAKEAWAY").Sum(o => o.Total), 2);
        var roomServiceSales = Math.Round(orders.Where(o => o.OrderType == "ROOM_SERVICE").Sum(o => o.Total), 2);

        var cashSales = Math.Round(orders.Where(o => (o.PaymentMethod ?? "").ToUpper() == "CASH").Sum(o => o.Total), 2);
        var cardSales = Math.Round(orders.Where(o => (o.PaymentMethod ?? "").ToUpper() == "CARD").Sum(o => o.Total), 2);
        var upiSales = Math.Round(orders.Where(o => (o.PaymentMethod ?? "").ToUpper() == "UPI" || (o.PaymentMethod ?? "").ToUpper() == "QR").Sum(o => o.Total), 2);
        var roomFolioSales = Math.Round(orders.Where(o => (o.PaymentMethod ?? "").ToUpper() == "ROOM_FOLIO").Sum(o => o.Total), 2);

        var recentOrdersList = orders.Count > 0 
            ? orders.Take(30).ToList() 
            : await _db.RestaurantOrders
                .Include(o => o.Items)
                .Include(o => o.Table)
                .Where(o => o.IsPaid)
                .OrderByDescending(o => o.CreatedAt)
                .Take(30)
                .ToListAsync();

        return Ok(ApiResponse.Ok(new
        {
            date = targetDate.ToString("yyyy-MM-dd"),
            totalOrders = orders.Count,
            totalSales,
            totalSubtotal,
            totalTax,
            totalDiscounts,
            breakdownByType = new
            {
                dineInSales,
                quickSales,
                roomServiceSales
            },
            breakdownByPayment = new
            {
                cashSales,
                cardSales,
                upiSales,
                roomFolioSales
            },
            RecentOrders = recentOrdersList.Select(o => new
            {
                Id = o.Id,
                OrderNumber = o.OrderNumber,
                KotNumber = o.KotNumber,
                OrderType = o.OrderType,
                TableNumber = o.Table?.TableNumber,
                Status = o.Status,
                ServerName = o.ServerName,
                Total = o.Total,
                PaymentMethod = o.PaymentMethod,
                ItemCount = o.Items.Sum(i => i.Quantity),
                Items = o.Items.Select(i => new
                {
                    ProductName = i.ProductName,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    Total = i.Total,
                    Notes = i.Notes
                }),
                CreatedAt = o.CreatedAt
            })
        }));
    }

    public record AcknowledgeAlertRequest(string? StaffName, string? Notes);

    [HttpGet("api/restaurant/alerts")]
    public async Task<IActionResult> GetReservationAlerts(
        [FromQuery] bool? activeOnly,
        [FromQuery] string? status,
        [FromQuery] string? tableId,
        [FromQuery] string? role)
    {
        var query = _db.ReservationAlerts
            .Include(a => a.Reservation)
            .Include(a => a.Table)
            .AsQueryable();

        if (activeOnly != false)
        {
            query = query.Where(a => a.Status == "ACTIVE");
        }
        else if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(a => a.Status.ToUpper() == status.ToUpper());
        }

        if (!string.IsNullOrWhiteSpace(tableId))
        {
            query = query.Where(a => a.TableId == tableId);
        }

        if (!string.IsNullOrWhiteSpace(role))
        {
            var rUpper = role.ToUpper();
            if (rUpper != "MANAGER" && rUpper != "ADMIN")
            {
                query = query.Where(a => a.TargetRoles.ToUpper().Contains(rUpper));
            }
        }

        var alerts = await query
            .OrderByDescending(a => a.Severity == "DANGER")
            .ThenByDescending(a => a.Severity == "WARNING")
            .ThenByDescending(a => a.TriggeredAt ?? a.ScheduledFor)
            .Take(50)
            .Select(a => new
            {
                id = a.Id,
                hotelId = a.HotelId,
                reservationId = a.ReservationId,
                reservationCode = a.Reservation != null ? a.Reservation.ReservationCode : "",
                customerName = a.Reservation != null ? a.Reservation.CustomerName : "",
                phoneNumber = a.Reservation != null ? a.Reservation.PhoneNumber : "",
                partySize = a.Reservation != null ? a.Reservation.PartySize : 2,
                reservationTime = a.Reservation != null ? a.Reservation.ReservationTime : "",
                reservationDate = a.Reservation != null ? a.Reservation.ReservationDate : (DateTime?)null,
                tableId = a.TableId,
                tableNumber = a.Table != null ? a.Table.TableNumber : "",
                section = a.Table != null ? a.Table.Section : "",
                tableCleaningStatus = a.Table != null ? a.Table.CleaningStatus : "CLEAN",
                tableStatus = a.Table != null ? a.Table.Status : "FREE",
                alertType = a.AlertType,
                scheduledFor = a.ScheduledFor,
                triggeredAt = a.TriggeredAt,
                status = a.Status,
                severity = a.Severity,
                title = a.Title,
                message = a.Message,
                targetRoles = a.TargetRoles,
                isRead = a.IsRead,
                acknowledgedBy = a.AcknowledgedBy,
                acknowledgedAt = a.AcknowledgedAt,
                createdAt = a.CreatedAt
            })
            .ToListAsync();

        return Ok(ApiResponse.Ok(alerts));
    }

    [HttpPatch("api/restaurant/alerts/{id}/acknowledge")]
    [HttpPost("api/restaurant/alerts/{id}/acknowledge")]
    public async Task<IActionResult> AcknowledgeAlert(string id, [FromBody] AcknowledgeAlertRequest? req)
    {
        var alert = await _db.ReservationAlerts.FindAsync(id);
        if (alert == null)
        {
            return NotFound(ApiResponse.Fail($"Alert '{id}' not found."));
        }

        alert.Status = "ACKNOWLEDGED";
        alert.IsRead = true;
        alert.AcknowledgedBy = !string.IsNullOrWhiteSpace(req?.StaffName) ? req.StaffName : "Staff";
        alert.AcknowledgedAt = DateTime.UtcNow;
        alert.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(ApiResponse.Ok(alert, "Alert acknowledged successfully."));
    }

    [HttpPatch("api/restaurant/alerts/{id}/dismiss")]
    [HttpPost("api/restaurant/alerts/{id}/dismiss")]
    public async Task<IActionResult> DismissAlert(string id)
    {
        var alert = await _db.ReservationAlerts.FindAsync(id);
        if (alert == null)
        {
            return NotFound(ApiResponse.Fail($"Alert '{id}' not found."));
        }

        alert.Status = "DISMISSED";
        alert.IsRead = true;
        alert.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(ApiResponse.Ok(alert, "Alert dismissed."));
    }
}


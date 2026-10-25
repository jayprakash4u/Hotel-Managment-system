using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

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
    public async Task<IActionResult> GetOrders([FromQuery] string? outlet, [FromQuery] string? status)
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

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(o => o.Status.ToUpper() == status.ToUpper());
        }

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return Ok(ApiResponse.Ok(orders));
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
        List<RestaurantOrderItemDto> Items
    );

    public record RestaurantOrderItemDto(string? ProductId, string? ProductName, double UnitPrice, int Quantity, string? Notes);

    [HttpPost("api/restaurant/orders")]
    public async Task<IActionResult> CreateOrder([FromBody] CreateRestaurantOrderRequest req)
    {
        if (req.Items == null || req.Items.Count == 0)
        {
            return BadRequest(ApiResponse.Fail("Order must have at least one item."));
        }

        foreach (var item in req.Items)
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
                    }
                    else
                    {
                        // Handmade or prepared item (Tea, Momo, etc.)
                        // Do not check stock quantity. Do not decrease any menu stock.
                    }
                }
            }

            var hotel = await _db.Hotels.FirstOrDefaultAsync();
            var hotelId = hotel?.Id ?? Guid.NewGuid().ToString("N");

            var count = await _db.RestaurantOrders.CountAsync();
            var orderNumber = $"ORD-{3001 + count}";
            var kotNumber = $"KOT-{201 + count}";
            var subtotal = req.Items.Sum(i => i.UnitPrice * i.Quantity);
            var tax = Math.Round(subtotal * 0.10, 2);
            var service = Math.Round(subtotal * 0.05, 2);
            var total = subtotal + tax + service;

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
                OrderType = req.OrderType ?? (string.IsNullOrEmpty(req.RoomId) ? "DINE_IN" : "ROOM_SERVICE"),
                ServerName = req.ServerName ?? "Front Desk",
                Subtotal = subtotal,
                Tax = tax,
                ServiceCharge = service,
                Total = total,
                PaymentMethod = req.PaymentMethod ?? "ROOM_FOLIO",
                IsPaid = req.PaymentMethod != "ROOM_FOLIO",
                Notes = req.Notes,
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
                    Total = item.UnitPrice * item.Quantity,
                    Notes = item.Notes
                });
            }

            // If charged to room folio, add to active reservation folio
            if (req.PaymentMethod == "ROOM_FOLIO" && !string.IsNullOrEmpty(req.RoomId))
            {
                var activeRes = await _db.Reservations
                    .FirstOrDefaultAsync(r => r.RoomId == req.RoomId && (r.Status == "CHECKED_IN" || r.Status == "CONFIRMED"));

                if (activeRes != null)
                {
                    activeRes.FolioItems.Add(new FolioItem
                    {
                        Outlet = req.Outlet ?? "RESTAURANT",
                        Description = $"{req.Outlet ?? "Restaurant"} Order #{orderNumber}",
                        UnitPrice = total,
                        Quantity = 1,
                        Total = total,
                        Timestamp = DateTime.UtcNow,
                        BilledBy = req.ServerName ?? "Front Desk"
                    });
                    activeRes.TotalAmount += total;
                }
            }

            _db.RestaurantOrders.Add(order);
            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(ApiResponse.Ok(order, $"Order {orderNumber} created successfully."));
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, ApiResponse.Fail($"Failed to create restaurant order: {ex.Message}"));
        }
    }

    public record UpdateRestaurantOrderStatusRequest(string Status, string? Notes);

    [HttpPatch("api/restaurant/orders/{id}/status")]
    public async Task<IActionResult> UpdateOrderStatus(string id, [FromBody] UpdateRestaurantOrderStatusRequest req)
    {
        var order = await _db.RestaurantOrders
            .Include(o => o.Items)
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
    public async Task<IActionResult> GetTables()
    {
        var tables = await _db.RestaurantTables
            .Include(t => t.Orders.Where(o => o.Status != "BILLED" && o.Status != "CANCELLED"))
            .OrderBy(t => t.TableNumber)
            .ToListAsync();

        return Ok(ApiResponse.Ok(tables));
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
}

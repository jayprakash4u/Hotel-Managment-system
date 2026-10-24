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

        return Ok(ApiResponse.Ok(order, $"Order {orderNumber} created successfully."));
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

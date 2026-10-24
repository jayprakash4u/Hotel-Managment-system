using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/pos")]
public class POSController : ControllerBase
{
    private readonly HospitalityDbContext _db;

    public POSController(HospitalityDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetProducts([FromQuery] string? outlet, [FromQuery] string? category)
    {
        var query = _db.POSProducts.AsQueryable();

        if (!string.IsNullOrWhiteSpace(outlet))
        {
            query = query.Where(p => p.Outlet.ToUpper() == outlet.ToUpper());
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(p => p.Category.ToLower() == category.ToLower());
        }

        var products = await query.OrderBy(p => p.Name).ToListAsync();
        return Ok(ApiResponse.Ok(products));
    }

    public record CreatePOSOrderRequest(
        string? HotelId,
        string? TableId,
        string? RoomId,
        string? GuestId,
        string? PaymentMethod,
        string? Notes,
        List<POSOrderItemDto> Items
    );

    public record POSOrderItemDto(string? ProductId, string? ProductName, string? Name, double UnitPrice, int Quantity);

    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromBody] CreatePOSOrderRequest req)
    {
        if (req.Items == null || req.Items.Count == 0)
        {
            return BadRequest(ApiResponse.Fail("Order must contain at least one item."));
        }

        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = req.HotelId ?? hotel?.Id ?? Guid.NewGuid().ToString("N");

        var count = await _db.RestaurantOrders.CountAsync();
        var orderNumber = $"ORD-{2001 + count}";
        var kotNumber = $"KOT-{101 + count}";
        var subtotal = req.Items.Sum(i => i.UnitPrice * i.Quantity);
        var tax = Math.Round(subtotal * 0.10, 2);
        var service = Math.Round(subtotal * 0.05, 2);
        var total = subtotal + tax + service;

        var order = new RestaurantOrder
        {
            HotelId = hotelId,
            TableId = req.TableId,
            RoomId = req.RoomId,
            GuestId = req.GuestId,
            OrderNumber = orderNumber,
            KotNumber = kotNumber,
            Outlet = "RESTAURANT",
            Status = "RECEIVED",
            OrderType = string.IsNullOrEmpty(req.RoomId) ? "DINE_IN" : "ROOM_SERVICE",
            ServerName = "Front Desk",
            Subtotal = subtotal,
            Tax = tax,
            ServiceCharge = service,
            Total = total,
            PaymentMethod = req.PaymentMethod ?? "CASH",
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
                ProductName = item.ProductName ?? item.Name ?? "Item",
                UnitPrice = item.UnitPrice,
                Quantity = item.Quantity,
                Total = item.UnitPrice * item.Quantity
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
                    Outlet = "RESTAURANT",
                    Description = $"Restaurant & Bar Order #{orderNumber}",
                    UnitPrice = total,
                    Quantity = 1,
                    Total = total,
                    Timestamp = DateTime.UtcNow,
                    BilledBy = "Front Desk"
                });
                activeRes.TotalAmount += total;
            }
        }

        _db.RestaurantOrders.Add(order);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(order, $"Order {orderNumber} placed successfully."));
    }
}

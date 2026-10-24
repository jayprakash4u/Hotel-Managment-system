using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/inventory")]
public class InventoryController : ControllerBase
{
    private readonly HospitalityDbContext _db;

    public InventoryController(HospitalityDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    [HttpGet("items")]
    public async Task<IActionResult> GetInventory([FromQuery] string? category)
    {
        var query = _db.InventoryItems.Include(i => i.Supplier).AsQueryable();

        if (!string.IsNullOrWhiteSpace(category) && !category.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(i => i.Category.ToLower() == category.ToLower());
        }

        var items = await query.OrderBy(i => i.Name).ToListAsync();
        return Ok(ApiResponse.Ok(items));
    }

    public record UpdateStockRequest(string Id, int? QuantityToAdd, int? NewStock);

    [HttpPatch]
    public async Task<IActionResult> UpdateStock([FromBody] UpdateStockRequest req)
    {
        var item = await _db.InventoryItems.FindAsync(req.Id);
        if (item == null)
        {
            return NotFound(ApiResponse.Fail("Inventory item not found."));
        }

        if (req.NewStock.HasValue)
        {
            item.CurrentStock = req.NewStock.Value;
        }
        else if (req.QuantityToAdd.HasValue)
        {
            item.CurrentStock += req.QuantityToAdd.Value;
        }

        item.LastRestocked = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(item, $"Stock updated for {item.Name} to {item.CurrentStock} {item.Unit}."));
    }

    // Purchases
    [HttpGet("purchases")]
    public async Task<IActionResult> GetPurchases()
    {
        var purchases = await _db.PurchaseOrders
            .Include(p => p.Supplier)
            .OrderByDescending(p => p.OrderedAt)
            .ToListAsync();

        return Ok(ApiResponse.Ok(purchases));
    }

    public record CreatePurchaseOrderRequest(string SupplierId, object? ItemsJson, double TotalAmount);

    [HttpPost("purchases")]
    public async Task<IActionResult> CreatePurchaseOrder([FromBody] CreatePurchaseOrderRequest req)
    {
        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? Guid.NewGuid().ToString("N");

        var po = new PurchaseOrder
        {
            HotelId = hotelId,
            SupplierId = req.SupplierId,
            TotalAmount = req.TotalAmount,
            Status = "ORDERED",
            PoNumber = $"PO-{DateTime.UtcNow.Year}-{Random.Shared.Next(1000, 9999)}",
            ItemsJson = req.ItemsJson != null ? JsonSerializer.Serialize(req.ItemsJson) : "[]",
            OrderedAt = DateTime.UtcNow
        };

        _db.PurchaseOrders.Add(po);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(po, "Purchase Order created successfully."));
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

    // Movements
    [HttpGet("movements")]
    public async Task<IActionResult> GetMovements()
    {
        var movements = await _db.StockMovements
            .Include(m => m.Item)
            .OrderByDescending(m => m.CreatedAt)
            .Take(50)
            .ToListAsync();

        return Ok(ApiResponse.Ok(movements));
    }

    public record CreateMovementRequest(string ItemId, int Quantity, string? Type, string? Reason, string? PerformedBy);

    [HttpPost("movements")]
    public async Task<IActionResult> CreateMovement([FromBody] CreateMovementRequest req)
    {
        var item = await _db.InventoryItems.FindAsync(req.ItemId);
        if (item == null)
        {
            return NotFound(ApiResponse.Fail("Item not found."));
        }

        var movement = new StockMovement
        {
            ItemId = req.ItemId,
            Quantity = req.Quantity,
            Type = req.Type ?? "ADJUSTMENT",
            Reason = req.Reason,
            PerformedBy = req.PerformedBy ?? "Inventory Manager",
            CreatedAt = DateTime.UtcNow
        };

        item.CurrentStock += req.Quantity;
        item.LastRestocked = DateTime.UtcNow;

        _db.StockMovements.Add(movement);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(movement, "Stock movement recorded successfully."));
    }
}

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

    // ----------------------------------------------------
    // 1. PRODUCTS MANAGEMENT (GET, POST, PUT, DELETE)
    // ----------------------------------------------------

    [HttpGet]
    [HttpGet("products")]
    public async Task<IActionResult> GetProducts(
        [FromQuery] string? outlet,
        [FromQuery] string? category,
        [FromQuery] string? search)
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

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower().Trim();
            query = query.Where(p => p.Name.ToLower().Contains(s) || (p.Description != null && p.Description.ToLower().Contains(s)));
        }

        var products = await query.OrderBy(p => p.Category).ThenBy(p => p.Name).ToListAsync();
        return Ok(ApiResponse.Ok(products));
    }

    [HttpGet("product/{id}")]
    [HttpGet("products/{id}")]
    public async Task<IActionResult> GetProductById(string id)
    {
        var product = await _db.POSProducts.FirstOrDefaultAsync(p => p.Id == id);
        if (product == null)
        {
            return NotFound(ApiResponse.Fail($"Product with ID '{id}' was not found."));
        }
        return Ok(ApiResponse.Ok(product));
    }

    public record CreatePOSProductRequest(
        string? HotelId,
        string? Outlet,
        string Category,
        string Name,
        string? Description,
        double Price,
        bool TrackStock,
        int? Stock,
        bool? IsAvailable,
        string? ImageUrl
    );

    [HttpPost("product")]
    [HttpPost("products")]
    public async Task<IActionResult> CreateProduct([FromBody] CreatePOSProductRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
        {
            return BadRequest(ApiResponse.Fail("Product name is required."));
        }

        if (string.IsNullOrWhiteSpace(req.Category))
        {
            return BadRequest(ApiResponse.Fail("Product category is required."));
        }

        if (req.Price < 0)
        {
            return BadRequest(ApiResponse.Fail("Price cannot be negative."));
        }

        // Stock quantity validation based on TrackStock
        int stockQuantity = 0;
        if (req.TrackStock)
        {
            if (!req.Stock.HasValue || req.Stock.Value < 0)
            {
                return BadRequest(ApiResponse.Fail("Valid non-negative stock quantity is required when stock tracking is enabled."));
            }
            stockQuantity = req.Stock.Value;
        }
        else
        {
            // Untracked/handmade product: stock quantity is optional
            stockQuantity = req.Stock ?? 0;
        }

        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = req.HotelId ?? hotel?.Id ?? Guid.NewGuid().ToString("N");

        // When stock reaches 0 on a tracked product, mark unavailable
        bool isAvailable = req.IsAvailable ?? true;
        if (req.TrackStock && stockQuantity <= 0)
        {
            isAvailable = false;
        }

        var product = new POSProduct
        {
            HotelId = hotelId,
            Outlet = string.IsNullOrWhiteSpace(req.Outlet) ? "RESTAURANT" : req.Outlet.ToUpper(),
            Category = req.Category.Trim(),
            Name = req.Name.Trim(),
            Description = req.Description?.Trim(),
            Price = req.Price,
            Stock = stockQuantity,
            TrackStock = req.TrackStock,
            IsAvailable = isAvailable,
            ImageUrl = req.ImageUrl
        };

        _db.POSProducts.Add(product);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(product, $"Product '{product.Name}' created successfully."));
    }

    public record UpdatePOSProductRequest(
        string? Outlet,
        string? Category,
        string? Name,
        string? Description,
        double? Price,
        bool? TrackStock,
        int? Stock,
        bool? IsAvailable,
        string? ImageUrl
    );

    [HttpPut("product/{id}")]
    [HttpPut("products/{id}")]
    public async Task<IActionResult> UpdateProduct(string id, [FromBody] UpdatePOSProductRequest req)
    {
        var product = await _db.POSProducts.FirstOrDefaultAsync(p => p.Id == id);
        if (product == null)
        {
            return NotFound(ApiResponse.Fail($"Product with ID '{id}' was not found."));
        }

        if (req.Name != null)
        {
            if (string.IsNullOrWhiteSpace(req.Name))
            {
                return BadRequest(ApiResponse.Fail("Product name cannot be empty."));
            }
            product.Name = req.Name.Trim();
        }

        if (req.Category != null)
        {
            if (string.IsNullOrWhiteSpace(req.Category))
            {
                return BadRequest(ApiResponse.Fail("Category cannot be empty."));
            }
            product.Category = req.Category.Trim();
        }

        if (req.Outlet != null && !string.IsNullOrWhiteSpace(req.Outlet))
        {
            product.Outlet = req.Outlet.ToUpper();
        }

        if (req.Description != null)
        {
            product.Description = req.Description.Trim();
        }

        if (req.Price.HasValue)
        {
            if (req.Price.Value < 0)
            {
                return BadRequest(ApiResponse.Fail("Price cannot be negative."));
            }
            product.Price = req.Price.Value;
        }

        if (req.ImageUrl != null)
        {
            product.ImageUrl = req.ImageUrl;
        }

        // TrackStock and Stock updates
        bool newTrackStock = req.TrackStock ?? product.TrackStock;
        product.TrackStock = newTrackStock;

        if (newTrackStock)
        {
            int updatedStock = req.Stock ?? product.Stock;
            if (updatedStock < 0)
            {
                return BadRequest(ApiResponse.Fail("Stock quantity must be a non-negative number when stock tracking is enabled."));
            }
            product.Stock = updatedStock;

            // When stock reaches 0, mark item unavailable
            if (product.Stock <= 0)
            {
                product.IsAvailable = false;
            }
            else if (req.IsAvailable.HasValue)
            {
                product.IsAvailable = req.IsAvailable.Value;
            }
        }
        else
        {
            // Untracked / handmade item: stock is optional and not required
            if (req.Stock.HasValue && req.Stock.Value >= 0)
            {
                product.Stock = req.Stock.Value;
            }

            if (req.IsAvailable.HasValue)
            {
                product.IsAvailable = req.IsAvailable.Value;
            }
        }

        await _db.SaveChangesAsync();
        return Ok(ApiResponse.Ok(product, $"Product '{product.Name}' updated successfully."));
    }

    [HttpDelete("product/{id}")]
    [HttpDelete("products/{id}")]
    public async Task<IActionResult> DeleteProduct(string id)
    {
        var product = await _db.POSProducts.FirstOrDefaultAsync(p => p.Id == id);
        if (product == null)
        {
            return NotFound(ApiResponse.Fail($"Product with ID '{id}' was not found."));
        }

        _db.POSProducts.Remove(product);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new { product.Id, product.Name }, $"Product '{product.Name}' deleted."));
    }

    // ----------------------------------------------------
    // 2. ORDER PROCESSING WITH STOCK TRACKING
    // ----------------------------------------------------

    public record CreatePOSOrderRequest(
        string? HotelId,
        string? TableId,
        string? RoomId,
        string? GuestId,
        string? PaymentMethod,
        string? Notes,
        List<POSOrderItemDto> Items,
        string? CashierName = null
    );

    public record POSOrderItemDto(string? ProductId, string? ProductName, string? Name, double UnitPrice, int Quantity);

    [HttpPost]
    [HttpPost("orders")]
    public async Task<IActionResult> CreateOrder([FromBody] CreatePOSOrderRequest req)
    {
        if (req.Items == null || req.Items.Count == 0)
        {
            return BadRequest(ApiResponse.Fail("Order must contain at least one item."));
        }

        foreach (var item in req.Items)
        {
            if (item.Quantity <= 0)
            {
                return BadRequest(ApiResponse.Fail($"Invalid quantity ({item.Quantity}) for item '{item.ProductName ?? item.Name}'. Quantity must be at least 1."));
            }
        }

        // Database transaction for concurrency and stock consistency
        using var transaction = await _db.Database.BeginTransactionAsync();

        try
        {
            // 1. Stock Validation and Deduction for Tracked Products
            foreach (var item in req.Items)
            {
                POSProduct? product = null;

                if (!string.IsNullOrWhiteSpace(item.ProductId))
                {
                    product = await _db.POSProducts.FirstOrDefaultAsync(p => p.Id == item.ProductId);
                }

                if (product == null && !string.IsNullOrWhiteSpace(item.ProductName ?? item.Name))
                {
                    var cleanName = (item.ProductName ?? item.Name)!.Trim().ToLower();
                    product = await _db.POSProducts.FirstOrDefaultAsync(p => p.Name.ToLower() == cleanName);
                }

                if (product != null)
                {
                    if (product.TrackStock)
                    {
                        // Scenario A: Stocked Product
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

                        // Deduct stock by quantity sold
                        product.Stock -= item.Quantity;

                        // When stock reaches zero, mark item unavailable for new orders
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
                                Reason = "POS Quick Sale stock deduction",
                                PerformedBy = req.CashierName ?? "POS Cashier",
                                CreatedAt = DateTime.UtcNow
                            });
                        }
                    }
                    else
                    {
                        // Scenario B: Handmade or Prepared Item (Tea, Momo, Chowmein, etc.)
                        // Do not check stock quantity. Do not decrease any menu stock.
                        // Item remains available unless manually marked unavailable.
                    }
                }
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
            await transaction.CommitAsync();

            return Ok(ApiResponse.Ok(order, $"Order {orderNumber} placed successfully."));
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, ApiResponse.Fail($"Failed to process order: {ex.Message}"));
        }
    }

    // ----------------------------------------------------
    // 3. ORDER CANCELLATION & STOCK RESTORATION
    // ----------------------------------------------------

    [HttpPost("orders/{id}/cancel")]
    public async Task<IActionResult> CancelOrder(string id)
    {
        var order = await _db.RestaurantOrders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id || o.OrderNumber == id);

        if (order == null)
        {
            return NotFound(ApiResponse.Fail($"Order '{id}' was not found."));
        }

        // Idempotency: Do not restore stock more than once
        if (order.Status == "CANCELLED")
        {
            return Ok(ApiResponse.Ok(order, "Order is already cancelled. Stock was not modified."));
        }

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            // Restore stock for stocked products
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

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(ApiResponse.Ok(order, $"Order {order.OrderNumber} cancelled and inventory stock restored."));
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, ApiResponse.Fail($"Failed to cancel order: {ex.Message}"));
        }
    }
}

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;
using Hospitality.Application.Common.Models;
using System.Text.Json;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/restaurant/packing")]
public class PackingController : ControllerBase
{
    private readonly HospitalityDbContext _db;
    private readonly ILogger<PackingController> _logger;

    public PackingController(HospitalityDbContext db, ILogger<PackingController> logger)
    {
        _db = db;
        _logger = logger;
    }

    private async Task<string> GetCurrentHotelIdAsync()
    {
        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        return hotel?.Id ?? "hotel-default";
    }

    // -------------------------------------------------------------------------
    // 1. PACKING MATERIAL MANAGEMENT
    // -------------------------------------------------------------------------

    [HttpGet("materials")]
    public async Task<IActionResult> GetMaterials([FromQuery] string? status, [FromQuery] string? search, [FromQuery] bool? lowStockOnly)
    {
        var hotelId = await GetCurrentHotelIdAsync();
        var query = _db.PackingMaterials.Where(m => m.HotelId == hotelId);

        if (!string.IsNullOrWhiteSpace(status) && status.ToUpper() != "ALL")
        {
            query = query.Where(m => m.Status == status.ToUpper());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(m => m.Name.ToLower().Contains(s) || m.Unit.ToLower().Contains(s));
        }

        var materials = await query.OrderBy(m => m.Name).ToListAsync();

        var result = materials.Select(m => new
        {
            m.Id,
            m.HotelId,
            m.Name,
            m.Unit,
            m.PurchaseCost,
            m.PackingCharge,
            m.AvailableStock,
            m.MinStockThreshold,
            m.Status,
            IsLowStock = m.AvailableStock <= m.MinStockThreshold,
            TotalValuation = Math.Round(m.AvailableStock * m.PurchaseCost, 2),
            m.CreatedAt,
            m.UpdatedAt
        });

        if (lowStockOnly == true)
        {
            result = result.Where(m => m.IsLowStock);
        }

        return Ok(ApiResponse.Ok(result));
    }

    public record CreatePackingMaterialDto(
        string Name,
        string Unit,
        double PurchaseCost,
        double PackingCharge,
        int AvailableStock,
        int? MinStockThreshold,
        string? Status
    );

    [HttpPost("materials")]
    public async Task<IActionResult> CreateMaterial([FromBody] CreatePackingMaterialDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest(ApiResponse.Fail("Material name is required."));

        var hotelId = await GetCurrentHotelIdAsync();

        var material = new PackingMaterial
        {
            HotelId = hotelId,
            Name = dto.Name.Trim(),
            Unit = string.IsNullOrWhiteSpace(dto.Unit) ? "pcs" : dto.Unit.Trim(),
            PurchaseCost = Math.Max(0, dto.PurchaseCost),
            PackingCharge = Math.Max(0, dto.PackingCharge),
            AvailableStock = Math.Max(0, dto.AvailableStock),
            MinStockThreshold = dto.MinStockThreshold.HasValue ? Math.Max(0, dto.MinStockThreshold.Value) : 20,
            Status = !string.IsNullOrWhiteSpace(dto.Status) ? dto.Status.ToUpper() : "ACTIVE",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.PackingMaterials.Add(material);
        await _db.SaveChangesAsync();

        // If initial stock was provided, log a restock transaction
        if (material.AvailableStock > 0)
        {
            _db.PackingTransactions.Add(new PackingTransaction
            {
                HotelId = hotelId,
                MaterialId = material.Id,
                Quantity = material.AvailableStock,
                UnitCost = material.PurchaseCost,
                TotalCost = Math.Round(material.AvailableStock * material.PurchaseCost, 2),
                PackingCharge = material.PackingCharge,
                PreviousStock = 0,
                ResultingStock = material.AvailableStock,
                Type = "RESTOCK",
                Notes = "Initial opening stock recorded",
                PerformedBy = "Staff",
                CreatedAt = DateTime.UtcNow
            });
            await _db.SaveChangesAsync();
        }

        return Ok(ApiResponse.Ok(material, "Packing material created successfully."));
    }

    public record UpdatePackingMaterialDto(
        string? Name,
        string? Unit,
        double? PurchaseCost,
        double? PackingCharge,
        int? AvailableStock,
        int? MinStockThreshold,
        string? Status
    );

    [HttpPut("materials/{id}")]
    public async Task<IActionResult> UpdateMaterial(string id, [FromBody] UpdatePackingMaterialDto dto)
    {
        var hotelId = await GetCurrentHotelIdAsync();
        var material = await _db.PackingMaterials.FirstOrDefaultAsync(m => m.Id == id && m.HotelId == hotelId);
        if (material == null) return NotFound(ApiResponse.Fail("Packing material not found."));

        if (!string.IsNullOrWhiteSpace(dto.Name)) material.Name = dto.Name.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Unit)) material.Unit = dto.Unit.Trim();
        if (dto.PurchaseCost.HasValue) material.PurchaseCost = Math.Max(0, dto.PurchaseCost.Value);
        if (dto.PackingCharge.HasValue) material.PackingCharge = Math.Max(0, dto.PackingCharge.Value);
        if (dto.MinStockThreshold.HasValue) material.MinStockThreshold = Math.Max(0, dto.MinStockThreshold.Value);
        if (!string.IsNullOrWhiteSpace(dto.Status)) material.Status = dto.Status.ToUpper();

        if (dto.AvailableStock.HasValue && dto.AvailableStock.Value != material.AvailableStock)
        {
            var prev = material.AvailableStock;
            var next = Math.Max(0, dto.AvailableStock.Value);
            var diff = next - prev;

            material.AvailableStock = next;

            _db.PackingTransactions.Add(new PackingTransaction
            {
                HotelId = hotelId,
                MaterialId = material.Id,
                Quantity = Math.Abs(diff),
                UnitCost = material.PurchaseCost,
                TotalCost = Math.Round(Math.Abs(diff) * material.PurchaseCost, 2),
                PackingCharge = material.PackingCharge,
                PreviousStock = prev,
                ResultingStock = next,
                Type = diff >= 0 ? "RESTOCK" : "ADJUSTMENT",
                Notes = $"Manual stock correction from {prev} to {next}",
                PerformedBy = "Staff",
                CreatedAt = DateTime.UtcNow
            });
        }

        material.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(material, "Packing material updated successfully."));
    }

    [HttpDelete("materials/{id}")]
    public async Task<IActionResult> DeleteMaterial(string id)
    {
        var hotelId = await GetCurrentHotelIdAsync();
        var material = await _db.PackingMaterials.FirstOrDefaultAsync(m => m.Id == id && m.HotelId == hotelId);
        if (material == null) return NotFound(ApiResponse.Fail("Packing material not found."));

        material.Status = "INACTIVE";
        material.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok((object)new {}, "Packing material archived successfully."));
    }

    public record StockAdjustmentDto(int Quantity, string? Notes, string? Type);

    [HttpPost("materials/{id}/adjust-stock")]
    public async Task<IActionResult> AdjustStock(string id, [FromBody] StockAdjustmentDto dto)
    {
        var hotelId = await GetCurrentHotelIdAsync();
        var material = await _db.PackingMaterials.FirstOrDefaultAsync(m => m.Id == id && m.HotelId == hotelId);
        if (material == null) return NotFound(ApiResponse.Fail("Packing material not found."));

        if (dto.Quantity == 0)
            return BadRequest(ApiResponse.Fail("Quantity adjustment cannot be zero."));

        var prev = material.AvailableStock;
        var next = Math.Max(0, prev + dto.Quantity);
        material.AvailableStock = next;
        material.UpdatedAt = DateTime.UtcNow;

        _db.PackingTransactions.Add(new PackingTransaction
        {
            HotelId = hotelId,
            MaterialId = material.Id,
            Quantity = Math.Abs(dto.Quantity),
            UnitCost = material.PurchaseCost,
            TotalCost = Math.Round(Math.Abs(dto.Quantity) * material.PurchaseCost, 2),
            PackingCharge = material.PackingCharge,
            PreviousStock = prev,
            ResultingStock = next,
            Type = !string.IsNullOrWhiteSpace(dto.Type) ? dto.Type.ToUpper() : (dto.Quantity > 0 ? "RESTOCK" : "ADJUSTMENT"),
            Notes = dto.Notes ?? (dto.Quantity > 0 ? "Stock replenishment" : "Stock reduction"),
            PerformedBy = "Staff",
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            material.Id,
            material.Name,
            PreviousStock = prev,
            AvailableStock = next
        }, "Stock adjusted successfully."));
    }

    // -------------------------------------------------------------------------
    // 2. PACKING CONFIGURATION (MENU ITEM MAPPING)
    // -------------------------------------------------------------------------

    [HttpGet("menu-config")]
    public async Task<IActionResult> GetMenuConfig([FromQuery] string? search)
    {
        var hotelId = await GetCurrentHotelIdAsync();
        var query = _db.POSProducts.Where(p => p.HotelId == hotelId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(s) || p.Category.ToLower().Contains(s));
        }

        var products = await query.OrderBy(p => p.Category).ThenBy(p => p.Name).ToListAsync();
        var materials = await _db.PackingMaterials.Where(m => m.HotelId == hotelId).ToDictionaryAsync(m => m.Id);

        var result = products.Select(p =>
        {
            var configs = new List<PackingMaterialConfigItem>();
            if (!string.IsNullOrWhiteSpace(p.PackingConfigJson))
            {
                try
                {
                    configs = JsonSerializer.Deserialize<List<PackingMaterialConfigItem>>(p.PackingConfigJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<PackingMaterialConfigItem>();
                }
                catch { }
            }

            // Enrich with current material details
            var enriched = configs.Select(c =>
            {
                materials.TryGetValue(c.MaterialId, out var mat);
                return new
                {
                    materialId = c.MaterialId,
                    materialName = mat?.Name ?? c.MaterialName,
                    unit = mat?.Unit ?? "pcs",
                    quantity = c.Quantity,
                    unitCost = mat?.PurchaseCost ?? 0,
                    packingCharge = mat?.PackingCharge ?? 0,
                    totalEstimatedCost = Math.Round((mat?.PurchaseCost ?? 0) * c.Quantity, 2),
                    totalEstimatedCharge = Math.Round((mat?.PackingCharge ?? 0) * c.Quantity, 2)
                };
            }).ToList();

            var estimatedPackingCharge = enriched.Sum(e => e.totalEstimatedCharge);
            var estimatedCost = enriched.Sum(e => e.totalEstimatedCost);

            return new
            {
                productId = p.Id,
                productName = p.Name,
                category = p.Category,
                department = p.Department,
                price = p.Price,
                materialsCount = enriched.Count,
                materials = enriched,
                estimatedPackingCharge,
                estimatedCost
            };
        });

        return Ok(ApiResponse.Ok(result));
    }

    public record PackingMaterialConfigItem(string MaterialId, string MaterialName, int Quantity);
    public record UpdateMenuPackingConfigDto(List<PackingMaterialConfigItem> Materials);

    [HttpPut("menu-config/{productId}")]
    public async Task<IActionResult> UpdateMenuConfig(string productId, [FromBody] UpdateMenuPackingConfigDto dto)
    {
        var hotelId = await GetCurrentHotelIdAsync();
        var product = await _db.POSProducts.FirstOrDefaultAsync(p => p.Id == productId && p.HotelId == hotelId);
        if (product == null) return NotFound(ApiResponse.Fail("Menu item not found."));

        var sanitized = (dto.Materials ?? new List<PackingMaterialConfigItem>())
            .Where(m => !string.IsNullOrWhiteSpace(m.MaterialId) && m.Quantity > 0)
            .ToList();

        product.PackingConfigJson = JsonSerializer.Serialize(sanitized);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            productId = product.Id,
            productName = product.Name,
            materials = sanitized
        }, "Menu item packing configuration saved successfully."));
    }

    // -------------------------------------------------------------------------
    // 3. PACKING CALCULATION HELPER
    // -------------------------------------------------------------------------

    public record CalculatePackingItemDto(string ProductId, int Quantity);
    public record CalculatePackingRequest(List<CalculatePackingItemDto> Items);

    [HttpPost("calculate")]
    public async Task<IActionResult> CalculatePacking([FromBody] CalculatePackingRequest req)
    {
        var hotelId = await GetCurrentHotelIdAsync();
        var productIds = req.Items?.Select(i => i.ProductId).Distinct().ToList() ?? new List<string>();
        var products = await _db.POSProducts.Where(p => productIds.Contains(p.Id)).ToListAsync();
        var allMaterials = await _db.PackingMaterials.Where(m => m.HotelId == hotelId && m.Status == "ACTIVE").ToDictionaryAsync(m => m.Id);

        var aggregatedMaterials = new Dictionary<string, (string name, string unit, int qty, double cost, double charge)>();

        foreach (var orderItem in req.Items ?? new List<CalculatePackingItemDto>())
        {
            if (orderItem.Quantity <= 0) continue;
            var prod = products.FirstOrDefault(p => p.Id == orderItem.ProductId);
            if (prod == null || string.IsNullOrWhiteSpace(prod.PackingConfigJson)) continue;

            try
            {
                var configs = JsonSerializer.Deserialize<List<PackingMaterialConfigItem>>(prod.PackingConfigJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (configs != null)
                {
                    foreach (var cfg in configs)
                    {
                        if (allMaterials.TryGetValue(cfg.MaterialId, out var mat))
                        {
                            var totalQty = cfg.Quantity * orderItem.Quantity;
                            if (aggregatedMaterials.ContainsKey(mat.Id))
                            {
                                var existing = aggregatedMaterials[mat.Id];
                                aggregatedMaterials[mat.Id] = (existing.name, existing.unit, existing.qty + totalQty, mat.PurchaseCost, mat.PackingCharge);
                            }
                            else
                            {
                                aggregatedMaterials[mat.Id] = (mat.Name, mat.Unit, totalQty, mat.PurchaseCost, mat.PackingCharge);
                            }
                        }
                    }
                }
            }
            catch { }
        }

        var list = aggregatedMaterials.Select(kvp => new
        {
            materialId = kvp.Key,
            materialName = kvp.Value.name,
            unit = kvp.Value.unit,
            quantity = kvp.Value.qty,
            unitCost = kvp.Value.cost,
            packingCharge = kvp.Value.charge,
            totalCost = Math.Round(kvp.Value.qty * kvp.Value.cost, 2),
            totalCharge = Math.Round(kvp.Value.qty * kvp.Value.charge, 2),
            availableStock = allMaterials.TryGetValue(kvp.Key, out var m) ? m.AvailableStock : 0,
            hasSufficientStock = (allMaterials.TryGetValue(kvp.Key, out var m2) ? m2.AvailableStock : 0) >= kvp.Value.qty
        }).ToList();

        var totalPackingCharge = list.Sum(l => l.totalCharge);
        var totalMaterialCost = list.Sum(l => l.totalCost);

        return Ok(ApiResponse.Ok(new
        {
            materials = list,
            totalPackingCharge,
            totalMaterialCost,
            totalItemsCount = list.Sum(l => l.quantity)
        }));
    }

    // -------------------------------------------------------------------------
    // 4. PACKING DASHBOARD & ORDERS
    // -------------------------------------------------------------------------

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetPackingDashboard(
        [FromQuery] string? status, // ALL, PENDING, IN_PROGRESS, COMPLETED
        [FromQuery] string? orderType, // ALL, TAKEAWAY, DELIVERY
        [FromQuery] string? search,
        [FromQuery] string? date)
    {
        var hotelId = await GetCurrentHotelIdAsync();

        // Packing applies ONLY to Takeaway and Delivery orders
        var query = _db.RestaurantOrders
            .Include(o => o.Items)
            .Include(o => o.Table)
            .Include(o => o.Guest)
            .Where(o => o.HotelId == hotelId && (o.OrderType == "TAKEAWAY" || o.OrderType == "DELIVERY"));

        if (!string.IsNullOrWhiteSpace(status) && status.ToUpper() != "ALL")
        {
            query = query.Where(o => o.PackingStatus == status.ToUpper());
        }

        if (!string.IsNullOrWhiteSpace(orderType) && orderType.ToUpper() != "ALL")
        {
            query = query.Where(o => o.OrderType == orderType.ToUpper());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(o =>
                o.OrderNumber.ToLower().Contains(s) ||
                (o.KotNumber != null && o.KotNumber.ToLower().Contains(s)) ||
                (o.ServerName != null && o.ServerName.ToLower().Contains(s)) ||
                (o.Notes != null && o.Notes.ToLower().Contains(s)) ||
                o.Items.Any(i => i.ProductName.ToLower().Contains(s)));
        }

        if (!string.IsNullOrWhiteSpace(date) && DateTime.TryParse(date, out var parsedDate))
        {
            var start = parsedDate.Date;
            var end = start.AddDays(1);
            query = query.Where(o => o.CreatedAt >= start && o.CreatedAt < end);
        }

        var orders = await query.OrderByDescending(o => o.CreatedAt).Take(200).ToListAsync();
        var allMaterials = await _db.PackingMaterials.Where(m => m.HotelId == hotelId).ToDictionaryAsync(m => m.Id);

        var result = orders.Select(o =>
        {
            var materialsSnapshot = new List<PackingMaterialItemSnapshot>();
            if (!string.IsNullOrWhiteSpace(o.PackingDetailsJson))
            {
                try
                {
                    materialsSnapshot = JsonSerializer.Deserialize<List<PackingMaterialItemSnapshot>>(o.PackingDetailsJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<PackingMaterialItemSnapshot>();
                }
                catch { }
            }

            var enrichedMaterials = materialsSnapshot.Select(m =>
            {
                allMaterials.TryGetValue(m.MaterialId, out var mat);
                return new
                {
                    materialId = m.MaterialId,
                    materialName = mat?.Name ?? m.MaterialName,
                    unit = mat?.Unit ?? "pcs",
                    quantity = m.Quantity,
                    unitCost = m.UnitCost > 0 ? m.UnitCost : (mat?.PurchaseCost ?? 0),
                    packingCharge = m.PackingCharge > 0 ? m.PackingCharge : (mat?.PackingCharge ?? 0),
                    totalCost = Math.Round(m.Quantity * (m.UnitCost > 0 ? m.UnitCost : (mat?.PurchaseCost ?? 0)), 2),
                    totalCharge = Math.Round(m.Quantity * (m.PackingCharge > 0 ? m.PackingCharge : (mat?.PackingCharge ?? 0)), 2),
                    availableStock = mat?.AvailableStock ?? 0
                };
            }).ToList();

            return new
            {
                orderId = o.Id,
                orderNumber = o.OrderNumber,
                kotNumber = o.KotNumber,
                orderType = o.OrderType,
                kitchenStatus = o.Status,
                packingStatus = string.IsNullOrWhiteSpace(o.PackingStatus) ? "PENDING" : o.PackingStatus,
                packingCharge = o.PackingCharge,
                totalActualCost = Math.Round(enrichedMaterials.Sum(m => m.totalCost), 2),
                serverName = o.ServerName,
                notes = o.Notes,
                customerName = o.Guest != null ? $"{o.Guest.FirstName} {o.Guest.LastName}".Trim() : null,
                customerPhone = o.Guest?.Phone,
                itemsCount = o.Items.Sum(i => i.Quantity),
                items = o.Items.Select(i => new
                {
                    productName = i.ProductName,
                    quantity = i.Quantity,
                    unitPrice = i.UnitPrice,
                    total = i.Total
                }),
                materials = enrichedMaterials,
                materialsCount = enrichedMaterials.Sum(m => m.quantity),
                packedAt = o.PackedAt,
                packedBy = o.PackedBy,
                createdAt = o.CreatedAt
            };
        });

        // Compute Quick Counts
        var totalOrders = orders.Count;
        var pendingCount = orders.Count(o => o.PackingStatus == "PENDING" || string.IsNullOrWhiteSpace(o.PackingStatus));
        var inProgressCount = orders.Count(o => o.PackingStatus == "IN_PROGRESS");
        var completedCount = orders.Count(o => o.PackingStatus == "COMPLETED");

        return Ok(ApiResponse.Ok(new
        {
            orders = result,
            counts = new
            {
                all = totalOrders,
                pending = pendingCount,
                inProgress = inProgressCount,
                completed = completedCount
            }
        }));
    }

    public record PackingMaterialItemSnapshot(
        string MaterialId,
        string MaterialName,
        int Quantity,
        double UnitCost,
        double PackingCharge
    );

    // -------------------------------------------------------------------------
    // 5. PACKING PROCESS & LIFECYCLE
    // -------------------------------------------------------------------------

    public record UpdatePackingStatusDto(string Status, string? StaffName);

    [HttpPost("orders/{id}/status")]
    public async Task<IActionResult> UpdatePackingStatus(string id, [FromBody] UpdatePackingStatusDto dto)
    {
        var hotelId = await GetCurrentHotelIdAsync();
        var order = await _db.RestaurantOrders.FirstOrDefaultAsync(o => o.Id == id && o.HotelId == hotelId);
        if (order == null) return NotFound(ApiResponse.Fail("Order not found."));

        var status = dto.Status.ToUpper();
        if (status != "PENDING" && status != "IN_PROGRESS" && status != "COMPLETED")
            return BadRequest(ApiResponse.Fail("Invalid packing status. Allowed: PENDING, IN_PROGRESS, COMPLETED."));

        // If transitioning to COMPLETED, call the complete flow which deducts inventory safely
        if (status == "COMPLETED")
        {
            return await CompletePackingOrder(id, new CompletePackingDto(dto.StaffName, null));
        }

        order.PackingStatus = status;
        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new { order.Id, order.OrderNumber, order.PackingStatus }, $"Packing status updated to {status}."));
    }

    public record AdjustOrderPackingMaterialsDto(List<PackingMaterialItemSnapshot> Materials);

    [HttpPost("orders/{id}/adjust-materials")]
    public async Task<IActionResult> AdjustOrderMaterials(string id, [FromBody] AdjustOrderPackingMaterialsDto dto)
    {
        var hotelId = await GetCurrentHotelIdAsync();
        var order = await _db.RestaurantOrders.FirstOrDefaultAsync(o => o.Id == id && o.HotelId == hotelId);
        if (order == null) return NotFound(ApiResponse.Fail("Order not found."));

        if (order.PackingStatus == "COMPLETED")
            return BadRequest(ApiResponse.Fail("Cannot modify packing materials for an order that has already completed packing."));

        var materials = dto.Materials?.Where(m => !string.IsNullOrWhiteSpace(m.MaterialId) && m.Quantity > 0).ToList() ?? new List<PackingMaterialItemSnapshot>();
        var totalCharge = materials.Sum(m => m.PackingCharge * m.Quantity);

        order.PackingDetailsJson = JsonSerializer.Serialize(materials);
        order.PackingCharge = totalCharge;
        order.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            order.Id,
            order.OrderNumber,
            order.PackingCharge,
            materials
        }, "Order packing materials updated."));
    }

    public record CompletePackingDto(string? StaffName, List<PackingMaterialItemSnapshot>? ModifiedMaterials);

    [HttpPost("orders/{id}/complete")]
    public async Task<IActionResult> CompletePackingOrder(string id, [FromBody] CompletePackingDto dto)
    {
        var hotelId = await GetCurrentHotelIdAsync();
        using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            var order = await _db.RestaurantOrders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == id && o.HotelId == hotelId);

            if (order == null) return NotFound(ApiResponse.Fail("Order not found."));

            // Prevent duplicate deduction
            if (order.PackingStatus == "COMPLETED")
            {
                return Ok(ApiResponse.Ok(new { order.Id, order.OrderNumber, order.PackingStatus }, "Packing was already completed. Stock was not re-deducted."));
            }

            // Determine materials list
            var materialsToDeduct = new List<PackingMaterialItemSnapshot>();
            if (dto.ModifiedMaterials != null && dto.ModifiedMaterials.Count > 0)
            {
                materialsToDeduct = dto.ModifiedMaterials.Where(m => !string.IsNullOrWhiteSpace(m.MaterialId) && m.Quantity > 0).ToList();
            }
            else if (!string.IsNullOrWhiteSpace(order.PackingDetailsJson))
            {
                try
                {
                    materialsToDeduct = JsonSerializer.Deserialize<List<PackingMaterialItemSnapshot>>(order.PackingDetailsJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<PackingMaterialItemSnapshot>();
                }
                catch { }
            }

            // If empty, auto-generate from menu items packing config
            if (materialsToDeduct.Count == 0)
            {
                var productIds = order.Items.Select(i => i.ProductId).Distinct().ToList();
                var products = await _db.POSProducts.Where(p => productIds.Contains(p.Id)).ToListAsync();
                var allDbMaterials = await _db.PackingMaterials.Where(m => m.HotelId == hotelId).ToDictionaryAsync(m => m.Id);

                var aggregated = new Dictionary<string, PackingMaterialItemSnapshot>();
                foreach (var item in order.Items)
                {
                    var prod = products.FirstOrDefault(p => p.Id == item.ProductId);
                    if (prod != null && !string.IsNullOrWhiteSpace(prod.PackingConfigJson))
                    {
                        try
                        {
                            var configs = JsonSerializer.Deserialize<List<PackingMaterialConfigItem>>(prod.PackingConfigJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                            if (configs != null)
                            {
                                foreach (var c in configs)
                                {
                                    if (allDbMaterials.TryGetValue(c.MaterialId, out var mat))
                                    {
                                        var qty = c.Quantity * item.Quantity;
                                        if (aggregated.ContainsKey(mat.Id))
                                        {
                                            var exist = aggregated[mat.Id];
                                            aggregated[mat.Id] = new PackingMaterialItemSnapshot(mat.Id, mat.Name, exist.Quantity + qty, mat.PurchaseCost, mat.PackingCharge);
                                        }
                                        else
                                        {
                                            aggregated[mat.Id] = new PackingMaterialItemSnapshot(mat.Id, mat.Name, qty, mat.PurchaseCost, mat.PackingCharge);
                                        }
                                    }
                                }
                            }
                        }
                        catch { }
                    }
                }
                materialsToDeduct = aggregated.Values.ToList();
            }

            var staff = !string.IsNullOrWhiteSpace(dto.StaffName) ? dto.StaffName : (order.ServerName ?? "Staff");
            var materialIds = materialsToDeduct.Select(m => m.MaterialId).Distinct().ToList();
            var materialsDb = await _db.PackingMaterials.Where(m => materialIds.Contains(m.Id) && m.HotelId == hotelId).ToListAsync();

            var deductions = new List<object>();

            foreach (var item in materialsToDeduct)
            {
                var mat = materialsDb.FirstOrDefault(m => m.Id == item.MaterialId);
                if (mat != null)
                {
                    var prevStock = mat.AvailableStock;
                    var newStock = Math.Max(0, mat.AvailableStock - item.Quantity);
                    mat.AvailableStock = newStock;
                    mat.UpdatedAt = DateTime.UtcNow;

                    _db.PackingTransactions.Add(new PackingTransaction
                    {
                        HotelId = hotelId,
                        MaterialId = mat.Id,
                        OrderId = order.Id,
                        OrderNumber = order.OrderNumber,
                        OrderType = order.OrderType,
                        Quantity = item.Quantity,
                        UnitCost = mat.PurchaseCost,
                        TotalCost = Math.Round(item.Quantity * mat.PurchaseCost, 2),
                        PackingCharge = mat.PackingCharge,
                        PreviousStock = prevStock,
                        ResultingStock = newStock,
                        Type = "CONSUMPTION",
                        Notes = $"Consumed for {order.OrderType} order #{order.OrderNumber}",
                        PerformedBy = staff,
                        CreatedAt = DateTime.UtcNow
                    });

                    deductions.Add(new
                    {
                        mat.Id,
                        mat.Name,
                        Deducted = item.Quantity,
                        PreviousStock = prevStock,
                        ResultingStock = newStock,
                        IsLowStock = newStock <= mat.MinStockThreshold
                    });
                }
            }

            order.PackingDetailsJson = JsonSerializer.Serialize(materialsToDeduct);
            order.PackingStatus = "COMPLETED";
            order.PackedAt = DateTime.UtcNow;
            order.PackedBy = staff;
            order.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            return Ok(ApiResponse.Ok(new
            {
                order.Id,
                order.OrderNumber,
                order.PackingStatus,
                order.PackedAt,
                order.PackedBy,
                materialsUsed = materialsToDeduct,
                stockDeductions = deductions
            }, "Packing marked as COMPLETED. Material stock has been updated."));
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            _logger.LogError(ex, "Failed to complete packing for order {OrderId}", id);
            return StatusCode(500, ApiResponse.Fail("Failed to complete packing order: " + ex.Message));
        }
    }

    // -------------------------------------------------------------------------
    // 6. REPORTS & ANALYTICS
    // -------------------------------------------------------------------------

    [HttpGet("reports/summary")]
    public async Task<IActionResult> GetReportsSummary([FromQuery] string? startDate, [FromQuery] string? endDate)
    {
        var hotelId = await GetCurrentHotelIdAsync();

        var query = _db.PackingTransactions
            .Include(t => t.Material)
            .Where(t => t.HotelId == hotelId && t.Type == "CONSUMPTION");

        if (!string.IsNullOrWhiteSpace(startDate) && DateTime.TryParse(startDate, out var sDate))
        {
            query = query.Where(t => t.CreatedAt >= sDate.Date);
        }
        if (!string.IsNullOrWhiteSpace(endDate) && DateTime.TryParse(endDate, out var eDate))
        {
            query = query.Where(t => t.CreatedAt < eDate.Date.AddDays(1));
        }

        var transactions = await query.ToListAsync();

        var totalItemsConsumed = transactions.Sum(t => t.Quantity);
        var totalMaterialCost = Math.Round(transactions.Sum(t => t.TotalCost), 2);
        var totalPackingCharges = Math.Round(transactions.Sum(t => t.Quantity * t.PackingCharge), 2);
        var netMargin = Math.Round(totalPackingCharges - totalMaterialCost, 2);

        // Low stock materials count
        var lowStockCount = await _db.PackingMaterials
            .CountAsync(m => m.HotelId == hotelId && m.Status == "ACTIVE" && m.AvailableStock <= m.MinStockThreshold);

        var totalMaterialsInInventory = await _db.PackingMaterials
            .Where(m => m.HotelId == hotelId && m.Status == "ACTIVE")
            .SumAsync(m => (int?)m.AvailableStock) ?? 0;

        return Ok(ApiResponse.Ok(new
        {
            totalItemsConsumed,
            totalMaterialCost,
            totalPackingCharges,
            netMargin,
            marginPercentage = totalPackingCharges > 0 ? Math.Round((netMargin / totalPackingCharges) * 100, 1) : 0,
            lowStockCount,
            totalMaterialsInInventory
        }));
    }

    [HttpGet("reports/consumption")]
    public async Task<IActionResult> GetConsumptionReport([FromQuery] string? startDate, [FromQuery] string? endDate)
    {
        var hotelId = await GetCurrentHotelIdAsync();

        var query = _db.PackingTransactions
            .Include(t => t.Material)
            .Where(t => t.HotelId == hotelId && t.Type == "CONSUMPTION");

        if (!string.IsNullOrWhiteSpace(startDate) && DateTime.TryParse(startDate, out var sDate))
        {
            query = query.Where(t => t.CreatedAt >= sDate.Date);
        }
        if (!string.IsNullOrWhiteSpace(endDate) && DateTime.TryParse(endDate, out var eDate))
        {
            query = query.Where(t => t.CreatedAt < eDate.Date.AddDays(1));
        }

        var transactions = await query.OrderByDescending(t => t.CreatedAt).ToListAsync();

        // Group by material
        var byMaterial = transactions
            .GroupBy(t => new { t.MaterialId, Name = t.Material != null ? t.Material.Name : "Item", Unit = t.Material != null ? t.Material.Unit : "pcs" })
            .Select(g => new
            {
                materialId = g.Key.MaterialId,
                materialName = g.Key.Name,
                unit = g.Key.Unit,
                totalQuantity = g.Sum(x => x.Quantity),
                totalCost = Math.Round(g.Sum(x => x.TotalCost), 2),
                totalPackingCharge = Math.Round(g.Sum(x => x.Quantity * x.PackingCharge), 2),
                netMargin = Math.Round(g.Sum(x => x.Quantity * x.PackingCharge) - g.Sum(x => x.TotalCost), 2),
                ordersCount = g.Select(x => x.OrderId).Distinct().Count()
            })
            .OrderByDescending(x => x.totalQuantity)
            .ToList();

        // Recent transaction log
        var recentLogs = transactions.Take(50).Select(t => new
        {
            t.Id,
            materialName = t.Material?.Name ?? "Item",
            unit = t.Material?.Unit ?? "pcs",
            orderNumber = t.OrderNumber,
            orderType = t.OrderType,
            quantity = t.Quantity,
            unitCost = t.UnitCost,
            totalCost = t.TotalCost,
            packingCharge = t.PackingCharge,
            previousStock = t.PreviousStock,
            resultingStock = t.ResultingStock,
            performedBy = t.PerformedBy,
            createdAt = t.CreatedAt
        });

        return Ok(ApiResponse.Ok(new
        {
            byMaterial,
            recentLogs
        }));
    }

    [HttpGet("reports/stock")]
    public async Task<IActionResult> GetStockReport()
    {
        var hotelId = await GetCurrentHotelIdAsync();
        var materials = await _db.PackingMaterials
            .Where(m => m.HotelId == hotelId)
            .OrderBy(m => m.Name)
            .ToListAsync();

        var report = materials.Select(m => new
        {
            m.Id,
            m.Name,
            m.Unit,
            m.PurchaseCost,
            m.PackingCharge,
            m.AvailableStock,
            m.MinStockThreshold,
            m.Status,
            IsLowStock = m.AvailableStock <= m.MinStockThreshold,
            StockHealth = m.AvailableStock <= 0 ? "OUT_OF_STOCK" : (m.AvailableStock <= m.MinStockThreshold ? "LOW_STOCK" : "HEALTHY"),
            TotalValuation = Math.Round(m.AvailableStock * m.PurchaseCost, 2),
            PotentialRevenue = Math.Round(m.AvailableStock * m.PackingCharge, 2)
        });

        return Ok(ApiResponse.Ok(report));
    }
}

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/suppliers")]
public class SuppliersController : ControllerBase
{
    private readonly HospitalityDbContext _db;

    public SuppliersController(HospitalityDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetSuppliers()
    {
        var suppliers = await _db.Suppliers
            .Include(s => s.Items)
            .Include(s => s.Purchases)
            .OrderBy(s => s.Name)
            .ToListAsync();

        return Ok(ApiResponse.Ok(suppliers));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetSupplierById(string id)
    {
        var supplier = await _db.Suppliers
            .Include(s => s.Items)
            .Include(s => s.Purchases)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (supplier == null)
        {
            return NotFound(ApiResponse.Fail($"Supplier '{id}' not found."));
        }

        return Ok(ApiResponse.Ok(supplier));
    }

    [HttpPost]
    public async Task<IActionResult> CreateSupplier([FromBody] Supplier supplier)
    {
        if (string.IsNullOrWhiteSpace(supplier.Name))
        {
            return BadRequest(ApiResponse.Fail("Supplier name is required."));
        }

        if (string.IsNullOrEmpty(supplier.HotelId))
        {
            var hotel = await _db.Hotels.FirstOrDefaultAsync();
            supplier.HotelId = hotel?.Id ?? Guid.NewGuid().ToString("N");
        }

        supplier.CreatedAt = DateTime.UtcNow;

        _db.Suppliers.Add(supplier);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(supplier, "Supplier created successfully."));
    }

    public record UpdateSupplierRequest(
        string Name,
        string? ContactName,
        string? Email,
        string? Phone,
        string? Address,
        string? Category
    );

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateSupplier(string id, [FromBody] UpdateSupplierRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
        {
            return BadRequest(ApiResponse.Fail("Supplier name is required."));
        }

        var supplier = await _db.Suppliers.FindAsync(id);
        if (supplier == null)
        {
            return NotFound(ApiResponse.Fail($"Supplier '{id}' not found."));
        }

        supplier.Name = req.Name.Trim();
        supplier.ContactName = req.ContactName?.Trim() ?? string.Empty;
        supplier.Email = req.Email?.Trim() ?? string.Empty;
        supplier.Phone = req.Phone?.Trim() ?? string.Empty;
        supplier.Address = req.Address?.Trim();
        supplier.Category = req.Category?.Trim() ?? string.Empty;

        await _db.SaveChangesAsync();
        return Ok(ApiResponse.Ok(supplier, $"Supplier '{supplier.Name}' updated successfully."));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSupplier(string id)
    {
        var supplier = await _db.Suppliers
            .Include(s => s.Items)
            .Include(s => s.Purchases)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (supplier == null)
        {
            return NotFound(ApiResponse.Fail($"Supplier '{id}' not found."));
        }

        if (supplier.Purchases.Any() || supplier.Items.Any())
        {
            return BadRequest(ApiResponse.Fail($"Cannot delete supplier '{supplier.Name}' because it has active inventory items or purchase records linked to it."));
        }

        _db.Suppliers.Remove(supplier);
        await _db.SaveChangesAsync();
        return Ok(ApiResponse.Ok(supplier, $"Supplier '{supplier.Name}' deleted."));
    }
}

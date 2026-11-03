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
    public async Task<IActionResult> GetSuppliers(
        [FromQuery] bool? activeOnly,
        [FromQuery] string? search,
        [FromQuery] string? category)
    {
        var query = _db.Suppliers
            .Include(s => s.Items)
            .Include(s => s.Purchases)
            .AsQueryable();

        // 1. Filter by Active status
        if (activeOnly == true)
        {
            query = query.Where(s => s.IsActive);
        }

        // 2. Filter by Category
        if (!string.IsNullOrWhiteSpace(category) && !category.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(s => s.Category.ToLower() == category.ToLower());
        }

        // 3. Search query
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(x =>
                x.Name.ToLower().Contains(s) ||
                x.Code.ToLower().Contains(s) ||
                x.Phone.ToLower().Contains(s) ||
                x.Email.ToLower().Contains(s) ||
                x.ContactName.ToLower().Contains(s) ||
                (x.PanVatNumber != null && x.PanVatNumber.ToLower().Contains(s))
            );
        }

        var suppliers = await query.OrderBy(s => s.Name).ToListAsync();

        // Ensure each supplier has a unique Code (auto-generate for legacy records without one)
        bool hasChanges = false;
        int nextCodeNumber = 101;
        foreach (var sup in suppliers)
        {
            if (string.IsNullOrWhiteSpace(sup.Code))
            {
                sup.Code = $"SUP-{nextCodeNumber++}";
                hasChanges = true;
            }
        }
        if (hasChanges)
        {
            await _db.SaveChangesAsync();
        }

        return Ok(ApiResponse.Ok(suppliers));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetSupplierById(string id)
    {
        var supplier = await _db.Suppliers
            .Include(s => s.Items)
            .Include(s => s.Purchases)
            .FirstOrDefaultAsync(s => s.Id == id || s.Code.ToLower() == id.ToLower());

        if (supplier == null)
        {
            return NotFound(ApiResponse.Fail($"Supplier '{id}' not found."));
        }

        return Ok(ApiResponse.Ok(supplier));
    }

    public record CreateSupplierDto(
        string Name,
        string? ContactPerson,
        string? ContactName,
        string? Email,
        string? Phone,
        string? Address,
        string? PanVatNumber,
        string? Category,
        string? Notes,
        bool? IsActive
    );

    [HttpPost]
    public async Task<IActionResult> CreateSupplier([FromBody] CreateSupplierDto req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
        {
            return BadRequest(ApiResponse.Fail("Supplier name is required."));
        }

        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? Guid.NewGuid().ToString("N");

        // Automatically generate unique Supplier Code
        var count = await _db.Suppliers.CountAsync();
        var candidateCode = $"SUP-{count + 101}";
        while (await _db.Suppliers.AnyAsync(s => s.Code == candidateCode))
        {
            count++;
            candidateCode = $"SUP-{count + 101}";
        }

        var contact = !string.IsNullOrWhiteSpace(req.ContactPerson)
            ? req.ContactPerson.Trim()
            : req.ContactName?.Trim() ?? string.Empty;

        var supplier = new Supplier
        {
            HotelId = hotelId,
            Code = candidateCode,
            Name = req.Name.Trim(),
            ContactName = contact,
            Email = req.Email?.Trim() ?? string.Empty,
            Phone = req.Phone?.Trim() ?? string.Empty,
            Address = req.Address?.Trim(),
            PanVatNumber = req.PanVatNumber?.Trim(),
            Category = !string.IsNullOrWhiteSpace(req.Category) ? req.Category.Trim() : "General",
            Notes = req.Notes?.Trim(),
            IsActive = req.IsActive ?? true,
            CreatedAt = DateTime.UtcNow
        };

        _db.Suppliers.Add(supplier);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(supplier, $"Supplier '{supplier.Name}' created with code {supplier.Code}."));
    }

    public record UpdateSupplierDto(
        string Name,
        string? ContactPerson,
        string? ContactName,
        string? Email,
        string? Phone,
        string? Address,
        string? PanVatNumber,
        string? Category,
        string? Notes,
        bool? IsActive
    );

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateSupplier(string id, [FromBody] UpdateSupplierDto req)
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

        var contact = !string.IsNullOrWhiteSpace(req.ContactPerson)
            ? req.ContactPerson.Trim()
            : req.ContactName?.Trim() ?? string.Empty;

        supplier.Name = req.Name.Trim();
        supplier.ContactName = contact;
        supplier.Email = req.Email?.Trim() ?? string.Empty;
        supplier.Phone = req.Phone?.Trim() ?? string.Empty;
        supplier.Address = req.Address?.Trim();
        supplier.PanVatNumber = req.PanVatNumber?.Trim();
        if (!string.IsNullOrWhiteSpace(req.Category))
        {
            supplier.Category = req.Category.Trim();
        }
        supplier.Notes = req.Notes?.Trim();
        if (req.IsActive.HasValue)
        {
            supplier.IsActive = req.IsActive.Value;
        }

        await _db.SaveChangesAsync();
        return Ok(ApiResponse.Ok(supplier, $"Supplier '{supplier.Name}' updated successfully."));
    }

    [HttpPatch("{id}/toggle-status")]
    public async Task<IActionResult> ToggleSupplierStatus(string id)
    {
        var supplier = await _db.Suppliers.FindAsync(id);
        if (supplier == null)
        {
            return NotFound(ApiResponse.Fail($"Supplier '{id}' not found."));
        }

        supplier.IsActive = !supplier.IsActive;
        await _db.SaveChangesAsync();

        var statusLabel = supplier.IsActive ? "activated" : "deactivated";
        return Ok(ApiResponse.Ok(supplier, $"Supplier '{supplier.Name}' has been {statusLabel}. Historical records are preserved."));
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
            return BadRequest(ApiResponse.Fail(
                $"Cannot delete supplier '{supplier.Name}' because it has {supplier.Purchases.Count} purchase record(s) and {supplier.Items.Count} inventory item(s) linked to it. Please deactivate the supplier instead."
            ));
        }

        _db.Suppliers.Remove(supplier);
        await _db.SaveChangesAsync();
        return Ok(ApiResponse.Ok(supplier, $"Supplier '{supplier.Name}' deleted successfully."));
    }
}

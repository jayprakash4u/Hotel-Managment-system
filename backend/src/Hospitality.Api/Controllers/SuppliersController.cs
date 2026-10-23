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
            .OrderBy(s => s.Name)
            .ToListAsync();

        return Ok(ApiResponse.Ok(suppliers));
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
}

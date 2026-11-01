using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/guests")]
public class GuestsController : ControllerBase
{
    private readonly HospitalityDbContext _db;

    public GuestsController(HospitalityDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetGuests([FromQuery] string? search, [FromQuery] string? vipTier)
    {
        var query = _db.Guests.AsQueryable();

        if (!string.IsNullOrWhiteSpace(vipTier))
        {
            query = query.Where(g => g.VipTier.ToUpper() == vipTier.ToUpper());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(g =>
                g.FirstName.ToLower().Contains(s) ||
                g.LastName.ToLower().Contains(s) ||
                g.Email.ToLower().Contains(s) ||
                g.Phone.Contains(s) ||
                g.IdNumber.ToLower().Contains(s)
            );
        }

        var guests = await query.OrderBy(g => g.FirstName).ToListAsync();
        return Ok(ApiResponse.Ok(guests));
    }

    [HttpPost]
    public async Task<IActionResult> CreateGuest([FromBody] Guest guest)
    {
        if (string.IsNullOrWhiteSpace(guest.FirstName))
        {
            return BadRequest(ApiResponse.Fail("First name is required."));
        }

        if (string.IsNullOrEmpty(guest.HotelId))
        {
            var hotel = await _db.Hotels.FirstOrDefaultAsync();
            guest.HotelId = hotel?.Id ?? Guid.NewGuid().ToString("N");
        }

        guest.CreatedAt = DateTime.UtcNow;
        guest.UpdatedAt = DateTime.UtcNow;

        _db.Guests.Add(guest);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(guest, "Guest created successfully."));
    }
}

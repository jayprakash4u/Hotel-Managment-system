using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/hotel")]
public class HotelController : ControllerBase
{
    private readonly HospitalityDbContext _db;

    public HotelController(HospitalityDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetHotel()
    {
        var hotel = await _db.Hotels
            .Include(h => h.RoomTypes)
            .Include(h => h.Rooms)
            .FirstOrDefaultAsync();

        if (hotel == null)
        {
            return NotFound(ApiResponse.Fail("Hotel profile not found."));
        }

        return Ok(ApiResponse.Ok(hotel));
    }

    [HttpPost]
    public async Task<IActionResult> UpdateHotel([FromBody] Hotel updateDto)
    {
        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        if (hotel == null)
        {
            hotel = new Hotel();
            _db.Hotels.Add(hotel);
        }

        hotel.Name = updateDto.Name ?? hotel.Name;
        hotel.Address = updateDto.Address ?? hotel.Address;
        hotel.TotalFloors = updateDto.TotalFloors > 0 ? updateDto.TotalFloors : hotel.TotalFloors;
        hotel.Currency = updateDto.Currency ?? hotel.Currency;
        hotel.Timezone = updateDto.Timezone ?? hotel.Timezone;
        hotel.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(hotel, "Hotel profile updated successfully."));
    }
}

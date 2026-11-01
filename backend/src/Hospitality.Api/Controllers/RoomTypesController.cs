using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/room-types")]
public class RoomTypesController : ControllerBase
{
    private readonly HospitalityDbContext _db;

    public RoomTypesController(HospitalityDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetRoomTypes()
    {
        var roomTypes = await _db.RoomTypes
            .Include(rt => rt.Rooms)
            .OrderBy(rt => rt.BasePrice)
            .ToListAsync();

        return Ok(ApiResponse.Ok(roomTypes));
    }

    [HttpPost]
    public async Task<IActionResult> CreateRoomType([FromBody] RoomType roomType)
    {
        if (string.IsNullOrWhiteSpace(roomType.Name))
        {
            return BadRequest(ApiResponse.Fail("Room type name is required."));
        }

        if (string.IsNullOrEmpty(roomType.HotelId))
        {
            var defaultHotel = await _db.Hotels.FirstOrDefaultAsync();
            roomType.HotelId = defaultHotel?.Id ?? Guid.NewGuid().ToString("N");
        }

        roomType.CreatedAt = DateTime.UtcNow;
        roomType.UpdatedAt = DateTime.UtcNow;

        _db.RoomTypes.Add(roomType);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(roomType, "Room type created successfully."));
    }
}

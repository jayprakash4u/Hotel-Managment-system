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

    [HttpGet("{id}")]
    public async Task<IActionResult> GetRoomTypeById(string id)
    {
        var roomType = await _db.RoomTypes
            .Include(rt => rt.Rooms)
            .FirstOrDefaultAsync(rt => rt.Id == id);

        if (roomType == null)
        {
            return NotFound(ApiResponse.Fail("Room type not found."));
        }

        return Ok(ApiResponse.Ok(roomType));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateRoomType(string id, [FromBody] RoomType updated)
    {
        var roomType = await _db.RoomTypes.FindAsync(id);
        if (roomType == null)
        {
            return NotFound(ApiResponse.Fail("Room type not found."));
        }

        if (!string.IsNullOrWhiteSpace(updated.Name)) roomType.Name = updated.Name.Trim();
        roomType.HasAC = updated.HasAC;
        if (!string.IsNullOrWhiteSpace(updated.BedType)) roomType.BedType = updated.BedType;
        if (updated.MaxCapacity > 0) roomType.MaxCapacity = updated.MaxCapacity;
        if (updated.BasePrice >= 0) roomType.BasePrice = updated.BasePrice;
        if (!string.IsNullOrWhiteSpace(updated.Amenities)) roomType.Amenities = updated.Amenities;
        if (updated.ImageUrl != null) roomType.ImageUrl = updated.ImageUrl;
        if (updated.Description != null) roomType.Description = updated.Description;

        // Extended setup attributes
        if (updated.RoomSize != null) roomType.RoomSize = updated.RoomSize;
        if (updated.RoomView != null) roomType.RoomView = updated.RoomView;
        if (updated.MaxAdults > 0) roomType.MaxAdults = updated.MaxAdults;
        if (updated.MaxChildren >= 0) roomType.MaxChildren = updated.MaxChildren;
        if (updated.SmokingPolicy != null) roomType.SmokingPolicy = updated.SmokingPolicy;
        if (updated.Accessibility != null) roomType.Accessibility = updated.Accessibility;
        if (updated.BedConfiguration != null) roomType.BedConfiguration = updated.BedConfiguration;
        if (updated.BathroomFacilities != null) roomType.BathroomFacilities = updated.BathroomFacilities;
        if (updated.GalleryImages != null) roomType.GalleryImages = updated.GalleryImages;
        if (updated.Policies != null) roomType.Policies = updated.Policies;
        if (updated.ExtraAdultPrice >= 0) roomType.ExtraAdultPrice = updated.ExtraAdultPrice;
        if (updated.ExtraChildPrice >= 0) roomType.ExtraChildPrice = updated.ExtraChildPrice;
        if (updated.WeekendPrice >= 0) roomType.WeekendPrice = updated.WeekendPrice;

        roomType.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(roomType, $"Room type '{roomType.Name}' updated successfully."));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRoomType(string id)
    {
        var roomType = await _db.RoomTypes
            .Include(rt => rt.Rooms)
            .FirstOrDefaultAsync(rt => rt.Id == id);

        if (roomType == null)
        {
            return NotFound(ApiResponse.Fail("Room type not found."));
        }

        if (roomType.Rooms.Any())
        {
            return BadRequest(ApiResponse.Fail($"Cannot delete room type '{roomType.Name}' because it has {roomType.Rooms.Count} physical rooms assigned."));
        }

        _db.RoomTypes.Remove(roomType);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new { id }, $"Room type '{roomType.Name}' deleted successfully."));
    }
}

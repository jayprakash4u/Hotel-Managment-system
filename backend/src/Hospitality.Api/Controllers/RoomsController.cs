using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/rooms")]
public class RoomsController : ControllerBase
{
    private readonly HospitalityDbContext _db;

    public RoomsController(HospitalityDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetRooms(
        [FromQuery] string? floor,
        [FromQuery] string? status,
        [FromQuery] string? type,
        [FromQuery] string? setupStatus,
        [FromQuery] string? acFilter)
    {
        var query = _db.Rooms
            .Include(r => r.RoomType)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(floor) && int.TryParse(floor, out int f))
        {
            query = query.Where(r => r.Floor == f);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(r => r.Status.ToUpper() == status.ToUpper());
        }

        if (!string.IsNullOrWhiteSpace(type))
        {
            query = query.Where(r => r.Type.ToLower().Contains(type.ToLower()));
        }

        if (!string.IsNullOrWhiteSpace(setupStatus))
        {
            query = query.Where(r => r.SetupStatus.ToUpper() == setupStatus.ToUpper());
        }

        if (!string.IsNullOrWhiteSpace(acFilter))
        {
            if (acFilter.Equals("AC", StringComparison.OrdinalIgnoreCase)) query = query.Where(r => r.HasAC);
            else if (acFilter.Equals("Non-AC", StringComparison.OrdinalIgnoreCase)) query = query.Where(r => !r.HasAC);
        }

        var rooms = await query.OrderBy(r => r.Number).ToListAsync();
        return Ok(ApiResponse.Ok(rooms));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetRoomById(string id)
    {
        var room = await _db.Rooms
            .Include(r => r.RoomType)
            .Include(r => r.Reservations.Where(res => res.Status == "CHECKED_IN" || res.Status == "RESERVED"))
            .FirstOrDefaultAsync(r => r.Id == id);

        if (room == null)
        {
            return NotFound(ApiResponse.Fail("Room not found."));
        }

        return Ok(ApiResponse.Ok(room));
    }

    [HttpPost]
    public async Task<IActionResult> CreateRoom([FromBody] Room room)
    {
        if (string.IsNullOrWhiteSpace(room.Number))
        {
            return BadRequest(ApiResponse.Fail("Room number is required."));
        }

        if (string.IsNullOrEmpty(room.HotelId))
        {
            var hotel = await _db.Hotels.FirstOrDefaultAsync();
            room.HotelId = hotel?.Id ?? Guid.NewGuid().ToString("N");
        }

        room.CreatedAt = DateTime.UtcNow;
        room.UpdatedAt = DateTime.UtcNow;

        _db.Rooms.Add(room);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(room, "Room created successfully."));
    }

    public record BatchRoomsRequest(List<Room> Rooms);

    [HttpPost("batch")]
    public async Task<IActionResult> BatchCreateRooms([FromBody] BatchRoomsRequest request)
    {
        if (request.Rooms == null || request.Rooms.Count == 0)
        {
            return BadRequest(ApiResponse.Fail("Rooms list cannot be empty."));
        }

        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? Guid.NewGuid().ToString("N");

        foreach (var room in request.Rooms)
        {
            if (string.IsNullOrEmpty(room.HotelId)) room.HotelId = hotelId;
            room.CreatedAt = DateTime.UtcNow;
            room.UpdatedAt = DateTime.UtcNow;
            _db.Rooms.Add(room);
        }

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new { message = $"{request.Rooms.Count} rooms created successfully.", count = request.Rooms.Count, data = request.Rooms }, $"{request.Rooms.Count} rooms created successfully."));
    }

    public record UpdateRoomStatusRequest(string Status, string? SetupStatus, string? Notes, string? AssignedTo, string? TaskType, string? Priority);

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateRoomStatus(string id, [FromBody] UpdateRoomStatusRequest request)
    {
        var room = await _db.Rooms.FindAsync(id);
        if (room == null)
        {
            return NotFound(ApiResponse.Fail("Room not found."));
        }

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            room.Status = request.Status.ToUpper();
        }

        if (!string.IsNullOrWhiteSpace(request.SetupStatus))
        {
            room.SetupStatus = request.SetupStatus.ToUpper();
        }

        room.UpdatedAt = DateTime.UtcNow;

        // If marked dirty or cleaning, auto-create or update housekeeping task
        if (room.Status == "DIRTY" || room.Status == "CLEANING")
        {
            var task = new HousekeepingTask
            {
                HotelId = room.HotelId,
                RoomId = room.Id,
                AssignedTo = request.AssignedTo,
                TaskType = request.TaskType ?? "FULL_CLEAN",
                Priority = request.Priority ?? "NORMAL",
                Status = room.Status == "CLEANING" ? "IN_PROGRESS" : "PENDING",
                Notes = request.Notes
            };
            _db.HousekeepingTasks.Add(task);
        }

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(room, $"Room {room.Number} status updated to {room.Status}."));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateRoom(string id, [FromBody] Room updated)
    {
        var room = await _db.Rooms.FindAsync(id);
        if (room == null)
        {
            return NotFound(ApiResponse.Fail("Room not found."));
        }

        if (!string.IsNullOrWhiteSpace(updated.Number)) room.Number = updated.Number.Trim();
        if (updated.Floor > 0) room.Floor = updated.Floor;
        if (!string.IsNullOrWhiteSpace(updated.Type)) room.Type = updated.Type;
        if (!string.IsNullOrWhiteSpace(updated.RoomTypeId)) room.RoomTypeId = updated.RoomTypeId;
        room.HasAC = updated.HasAC;
        if (!string.IsNullOrWhiteSpace(updated.BedType)) room.BedType = updated.BedType;
        if (updated.PricePerNight > 0) room.PricePerNight = updated.PricePerNight;
        if (updated.Capacity > 0) room.Capacity = updated.Capacity;
        if (!string.IsNullOrWhiteSpace(updated.SetupStatus)) room.SetupStatus = updated.SetupStatus.ToUpper();
        if (!string.IsNullOrWhiteSpace(updated.Status)) room.Status = updated.Status.ToUpper();
        if (!string.IsNullOrWhiteSpace(updated.Amenities)) room.Amenities = updated.Amenities;
        if (updated.ImageUrl != null) room.ImageUrl = updated.ImageUrl;
        if (updated.Description != null) room.Description = updated.Description;

        // Extended setup attributes
        if (updated.RoomSize != null) room.RoomSize = updated.RoomSize;
        if (updated.RoomView != null) room.RoomView = updated.RoomView;
        if (updated.MaxAdults > 0) room.MaxAdults = updated.MaxAdults;
        if (updated.MaxChildren >= 0) room.MaxChildren = updated.MaxChildren;
        if (updated.SmokingPolicy != null) room.SmokingPolicy = updated.SmokingPolicy;
        if (updated.Accessibility != null) room.Accessibility = updated.Accessibility;
        if (updated.BedConfiguration != null) room.BedConfiguration = updated.BedConfiguration;
        if (updated.BathroomFacilities != null) room.BathroomFacilities = updated.BathroomFacilities;
        if (updated.GalleryImages != null) room.GalleryImages = updated.GalleryImages;
        if (updated.Policies != null) room.Policies = updated.Policies;
        if (updated.ExtraAdultPrice >= 0) room.ExtraAdultPrice = updated.ExtraAdultPrice;
        if (updated.ExtraChildPrice >= 0) room.ExtraChildPrice = updated.ExtraChildPrice;
        if (updated.WeekendPrice >= 0) room.WeekendPrice = updated.WeekendPrice;

        room.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(room, $"Room {room.Number} updated successfully."));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRoom(string id)
    {
        var room = await _db.Rooms
            .Include(r => r.Reservations)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (room == null)
        {
            return NotFound(ApiResponse.Fail("Room not found."));
        }

        var activeReservation = room.Reservations.Any(res => res.Status == "CHECKED_IN" || res.Status == "RESERVED");
        if (activeReservation)
        {
            return BadRequest(ApiResponse.Fail("Cannot delete room with active or reserved bookings. Please checkout or reassign guests first."));
        }

        _db.Rooms.Remove(room);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new { id }, $"Room {room.Number} deleted successfully."));
    }

    [HttpPost("upload-photo")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadRoomPhoto([FromForm] IFormFile? file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(ApiResponse.Fail("No photo file provided."));
        }

        const long maxBytes = 10 * 1024 * 1024; // 10MB
        if (file.Length > maxBytes)
        {
            return BadRequest(ApiResponse.Fail("File size exceeds 10MB limit."));
        }

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp", ".avif" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(ext))
        {
            return BadRequest(ApiResponse.Fail("Invalid image format. Allowed: JPG, PNG, WEBP, AVIF."));
        }

        var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "rooms");
        if (!Directory.Exists(uploadsDir))
        {
            Directory.CreateDirectory(uploadsDir);
        }

        var uniqueFileName = $"{Guid.NewGuid():N}{ext}";
        var filePath = Path.Combine(uploadsDir, uniqueFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var relativeUrl = $"/uploads/rooms/{uniqueFileName}";
        return Ok(ApiResponse.Ok(new { url = relativeUrl, fileName = uniqueFileName, size = file.Length }, "Photo uploaded successfully."));
    }
}

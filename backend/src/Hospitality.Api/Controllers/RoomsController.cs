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

        return Ok(new
        {
            success = true,
            message = $"{request.Rooms.Count} rooms created successfully.",
            count = request.Rooms.Count,
            data = request.Rooms
        });
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
}

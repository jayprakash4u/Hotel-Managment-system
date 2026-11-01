using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/housekeeping")]
public class HousekeepingController : ControllerBase
{
    private readonly HospitalityDbContext _db;

    public HousekeepingController(HospitalityDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetTasks([FromQuery] string? status, [FromQuery] string? priority)
    {
        var query = _db.HousekeepingTasks
            .Include(t => t.Room)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(t => t.Status.ToUpper() == status.ToUpper());
        }

        if (!string.IsNullOrWhiteSpace(priority))
        {
            query = query.Where(t => t.Priority.ToUpper() == priority.ToUpper());
        }

        var tasks = await query.OrderByDescending(t => t.CreatedAt).ToListAsync();
        return Ok(ApiResponse.Ok(tasks));
    }

    [HttpPost]
    public async Task<IActionResult> CreateTask([FromBody] HousekeepingTask task)
    {
        if (string.IsNullOrEmpty(task.HotelId))
        {
            var hotel = await _db.Hotels.FirstOrDefaultAsync();
            task.HotelId = hotel?.Id ?? Guid.NewGuid().ToString("N");
        }

        task.CreatedAt = DateTime.UtcNow;
        task.UpdatedAt = DateTime.UtcNow;

        _db.HousekeepingTasks.Add(task);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(task, "Housekeeping task created successfully."));
    }

    public record UpdateTaskRequest(string Id, string? Status, string? Notes, string? AssignedTo);

    [HttpPatch]
    public async Task<IActionResult> UpdateTask([FromBody] UpdateTaskRequest req)
    {
        var task = await _db.HousekeepingTasks
            .Include(t => t.Room)
            .FirstOrDefaultAsync(t => t.Id == req.Id);

        if (task == null)
        {
            return NotFound(ApiResponse.Fail("Task not found."));
        }

        if (!string.IsNullOrWhiteSpace(req.Status))
        {
            task.Status = req.Status.ToUpper();
            if (task.Status == "COMPLETED")
            {
                task.CompletedAt = DateTime.UtcNow;
                if (task.Room != null && task.Room.Status != "OCCUPIED")
                {
                    task.Room.Status = "AVAILABLE";
                }
            }
        }

        if (!string.IsNullOrWhiteSpace(req.AssignedTo)) task.AssignedTo = req.AssignedTo;
        if (!string.IsNullOrWhiteSpace(req.Notes)) task.Notes = req.Notes;
        task.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(task, "Housekeeping task updated."));
    }
}

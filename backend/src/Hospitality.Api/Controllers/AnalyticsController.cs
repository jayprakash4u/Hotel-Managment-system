using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/analytics")]
public class AnalyticsController : ControllerBase
{
    private readonly HospitalityDbContext _db;

    public AnalyticsController(HospitalityDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAnalytics()
    {
        var totalRooms = await _db.Rooms.CountAsync();
        var occupiedRooms = await _db.Rooms.CountAsync(r => r.Status == "OCCUPIED");
        var availableRooms = await _db.Rooms.CountAsync(r => r.Status == "AVAILABLE");
        var dirtyRooms = await _db.Rooms.CountAsync(r => r.Status == "DIRTY" || r.Status == "CLEANING");

        var occupancyRate = totalRooms > 0 ? Math.Round((double)occupiedRooms / totalRooms * 100, 1) : 0;

        var activeReservations = await _db.Reservations
            .CountAsync(r => r.Status == "CHECKED_IN" || r.Status == "RESERVED");

        var totalRevenue = await _db.Reservations.SumAsync(r => (double?)r.PaidAmount) ?? 0;
        var pendingHousekeeping = await _db.HousekeepingTasks.CountAsync(t => t.Status == "PENDING" || t.Status == "IN_PROGRESS");
        var openMaintenance = await _db.MaintenanceTickets.CountAsync(t => t.Status == "OPEN" || t.Status == "IN_PROGRESS");

        return Ok(ApiResponse.Ok(new
        {
            totalRooms,
            occupiedRooms,
            availableRooms,
            dirtyRooms,
            occupancyRate,
            activeReservations,
            totalRevenue,
            pendingHousekeeping,
            openMaintenance
        }));
    }
}

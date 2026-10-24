using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/maintenance")]
public class MaintenanceController : ControllerBase
{
    private readonly HospitalityDbContext _db;

    public MaintenanceController(HospitalityDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetTickets([FromQuery] string? status, [FromQuery] string? category)
    {
        var query = _db.MaintenanceTickets
            .Include(t => t.Room)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(t => t.Status.ToUpper() == status.ToUpper());
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(t => t.Category.ToUpper() == category.ToUpper());
        }

        var tickets = await query.OrderByDescending(t => t.ReportedAt).ToListAsync();
        return Ok(ApiResponse.Ok(tickets));
    }

    [HttpPost]
    public async Task<IActionResult> CreateTicket([FromBody] MaintenanceTicket ticket)
    {
        if (string.IsNullOrEmpty(ticket.HotelId))
        {
            var hotel = await _db.Hotels.FirstOrDefaultAsync();
            ticket.HotelId = hotel?.Id ?? Guid.NewGuid().ToString("N");
        }

        if (string.IsNullOrEmpty(ticket.TicketCode))
        {
            ticket.TicketCode = $"MNT-{Random.Shared.Next(1000, 9999)}";
        }

        ticket.ReportedAt = DateTime.UtcNow;
        ticket.UpdatedAt = DateTime.UtcNow;

        _db.MaintenanceTickets.Add(ticket);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(ticket, "Maintenance ticket created successfully."));
    }

    public record UpdateTicketRequest(string Id, string? Status, string? AssignedTo, string? Description);

    [HttpPatch]
    public async Task<IActionResult> UpdateTicket([FromBody] UpdateTicketRequest req)
    {
        var ticket = await _db.MaintenanceTickets.FindAsync(req.Id);
        if (ticket == null)
        {
            return NotFound(ApiResponse.Fail("Ticket not found."));
        }

        if (!string.IsNullOrWhiteSpace(req.Status))
        {
            ticket.Status = req.Status.ToUpper();
            if (ticket.Status == "RESOLVED")
            {
                ticket.ResolvedAt = DateTime.UtcNow;
            }
        }

        if (!string.IsNullOrWhiteSpace(req.AssignedTo)) ticket.AssignedTo = req.AssignedTo;
        if (!string.IsNullOrWhiteSpace(req.Description)) ticket.Description = req.Description;
        ticket.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(ticket, "Maintenance ticket updated."));
    }
}

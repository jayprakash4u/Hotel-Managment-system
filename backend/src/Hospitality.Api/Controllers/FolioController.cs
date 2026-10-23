using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/folio")]
public class FolioController : ControllerBase
{
    private readonly HospitalityDbContext _db;

    public FolioController(HospitalityDbContext db)
    {
        _db = db;
    }

    public record AddFolioItemRequest(
        string ReservationId,
        string Outlet,
        string Description,
        double UnitPrice,
        int? Quantity,
        string? BilledBy
    );

    [HttpPost]
    public async Task<IActionResult> AddFolioItem([FromBody] AddFolioItemRequest req)
    {
        var reservation = await _db.Reservations.FindAsync(req.ReservationId);
        if (reservation == null)
        {
            return NotFound(ApiResponse.Fail("Reservation not found."));
        }

        var qty = req.Quantity > 0 ? req.Quantity.Value : 1;
        var total = req.UnitPrice * qty;

        var item = new FolioItem
        {
            ReservationId = req.ReservationId,
            Outlet = req.Outlet ?? "ROOM_CHARGE",
            Description = req.Description,
            UnitPrice = req.UnitPrice,
            Quantity = qty,
            Total = total,
            BilledAt = DateTime.UtcNow,
            BilledBy = req.BilledBy
        };

        _db.FolioItems.Add(item);
        reservation.TotalAmount += total;
        reservation.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(item, "Charge added to guest folio successfully."));
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteFolioItem([FromQuery] string id)
    {
        var item = await _db.FolioItems.FindAsync(id);
        if (item == null)
        {
            return NotFound(ApiResponse.Fail("Folio item not found."));
        }

        var reservation = await _db.Reservations.FindAsync(item.ReservationId);
        if (reservation != null)
        {
            reservation.TotalAmount -= item.Total;
            reservation.UpdatedAt = DateTime.UtcNow;
        }

        _db.FolioItems.Remove(item);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok("Folio item removed."));
    }
}

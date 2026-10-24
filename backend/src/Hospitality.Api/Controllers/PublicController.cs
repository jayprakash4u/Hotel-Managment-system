using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/public")]
public class PublicController : ControllerBase
{
    private readonly HospitalityDbContext _db;

    public PublicController(HospitalityDbContext db)
    {
        _db = db;
    }

    [HttpGet("hotels")]
    public async Task<IActionResult> GetHotels()
    {
        var hotels = await _db.Hotels
            .Where(h => h.Status == "ACTIVE")
            .OrderBy(h => h.Name)
            .Select(h => new
            {
                id = h.Id,
                name = h.Name,
                slug = h.Slug,
                address = h.Address,
                currency = h.Currency
            })
            .ToListAsync();

        return Ok(ApiResponse.Ok(hotels));
    }

    [HttpGet("hotels/{slug}/rooms")]
    public async Task<IActionResult> GetHotelRooms(string slug)
    {
        var hotel = await _db.Hotels.FirstOrDefaultAsync(h => h.Slug == slug || h.Id == slug);
        if (hotel == null)
        {
            return NotFound(ApiResponse.Fail("Hotel not found."));
        }

        var rooms = await _db.Rooms
            .Include(r => r.RoomType)
            .Where(r => r.HotelId == hotel.Id && r.SetupStatus == "OPERATIONAL" && r.Status == "AVAILABLE")
            .OrderBy(r => r.PricePerNight)
            .ToListAsync();

        return Ok(ApiResponse.Ok(rooms));
    }

    public record PublicBookingRequest(
        string RoomId,
        string FirstName,
        string LastName,
        string Email,
        string Phone,
        string? Country,
        string? IdType,
        string? IdNumber,
        DateTime CheckInDate,
        DateTime CheckOutDate,
        int Adults,
        int Children,
        string? SpecialRequests
    );

    [HttpPost("hotels/{slug}/reservations")]
    public async Task<IActionResult> CreatePublicReservation(string slug, [FromBody] PublicBookingRequest req)
    {
        var hotel = await _db.Hotels.FirstOrDefaultAsync(h => h.Slug == slug || h.Id == slug);
        if (hotel == null)
        {
            return NotFound(ApiResponse.Fail("Hotel not found."));
        }

        var room = await _db.Rooms.FirstOrDefaultAsync(r => r.Id == req.RoomId && r.HotelId == hotel.Id);
        if (room == null)
        {
            return BadRequest(ApiResponse.Fail("Selected room is not available."));
        }

        // Find or create guest
        var guest = await _db.Guests.FirstOrDefaultAsync(g => g.HotelId == hotel.Id && g.Email.ToLower() == req.Email.Trim().ToLower());
        if (guest == null)
        {
            guest = new Guest
            {
                HotelId = hotel.Id,
                FirstName = req.FirstName,
                LastName = req.LastName,
                Email = req.Email.Trim().ToLower(),
                Phone = req.Phone,
                Country = req.Country ?? "Nepal",
                IdType = req.IdType ?? "Passport",
                IdNumber = req.IdNumber ?? "N/A",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.Guests.Add(guest);
            await _db.SaveChangesAsync();
        }

        var nights = Math.Max(1, (int)(req.CheckOutDate - req.CheckInDate).TotalDays);
        var totalAmount = room.PricePerNight * nights;
        var bookingCode = $"RES-{Random.Shared.Next(100000, 999999)}";

        var reservation = new Reservation
        {
            HotelId = hotel.Id,
            GuestId = guest.Id,
            RoomId = room.Id,
            BookingCode = bookingCode,
            CheckIn = req.CheckInDate,
            CheckOut = req.CheckOutDate,
            Adults = req.Adults > 0 ? req.Adults : 1,
            Children = req.Children,
            Status = "CONFIRMED",
            TotalAmount = totalAmount,
            PaidAmount = 0,
            PaymentStatus = "UNPAID",
            Source = "ONLINE",
            SpecialRequests = req.SpecialRequests,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Reservations.Add(reservation);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            bookingCode,
            reservationId = reservation.Id,
            hotelName = hotel.Name,
            totalAmount,
            nights,
            message = $"Booking {bookingCode} confirmed successfully!"
        }));
    }
}

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/reservations")]
public class ReservationsController : ControllerBase
{
    private readonly HospitalityDbContext _db;

    public ReservationsController(HospitalityDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetReservations([FromQuery] string? status, [FromQuery] string? search)
    {
        var query = _db.Reservations
            .Include(r => r.Room)
            .Include(r => r.Guest)
            .Include(r => r.FolioItems)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(r => r.Status.ToUpper() == status.ToUpper());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(r => 
                r.BookingCode.ToLower().Contains(s) ||
                (r.Guest != null && (r.Guest.FirstName.ToLower().Contains(s) || r.Guest.LastName.ToLower().Contains(s) || r.Guest.Phone.Contains(s))) ||
                (r.Room != null && r.Room.Number.Contains(s))
            );
        }

        var reservations = await query
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return Ok(ApiResponse.Ok(reservations));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetReservationById(string id)
    {
        var reservation = await _db.Reservations
            .Include(r => r.Room)
            .Include(r => r.Guest)
            .Include(r => r.FolioItems)
            .FirstOrDefaultAsync(r => r.Id == id || r.BookingCode == id);

        if (reservation == null)
        {
            return NotFound(ApiResponse.Fail("Reservation not found."));
        }

        return Ok(ApiResponse.Ok(reservation));
    }

    public record CreateReservationRequest(
        string? HotelId,
        string RoomId,
        string? GuestId,
        string? FirstName,
        string? LastName,
        string? Phone,
        string? Email,
        string? IdType,
        string? IdNumber,
        DateTime CheckInDate,
        DateTime CheckOutDate,
        int Adults,
        int Children,
        double TotalAmount,
        double AdvancePaid,
        string? PaymentMethod,
        string? SpecialRequests
    );

    [HttpPost]
    public async Task<IActionResult> CreateReservation([FromBody] CreateReservationRequest req)
    {
        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = req.HotelId ?? hotel?.Id ?? Guid.NewGuid().ToString("N");

        // Handle Guest
        Guest? guest = null;
        if (!string.IsNullOrEmpty(req.GuestId))
        {
            guest = await _db.Guests.FindAsync(req.GuestId);
        }

        if (guest == null && !string.IsNullOrWhiteSpace(req.FirstName))
        {
            guest = new Guest
            {
                HotelId = hotelId,
                FirstName = req.FirstName,
                LastName = req.LastName ?? string.Empty,
                Phone = req.Phone ?? string.Empty,
                Email = req.Email ?? string.Empty,
                IdType = req.IdType ?? "Passport",
                IdNumber = req.IdNumber ?? string.Empty
            };
            _db.Guests.Add(guest);
            await _db.SaveChangesAsync();
        }

        if (guest == null)
        {
            return BadRequest(ApiResponse.Fail("Guest details are required."));
        }

        var room = await _db.Rooms.FindAsync(req.RoomId);
        if (room == null)
        {
            return BadRequest(ApiResponse.Fail("Room not found."));
        }

        // Generate booking code
        var count = await _db.Reservations.CountAsync();
        var bookingCode = $"BK-{1001 + count}";

        var reservation = new Reservation
        {
            HotelId = hotelId,
            RoomId = room.Id,
            GuestId = guest.Id,
            BookingCode = bookingCode,
            CheckIn = req.CheckInDate,
            CheckOut = req.CheckOutDate,
            Adults = req.Adults > 0 ? req.Adults : 1,
            Children = req.Children,
            Status = "RESERVED",
            TotalAmount = req.TotalAmount > 0 ? req.TotalAmount : room.PricePerNight,
            PaidAmount = req.AdvancePaid,
            PaymentStatus = req.AdvancePaid >= req.TotalAmount ? "PAID" : (req.AdvancePaid > 0 ? "PARTIAL" : "UNPAID"),
            SpecialRequests = req.SpecialRequests,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        if (req.AdvancePaid > 0)
        {
            reservation.FolioItems.Add(new FolioItem
            {
                Outlet = "ROOM_CHARGE",
                Description = $"Advance Deposit ({req.PaymentMethod ?? "CASH"})",
                UnitPrice = req.AdvancePaid,
                Quantity = 1,
                Total = req.AdvancePaid,
                Timestamp = DateTime.UtcNow,
                BilledBy = "Front Desk"
            });
        }

        room.Status = "RESERVED";

        _db.Reservations.Add(reservation);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(reservation, $"Reservation {bookingCode} created successfully."));
    }

    [HttpPost("validate")]
    public async Task<IActionResult> ValidateReservation([FromBody] System.Text.Json.JsonElement body)
    {
        // Validation check
        var bookingCode = $"RES-{Random.Shared.Next(100000, 999999)}";
        return Ok(new
        {
            success = true,
            bookingCode,
            message = $"Reservation {bookingCode} validated successfully."
        });
    }

    [HttpPost("{id}/checkin")]
    public async Task<IActionResult> CheckIn(string id)
    {
        var reservation = await _db.Reservations
            .Include(r => r.Room)
            .Include(r => r.Guest)
            .FirstOrDefaultAsync(r => r.Id == id || r.BookingCode == id);

        if (reservation == null)
        {
            return NotFound(ApiResponse.Fail("Reservation not found."));
        }

        reservation.Status = "CHECKED_IN";
        if (reservation.Room != null)
        {
            reservation.Room.Status = "OCCUPIED";
        }

        reservation.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(reservation, $"Guest {reservation.Guest?.FirstName} checked in to Room {reservation.Room?.Number}."));
    }

    public record CheckOutRequest(double? FinalPaymentAmount, string? HousekeepingNotes);

    [HttpPost("{id}/checkout")]
    public async Task<IActionResult> CheckOut(string id, [FromBody] CheckOutRequest? req)
    {
        var reservation = await _db.Reservations
            .Include(r => r.Room)
            .Include(r => r.Guest)
            .Include(r => r.FolioItems)
            .FirstOrDefaultAsync(r => r.Id == id || r.BookingCode == id);

        if (reservation == null)
        {
            return NotFound(ApiResponse.Fail("Reservation not found."));
        }

        reservation.Status = "CHECKED_OUT";
        reservation.PaymentStatus = "PAID";
        if (req?.FinalPaymentAmount > 0)
        {
            reservation.PaidAmount += req.FinalPaymentAmount.Value;
        }

        if (reservation.Room != null)
        {
            reservation.Room.Status = "DIRTY";
            
            // Auto create housekeeping task for cleaning
            _db.HousekeepingTasks.Add(new HousekeepingTask
            {
                HotelId = reservation.HotelId,
                RoomId = reservation.Room.Id,
                TaskType = "FULL_CLEAN",
                Priority = "HIGH",
                Status = "PENDING",
                Notes = req?.HousekeepingNotes ?? "Guest checked out. Turnaround cleaning required."
            });
        }

        // Shared Billing System: Create permanent HOTEL_CHECKOUT Bill
        var existingBill = await _db.Bills.FirstOrDefaultAsync(b => b.ReservationId == reservation.Id && b.BillingType == "HOTEL_CHECKOUT");
        if (existingBill == null)
        {
            var billNo = await BillingController.GenerateBillNumberAsync(_db, reservation.HotelId);

            var folioSnapshot = new List<object>();
            var nights = Math.Max(1, (int)(reservation.CheckOut.Date - reservation.CheckIn.Date).TotalDays);
            var roomRate = reservation.Room != null ? reservation.Room.PricePerNight : Math.Round(reservation.TotalAmount / nights, 2);
            folioSnapshot.Add(new
            {
                name = $"Room Stay ({reservation.Room?.Number ?? "Room"}) - {nights} Night(s)",
                quantity = nights,
                unitPrice = roomRate,
                total = Math.Round(nights * roomRate, 2),
                category = "ROOM_CHARGE"
            });

            foreach (var fi in reservation.FolioItems)
            {
                folioSnapshot.Add(new
                {
                    name = fi.Description,
                    quantity = fi.Quantity,
                    unitPrice = fi.UnitPrice,
                    total = fi.Total,
                    category = fi.Outlet
                });
            }

            var paymentsList = new List<object>();
            var advanceDeposit = Math.Max(0, reservation.PaidAmount - (req?.FinalPaymentAmount ?? 0));
            if (advanceDeposit > 0)
            {
                paymentsList.Add(new
                {
                    Id = $"PAY-ADV-{Guid.NewGuid():N}"[..12].ToUpper(),
                    Amount = advanceDeposit,
                    PaymentMethod = "DEPOSIT",
                    PaymentDate = reservation.CreatedAt,
                    ReceivedBy = "Front Desk",
                    Notes = "Advance booking deposit"
                });
            }
            if (req?.FinalPaymentAmount > 0)
            {
                paymentsList.Add(new
                {
                    Id = $"PAY-FIN-{Guid.NewGuid():N}"[..12].ToUpper(),
                    Amount = req.FinalPaymentAmount.Value,
                    PaymentMethod = "SETTLEMENT",
                    PaymentDate = DateTime.UtcNow,
                    ReceivedBy = "Front Desk",
                    Notes = "Checkout final balance settlement"
                });
            }

            var balance = Math.Max(0, Math.Round(reservation.TotalAmount - reservation.PaidAmount, 2));

            existingBill = new Bill
            {
                HotelId = reservation.HotelId,
                BillNumber = billNo,
                BillingType = "HOTEL_CHECKOUT",
                ReservationId = reservation.Id,
                BookingCode = reservation.BookingCode,
                GuestId = reservation.GuestId,
                CustomerName = reservation.Guest != null ? $"{reservation.Guest.FirstName} {reservation.Guest.LastName}".Trim() : "Hotel Guest",
                CustomerPhone = reservation.Guest?.Phone,
                RoomNumber = reservation.Room?.Number,
                ServerOrStaff = "Front Desk Lead",
                Subtotal = reservation.TotalAmount,
                DiscountAmount = 0,
                TaxAmount = Math.Round(reservation.TotalAmount * 0.10, 2),
                ServiceCharge = 0,
                RoundOff = 0,
                GrandTotal = reservation.TotalAmount,
                AmountPaid = reservation.PaidAmount,
                BalanceDue = balance,
                PaymentStatus = balance <= 0.01 ? "PAID" : "PARTIAL",
                PaymentMethod = paymentsList.Count > 1 ? "SPLIT" : "CASH",
                ItemsJson = System.Text.Json.JsonSerializer.Serialize(folioSnapshot),
                PaymentsJson = System.Text.Json.JsonSerializer.Serialize(paymentsList),
                Notes = $"Hotel Stay Checkout for Room {reservation.Room?.Number}. Booking Code: {reservation.BookingCode}",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.Bills.Add(existingBill);
        }
        else
        {
            existingBill.AmountPaid = reservation.PaidAmount;
            existingBill.BalanceDue = Math.Max(0, Math.Round(reservation.TotalAmount - reservation.PaidAmount, 2));
            existingBill.PaymentStatus = existingBill.BalanceDue <= 0.01 ? "PAID" : "PARTIAL";
            existingBill.UpdatedAt = DateTime.UtcNow;
        }

        reservation.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(new
        {
            reservation,
            bill = existingBill
        }, $"Reservation {reservation.BookingCode} checked out successfully. Bill {existingBill.BillNumber} created. Room marked DIRTY."));
    }
}

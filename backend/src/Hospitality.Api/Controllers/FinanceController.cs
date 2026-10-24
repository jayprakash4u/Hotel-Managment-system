using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hospitality.Application.Common.Models;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/finance")]
public class FinanceController : ControllerBase
{
    private readonly HospitalityDbContext _db;

    public FinanceController(HospitalityDbContext db)
    {
        _db = db;
    }

    [HttpGet("expenses")]
    public async Task<IActionResult> GetExpenses()
    {
        var expenses = await _db.Expenses
            .OrderByDescending(e => e.Date)
            .ToListAsync();

        return Ok(ApiResponse.Ok(expenses));
    }

    [HttpPost("expenses")]
    public async Task<IActionResult> CreateExpense([FromBody] Expense expense)
    {
        if (expense.Amount <= 0)
        {
            return BadRequest(ApiResponse.Fail("Expense amount must be greater than zero."));
        }

        if (string.IsNullOrEmpty(expense.HotelId))
        {
            var hotel = await _db.Hotels.FirstOrDefaultAsync();
            expense.HotelId = hotel?.Id ?? Guid.NewGuid().ToString("N");
        }

        if (string.IsNullOrEmpty(expense.ExpenseCode))
        {
            expense.ExpenseCode = $"EXP-{Random.Shared.Next(1000, 9999)}";
        }

        if (expense.Date == default)
        {
            expense.Date = DateTime.UtcNow;
        }

        _db.Expenses.Add(expense);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok(expense, "Expense logged successfully."));
    }

    [HttpGet("cash-register")]
    public async Task<IActionResult> GetCashRegister()
    {
        var active = await _db.CashRegisters
            .Where(r => r.Status == "OPEN")
            .OrderByDescending(r => r.OpenedAt)
            .FirstOrDefaultAsync();

        var registers = await _db.CashRegisters
            .OrderByDescending(r => r.OpenedAt)
            .Take(20)
            .ToListAsync();

        return Ok(ApiResponse.Ok(new
        {
            active,
            registers
        }));
    }

    public record ShiftRequest(string Action, string Shift, string CashierName, double OpeningFloat, double? ClosingCash, string? Id);

    [HttpPost("cash-register")]
    public async Task<IActionResult> ManageCashRegister([FromBody] ShiftRequest req)
    {
        var hotel = await _db.Hotels.FirstOrDefaultAsync();
        var hotelId = hotel?.Id ?? Guid.NewGuid().ToString("N");

        if (req.Action.Equals("CLOSE", StringComparison.OrdinalIgnoreCase))
        {
            CashRegister? register = null;
            if (!string.IsNullOrEmpty(req.Id))
            {
                register = await _db.CashRegisters.FindAsync(req.Id);
            }
            register ??= await _db.CashRegisters
                .Where(r => r.Status == "OPEN")
                .OrderByDescending(r => r.OpenedAt)
                .FirstOrDefaultAsync();

            if (register == null)
            {
                return NotFound(ApiResponse.Fail("No open register found to close."));
            }

            register.Status = "CLOSED";
            register.ClosedAt = DateTime.UtcNow;
            if (req.ClosingCash.HasValue)
            {
                register.ClosingCash = req.ClosingCash.Value;
            }

            await _db.SaveChangesAsync();
            return Ok(ApiResponse.Ok(register, "Shift closed and reconciled."));
        }
        else
        {
            // Open shift
            var register = new CashRegister
            {
                HotelId = hotelId,
                Shift = req.Shift ?? "Morning (07:00-15:30)",
                CashierName = req.CashierName ?? "Cashier",
                OpeningFloat = req.OpeningFloat > 0 ? req.OpeningFloat : 500.0,
                Status = "OPEN",
                OpenedAt = DateTime.UtcNow
            };

            _db.CashRegisters.Add(register);
            await _db.SaveChangesAsync();
            return Ok(ApiResponse.Ok(register, "Shift float opened."));
        }
    }
}

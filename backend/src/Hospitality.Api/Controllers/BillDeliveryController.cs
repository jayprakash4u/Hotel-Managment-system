using Microsoft.AspNetCore.Mvc;
using Hospitality.Api.Services;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace Hospitality.Api.Controllers;

[ApiController]
[Route("api/bill-delivery")]
public class BillDeliveryController : ControllerBase
{
    private readonly HospitalityDbContext _db;
    private readonly EmailService _emailService;
    private readonly InvoicePdfService _pdfService;

    public BillDeliveryController(HospitalityDbContext db, EmailService emailService, InvoicePdfService pdfService)
    {
        _db = db;
        _emailService = emailService;
        _pdfService = pdfService;
    }

    [HttpPost("generate-pdf")]
    public async Task<IActionResult> GeneratePdf([FromBody] GeneratePdfRequest request)
    {
        var bill = await _db.Bills.FirstOrDefaultAsync(b => b.Id == request.BillId || b.BillNumber == request.BillId);
        if (bill == null) return NotFound(new { message = "Bill not found" });

        var items = System.Text.Json.JsonSerializer.Deserialize<List<BillItemDto>>(bill.ItemsJson) ?? new();
        var pdfBytes = _pdfService.GenerateInvoicePdf(
            request.RestaurantName ?? "Restaurant",
            bill.BillNumber,
            bill.CreatedAt,
            bill.CustomerName,
            bill.CustomerPhone,
            items.Select(i => (i.ProductName ?? i.Name ?? "Item", i.Quantity, i.UnitPrice, i.Total)).ToList(),
            bill.Subtotal,
            bill.DiscountAmount,
            bill.TaxAmount,
            bill.ServiceCharge,
            bill.GrandTotal,
            bill.PaymentMethod,
            bill.PaymentStatus
        );

        return File(pdfBytes, "application/pdf", $"{bill.BillNumber}.pdf");
    }

    [HttpPost("email")]
    public async Task<IActionResult> SendEmail([FromBody] SendEmailRequest request)
    {
        var bill = await _db.Bills.FirstOrDefaultAsync(b => b.Id == request.BillId || b.BillNumber == request.BillId);
        if (bill == null) return NotFound(new { message = "Bill not found" });

        var items = System.Text.Json.JsonSerializer.Deserialize<List<BillItemDto>>(bill.ItemsJson) ?? new();
        var pdfBytes = _pdfService.GenerateInvoicePdf(
            request.RestaurantName ?? "Restaurant",
            bill.BillNumber,
            bill.CreatedAt,
            bill.CustomerName,
            bill.CustomerPhone,
            items.Select(i => (i.ProductName ?? i.Name ?? "Item", i.Quantity, i.UnitPrice, i.Total)).ToList(),
            bill.Subtotal,
            bill.DiscountAmount,
            bill.TaxAmount,
            bill.ServiceCharge,
            bill.GrandTotal,
            bill.PaymentMethod,
            bill.PaymentStatus
        );

        var (success, error) = await _emailService.SendEmailAsync(
            request.Email,
            $"Your Bill {bill.BillNumber}",
            $"Dear {bill.CustomerName ?? "Customer"},\n\nThank you for visiting {request.RestaurantName ?? "our restaurant"}.\n\nYour bill {bill.BillNumber} for {bill.GrandTotal:N2} is ready.\n\nPayment Method: {bill.PaymentMethod}\nPayment Status: {bill.PaymentStatus}\n\nThank you!",
            pdfBytes,
            $"{bill.BillNumber}.pdf"
        );

        // Record delivery attempt
        var delivery = new BillDelivery
        {
            HotelId = bill.HotelId,
            BillId = bill.Id,
            DeliveryMethod = "EMAIL",
            RecipientEmail = request.Email,
            Status = success ? "SENT" : "FAILED",
            ErrorDetails = error,
            CompletedAt = success ? DateTime.UtcNow : null
        };
        _db.BillDeliveries.Add(delivery);
        await _db.SaveChangesAsync();

        if (success)
            return Ok(new { message = "Email sent successfully", deliveryId = delivery.Id });
        return BadRequest(new { message = error ?? "Failed to send email" });
    }

    [HttpPost("record-delivery")]
    public async Task<IActionResult> RecordDelivery([FromBody] RecordDeliveryRequest request)
    {
        var delivery = new BillDelivery
        {
            HotelId = request.HotelId ?? "",
            BillId = request.BillId,
            DeliveryMethod = request.DeliveryMethod,
            RecipientPhone = request.RecipientPhone,
            RecipientEmail = request.RecipientEmail,
            Status = request.Status ?? "PENDING",
            ErrorDetails = request.ErrorDetails
        };
        _db.BillDeliveries.Add(delivery);
        await _db.SaveChangesAsync();
        return Ok(new { deliveryId = delivery.Id });
    }

    [HttpGet("history/{billId}")]
    public async Task<IActionResult> GetDeliveryHistory(string billId)
    {
        var history = await _db.BillDeliveries
            .Where(d => d.BillId == billId)
            .OrderByDescending(d => d.AttemptedAt)
            .ToListAsync();
        return Ok(history);
    }
}

public class GeneratePdfRequest
{
    public string BillId { get; set; } = string.Empty;
    public string? RestaurantName { get; set; }
}

public class SendEmailRequest
{
    public string BillId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? RestaurantName { get; set; }
}

public class RecordDeliveryRequest
{
    public string BillId { get; set; } = string.Empty;
    public string? HotelId { get; set; }
    public string DeliveryMethod { get; set; } = string.Empty;
    public string? RecipientPhone { get; set; }
    public string? RecipientEmail { get; set; }
    public string? Status { get; set; }
    public string? ErrorDetails { get; set; }
}

public class BillItemDto
{
    public string? ProductName { get; set; }
    public string? Name { get; set; }
    public int Quantity { get; set; }
    public double UnitPrice { get; set; }
    public double Total { get; set; }
}

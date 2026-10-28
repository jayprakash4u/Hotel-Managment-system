using Microsoft.EntityFrameworkCore;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Api.Services;

public class TableReservationAlertService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<TableReservationAlertService> _logger;
    private static readonly TimeSpan CheckInterval = TimeSpan.FromSeconds(20);

    public TableReservationAlertService(
        IServiceScopeFactory scopeFactory,
        ILogger<TableReservationAlertService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("TableReservationAlertService background scheduler started.");

        // Brief delay on startup to allow database initialization and schema migration to complete
        await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessReservationAlertsAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while processing table reservation alerts.");
            }

            try
            {
                await Task.Delay(CheckInterval, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }

        _logger.LogInformation("TableReservationAlertService background scheduler stopped.");
    }

    public async Task ProcessReservationAlertsAsync(CancellationToken cancellationToken = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HospitalityDbContext>();

        var hotels = await db.Hotels.AsNoTracking().ToListAsync(cancellationToken);
        if (hotels.Count == 0) return;

        var nowUtc = DateTime.UtcNow;

        foreach (var hotel in hotels)
        {
            if (cancellationToken.IsCancellationRequested) break;

            var hotelTz = ResolveTimeZone(hotel.Timezone);
            var nowHotelLocal = TimeZoneInfo.ConvertTimeFromUtc(nowUtc, hotelTz);

            // Look for reservations around today (from yesterday to tomorrow in local date)
            var minDate = nowHotelLocal.Date.AddDays(-1);
            var maxDate = nowHotelLocal.Date.AddDays(1);

            var activeReservations = await db.TableReservations
                .Include(r => r.Table)
                .Where(r => r.HotelId == hotel.Id &&
                            r.TableId != null &&
                            (r.Status == "CONFIRMED" || r.Status == "PENDING" || r.Status == "SEATED") &&
                            r.ReservationDate >= minDate &&
                            r.ReservationDate <= maxDate)
                .ToListAsync(cancellationToken);

            if (activeReservations.Count == 0) continue;

            // Load existing alerts for these reservations
            var reservationIds = activeReservations.Select(r => r.Id).ToList();
            var existingAlerts = await db.ReservationAlerts
                .Where(a => reservationIds.Contains(a.ReservationId))
                .ToListAsync(cancellationToken);

            // Fetch table active orders to accurately verify table occupancy
            var tableIds = activeReservations.Where(r => !string.IsNullOrEmpty(r.TableId)).Select(r => r.TableId!).Distinct().ToList();
            var activeOrders = await db.RestaurantOrders
                .Where(o => tableIds.Contains(o.TableId!) && o.Status != "COMPLETED" && o.Status != "CANCELLED")
                .Select(o => o.TableId)
                .ToListAsync(cancellationToken);

            var occupiedTableIds = new HashSet<string>(activeOrders.Where(id => id != null)!);

            bool dbChanged = false;

            foreach (var res in activeReservations)
            {
                var table = res.Table;
                if (table == null) continue;

                var resStartUtc = GetReservationUtc(res.ReservationDate, res.ReservationTime, hotelTz);
                var durationMinutes = res.DurationMinutes > 0 ? res.DurationMinutes : 120;
                var resEndUtc = resStartUtc.AddMinutes(durationMinutes);
                var prepAlertUtc = resStartUtc.AddMinutes(-15);

                bool isTableOccupied = occupiedTableIds.Contains(table.Id) ||
                                       table.Status == "OCCUPIED" ||
                                       table.Status == "BILLED";

                bool isTableDirty = (table.CleaningStatus ?? "CLEAN").ToUpper() != "CLEAN" ||
                                    table.Status == "OUT_OF_SERVICE";

                // --- Scenario 1: Reservation is already SEATED, COMPLETED, or CANCELLED ---
                if (res.Status == "SEATED")
                {
                    // Acknowledge any active prep/overdue alerts since guests are already seated
                    var activePrepAlerts = existingAlerts
                        .Where(a => a.ReservationId == res.Id && a.Status == "ACTIVE")
                        .ToList();

                    foreach (var a in activePrepAlerts)
                    {
                        a.Status = "ACKNOWLEDGED";
                        a.IsRead = true;
                        a.AcknowledgedBy = "SYSTEM (Guests Seated)";
                        a.AcknowledgedAt = nowUtc;
                        a.UpdatedAt = nowUtc;
                        dbChanged = true;
                    }
                    continue;
                }

                // If reservation is outside relevant time window (already ended), skip
                if (nowUtc > resEndUtc)
                {
                    // If alert was active and never acknowledged, mark as DISMISSED after reservation has concluded
                    var expiredAlerts = existingAlerts
                        .Where(a => a.ReservationId == res.Id && a.Status == "ACTIVE")
                        .ToList();

                    foreach (var a in expiredAlerts)
                    {
                        a.Status = "DISMISSED";
                        a.UpdatedAt = nowUtc;
                        dbChanged = true;
                    }
                    continue;
                }

                // --- Scenario 2: 15-Minute Advance Preparation Alert ---
                // Window: from 15 minutes before reservation start up to reservation start
                if (nowUtc >= prepAlertUtc && nowUtc < resStartUtc)
                {
                    var hasPrepAlert = existingAlerts.Any(a =>
                        a.ReservationId == res.Id &&
                        (a.AlertType == "PREPARATION_15MIN" || a.AlertType == "TABLE_DIRTY") &&
                        a.Status != "CANCELLED");

                    if (!hasPrepAlert)
                    {
                        // Check condition:
                        // "If the reserved table is occupied, show an attention warning so staff can prepare for upcoming booking."
                        // "If it is dirty or otherwise not ready, alert staff to prepare it."
                        // "If the table is already clean and ready, do not send an unnecessary preparation alert."
                        if (isTableOccupied)
                        {
                            var alert = new ReservationAlert
                            {
                                Id = Guid.NewGuid().ToString(),
                                HotelId = hotel.Id,
                                ReservationId = res.Id,
                                TableId = table.Id,
                                AlertType = "PREPARATION_15MIN",
                                ScheduledFor = prepAlertUtc,
                                TriggeredAt = nowUtc,
                                Status = "ACTIVE",
                                Severity = "WARNING",
                                Title = $"Table {table.TableNumber} Reserved in 15 Mins",
                                Message = $"Table {table.TableNumber} is reserved for {res.CustomerName} ({res.PartySize} guests) at {res.ReservationTime}. The table is currently occupied. Please wrap up service and prepare the table for the next guests.",
                                TargetRoles = "MANAGER,WAITER,STAFF,CASHIER",
                                IsRead = false,
                                CreatedAt = nowUtc,
                                UpdatedAt = nowUtc
                            };

                            db.ReservationAlerts.Add(alert);
                            existingAlerts.Add(alert);
                            dbChanged = true;
                            _logger.LogInformation("Generated 15-minute table prep alert for reservation {Code} on occupied table {TableNumber}.",
                                res.ReservationCode, table.TableNumber);
                        }
                        else if (isTableDirty)
                        {
                            var alert = new ReservationAlert
                            {
                                Id = Guid.NewGuid().ToString(),
                                HotelId = hotel.Id,
                                ReservationId = res.Id,
                                TableId = table.Id,
                                AlertType = "TABLE_DIRTY",
                                ScheduledFor = prepAlertUtc,
                                TriggeredAt = nowUtc,
                                Status = "ACTIVE",
                                Severity = "WARNING",
                                Title = $"Table {table.TableNumber} Needs Preparation",
                                Message = $"Table {table.TableNumber} is reserved for {res.CustomerName} ({res.PartySize} guests) at {res.ReservationTime}, but is marked as {table.CleaningStatus}. Please clean and set up the table for the upcoming reservation.",
                                TargetRoles = "MANAGER,WAITER,STAFF",
                                IsRead = false,
                                CreatedAt = nowUtc,
                                UpdatedAt = nowUtc
                            };

                            db.ReservationAlerts.Add(alert);
                            existingAlerts.Add(alert);
                            dbChanged = true;
                            _logger.LogInformation("Generated dirty table preparation alert for reservation {Code} on table {TableNumber}.",
                                res.ReservationCode, table.TableNumber);
                        }
                        else
                        {
                            // Table is clean and ready, do not send unnecessary prep alert.
                            _logger.LogDebug("Table {TableNumber} is clean and ready for reservation {Code}. Suppressing unnecessary prep alert.",
                                table.TableNumber, res.ReservationCode);
                        }
                    }
                }

                // --- Scenario 3: Overdue Warning when reservation time arrives ---
                // "If the table remains occupied when the reservation time arrives, show an overdue warning."
                if (nowUtc >= resStartUtc && nowUtc < resEndUtc)
                {
                    if (isTableOccupied)
                    {
                        var hasOverdueAlert = existingAlerts.Any(a =>
                            a.ReservationId == res.Id &&
                            a.AlertType == "OVERDUE_OCCUPIED" &&
                            a.Status != "CANCELLED");

                        if (!hasOverdueAlert)
                        {
                            var alert = new ReservationAlert
                            {
                                Id = Guid.NewGuid().ToString(),
                                HotelId = hotel.Id,
                                ReservationId = res.Id,
                                TableId = table.Id,
                                AlertType = "OVERDUE_OCCUPIED",
                                ScheduledFor = resStartUtc,
                                TriggeredAt = nowUtc,
                                Status = "ACTIVE",
                                Severity = "DANGER",
                                Title = $"Table {table.TableNumber} Overdue - Currently Occupied",
                                Message = $"Reservation time {res.ReservationTime} for {res.CustomerName} ({res.PartySize} guests) has arrived, but Table {table.TableNumber} is still occupied! Immediate staff turnover or guest seating assistance needed.",
                                TargetRoles = "MANAGER,WAITER,STAFF,CASHIER",
                                IsRead = false,
                                CreatedAt = nowUtc,
                                UpdatedAt = nowUtc
                            };

                            db.ReservationAlerts.Add(alert);
                            existingAlerts.Add(alert);
                            dbChanged = true;
                            _logger.LogWarning("Generated overdue table warning for reservation {Code} on occupied table {TableNumber}.",
                                res.ReservationCode, table.TableNumber);
                        }
                    }
                }
            }

            if (dbChanged)
            {
                await db.SaveChangesAsync(cancellationToken);
            }
        }
    }

    public static DateTime GetReservationUtc(DateTime reservationDate, string reservationTime, TimeZoneInfo hotelTz)
    {
        var baseDate = reservationDate.Date;
        TimeSpan time = TimeSpan.FromHours(19);

        if (TimeSpan.TryParse(reservationTime, out var ts))
        {
            time = ts;
        }
        else if (DateTime.TryParse(reservationTime, out var parsedDt))
        {
            time = parsedDt.TimeOfDay;
        }

        var localDateTime = DateTime.SpecifyKind(baseDate.Add(time), DateTimeKind.Unspecified);
        return TimeZoneInfo.ConvertTimeToUtc(localDateTime, hotelTz);
    }

    public static TimeZoneInfo ResolveTimeZone(string? timezoneId)
    {
        if (string.IsNullOrWhiteSpace(timezoneId))
        {
            return TimeZoneInfo.Utc;
        }

        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(timezoneId);
        }
        catch
        {
            // Windows / Linux IANA aliases
            if (timezoneId.Equals("Asia/Kathmandu", StringComparison.OrdinalIgnoreCase) ||
                timezoneId.Equals("Asia/Katmandu", StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    return TimeZoneInfo.FindSystemTimeZoneById("Nepal Standard Time");
                }
                catch
                {
                    return TimeZoneInfo.Utc;
                }
            }

            if (timezoneId.Equals("America/New_York", StringComparison.OrdinalIgnoreCase))
            {
                try { return TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time"); } catch { }
            }

            return TimeZoneInfo.Utc;
        }
    }
}

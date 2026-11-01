using Microsoft.EntityFrameworkCore;
using Hospitality.Domain.Entities;

namespace Hospitality.Persistence.Data;

public class HospitalityDbContext : DbContext
{
    public HospitalityDbContext(DbContextOptions<HospitalityDbContext> options)
        : base(options)
    {
    }

    public DbSet<Hotel> Hotels => Set<Hotel>();
    public DbSet<User> Users => Set<User>();
    public DbSet<RoomType> RoomTypes => Set<RoomType>();
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<Guest> Guests => Set<Guest>();
    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<FolioItem> FolioItems => Set<FolioItem>();
    public DbSet<HousekeepingTask> HousekeepingTasks => Set<HousekeepingTask>();
    public DbSet<MaintenanceTicket> MaintenanceTickets => Set<MaintenanceTicket>();
    public DbSet<RestaurantTable> RestaurantTables => Set<RestaurantTable>();
    public DbSet<TableReservation> TableReservations => Set<TableReservation>();
    public DbSet<RestaurantOrder> RestaurantOrders => Set<RestaurantOrder>();
    public DbSet<RestaurantOrderItem> RestaurantOrderItems => Set<RestaurantOrderItem>();
    public DbSet<POSProduct> POSProducts => Set<POSProduct>();
    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<PurchaseOrder> PurchaseOrders => Set<PurchaseOrder>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<CashRegister> CashRegisters => Set<CashRegister>();
    public DbSet<Staff> Staff => Set<Staff>();
    public DbSet<Bill> Bills => Set<Bill>();
    public DbSet<ReservationAlert> ReservationAlerts => Set<ReservationAlert>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Map exact table names and camelCase column names (matching Prisma / Supabase schema)
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            // Table name is PascalCase matching entity name
            entity.SetTableName(entity.ClrType.Name);

            foreach (var property in entity.GetProperties())
            {
                var name = property.Name;
                if (!string.IsNullOrEmpty(name))
                {
                    var camelCase = char.ToLowerInvariant(name[0]) + name[1..];
                    property.SetColumnName(camelCase);
                }
            }
        }

        // Custom mappings where property name != column name
        modelBuilder.Entity<Reservation>()
            .Property(r => r.CheckIn)
            .HasColumnName("checkIn");

        modelBuilder.Entity<Reservation>()
            .Property(r => r.CheckOut)
            .HasColumnName("checkOut");

        modelBuilder.Entity<FolioItem>()
            .Property(f => f.Timestamp)
            .HasColumnName("timestamp");

        // Relationships & Constraints
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();

        modelBuilder.Entity<Hotel>()
            .HasIndex(h => h.Slug)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasOne(u => u.Hotel)
            .WithOne(h => h.AdminUser)
            .HasForeignKey<User>(u => u.HotelId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Room>()
            .HasOne(r => r.Hotel)
            .WithMany(h => h.Rooms)
            .HasForeignKey(r => r.HotelId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Room>()
            .HasOne(r => r.RoomType)
            .WithMany(rt => rt.Rooms)
            .HasForeignKey(r => r.RoomTypeId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Reservation>()
            .HasOne(res => res.Hotel)
            .WithMany(h => h.Reservations)
            .HasForeignKey(res => res.HotelId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Reservation>()
            .HasOne(res => res.Room)
            .WithMany(r => r.Reservations)
            .HasForeignKey(res => res.RoomId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Reservation>()
            .HasOne(res => res.Guest)
            .WithMany(g => g.Reservations)
            .HasForeignKey(res => res.GuestId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<FolioItem>()
            .HasOne(f => f.Reservation)
            .WithMany(r => r.FolioItems)
            .HasForeignKey(f => f.ReservationId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<RestaurantOrder>()
            .HasOne(o => o.Table)
            .WithMany(t => t.Orders)
            .HasForeignKey(o => o.TableId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<RestaurantOrderItem>()
            .HasOne(i => i.Order)
            .WithMany(o => o.Items)
            .HasForeignKey(i => i.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<StockMovement>()
            .HasOne(s => s.Item)
            .WithMany(i => i.Movements)
            .HasForeignKey(s => s.ItemId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TableReservation>()
            .HasOne(tr => tr.Table)
            .WithMany(t => t.Reservations)
            .HasForeignKey(tr => tr.TableId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<TableReservation>()
            .HasOne(tr => tr.Hotel)
            .WithMany()
            .HasForeignKey(tr => tr.HotelId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TableReservation>()
            .HasOne(tr => tr.Guest)
            .WithMany()
            .HasForeignKey(tr => tr.GuestId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<POSProduct>()
            .HasOne(p => p.InventoryItem)
            .WithMany()
            .HasForeignKey(p => p.InventoryItemId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<PurchaseOrder>()
            .HasOne(p => p.Supplier)
            .WithMany(s => s.Purchases)
            .HasForeignKey(p => p.SupplierId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Bill>()
            .HasIndex(b => new { b.HotelId, b.BillNumber })
            .IsUnique();

        modelBuilder.Entity<Bill>()
            .HasIndex(b => b.BillingType);

        modelBuilder.Entity<Bill>()
            .HasIndex(b => b.PaymentStatus);

        modelBuilder.Entity<Bill>()
            .HasIndex(b => b.CreatedAt);

        modelBuilder.Entity<ReservationAlert>()
            .HasOne(a => a.Reservation)
            .WithMany()
            .HasForeignKey(a => a.ReservationId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ReservationAlert>()
            .HasOne(a => a.Table)
            .WithMany()
            .HasForeignKey(a => a.TableId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<ReservationAlert>()
            .HasIndex(a => a.Status);

        modelBuilder.Entity<ReservationAlert>()
            .HasIndex(a => new { a.ReservationId, a.AlertType });
    }
}

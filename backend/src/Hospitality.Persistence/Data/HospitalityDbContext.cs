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
    public DbSet<TableCategory> TableCategories => Set<TableCategory>();
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
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<CustomerLedgerEntry> CustomerLedgers => Set<CustomerLedgerEntry>();
    public DbSet<SupplierLedgerEntry> SupplierLedgers => Set<SupplierLedgerEntry>();
    public DbSet<CreditOverrideAudit> CreditOverrideAudits => Set<CreditOverrideAudit>();
    public DbSet<PackingMaterial> PackingMaterials => Set<PackingMaterial>();
    public DbSet<PackingTransaction> PackingTransactions => Set<PackingTransaction>();
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<AccountMapping> AccountMappings => Set<AccountMapping>();
    public DbSet<JournalEntry> JournalEntries => Set<JournalEntry>();
    public DbSet<JournalEntryLine> JournalEntryLines => Set<JournalEntryLine>();
    public DbSet<CashReconciliation> CashReconciliations => Set<CashReconciliation>();
    public DbSet<DigitalWalletAccount> DigitalWalletAccounts => Set<DigitalWalletAccount>();
    public DbSet<WalletSettlement> WalletSettlements => Set<WalletSettlement>();
    public DbSet<WalletRefund> WalletRefunds => Set<WalletRefund>();
    public DbSet<WalletReconciliation> WalletReconciliations => Set<WalletReconciliation>();
    public DbSet<BankReconciliation> BankReconciliations => Set<BankReconciliation>();
    public DbSet<BankReconciliationLine> BankReconciliationLines => Set<BankReconciliationLine>();
    public DbSet<IncomeCategory> IncomeCategories => Set<IncomeCategory>();
    public DbSet<IncomeTransaction> IncomeTransactions => Set<IncomeTransaction>();
    public DbSet<ExpenseCategory> ExpenseCategories => Set<ExpenseCategory>();
    public DbSet<ExpenseTransaction> ExpenseTransactions => Set<ExpenseTransaction>();
    public DbSet<ExpensePayment> ExpensePayments => Set<ExpensePayment>();
    public DbSet<AssetCategory> AssetCategories => Set<AssetCategory>();
    public DbSet<FixedAsset> FixedAssets => Set<FixedAsset>();
    public DbSet<AssetDepreciationEntry> AssetDepreciationEntries => Set<AssetDepreciationEntry>();
    public DbSet<AssetMovement> AssetMovements => Set<AssetMovement>();
    public DbSet<LoanObligation> LoanObligations => Set<LoanObligation>();
    public DbSet<LoanRepaymentScheduleItem> LoanRepaymentScheduleItems => Set<LoanRepaymentScheduleItem>();
    public DbSet<LiabilityAccountConfig> LiabilityAccountConfigs => Set<LiabilityAccountConfig>();
    public DbSet<RestaurantMenuSettings> RestaurantMenuSettings => Set<RestaurantMenuSettings>();
    public DbSet<RestaurantQrCode> RestaurantQrCodes => Set<RestaurantQrCode>();

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

        modelBuilder.Entity<SupplierLedgerEntry>()
            .HasOne(s => s.Supplier)
            .WithMany()
            .HasForeignKey(s => s.SupplierId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<SupplierLedgerEntry>()
            .HasOne(s => s.PurchaseOrder)
            .WithMany()
            .HasForeignKey(s => s.PurchaseOrderId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<SupplierLedgerEntry>()
            .HasIndex(s => new { s.HotelId, s.SupplierId });

        modelBuilder.Entity<SupplierLedgerEntry>()
            .HasIndex(s => new { s.HotelId, s.EntryDate });

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

        // Accounting: Chart of Accounts, Journal Entries, Ledger Lines
        modelBuilder.Entity<Account>()
            .HasIndex(a => new { a.HotelId, a.AccountCode })
            .IsUnique();

        modelBuilder.Entity<Account>()
            .HasIndex(a => a.AccountType);

        modelBuilder.Entity<Account>()
            .HasOne(a => a.Parent)
            .WithMany(p => p.Children)
            .HasForeignKey(a => a.ParentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Account>()
            .HasIndex(a => a.ParentId);

        modelBuilder.Entity<AccountMapping>()
            .HasIndex(m => new { m.HotelId, m.TransactionType })
            .IsUnique();

        modelBuilder.Entity<JournalEntry>()
            .HasMany(j => j.Lines)
            .WithOne(l => l.JournalEntry)
            .HasForeignKey(l => l.JournalEntryId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<JournalEntry>()
            .HasIndex(j => new { j.HotelId, j.EntryDate });

        modelBuilder.Entity<JournalEntry>()
            .HasIndex(j => j.EntryNumber);

        modelBuilder.Entity<JournalEntryLine>()
            .HasIndex(l => l.AccountId);

        // QR Menu: Restaurant Menu Display Settings
        modelBuilder.Entity<RestaurantMenuSettings>()
            .HasOne(s => s.Hotel)
            .WithOne(h => h.MenuSettings)
            .HasForeignKey<RestaurantMenuSettings>(s => s.HotelId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<RestaurantMenuSettings>()
            .HasIndex(s => s.HotelId)
            .IsUnique();

        // QR Menu: Secure QR Code Tokens
        modelBuilder.Entity<RestaurantQrCode>()
            .HasOne(q => q.Hotel)
            .WithMany(h => h.RestaurantQrCodes)
            .HasForeignKey(q => q.HotelId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<RestaurantQrCode>()
            .HasOne(q => q.Table)
            .WithMany(t => t.QrCodes)
            .HasForeignKey(q => q.TableId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<RestaurantQrCode>()
            .HasIndex(q => q.TokenHash)
            .IsUnique();

        modelBuilder.Entity<RestaurantQrCode>()
            .HasIndex(q => new { q.HotelId, q.CodeType });

        modelBuilder.Entity<RestaurantQrCode>()
            .HasIndex(q => new { q.HotelId, q.TableId });
    }
}

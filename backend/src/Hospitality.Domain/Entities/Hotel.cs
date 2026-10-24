namespace Hospitality.Domain.Entities;

public class Hotel : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public int TotalFloors { get; set; } = 1;
    public string Currency { get; set; } = "NPR";
    public string Timezone { get; set; } = "Asia/Kathmandu";
    public string Status { get; set; } = "ACTIVE"; // ACTIVE, SUSPENDED

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User? AdminUser { get; set; }
    public ICollection<RoomType> RoomTypes { get; set; } = new List<RoomType>();
    public ICollection<Room> Rooms { get; set; } = new List<Room>();
    public ICollection<Guest> Guests { get; set; } = new List<Guest>();
    public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
    public ICollection<HousekeepingTask> HousekeepingTasks { get; set; } = new List<HousekeepingTask>();
    public ICollection<MaintenanceTicket> MaintenanceTickets { get; set; } = new List<MaintenanceTicket>();
    public ICollection<RestaurantTable> RestaurantTables { get; set; } = new List<RestaurantTable>();
    public ICollection<RestaurantOrder> RestaurantOrders { get; set; } = new List<RestaurantOrder>();
    public ICollection<POSProduct> PosProducts { get; set; } = new List<POSProduct>();
    public ICollection<InventoryItem> InventoryItems { get; set; } = new List<InventoryItem>();
    public ICollection<Supplier> Suppliers { get; set; } = new List<Supplier>();
    public ICollection<PurchaseOrder> PurchaseOrders { get; set; } = new List<PurchaseOrder>();
    public ICollection<Expense> Expenses { get; set; } = new List<Expense>();
    public ICollection<CashRegister> CashRegisters { get; set; } = new List<CashRegister>();
    public ICollection<Staff> StaffMembers { get; set; } = new List<Staff>();
}

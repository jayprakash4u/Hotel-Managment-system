# Grand Hospitality Management System - .NET 8 Backend

A enterprise-grade **.NET 8 Clean Architecture Web API** backend connected directly to **Supabase PostgreSQL** and integrated with the **Next.js 14** frontend.

---

## 🏛️ Architecture Overview

The solution adheres strictly to **Clean Architecture** principles across decoupled projects:

```
backend/
├── src/
│   ├── Hospitality.Domain/          # Core Domain Entities & Business Rules
│   │   └── Entities/                # All 20 domain models (Hotel, Room, Reservation, etc.)
│   ├── Hospitality.Application/     # CQRS abstractions, Interfaces & DTOs
│   │   ├── Common/Models/           # ApiResponse<T>, PaginatedList
│   │   └── Interfaces/              # IApplicationDbContext, IJwtTokenService
│   ├── Hospitality.Persistence/     # Supabase PostgreSQL via EF Core & Npgsql
│   │   └── Data/                    # HospitalityDbContext (automatic camelCase mapping)
│   ├── Hospitality.Infrastructure/  # JWT Token Service, Email & Infrastructure
│   │   └── Services/                # JwtTokenService
│   └── Hospitality.Api/             # ASP.NET Core REST API & Swagger UI
│       ├── Controllers/             # 18 Controllers servicing all frontend routes
│       ├── Common/                  # SafeJsonOutputFormatter (high-perf direct serialization)
│       └── Program.cs               # DI setup, CORS & Middleware pipeline
└── tests/
    ├── Hospitality.UnitTests/       # ApiResponse & JWT Service tests
    ├── Hospitality.IntegrationTests/# Supabase schema validation (all 20 entities)
    └── Hospitality.Api.Tests/       # End-to-end WebApplicationFactory integration tests
```

---

## 🗄️ Database & Schema Alignment

- **Provider**: PostgreSQL (Supabase pooler on port 5432)
- **Tables (20)**: `Hotel`, `User`, `RoomType`, `Room`, `Guest`, `Reservation`, `HousekeepingTask`, `MaintenanceTicket`, `RestaurantTable`, `RestaurantOrder`, `RestaurantOrderItem`, `POSProduct`, `InventoryItem`, `Supplier`, `StockMovement`, `PurchaseOrder`, `FolioItem`, `Expense`, `CashRegister`, `Staff`
- **Naming Convention**: Table names are PascalCase; column names are camelCase (`hotelId`, `checkIn`, `totalAmount`). Mapped automatically in `HospitalityDbContext.OnModelCreating`.
- **Timestamps**: Uses `Npgsql.EnableLegacyTimestampBehavior` switch for seamless `timestamp without time zone` compatibility.

---

## 🚀 Running the Backend

### Prerequisites
- [.NET 8 SDK or .NET 10 SDK](https://dotnet.microsoft.com/)
- Supabase PostgreSQL Database (connection pre-configured in `appsettings.json`)

### Start the API Server
```powershell
cd backend
dotnet run --project src/Hospitality.Api
```

- **API Base URL**: `http://localhost:5000`
- **Swagger Documentation**: `http://localhost:5000/swagger`

---

## 🧪 Running Automated Tests

All tests run across unit, integration, and API test suites:

```powershell
dotnet test backend/Hospitality.sln
```

- **Hospitality.UnitTests**: Models, DTOs, JWT generation and validation
- **Hospitality.IntegrationTests**: Verifies live Supabase connectivity and entity schema alignment
- **Hospitality.Api.Tests**: In-memory HTTP endpoint validation (Auth, Hotel, Rooms, Analytics)

---

## 🌐 API Endpoints Summary

| Category | Endpoint | Methods | Description |
|---|---|---|---|
| **Auth** | `/api/auth/login` | POST | Authenticates hotel staff / manager and issues JWT |
| | `/api/auth/me` | GET | Returns current authenticated user context |
| | `/api/auth/logout` | POST | Logs out user |
| **Hotel Profile** | `/api/hotel` | GET, POST | Retrieve and update hotel property details |
| **Rooms & Types** | `/api/rooms` | GET, POST | Query filtered rooms or create a room |
| | `/api/rooms/batch` | POST | Batch create multiple rooms across floors |
| | `/api/rooms/{id}/status` | PATCH | Update room status (Clean, Dirty, Occupied) |
| | `/api/room-types` | GET, POST | Manage room types and rate pricing |
| **Reservations** | `/api/reservations` | GET, POST | List and book guest reservations |
| | `/api/reservations/{id}` | GET | Get single reservation details |
| | `/api/reservations/{id}/checkin` | POST | Check-in guest, assigns room |
| | `/api/reservations/{id}/checkout`| POST | Checkout guest and balance folio |
| | `/api/reservations/validate` | POST | Date conflict and capacity validator |
| **Guests** | `/api/guests` | GET, POST | Guest CRM and loyalty tiers |
| **Folio** | `/api/folio` | POST, DELETE | Post charges or delete items from guest bills |
| **Housekeeping** | `/api/housekeeping` | GET, POST, PATCH | Task assignment, priority, and room turnover |
| **Maintenance** | `/api/maintenance` | GET, POST, PATCH | Facilities management & work tickets |
| **Restaurant & Cafe**| `/api/restaurant/orders` | GET, POST | KOT generation & room service ordering |
| | `/api/tables` | GET, POST | Dine-in table management |
| **POS** | `/api/pos` | GET, POST | Point-of-sale catalog & transaction processing |
| **Inventory** | `/api/inventory/items` | GET | Item tracking, SKU, stock levels |
| | `/api/inventory` | PATCH | Stock adjustment and audits |
| | `/api/inventory/purchases` | GET, POST, PATCH | Purchase orders & receipt reconciliation |
| | `/api/inventory/movements` | GET, POST | Stock movement audit trail |
| | `/api/suppliers` | GET, POST | Vendor management |
| **Finance** | `/api/finance/expenses` | GET, POST | Operational expenses tracking |
| | `/api/finance/cash-register`| GET, POST | Shift floats & cash drawer reconciliation |
| **Analytics** | `/api/analytics` | GET | Real-time metrics: RevPAR, ADR, Occupancy % |
| **Platform / SaaS** | `/api/platform/*` | POST, GET, PATCH | Multi-tenant hotel onboarding & credentials |
| **Public Portal** | `/api/public/hotels/*` | GET, POST | Direct guest booking engine without authentication |
| **Database Seed** | `/api/seed` | POST | Resets & seeds demo hotel data (Aura Grand) |

---

## 🔗 Frontend Integration

The Next.js 14 frontend (`frontend/`) connects automatically via rewrites configured in `frontend/next.config.mjs`:

```javascript
// Next.js forwards /api/* directly to the .NET 8 backend:
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:5000/api/:path*',
    },
  ];
}
```

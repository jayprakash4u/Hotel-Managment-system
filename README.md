# Hospitality Management System

A monorepo containing a Next.js frontend and .NET 8 backend for a hospitality management system.

## Project Structure

```
hospitality-management-system/
├── frontend/                 # Next.js 14 Frontend (React 18)
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # React components
│   │   ├── context/         # React context providers
│   │   ├── lib/             # Utility functions, API clients
│   │   └── middleware.ts    # Next.js middleware
│   ├── prisma/              # Prisma schema (legacy - to be removed)
│   ├── public/              # Static assets
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   └── .env
├── backend/                  # .NET 8 Backend (Clean Architecture)
│   ├── src/
│   │   ├── Hospitality.Api/              # Web API Layer
│   │   ├── Hospitality.Application/      # Application Layer (CQRS, MediatR)
│   │   ├── Hospitality.Domain/           # Domain Layer (Entities, Value Objects)
│   │   ├── Hospitality.Infrastructure/   # Infrastructure Layer (External Services)
│   │   └── Hospitality.Persistence/      # Persistence Layer (EF Core)
│   ├── tests/
│   │   ├── Hospitality.UnitTests/
│   │   ├── Hospitality.IntegrationTests/
│   │   └── Hospitality.Api.Tests/
│   ├── Hospitality.sln
│   └── README.md
├── package.json              # Root package.json (monorepo scripts)
└── .gitignore
```

## Architecture

### Frontend (Next.js 14)
- **App Router** for routing
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Jose** for JWT handling
- **API client** in `src/lib/api.ts` communicates with .NET backend

### Backend (.NET 8 Clean Architecture)
```
src/
├── Hospitality.Api           # Controllers, Middleware, Extensions
├── Hospitality.Application   # Commands, Queries, DTOs, Validators, Handlers
├── Hospitality.Domain        # Entities, ValueObjects, Domain Events, Interfaces
├── Hospitality.Infrastructure # External Services (Email, Payment, SMS, Storage)
└── Hospitality.Persistence   # EF Core, Migrations, Repositories, Seeders
```

## Getting Started

### Prerequisites
- Node.js 20+
- .NET 8 SDK
- SQL Server / PostgreSQL

### Installation

```bash
# Install all dependencies
npm run install:all

# Or manually:
npm install                    # Frontend dependencies
cd backend && dotnet restore   # Backend dependencies
```

### Development

```bash
# Run both frontend and backend
npm run dev

# Or separately:
npm run dev                    # Frontend only (http://localhost:3000)
npm run backend:run           # Backend only (http://localhost:5000)
npm run backend:watch         # Backend with hot reload
```

### Database

```bash
# Create migration
npm run db:generate

# Apply migration
npm run db:update
```

### Testing

```bash
# Frontend
npm run lint
npm run type-check

# Backend
npm run backend:test
```

## API Communication

Frontend communicates with backend via:
- REST API: `NEXT_PUBLIC_API_URL` (default: http://localhost:5000/api)
- WebSocket: `NEXT_PUBLIC_API_WS_URL` (default: ws://localhost:5000)

## Environment Variables

### Frontend (.env)
```env
SESSION_SECRET=your-session-secret
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_API_WS_URL=ws://localhost:5000
NEXT_PUBLIC_PLATFORM_API_URL=http://localhost:5000/api/platform
```

### Backend (appsettings.json / Environment)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=HospitalityDb;Trusted_Connection=True;TrustServerCertificate=True"
  },
  "Jwt": {
    "Key": "your-jwt-secret-key",
    "Issuer": "HospitalityApi",
    "Audience": "HospitalityClient"
  },
  "Email": { ... },
  "Payment": { ... }
}
```

## Clean Architecture Dependencies

```
Hospitality.Api
    ↓ references
Hospitality.Application ← Hospitality.Domain
    ↓ references                ↑ referenced by
Hospitality.Infrastructure ← Hospitality.Persistence
```

- **Domain**: No external dependencies
- **Application**: References Domain only
- **Infrastructure**: References Application + Domain
- **Persistence**: References Domain + Application
- **Api**: References Application + Infrastructure + Persistence

## Useful Commands

```bash
# Clean build artifacts
npm run clean

# Backend specific
cd backend/src/Hospitality.Api && dotnet run
cd backend && dotnet build Hospitality.sln
cd backend && dotnet test Hospitality.sln

# Frontend specific
cd frontend && npm run dev
cd frontend && npm run build
cd frontend && npm run lint
```"# Hotel-Managment-system" 

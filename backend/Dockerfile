# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# Multi-stage Dockerfile for Hospitality Management System API
# ASP.NET Core 8 | Clean Architecture | Render + Supabase PostgreSQL
#
# Build:  docker build -t hospitality-api -f backend/Dockerfile .
# Run:    docker run -p 8080:8080 \
#           -e ConnectionStrings__DefaultConnection="Host=...;Port=5432;Database=postgres;Username=...;Password=...;Ssl Mode=Require" \
#           -e Jwt__Key="<your-jwt-key>" \
#           -e Supabase__Url="https://<project>.supabase.co" \
#           -e Supabase__Key="<supabase-key>" \
#           hospitality-api
#
# Render: PORT is injected automatically at runtime; the entrypoint reads it.
# ---------------------------------------------------------------------------

# =========================================================================
# Stage 1: Build (.NET 8 SDK)
# =========================================================================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files first to maximize Docker layer caching.
COPY Hospitality.sln .
COPY src/Hospitality.Api/Hospitality.Api.csproj src/Hospitality.Api/
COPY src/Hospitality.Application/Hospitality.Application.csproj src/Hospitality.Application/
COPY src/Hospitality.Domain/Hospitality.Domain.csproj src/Hospitality.Domain/
COPY src/Hospitality.Infrastructure/Hospitality.Infrastructure.csproj src/Hospitality.Infrastructure/
COPY src/Hospitality.Persistence/Hospitality.Persistence.csproj src/Hospitality.Persistence/

# Restore all dependencies for the whole solution graph.
RUN dotnet restore Hospitality.sln

# Copy the remaining source code (Clean Architecture structure unchanged).
COPY src/ ./src/

# Build and publish only the API project and its required dependencies.
RUN dotnet publish src/Hospitality.Api/Hospitality.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore \
    --nologo

# =========================================================================
# Stage 2: Runtime (.NET 8 ASP.NET Core runtime)
# =========================================================================
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Production environment. Render injects the PORT environment variable at
# runtime; the entrypoint below reads it so the container listens on
# 0.0.0.0:${PORT} (default 8080 when PORT is unset).
ENV ASPNETCORE_ENVIRONMENT=Production
ENV PORT=8080

# Supabase PostgreSQL connection string must be supplied at runtime via
# environment variables. Never hardcode database passwords or JWT secrets.
#   ConnectionStrings__DefaultConnection  -> "ConnectionStrings:DefaultConnection"
#   Jwt__Key                              -> "Jwt:Key"
#   Supabase__Url / Supabase__Key         -> "Supabase:Url" / "Supabase:Key"
ENV ConnectionStrings__DefaultConnection=""

# Copy the published output from the build stage.
COPY --from=build /app/publish .

# The API listens on all interfaces; Render routes traffic to $PORT.
EXPOSE 8080

# Read PORT at container startup so Render's injected value takes effect.
ENTRYPOINT ["sh", "-c", "dotnet Hospitality.Api.dll --urls \"http://0.0.0.0:${PORT:-8080}\""]

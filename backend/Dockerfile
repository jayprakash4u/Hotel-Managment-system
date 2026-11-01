# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# Multi-stage Dockerfile for Hospitality Management System API
# ASP.NET Core 8 | Clean Architecture | Render + Supabase PostgreSQL
#
# Build from repository root:
#   docker build -t hospitality-api -f backend/Dockerfile .
#
# Render settings:
#   Root Directory:  (leave EMPTY / BLANK)
#   Dockerfile Path: backend/Dockerfile
#   Docker Context:  . (or leave empty)
#   Docker Command:  (leave EMPTY / BLANK)
# ---------------------------------------------------------------------------

# =========================================================================
# Stage 1: Build (.NET 8 SDK)
# =========================================================================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /build

# Copy API project and its project-reference dependencies first to maximize
# Docker layer caching.
COPY backend/src/Hospitality.Api/Hospitality.Api.csproj src/Hospitality.Api/
COPY backend/src/Hospitality.Application/Hospitality.Application.csproj src/Hospitality.Application/
COPY backend/src/Hospitality.Domain/Hospitality.Domain.csproj src/Hospitality.Domain/
COPY backend/src/Hospitality.Infrastructure/Hospitality.Infrastructure.csproj src/Hospitality.Infrastructure/
COPY backend/src/Hospitality.Persistence/Hospitality.Persistence.csproj src/Hospitality.Persistence/

# Restore only the API project and its dependency graph.
RUN dotnet restore src/Hospitality.Api/Hospitality.Api.csproj

# Copy the backend source code.
COPY backend/src/ ./src/

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
# environment variables in the Render dashboard:
#   ConnectionStrings__DefaultConnection
#   Jwt__Key
#   Supabase__Url
#   Supabase__Key
#   CORS__AllowedOrigins
ENV ConnectionStrings__DefaultConnection=""

# Copy the published output from the build stage.
COPY --from=build /app/publish .

# The API listens on all interfaces; Render routes traffic to $PORT.
EXPOSE 8080

# Read PORT at container startup so Render's injected value takes effect.
ENTRYPOINT ["sh", "-c", "dotnet Hospitality.Api.dll --urls \"http://0.0.0.0:${PORT:-8080}\""]

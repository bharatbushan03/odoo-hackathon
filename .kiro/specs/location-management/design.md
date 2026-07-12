# Location Management Design Document

## Overview

The Location Management feature provides a hierarchical system for organizing and tracking physical locations within the asset management system. It replaces the simple string-based `currentLocation` field in the Asset model with a structured location system supporting Buildings, Floors, Rooms, and Warehouses.

### Key Design Goals

- **Structured Hierarchy**: Support a three-level hierarchy (Building → Floor → Room) for structured facilities
- **Flexible Storage**: Support standalone warehouses for facilities without hierarchical organization
- **Backward Compatibility**: Maintain existing asset location references during migration
- **Query Performance**: Optimize for common queries like asset location lookups and hierarchy navigation
- **Scalability**: Support organizations with hundreds of buildings and thousands of rooms
- **Audit Trail**: Track all location changes with timestamps for compliance

### Design Principles

- **Repository Pattern**: Separate data access logic from business logic for testability
- **Soft Deletes**: Preserve historical data by marking records as deleted rather than removing them
- **Code Generation**: Auto-generate unique location codes following consistent patterns
- **Validation First**: Validate all inputs before database operations
- **Consistent Errors**: Return standardized error responses across all endpoints

## Architecture

### System Context

```
┌─────────────────┐
│   Frontend UI   │
│  (React App)    │
└────────┬────────┘
         │ HTTP/REST
         ↓
┌─────────────────┐
│  API Gateway    │
│  (Express.js)   │
└────────┬────────┘
         │
         ↓
┌─────────────────┐      ┌──────────────┐
│   Location      │──────│  Asset       │
│   Service       │      │  Service     │
└────────┬────────┘      └──────────────┘
         │
         ↓
┌─────────────────┐
│   PostgreSQL    │
│   Database      │
└─────────────────┘
```

### Component Architecture

```
┌──────────────────────────────────────────────────────┐
│                    API Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │   Building   │  │    Floor     │  │    Room    │ │
│  │   Routes     │  │   Routes     │  │   Routes   │ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘ │
│         │                 │                 │         │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌─────┴──────┐ │
│  │   Building   │  │    Floor     │  │    Room    │ │
│  │  Controller  │  │  Controller  │  │ Controller │ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘ │
└─────────┼──────────────────┼──────────────────┼───────┘
          │                  │                  │
┌─────────┼──────────────────┼──────────────────┼───────┐
│         │   Service Layer  │                  │        │
│  ┌──────┴───────┐  ┌───────┴──────┐  ┌───────┴─────┐ │
│  │   Building   │  │    Floor     │  │    Room     │ │
│  │  Repository  │  │  Repository  │  │ Repository  │ │
│  └──────┬───────┘  └───────┬──────┘  └───────┬─────┘ │
└─────────┼────────────────────┼──────────────────┼──────┘
          │                    │                  │
          └────────────────────┴──────────────────┘
                           │
                  ┌────────┴────────┐
                  │  Prisma Client  │
                  │  (ORM Layer)    │
                  └────────┬────────┘
                           │
                  ┌────────┴────────┐
                  │   PostgreSQL    │
                  └─────────────────┘
```

### Layer Responsibilities

**Routes Layer** (`src/routes/locationRoutes.js`)
- Define API endpoints and HTTP methods
- Apply authentication and authorization middleware
- Route requests to appropriate controllers

**Controller Layer** (`src/controllers/`)
- Parse and validate request parameters
- Coordinate business logic
- Format responses
- Handle errors gracefully

**Repository Layer** (`src/repositories/`)
- Abstract database operations
- Execute Prisma queries
- Transform database results into domain objects
- Handle database-specific errors

**Middleware**

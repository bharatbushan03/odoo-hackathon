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
- `authenticate`: Verify JWT tokens and extract user information
- `authorize`: Check user roles for permission-based access
- `validate`: Validate request payloads using schemas

## Components and Interfaces

### Database Schema

#### Building Model

```prisma
model Building {
  id          String    @id @default(uuid())
  code        String    @unique
  name        String
  address     String?
  description String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  floors      Floor[]

  @@index([code])
  @@index([deletedAt])
  @@map("buildings")
}
```

#### Floor Model

```prisma
model Floor {
  id          String    @id @default(uuid())
  code        String    @unique
  name        String
  floorNumber Int
  description String?
  buildingId  String
  building    Building  @relation(fields: [buildingId], references: [id])
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  rooms       Room[]

  @@unique([buildingId, floorNumber])
  @@index([buildingId])
  @@index([deletedAt])
  @@map("floors")
}
```

#### Room Model

```prisma
model Room {
  id          String    @id @default(uuid())
  code        String    @unique
  name        String
  roomNumber  String
  capacity    Int?
  description String?
  floorId     String
  floor       Floor     @relation(fields: [floorId], references: [id])
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  assets      Asset[]

  @@unique([floorId, roomNumber])
  @@index([floorId])
  @@index([deletedAt])
  @@map("rooms")
}
```

#### Warehouse Model

```prisma
model Warehouse {
  id          String    @id @default(uuid())
  code        String    @unique
  name        String
  address     String?
  capacity    Int?
  description String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  assets      Asset[]

  @@index([code])
  @@index([deletedAt])
  @@map("warehouses")
}
```

#### Asset Model Updates

```prisma
model Asset {
  // ... existing fields ...
  
  // Replace currentLocation String with structured references
  roomId      String?
  room        Room?      @relation(fields: [roomId], references: [id])
  warehouseId String?
  warehouse   Warehouse? @relation(fields: [warehouseId], references: [id])
  
  // Keep currentLocation for backward compatibility during migration
  currentLocation String?

  @@index([roomId])
  @@index([warehouseId])
  // ... existing indexes ...
}
```

### API Endpoints

#### Building Endpoints

```
POST   /api/locations/buildings           Create building
GET    /api/locations/buildings           List buildings (paginated)
GET    /api/locations/buildings/:id       Get building by ID
PUT    /api/locations/buildings/:id       Update building
DELETE /api/locations/buildings/:id       Soft delete building
GET    /api/locations/buildings/:id/full  Get building with floors and rooms
```

#### Floor Endpoints

```
POST   /api/locations/floors              Create floor
GET    /api/locations/floors              List floors (paginated)
GET    /api/locations/buildings/:buildingId/floors  List floors for building
GET    /api/locations/floors/:id          Get floor by ID
PUT    /api/locations/floors/:id          Update floor
DELETE /api/locations/floors/:id          Soft delete floor
```

#### Room Endpoints

```
POST   /api/locations/rooms               Create room
GET    /api/locations/rooms               List rooms (paginated)
GET    /api/locations/floors/:floorId/rooms  List rooms for floor
GET    /api/locations/rooms/:id           Get room by ID
PUT    /api/locations/rooms/:id           Update room
DELETE /api/locations/rooms/:id           Soft delete room
GET    /api/locations/rooms/:id/assets    Get assets in room
```

#### Warehouse Endpoints

```
POST   /api/locations/warehouses          Create warehouse
GET    /api/locations/warehouses          List warehouses (paginated)
GET    /api/locations/warehouses/:id      Get warehouse by ID
PUT    /api/locations/warehouses/:id      Update warehouse
DELETE /api/locations/warehouses/:id      Soft delete warehouse
GET    /api/locations/warehouses/:id/assets  Get assets in warehouse
```

#### Hierarchy Endpoints

```
GET    /api/locations/hierarchy           Get all top-level locations
GET    /api/locations/search              Search across all location types
```

### Request/Response Schemas

#### Create Building Request

```json
{
  "name": "Main Office Building",
  "code": "BLD-0001",
  "address": "123 Business St, City, State 12345",
  "description": "Primary office location"
}
```

#### Building Response

```json
{
  "id": "uuid",
  "code": "BLD-0001",
  "name": "Main Office Building",
  "address": "123 Business St, City, State 12345",
  "description": "Primary office location",
  "floorCount": 5,
  "roomCount": 120,
  "assetCount": 450,
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

#### Create Floor Request

```json
{
  "name": "Ground Floor",
  "floorNumber": 0,
  "buildingId": "uuid",
  "description": "Reception and lobby area"
}
```

#### Floor Response

```json
{
  "id": "uuid",
  "code": "BLD-0001-F0",
  "name": "Ground Floor",
  "floorNumber": 0,
  "description": "Reception and lobby area",
  "building": {
    "id": "uuid",
    "code": "BLD-0001",
    "name": "Main Office Building"
  },
  "roomCount": 8,
  "assetCount": 45,
  "createdAt": "2025-01-15T10:05:00Z",
  "updatedAt": "2025-01-15T10:05:00Z"
}
```

#### Create Room Request

```json
{
  "name": "Conference Room A",
  "roomNumber": "101",
  "floorId": "uuid",
  "capacity": 12,
  "description": "Large conference room with AV equipment"
}
```

#### Room Response

```json
{
  "id": "uuid",
  "code": "BLD-0001-F1-R101",
  "name": "Conference Room A",
  "roomNumber": "101",
  "capacity": 12,
  "currentCount": 8,
  "utilization": 66.67,
  "description": "Large conference room with AV equipment",
  "floor": {
    "id": "uuid",
    "code": "BLD-0001-F1",
    "name": "First Floor",
    "floorNumber": 1
  },
  "building": {
    "id": "uuid",
    "code": "BLD-0001",
    "name": "Main Office Building"
  },
  "createdAt": "2025-01-15T10:10:00Z",
  "updatedAt": "2025-01-15T10:10:00Z"
}
```

#### Paginated List Response

```json
{
  "data": [
    { /* location object */ }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "pageSize": 20,
    "totalPages": 8
  }
}
```

#### Error Response

```json
{
  "message": "Validation error",
  "errors": [
    {
      "field": "name",
      "message": "Name is required"
    }
  ]
}
```

### Code Generation Logic

#### Building Code Generation

```javascript
async function generateBuildingCode(tx) {
  const latest = await tx.building.findFirst({
    where: { code: { startsWith: 'BLD-' } },
    orderBy: { code: 'desc' },
    select: { code: true }
  });
  
  const nextNumber = latest
    ? parseInt(latest.code.split('-')[1]) + 1
    : 1;
  
  return `BLD-${String(nextNumber).padStart(4, '0')}`;
}
```

#### Floor Code Generation

```javascript
async function generateFloorCode(buildingCode, floorNumber) {
  return `${buildingCode}-F${floorNumber}`;
}
```

#### Room Code Generation

```javascript
async function generateRoomCode(floorCode, roomNumber) {
  return `${floorCode}-R${roomNumber}`;
}
```

#### Warehouse Code Generation

```javascript
async function generateWarehouseCode(tx) {
  const latest = await tx.warehouse.findFirst({
    where: { code: { startsWith: 'WH-' } },
    orderBy: { code: 'desc' },
    select: { code: true }
  });
  
  const nextNumber = latest
    ? parseInt(latest.code.split('-')[1]) + 1
    : 1;
  
  return `WH-${String(nextNumber).padStart(4, '0')}`;
}
```

## Data Models

### Domain Objects

#### Building Domain Object

```typescript
interface Building {
  id: string;
  code: string;
  name: string;
  address: string | null;
  description: string | null;
  floorCount?: number;
  roomCount?: number;
  assetCount?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

#### Floor Domain Object

```typescript
interface Floor {
  id: string;
  code: string;
  name: string;
  floorNumber: number;
  description: string | null;
  buildingId: string;
  building?: BuildingSummary;
  roomCount?: number;
  assetCount?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

#### Room Domain Object

```typescript
interface Room {
  id: string;
  code: string;
  name: string;
  roomNumber: string;
  capacity: number | null;
  currentCount?: number;
  utilization?: number;
  description: string | null;
  floorId: string;
  floor?: FloorSummary;
  building?: BuildingSummary;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

#### Warehouse Domain Object

```typescript
interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string | null;
  capacity: number | null;
  currentCount?: number;
  utilization?: number;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

### Repository Interfaces

#### Building Repository

```typescript
interface BuildingRepository {
  create(data: CreateBuildingData): Promise<Building>;
  findById(id: string): Promise<Building | null>;
  findByCode(code: string): Promise<Building | null>;
  update(id: string, data: UpdateBuildingData): Promise<Building>;
  softDelete(id: string): Promise<void>;
  findAll(options: PaginationOptions): Promise<PaginatedResult<Building>>;
  search(query: string, options: PaginationOptions): Promise<PaginatedResult<Building>>;
  getWithFullHierarchy(id: string): Promise<BuildingWithHierarchy>;
  hasFloors(id: string): Promise<boolean>;
  getAssetCount(id: string): Promise<number>;
}
```

#### Floor Repository

```typescript
interface FloorRepository {
  create(data: CreateFloorData): Promise<Floor>;
  findById(id: string): Promise<Floor | null>;
  findByCode(code: string): Promise<Floor | null>;
  update(id: string, data: UpdateFloorData): Promise<Floor>;
  softDelete(id: string): Promise<void>;
  findByBuilding(buildingId: string, options: PaginationOptions): Promise<PaginatedResult<Floor>>;
  findAll(options: PaginationOptions): Promise<PaginatedResult<Floor>>;
  search(query: string, options: PaginationOptions): Promise<PaginatedResult<Floor>>;
  hasRooms(id: string): Promise<boolean>;
  getAssetCount(id: string): Promise<number>;
}
```

#### Room Repository

```typescript
interface RoomRepository {
  create(data: CreateRoomData): Promise<Room>;
  findById(id: string): Promise<Room | null>;
  findByCode(code: string): Promise<Room | null>;
  update(id: string, data: UpdateRoomData): Promise<Room>;
  softDelete(id: string): Promise<void>;
  findByFloor(floorId: string, options: PaginationOptions): Promise<PaginatedResult<Room>>;
  findAll(options: PaginationOptions): Promise<PaginatedResult<Room>>;
  search(query: string, options: PaginationOptions): Promise<PaginatedResult<Room>>;
  getAssetCount(id: string): Promise<number>;
  getUtilization(id: string): Promise<{ capacity: number, current: number, utilization: number }>;
}
```

#### Warehouse Repository

```typescript
interface WarehouseRepository {
  create(data: CreateWarehouseData): Promise<Warehouse>;
  findById(id: string): Promise<Warehouse | null>;
  findByCode(code: string): Promise<Warehouse | null>;
  update(id: string, data: UpdateWarehouseData): Promise<Warehouse>;
  softDelete(id: string): Promise<void>;
  findAll(options: PaginationOptions): Promise<PaginatedResult<Warehouse>>;
  search(query: string, options: PaginationOptions): Promise<PaginatedResult<Warehouse>>;
  getAssetCount(id: string): Promise<number>;
  getUtilization(id: string): Promise<{ capacity: number, current: number, utilization: number }>;
}
```


## Error Handling

### Error Categories

#### Validation Errors (400)
- Missing required fields
- Invalid data types
- Field length violations
- Invalid characters in codes
- Duplicate uniqueness violations (before database check)

#### Authentication Errors (401)
- Missing JWT token
- Invalid JWT token
- Expired JWT token

#### Authorization Errors (403)
- Insufficient role permissions for operation

#### Not Found Errors (404)
- Location entity not found by ID
- Parent location not found
- Referenced building/floor not found

#### Conflict Errors (409)
- Duplicate code violation
- Duplicate floorNumber within building
- Duplicate roomNumber within floor
- Cannot delete location with dependencies

#### Server Errors (500)
- Database connection failures
- Unexpected exceptions
- Transaction failures

### Error Response Format

All errors follow a consistent JSON structure:

```json
{
  "message": "Human-readable error message",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field-specific error message"
    }
  ]
}
```

### Error Handling Strategy

```javascript
// Controller error handling pattern
async function createBuilding(req, res) {
  try {
    // Validate input
    const errors = validateBuildingData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        message: 'Validation error',
        errors
      });
    }

    // Business logic
    const building = await buildingRepository.create(req.body);
    return res.status(201).json(building);
    
  } catch (error) {
    // Handle Prisma-specific errors
    if (error.code === 'P2002') {
      return res.status(409).json({
        message: 'Building code already exists'
      });
    }
    
    // Log and return generic error
    console.error('Error creating building:', error);
    return res.status(500).json({
      message: 'Internal server error'
    });
  }
}
```

### Validation Rules

#### Building Validation

```javascript
function validateBuildingData(data, isUpdate = false) {
  const errors = [];
  
  if (!isUpdate && !data.name) {
    errors.push({ field: 'name', message: 'Name is required' });
  }
  
  if (!isUpdate && !data.code) {
    errors.push({ field: 'code', message: 'Code is required' });
  }
  
  if (data.name && data.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Name cannot be empty' });
  }
  
  if (data.name && data.name.length > 200) {
    errors.push({ field: 'name', message: 'Name cannot exceed 200 characters' });
  }
  
  if (data.code && !/^[A-Z0-9-]+$/.test(data.code)) {
    errors.push({ field: 'code', message: 'Code can only contain uppercase letters, numbers, and hyphens' });
  }
  
  if (data.description && data.description.length > 1000) {
    errors.push({ field: 'description', message: 'Description cannot exceed 1000 characters' });
  }
  
  return errors;
}
```

#### Floor Validation

```javascript
function validateFloorData(data, isUpdate = false) {
  const errors = [];
  
  if (!isUpdate && !data.name) {
    errors.push({ field: 'name', message: 'Name is required' });
  }
  
  if (!isUpdate && data.floorNumber === undefined) {
    errors.push({ field: 'floorNumber', message: 'Floor number is required' });
  }
  
  if (!isUpdate && !data.buildingId) {
    errors.push({ field: 'buildingId', message: 'Building ID is required' });
  }
  
  if (data.floorNumber !== undefined && !Number.isInteger(data.floorNumber)) {
    errors.push({ field: 'floorNumber', message: 'Floor number must be an integer' });
  }
  
  if (data.name && data.name.length > 200) {
    errors.push({ field: 'name', message: 'Name cannot exceed 200 characters' });
  }
  
  if (data.description && data.description.length > 1000) {
    errors.push({ field: 'description', message: 'Description cannot exceed 1000 characters' });
  }
  
  return errors;
}
```

#### Room Validation

```javascript
function validateRoomData(data, isUpdate = false) {
  const errors = [];
  
  if (!isUpdate && !data.name) {
    errors.push({ field: 'name', message: 'Name is required' });
  }
  
  if (!isUpdate && !data.roomNumber) {
    errors.push({ field: 'roomNumber', message: 'Room number is required' });
  }
  
  if (!isUpdate && !data.floorId) {
    errors.push({ field: 'floorId', message: 'Floor ID is required' });
  }
  
  if (data.capacity !== undefined && data.capacity !== null) {
    if (!Number.isInteger(data.capacity) || data.capacity < 0) {
      errors.push({ field: 'capacity', message: 'Capacity must be a non-negative integer' });
    }
  }
  
  if (data.name && data.name.length > 200) {
    errors.push({ field: 'name', message: 'Name cannot exceed 200 characters' });
  }
  
  if (data.description && data.description.length > 1000) {
    errors.push({ field: 'description', message: 'Description cannot exceed 1000 characters' });
  }
  
  return errors;
}
```

## Testing Strategy

### Unit Testing

#### Controller Tests
- Test input validation logic
- Test error handling paths
- Test success response formatting
- Mock repository calls

#### Repository Tests
- Test CRUD operations
- Test query building
- Test data transformation
- Test soft delete behavior
- Use in-memory or test database

#### Middleware Tests
- Test authentication token parsing
- Test authorization role checking
- Test request validation

### Integration Testing

#### API Endpoint Tests
- Test full request-response cycle
- Test authentication and authorization
- Test database state changes
- Test error responses
- Use test database with fixtures

#### Database Tests
- Test schema constraints
- Test cascading behaviors
- Test index performance
- Test transaction isolation

### Test Data Fixtures

```javascript
// Building fixtures
const buildingFixtures = [
  {
    code: 'BLD-TEST-001',
    name: 'Test Building 1',
    address: '123 Test St'
  },
  {
    code: 'BLD-TEST-002',
    name: 'Test Building 2',
    address: '456 Test Ave'
  }
];

// Floor fixtures
const floorFixtures = [
  {
    code: 'BLD-TEST-001-F0',
    name: 'Ground Floor',
    floorNumber: 0,
    buildingId: 'building-uuid-1'
  },
  {
    code: 'BLD-TEST-001-F1',
    name: 'First Floor',
    floorNumber: 1,
    buildingId: 'building-uuid-1'
  }
];

// Room fixtures
const roomFixtures = [
  {
    code: 'BLD-TEST-001-F1-R101',
    name: 'Office 101',
    roomNumber: '101',
    floorId: 'floor-uuid-1',
    capacity: 4
  },
  {
    code: 'BLD-TEST-001-F1-R102',
    name: 'Conference Room A',
    roomNumber: '102',
    floorId: 'floor-uuid-1',
    capacity: 12
  }
];
```

### Test Coverage Goals

- Line coverage: > 80%
- Branch coverage: > 75%
- Function coverage: > 90%

### Testing Tools

- **Jest**: Test runner and assertion library
- **Supertest**: HTTP API testing
- **Prisma Test Client**: Database testing with transactions
- **MSW**: API mocking for frontend tests

## Database Migration Strategy

### Migration Steps

#### Step 1: Create New Tables

```sql
-- Run Prisma migration to create new tables
CREATE TABLE buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  address TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE TABLE floors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  floor_number INTEGER NOT NULL,
  description TEXT,
  building_id UUID NOT NULL REFERENCES buildings(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  UNIQUE(building_id, floor_number)
);

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  room_number VARCHAR(50) NOT NULL,
  capacity INTEGER,
  description TEXT,
  floor_id UUID NOT NULL REFERENCES floors(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  UNIQUE(floor_id, room_number)
);

CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  address TEXT,
  capacity INTEGER,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_buildings_code ON buildings(code);
CREATE INDEX idx_buildings_deleted_at ON buildings(deleted_at);
CREATE INDEX idx_floors_building_id ON floors(building_id);
CREATE INDEX idx_floors_deleted_at ON floors(deleted_at);
CREATE INDEX idx_rooms_floor_id ON rooms(floor_id);
CREATE INDEX idx_rooms_deleted_at ON rooms(deleted_at);
CREATE INDEX idx_warehouses_code ON warehouses(code);
CREATE INDEX idx_warehouses_deleted_at ON warehouses(deleted_at);
```

#### Step 2: Add Foreign Keys to Assets

```sql
-- Add new columns to assets table
ALTER TABLE assets ADD COLUMN room_id UUID REFERENCES rooms(id);
ALTER TABLE assets ADD COLUMN warehouse_id UUID REFERENCES warehouses(id);

-- Create indexes
CREATE INDEX idx_assets_room_id ON assets(room_id);
CREATE INDEX idx_assets_warehouse_id ON assets(warehouse_id);

-- Keep currentLocation for backward compatibility
-- ALTER TABLE assets ALTER COLUMN current_location DROP NOT NULL;
```

#### Step 3: Data Migration Script

```javascript
// Migrate existing location strings to structured locations
async function migrateLocations() {
  const assets = await prisma.asset.findMany({
    where: { currentLocation: { not: null } }
  });

  for (const asset of assets) {
    // Parse location string (e.g., "Building A - Floor 2 - Room 201")
    const locationParts = asset.currentLocation.split(' - ');
    
    if (locationParts.length >= 3) {
      // Create or find building
      const building = await findOrCreateBuilding(locationParts[0]);
      
      // Create or find floor
      const floor = await findOrCreateFloor(building.id, locationParts[1]);
      
      // Create or find room
      const room = await findOrCreateRoom(floor.id, locationParts[2]);
      
      // Update asset
      await prisma.asset.update({
        where: { id: asset.id },
        data: { roomId: room.id }
      });
    } else if (locationParts[0].toLowerCase().includes('warehouse')) {
      // Create or find warehouse
      const warehouse = await findOrCreateWarehouse(locationParts[0]);
      
      // Update asset
      await prisma.asset.update({
        where: { id: asset.id },
        data: { warehouseId: warehouse.id }
      });
    }
  }
}
```

#### Step 4: Validation and Rollback Plan

```javascript
// Validate migration results
async function validateMigration() {
  // Check all assets have structured locations
  const unmigrated = await prisma.asset.count({
    where: {
      AND: [
        { currentLocation: { not: null } },
        { roomId: null },
        { warehouseId: null }
      ]
    }
  });
  
  console.log(`Unmigrated assets: ${unmigrated}`);
  
  // Check data consistency
  const roomAssets = await prisma.asset.count({ where: { roomId: { not: null } } });
  const warehouseAssets = await prisma.asset.count({ where: { warehouseId: { not: null } } });
  
  console.log(`Assets with rooms: ${roomAssets}`);
  console.log(`Assets with warehouses: ${warehouseAssets}`);
}

// Rollback plan
async function rollbackMigration() {
  // Remove foreign key relationships
  await prisma.asset.updateMany({
    data: {
      roomId: null,
      warehouseId: null
    }
  });
  
  // Optionally delete created locations
  await prisma.room.deleteMany({});
  await prisma.floor.deleteMany({});
  await prisma.building.deleteMany({});
  await prisma.warehouse.deleteMany({});
}
```

## Performance Considerations

### Database Indexing Strategy

```sql
-- Primary indexes (already in schema)
CREATE INDEX idx_buildings_code ON buildings(code);
CREATE INDEX idx_buildings_deleted_at ON buildings(deleted_at);
CREATE INDEX idx_floors_building_id ON floors(building_id);
CREATE INDEX idx_floors_deleted_at ON floors(deleted_at);
CREATE INDEX idx_rooms_floor_id ON rooms(floor_id);
CREATE INDEX idx_rooms_deleted_at ON rooms(deleted_at);

-- Composite indexes for common queries
CREATE INDEX idx_floors_building_deleted ON floors(building_id, deleted_at);
CREATE INDEX idx_rooms_floor_deleted ON rooms(floor_id, deleted_at);

-- Full-text search indexes (if using PostgreSQL)
CREATE INDEX idx_buildings_name_gin ON buildings USING gin(to_tsvector('english', name));
CREATE INDEX idx_buildings_address_gin ON buildings USING gin(to_tsvector('english', address));
```

### Query Optimization

#### Efficient Hierarchy Loading

```javascript
// Load building with all floors and rooms in a single query
async function getBuildingWithHierarchy(id) {
  return prisma.building.findUnique({
    where: { id, deletedAt: null },
    include: {
      floors: {
        where: { deletedAt: null },
        include: {
          rooms: {
            where: { deletedAt: null },
            include: {
              _count: {
                select: { assets: true }
              }
            }
          }
        },
        orderBy: { floorNumber: 'asc' }
      }
    }
  });
}
```

#### Pagination with Total Count

```javascript
// Efficient pagination using parallel queries
async function findBuildingsWithPagination(options) {
  const { page = 1, pageSize = 20, search } = options;
  const skip = (page - 1) * pageSize;
  
  const where = { deletedAt: null };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
      { address: { contains: search, mode: 'insensitive' } }
    ];
  }
  
  const [buildings, total] = await Promise.all([
    prisma.building.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { name: 'asc' }
    }),
    prisma.building.count({ where })
  ]);
  
  return {
    data: buildings,
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  };
}
```

### Caching Strategy

```javascript
// Simple in-memory cache for frequently accessed data
const NodeCache = require('node-cache');
const locationCache = new NodeCache({ stdTTL: 600 }); // 10 minute TTL

async function getCachedBuilding(id) {
  const cacheKey = `building:${id}`;
  const cached = locationCache.get(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const building = await buildingRepository.findById(id);
  if (building) {
    locationCache.set(cacheKey, building);
  }
  
  return building;
}

// Invalidate cache on updates
async function updateBuilding(id, data) {
  const building = await prisma.building.update({
    where: { id },
    data
  });
  
  locationCache.del(`building:${id}`);
  return building;
}
```

## Security Considerations

### Role-Based Access Control

```javascript
// Authorization middleware configuration
const locationPermissions = {
  create: ['SUPER_ADMIN', 'ORG_ADMIN', 'ASSET_MANAGER'],
  read: ['SUPER_ADMIN', 'ORG_ADMIN', 'ASSET_MANAGER', 'DEPT_HEAD', 'EMPLOYEE'],
  update: ['SUPER_ADMIN', 'ORG_ADMIN', 'ASSET_MANAGER'],
  delete: ['SUPER_ADMIN', 'ORG_ADMIN']
};

// Apply to routes
router.post('/buildings', 
  authenticate, 
  authorize(...locationPermissions.create), 
  createBuilding
);

router.get('/buildings/:id', 
  authenticate, 
  authorize(...locationPermissions.read), 
  getBuilding
);

router.put('/buildings/:id', 
  authenticate, 
  authorize(...locationPermissions.update), 
  updateBuilding
);

router.delete('/buildings/:id', 
  authenticate, 
  authorize(...locationPermissions.delete), 
  deleteBuilding
);
```

### Input Sanitization

```javascript
// Sanitize all text inputs
function sanitizeInput(str) {
  if (typeof str !== 'string') return str;
  
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .substring(0, 1000);   // Limit length
}

function sanitizeBuildingInput(data) {
  return {
    ...data,
    name: sanitizeInput(data.name),
    address: sanitizeInput(data.address),
    description: sanitizeInput(data.description)
  };
}
```

### SQL Injection Prevention

Prisma ORM provides parameterized queries by default, preventing SQL injection attacks. Always use Prisma query methods rather than raw SQL.

```javascript
// Safe - using Prisma
const building = await prisma.building.findUnique({
  where: { code: userInput }
});

// Unsafe - raw SQL (avoid)
const result = await prisma.$queryRaw`SELECT * FROM buildings WHERE code = ${userInput}`;
```

### Rate Limiting

```javascript
// Apply rate limiting to location endpoints
const rateLimit = require('express-rate-limit');

const locationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

router.use('/locations', locationRateLimiter);
```

## Deployment Strategy

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/assetdb

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Application
NODE_ENV=production
PORT=5000
LOG_LEVEL=info

# Cache
CACHE_TTL=600
CACHE_ENABLED=true
```

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npx prisma generate

EXPOSE 5000

CMD ["node", "server.js"]
```

### Database Backup Strategy

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DATABASE_URL="postgresql://user:password@localhost:5432/assetdb"

# Backup database
pg_dump $DATABASE_URL > "$BACKUP_DIR/backup_$DATE.sql"

# Compress backup
gzip "$BACKUP_DIR/backup_$DATE.sql"

# Remove backups older than 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

### Monitoring and Logging

```javascript
// Logging configuration
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Log all location operations
function logLocationOperation(operation, entityType, entityId, userId) {
  logger.info('Location operation', {
    operation,
    entityType,
    entityId,
    userId,
    timestamp: new Date().toISOString()
  });
}
```

## Future Enhancements

### Phase 2 Features

1. **Location QR Codes**: Generate and print QR codes for locations
2. **Location Images**: Support photo uploads for locations
3. **Custom Fields**: Allow custom metadata fields per location
4. **Location History**: Track asset movement history between locations
5. **Capacity Alerts**: Notify when locations approach capacity limits
6. **Geographic Coordinates**: Add latitude/longitude for mapping

### Phase 3 Features

1. **Multi-Organization Support**: Isolate locations by organization
2. **Location Templates**: Pre-defined location structures for common scenarios
3. **Bulk Import**: CSV/Excel import for location data
4. **Advanced Search**: Full-text search with filters and facets
5. **Location Analytics**: Dashboard showing utilization trends
6. **Mobile App Integration**: Native mobile support for location management


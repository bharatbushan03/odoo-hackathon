# Department Module API Documentation

## Overview

The Department module provides comprehensive CRUD operations for managing organizational departments with advanced features including hierarchy management, department heads, statistics, and powerful search capabilities.

## Base URL

```
/api/v1/departments
```

## Authentication

All endpoints require authentication and ADMIN role.

## Features

- ✅ CRUD Operations (Create, Read, Update, Delete)
- ✅ Department Head Assignment
- ✅ Parent Department (Hierarchy)
- ✅ Department Hierarchy Tree
- ✅ Department Statistics
- ✅ Repository Pattern
- ✅ Validation
- ✅ Pagination
- ✅ Filtering
- ✅ Search
- ✅ Sorting

---

## Endpoints

### 1. Create Department

**Endpoint:** `POST /api/v1/departments`

**Description:** Create a new department with optional parent and department head.

**Request Body:**
```json
{
  "name": "Engineering",
  "parentId": "optional-parent-department-id",
  "departmentHeadId": "optional-employee-id",
  "status": "Active"
}
```

**Validation:**
- `name` (required): Non-empty string
- `parentId` (optional): Must be a valid department ID
- `departmentHeadId` (optional): Must be a valid employee ID with DEPT_HEAD or ADMIN role
- `status` (optional): Must be "Active" or "Inactive" (default: "Active")

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "name": "Engineering",
  "parentId": "parent-uuid-or-null",
  "departmentHeadId": "head-uuid-or-null",
  "departmentHead": {
    "id": "head-uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "DepartmentHead"
  },
  "status": "Active",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 2. List Departments

**Endpoint:** `GET /api/v1/departments`

**Description:** Get paginated list of departments with filtering, search, and sorting.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search in department name
- `status` (optional): Filter by status ("Active" or "Inactive")
- `parentId` (optional): Filter by parent department ID
- `departmentHeadId` (optional): Filter by department head ID
- `sortBy` (optional): Sort field (default: "name", options: "name", "createdAt", "updatedAt", "status")
- `sortOrder` (optional): Sort order (default: "asc", options: "asc", "desc")
- `includeHierarchy` (optional): Include child departments (default: false)
- `includeStats` (optional): Include department statistics (default: false)

**Example Requests:**
```
GET /api/v1/departments?page=1&limit=20
GET /api/v1/departments?search=engineering&status=Active
GET /api/v1/departments?parentId=xxx&sortBy=name&sortOrder=asc
GET /api/v1/departments?departmentHeadId=xxx&includeStats=true
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Engineering",
      "parentId": null,
      "departmentHeadId": "head-uuid",
      "departmentHead": {
        "id": "head-uuid",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "DepartmentHead"
      },
      "status": "Active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

---

### 3. Get Department by ID

**Endpoint:** `GET /api/v1/departments/:id`

**Description:** Get a specific department by ID.

**Query Parameters:**
- `includeHierarchy` (optional): Include child departments (default: false)
- `includeStats` (optional): Include department statistics (default: false)

**Example Request:**
```
GET /api/v1/departments/uuid?includeStats=true
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Engineering",
  "parentId": null,
  "departmentHeadId": "head-uuid",
  "departmentHead": {
    "id": "head-uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "DepartmentHead"
  },
  "status": "Active",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "statistics": {
    "departmentId": "uuid",
    "directStats": {
      "employees": 25,
      "assets": 150,
      "childDepartments": 3,
      "activeAllocations": 45
    },
    "totalStats": {
      "employees": 50,
      "assets": 300
    }
  }
}
```

---

### 4. Update Department

**Endpoint:** `PUT /api/v1/departments/:id`

**Description:** Update department details.

**Request Body:**
```json
{
  "name": "Engineering & Development",
  "parentId": "new-parent-id",
  "departmentHeadId": "new-head-id",
  "status": "Inactive"
}
```

**Validation:**
- All fields are optional
- `parentId` cannot create circular references
- `departmentHeadId` must be a valid employee with appropriate role

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Engineering & Development",
  "parentId": "new-parent-id",
  "departmentHeadId": "new-head-id",
  "departmentHead": {
    "id": "new-head-id",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "DepartmentHead"
  },
  "status": "Inactive",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

---

### 5. Delete Department

**Endpoint:** `DELETE /api/v1/departments/:id`

**Description:** Delete a department (only if no active children or employees).

**Response:** `204 No Content`

**Error Response:** `409 Conflict`
```json
{
  "message": "Cannot delete department",
  "blockers": {
    "activeChildren": 2,
    "employees": 15
  }
}
```

---

### 6. Search Departments

**Endpoint:** `GET /api/v1/departments/search`

**Description:** Search departments by name with pagination and sorting.

**Query Parameters:**
- `q` (required): Search query
- `page`, `limit`, `sortBy`, `sortOrder` (optional): Same as list endpoint

**Example Request:**
```
GET /api/v1/departments/search?q=engineering&page=1&limit=10
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Engineering",
      "parentId": null,
      "departmentHeadId": "head-uuid",
      "departmentHead": {
        "id": "head-uuid",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "DepartmentHead"
      },
      "status": "Active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### 7. Get Department Hierarchy

**Endpoint:** `GET /api/v1/departments/hierarchy`

**Description:** Get the complete department hierarchy tree structure.

**Query Parameters:**
- `rootId` (optional): Get hierarchy starting from specific department (default: root departments)

**Example Requests:**
```
GET /api/v1/departments/hierarchy
GET /api/v1/departments/hierarchy?rootId=uuid
```

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Engineering",
    "parentId": null,
    "departmentHeadId": "head-uuid",
    "departmentHead": {
      "id": "head-uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "DepartmentHead"
    },
    "status": "Active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "children": [
      {
        "id": "child-uuid",
        "name": "Software Development",
        "parentId": "uuid",
        "departmentHeadId": "child-head-uuid",
        "departmentHead": {
          "id": "child-head-uuid",
          "name": "Jane Smith",
          "email": "jane@example.com",
          "role": "DepartmentHead"
        },
        "status": "Active",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "children": []
      }
    ]
  }
]
```

---

### 8. Get Department Statistics

**Endpoint:** `GET /api/v1/departments/:id/statistics`

**Description:** Get detailed statistics for a department including direct and total counts.

**Response:** `200 OK`
```json
{
  "departmentId": "uuid",
  "directStats": {
    "employees": 25,
    "assets": 150,
    "childDepartments": 3,
    "activeAllocations": 45
  },
  "totalStats": {
    "employees": 50,
    "assets": 300
  }
}
```

**Field Descriptions:**
- `directStats`: Counts for the department only
- `totalStats`: Counts including all sub-departments recursively

---

### 9. Set Department Head

**Endpoint:** `POST /api/v1/departments/:id/head`

**Description:** Assign a department head to a department.

**Request Body:**
```json
{
  "employeeId": "employee-uuid"
}
```

**Validation:**
- `employeeId` is required
- Employee must exist
- Employee must have DEPT_HEAD or ADMIN role

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Engineering",
  "parentId": null,
  "departmentHeadId": "employee-uuid",
  "departmentHead": {
    "id": "employee-uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "DepartmentHead"
  },
  "status": "Active",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

---

### 10. Remove Department Head

**Endpoint:** `DELETE /api/v1/departments/:id/head`

**Description:** Remove the department head from a department.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Engineering",
  "parentId": null,
  "departmentHeadId": null,
  "departmentHead": null,
  "status": "Active",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

---

### 11. Get Departments by Head

**Endpoint:** `GET /api/v1/departments/by-head/:headId`

**Description:** Get all departments headed by a specific employee.

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Engineering",
    "parentId": null,
    "departmentHeadId": "head-uuid",
    "departmentHead": {
      "id": "head-uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "DepartmentHead"
    },
    "status": "Active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Validation error",
  "errors": [
    "Department name is required"
  ]
}
```

### 404 Not Found
```json
{
  "message": "Department not found"
}
```

### 409 Conflict
```json
{
  "message": "Circular parent reference detected"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```

---

## Database Schema

### Department Model

```prisma
model Department {
  id               String           @id @default(uuid())
  name             String
  parentId         String?
  parent           Department?      @relation("DeptHierarchy", fields: [parentId], references: [id])
  children         Department[]     @relation("DeptHierarchy")
  departmentHead   Employee?        @relation("DepartmentHead", fields: [departmentHeadId], references: [id])
  departmentHeadId String?
  status           DepartmentStatus @default(ACTIVE)
  employees        Employee[]
  assets           Asset[]
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  @@map("departments")
}
```

### Employee Model (Updated)

```prisma
model Employee {
  id                String      @id @default(uuid())
  name              String
  email             String      @unique
  password          String
  role              Role        @default(EMPLOYEE)
  department        Department? @relation(fields: [departmentId], references: [id])
  departmentId      String?
  headedDepartments Department[] @relation("DepartmentHead")
  // ... other fields
}
```

---

## Repository Pattern

The module uses a repository pattern (`departmentRepository.js`) that provides:

- **Data Access Layer**: Abstracts database operations
- **Business Logic**: Cycle detection, hierarchy building, statistics calculation
- **Reusable Methods**: Common queries can be reused across controllers
- **Testability**: Easy to mock for testing

Key repository methods:
- `create(data)` - Create new department
- `findById(id)` - Find by ID with includes
- `findAll(options)` - Find with pagination, filtering, search, sorting
- `update(id, data)` - Update department
- `delete(id)` - Delete department
- `getHierarchy(rootId)` - Get tree structure
- `getStatistics(id)` - Calculate statistics
- `wouldCycle(id, parentId)` - Prevent circular references
- `canDelete(id)` - Check deletion constraints

---

## Validation Rules

### Department Name
- Required for creation
- Must be non-empty string
- Trimmed before storage

### Status
- Must be "Active" or "Inactive"
- Case-insensitive
- Default: "Active"

### Parent Department
- Optional
- Must exist if provided
- Cannot create circular references
- Can be set to null (remove parent)

### Department Head
- Optional
- Must exist if provided
- Must have DEPT_HEAD or ADMIN role
- Can be set to null (remove head)

---

## Usage Examples

### Creating a Department Hierarchy

```javascript
// Create root department
POST /api/v1/departments
{
  "name": "Engineering",
  "status": "Active"
}

// Create child department
POST /api/v1/departments
{
  "name": "Software Development",
  "parentId": "engineering-uuid",
  "status": "Active"
}

// Assign department head
POST /api/v1/departments/engineering-uuid/head
{
  "employeeId": "john-uuid"
}
```

### Getting Department Statistics

```javascript
GET /api/v1/departments/engineering-uuid/statistics

// Response includes:
// - Direct employee count
// - Direct asset count
// - Child department count
// - Active allocations
// - Total counts (including sub-departments)
```

### Searching and Filtering

```javascript
// Search for departments
GET /api/v1/departments/search?q=engineering

// Filter by status
GET /api/v1/departments?status=Active

// Filter by parent
GET /api/v1/departments?parentId=parent-uuid

// Combine filters
GET /api/v1/departments?status=Active&parentId=parent-uuid&page=1&limit=20&sortBy=name&sortOrder=asc
```

---

## Migration Notes

To apply the database schema changes:

```bash
cd backend
npx prisma migrate dev --name add_department_head
```

This will:
1. Add `departmentHeadId` field to departments table
2. Add foreign key constraint to employees table
3. Update the Prisma client

---

## Testing

The module includes comprehensive validation and error handling. Test cases should cover:

1. **CRUD Operations**: Create, read, update, delete departments
2. **Hierarchy**: Parent-child relationships, circular reference prevention
3. **Department Head**: Assignment, removal, role validation
4. **Statistics**: Direct and total counts
5. **Search & Filter**: Various query combinations
6. **Validation**: Invalid data, missing required fields
7. **Constraints**: Deletion with children/employees
8. **Pagination**: Page and limit handling
9. **Sorting**: Different sort fields and orders

---

## Future Enhancements

Potential future features:
- Department permissions and access control
- Department budget management
- Department location/address
- Department contact information
- Department performance metrics
- Bulk operations (create, update, delete)
- Department templates
- Audit trail for department changes
- Department approval workflow
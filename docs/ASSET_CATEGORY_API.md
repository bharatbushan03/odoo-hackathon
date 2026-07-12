# Asset Category Module API Documentation

## Overview

The Asset Category module provides comprehensive CRUD operations for managing asset categories with advanced features including hierarchy management, depreciation methods, category statistics, and powerful search capabilities.

## Base URL

```
/api/asset-categories
```

## Authentication

- **Create/Update/Delete**: Requires ADMIN or ASSET_MANAGER role
- **Read Operations**: Requires authentication (any role)

## Features

- ✅ CRUD Operations (Create, Read, Update, Delete)
- ✅ Category Name & Description
- ✅ Parent Category (Hierarchy)
- ✅ Depreciation Method (Straight Line, Declining Balance, etc.)
- ✅ Expected Life (in months)
- ✅ Image URL
- ✅ Status (Active/Inactive)
- ✅ Repository Pattern
- ✅ Validation
- ✅ Pagination
- ✅ Filtering
- ✅ Search
- ✅ Sorting
- ✅ Category Statistics

---

## Endpoints

### 1. Create Asset Category

**Endpoint:** `POST /api/asset-categories`

**Description:** Create a new asset category with optional parent and depreciation settings.

**Request Body:**
```json
{
  "name": "Laptops",
  "description": "Portable computers and related accessories",
  "parentId": "optional-parent-category-id",
  "depreciationMethod": "StraightLine",
  "expectedLife": 60,
  "image": "https://example.com/image.jpg",
  "status": "Active",
  "customFields": {
    "manufacturer": "Dell",
    "warranty": "3 years"
  }
}
```

**Validation:**
- `name` (required): Non-empty string, must be unique
- `description` (optional): String
- `parentId` (optional): Must be a valid category ID
- `depreciationMethod` (optional): Must be one of the supported methods
- `expectedLife` (optional): Positive integer (months)
- `image` (optional): String (URL)
- `status` (optional): Must be "Active" or "Inactive" (default: "Active")
- `customFields` (optional): Object

**Depreciation Methods:**
- `StraightLine` - Equal depreciation over asset life
- `DecliningBalance` - Depreciation at a fixed rate
- `DoubleDeclining` - Accelerated depreciation
- `SumOfYears` - Sum-of-years-digits method
- `UnitsOfProduction` - Based on usage
- `None` - No depreciation

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "name": "Laptops",
  "description": "Portable computers and related accessories",
  "parentId": "parent-uuid-or-null",
  "parent": {
    "id": "parent-uuid",
    "name": "Computers"
  },
  "depreciationMethod": "StraightLine",
  "expectedLife": 60,
  "image": "https://example.com/image.jpg",
  "status": "Active",
  "customFields": {
    "manufacturer": "Dell",
    "warranty": "3 years"
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 2. List Asset Categories

**Endpoint:** `GET /api/asset-categories`

**Description:** Get paginated list of asset categories with filtering, search, and sorting.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search in category name and description
- `status` (optional): Filter by status ("Active" or "Inactive")
- `parentId` (optional): Filter by parent category ID
- `depreciationMethod` (optional): Filter by depreciation method
- `sortBy` (optional): Sort field (default: "name", options: "name", "createdAt", "updatedAt", "status", "depreciationMethod")
- `sortOrder` (optional): Sort order (default: "asc", options: "asc", "desc")
- `includeHierarchy` (optional): Include child categories (default: false)
- `includeStats` (optional): Include category statistics (default: false)

**Example Requests:**
```
GET /api/asset-categories?page=1&limit=20
GET /api/asset-categories?search=laptop&status=Active
GET /api/asset-categories?parentId=xxx&sortBy=name&sortOrder=asc
GET /api/asset-categories?depreciationMethod=StraightLine&includeStats=true
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Laptops",
      "description": "Portable computers and related accessories",
      "parentId": "parent-uuid",
      "parent": {
        "id": "parent-uuid",
        "name": "Computers"
      },
      "depreciationMethod": "StraightLine",
      "expectedLife": 60,
      "image": "https://example.com/image.jpg",
      "status": "Active",
      "customFields": {
        "manufacturer": "Dell",
        "warranty": "3 years"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### 3. Get Asset Category by ID

**Endpoint:** `GET /api/asset-categories/:id`

**Description:** Get a specific asset category by ID.

**Query Parameters:**
- `includeHierarchy` (optional): Include child categories (default: false)
- `includeStats` (optional): Include category statistics (default: false)

**Example Request:**
```
GET /api/asset-categories/uuid?includeStats=true
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Laptops",
  "description": "Portable computers and related accessories",
  "parentId": "parent-uuid",
  "parent": {
    "id": "parent-uuid",
    "name": "Computers"
  },
  "depreciationMethod": "StraightLine",
  "expectedLife": 60,
  "image": "https://example.com/image.jpg",
  "status": "Active",
  "customFields": {
    "manufacturer": "Dell",
    "warranty": "3 years"
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "statistics": {
    "categoryId": "uuid",
    "directStats": {
      "assets": 25,
      "activeAssets": 20,
      "totalValue": 75000.00
    },
    "totalStats": {
      "assets": 35,
      "totalValue": 105000.00
    }
  }
}
```

---

### 4. Update Asset Category

**Endpoint:** `PUT /api/asset-categories/:id`

**Description:** Update asset category details.

**Request Body:**
```json
{
  "name": "Laptops & Tablets",
  "description": "Portable computing devices",
  "parentId": "new-parent-id",
  "depreciationMethod": "DoubleDeclining",
  "expectedLife": 48,
  "image": "https://example.com/new-image.jpg",
  "status": "Inactive",
  "customFields": {
    "manufacturer": "Various",
    "warranty": "2 years"
  }
}
```

**Validation:**
- All fields are optional
- `name` must remain unique
- `parentId` cannot create circular references

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Laptops & Tablets",
  "description": "Portable computing devices",
  "parentId": "new-parent-id",
  "parent": {
    "id": "new-parent-id",
    "name": "Computing Devices"
  },
  "depreciationMethod": "DoubleDeclining",
  "expectedLife": 48,
  "image": "https://example.com/new-image.jpg",
  "status": "Inactive",
  "customFields": {
    "manufacturer": "Various",
    "warranty": "2 years"
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

---

### 5. Delete Asset Category

**Endpoint:** `DELETE /api/asset-categories/:id`

**Description:** Delete an asset category (only if no active children or assets).

**Response:** `204 No Content`

**Error Response:** `409 Conflict`
```json
{
  "message": "Cannot delete category",
  "blockers": {
    "activeChildren": 2,
    "assets": 15
  }
}
```

---

### 6. Search Asset Categories

**Endpoint:** `GET /api/asset-categories/search`

**Description:** Search asset categories by name or description with pagination and sorting.

**Query Parameters:**
- `q` (required): Search query
- `page`, `limit`, `sortBy`, `sortOrder` (optional): Same as list endpoint

**Example Request:**
```
GET /api/asset-categories/search?q=laptop&page=1&limit=10
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Laptops",
      "description": "Portable computers and related accessories",
      "parentId": "parent-uuid",
      "parent": {
        "id": "parent-uuid",
        "name": "Computers"
      },
      "depreciationMethod": "StraightLine",
      "expectedLife": 60,
      "image": "https://example.com/image.jpg",
      "status": "Active",
      "customFields": {
        "manufacturer": "Dell",
        "warranty": "3 years"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 3,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### 7. Get Category Hierarchy

**Endpoint:** `GET /api/asset-categories/hierarchy`

**Description:** Get the complete category hierarchy tree structure.

**Query Parameters:**
- `rootId` (optional): Get hierarchy starting from specific category (default: root categories)

**Example Requests:**
```
GET /api/asset-categories/hierarchy
GET /api/asset-categories/hierarchy?rootId=uuid
```

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Computers",
    "description": "Computer equipment and accessories",
    "parentId": null,
    "parent": null,
    "depreciationMethod": "StraightLine",
    "expectedLife": 60,
    "image": "https://example.com/computers.jpg",
    "status": "Active",
    "customFields": {},
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "children": [
      {
        "id": "child-uuid",
        "name": "Laptops",
        "description": "Portable computers",
        "parentId": "uuid",
        "parent": {
          "id": "uuid",
          "name": "Computers"
        },
        "depreciationMethod": "StraightLine",
        "expectedLife": 48,
        "image": "https://example.com/laptops.jpg",
        "status": "Active",
        "customFields": {},
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "children": []
      }
    ]
  }
]
```

---

### 8. Get Category Statistics

**Endpoint:** `GET /api/asset-categories/:id/statistics`

**Description:** Get detailed statistics for a category including direct and total counts.

**Response:** `200 OK`
```json
{
  "categoryId": "uuid",
  "directStats": {
    "assets": 25,
    "activeAssets": 20,
    "totalValue": 75000.00
  },
  "totalStats": {
    "assets": 35,
    "totalValue": 105000.00
  }
}
```

**Field Descriptions:**
- `directStats`: Counts for the category only
- `totalStats`: Counts including all sub-categories recursively

---

### 9. Get Root Categories

**Endpoint:** `GET /api/asset-categories/root`

**Description:** Get all root categories (categories without a parent).

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Computers",
    "description": "Computer equipment and accessories",
    "parentId": null,
    "parent": null,
    "depreciationMethod": "StraightLine",
    "expectedLife": 60,
    "image": "https://example.com/computers.jpg",
    "status": "Active",
    "customFields": {},
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 10. Get Child Categories

**Endpoint:** `GET /api/asset-categories/parent/:parentId`

**Description:** Get all child categories of a specific parent category.

**Response:** `200 OK`
```json
[
  {
    "id": "child-uuid",
    "name": "Laptops",
    "description": "Portable computers",
    "parentId": "parent-uuid",
    "parent": {
      "id": "parent-uuid",
      "name": "Computers"
    },
    "depreciationMethod": "StraightLine",
    "expectedLife": 48,
    "image": "https://example.com/laptops.jpg",
    "status": "Active",
    "customFields": {},
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
    "Category name is required"
  ]
}
```

### 404 Not Found
```json
{
  "message": "Category not found"
}
```

### 409 Conflict
```json
{
  "message": "Category name already exists"
}
```

or

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

### AssetCategory Model

```prisma
model AssetCategory {
  id                 String             @id @default(uuid())
  name               String             @unique
  description        String?
  parentId           String?
  parent             AssetCategory?     @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children           AssetCategory[]    @relation("CategoryHierarchy")
  depreciationMethod DepreciationMethod @default(NONE)
  expectedLife       Int?
  image              String?
  status             CategoryStatus     @default(ACTIVE)
  customFields       Json?
  assets             Asset[]
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt

  @@map("asset_categories")
}
```

### Enums

```prisma
enum DepreciationMethod {
  STRAIGHT_LINE
  DECLINING_BALANCE
  DOUBLE_DECLINING
  SUM_OF_YEARS
  UNITS_OF_PRODUCTION
  NONE
}

enum CategoryStatus {
  ACTIVE
  INACTIVE
}
```

---

## Repository Pattern

The module uses a repository pattern (`assetCategoryRepository.js`) that provides:

- **Data Access Layer**: Abstracts database operations
- **Business Logic**: Cycle detection, hierarchy building, statistics calculation
- **Reusable Methods**: Common queries can be reused across controllers
- **Testability**: Easy to mock for testing

Key repository methods:
- `create(data)` - Create new category
- `findById(id)` - Find by ID with includes
- `findByName(name)` - Find by name
- `findAll(options)` - Find with pagination, filtering, search, sorting
- `update(id, data)` - Update category
- `delete(id)` - Delete category
- `getHierarchy(rootId)` - Get tree structure
- `getStatistics(id)` - Calculate statistics
- `wouldCycle(id, parentId)` - Prevent circular references
- `canDelete(id)` - Check deletion constraints
- `findRootCategories()` - Get root categories
- `findChildCategories(parentId)` - Get child categories

---

## Validation Rules

### Category Name
- Required for creation
- Must be non-empty string
- Must be unique across all categories
- Trimmed before storage

### Description
- Optional
- Must be string if provided
- Trimmed before storage

### Parent Category
- Optional
- Must exist if provided
- Cannot create circular references
- Can be set to null (remove parent)

### Depreciation Method
- Optional
- Must be one of the supported methods
- Default: "None"

### Expected Life
- Optional
- Must be positive integer (months)
- Represents useful life for depreciation calculations

### Image
- Optional
- Must be string (URL) if provided

### Status
- Optional
- Must be "Active" or "Inactive"
- Case-insensitive
- Default: "Active"

### Custom Fields
- Optional
- Must be object if provided
- Flexible JSON structure for additional metadata

---

## Usage Examples

### Creating a Category Hierarchy

```javascript
// Create root category
POST /api/asset-categories
{
  "name": "Computers",
  "description": "Computer equipment and accessories",
  "depreciationMethod": "StraightLine",
  "expectedLife": 60,
  "status": "Active"
}

// Create child category
POST /api/asset-categories
{
  "name": "Laptops",
  "description": "Portable computers",
  "parentId": "computers-uuid",
  "depreciationMethod": "StraightLine",
  "expectedLife": 48,
  "status": "Active"
}
```

### Getting Category Statistics

```javascript
GET /api/asset-categories/laptops-uuid/statistics

// Response includes:
// - Direct asset count
// - Active asset count
// - Total value of assets
// - Total counts (including sub-categories)
```

### Searching and Filtering

```javascript
// Search for categories
GET /api/asset-categories/search?q=laptop

// Filter by status
GET /api/asset-categories?status=Active

// Filter by parent
GET /api/asset-categories?parentId=parent-uuid

// Filter by depreciation method
GET /api/asset-categories?depreciationMethod=StraightLine

// Combine filters
GET /api/asset-categories?status=Active&parentId=parent-uuid&page=1&limit=20&sortBy=name&sortOrder=asc
```

---

## Depreciation Methods Explained

### Straight Line
- Equal depreciation amount each year
- Formula: (Cost - Salvage Value) / Useful Life
- Best for: Assets that wear out evenly over time

### Declining Balance
- Depreciation at a fixed percentage of book value
- Higher depreciation in early years
- Best for: Assets that lose value quickly

### Double Declining
- Accelerated depreciation at twice the straight-line rate
- Maximum depreciation in early years
- Best for: Technology assets with rapid obsolescence

### Sum of Years
- Depreciation based on sum of years' digits
- Front-loaded depreciation
- Best for: Assets with higher productivity in early years

### Units of Production
- Depreciation based on actual usage
- Formula: (Cost - Salvage Value) / Total Units × Units Produced
- Best for: Machinery and equipment

### None
- No depreciation calculated
- Best for: Land, assets that don't depreciate

---

## Migration Notes

To apply the database schema changes:

```bash
cd backend
npx prisma migrate dev --name enhance_asset_category
```

This will:
1. Add new fields to asset_categories table
2. Add depreciation method and status enums
3. Add parent-child relationship for hierarchy
4. Update the Prisma client

---

## Testing

The module includes comprehensive validation and error handling. Test cases should cover:

1. **CRUD Operations**: Create, read, update, delete categories
2. **Hierarchy**: Parent-child relationships, circular reference prevention
3. **Depreciation Methods**: Different method validation
4. **Statistics**: Direct and total counts
5. **Search & Filter**: Various query combinations
6. **Validation**: Invalid data, missing required fields
7. **Constraints**: Deletion with children/assets
8. **Pagination**: Page and limit handling
9. **Sorting**: Different sort fields and orders
10. **Custom Fields**: JSON field handling

---

## Future Enhancements

Potential future features:
- Category-specific depreciation calculators
- Bulk operations (create, update, delete)
- Category templates
- Category approval workflow
- Category versioning
- Category permission controls
- Category audit trail
- Image upload and storage
- Category export/import
- Category merge functionality
- Advanced depreciation reporting
- Category-based asset recommendations
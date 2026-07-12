# Vendor Management Module API Documentation

## Overview

The Vendor Management module provides comprehensive CRUD operations for managing vendors, their contacts, purchase history, and warranty information. This module enables organizations to track vendor relationships, monitor vendor performance, manage purchase orders, and maintain warranty records.

## Base URL

```
/api
```

## Authentication

- **Create/Update/Delete**: Requires ADMIN or ASSET_MANAGER role
- **Read Operations**: Requires authentication (any role)

## Features

- ✅ CRUD Operations for Vendors
- ✅ Vendor Rating System (0-5 scale)
- ✅ Vendor Contacts Management
- ✅ Purchase History Tracking
- ✅ Warranty Information Management
- ✅ Vendor Statistics
- ✅ Search and Filtering
- ✅ Pagination
- ✅ Validation

---

## Vendor Endpoints

### 1. Create Vendor

**Endpoint:** `POST /api/vendors`

**Description:** Create a new vendor with contact information and business details.

**Request Body:**
```json
{
  "organizationId": "org-uuid",
  "name": "Tech Supplies Inc.",
  "code": "TECH001",
  "contactPerson": "John Smith",
  "email": "john@techsupplies.com",
  "phone": "+1-555-0123",
  "address": "123 Business Street",
  "city": "San Francisco",
  "state": "CA",
  "country": "USA",
  "zipCode": "94102",
  "taxId": "123456789",
  "paymentTerms": "Net 30",
  "isPreferred": false,
  "isActive": true,
  "rating": 4.5,
  "status": "ACTIVE",
  "notes": "Primary supplier for computer equipment",
  "website": "https://techsupplies.com",
  "creditLimit": 50000.00,
  "currency": "USD"
}
```

**Validation:**
- `name` (required): Non-empty string
- `code` (required): Non-empty string, must be unique
- `email` (optional): Valid email format
- `rating` (optional): Number between 0 and 5
- `creditLimit` (optional): Positive number
- `status` (optional): Must be one of the valid statuses

**Response:** `201 Created`
```json
{
  "id": "vendor-uuid",
  "organizationId": "org-uuid",
  "name": "Tech Supplies Inc.",
  "code": "TECH001",
  "contactPerson": "John Smith",
  "email": "john@techsupplies.com",
  "phone": "+1-555-0123",
  "address": "123 Business Street",
  "city": "San Francisco",
  "state": "CA",
  "country": "USA",
  "zipCode": "94102",
  "taxId": "123456789",
  "paymentTerms": "Net 30",
  "isPreferred": false,
  "isActive": true,
  "rating": 4.5,
  "status": "ACTIVE",
  "notes": "Primary supplier for computer equipment",
  "website": "https://techsupplies.com",
  "creditLimit": 50000.00,
  "currency": "USD",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 2. List Vendors

**Endpoint:** `GET /api/vendors`

**Description:** Get paginated list of vendors with filtering, search, and sorting.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search in name, code, email, contact person
- `status` (optional): Filter by status (ACTIVE, INACTIVE, BLOCKED, UNDER_REVIEW)
- `isActive` (optional): Filter by active status (true/false)
- `isPreferred` (optional): Filter by preferred status (true/false)
- `sortBy` (optional): Sort field (default: "name", options: "name", "code", "rating", "createdAt", "updatedAt")
- `sortOrder` (optional): Sort order (default: "asc", options: "asc", "desc")
- `includeContacts` (optional): Include vendor contacts (default: false)
- `includePurchaseOrders` (optional): Include purchase orders (default: false)
- `includeWarranties` (optional): Include warranties (default: false)

**Example Requests:**
```
GET /api/vendors?page=1&limit=20
GET /api/vendors?search=tech&status=ACTIVE
GET /api/vendors?isPreferred=true&sortBy=rating&sortOrder=desc
GET /api/vendors?includeContacts=true&includePurchaseOrders=true
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "vendor-uuid",
      "name": "Tech Supplies Inc.",
      "code": "TECH001",
      "contactPerson": "John Smith",
      "email": "john@techsupplies.com",
      "phone": "+1-555-0123",
      "rating": 4.5,
      "status": "ACTIVE",
      "isPreferred": true,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "contacts": [],
      "purchaseOrders": [],
      "warranties": []
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

### 3. Get Vendor by ID

**Endpoint:** `GET /api/vendors/:id`

**Description:** Get a specific vendor by ID with full details.

**Response:** `200 OK`
```json
{
  "id": "vendor-uuid",
  "name": "Tech Supplies Inc.",
  "code": "TECH001",
  "contactPerson": "John Smith",
  "email": "john@techsupplies.com",
  "phone": "+1-555-0123",
  "address": "123 Business Street",
  "city": "San Francisco",
  "state": "CA",
  "country": "USA",
  "zipCode": "94102",
  "taxId": "123456789",
  "paymentTerms": "Net 30",
  "isPreferred": true,
  "isActive": true,
  "rating": 4.5,
  "status": "ACTIVE",
  "notes": "Primary supplier for computer equipment",
  "website": "https://techsupplies.com",
  "creditLimit": 50000.00,
  "currency": "USD",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "contacts": [
    {
      "id": "contact-uuid",
      "name": "John Smith",
      "email": "john@techsupplies.com",
      "phone": "+1-555-0123",
      "position": "Sales Manager",
      "isPrimary": true,
      "notes": "Primary contact for all orders"
    }
  ],
  "purchaseOrders": [],
  "warranties": []
}
```

---

### 4. Update Vendor

**Endpoint:** `PUT /api/vendors/:id`

**Description:** Update vendor details.

**Request Body:**
```json
{
  "name": "Tech Supplies Inc. (Updated)",
  "contactPerson": "Jane Doe",
  "email": "jane@techsupplies.com",
  "rating": 4.8,
  "isPreferred": true,
  "status": "ACTIVE",
  "creditLimit": 75000.00
}
```

**Response:** `200 OK`
```json
{
  "id": "vendor-uuid",
  "name": "Tech Supplies Inc. (Updated)",
  "code": "TECH001",
  "contactPerson": "Jane Doe",
  "email": "jane@techsupplies.com",
  "rating": 4.8,
  "isPreferred": true,
  "status": "ACTIVE",
  "creditLimit": 75000.00,
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

---

### 5. Delete Vendor

**Endpoint:** `DELETE /api/vendors/:id`

**Description:** Delete a vendor (only if no purchase orders, warranties, or assets are linked).

**Response:** `204 No Content`

**Error Response:** `409 Conflict`
```json
{
  "message": "Cannot delete vendor",
  "blockers": {
    "purchaseOrders": 5,
    "warranties": 3,
    "assets": 10
  }
}
```

---

### 6. Get Vendor Statistics

**Endpoint:** `GET /api/vendors/:id/statistics`

**Description:** Get detailed statistics for a vendor including purchase history and warranty information.

**Response:** `200 OK`
```json
{
  "vendorId": "vendor-uuid",
  "purchaseOrders": {
    "total": 25,
    "totalAmount": 125000.00
  },
  "warranties": {
    "total": 15,
    "active": 12
  },
  "assets": 50
}
```

---

### 7. Update Vendor Rating

**Endpoint:** `PUT /api/vendors/:id/rating`

**Description:** Update the vendor's rating (0-5 scale).

**Request Body:**
```json
{
  "rating": 4.8
}
```

**Response:** `200 OK`
```json
{
  "id": "vendor-uuid",
  "name": "Tech Supplies Inc.",
  "rating": 4.8,
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

---

### 8. Search Vendors

**Endpoint:** `GET /api/vendors/search`

**Description:** Search vendors by name, code, email, or contact person.

**Query Parameters:**
- `q` (required): Search query
- `page`, `limit`, `sortBy`, `sortOrder` (optional): Same as list endpoint

**Example Request:**
```
GET /api/vendors/search?q=tech&page=1&limit=10
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "vendor-uuid",
      "name": "Tech Supplies Inc.",
      "code": "TECH001",
      "rating": 4.5,
      "status": "ACTIVE"
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

### 9. Get Preferred Vendors

**Endpoint:** `GET /api/vendors/preferred`

**Description:** Get all preferred vendors for the organization, sorted by rating.

**Response:** `200 OK`
```json
[
  {
    "id": "vendor-uuid",
    "name": "Tech Supplies Inc.",
    "code": "TECH001",
    "rating": 4.8,
    "isPreferred": true,
    "status": "ACTIVE"
  }
]
```

---

## Vendor Contact Endpoints

### 10. Create Vendor Contact

**Endpoint:** `POST /api/vendors/:vendorId/contacts`

**Description:** Add a new contact to a vendor.

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "john@techsupplies.com",
  "phone": "+1-555-0123",
  "position": "Sales Manager",
  "isPrimary": true,
  "notes": "Primary contact for all orders"
}
```

**Response:** `201 Created`
```json
{
  "id": "contact-uuid",
  "vendorId": "vendor-uuid",
  "name": "John Smith",
  "email": "john@techsupplies.com",
  "phone": "+1-555-0123",
  "position": "Sales Manager",
  "isPrimary": true,
  "notes": "Primary contact for all orders",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 11. Get Vendor Contacts

**Endpoint:** `GET /api/vendors/:vendorId/contacts`

**Description:** Get all contacts for a specific vendor.

**Response:** `200 OK`
```json
[
  {
    "id": "contact-uuid",
    "name": "John Smith",
    "email": "john@techsupplies.com",
    "phone": "+1-555-0123",
    "position": "Sales Manager",
    "isPrimary": true,
    "notes": "Primary contact for all orders"
  }
]
```

---

### 12. Get Vendor Contact by ID

**Endpoint:** `GET /api/vendor-contacts/:id`

**Description:** Get a specific vendor contact by ID.

**Response:** `200 OK`
```json
{
  "id": "contact-uuid",
  "vendorId": "vendor-uuid",
  "name": "John Smith",
  "email": "john@techsupplies.com",
  "phone": "+1-555-0123",
  "position": "Sales Manager",
  "isPrimary": true,
  "notes": "Primary contact for all orders",
  "vendor": {
    "id": "vendor-uuid",
    "name": "Tech Supplies Inc.",
    "code": "TECH001"
  }
}
```

---

### 13. Update Vendor Contact

**Endpoint:** `PUT /api/vendor-contacts/:id`

**Description:** Update vendor contact details.

**Request Body:**
```json
{
  "name": "John Smith Jr.",
  "email": "john.jr@techsupplies.com",
  "position": "Senior Sales Manager",
  "isPrimary": true
}
```

**Response:** `200 OK`
```json
{
  "id": "contact-uuid",
  "name": "John Smith Jr.",
  "email": "john.jr@techsupplies.com",
  "position": "Senior Sales Manager",
  "isPrimary": true,
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

---

### 14. Delete Vendor Contact

**Endpoint:** `DELETE /api/vendor-contacts/:id`

**Description:** Delete a vendor contact.

**Response:** `204 No Content`

---

### 15. Set Primary Contact

**Endpoint:** `PUT /api/vendor-contacts/:id/primary`

**Description:** Set a contact as the primary contact for the vendor (automatically removes primary status from other contacts).

**Response:** `200 OK`
```json
{
  "id": "contact-uuid",
  "name": "John Smith",
  "isPrimary": true,
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

---

## Purchase Order Endpoints

### 16. Create Purchase Order

**Endpoint:** `POST /api/purchase-orders`

**Description:** Create a new purchase order with items.

**Request Body:**
```json
{
  "orderNumber": "PO-2024-001",
  "vendorId": "vendor-uuid",
  "orderDate": "2024-01-01T00:00:00.000Z",
  "expectedDate": "2024-01-15T00:00:00.000Z",
  "status": "PENDING",
  "totalAmount": 15000.00,
  "currency": "USD",
  "notes": "Urgent order for new equipment",
  "internalNotes": "Approved by management",
  "items": [
    {
      "assetId": "asset-uuid",
      "description": "Laptop Computer",
      "quantity": 10,
      "unitPrice": 1200.00,
      "totalPrice": 12000.00
    },
    {
      "description": "Computer Monitor",
      "quantity": 5,
      "unitPrice": 600.00,
      "totalPrice": 3000.00
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "id": "po-uuid",
  "orderNumber": "PO-2024-001",
  "vendorId": "vendor-uuid",
  "orderDate": "2024-01-01T00:00:00.000Z",
  "expectedDate": "2024-01-15T00:00:00.000Z",
  "status": "PENDING",
  "totalAmount": 15000.00,
  "currency": "USD",
  "notes": "Urgent order for new equipment",
  "internalNotes": "Approved by management",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "vendor": {
    "id": "vendor-uuid",
    "name": "Tech Supplies Inc.",
    "code": "TECH001"
  },
  "items": [
    {
      "id": "item-uuid",
      "description": "Laptop Computer",
      "quantity": 10,
      "unitPrice": 1200.00,
      "totalPrice": 12000.00,
      "receivedQuantity": 0
    }
  ]
}
```

---

### 17. List Purchase Orders

**Endpoint:** `GET /api/purchase-orders`

**Description:** Get paginated list of purchase orders with filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `vendorId` (optional): Filter by vendor
- `status` (optional): Filter by status (PENDING, CONFIRMED, SHIPPED, RECEIVED, CANCELLED)
- `startDate` (optional): Filter orders from this date
- `endDate` (optional): Filter orders until this date
- `sortBy` (optional): Sort field (default: "orderDate")
- `sortOrder` (optional): Sort order (default: "desc")

**Example Requests:**
```
GET /api/purchase-orders?page=1&limit=20
GET /api/purchase-orders?vendorId=vendor-uuid&status=RECEIVED
GET /api/purchase-orders?startDate=2024-01-01&endDate=2024-12-31
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "po-uuid",
      "orderNumber": "PO-2024-001",
      "vendorId": "vendor-uuid",
      "orderDate": "2024-01-01T00:00:00.000Z",
      "status": "RECEIVED",
      "totalAmount": 15000.00,
      "vendor": {
        "id": "vendor-uuid",
        "name": "Tech Supplies Inc."
      },
      "items": []
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

### 18. Get Purchase Order by ID

**Endpoint:** `GET /api/purchase-orders/:id`

**Description:** Get a specific purchase order with full details.

**Response:** `200 OK`
```json
{
  "id": "po-uuid",
  "orderNumber": "PO-2024-001",
  "vendorId": "vendor-uuid",
  "orderDate": "2024-01-01T00:00:00.000Z",
  "expectedDate": "2024-01-15T00:00:00.000Z",
  "receivedDate": "2024-01-14T00:00:00.000Z",
  "status": "RECEIVED",
  "totalAmount": 15000.00,
  "currency": "USD",
  "notes": "Urgent order for new equipment",
  "internalNotes": "Approved by management",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-14T00:00:00.000Z",
  "vendor": {
    "id": "vendor-uuid",
    "name": "Tech Supplies Inc.",
    "code": "TECH001",
    "email": "john@techsupplies.com"
  },
  "items": [
    {
      "id": "item-uuid",
      "assetId": "asset-uuid",
      "description": "Laptop Computer",
      "quantity": 10,
      "unitPrice": 1200.00,
      "totalPrice": 12000.00,
      "receivedQuantity": 10,
      "asset": {
        "id": "asset-uuid",
        "name": "Laptop Computer",
        "assetTag": "LAPTOP001"
      }
    }
  ]
}
```

---

### 19. Update Purchase Order

**Endpoint:** `PUT /api/purchase-orders/:id`

**Description:** Update purchase order details.

**Request Body:**
```json
{
  "status": "RECEIVED",
  "receivedDate": "2024-01-14T00:00:00.000Z",
  "notes": "Order received in good condition"
}
```

**Response:** `200 OK`
```json
{
  "id": "po-uuid",
  "status": "RECEIVED",
  "receivedDate": "2024-01-14T00:00:00.000Z",
  "notes": "Order received in good condition",
  "updatedAt": "2024-01-14T00:00:00.000Z"
}
```

---

### 20. Delete Purchase Order

**Endpoint:** `DELETE /api/purchase-orders/:id`

**Description:** Delete a purchase order.

**Response:** `204 No Content`

---

## Warranty Endpoints

### 21. Create Warranty

**Endpoint:** `POST /api/warranties`

**Description:** Create a new warranty for an asset.

**Request Body:**
```json
{
  "vendorId": "vendor-uuid",
  "assetId": "asset-uuid",
  "warrantyNumber": "WARRANTY-12345",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2026-01-01T00:00:00.000Z",
  "type": "STANDARD",
  "coverage": "Hardware and labor",
  "terms": "2-year manufacturer warranty",
  "status": "ACTIVE",
  "notes": "Extended warranty purchased"
}
```

**Response:** `201 Created`
```json
{
  "id": "warranty-uuid",
  "vendorId": "vendor-uuid",
  "assetId": "asset-uuid",
  "warrantyNumber": "WARRANTY-12345",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2026-01-01T00:00:00.000Z",
  "type": "STANDARD",
  "coverage": "Hardware and labor",
  "terms": "2-year manufacturer warranty",
  "status": "ACTIVE",
  "notes": "Extended warranty purchased",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "vendor": {
    "id": "vendor-uuid",
    "name": "Tech Supplies Inc.",
    "code": "TECH001"
  },
  "asset": {
    "id": "asset-uuid",
    "name": "Laptop Computer",
    "assetTag": "LAPTOP001"
  }
}
```

---

### 22. List Warranties

**Endpoint:** `GET /api/warranties`

**Description:** Get paginated list of warranties with filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `vendorId` (optional): Filter by vendor
- `assetId` (optional): Filter by asset
- `status` (optional): Filter by status (ACTIVE, EXPIRED, CANCELLED, CLAIMED)
- `type` (optional): Filter by type (STANDARD, EXTENDED, MANUFACTURER, THIRD_PARTY)
- `sortBy` (optional): Sort field (default: "startDate")
- `sortOrder` (optional): Sort order (default: "desc")

**Example Requests:**
```
GET /api/warranties?page=1&limit=20
GET /api/warranties?vendorId=vendor-uuid&status=ACTIVE
GET /api/warranties?assetId=asset-uuid&type=EXTENDED
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "warranty-uuid",
      "vendorId": "vendor-uuid",
      "assetId": "asset-uuid",
      "warrantyNumber": "WARRANTY-12345",
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2026-01-01T00:00:00.000Z",
      "type": "STANDARD",
      "status": "ACTIVE",
      "vendor": {
        "id": "vendor-uuid",
        "name": "Tech Supplies Inc."
      },
      "asset": {
        "id": "asset-uuid",
        "name": "Laptop Computer"
      }
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

### 23. Get Warranty by ID

**Endpoint:** `GET /api/warranties/:id`

**Description:** Get a specific warranty with full details including claims.

**Response:** `200 OK`
```json
{
  "id": "warranty-uuid",
  "vendorId": "vendor-uuid",
  "assetId": "asset-uuid",
  "warrantyNumber": "WARRANTY-12345",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2026-01-01T00:00:00.000Z",
  "type": "STANDARD",
  "coverage": "Hardware and labor",
  "terms": "2-year manufacturer warranty",
  "status": "ACTIVE",
  "notes": "Extended warranty purchased",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "vendor": {
    "id": "vendor-uuid",
    "name": "Tech Supplies Inc.",
    "code": "TECH001",
    "email": "john@techsupplies.com"
  },
  "asset": {
    "id": "asset-uuid",
    "name": "Laptop Computer",
    "assetTag": "LAPTOP001"
  },
  "claims": []
}
```

---

### 24. Update Warranty

**Endpoint:** `PUT /api/warranties/:id`

**Description:** Update warranty details.

**Request Body:**
```json
{
  "status": "CLAIMED",
  "endDate": "2026-01-01T00:00:00.000Z",
  "notes": "Warranty claim submitted"
}
```

**Response:** `200 OK`
```json
{
  "id": "warranty-uuid",
  "status": "CLAIMED",
  "endDate": "2026-01-01T00:00:00.000Z",
  "notes": "Warranty claim submitted",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

---

### 25. Delete Warranty

**Endpoint:** `DELETE /api/warranties/:id`

**Description:** Delete a warranty.

**Response:** `204 No Content`

---

### 26. Get Asset Warranties

**Endpoint:** `GET /api/vendor-assets/:assetId/warranties`

**Description:** Get all active warranties for a specific asset.

**Response:** `200 OK`
```json
[
  {
    "id": "warranty-uuid",
    "vendorId": "vendor-uuid",
    "assetId": "asset-uuid",
    "warrantyNumber": "WARRANTY-12345",
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2026-01-01T00:00:00.000Z",
    "type": "STANDARD",
    "status": "ACTIVE",
    "vendor": {
      "id": "vendor-uuid",
      "name": "Tech Supplies Inc."
    },
    "asset": {
      "id": "asset-uuid",
      "name": "Laptop Computer"
    }
  }
]
```

---

### 27. Get Expiring Warranties

**Endpoint:** `GET /api/warranties/expiring`

**Description:** Get warranties that are expiring within a specified number of days.

**Query Parameters:**
- `days` (optional): Number of days to look ahead (default: 30)

**Example Request:**
```
GET /api/warranties/expiring?days=30
```

**Response:** `200 OK`
```json
[
  {
    "id": "warranty-uuid",
    "vendorId": "vendor-uuid",
    "assetId": "asset-uuid",
    "warrantyNumber": "WARRANTY-12345",
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-01-25T00:00:00.000Z",
    "type": "STANDARD",
    "status": "ACTIVE",
    "vendor": {
      "id": "vendor-uuid",
      "name": "Tech Supplies Inc."
    },
    "asset": {
      "id": "asset-uuid",
      "name": "Laptop Computer"
    }
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
    "Vendor name is required",
    "Invalid email format"
  ]
}
```

### 404 Not Found
```json
{
  "message": "Vendor not found"
}
```

### 409 Conflict
```json
{
  "message": "Vendor code already exists"
}
```

or

```json
{
  "message": "Cannot delete vendor",
  "blockers": {
    "purchaseOrders": 5,
    "warranties": 3,
    "assets": 10
  }
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

### Vendor Model

```prisma
model Vendor {
  id              String   @id @default(uuid())
  organizationId  String
  name            String
  code            String   @unique
  contactPerson   String?
  email           String?
  phone           String?
  address         String?
  city            String?
  state           String?
  country         String?
  zipCode         String?
  taxId           String?
  paymentTerms    String?
  isPreferred     Boolean  @default(false)
  isActive        Boolean  @default(true)
  rating          Float    @default(0)
  status          VendorStatus @default(ACTIVE)
  notes           String?
  website         String?
  creditLimit     Float?
  currency        String   @default("USD")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime?

  organization         Organization        @relation(fields: [organizationId], references: [id])
  maintenanceRequests MaintenanceRequest[]
  contacts             VendorContact[]
  purchaseOrders       PurchaseOrder[]
  warranties           Warranty[]
  assets               Asset[]

  @@unique([organizationId, name])
  @@index([organizationId])
  @@index([code])
  @@index([isActive])
  @@index([status])
  @@index([deletedAt])
  @@map("vendors")
}
```

### VendorContact Model

```prisma
model VendorContact {
  id        String   @id @default(uuid())
  vendorId  String
  vendor    Vendor   @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  name      String
  email     String?
  phone     String?
  position  String?
  isPrimary Boolean  @default(false)
  notes     String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([vendorId])
  @@map("vendor_contacts")
}
```

### PurchaseOrder Model

```prisma
model PurchaseOrder {
  id              String   @id @default(uuid())
  orderNumber     String   @unique
  vendorId        String
  vendor          Vendor   @relation(fields: [vendorId], references: [id])
  orderDate       DateTime
  expectedDate    DateTime?
  receivedDate    DateTime?
  status          PurchaseOrderStatus @default(PENDING)
  totalAmount     Float
  currency        String   @default("USD")
  notes           String?
  internalNotes   String?
  
  items           PurchaseOrderItem[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([orderNumber])
  @@index([vendorId])
  @@index([status])
  @@map("purchase_orders")
}
```

### Warranty Model

```prisma
model Warranty {
  id              String   @id @default(uuid())
  vendorId        String
  vendor          Vendor   @relation(fields: [vendorId], references: [id])
  assetId         String
  asset           Asset    @relation(fields: [assetId], references: [id])
  warrantyNumber  String?
  startDate       DateTime
  endDate         DateTime
  type            WarrantyType
  coverage        String?
  terms           String?
  status          WarrantyStatus @default(ACTIVE)
  notes           String?
  
  claims          WarrantyClaim[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([vendorId])
  @@index([assetId])
  @@index([status])
  @@map("warranties")
}
```

### Enums

```prisma
enum VendorStatus {
  ACTIVE
  INACTIVE
  BLOCKED
  UNDER_REVIEW
}

enum PurchaseOrderStatus {
  PENDING
  CONFIRMED
  SHIPPED
  RECEIVED
  CANCELLED
}

enum WarrantyType {
  STANDARD
  EXTENDED
  MANUFACTURER
  THIRD_PARTY
}

enum WarrantyStatus {
  ACTIVE
  EXPIRED
  CANCELLED
  CLAIMED
}
```

---

## Validation Rules

### Vendor Validation
- **Name**: Required, non-empty string
- **Code**: Required, non-empty string, must be unique
- **Email**: Valid email format if provided
- **Rating**: Number between 0 and 5
- **Credit Limit**: Positive number if provided
- **Status**: Must be one of the valid statuses

### Vendor Contact Validation
- **Name**: Required, non-empty string
- **Email**: Valid email format if provided
- **Is Primary**: Boolean, only one primary contact per vendor

### Purchase Order Validation
- **Order Number**: Required, must be unique
- **Vendor ID**: Required, must exist
- **Order Date**: Required
- **Total Amount**: Required, positive number
- **Status**: Must be one of the valid statuses
- **Items**: Array of order items

### Warranty Validation
- **Vendor ID**: Required, must exist
- **Asset ID**: Required, must exist
- **Start Date**: Required
- **End Date**: Required
- **Type**: Must be one of the valid types
- **Status**: Must be one of the valid statuses

---

## Usage Examples

### Creating a Complete Vendor Record

```javascript
// Create vendor
POST /api/vendors
{
  "name": "Tech Supplies Inc.",
  "code": "TECH001",
  "email": "info@techsupplies.com",
  "rating": 4.5,
  "status": "ACTIVE"
}

// Add primary contact
POST /api/vendors/vendor-uuid/contacts
{
  "name": "John Smith",
  "email": "john@techsupplies.com",
  "phone": "+1-555-0123",
  "position": "Sales Manager",
  "isPrimary": true
}

// Create purchase order
POST /api/purchase-orders
{
  "orderNumber": "PO-2024-001",
  "vendorId": "vendor-uuid",
  "orderDate": "2024-01-01T00:00:00.000Z",
  "totalAmount": 15000.00,
  "items": [
    {
      "description": "Laptop Computer",
      "quantity": 10,
      "unitPrice": 1200.00,
      "totalPrice": 12000.00
    }
  ]
}

// Create warranty for purchased asset
POST /api/warranties
{
  "vendorId": "vendor-uuid",
  "assetId": "asset-uuid",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2026-01-01T00:00:00.000Z",
  "type": "STANDARD",
  "status": "ACTIVE"
}
```

### Managing Vendor Performance

```javascript
// Update vendor rating based on performance
PUT /api/vendors/vendor-uuid/rating
{
  "rating": 4.8
}

// Get vendor statistics to assess performance
GET /api/vendors/vendor-uuid/statistics

// Mark vendor as preferred based on good performance
PUT /api/vendors/vendor-uuid
{
  "isPreferred": true
}
```

### Tracking Warranty Expirations

```javascript
// Get warranties expiring in the next 30 days
GET /api/warranties/expiring?days=30

// Get all active warranties for a specific asset
GET /api/vendor-assets/asset-uuid/warranties

// Update warranty status when claim is filed
PUT /api/warranties/warranty-uuid
{
  "status": "CLAIMED",
  "notes": "Claim submitted for screen replacement"
}
```

---

## Migration Notes

To apply the database schema changes:

```bash
cd backend
npx prisma migrate dev --name add_vendor_management
```

This will:
1. Add vendor-related tables and relationships
2. Add vendor status and related enums
3. Update the Asset model to include vendor relationship
4. Update the Prisma client

---

## Testing

The module includes comprehensive validation and error handling. Test cases should cover:

1. **Vendor CRUD**: Create, read, update, delete vendors
2. **Vendor Contacts**: Multiple contacts per vendor, primary contact management
3. **Purchase Orders**: Order creation, status updates, item management
4. **Warranties**: Warranty creation, expiration tracking, status updates
5. **Vendor Rating**: Rating updates, rating-based sorting
6. **Search & Filter**: Various query combinations
7. **Validation**: Invalid data, missing required fields
8. **Constraints**: Deletion with linked records
9. **Statistics**: Accurate calculation of vendor metrics
10. **Pagination**: Page and limit handling

---

## Future Enhancements

Potential future features:
- Vendor performance analytics dashboard
- Automated vendor rating based on delivery times and quality
- Vendor comparison and benchmarking
- Bulk vendor import/export
- Vendor approval workflow
- Vendor contract management
- Vendor compliance tracking
- Automated warranty expiration notifications
- Purchase order approval workflow
- Vendor portal for self-service
- Vendor document management
- Multi-currency support for international vendors
- Vendor risk assessment
- Vendor tier management
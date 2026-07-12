# Asset Management API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints except authentication endpoints require Bearer token authentication.

## Content-Type
All requests should include: `Content-Type: application/json`

---

## Resources

### 📦 Assets

#### Create Asset
```
POST /api/assets
Authentication: Required
```

Request Body:
```json
{
  "name": "MacBook Pro M2",
  "assetTag": "AST-001",
  "serialNumber": "MQD83LL/A",
  "barcode": "978-1234567890",
  "qrcode": "https://example.com/qr/AST-001",
  "vendor": "Apple",
  "purchaseDate": "2024-01-15",
  "purchaseCost": 2499.99,
  "warranty": "2 years",
  "warrantyExpires": "2026-01-15",
  "departmentId": "uuid",
  "assignedEmployeeId": "uuid",
  "currentLocation": "IT Department",
  "categoryId": "uuid",
  "lifecycleState": "NEW",
  "status": "Available",
  "condition": "Good",
  "notes": "Primary work laptop",
  "purchaseOrderNumber": "PO-12345",
  "orderDate": "2024-01-10"
}
```

Response: 201 Created
```json
{
  "success": true,
  "message": "Asset created successfully",
  "newAsset": { ... }
}
```

---

#### Get Asset
```
GET /api/assets/:id
Authentication: Required
```

Query Parameters:
- `attachments=true` - Include asset attachments (optional)
- `audit=true` - Include audit logs (optional)

Response: 200 OK
```json
{
  "success": true,
  "asset": {
    "id": "uuid",
    "assetId": "AST-001",
    "name": "MacBook Pro M2",
    "assetTag": "AST-001",
    "serialNumber": "MQD83LL/A",
    "barcode": "978-1234567890",
    "qrcode": "https://example.com/qr/AST-001",
    "vendor": "Apple",
    "purchaseDate": "2024-01-15T00:00:00.000Z",
    "purchaseCost": 2499.99,
    "warranty": "2 years",
    "warrantyExpires": "2026-01-15T23:59:59.000Z",
    "department": {
      "id": "uuid",
      "name": "IT"
    },
    "assignedEmployee": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "category": {
      "id": "uuid",
      "name": "Laptops"
    },
    "lifecycleState": "NEW",
    "status": "Available",
    "condition": "Good",
    "notes": "Primary work laptop",
    "createdAt": "2024-01-20T10:00:00.000Z",
    "updatedAt": "2024-01-20T10:00:00.000Z"
  }
}
```

---

#### List Assets
```
GET /api/assets
Authentication: Required
Authorization: ASSET_MANAGER or higher
```

Query Parameters:
- `page=1` - Page number (default: 1)
- `limit=10` - Items per page (default: 10, max: 100)
- `sortBy=createdAt` - Sort field (default: createdAt)
- `sortOrder=desc` - Sort order (asc/desc)
- `name=MacBook` - Search by name
- `assetTag=AST-001` - Search by asset tag
- `serialNumber=MQD83LL/A` - Search by serial number
- `barcode=978-1234567890` - Search by barcode
- `vendor=Apple` - Search by vendor
- `departmentId=uuid` - Filter by department
- `categoryId=uuid` - Filter by category
- `status=Available` - Filter by status
- `lifecycleState=NEW` - Filter by lifecycle state
- `currentLocation=IT` - Search by location

Response: 200 OK
```json
{
  "success": true,
  "message": "Assets retrieved successfully",
  "result": [
    { ...asset item... }
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

#### Update Asset
```
PUT /api/assets/:id
Authentication: Required
Authorization: ASSET_MANAGER or higher
```

Request Body:
```json
{
  "name": "Updated MacBook Pro M2",
  "status": "Allocated",
  "currentLocation": "Office 101"
}
```

Response: 200 OK
```json
{
  "success": true,
  "message": "Asset updated successfully",
  "updatedAsset": { ... }
}
```

---

#### Delete Asset
```
DELETE /api/assets/:id
Authentication: Required
Authorization: SUPER_ADMIN or ADMIN
```

Response: 204 No Content

---

### 🔲 QR & Barcode Generation

#### Generate Codes
```
POST /api/assets/:id/codes
Authentication: Required
Authorization: ASSET_MANAGER or higher
```

Request Body:
```json
{
  "codeFormat": "composite",
  "options": {
    "width": 2,
    "height": 100
  }
}
```

Supported code formats:
- `qr` - QR Code only
- `barcode` - Barcode only
- `composite` - Combined QR and Barcode

Response: 200 OK
```json
{
  "success": true,
  "message": "Codes generated successfully",
  "codes": {
    "barcode": "IMAGE_DATA...",
    "qr": "DATA_BASE64...",
    "data": {
      "assetId": "uuid",
      "barcodeData": "AST-001",
      "qrData": "..."
    }
  }
}
```

---

### 📎 Asset Attachments

#### Upload Attachment
```
POST /api/assets/:id/attachments
Authentication: Required
Authorization: ASSET_MANAGER or higher
Content-Type: multipart/form-data
```

FormData:
- `file` - File to upload
- `fileName` - Optional custom filename

Response: 201 Created
```json
{
  "success": true,
  "message": "Attachment uploaded successfully",
  "attachment": {
    "id": "uuid",
    "assetId": "uuid",
    "fileName": "document.pdf",
    "filePath": "/uploads/...",
    "fileType": "application/pdf",
    "fileSize": 102400,
    "uploadedBy": "uuid",
    "uploadedAt": "2024-01-20T10:00:00.000Z"
  }
}
```

---

#### List Attachments
```
GET /api/assets/:id/attachments
Authentication: Required
```

Response: 200 OK
```json
{
  "success": true,
  "attachments": [
    { ...attachment... }
  ]
}
```

---

#### Delete Attachment
```
DELETE /api/assets/:id/attachments/:attachmentId
Authentication: Required
Authorization: ASSET_MANAGER or higher
```

Response: 204 No Content

---

### 📄 CSV Import/Export

#### Download CSV Template
```
GET /api/assets/template/csv
Authentication: Required
Authorization: ASSET_MANAGER or higher
```

Response: 200 OK
```json
{
  "success": true,
  "headers": ["Asset ID", "Asset Name", ...],
  "sampleData": [ ... ]
}
```

---

#### Preview CSV Import
```
POST /api/assets/preview/csv
Authentication: Required
Authorization: ASSET_MANAGER or higher
Content-Type: multipart/form-data
```

FormData:
- `file` - CSV file to preview

Response: 200 OK
```json
{
  "success": true,
  "totalRecords": 150,
  "preview": [
    { "row": 2, "assetId": "AST-001", "assetName": "MacBook Pro M2", ... }
  ],
  "headers": ["Asset ID", "Asset Name", ...]
}
```

---

#### Import Assets from CSV
```
POST /api/assets/import/csv
Authentication: Required
Authorization: ASSET_MANAGER or higher
Content-Type: multipart/form-data
```

FormData:
- `file` - CSV file to import
- `categoryIdMapping` - Object mapping category names to IDs (optional)
- `departmentIdMapping` - Object mapping department names to IDs (optional)

Request Body (Additional):
```json
{
  "categoryIdMapping": {
    "Laptops": "uuid",
    "Desktops": "uuid"
  },
  "departmentIdMapping": {
    "IT": "uuid",
    "HR": "uuid"
  }
}
```

Response: 200 OK
```json
{
  "success": true,
  "message": "Assets imported successfully",
  "report": {
    "importId": "uuid",
    "totalRows": 150,
    "successfulImports": 145,
    "failedImports": 5,
    "errors": [
      { "row": 10, "message": "Invalid date format..." },
      { "row": 25, "message": "Category 'XYZ' not found..." }
    ],
    "timestamp": "2024-01-20T10:00:00.000Z",
    "status": "partial_success"
  },
  "validatedRecords": [ ... ]
}
```

---

### 📊 Statistics

#### Get Asset Statistics
```
GET /api/assets/stats
Authentication: Required
Authorization: ASSET_MANAGER or higher
```

Response: 200 OK
```json
{
  "success": true,
  "message": "Asset statistics retrieved successfully",
  "stats": {
    "totalAssets": 1000,
    "byStatus": {
      "Available": 500,
      "Allocated": 300,
      "UnderMaintenance": 100,
      "Retired": 50,
      "Disposed": 50
    },
    "byLifecycleState": {
      "NEW": 200,
      "IN_USE": 600,
      "MAINTENANCE": 100,
      "RETIRED": 50,
      "DISPOSED": 50
    },
    "byCategory": [
      {
        "categoryId": "uuid",
        "categoryName": "Laptops",
        "count": 400
      },
      {
        "categoryId": "uuid",
        "categoryName": "Desktops",
        "count": 300
      }
    ]
  }
}
```

---

### 📋 Audit History

#### Get Asset History
```
GET /api/assets/:id/history
Authentication: Required
Authorization: ASSET_MANAGER or higher
```

Query Parameters:
- `page=1` - Page number (default: 1)
- `limit=50` - Items per page (default: 50)

Response: 200 OK
```json
{
  "success": true,
  "history": [
    {
      "logId": "uuid",
      "timestamp": "2024-01-20T10:00:00.000Z",
      "action": "UPDATE",
      "oldValue": { ... },
      "newValue": { ... },
      "actor": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com",
        "department": "IT"
      },
      "description": "Asset updated - Fields changed: Status, Current Location"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 50,
  "totalPages": 1
}
```

---

#### Get Audit Logs
```
GET /api/assets/:id/audit-logs
Authentication: Required
Authorization: ASSET_MANAGER or higher
```

Query Parameters:
- `action=UPDATE` - Filter by action
- `actorId=uuid` - Filter by actor
- `role=ASSET_MANAGER` - Filter by role
- `startDate=2024-01-01` - Start date
- `endDate=2024-12-31` - End date
- `page=1` - Page number
- `limit=50` - Items per page
- `sortBy=changedAt` - Sort field
- `sortOrder=desc` - Sort order

Response: 200 OK
```json
{
  "success": true,
  "logs": [ ... ]
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Validation error",
  "errors": [
    {
      "field": "purchaseDate",
      "message": "Invalid date format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "You don't have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Asset not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "Asset tag already exists"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```

---

## HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `204 No Content` - Request successful (no body)
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (duplicate data)
- `413 Payload Too Large` - File size exceeds limit
- `422 Unprocessable Entity` - CSV validation failed
- `500 Internal Server Error` - Server error

---

## Bulk Operations

To perform bulk operations, use the CSV import functionality described above.

**Bulk Update:** Export your data as CSV, make changes, and use the import functionality.

**Bulk Delete:** Recommended to use the REST API for individual deletions to maintain data integrity.

---

## Rate Limiting

All endpoints that require authentication are rate-limited:
- Standard requests: 100 requests per minute per user
- Upload endpoints: 10 requests per minute per user

Rate limit response:
```json
{
  "success": false,
  "message": "Too many requests, please try again later",
  "retryAfter": 60
}
```
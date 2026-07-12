# Vendor Management API - Swagger Documentation

## Overview

This directory contains comprehensive Swagger/OpenAPI documentation for the Vendor Management API, including interactive API testing and complete API specifications.

## Files

- **vendor-management-openapi.yaml** - Complete OpenAPI 3.0 specification
- **index.html** - Standalone Swagger UI HTML page
- **swagger-config.js** - Swagger UI configuration options
- **swagger-server.js** - Standalone Swagger UI server
- **README.md** - This file

## Features

### Complete API Documentation

- ✅ **Schemas**: All data models with detailed properties and validation rules
- ✅ **Authentication**: JWT Bearer token authentication documentation
- ✅ **Request Examples**: Multiple request examples for each endpoint
- ✅ **Response Examples**: Comprehensive response examples with all possible scenarios
- ✅ **Error Documentation**: Detailed error responses with examples
- ✅ **Pagination**: Complete pagination meta information
- ✅ **Filtering**: All available filters documented with examples
- ✅ **Sorting**: Sort options and configuration documented

### Interactive API Testing

- ✅ **Try It Out**: Interactive API testing directly from Swagger UI
- ✅ **Authentication**: Built-in JWT token management
- ✅ **Request/Response**: Real-time request/response viewing
- ✅ **Request Duration**: Display of API response times
- ✅ **Filter/Search**: Built-in filtering and search for endpoints

## Installation

### Install Dependencies

```bash
cd backend
npm install swagger-ui-express swagger-ui-dist yamljs
```

## Usage

### Option 1: Integrated with Main Server

The Swagger UI is integrated into the main application server and runs on the same port.

```bash
cd backend
npm start
```

Access the documentation at:
- Swagger UI: `http://localhost:5000/api-docs`
- API Spec (YAML): `http://localhost:5000/api-docs/spec`
- API Spec (JSON): `http://localhost:5000/api-docs/spec.json`

### Option 2: Standalone Swagger Server

Run the Swagger UI on a separate port for development purposes.

```bash
cd backend
npm run swagger
```

Access the documentation at:
- Swagger UI: `http://localhost:3001`
- API Spec (YAML): `http://localhost:3001/spec`
- API Spec (JSON): `http://localhost:3001/spec.json`

### Option 3: Standalone HTML File

Open the `index.html` file directly in a browser for a client-side only Swagger UI.

```bash
cd backend/swagger
# Open index.html in your browser
```

## Authentication

### Setting Up JWT Token

1. Click the **Authorize** button in Swagger UI
2. Enter your JWT token in the format: `Bearer <your-token>`
3. Click **Authorize**
4. Close the authorization dialog

The token will be persisted in localStorage and automatically included in all requests.

### Getting a JWT Token

You'll need to authenticate with the API first to get a JWT token:

```bash
# Example authentication request
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password"
  }'
```

Copy the `token` from the response and use it in Swagger UI.

## API Endpoints Documentation

### Vendors (9 endpoints)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/vendors` | Create a new vendor | ADMIN, ASSET_MANAGER |
| GET | `/vendors` | List all vendors with pagination | All authenticated users |
| GET | `/vendors/search` | Search vendors | All authenticated users |
| GET | `/vendors/preferred` | Get preferred vendors | All authenticated users |
| GET | `/vendors/{id}` | Get vendor by ID | All authenticated users |
| PUT | `/vendors/{id}` | Update vendor | ADMIN, ASSET_MANAGER |
| DELETE | `/vendors/{id}` | Delete vendor | ADMIN, ASSET_MANAGER |
| GET | `/vendors/{id}/statistics` | Get vendor statistics | All authenticated users |
| PUT | `/vendors/{id}/rating` | Update vendor rating | ADMIN, ASSET_MANAGER |

### Vendor Contacts (6 endpoints)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/vendors/{vendorId}/contacts` | Create vendor contact | ADMIN, ASSET_MANAGER |
| GET | `/vendors/{vendorId}/contacts` | Get vendor contacts | All authenticated users |
| GET | `/vendor-contacts/{id}` | Get contact by ID | All authenticated users |
| PUT | `/vendor-contacts/{id}` | Update contact | ADMIN, ASSET_MANAGER |
| DELETE | `/vendor-contacts/{id}` | Delete contact | ADMIN, ASSET_MANAGER |
| PUT | `/vendor-contacts/{id}/primary` | Set as primary contact | ADMIN, ASSET_MANAGER |

### Purchase Orders (5 endpoints)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/purchase-orders` | Create purchase order | ADMIN, ASSET_MANAGER |
| GET | `/purchase-orders` | List purchase orders | All authenticated users |
| GET | `/purchase-orders/{id}` | Get purchase order by ID | All authenticated users |
| PUT | `/purchase-orders/{id}` | Update purchase order | ADMIN, ASSET_MANAGER |
| DELETE | `/purchase-orders/{id}` | Delete purchase order | ADMIN, ASSET_MANAGER |

### Warranties (7 endpoints)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/warranties` | Create warranty | ADMIN, ASSET_MANAGER |
| GET | `/warranties` | List warranties | All authenticated users |
| GET | `/warranties/expiring` | Get expiring warranties | All authenticated users |
| GET | `/warranties/{id}` | Get warranty by ID | All authenticated users |
| PUT | `/warranties/{id}` | Update warranty | ADMIN, ASSET_MANAGER |
| DELETE | `/warranties/{id}` | Delete warranty | ADMIN, ASSET_MANAGER |
| GET | `/vendor-assets/{assetId}/warranties` | Get asset warranties | All authenticated users |

## Schemas

### Vendor

```yaml
id: string (uuid)
organizationId: string (uuid)
name: string
code: string (unique)
contactPerson: string?
email: string (email)
phone: string?
address: string?
city: string?
state: string?
country: string?
zipCode: string?
taxId: string?
paymentTerms: string?
isPreferred: boolean
isActive: boolean
rating: number (0-5)
status: VendorStatus
notes: string?
website: string (uri)
creditLimit: number?
currency: string (default: USD)
createdAt: datetime
updatedAt: datetime
contacts: VendorContact[]
purchaseOrders: PurchaseOrder[]
warranties: Warranty[]
```

### VendorContact

```yaml
id: string (uuid)
vendorId: string (uuid)
name: string
email: string (email)
phone: string?
position: string?
isPrimary: boolean
notes: string?
createdAt: datetime
updatedAt: datetime
```

### PurchaseOrder

```yaml
id: string (uuid)
orderNumber: string (unique)
vendorId: string (uuid)
orderDate: datetime
expectedDate: datetime?
receivedDate: datetime?
status: PurchaseOrderStatus
totalAmount: number
currency: string (default: USD)
notes: string?
internalNotes: string?
createdAt: datetime
updatedAt: datetime
vendor: Vendor
items: PurchaseOrderItem[]
```

### Warranty

```yaml
id: string (uuid)
vendorId: string (uuid)
assetId: string (uuid)
warrantyNumber: string?
startDate: datetime
endDate: datetime
type: WarrantyType
coverage: string?
terms: string?
status: WarrantyStatus
notes: string?
createdAt: datetime
updatedAt: datetime
vendor: Vendor
asset: Asset
claims: WarrantyClaim[]
```

## Enums

### VendorStatus
- `ACTIVE` - Vendor is active and can be used
- `INACTIVE` - Vendor is temporarily inactive
- `BLOCKED` - Vendor is blocked from new orders
- `UNDER_REVIEW` - Vendor is under review

### PurchaseOrderStatus
- `PENDING` - Order is pending approval
- `CONFIRMED` - Order is confirmed by vendor
- `SHIPPED` - Order has been shipped
- `RECEIVED` - Order has been received
- `CANCELLED` - Order has been cancelled

### WarrantyType
- `STANDARD` - Standard manufacturer warranty
- `EXTENDED` - Extended warranty
- `MANUFACTURER` - Manufacturer warranty
- `THIRD_PARTY` - Third-party warranty

### WarrantyStatus
- `ACTIVE` - Warranty is currently active
- `EXPIRED` - Warranty has expired
- `CANCELLED` - Warranty has been cancelled
- `CLAIMED` - Warranty has been claimed

## Pagination

All list endpoints support pagination with the following parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (minimum: 1) |
| `limit` | integer | 10 | Items per page (minimum: 1, maximum: 100) |

### Response Format

```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

## Filtering

### Vendor Filtering

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search in name, code, email, contact person |
| `status` | VendorStatus | Filter by vendor status |
| `isActive` | boolean | Filter by active status |
| `isPreferred` | boolean | Filter by preferred status |

### Purchase Order Filtering

| Parameter | Type | Description |
|-----------|------|-------------|
| `vendorId` | string (uuid) | Filter by vendor |
| `status` | PurchaseOrderStatus | Filter by order status |
| `startDate` | datetime | Filter orders from this date |
| `endDate` | datetime | Filter orders until this date |

### Warranty Filtering

| Parameter | Type | Description |
|-----------|------|-------------|
| `vendorId` | string (uuid) | Filter by vendor |
| `assetId` | string (uuid) | Filter by asset |
| `status` | WarrantyStatus | Filter by warranty status |
| `type` | WarrantyType | Filter by warranty type |

## Sorting

### Vendor Sorting

| Parameter | Type | Options | Default |
|-----------|------|---------|---------|
| `sortBy` | string | name, code, rating, createdAt, updatedAt | name |
| `sortOrder` | string | asc, desc | asc |

### Purchase Order Sorting

| Parameter | Type | Options | Default |
|-----------|------|---------|---------|
| `sortBy` | string | orderDate, totalAmount, status | orderDate |
| `sortOrder` | string | asc, desc | desc |

### Warranty Sorting

| Parameter | Type | Options | Default |
|-----------|------|---------|---------|
| `sortBy` | string | startDate, endDate, type, status | startDate |
| `sortOrder` | string | asc, desc | desc |

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

### 401 Unauthorized

```json
{
  "message": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "message": "Forbidden - insufficient permissions"
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

Or with blockers:

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

## Request Examples

### Create Vendor

```bash
curl -X POST http://localhost:5000/api/vendors \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "organizationId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Tech Supplies Inc.",
    "code": "TECH001",
    "email": "info@techsupplies.com",
    "phone": "+1-555-0123",
    "rating": 4.5,
    "status": "ACTIVE"
  }'
```

### List Vendors with Pagination

```bash
curl -X GET "http://localhost:5000/api/vendors?page=1&limit=20&status=ACTIVE&sortBy=rating&sortOrder=desc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Search Vendors

```bash
curl -X GET "http://localhost:5000/api/vendors/search?q=tech&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create Purchase Order

```bash
curl -X POST http://localhost:5000/api/purchase-orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
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
  }'
```

### Create Warranty

```bash
curl -X POST http://localhost:5000/api/warranties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "vendorId": "vendor-uuid",
    "assetId": "asset-uuid",
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2026-01-01T00:00:00.000Z",
    "type": "STANDARD",
    "status": "ACTIVE"
  }'
```

## Response Examples

### Vendor Creation Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "organizationId": "550e8400-e29b-41d4-a716-446655440000",
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
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Vendor List Response

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Tech Supplies Inc.",
      "code": "TECH001",
      "rating": 4.5,
      "status": "ACTIVE"
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

### Vendor Statistics Response

```json
{
  "vendorId": "550e8400-e29b-41d4-a716-446655440001",
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

## Development

### Updating the OpenAPI Specification

To update the API specification:

1. Edit `vendor-management-openapi.yaml`
2. Validate the YAML syntax using an online validator
3. Test the changes in Swagger UI
4. Commit the changes

### Adding New Endpoints

When adding new endpoints to the API:

1. Update the controller and routes
2. Add the endpoint to the OpenAPI specification
3. Include request/response examples
4. Document any new schemas
5. Add error responses
6. Test in Swagger UI

### Customizing Swagger UI

Edit the swagger options in `server.js` or `swagger-server.js`:

```javascript
swaggerOptions: {
  // Custom configuration options
  docExpansion: 'none', // or 'list', 'full'
  defaultModelsExpandDepth: 1,
  defaultModelExpandDepth: 1,
  displayRequestDuration: true,
  tryItOutEnabled: true,
  // Add more options as needed
}
```

## Best Practices

### Documentation

1. **Keep examples updated**: Ensure request/response examples match actual API behavior
2. **Document all errors**: Include all possible error responses
3. **Use descriptive names**: Use clear, descriptive parameter and schema names
4. **Include validation rules**: Document all validation rules in schema descriptions
5. **Add usage examples**: Provide real-world usage examples

### Testing

1. **Test all endpoints**: Verify each endpoint works as documented
2. **Test authentication**: Ensure JWT authentication works correctly
3. **Test validation**: Verify validation rules are enforced
4. **Test error cases**: Ensure error responses are accurate
5. **Test examples**: Verify examples are syntactically correct

### Maintenance

1. **Regular updates**: Keep the documentation in sync with API changes
2. **Version control**: Track changes to the OpenAPI specification
3. **Peer review**: Have team members review documentation changes
4. **Automated testing**: Consider automated API documentation testing
5. **User feedback**: Collect feedback from API users to improve documentation

## Troubleshooting

### Swagger UI Not Loading

1. Check that `swagger-ui-express` and `yamljs` are installed
2. Verify the OpenAPI specification file path is correct
3. Check for YAML syntax errors
4. Ensure the server is running on the correct port

### Authentication Issues

1. Verify JWT token is valid and not expired
2. Check that the token format is correct: `Bearer <token>`
3. Ensure the token has the required permissions
4. Verify the authentication middleware is configured correctly

### Specification Errors

1. Validate the YAML syntax using an online validator
2. Check for duplicate field names in schemas
3. Ensure all referenced schemas are defined
4. Verify that all required fields are marked as required

## Additional Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [OpenAPI Generator](https://openapi-generator.tech/)
- [API Design Best Practices](https://swagger.io/resources/articles/best-practices-in-api-design/)

## Support

For issues or questions about the API documentation:

1. Check the main API documentation in `/docs/VENDOR_MANAGEMENT_API.md`
2. Review the OpenAPI specification file
3. Test the endpoints using Swagger UI
4. Contact the development team

## License

This API documentation is part of the Vendor Management module and follows the same license as the main project.
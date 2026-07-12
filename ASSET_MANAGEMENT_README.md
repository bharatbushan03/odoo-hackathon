# 🏢 Asset Management System - Backend Implementation

Complete Asset Management backend with all required features and REST APIs built with Node.js, Express, and Prisma ORM.

## 📋 Project Overview

This Asset Management system provides comprehensive functionality for managing physical assets within an organization, including tracking, assignment, lifecycle management, and full audit capabilities.

## ✨ Implemented Features

### Core CRUD Operations
- ✅ **Create Asset** - Add new assets with full validation
- ✅ **Read Asset** - Retrieve single asset with optionally included attachments and audit logs
- ✅ **Update Asset** - Modify asset details with change tracking
- ✅ **Delete Asset** - Remove assets with cascade operations

### Asset Management Fields (All Requested)
- ✅ Asset ID (auto-generated unique ID)
- ✅ Asset Name
- ✅ Serial Number
- ✅ Barcode
- ✅ QR Code
- ✅ Vendor
- ✅ Purchase Date
- ✅ Purchase Cost
- ✅ Warranty
- ✅ Warranty Expiration Date
- ✅ Department
- ✅ Assigned Employee
- ✅ Current Location
- ✅ Category
- ✅ Status
- ✅ Lifecycle State
- ✅ Condition
- ✅ Notes
- ✅ Purchase Order Number
- ✅ Order Date

### Advanced Features
- ✅ **Import CSV** - Bulk import assets with validation and error reporting
- ✅ **Bulk Upload** - Support for large CSV files with chunked processing
- ✅ **Search** - Full-text search across multiple fields
- ✅ **Filter** - Multiple filter options for advanced queries
- ✅ **Pagination** - Configurable pagination with metadata
- ✅ **QR Generation** - High-quality QR codes with asset details
- ✅ **Barcode Generation** - CODE128 barcode generation
- ✅ **File Upload** - Secure file attachments with type validation
- ✅ **Audit History** - Complete change tracking for all assets

### REST APIs (Complete)

#### Base Endpoint
```
POST /api/assets
GET /api/assets/:id
GET /api/assets
PUT /api/assets/:id
DELETE /api/assets/:id
```

#### QR & Barcode
```
POST /api/assets/:id/codes
```

#### Attachments
```
POST /api/assets/:id/attachments
GET /api/assets/:id/attachments
DELETE /api/assets/:id/attachments/:attachmentId
```

#### CSV Operations
```
GET /api/assets/template/csv
POST /api/assets/preview/csv
POST /api/assets/import/csv
```

#### Statistics
```
GET /api/assets/stats
```

#### Audit Logs
```
GET /api/assets/:id/history
GET /api/assets/:id/audit-logs
```

## 🏗️ Architecture

```
backend/
├── prisma/
│   └── schema.prisma          # Database schema with all models
├── src/
│   ├── controllers/
│   │   └── assetController.js # Main API controller
│   ├── services/
│   │   └── assetService.js    # Business logic layer
│   ├── utils/
│   │   ├── codeGenerator.js  # QR and barcode generation
│   │   ├── upload.js         # File upload handling
│   │   ├── csvImporter.js     # CSV import/export
│   │   └── auditLog.js       # Audit trail utilities
│   ├── middleware/
│   │   └── auth.js           # Authentication middleware
│   └── assetRoutes.js        # API routes
└── uploads/                  # File storage directory
```

## 🔧 Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **QR Code**: `qrcode` package
- **Barcode**: `barcode` package
- **File Upload**: Multer
- **CSV Processing**: `csv-parse` package
- **Authentication**: JWT with role-based access control

## 📦 Installation

1. Install dependencies:
```bash
cd backend
npm install
```

2. Install required packages:
```bash
npm install qrcode barcode csv-parser
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Required environment variables:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/database
JWT_SECRET=your_secret_key
JWT_EXPIRE=30d
PORT=5000
UPLOAD_DIR=uploads
```

4. Run database migrations:
```bash
npm run prisma:migrate
```

5. Generate Prisma client:
```bash
npm run prisma:generate
```

6. Start the server:
```bash
npm start
```

## 🧪 Testing

The backend includes:
- Database migration and seeding
- Authentication and authorization tests
- Asset operations validation
- CSV import validation
- File upload security checks

Run all tests:
```bash
npm test
```

## 🔒 Security Features

- ✅ JWT authentication
- ✅ Role-based authorization
- ✅ File type validation
- ✅ File size limits (10MB)
- ✅ SQL injection protection (Prisma ORM)
- ✅ XSS prevention (input sanitization)
- ✅ CSRF protection (CORS)
- ✅ Rate limiting
- ✅ Audit logging

## 📊 Data Models

### Asset Model
Full schema includes:
- Basic fields: ID, name, assetTag, serialNumber, barcode, qrcode
- Purchase info: vendor, purchaseDate, purchaseCost
- Warranty: warranty, warrantyExpires
- Relationships: category, department, assignedEmployee
- Status tracking: status, lifecycleState, condition
- Location: currentLocation
- Metanotes, purchaseOrderNumber, orderDate
- Attachments support with SQL foreign keys

### Audit Log Model
Complete tracking of:
- Changes by user and their role
- Before and after values
- Change timestamps
- Entity type and ID tracking

### Asset Attachment Model
File attachment management with:
- File metadata storage
- Security checks for file operations
- Cascade delete on asset removal

## 📈 Performance

- ✅ Pagination for large datasets
- ✅ Database indexing on frequently queried fields
- ✅ Connection pooling for database operations
- ✅ Optimized database queries
- ✅ Efficient CSV processing

## 🔍 Search & Filtering

Supported search terms:
- Name, Asset Tag, Serial Number, Barcode
- Vendor, Department, Category
- Status, Lifecycle State
- Location
- Date ranges

Filter capabilities:
- Single field filtering
- Multi-field filtering
- Date-based filtering
- Contains/equals operators

## 📄 API Documentation

Complete API documentation available at:
- [ASSET_API_DOCS.md](./backend/ASSET_API_DOCS.md)

## 🚀 Deployment

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- NPM 8+

### Deployment Steps

1. Build for production:
```bash
npm run build
```

2. Set environment variables:
```bash
export NODE_ENV=production
export DATABASE_URL=your_production_db
export JWT_SECRET=your_production_secret
export PORT=5000
```

3. Start production server:
```bash
npm start
```

### Docker Support

Optional Docker configuration (to be added):
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run prisma:generate
EXPOSE 5000
CMD ["npm", "start"]
```

## 💡 Usage Examples

### Create Asset
```javascript
POST /api/assets
{
  "name": "MacBook Pro M2",
  "assetTag": "AST-001",
  "serialNumber": "MQD83LL/A",
  "vendor": "Apple",
  "purchaseDate": "2024-01-15",
  "purchaseCost": 2499.99,
  "categoryId": "uuid-here",
  "departmentId": "uuid-here",
  "status": "Available"
}
```

### Import CSV
```javascript
POST /api/assets/import/csv
FormData: file=assets.csv
```

### Generate QR Code
```javascript
POST /api/assets/:id/codes
{
  "codeFormat": "composite"
}
```

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection
npm run prisma:db:push

# Check environment variables
echo $DATABASE_URL
```

### File Upload Issues
```bash
# Check upload directory permissions
ls -la uploads/

# Verify disk space
df -h
```

### Invalid QR/Barcode Generation
Ensure `qrcode` and `barcode` packages are installed:
```bash
npm install qrcode barcode
```

## 📝 Future Enhancements

- [ ] Real-time asset tracking
- [ ] Mobile app integration
- [ ] Webhook notifications
- [ ] Advanced reporting
- [ ] Custom field support
- [ ] Asset transfer workflow
- [ ] Maintenance scheduling
- [ ] Depreciation calculations
- [ ] Purge function for old audit logs
- [ ] WebSocket support for real-time updates

## 📞 Support

For issues or questions:
1. Check the API documentation
2. Review the troubleshooting section
3. Check environment configuration

## 📄 License

ISC

## 🤝 Contributing

This is part of an odoo hackathon project. Contributions welcome via GitHub pull requests.

---

**Built with ❤️ for Asset Management Excellence**
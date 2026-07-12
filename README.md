# Asset Lifecycle Management Platform

Enterprise-grade backend for managing asset lifecycles across an organization.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** JWT (bcrypt + jsonwebtoken)
- **Validation:** Zod
- **Logging:** Winston
- **Security:** Helmet, CORS
- **File Upload:** Multer

## Project Structure

```
backend/
├── prisma/          # Schema & migrations
├── src/
│   ├── config/      # App configuration & logger
│   ├── constants/   # HTTP statuses & enums
│   ├── controllers/ # Route handlers
│   ├── middleware/   # Auth, validation, error handling, upload
│   ├── repositories/# Data access layer (base CRUD)
│   ├── routes/      # API route definitions (versioned)
│   ├── services/    # Business logic layer
│   ├── types/       # JSDoc type definitions
│   ├── utils/       # ApiError, asyncHandler, ResponseWrapper
│   ├── validators/  # Zod schemas
│   ├── app.js       # Express app setup
│   └── server.js    # Entry point
├── uploads/         # File storage
├── logs/            # Application logs
└── .env             # Environment variables
```

## Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL >= 14

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Push schema to database
npm run prisma:push

# Start development server
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable              | Description                  | Default                    |
| --------------------- | ---------------------------- | -------------------------- |
| `NODE_ENV`            | Environment mode             | `development`              |
| `PORT`                | Server port                  | `3000`                     |
| `DATABASE_URL`        | PostgreSQL connection string | (required)                 |
| `JWT_SECRET`          | JWT signing secret           | (required)                 |
| `JWT_EXPIRES_IN`      | JWT token expiry             | `7d`                       |
| `BCRYPT_SALT_ROUNDS`  | Bcrypt salt rounds           | `12`                       |
| `MAX_FILE_SIZE`       | Max upload file size (bytes) | `5242880` (5MB)            |
| `LOG_LEVEL`           | Winston log level            | `debug`                    |

### Scripts

```bash
npm run dev          # Start with nodemon (hot reload)
npm start            # Start in production
npm run prisma:studio  # Open Prisma Studio
npm run prisma:migrate  # Run migrations
npm run prisma:push     # Push schema to DB
```

## Architecture

### Layers

- **Controllers** — Handle HTTP request/response, delegate to services
- **Services** — Business logic, orchestrate repositories
- **Repositories** — Data access via Prisma, base CRUD with pagination

### API Versioning

All routes are prefixed with `/api/v1`. Health check: `GET /api/v1/health`

### Error Handling

- `ApiError` — Custom error class with status codes and details
- `asyncHandler` — Wraps async route handlers to catch errors
- Global error converter and handler middleware

### Response Format

All responses follow a consistent envelope:

```json
{
  "success": true,
  "message": "Success",
  "data": {},
  "meta": {}
}
```

## License

MIT

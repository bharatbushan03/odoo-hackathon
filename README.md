# Asset Lifecycle Management Platform

Enterprise-grade backend for managing asset lifecycles across an organization.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL (Supabase / Render / Local)
- **ORM:** Prisma
- **Auth:** JWT (bcrypt + jsonwebtoken)
- **Validation:** Zod
- **Logging:** Winston
- **Security:** Helmet, CORS
- **File Upload:** Multer

## Project Structure

```
├── prisma/          # Schema & migrations
├── src/
│   ├── config/      # App configuration & logger
│   ├── constants/   # HTTP statuses & enums
│   ├── controllers/ # Route handlers
│   ├── middleware/  # Auth, validation, error handling, upload
│   ├── repositories/ # Data access layer (base CRUD)
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
- PostgreSQL >= 14 (or Supabase)

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
| `JWT_ACCESS_SECRET`   | JWT access token secret      | (required)                 |
| `JWT_ACCESS_EXPIRES_IN` | Access token expiry         | `15m`                      |
| `JWT_REFRESH_SECRET`  | JWT refresh token secret     | (required)                 |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry        | `7d`                       |
| `JWT_RESET_SECRET`    | Password reset token secret  | (required)                 |
| `JWT_RESET_EXPIRES_IN` | Reset token expiry           | `1h`                       |
| `JWT_EMAIL_VERIFY_SECRET` | Email verification secret   | (required)                 |
| `JWT_EMAIL_VERIFY_EXPIRES_IN` | Verify token expiry      | `24h`                      |
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
npm test             # Run tests
npm run lint         # Lint code
```

## Test Credentials

For local testing after running `npm run prisma:push`:

**Organization Registration** (creates org + admin):
1. Go to `/register-org`
2. Fill in org name, code, your name, email, password
3. This creates the organization and your admin account

**Employee Signup** (join existing org):
1. Go to `/signup`
2. Enter full name, email, org code, password (min 8 chars, upper, lower, number)
3. This creates an employee account under the organization

**Login**:
- Email: `test@test.com`
- Password: `Password123`

> Note: These credentials work after you register an organization or sign up as an employee.

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

---

## Deployment

### Backend on Render

1. Push to GitHub
2. Create new **Web Service** on Render
3. Connect your GitHub repo
4. Configure:
   - **Build Command**: `npm install && npm run prisma:generate`
   - **Start Command**: `npm start`
   - **Environment Variables** (add in Render dashboard):
     ```
     NODE_ENV=production
     DATABASE_URL=<your-supabase-or-render-postgres-url>
     JWT_ACCESS_SECRET=<generate-secure-secret>
     JWT_REFRESH_SECRET=<generate-different-secret>
     JWT_RESET_SECRET=<generate-secret>
     JWT_EMAIL_VERIFY_SECRET=<generate-secret>
     BCRYPT_SALT_ROUNDS=12
     ```
5. Add **Persistent Disk** for uploads (optional): mount at `/opt/render/project/src/uploads`

### Frontend on Vercel

1. Push to GitHub
2. Import project in Vercel
3. **Root Directory**: `frontend`
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. **Environment Variables**:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```
7. Deploy

### Database (Supabase / Render PostgreSQL)

**Supabase** (recommended):
1. Create project at supabase.com
2. Settings → Database → Connection pooling → Use Transaction pooler URI
3. Copy URI, add to `DATABASE_URL`

**Render PostgreSQL**:
1. Create PostgreSQL database on Render
2. Copy Internal Connection String
3. Add to `DATABASE_URL`

### Generate Secrets

```bash
# Run each time for different secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## License

MIT
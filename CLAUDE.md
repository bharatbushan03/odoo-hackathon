# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend (Node.js/Express)
- Start development server: `npm run dev`
- Start production server: `npm start`
- Lint code: `npm run lint`
- Fix lint errors: `npm run lint:fix`
- Prisma commands:
  - Generate Prisma client: `npm run prisma:generate`
  - Push schema to DB: `npm run prisma:push`
  - Run migrations: `npm run prisma:migrate`
  - Seed database: `npm run prisma:seed`
  - Open Prisma Studio: `npm run prisma:studio`

### Frontend (Vite/React)
- Start dev server: `cd frontend && npm run dev`
- Build for production: `cd frontend && npm run build`
- Preview production build: `cd frontend && npm run preview`
- Lint: `cd frontend && npm run lint`

### Testing
- No test framework configured yet. Add tests as needed.

## Architecture

### Backend (`src/`)
- **Entry point**: `src/server.js` (sets up Express server)
- **App setup**: `src/app.js` (middleware, routes)
- **Configuration**: 
  - `src/config/` - database, logger, etc.
- **Routes**: `src/routes/` - API route definitions (mounted under `/api/v1`)
- **Controllers**: Handle HTTP requests, validate input, call services
- **Services**: Business logic, interact with repositories
- **Repositories**: Data access layer using Prisma ORM
- **Middleware**: 
  - `src/middleware/` - validation, upload, error handling, logging
- **Utils**: 
  - `ApiError` - custom error class
  - `asyncHandler` - wrapper for async route handlers
  - `responseWrapper` - standard response format
- **Validators**: Zod schemas for request validation
- **Types**: Type definitions (if using TypeScript, currently JavaScript with JSDoc?)

### Frontend (`frontend/`)
- Built with Vite and React
- Entry point: `index.html`
- Source: `frontend/src/`
- State management: Likely React Context or Zustand (check src/store/)
- Styling: Likely CSS modules or Tailwind (check vite.config.js and package.json)

### Database
- Uses Prisma ORM with PostgreSQL (check prisma/schema.prisma)
- Migrations managed via Prisma Migrate

### API Design
- Base path: `/api/v1`
- Response format:
  ```json
  {
    "success": true,
    "message": "Success",
    "data": {},
    "meta": {}
  }
  ```
- Error handling: Centralized error handling middleware using `ApiError` class

### Key Dependencies
- Express: Web framework
- Prisma: ORM
- Zod: Validation
- Winston: Logging
- Helmet: Security headers
- Cors: CORS middleware
- Multer: File uploads
- Bcrypt: Password hashing
- JsonWebToken: Authentication
- Nodemon: Development dependency
- ESLint: Linting

## Development Guidelines
- Follow existing code style (check .eslintrc if present)
- Add JSDoc comments for functions and classes
- Keep controllers thin; move business logic to services
- Use Prisma for database interactions
- Validate all incoming data with Zod schemas
- Use asyncHandler wrapper for async route handlers to avoid try/catch boilerplate
- Return standardized responses using responseWrapper
- For frontend: follow existing component patterns and state management patterns

## CI/CD & Deployment
The repository includes GitHub Actions workflows for continuous integration and deployment to AWS:

### Workflows
- `.github/workflows/deploy.yml`: A simple test workflow (placeholder)
- `.github/workflows/aws-deploy.yml`: AWS deployment workflow (see below)

### AWS Deployment Workflow (aws-deploy.yml)
This workflow deploys the application to AWS on every push to the `main` branch:
1. **Backend Deployment**:
   - Checks out code
   - Configures AWS credentials using secrets
   - Sets up Node.js
   - Installs backend dependencies
   - Creates a deployment zip file (excluding unnecessary files)
   - Deploys to AWS Elastic Beanstalk using the `beanstalk-deploy` action
2. **Frontend Deployment** (runs after backend deployment):
   - Checks out code
   - Sets up Node.js
   - Installs frontend dependencies
   - Builds the frontend (`npm run build` in `frontend/`)
   - Configures AWS credentials
   - Syncs the built files to an S3 bucket
   - Optionally invalidates CloudFront cache

### Required Secrets
To use the AWS deployment workflow, configure the following repository secrets:
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- Optional for frontend:
  - `CLOUDFRONT_DISTRIBUTION_ID`: CloudFront distribution ID for cache invalidation

### Configuration
The workflow expects

### Customization
Before using the workflow, you must:
1. Create an Elastic Beanstalk application and environment names in AWS Elastic Beanstalk for your backend
2. Create an S3 bucket for your frontend static assets
3. (Optional) Set up a CloudFront distribution for the S3 bucket
4. Update the workflow file with your application/environment names, bucket name, etc.

### Local Development Commands
See the sections above for backend and frontend commands.
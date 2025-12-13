# event-ticketing - Event Management API

An event management system with role-based access control, booking functionality, and reporting capabilities.

## Features

- **User Authentication** (JWT-based)
- **Role-Based Authorization** (Attendee, Organizer, Admin)
- **Event Management** (CRUD operations with soft deletes)
- **Booking System** (Create and manage event bookings)
- **Reports** (Event attendees and sales metrics)
- **API Documentation** (Swagger/OpenAPI)

## Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- JWT for authentication
- Joi for validation
- Jest + Supertest for testing
- Swagger for API documentation

## Installation

1. Clone the repository

```bash
git clone <repository-url>
cd event-ticketing
```

2. Install dependencies

```bash
npm install
```

3. Set up MongoDB

This project requires a MongoDB database. You have two options:

**Option A: Local MongoDB with Docker (Recommended for Development)**

Choose between persistent or ephemeral storage:

**With Persistent Storage (Recommended)**

```bash
# Data persists across container restarts and removals
docker run -d \
  --name event-ticketing-mongodb \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:latest
```

**Without Persistent Storage**

```bash
# Data is lost when container is removed (useful for testing)
docker run -d \
  --name event-ticketing-mongodb \
  -p 27017:27017 \
  mongo:latest
```

**Managing the Container:**

```bash
# Check container status
docker ps

# Stop/start the container (data preserved in both cases if using volume)
docker stop event-ticketing-mongodb
docker start event-ticketing-mongodb

# Remove container (data lost without volume, preserved with volume)
docker rm -f event-ticketing-mongodb

# Remove volume (deletes all data permanently)
docker volume rm mongodb_data
```

**Option B: Cloud-Hosted MongoDB**

Use a managed MongoDB service such as:

- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Free tier available)
- [AWS DocumentDB](https://aws.amazon.com/documentdb/)
- Other MongoDB-compatible cloud providers

After creating your cluster, obtain the connection string from your provider's dashboard.

4. Create a `.env` file in the root directory:

```env
PORT=4000
# For local Docker MongoDB
MONGO_URI=mongodb://localhost:27017/event-management
# For cloud-hosted MongoDB, use your connection string:
# MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/event-management?retryWrites=true&w=majority

JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# Required for initial admin creation
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=securePassword123
ADMIN_NAME=Admin User
```

## Initial Setup - Creating the First Admin

⚠️ **IMPORTANT:** For security reasons, users cannot self-register as admins or organizers. All new registrations default to the `attendee` role.

### Step 1: Set Admin Environment Variables

Before starting the application for the first time, set these environment variables in your `.env` file:

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=strongSecurePassword123
ADMIN_NAME=System Administrator
```

### Step 2: Run the Database Seed Script

Run the seed script to create the initial admin account:

```bash
npm run seed
```

This will:

- Connect to your MongoDB database
- Check if an admin with the specified email already exists
- Create the initial admin user if none exists
- Display confirmation with the admin credentials

### Step 3: Start the Application

```bash
npm start
# or for development with auto-reload
npm run dev
```

### Step 4: Login as Admin

Use the admin credentials to login via `POST /api/v1/auth/login`:

```json
{
  "email": "admin@example.com",
  "password": "strongSecurePassword123"
}
```

You'll receive a JWT token with admin privileges.

## User Role Management

### Role Hierarchy

- **Attendee** (default)
  - View events
  - Create bookings
  - View own profile

- **Organizer**
  - All attendee permissions
  - Create and manage events
  - View event attendees and sales reports

- **Admin**
  - All organizer permissions
  - List all users
  - Promote users to organizer/admin roles
  - Full system access

### Promoting Users

Only admins can change user roles using the promotion endpoint:

```bash
POST /api/v1/users/:userId/promote
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "role": "organizer"
}
```

Valid roles: `attendee`, `organizer`, `admin`

**Security Features:**

- Admins cannot demote themselves (prevents lockout)
- All role changes are logged in `roleHistory` with timestamp and admin who made the change
- Full audit trail maintained for compliance

## Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests
npm run test:ci    # Run tests in CI mode
npm run lint       # Run ESLint
npm run format     # Format code with Prettier
npm run seed       # Create initial admin user
```

## API Documentation

Once the server is running, visit:

- **Swagger UI**: `http://localhost:4000/docs`

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new user (always creates attendee)
- `POST /api/v1/auth/login` - Login and get JWT token

### Users

- `GET /api/v1/users/me` - Get current user profile
- `GET /api/v1/users` - List all users (admin only)
- `GET /api/v1/users/:id` - Get user by ID (admin or self)
- `POST /api/v1/users/:id/promote` - Change user role (admin only)

### Events

- `GET /api/v1/events` - List all events
- `GET /api/v1/events/:id` - Get event details
- `POST /api/v1/events` - Create event (organizer/admin)
- `PUT /api/v1/events/:id` - Update event (owner/admin)
- `DELETE /api/v1/events/:id` - Soft delete event (owner/admin)

### Reports

- `GET /api/v1/events/:id/attendees` - List event attendees (owner/admin)
- `GET /api/v1/events/:id/sales` - Get event sales metrics (owner/admin)

## Project Structure

```
src/
├── controllers/     # Request handlers
├── models/          # Mongoose schemas
├── routes/          # API routes
├── middlewares/     # Auth, validation, error handling
├── validators/      # Joi validation schemas
├── db/              # Database connection and seeding
├── utils/           # JWT utilities
├── __tests__/       # Test files
├── app.js           # Express app setup
└── index.js         # Server entry point
```

## Security Best Practices

1. **Role Assignment**: Users cannot self-assign roles during registration
2. **Admin Bootstrap**: Initial admin created via secure seed script using environment variables
3. **Audit Trail**: All role changes logged with timestamp and admin ID
4. **Self-Demotion Protection**: Admins cannot demote themselves to prevent lockout
5. **JWT Authentication**: All protected endpoints require valid JWT token
6. **Password Hashing**: Bcrypt with salt rounds for secure password storage

## Testing

Run the test suite:

```bash
npm test
```

Tests cover:

- Authentication flows
- User registration and role restrictions
- JWT token validation
- Protected endpoint access control

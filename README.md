# Backend API - Project Overview

This project is a Node.js backend built with Express.js, designed to serve as the backend for a service-oriented application. It provides RESTful APIs for user authentication, appointment management, feedback, disputes, notifications, payments, and more. The backend is structured for scalability and maintainability, using modular controllers, models, and routes.

## Table of Contents
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [API Documentation](#api-documentation)
- [Configuration](#configuration)
- [How to Run](#how-to-run)
- [Main Endpoints](#main-endpoints)
- [Dependencies](#dependencies)

## Project Structure
```
Backend/
│   index.js                # Main entry point
│   package.json            # Project metadata and dependencies
│   swagger.js              # Swagger API documentation setup
│
├── config/                 # Configuration files (DB, Multer, Nodemailer)
├── Controller/             # Route controllers (business logic)
├── Middleware/             # Custom middleware (auth, error handling, etc.)
├── Models/                 # Mongoose models (MongoDB schemas)
├── Routes/                 # API route definitions
├── uploads/                # Static file uploads (e.g., images)
```

## Key Features
- **User Authentication** (JWT-based)
- **Appointment Management** (CRUD operations)
- **Feedback and Dispute Handling**
- **Notifications System**
- **Payment Integration**
- **Mechanic Availability**
- **Admin Controls**
- **File Uploads** (via Multer)
- **API Documentation** (Swagger UI)

## API Documentation
Interactive API docs are available via Swagger UI:
- Visit: `http://localhost:5000/api-docs`

## Configuration
- Environment variables are managed via `.env` (see `config/` for details).
- Database connection is configured in `config/db.config.js`.
- CORS is enabled for local development (`http://localhost:5000`).

## How to Run
1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Set up environment variables:**
   - Create a `.env` file with required variables (see `config/db.config.js` for DB settings).
3. **Start the server:**
   ```bash
   node index.js
   ```
   The server will run on the port specified in `.env` or default to `5000`.

## Main Endpoints
- `/api/auth` - Authentication (login, register, etc.)
- `/api/appointement` - Appointment management
- `/api/feedback` - Feedback submission and retrieval
- `/api/dispute` - Dispute management
- `/api/notification` - Notifications
- `/api/availableMechanics` - Mechanic availability
- `/api/mechanic` - Mechanic user operations
- `/uploads` - Static file serving
- `/api/payments/webhook` - Payment webhooks

## Dependencies
- **express** - Web framework
- **mongoose** - MongoDB ODM
- **dotenv** - Environment variable management
- **cors** - CORS middleware
- **body-parser** - Request body parsing
- **cookie-parser** - Cookie handling
- **multer** - File uploads
- **swagger-ui-express** - Swagger UI for API docs

---

For more details, refer to the source code and Swagger documentation.
# NEL-Blue

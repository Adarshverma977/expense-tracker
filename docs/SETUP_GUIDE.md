
# Expense Tracker — Setup Guide

## 1. Project Overview

Expense Tracker is a full-stack personal finance management application built using the MERN stack.

This guide explains how to configure the development environment, install dependencies and run the application locally.

## 2. Prerequisites

Make sure the following tools are installed:

| Tool | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| npm | Package management |
| Git | Version control |
| MongoDB | Database |
| MongoDB Compass | Database visualization (optional) |
| Postman | API testing |
| VS Code | Code editor (recommended) |

### Recommended Versions

- Node.js: 22.x or compatible LTS version
- npm: Version bundled with Node.js
- MongoDB: Supported stable release
- Git: Latest stable version

## 3. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

Navigate into the project:

```bash
cd expense-tracker
```

## 4. Project Structure

The application will contain separate frontend and backend directories.

```text
expense-tracker/
│
├── client/
│
├── server/
│
├── docs/
│
├── .gitignore
│
└── README.md
```

The actual folder structure will be finalized during implementation.

## 5. Backend Setup

Navigate to the server directory:

```bash
cd server
```

Install backend dependencies:

```bash
npm install
```

Create a `.env` file in the server directory.

### Backend Environment Variables

```env
NODE_ENV=development
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_strong_random_secret
JWT_EXPIRES_IN=1d

CLIENT_URL=http://localhost:5173
```

### Important Environment Rules

- Never commit `.env` files to GitHub.
- Never expose JWT secrets.
- Use strong random secrets.
- Configure production environment variables separately.
- Keep a `.env.example` file containing placeholder values only.

Start the backend development server:

```bash
npm run dev
```

Expected backend URL:

```text
http://localhost:5000
```

## 6. Frontend Setup

Open another terminal and navigate to the client directory:

```bash
cd client
```

Install frontend dependencies:

```bash
npm install
```

Create a frontend `.env` file if required by the configured Vite environment.

### Frontend Environment Variables

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend development server:

```bash
npm run dev
```

Expected frontend URL:

```text
http://localhost:5173
```

## 7. Database Configuration

The application uses MongoDB.

Two development options are supported:

### Option 1 — Local MongoDB

1. Install MongoDB Community Server.
2. Start the MongoDB service.
3. Connect using MongoDB Compass or mongosh.
4. Configure the local MongoDB connection string.

Example:

```env
MONGO_URI=mongodb://127.0.0.1:27017/expense_tracker
```

### Option 2 — MongoDB Atlas

1. Create a MongoDB Atlas account.
2. Create a database deployment.
3. Configure database access credentials.
4. Allow the development IP address.
5. Copy the connection string.
6. Add it to the backend `.env` file.

## 8. Running the Application

Run the backend and frontend in separate terminals.

### Backend

```bash
cd server
npm run dev
```

### Frontend

```bash
cd client
npm run dev
```

Open the frontend in your browser:

```text
http://localhost:5173
```

## 9. API Health Check

The backend will expose a health-check endpoint.

```text
GET http://localhost:5000/api/health
```

Expected response:

```json
{
  "success": true,
  "message": "Expense Tracker API is running"
}
```

The exact response will be verified during backend implementation.

## 10. Development Tools

Recommended tools:

- VS Code for development.
- Postman for API testing.
- MongoDB Compass for database inspection.
- Git and GitHub for version control.
- Browser Developer Tools for frontend debugging.

## 11. Common Setup Issues

### MongoDB Connection Error

Possible causes:
- MongoDB service is not running.
- Connection string is incorrect.
- Atlas IP access is not configured.
- Database credentials are incorrect.

### Port Already in Use

Check whether another process is using the configured port.

Use a different port or stop the conflicting process.

### CORS Error

Verify:
- Backend CLIENT_URL.
- Frontend API URL.
- Credential configuration.
- Cookie settings.

### Authentication Cookie Not Working

Verify:
- HTTP-only cookie configuration.
- Frontend credential settings.
- CORS credentials.
- Secure and SameSite cookie options.

## 12. Security Guidelines

- Never commit secrets.
- Never store plaintext passwords.
- Do not expose sensitive environment variables to the frontend.
- Validate all incoming requests.
- Protect private API routes.
- Verify resource ownership.
- Use secure cookie settings in production.

## 13. Setup Completion Checklist

- [ ] Node.js installed.
- [ ] npm installed.
- [ ] Git configured.
- [ ] MongoDB configured.
- [ ] Repository cloned or project folder created.
- [ ] Backend dependencies installed.
- [ ] Frontend dependencies installed.
- [ ] Environment variables configured.
- [ ] Backend running successfully.
- [ ] Frontend running successfully.
- [ ] Database connection verified.
- [ ] API health check successful.

## 14. Important Notes

This guide describes the planned development setup.

Actual npm scripts, dependencies, environment variables and folder paths will be updated to match the final implementation.

Production deployment configuration will be documented separately.

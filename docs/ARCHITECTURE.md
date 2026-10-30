# Expense Tracker — System Architecture

## 1. Architecture Overview

Expense Tracker follows a client-server architecture using the MERN stack.

The application consists of three primary layers:

1. Frontend — React.js
2. Backend — Node.js and Express.js
3. Database — MongoDB

The frontend communicates with the backend through REST APIs. The backend handles business logic, authentication, validation and database operations.

## 2. High-Level Architecture

```text
                 USER
                   |
                   v
          REACT FRONTEND
          (Vite + JavaScript)
                   |
                   | HTTP Requests
                   | JSON + Cookies
                   v
          EXPRESS BACKEND
                   |
          ---------------------
          |         |         |
          v         v         v
       Routes   Middleware  Controllers
                    |          |
                    v          v
                 Services / Business Logic
                           |
                           v
                     Mongoose Models
                           |
                           v
                       MONGODB
```

## 3. Frontend Architecture

Technology:
- React.js
- Vite
- JavaScript
- React Router
- Normal CSS
- Framer Motion
- Recharts

### Frontend Responsibilities

- Render application pages.
- Manage UI state.
- Handle user interactions.
- Validate forms on the client.
- Communicate with REST APIs.
- Display analytics and charts.
- Handle loading, success and error states.
- Provide responsive layouts and animations.

### Main Frontend Modules

- Authentication
- Dashboard
- Transactions
- Analytics
- Budgets
- Profile and Settings

## 4. Backend Architecture

Technology:
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcrypt
- Zod

### Backend Responsibilities

- Handle HTTP requests.
- Authenticate users.
- Authorize protected operations.
- Validate request data.
- Execute business logic.
- Perform database operations.
- Calculate financial summaries.
- Generate analytics using aggregation pipelines.
- Return consistent API responses.

### Backend Layers

#### Routes
Define API endpoints and connect them to middleware and controllers.

#### Middleware
Handle authentication, validation, rate limiting and error handling.

#### Controllers
Receive requests, call business logic and prepare HTTP responses.

#### Services
Contain reusable business rules and complex operations.

#### Models
Define MongoDB document structures using Mongoose.

#### Utilities
Contain reusable helpers and shared functions.

## 5. Database Architecture

Database: MongoDB

ODM: Mongoose

Initial collections:

### Users
Stores account and authentication information.

### Transactions
Stores user income and expense records.

### Budgets
Stores monthly and category-wise budget limits.

### Categories
Stores transaction categories if category management is implemented as a separate collection. Otherwise, initial categories may be maintained as application-level constants.

## 6. Authentication Architecture

Authentication uses JWT and HTTP-only cookies.

### Login Flow

1. User submits email and password.
2. Frontend sends login request.
3. Backend validates credentials.
4. Password is verified using bcrypt.
5. Backend generates a JWT.
6. JWT is stored in an HTTP-only cookie.
7. Backend returns the authenticated user information.

### Protected Request Flow

1. Frontend makes an authenticated API request.
2. Browser sends the authentication cookie.
3. Authentication middleware verifies the JWT.
4. User identity is attached to the request.
5. Controller processes the request.
6. Backend returns the response.

## 7. Transaction Request Flow

### Create Transaction

1. User opens the transaction form.
2. User enters transaction details.
3. Frontend sends a POST request.
4. Backend authenticates the user.
5. Zod validates the request.
6. Controller calls transaction service.
7. Service applies business rules.
8. Mongoose saves the transaction.
9. Backend returns the created transaction.
10. Frontend updates the transaction list and relevant summaries.

### Update Transaction

1. User selects an existing transaction.
2. Frontend sends an update request.
3. Backend authenticates the user.
4. Backend verifies transaction ownership.
5. Request data is validated.
6. Transaction is updated.
7. Updated transaction is returned.

### Delete Transaction

1. User requests transaction deletion.
2. Backend authenticates the user.
3. Backend verifies ownership.
4. Transaction is deleted.
5. Frontend refreshes affected data.

## 8. Analytics Architecture

Analytics are calculated on the backend using MongoDB aggregation pipelines.

Examples:

- Total income.
- Total expenses.
- Current balance.
- Monthly income and expense totals.
- Category-wise expense breakdown.
- Monthly spending trends.

The backend returns structured analytics data, and the frontend visualizes it using Recharts.

## 9. Error Handling Architecture

The application will use centralized backend error handling.

Expected error categories:

- Validation errors.
- Authentication errors.
- Authorization errors.
- Resource not found.
- Duplicate resource errors.
- Database errors.
- Unexpected server errors.

Frontend will display appropriate error messages and feedback.

## 10. Security Architecture

- Password hashing using bcrypt.
- JWT stored in HTTP-only cookies.
- Secure cookie configuration in production.
- CORS configured for the frontend origin.
- Request validation using Zod.
- Authentication middleware.
- Transaction ownership verification.
- Rate limiting on sensitive endpoints.
- Environment variables for secrets.
- No sensitive information in API responses.

## 11. Data Consistency

- Monetary values will use a consistent representation and currency.
- Financial totals will be calculated on the backend.
- Transaction ownership will be verified before modification.
- Budget calculations will use the relevant transaction period and category.
- Financial summaries will be derived from database records rather than trusted frontend values.

## 12. Deployment Architecture

Initial deployment plan:

- Frontend: Vercel.
- Backend: Node.js hosting platform.
- Database: MongoDB Atlas.

Production configuration will include environment variables, secure cookies, CORS configuration and frontend/backend URL configuration.

## 13. Architecture Principles

- Separation of concerns.
- Reusable business logic.
- Consistent API responses.
- Secure data access.
- Maintainable folder structure.
- Scalable database queries.
- Testable backend services.
- Responsive frontend components.
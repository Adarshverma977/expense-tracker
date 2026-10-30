
# Expense Tracker — API Documentation

## 1. API Overview

The Expense Tracker backend exposes RESTful APIs to manage user authentication, transactions, categories, budgets and financial analytics.

### Base URL

Development:

```text
http://localhost:5000/api
```

### API Version

Initial version: v1 (versioning strategy can be finalized during implementation).

### Request Format

- Content-Type: application/json
- Data format: JSON
- Authentication: JWT using HTTP-only cookies.

### Standard Response Format

Success Response:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

Error Response:

```json
{
  "success": false,
  "message": "Something went wrong",
  "errors": []
}
```

## 2. Authentication APIs

Base route: `/auth`

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| POST | `/auth/register` | Register a new user | No |
| POST | `/auth/login` | Login user | No |
| POST | `/auth/logout` | Logout user | Yes |
| GET | `/auth/me` | Get current authenticated user | Yes |

### 2.1 Register User

**POST** `/auth/register`

Request Body:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "StrongPassword123"
}
```

Success Status: `201 Created`

### 2.2 Login User

**POST** `/auth/login`

Request Body:

```json
{
  "email": "john@example.com",
  "password": "StrongPassword123"
}
```

Success Status: `200 OK`

The server sets an HTTP-only authentication cookie.

### 2.3 Logout User

**POST** `/auth/logout`

Authentication: Required

Success Status: `200 OK`

The authentication cookie will be cleared.

### 2.4 Get Current User

**GET** `/auth/me`

Authentication: Required

Success Status: `200 OK`

Returns the authenticated user's information.

## 3. User Profile APIs

Base route: `/users`

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| GET | `/users/profile` | Get user profile | Yes |
| PATCH | `/users/profile` | Update user profile | Yes |
| PATCH | `/users/change-password` | Change account password | Yes |

### 3.1 Get Profile

**GET** `/users/profile`

Success Status: `200 OK`

### 3.2 Update Profile

**PATCH** `/users/profile`

Request Body:

```json
{
  "name": "John Updated",
  "currency": "INR"
}
```

Success Status: `200 OK`

### 3.3 Change Password

**PATCH** `/users/change-password`

Request Body:

```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123"
}
```

Success Status: `200 OK`

## 4. Transaction APIs

Base route: `/transactions`

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| POST | `/transactions` | Create transaction | Yes |
| GET | `/transactions` | Get all user transactions | Yes |
| GET | `/transactions/:id` | Get transaction by ID | Yes |
| PATCH | `/transactions/:id` | Update transaction | Yes |
| DELETE | `/transactions/:id` | Delete transaction | Yes |

### 4.1 Create Transaction

**POST** `/transactions`

Request Body:

```json
{
  "title": "Monthly Salary",
  "amount": 55000,
  "type": "income",
  "category": "CATEGORY_OBJECT_ID",
  "description": "October salary",
  "date": "2026-10-01"
}
```

Success Status: `201 Created`

### 4.2 Get Transactions

**GET** `/transactions`

Supported Query Parameters:

| Parameter | Description |
|---|---|
| `page` | Page number |
| `limit` | Records per page |
| `search` | Search by title |
| `type` | income or expense |
| `category` | Filter by category ID |
| `startDate` | Starting date |
| `endDate` | Ending date |
| `sortBy` | Field to sort by |
| `order` | asc or desc |

Example:

```text
GET /api/transactions?page=1&limit=10&type=expense
```

Success Status: `200 OK`

### 4.3 Get Transaction By ID

**GET** `/transactions/:id`

Success Status: `200 OK`

### 4.4 Update Transaction

**PATCH** `/transactions/:id`

Request Body:

```json
{
  "title": "Updated Salary",
  "amount": 60000,
  "description": "Updated monthly salary"
}
```

Success Status: `200 OK`

### 4.5 Delete Transaction

**DELETE** `/transactions/:id`

Success Status: `200 OK`

Transaction ownership must be verified before modification or deletion.

## 5. Category APIs

Base route: `/categories`

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| POST | `/categories` | Create custom category | Yes |
| GET | `/categories` | Get available categories | Yes |
| PATCH | `/categories/:id` | Update custom category | Yes |
| DELETE | `/categories/:id` | Delete custom category | Yes |

### 5.1 Create Category

**POST** `/categories`

Request Body:

```json
{
  "name": "Freelance",
  "type": "income",
  "icon": "briefcase"
}
```

Success Status: `201 Created`

### 5.2 Get Categories

**GET** `/categories`

Returns system categories and categories accessible to the authenticated user.

Success Status: `200 OK`

## 6. Budget APIs

Base route: `/budgets`

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| POST | `/budgets` | Create monthly budget | Yes |
| GET | `/budgets` | Get user budgets | Yes |
| GET | `/budgets/:id` | Get budget by ID | Yes |
| PATCH | `/budgets/:id` | Update budget | Yes |
| DELETE | `/budgets/:id` | Delete budget | Yes |

### 6.1 Create Budget

**POST** `/budgets`

Request Body:

```json
{
  "category": "CATEGORY_OBJECT_ID",
  "amount": 10000,
  "month": 10,
  "year": 2026
}
```

Success Status: `201 Created`

### 6.2 Get Budgets

**GET** `/budgets`

Supported Query Parameters:

- `month`
- `year`

Success Status: `200 OK`

### 6.3 Get Budget By ID

**GET** `/budgets/:id`

Success Status: `200 OK`

### 6.4 Update Budget

**PATCH** `/budgets/:id`

Request Body:

```json
{
  "amount": 12000
}
```

Success Status: `200 OK`

### 6.5 Delete Budget

**DELETE** `/budgets/:id`

Success Status: `200 OK`

## 7. Dashboard APIs

Base route: `/dashboard`

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| GET | `/dashboard/summary` | Get financial summary | Yes |
| GET | `/dashboard/recent-transactions` | Get recent transactions | Yes |

### 7.1 Dashboard Summary

**GET** `/dashboard/summary`

Optional Query Parameters:

- `month`
- `year`

Returns:

- Total income.
- Total expenses.
- Current balance.
- Savings rate.
- Monthly financial summary.

Success Status: `200 OK`

### 7.2 Recent Transactions

**GET** `/dashboard/recent-transactions`

Optional Query Parameter:

- `limit`

Returns the latest transactions of the authenticated user.

Success Status: `200 OK`

## 8. Analytics APIs

Base route: `/analytics`

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| GET | `/analytics/overview` | Get financial overview | Yes |
| GET | `/analytics/monthly` | Get monthly financial trends | Yes |
| GET | `/analytics/categories` | Get category-wise expense analysis | Yes |

### 8.1 Financial Overview

**GET** `/analytics/overview`

Optional Query Parameters:

- `startDate`
- `endDate`

Returns:

- Total income.
- Total expenses.
- Net balance for the selected period.
- Savings rate.

Success Status: `200 OK`

### 8.2 Monthly Analytics

**GET** `/analytics/monthly`

Optional Query Parameters:

- `year`

Returns monthly income and expense summaries.

Success Status: `200 OK`

### 8.3 Category Analytics

**GET** `/analytics/categories`

Optional Query Parameters:

- `month`
- `year`
- `startDate`
- `endDate`

Returns category-wise expense totals and percentages.

Success Status: `200 OK`

## 9. Common HTTP Status Codes

| Status Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Resource Not Found |
| 409 | Conflict / Duplicate Resource |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

## 10. API Security Rules

- Protected endpoints require valid authentication.
- JWT must be verified by authentication middleware.
- Passwords must never be returned in API responses.
- Users can access only their own transactions and budgets.
- Category ownership must be verified.
- All incoming data must be validated.
- Sensitive authentication routes must use rate limiting.
- Cookie and CORS settings must be configured securely.

## 11. API Design Principles

- Follow REST conventions.
- Use appropriate HTTP methods.
- Use meaningful status codes.
- Keep response formats consistent.
- Validate request parameters and body data.
- Keep business logic outside route definitions.
- Verify resource ownership.
- Support pagination for large collections.
- Avoid exposing internal database errors.

## 12. Implementation Note

This document defines the planned API contract.

Actual endpoint implementation, request schemas, response payloads and status codes must be verified during backend development and updated here whenever the contract changes.

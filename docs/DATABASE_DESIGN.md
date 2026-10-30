
# Expense Tracker — Database Design

## 1. Database Overview

- **Database:** MongoDB
- **ODM:** Mongoose
- **Database Name:** expense_tracker

Initial collections:

1. Users
2. Transactions
3. Categories
4. Budgets

## 2. Collection Design

### 2.1 Users Collection

| Field | Data Type | Description |
|---|---|---|
| `_id` | ObjectId | Unique user ID |
| `name` | String | User's name |
| `email` | String | Unique email address |
| `password` | String | Hashed password |
| `currency` | String | Preferred currency |
| `createdAt` | Date | Account creation timestamp |
| `updatedAt` | Date | Last update timestamp |

### 2.2 Transactions Collection

| Field | Data Type | Description |
|---|---|---|
| `_id` | ObjectId | Transaction ID |
| `user` | ObjectId | Reference to User |
| `title` | String | Transaction title |
| `amount` | Number | Transaction amount |
| `type` | String | income / expense |
| `category` | ObjectId | Reference to Category |
| `description` | String | Optional description |
| `date` | Date | Transaction date |
| `createdAt` | Date | Creation timestamp |
| `updatedAt` | Date | Last update timestamp |

### 2.3 Categories Collection

| Field | Data Type | Description |
|---|---|---|
| `_id` | ObjectId | Category ID |
| `user` | ObjectId / null | Owner; null for system categories |
| `name` | String | Category name |
| `type` | String | income / expense |
| `icon` | String | Icon identifier |
| `isDefault` | Boolean | System category or custom |
| `createdAt` | Date | Creation timestamp |

### 2.4 Budgets Collection

| Field | Data Type | Description |
|---|---|---|
| `_id` | ObjectId | Budget ID |
| `user` | ObjectId | Reference to User |
| `category` | ObjectId | Reference to Category |
| `amount` | Number | Budget limit |
| `month` | Number | Month (1–12) |
| `year` | Number | Budget year |
| `createdAt` | Date | Creation timestamp |
| `updatedAt` | Date | Update timestamp |

## 3. Database Relationships

- One User can have multiple Transactions.
- One User can have multiple Budgets.
- One User can create custom Categories.
- One Category can be referenced by multiple Transactions.
- One Category can have multiple Budgets across different months.

## 4. Indexing Strategy

| Collection | Index | Purpose |
|---|---|---|
| Users | email (unique) | Prevent duplicate accounts |
| Transactions | user + date | User transaction history |
| Transactions | user + type + date | Filter income and expenses |
| Transactions | user + category + date | Category analytics |
| Categories | user + type + name | Category lookup |
| Budgets | user + year + month + category (unique) | Prevent duplicate monthly budgets |

Indexes will be finalized according to actual query patterns during implementation.

## 5. Data Validation Rules

### Users
- Name is required.
- Email must be valid and unique.
- Password must meet security requirements.
- Password must be hashed before storage.

### Transactions
- Amount must be greater than zero.
- Type must be income or expense.
- Title is required.
- Category must exist and be accessible to the user.
- Transaction ownership must be verified.

### Budgets
- Amount must be greater than zero.
- Month must be between 1 and 12.
- Year must be valid.
- Category must be an expense category.
- Duplicate user/category/month/year combinations are not allowed.

## 6. Financial Data Rules

- Store monetary values using a consistent precision strategy.
- Avoid relying on frontend-calculated financial totals.
- Calculate balance using income minus expenses.
- Calculate budget utilization from qualifying expense transactions.
- Store transaction dates consistently.
- Use MongoDB aggregation for financial reports.

**Implementation Note:** JavaScript floating-point calculations can introduce monetary precision errors. We will finalize a consistent representation, such as storing amounts in minor currency units (paise for INR), before implementation.

## 7. Referential Integrity

The backend must verify:

- A referenced category belongs to the authenticated user or is a valid system category.
- A transaction belongs to the authenticated user before modification.
- A budget belongs to the authenticated user.
- A category cannot be deleted while referenced without an appropriate handling strategy.

## 8. Future Database Enhancements

These features are outside the initial scope:

- Recurring transaction records.
- Financial goals.
- Transaction attachments.
- Notification preferences.
- Audit history.

## 9. Database Design Principles

- Clear separation of collections.
- Appropriate indexing.
- User-specific data isolation.
- Consistent monetary precision.
- Validation at application and database levels.
- Efficient aggregation queries.
- Maintainable database schemas.

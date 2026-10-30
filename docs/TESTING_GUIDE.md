
# Expense Tracker — Testing Guide

## 1. Testing Overview

Testing is an essential part of the Expense Tracker development process.

The goal is to ensure that all application features work correctly, financial calculations are accurate, APIs are secure and the user experience remains reliable.

The project will use manual testing and automated testing.

## 2. Testing Tools

| Tool | Purpose |
|---|---|
| Postman | API testing |
| Jest | Automated unit testing |
| Supertest | Backend integration testing |
| React Testing Library | Frontend component testing |
| Browser DevTools | UI and responsive testing |
| MongoDB Compass | Database verification |

## 3. Testing Levels

### 3.1 Unit Testing

Unit testing verifies individual functions and modules independently.

Examples:

- Password hashing utilities.
- JWT token utilities.
- Input validation.
- Financial calculation functions.
- Budget calculation logic.
- Date filtering utilities.

### 3.2 Integration Testing

Integration testing verifies that multiple backend components work together correctly.

Examples:

- Authentication and database integration.
- Transaction creation and database persistence.
- Transaction ownership verification.
- Budget creation and category validation.
- Analytics aggregation pipelines.

### 3.3 API Testing

API testing verifies backend endpoints using Postman and automated tests.

Check:

- HTTP status codes.
- Request validation.
- Response structure.
- Authentication requirements.
- Authorization.
- Error handling.
- Database changes.

### 3.4 Frontend Testing

Frontend testing verifies:

- Component rendering.
- Form validation.
- User interactions.
- API integration.
- Loading states.
- Error states.
- Responsive layouts.
- Theme switching.
- Animation behavior.

## 4. Authentication Test Cases

| Test Case | Expected Result |
|---|---|
| Register with valid details | Account created |
| Register with existing email | Duplicate account rejected |
| Register with invalid email | Validation error |
| Register with weak password | Validation error |
| Login with correct credentials | Login successful |
| Login with incorrect password | Authentication rejected |
| Access protected API without token | 401 Unauthorized |
| Access protected API with valid token | Request allowed |
| Logout authenticated user | Cookie cleared |
| Access protected API after logout | Authentication rejected |

## 5. Transaction Test Cases

| Test Case | Expected Result |
|---|---|
| Create valid income | Income transaction created |
| Create valid expense | Expense transaction created |
| Create transaction with negative amount | Validation error |
| Create transaction with zero amount | Validation error |
| Create transaction without title | Validation error |
| Create transaction with invalid type | Validation error |
| Get all transactions | User transactions returned |
| Get transaction by valid ID | Transaction returned |
| Get transaction with invalid ID | Appropriate error returned |
| Update existing transaction | Transaction updated |
| Delete existing transaction | Transaction deleted |
| Access another user's transaction | Access denied |

## 6. Search, Filter and Pagination Testing

Verify the following:

- Search by transaction title.
- Filter by income.
- Filter by expense.
- Filter by category.
- Filter by start date.
- Filter by end date.
- Filter using date ranges.
- Sort transactions by date.
- Sort transactions by amount.
- Navigate between pages.
- Request an empty result page.
- Handle invalid pagination parameters.

Expected Result:

All filters and sorting operations must return accurate user-specific results.

## 7. Dashboard Testing

Verify:

- Total income calculation.
- Total expense calculation.
- Current balance calculation.
- Savings rate calculation.
- Recent transaction ordering.
- Monthly financial summaries.
- Dashboard data after transaction creation.
- Dashboard data after transaction update.
- Dashboard data after transaction deletion.

Expected Result:

Dashboard values must match the underlying database records.

## 8. Analytics Testing

Verify:

- Monthly income aggregation.
- Monthly expense aggregation.
- Category-wise expense aggregation.
- Date-range filtering.
- Monthly spending trends.
- Empty analytics results.
- Transactions from different users must not affect each other's analytics.

Expected Result:

All analytical results must be accurate and isolated by user.

## 9. Budget Testing

| Test Case | Expected Result |
|---|---|
| Create valid budget | Budget created |
| Create budget with zero amount | Validation error |
| Create duplicate monthly category budget | Duplicate rejected |
| Update budget | Budget updated |
| Delete budget | Budget deleted |
| Calculate amount spent | Correct expense total |
| Calculate remaining budget | Correct remaining amount |
| Calculate utilization percentage | Correct percentage |
| Exceed budget limit | Budget warning displayed |

## 10. Category Testing

Verify:

- Retrieve system categories.
- Retrieve custom categories.
- Create custom category.
- Update custom category.
- Delete unused custom category.
- Prevent unauthorized category modifications.
- Prevent invalid category references.
- Prevent incompatible income/expense category usage.

## 11. Frontend UI Testing

Verify the following pages:

- Login page.
- Register page.
- Dashboard.
- Transactions.
- Analytics.
- Budgets.
- Profile and Settings.

Check:

- Correct page rendering.
- Responsive navigation.
- Form validation.
- Modal behavior.
- Button interactions.
- Toast notifications.
- Loading skeletons.
- Empty states.
- Error states.
- Light and dark themes.
- Scroll reveal animations.
- Page transitions.
- Mobile responsiveness.

## 12. Security Testing

Verify:

- Passwords are never stored in plaintext.
- Passwords are never returned in API responses.
- Protected endpoints reject unauthenticated requests.
- Users cannot access another user's transactions.
- Users cannot modify another user's budgets.
- Request validation prevents invalid data.
- Sensitive endpoints use rate limiting.
- Authentication cookies use secure configurations.
- Environment secrets are not exposed.
- CORS is configured correctly.

## 13. Financial Calculation Testing

Financial calculations require special attention.

Test scenarios:

### Scenario 1 — Balance Calculation

Income: ₹50,000

Expenses: ₹15,000

Expected Balance: ₹35,000

### Scenario 2 — Multiple Transactions

Income: ₹60,000

Expenses:
- Food: ₹5,000
- Rent: ₹12,000
- Transport: ₹3,000

Expected Total Expenses: ₹20,000

Expected Balance: ₹40,000

### Scenario 3 — Budget Utilization

Budget: ₹10,000

Amount Spent: ₹7,500

Expected Remaining Budget: ₹2,500

Expected Utilization: 75%

### Scenario 4 — Budget Exceeded

Budget: ₹5,000

Amount Spent: ₹6,000

Expected Remaining Budget: -₹1,000

Expected Utilization: 120%

## 14. Error Handling Testing

Verify:

- Invalid request body.
- Missing required fields.
- Invalid ObjectId.
- Database connection failure.
- Unauthorized access.
- Resource not found.
- Duplicate resources.
- Unexpected server errors.

Expected Result:

The application should return consistent error responses without exposing internal server details.

## 15. Performance Testing

Check:

- API response times.
- Database query performance.
- Aggregation pipeline efficiency.
- Pagination performance.
- Frontend rendering performance.
- Animation smoothness.
- Large transaction history handling.

Database indexes should be evaluated using actual query patterns and explain plans.

## 16. Regression Testing

After implementing new features, verify that previously working functionality continues to work.

Important regression areas:

- Authentication.
- Transaction CRUD.
- Dashboard calculations.
- Analytics.
- Budget calculations.
- User-specific data isolation.
- Frontend navigation.

## 17. Testing Completion Checklist

### Backend
- [ ] Authentication tests completed.
- [ ] Transaction API tests completed.
- [ ] Category API tests completed.
- [ ] Budget API tests completed.
- [ ] Dashboard tests completed.
- [ ] Analytics tests completed.
- [ ] Validation tests completed.
- [ ] Security tests completed.

### Frontend
- [ ] All pages tested.
- [ ] Forms tested.
- [ ] API integration tested.
- [ ] Loading and error states tested.
- [ ] Responsive design tested.
- [ ] Theme switching tested.
- [ ] Animations tested.

### Final Verification
- [ ] Financial calculations verified.
- [ ] Cross-user access prevented.
- [ ] Regression testing completed.
- [ ] Production build successful.
- [ ] Deployment configuration verified.

## 18. Testing Principles

- Test both successful and unsuccessful scenarios.
- Verify edge cases.
- Never rely only on frontend validation.
- Verify database changes.
- Test financial calculations carefully.
- Keep test data isolated.
- Run regression tests after major changes.
- Do not consider a feature complete until its tests pass.

## 19. Important Note

This document defines the planned testing strategy and test cases.

Actual automated test coverage and execution results will be documented during implementation. A test case must not be marked complete until it has been executed and verified.

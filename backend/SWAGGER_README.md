# FnE API Documentation

This document describes the Swagger/OpenAPI documentation implementation for the FnE (Finance & Expense) API.

## Overview

The FnE API is fully documented using Swagger/OpenAPI 3.0 specification. The documentation is automatically generated from JSDoc comments in the route files.

## Accessing the Documentation

Once the server is running, you can access the Swagger UI at:

```
http://localhost:3000/api-docs
```

## Features

### Authentication
- **Bearer Token Authentication**: All protected endpoints require a JWT token
- **Token Format**: `Bearer <your-jwt-token>`
- **Token Source**: Obtain tokens from `/api/auth/login` or `/api/auth/register` endpoints

### API Endpoints

The API is organized into the following categories:

#### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

#### Accounts (`/api/accounts`)
- `GET /api/accounts` - Get all accounts
- `POST /api/accounts` - Create new account
- `GET /api/accounts/types` - Get account types
- `GET /api/accounts/institutions` - Get financial institutions
- `GET /api/accounts/summary` - Get account summary
- `GET /api/accounts/{id}` - Get account by ID
- `PUT /api/accounts/{id}` - Update account
- `DELETE /api/accounts/{id}` - Delete account

#### Transactions (`/api/transactions`)
- `GET /api/transactions` - Get all transactions (with filters)
- `POST /api/transactions` - Create new transaction
- `GET /api/transactions/stats` - Get transaction statistics
- `GET /api/transactions/{id}` - Get transaction by ID
- `PUT /api/transactions/{id}` - Update transaction
- `DELETE /api/transactions/{id}` - Delete transaction

#### Categories (`/api/categories`)
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create new category
- `GET /api/categories/groups` - Get category groups
- `GET /api/categories/type/{type}` - Get categories by type
- `GET /api/categories/{id}` - Get category by ID
- `PUT /api/categories/{id}` - Update category
- `DELETE /api/categories/{id}` - Delete category

#### Budgets (`/api/budgets`)
- `GET /api/budgets` - Get all budgets
- `POST /api/budgets` - Create new budget
- `GET /api/budgets/{id}` - Get budget by ID
- `PUT /api/budgets/{id}` - Update budget
- `DELETE /api/budgets/{id}` - Delete budget

#### Budget Categories (`/api/budget-categories`)
- `GET /api/budget-categories/{budgetId}` - Get budget category allocations
- `POST /api/budget-categories` - Add category allocation
- `PUT /api/budget-categories/{id}` - Update category allocation
- `DELETE /api/budget-categories/{id}` - Delete category allocation

#### Reports (`/api/reports`)
- `GET /api/reports/spending-summary` - Get spending summary
- `GET /api/reports/category-breakdown` - Get category breakdown
- `GET /api/reports/cash-flow` - Get cash flow report

#### Credit Cards (`/api/credit-cards`)
- `POST /api/credit-cards/extract-credit-card-info` - Extract info from PDF
- `GET /api/credit-cards` - Get all credit cards
- `POST /api/credit-cards` - Save new credit card
- `GET /api/credit-cards/card-names` - Get card name options
- `POST /api/credit-cards/card-names` - Add card name option
- `GET /api/credit-cards/{id}` - Get credit card by ID
- `PUT /api/credit-cards/{id}` - Update credit card
- `DELETE /api/credit-cards/{id}` - Delete credit card

#### User (`/api/user`)
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `DELETE /api/user/deactivate` - Deactivate account

#### Health Check
- `GET /health` - Basic health check
- `GET /api/db-health` - Database health check

## Testing the API

### Using Swagger UI
1. Start the server: `npm start`
2. Open `http://localhost:3000/api-docs`
3. Click "Authorize" and enter your JWT token
4. Test endpoints directly from the UI

### Using curl
```bash
# Login to get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Use token for authenticated requests
curl -X GET http://localhost:3000/api/accounts \
  -H "Authorization: Bearer <your-token>"
```

## Data Types

### Common Fields
- **UUIDs**: All IDs use UUID format
- **Dates**: ISO 8601 format (YYYY-MM-DD)
- **Timestamps**: ISO 8601 format with time (YYYY-MM-DDTHH:mm:ss.sssZ)
- **Currency**: 3-letter ISO codes (e.g., INR, USD)
- **Amounts**: Decimal numbers with up to 2 decimal places

### Enums
- **Transaction Types**: `income`, `expense`, `transfer`
- **Transaction Status**: `pending`, `completed`, `cancelled`, `failed`
- **Budget Status**: `active`, `inactive`, `archived`
- **Category Types**: `income`, `expense`, `transfer`

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## Development

### Adding New Endpoints
To add documentation for new endpoints:

1. Add JSDoc comments above your route definitions
2. Follow the existing pattern for request/response schemas
3. Include proper tags for organization
4. Add security requirements for protected endpoints

Example:
```javascript
/**
 * @swagger
 * /api/example:
 *   get:
 *     summary: Example endpoint
 *     tags: [Example]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
```

### Regenerating Documentation
The documentation is automatically generated when the server starts. No manual regeneration is needed. 
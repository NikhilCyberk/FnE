# FnE Schema Migration Guide

## Overview
This guide documents the migration from the old integer-based schema to the new UUID-based enhanced schema for the Finance & Expense (FnE) application.

## Key Changes

### 1. Database Schema Changes

#### New Features:
- **UUID Primary Keys**: All tables now use UUID primary keys for better security and scalability
- **Enhanced User Management**: Added comprehensive user profile fields, security features, and preferences
- **Financial Institutions**: Separate table for managing bank/institution information
- **Account Types**: Structured account type management with categories (asset, liability, equity)
- **Category Groups**: Hierarchical category organization with groups and parent-child relationships
- **Enhanced Transactions**: Added status tracking, transfer support, location tracking, and better metadata
- **Credit Card Management**: Dedicated credit card tracking with detailed statement management
- **Financial Goals**: Goal setting and tracking functionality
- **Recurring Transactions**: Automated recurring transaction management
- **Audit Logging**: Comprehensive audit trail for sensitive operations
- **Notifications**: User notification system
- **Row Level Security**: Enhanced data security with RLS policies

#### Backward Compatibility:
- The new schema maintains API compatibility where possible
- Data migration scripts are provided for existing data

### 2. Backend Changes

#### Updated Controllers:
- **AuthController**: Enhanced with profile management, security features, and better validation
- **AccountsController**: Updated for new account structure with types and institutions
- **TransactionsController**: Enhanced with transfer support, status tracking, and statistics
- **CategoriesController**: Updated for hierarchical categories and groups

#### New API Endpoints:
- `/api/auth/profile` - User profile management
- `/api/accounts/types` - Account types listing
- `/api/accounts/institutions` - Financial institutions listing
- `/api/accounts/summary` - Account summary/overview
- `/api/categories/groups` - Category groups listing
- `/api/categories/type/{type}` - Categories by type with statistics
- `/api/transactions/stats` - Transaction statistics

#### Enhanced Features:
- Better error handling and validation
- Comprehensive logging
- Enhanced Swagger documentation
- Improved security with JWT token management
- Request/response interceptors

### 3. Frontend Changes

#### Updated API Configuration:
- Centralized API management with interceptors
- Better error handling and authentication
- Structured API helper functions

#### Updated Redux Slices:
- **AuthSlice**: Enhanced with user profile management
- **AccountsSlice**: Updated for new account structure and pagination
- **TransactionsSlice**: Enhanced with statistics and better data handling
- **CategoriesSlice**: Updated for hierarchical categories

#### New Features:
- Better state management
- Enhanced error handling
- Improved user experience with loading states
- Better data validation

## Migration Steps

### 1. Database Migration

1. **Backup your existing database**:
   ```bash
   pg_dump your_database > backup_before_migration.sql
   ```

2. **Apply the new schema**:
   ```bash
   psql your_database < backend/init-scripts/schema.sql
   ```

3. **Run the migration script** (if you have existing data):
   ```bash
   psql your_database < backend/init-scripts/migrate_to_uuid_schema.sql
   ```
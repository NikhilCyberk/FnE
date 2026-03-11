# FnE - Finance & Expense Tracker

A comprehensive personal finance management application built with React and Node.js.

## Project Structure

### Backend (`/backend`)
```
backend/
├── src/
│   ├── config/          # Configuration files (Swagger, database, etc.)
│   ├── controllers/     # Route controllers
│   ├── middleware/       # Express middleware
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── server.js        # Main server entry point
├── uploads/             # File uploads
└── package.json
```

### Frontend (`/frontend`)
```
frontend/
├── src/
│   ├── components/      # Reusable React components
│   │   ├── common/      # Shared components
│   │   ├── auth/        # Authentication components
│   │   ├── accounts/    # Account management
│   │   ├── transactions/ # Transaction components
│   │   ├── creditCards/ # Credit card components
│   │   ├── budgets/     # Budget components
│   │   ├── dashboard/   # Dashboard widgets
│   │   └── layout/      # Layout components
│   ├── pages/           # Page components
│   ├── slices/          # Redux slices
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API services
│   ├── utils/           # Utility functions
│   ├── constants/       # Application constants
│   └── App.jsx          # Main App component
├── public/              # Static assets
└── package.json
```

## Key Refactoring Improvements

### Backend Improvements

1. **Modular Architecture**
   - Extracted configuration into separate files (`config/swagger.js`)
   - Separated middleware into reusable functions (`middleware/index.js`)
   - Organized routes with a centralized setup (`routes/index.js`)

2. **Cleaner Server Setup**
   - Streamlined `server.js` with clear separation of concerns
   - Improved error handling and logging
   - Better organization of API endpoints

### Frontend Improvements

1. **Custom Hooks**
   - `useForm`: Form state management
   - `useAsyncState`: Async operation handling
   - `useDialog`: Dialog state management
   - `usePagination`: Pagination state
   - `useApiCall`: API call with error handling
   - `useLocalStorage`: Local storage management
   - `useDebounce`: Debounced values

2. **Utility Functions**
   - `formatAmount`, `formatDate`: Data formatting
   - `validateEmail`, `validatePhone`: Input validation
   - `debounce`, `throttle`: Performance utilities
   - `ErrorHandler`: Centralized error handling

3. **Constants Management**
   - Centralized transaction types, categories, and status
   - API endpoints and error messages
   - Currency configurations

4. **Service Layer**
   - Organized API calls into service modules
   - Centralized axios configuration with interceptors
   - Automatic token management and error handling

5. **Component Refactoring**
   - Reduced component complexity with custom hooks
   - Better separation of concerns
   - Reusable utility functions

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Backend .env
   DATABASE_URL=postgresql://fneuser:fnepassword@localhost:5432/fnedb
   JWT_SECRET=your_jwt_secret
   PORT=3000

   # Frontend .env
   REACT_APP_API_URL=http://localhost:3000
   ```

4. Run the application:
   ```bash
   # Backend
   cd backend
   npm start

   # Frontend (in separate terminal)
   cd frontend
   npm run dev
   ```

## Features

- **Account Management**: Track multiple bank accounts and credit cards
- **Transaction Tracking**: Add, edit, and categorize transactions
- **Budget Management**: Set and monitor budget limits
- **Credit Card Management**: Track credit card transactions and payments
- **Reporting**: Visualize spending patterns and financial trends
- **Cash Flow Tracking**: Monitor income and expenses
- **Dashboard**: Overview of financial status

## API Documentation

Once the backend is running, visit `http://localhost:3000/api-docs` for the interactive API documentation.

## Contributing

1. Follow the established code structure
2. Use the provided hooks and utilities
3. Maintain consistent naming conventions
4. Add tests for new features
5. Update documentation as needed

## License

This project is licensed under the MIT License.

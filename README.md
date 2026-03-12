# FinanceEase (FnE)

FinanceEase is a comprehensive personal finance management application designed to help users track their assets, liabilities, income, and expenses with ease. It provides a premium user interface with interactive dashboards, detailed account management, and automated tracking for loans and credit cards.

## 🚀 Features

- **Dynamic Dashboard**: Visualize your financial health with real-time KPI metrics and interactive charts using Recharts.
- **Account Management**: Track various account types including Savings, Checking, Cash, and more.
- **Credit Card Tracking**: Manage credit card transactions, track payment due dates, and record payments.
- **Loan Management**: Automated EMI schedules, remaining balance tracking, and penalty management for your loans.
- **Transaction Tracking**: Categorize every transaction with support for multi-account transfers and cash sources.
- **Budgets & Goals**: Set monthly budgets for different categories and monitor your spending habits.
- **Comprehensive Reports**: Detailed spending summaries, category breakdowns, and cash flow analysis.

## 🛠️ Technology Stack

### Backend
- **Core**: Node.js & Express.js
- **Database**: PostgreSQL with `pg` pool management
- **Authentication**: JWT (JSON Web Tokens) with `bcrypt` password hashing
- **Documentation**: Swagger UI for API exploration
- **Logging**: Winston logger for robust error tracking

### Frontend
- **Framework**: React.js (Vite)
- **State Management**: Redux Toolkit
- **Styling**: Material UI (MUI) v7 & TailwindCSS
- **Visualizations**: Recharts for dynamic data plotting
- **Routing**: React Router DOM

## 🏁 Getting Started

### Prerequisites
- Node.js (v24+ recommended)
- PostgreSQL (or Docker for automated setup)
- Docker & Docker Compose (recommended)

### Docker Setup (Recommended for Database)
The easiest way to get the database running is using the provided `docker-compose.yml` file.

1. **Start the PostgreSQL container**:
   ```bash
   docker-compose up -d
   ```

2. **Database Credentials**:
   By default, the following credentials are configured:
   - **User**: `fneuser`
   - **Password**: `fnepassword`
   - **Database**: `fnedb`
   - **Port**: `5432`

3. **Verify Connection**:
   The database should now be accessible at `localhost:5432`.

### Manual Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd FnE
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   # Create a .env file and update with credentials from Docker step
   npm run dev
   ```

3. **Frontend Setup**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

### Database Migration
The project includes several utility scripts for database management:
- `node update-db.js`: Updates the database schema.
- Various scripts in the `backend` directory for specific migrations (e.g., `migrate_emi.js`, `migrate_schedule.js`).

## 📁 Project Structure

```text
FnE/
├── backend/            # Express.js server and API logic
│   ├── src/
│   │   ├── controllers/# Business logic for each resource
│   │   ├── routes/     # API endpoint definitions
│   │   └── db.js       # Database connection pool
├── frontend/           # React.js application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Page-level components
│   │   └── slices/     # Redux state slices
└── docker-compose.yml  # Docker orchestration (if applicable)
```

## 📄 License
This project is licensed under the ISC License.

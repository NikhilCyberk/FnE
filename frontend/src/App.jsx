import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AccountsPage from './pages/AccountsPage';
import TransactionsPage from './pages/TransactionsPage';
import BudgetsPage from './pages/BudgetsPage';
import ReportsPage from './pages/ReportsPage';
import CreditCardsPage from './pages/CreditCardsPage';
import CreditCardDetailPage from './pages/CreditCardDetailPage';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from './slices/authSlice';
import { 
  FaTachometerAlt, 
  FaWallet, 
  FaExchangeAlt, 
  FaPiggyBank, 
  FaChartPie, 
  FaCreditCard,
  FaBars,
  FaSignOutAlt,
  FaSun,
  FaMoon
} from 'react-icons/fa';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: FaTachometerAlt },
  { label: 'Accounts', path: '/accounts', icon: FaWallet },
  { label: 'Credit Cards', path: '/credit-cards', icon: FaCreditCard },
  { label: 'Transactions', path: '/transactions', icon: FaExchangeAlt },
  { label: 'Budgets', path: '/budgets', icon: FaPiggyBank },
  { label: 'Reports', path: '/reports', icon: FaChartPie },
];

function AppContent() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  
  const handleNav = (path) => {
    navigate(path);
    setMobileOpen(false);
  };
  
  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const drawer = (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      {/* Logo */}
      <div className="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">F</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">FinanceEase</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => handleNav(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
        >
          <FaSignOutAlt className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );

  // Only show sidebar if logged in and not on login/register
  const showSidebar = token && !['/login', '/register'].includes(location.pathname);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {showSidebar && (
          <>
            {/* Mobile Drawer */}
            <div className={`fixed inset-0 z-50 lg:hidden ${mobileOpen ? 'block' : 'hidden'}`}>
              <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleDrawerToggle} />
              <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 shadow-xl">
                {drawer}
              </div>
            </div>

            {/* Desktop Drawer */}
            <div className="hidden lg:block w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
              {drawer}
            </div>
          </>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          {showSidebar && (
            <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleDrawerToggle}
                    className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <FaBars className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {navItems.find((item) => location.pathname.startsWith(item.path))?.label || 'FinanceEase'}
                  </h2>
                </div>

                {/* Theme Toggle */}
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {darkMode ? (
                    <FaSun className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <FaMoon className="w-5 h-5 text-gray-600" />
                  )}
                </button>
              </div>
            </header>
          )}

          {/* Page Content */}
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/credit-cards" element={<CreditCardsPage />} />
              <Route path="/credit-cards/:id" element={<CreditCardDetailPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/budgets" element={<BudgetsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

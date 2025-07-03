import React, { useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Container from '@mui/material/Container';
import CssBaseline from '@mui/material/CssBaseline';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AccountsPage from './pages/AccountsPage';
import TransactionsPage from './pages/TransactionsPage';
import BudgetsPage from './pages/BudgetsPage';
import ReportsPage from './pages/ReportsPage';
import CreditCardsPage from './pages/CreditCardsPage';
import { ThemeProvider, createTheme, useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import viteLogo from '../public/vite.svg';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import { FaTachometerAlt, FaWallet, FaExchangeAlt, FaPiggyBank, FaChartPie, FaCreditCard } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from './slices/authSlice';

const drawerWidth = 220;

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: <FaTachometerAlt size={20} /> },
  { label: 'Accounts', path: '/accounts', icon: <FaWallet size={20} /> },
  { label: 'Credit Cards', path: '/credit-cards', icon: <FaCreditCard size={20} /> },
  { label: 'Transactions', path: '/transactions', icon: <FaExchangeAlt size={20} /> },
  { label: 'Budgets', path: '/budgets', icon: <FaPiggyBank size={20} /> },
  { label: 'Reports', path: '/reports', icon: <FaChartPie size={20} /> },
];

function AppContent() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleNav = (path) => {
    navigate(path);
    setMobileOpen(false);
  };
  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, pb: 1 }}>
        <img src={viteLogo} alt="logo" style={{ width: 32, height: 32 }} />
        <Typography variant="h6" fontWeight={700} color="primary.main">FinanceEase</Typography>
      </Box>
      <Divider />
      <List sx={{ flexGrow: 1 }}>
        {navItems.map((item) => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton selected={location.pathname === item.path} onClick={() => handleNav(item.path)}>
              <ListItemIcon sx={{ color: 'primary.main' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon sx={{ color: 'error.main' }}><LogoutIcon /></ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  // Only show sidebar if logged in and not on login/register
  const showSidebar = token && !['/login', '/register'].includes(location.pathname);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {showSidebar && (
        <>
          {/* Mobile Drawer */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            {drawer}
          </Drawer>
          {/* Desktop Drawer */}
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
            open
          >
            {drawer}
          </Drawer>
        </>
      )}
      <Box component="main" sx={{ flexGrow: 1, pl: { md: showSidebar ? `${drawerWidth}px` : 0 }, pt: 0 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2, px: { xs: 2, sm: 4 }, mb: 2 }}>
          {showSidebar && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { md: 'none' }, mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ flexGrow: 1 }}>
            {navItems.find((item) => location.pathname.startsWith(item.path))?.label || 'FinanceEase'}
          </Typography>
          {/* Theme toggle moved here */}
          <ThemeToggleButton />
        </Box>
        <Container maxWidth="md" sx={{ pt: 2 }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/credit-cards" element={<CreditCardsPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </Container>
      </Box>
    </Box>
  );
}

function ThemeToggleButton() {
  const [mode, setMode] = React.useState(localStorage.getItem('mui-theme-mode') || 'light');
  React.useEffect(() => {
    localStorage.setItem('mui-theme-mode', mode);
    document.body.setAttribute('data-theme', mode);
  }, [mode]);
  const theme = useTheme();
  React.useEffect(() => {
    theme.palette.mode = mode;
  }, [mode, theme.palette]);
  return (
    <IconButton onClick={() => setMode((prev) => (prev === 'light' ? 'dark' : 'light'))} color="inherit" aria-label="toggle theme">
      {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  );
}

function App() {
  const [mode, setMode] = useState(localStorage.getItem('mui-theme-mode') || 'light');
  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: { main: mode === 'dark' ? '#90caf9' : '#1976d2' },
      background: {
        default: mode === 'dark' ? '#181a1b' : '#f4f6fb',
        paper: mode === 'dark' ? '#232526' : '#fff',
      },
    },
    shape: { borderRadius: 12 },
    typography: { fontFamily: 'Inter, Roboto, Arial, sans-serif' },
  }), [mode]);

  React.useEffect(() => {
    localStorage.setItem('mui-theme-mode', mode);
  }, [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;

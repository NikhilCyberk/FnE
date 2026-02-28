import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../../slices/authSlice';
import {
    Box, Toolbar, AppBar, Drawer, IconButton, Typography, List, ListItem,
    ListItemButton, ListItemIcon, ListItemText, Divider, useMediaQuery, useTheme
} from '@mui/material';
import {
    Menu as MenuIcon, Brightness4, Brightness7, Dashboard as DashboardIcon,
    AccountBalanceWallet, CreditCard, SwapHoriz, Savings, PieChart, ExitToApp,
    RequestQuote
} from '@mui/icons-material';

const drawerWidth = 260;

const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { label: 'Accounts', path: '/accounts', icon: <AccountBalanceWallet /> },
    { label: 'Credit Cards', path: '/credit-cards', icon: <CreditCard /> },
    { label: 'Loans', path: '/loans', icon: <RequestQuote /> },
    { label: 'Transactions', path: '/transactions', icon: <SwapHoriz /> },
    { label: 'Budgets', path: '/budgets', icon: <Savings /> },
    { label: 'Reports', path: '/reports', icon: <PieChart /> },
];

const MainLayout = ({ children, mode, toggleColorMode }) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

    const { token } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

    const handleNav = (path) => {
        navigate(path);
        if (isMobile) setMobileOpen(false);
    };

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate('/login');
    };

    const drawer = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Toolbar sx={{ px: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                    width: 36, height: 36, borderRadius: 3,
                    background: 'linear-gradient(135deg, #4f46e5 0%, #0d9488 100%)',
                    boxShadow: mode === 'light' ? '0 4px 12px rgba(79, 70, 229, 0.3)' : '0 4px 12px rgba(79, 70, 229, 0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Typography variant="h6" fontWeight="bold" color="white">F</Typography>
                </Box>
                <Typography variant="h6" fontWeight="800" sx={{ letterSpacing: '-0.025em' }}>FinanceEase</Typography>
            </Toolbar>
            <Divider />

            <List sx={{ flexGrow: 1, px: 2, pt: 2 }}>
                {navItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <ListItem key={item.label} disablePadding sx={{ mb: 1 }}>
                            <ListItemButton
                                onClick={() => handleNav(item.path)}
                                selected={isActive}
                                sx={{
                                    borderRadius: 3,
                                    mb: 0.5,
                                    transition: 'all 0.2s ease-in-out',
                                    position: 'relative',
                                    '&::before': isActive ? {
                                        content: '""',
                                        position: 'absolute',
                                        left: -16,
                                        top: '10%',
                                        height: '80%',
                                        width: 4,
                                        borderRadius: '0 4px 4px 0',
                                        backgroundColor: 'primary.main',
                                    } : {},
                                    '&.Mui-selected': {
                                        bgcolor: mode === 'light' ? 'rgba(79, 70, 229, 0.08)' : 'rgba(79, 70, 229, 0.15)',
                                        color: 'primary.main',
                                        '& .MuiListItemIcon-root': { color: 'primary.main' },
                                        '&:hover': {
                                            bgcolor: mode === 'light' ? 'rgba(79, 70, 229, 0.12)' : 'rgba(79, 70, 229, 0.2)',
                                        }
                                    },
                                    '&:hover': {
                                        bgcolor: mode === 'light' ? 'rgba(15, 23, 42, 0.04)' : 'rgba(255, 255, 255, 0.04)',
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 44, color: isActive ? 'inherit' : 'text.secondary', transition: 'color 0.2s' }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: isActive ? 600 : 500, transition: 'font-weight 0.2s' }} />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            <Box sx={{ p: 2 }}>
                <Divider sx={{ mb: 2 }} />
                <List disablePadding>
                    <ListItem disablePadding>
                        <ListItemButton
                            onClick={handleLogout}
                            sx={{ borderRadius: 2, color: 'error.main', '&:hover': { bgcolor: 'error.light', color: 'error.contrastText', '& .MuiListItemIcon-root': { color: 'error.contrastText' } } }}
                        >
                            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                                <ExitToApp />
                            </ListItemIcon>
                            <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 500 }} />
                        </ListItemButton>
                    </ListItem>
                </List>
            </Box>
        </Box>
    );

    const showSidebar = token && !['/login', '/register'].includes(location.pathname);
    const currentNav = navItems.find((item) => location.pathname.startsWith(item.path));

    if (!showSidebar) {
        return (
            <Box sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
                {children}
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { lg: `calc(100% - ${drawerWidth}px)` },
                    ml: { lg: `${drawerWidth}px` }
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { lg: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
                        {currentNav?.label || 'FinanceEase'}
                    </Typography>
                    <IconButton sx={{ ml: 1 }} onClick={toggleColorMode} color="inherit">
                        {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
                    </IconButton>
                </Toolbar>
            </AppBar>

            <Box component="nav" sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}>
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', lg: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', lg: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 2, md: 3 },
                    width: { xs: '100%', lg: `calc(100% - ${drawerWidth}px)` },
                    mt: { xs: 7, sm: 8 } // AppBar offset
                }}
            >
                {children}
            </Box>
        </Box>
    );
};

export default MainLayout;

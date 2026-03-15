import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../../slices/authSlice';
import {
    Box, Toolbar, AppBar, Drawer, IconButton, Typography, List, ListItem,
    ListItemButton, ListItemIcon, ListItemText, Divider, useMediaQuery, useTheme, Tooltip
} from '@mui/material';
import {
    Menu as MenuIcon, Brightness4, Brightness7, Dashboard as DashboardIcon,
    AccountBalanceWallet, CreditCard, SwapHoriz, Savings, PieChart, ExitToApp,
    RequestQuote, PeopleAlt
} from '@mui/icons-material';

const DRAWER_WIDTH = 260;
const COLLAPSED_WIDTH = 80;

const navItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { id: 'accounts', label: 'Accounts', path: '/accounts', icon: <AccountBalanceWallet /> },
    { id: 'credit-cards', label: 'Credit Cards', path: '/credit-cards', icon: <CreditCard /> },
    { id: 'loans', label: 'Loans', path: '/loans', icon: <RequestQuote /> },
    { id: 'transactions', label: 'Transactions', path: '/transactions', icon: <SwapHoriz /> },
    { id: 'contacts', label: 'Contacts', path: '/contacts', icon: <PeopleAlt /> },
    { id: 'budgets', label: 'Budgets', path: '/budgets', icon: <Savings /> },
    { id: 'reports', label: 'Reports', path: '/reports', icon: <PieChart /> },
];

const MainLayout = ({ children, mode, toggleColorMode }) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

    const { token } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
    const handleToggleCollapse = () => setIsCollapsed(!isCollapsed);

    const handleNav = (path) => {
        navigate(path);
        if (isMobile) setMobileOpen(false);
    };

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate('/login');
    };

    const activeWidth = isCollapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;

    const drawer = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflowX: 'hidden' }}>
            <Toolbar sx={{ px: 2, display: 'flex', alignItems: 'center', gap: isCollapsed ? 0 : 2, justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
                <Box sx={{
                    width: 36, height: 36, borderRadius: 3,
                    background: 'linear-gradient(135deg, #4f46e5 0%, #0d9488 100%)',
                    boxShadow: mode === 'light' ? '0 4px 12px rgba(79, 70, 229, 0.3)' : '0 4px 12px rgba(79, 70, 229, 0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                }}>
                    <Typography variant="h6" fontWeight="bold" color="white">F</Typography>
                </Box>
                {!isCollapsed && <Typography variant="h6" fontWeight="800" sx={{ letterSpacing: '-0.025em', whiteSpace: 'nowrap' }}>FinanceEase</Typography>}
            </Toolbar>
            <Divider />

            <List sx={{ flexGrow: 1, px: isCollapsed ? 1 : 2, pt: 2 }}>
                {navItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
                            <Tooltip title={isCollapsed ? item.label : ""} placement="right">
                                <ListItemButton
                                    onClick={() => handleNav(item.path)}
                                    selected={isActive}
                                    sx={{
                                        borderRadius: 3,
                                        px: isCollapsed ? 1.5 : 2,
                                        mb: 0.5,
                                        transition: 'all 0.2s ease-in-out',
                                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                                        '&.Mui-selected': {
                                            bgcolor: mode === 'light' ? 'rgba(79, 70, 229, 0.08)' : 'rgba(79, 70, 229, 0.15)',
                                            color: 'primary.main',
                                            '& .MuiListItemIcon-root': { color: 'primary.main' },
                                        }
                                    }}
                                >
                                    <ListItemIcon sx={{ 
                                        minWidth: isCollapsed ? 0 : 44, 
                                        mr: isCollapsed ? 0 : 0,
                                        justifyContent: 'center',
                                        color: isActive ? 'inherit' : 'text.secondary' 
                                    }}>
                                        {item.icon}
                                    </ListItemIcon>
                                    {!isCollapsed && <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: isActive ? 600 : 500 }} />}
                                </ListItemButton>
                            </Tooltip>
                        </ListItem>
                    );
                })}
            </List>

            <Box sx={{ p: isCollapsed ? 1 : 2 }}>
                <Divider sx={{ mb: 2 }} />
                <List disablePadding>
                    <ListItem disablePadding>
                        <Tooltip title={isCollapsed ? "Logout" : ""} placement="right">
                            <ListItemButton
                                onClick={handleLogout}
                                sx={{ 
                                    borderRadius: 2, 
                                    px: isCollapsed ? 1.5 : 2,
                                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                                    color: 'error.main', 
                                    '&:hover': { bgcolor: 'error.light', color: 'error.contrastText', '& .MuiListItemIcon-root': { color: 'error.contrastText' } } 
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: isCollapsed ? 0 : 40, color: 'inherit', justifyContent: 'center' }}>
                                    <ExitToApp />
                                </ListItemIcon>
                                {!isCollapsed && <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 500 }} />}
                            </ListItemButton>
                        </Tooltip>
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
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    width: { lg: `calc(100% - ${activeWidth}px)` },
                    ml: { lg: `${activeWidth}px` },
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    transition: theme.transitions.create(['width', 'margin'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.enteringScreen,
                    }),
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={isMobile ? handleDrawerToggle : handleToggleCollapse}
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: -0.5 }}>
                        {currentNav?.label || 'FinanceEase'}
                    </Typography>
                    <IconButton sx={{ ml: 1 }} onClick={toggleColorMode} color="inherit">
                        {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
                    </IconButton>
                </Toolbar>
            </AppBar>

            <Box component="nav" sx={{ width: { lg: activeWidth }, flexShrink: { lg: 0 }, transition: 'width 0.2s' }}>
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', lg: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', lg: 'block' },
                        '& .MuiDrawer-paper': { 
                            boxSizing: 'border-box', 
                            width: activeWidth,
                            transition: theme.transitions.create('width', {
                                easing: theme.transitions.easing.sharp,
                                duration: theme.transitions.duration.enteringScreen,
                            }),
                            overflowX: 'hidden'
                        },
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
                    width: { xs: '100%', lg: `calc(100% - ${activeWidth}px)` },
                    mt: { xs: 7, sm: 8 },
                    transition: theme.transitions.create(['width', 'margin'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.enteringScreen,
                    }),
                }}
            >
                {children}
            </Box>
        </Box>
    );
};

export default MainLayout;

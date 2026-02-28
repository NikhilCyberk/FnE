import { createTheme } from '@mui/material/styles';

const getDesignTokens = (mode) => ({
    palette: {
        mode,
        primary: {
            main: '#4f46e5', // Deep Indigo
            light: '#6366f1',
            dark: '#3730a3',
        },
        secondary: {
            main: '#0d9488', // Teal
            light: '#14b8a6',
            dark: '#0f766e',
        },
        background: {
            default: mode === 'light' ? '#f8fafc' : '#0b0f19', // Sleek slate in dark mode
            paper: mode === 'light' ? '#ffffff' : '#1e293b',
        },
        text: {
            primary: mode === 'light' ? '#0f172a' : '#f8fafc',
            secondary: mode === 'light' ? '#64748b' : '#94a3b8',
        },
        success: {
            main: '#10b981',
            light: '#34d399',
            dark: '#059669',
        },
        error: {
            main: '#ef4444',
            light: '#f87171',
            dark: '#b91c1c',
        },
        warning: {
            main: '#f59e0b',
            light: '#fbbf24',
            dark: '#d97706',
        },
        info: {
            main: '#3b82f6',
            light: '#60a5fa',
            dark: '#2563eb',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 800, letterSpacing: '-0.025em' },
        h2: { fontWeight: 800, letterSpacing: '-0.025em' },
        h3: { fontWeight: 700, letterSpacing: '-0.025em' },
        h4: { fontWeight: 700, letterSpacing: '-0.025em' },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
        subtitle1: { fontWeight: 500 },
        subtitle2: { fontWeight: 500 },
        button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.01em' },
    },
    shape: {
        borderRadius: 16, // Softer curves everywhere
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    padding: '8px 24px',
                    boxShadow: 'none',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: mode === 'light'
                            ? '0 6px 16px rgba(79, 70, 229, 0.2)'
                            : '0 6px 16px rgba(79, 70, 229, 0.4)',
                    },
                },
                contained: {
                    '&:active': {
                        transform: 'translateY(1px)',
                    }
                }
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 20,
                    boxShadow: mode === 'light'
                        ? '0 10px 40px -10px rgba(0,0,0,0.06)'
                        : '0 10px 40px -10px rgba(0,0,0,0.4)',
                    backgroundImage: 'none',
                    border: `1px solid ${mode === 'light' ? 'rgba(226, 232, 240, 0.8)' : 'rgba(51, 65, 85, 0.5)'}`,
                    transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: mode === 'light'
                            ? '0 20px 40px -10px rgba(0,0,0,0.1)'
                            : '0 20px 40px -10px rgba(0,0,0,0.6)',
                    }
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    borderRight: `1px solid ${mode === 'light' ? 'rgba(226, 232, 240, 0.8)' : 'rgba(51, 65, 85, 0.5)'}`,
                    boxShadow: mode === 'light'
                        ? '4px 0 24px rgba(0,0,0,0.02)'
                        : '4px 0 24px rgba(0,0,0,0.2)',
                    backgroundColor: mode === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(30, 41, 59, 0.95)',
                    backdropFilter: 'blur(16px)',
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: mode === 'light' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    borderBottom: `1px solid ${mode === 'light' ? 'rgba(226, 232, 240, 0.8)' : 'rgba(51, 65, 85, 0.5)'}`,
                    boxShadow: 'none',
                    color: mode === 'light' ? '#0f172a' : '#f8fafc',
                },
            },
        },
        MuiListItemIcon: {
            styleOverrides: {
                root: {
                    minWidth: 44,
                    color: 'inherit',
                }
            }
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    backgroundColor: mode === 'light' ? '#f8fafc' : '#0f172a',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6366f1',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderWidth: '2px',
                    },
                },
                notchedOutline: {
                    borderColor: mode === 'light' ? '#e2e8f0' : '#334155',
                }
            }
        },
    },
});

export const createAppTheme = (mode) => createTheme(getDesignTokens(mode));

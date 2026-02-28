import React from 'react';
import { Box, Typography } from '@mui/material';

const AuthLayout = ({ children, title, subtitle }) => {
    return (
        <Box sx={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: (theme) => theme.palette.mode === 'light'
                ? 'linear-gradient(135deg, #f0fdf4 0%, #e0e7ff 100%)'
                : 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
            p: 3
        }}>
            <Box sx={{ maxWidth: 400, width: '100%' }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Box sx={{
                        mx: 'auto', width: 64, height: 64, borderRadius: 3,
                        background: 'linear-gradient(45deg, #6366f1 30%, #ec4899 90%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3
                    }}>
                        <Typography variant="h4" fontWeight="bold" color="white">F</Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>{title}</Typography>
                    <Typography color="text.secondary">{subtitle}</Typography>
                </Box>

                {children}

                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
                    © 2024 FinanceEase. All rights reserved.
                </Typography>
            </Box>
        </Box>
    );
};

export default AuthLayout;

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ArrowForward as ArrowIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

/**
 * WidgetCard
 *
 * A consistent card shell used by every dashboard widget.
 *
 * Props:
 *   title     – string header
 *   icon      – MUI icon element shown in the badge
 *   accent    – hex/rgb color used for the badge gradient and link button
 *   linkTo    – optional route path for the "View All" button
 *   linkLabel – optional label override (default "View All")
 *   children  – widget body content
 */
const WidgetCard = ({ title, icon, accent = '#6366f1', children, linkTo, linkLabel }) => {
    const navigate = useNavigate();

    return (
        <Box sx={{
            borderRadius: '20px',
            border: '1px solid', borderColor: 'divider',
            background: theme =>
                theme.palette.mode === 'dark'
                    ? 'linear-gradient(160deg, rgba(28,28,44,1) 0%, rgba(18,18,30,1) 100%)'
                    : 'linear-gradient(160deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
        }}>
            {/* ── Header ── */}
            <Box sx={{
                px: 1.5, py: 1.25,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '1px solid', borderColor: 'divider',
                background: `linear-gradient(135deg, ${accent}14 0%, transparent 100%)`,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{
                        width: 30, height: 30, borderRadius: '8px',
                        background: `linear-gradient(135deg, ${accent} 0%, ${accent}bb 100%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 4px 10px ${accent}44`,
                        '& svg': { fontSize: 18, color: 'white' },
                    }}>
                        {icon}
                    </Box>
                    <Typography variant="subtitle1" fontWeight={700} letterSpacing={-0.2}>
                        {title}
                    </Typography>
                </Box>

                {linkTo && (
                    <Button
                        size="small"
                        endIcon={<ArrowIcon sx={{ fontSize: 14 }} />}
                        onClick={() => navigate(linkTo)}
                        sx={{
                            fontSize: '0.72rem', fontWeight: 600,
                            color: accent, borderRadius: '8px', px: 1, minWidth: 0,
                        }}
                    >
                        {linkLabel || 'View All'}
                    </Button>
                )}
            </Box>

            {/* ── Body ── */}
            <Box sx={{ px: 1.5, py: 1, flexGrow: 1 }}>
                {children}
            </Box>
        </Box>
    );
};

export default WidgetCard;

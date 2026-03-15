import React from 'react';
import { Box, Typography } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

/**
 * DashboardSummaryCard
 *
 * Props:
 *   title      – label text
 *   value      – primary value
 *   icon       – MUI icon element
 *   gradient   – CSS gradient string
 *   glowColor  – rgba string for icon glow / bg blob
 *   subtitle   – small line below value
 *   trend      – { value: '+12.5%', positive: bool } or null
 */
const DashboardSummaryCard = ({ title, value, icon, gradient, glowColor, subtitle, trend }) => (
    <Box sx={{
        borderRadius: '20px',
        border: '1px solid', borderColor: 'divider',
        background: theme =>
            theme.palette.mode === 'dark'
                ? 'linear-gradient(145deg, rgba(30,30,46,0.9) 0%, rgba(22,22,35,0.9) 100%)'
                : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        p: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        transition: 'box-shadow 0.25s, transform 0.25s',
        '&:hover': { boxShadow: '0 8px 32px rgba(0,0,0,0.14)', transform: 'translateY(-2px)' },
        position: 'relative',
        overflow: 'hidden',
    }}>
        {/* Background glow blob */}
        {glowColor && (
            <Box sx={{
                position: 'absolute', top: -30, right: -30,
                width: 100, height: 100, borderRadius: '50%',
                background: glowColor,
                filter: 'blur(40px)',
                opacity: 0.22,
                pointerEvents: 'none',
            }} />
        )}

        {/* Icon */}
        <Box sx={{
            width: 44, height: 44, borderRadius: '12px',
            background: gradient || 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 12px ${glowColor || 'rgba(99,102,241,0.3)'}`,
            flexShrink: 0,
            '& svg': { fontSize: 20, color: 'white' },
        }}>
            {icon}
        </Box>

        {/* Text */}
        <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" fontWeight={600} letterSpacing={0.8}
                sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                {title}
            </Typography>
            <Typography variant="h6" fontWeight={800} letterSpacing={-0.4} sx={{ lineHeight: 1.2, mt: 0.1 }}>
                {value}
            </Typography>

            {/* Trend + subtitle row */}
            {(trend || subtitle) && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.4 }}>
                    {trend && (
                        <>
                            {trend.positive
                                ? <TrendingUp sx={{ fontSize: 13, color: '#4ade80' }} />
                                : <TrendingDown sx={{ fontSize: 13, color: '#f87171' }} />
                            }
                            <Typography variant="caption" fontWeight={700}
                                sx={{ color: trend.positive ? '#4ade80' : '#f87171', fontSize: '0.7rem' }}>
                                {trend.value}
                            </Typography>
                        </>
                    )}
                    {subtitle && (
                        <Typography variant="caption" color="text.disabled" fontSize="0.7rem">
                            {trend ? subtitle : subtitle}
                        </Typography>
                    )}
                </Box>
            )}
        </Box>
    </Box>
);

export default DashboardSummaryCard;

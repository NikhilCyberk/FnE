import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * SummaryCard – premium stat card with gradient icon accent and optional subtitle.
 *
 * Props
 *  title      – label text
 *  value      – primary value to display
 *  icon       – MUI icon element
 *  gradient   – CSS gradient string for icon box (default: indigo-purple)
 *  glowColor  – rgba string for icon glow shadow (default: indigo)
 *  subtitle   – optional small line below value
 */
const SummaryCard = ({
    title,
    value,
    icon,
    gradient = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    glowColor = 'rgba(99,102,241,0.35)',
    subtitle,
    // Legacy props – kept for back-compat but ignored
    color, bgColor, colorConfig,
}) => {
    return (
        <Box sx={{
            borderRadius: '20px',
            border: '1px solid',
            borderColor: 'divider',
            background: theme =>
                theme.palette.mode === 'dark'
                    ? 'linear-gradient(145deg, rgba(30,30,46,0.9) 0%, rgba(22,22,35,0.9) 100%)'
                    : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            backdropFilter: 'blur(12px)',
            p: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2.5,
            boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
            transition: 'box-shadow 0.25s, transform 0.25s',
            '&:hover': {
                boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
                transform: 'translateY(-2px)',
            },
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Subtle background glow blob */}
            <Box sx={{
                position: 'absolute',
                top: -30,
                right: -30,
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: glowColor,
                filter: 'blur(40px)',
                opacity: 0.25,
                pointerEvents: 'none',
            }} />

            {/* Icon */}
            <Box sx={{
                width: 56,
                height: 56,
                borderRadius: '16px',
                background: gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 6px 18px ${glowColor}`,
                flexShrink: 0,
                '& svg': { fontSize: 26, color: 'white' },
            }}>
                {icon}
            </Box>

            {/* Text */}
            <Box>
                <Typography
                    variant="caption"
                    fontWeight={600}
                    letterSpacing={0.8}
                    sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.68rem' }}
                >
                    {title}
                </Typography>
                <Typography
                    variant="h5"
                    fontWeight={800}
                    letterSpacing={-0.5}
                    sx={{ lineHeight: 1.2, mt: 0.25 }}
                >
                    {value}
                </Typography>
                {subtitle && (
                    <Typography variant="caption" color="text.disabled" sx={{ mt: 0.25 }}>
                        {subtitle}
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default SummaryCard;

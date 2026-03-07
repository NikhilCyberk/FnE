import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { Visibility, VisibilityOff, WifiRounded } from '@mui/icons-material';

const getCardStyle = (cardType) => {
    switch (cardType?.toLowerCase()) {
        case 'visa':
            return {
                bg: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #3b82f6 100%)',
                logo: 'VISA',
            };
        case 'mastercard':
            return {
                bg: 'linear-gradient(135deg, #450a0a 0%, #b91c1c 50%, #f97316 100%)',
                logo: 'Mastercard',
            };
        case 'amex':
            return {
                bg: 'linear-gradient(135deg, #022c22 0%, #047857 50%, #10b981 100%)',
                logo: 'AMEX',
            };
        case 'rupay':
            return {
                bg: 'linear-gradient(135deg, #14532d 0%, #16a34a 50%, #4ade80 100%)',
                logo: 'RuPay',
            };
        case 'discover':
            return {
                bg: 'linear-gradient(135deg, #4d2300 0%, #b45309 50%, #f59e0b 100%)',
                logo: 'Discover',
            };
        default:
            return {
                bg: 'linear-gradient(135deg, #18181b 0%, #3f3f46 50%, #71717a 100%)',
                logo: 'Credit Card',
            };
    }
};

const ChipIcon = () => (
    <svg width="36" height="26" viewBox="0 0 36 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0.5" y="0.5" width="35" height="25" rx="5.5" fill="url(#paint0_linear)" stroke="#DBA354" />
        <path d="M6 13H30M14 1V25M22 1V25M6 8H14M22 8H30M6 18H14M22 18H30" stroke="#DBA354" strokeWidth="1.2" />
        <defs>
            <linearGradient id="paint0_linear" x1="0" y1="0" x2="36" y2="26" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FDE68A" />
                <stop offset="1" stopColor="#D97706" />
            </linearGradient>
        </defs>
    </svg>
);

const CreditCardVisual = ({ card, showBalances, setShowBalances, height = 210 }) => {
    const isLarge = height > 200;
    const style = getCardStyle(card.cardType);

    return (
        <Box
            sx={{
                position: 'relative',
                height: height,
                background: style.bg,
                p: isLarge ? 3 : 2,
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderRadius: '16px',
                boxShadow: '0 10px 30px -10px rgba(0,0,0,0.8)',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-2px) rotateX(2deg) rotateY(1deg)',
                    boxShadow: '0 14px 40px -12px rgba(0,0,0,0.9)',
                },
                // Diagonal light reflection
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: '-50%', left: '-50%', width: '200%', height: '200%',
                    background: 'linear-gradient(to bottom right, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 100%)',
                    transform: 'rotate(-25deg)',
                    pointerEvents: 'none',
                }
            }}
        >
            {/* Top row */}
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" position="relative" zIndex={1}>
                <Typography
                    variant={isLarge ? "h6" : "subtitle2"}
                    sx={{
                        fontWeight: 900,
                        letterSpacing: 2,
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        fontStyle: 'italic',
                        opacity: 0.95
                    }}
                >
                    {style.logo}
                </Typography>

                <IconButton
                    size="small"
                    onClick={() => setShowBalances(!showBalances)}
                    sx={{
                        color: 'white',
                        bgcolor: 'rgba(0,0,0,0.2)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.4)' },
                    }}
                >
                    {showBalances ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </IconButton>
            </Box>

            {/* Chip & Contactless */}
            <Box display="flex" justifyContent="space-between" alignItems="center" position="relative" zIndex={1} mt={isLarge ? 0 : 1} mb={isLarge ? 1 : 0}>
                <ChipIcon />
                <WifiRounded sx={{ transform: 'rotate(90deg)', opacity: 0.7, fontSize: 32 }} />
            </Box>

            {/* Card Number */}
            <Box position="relative" zIndex={1} mb={isLarge ? 1 : 0} flexGrow={1} display="flex" alignItems="center">
                <Typography
                    variant={isLarge ? "h5" : "h6"}
                    sx={{
                        letterSpacing: isLarge ? 5 : 2,
                        fontFamily: '"SF Mono", "Roboto Mono", monospace',
                        textShadow: '0 2px 4px rgba(0,0,0,0.6)',
                        width: '100%',
                        mt: 1,
                        opacity: 0.95,
                    }}
                >
                    {showBalances
                        ? (card.cardNumber ? card.cardNumber.replace(/(\d{4})/g, '$1 ').trim() : '**** **** **** ****')
                        : '•••• •••• •••• ••••'}
                </Typography>
            </Box>

            {/* Bottom Row */}
            <Box display="flex" justifyContent="space-between" alignItems="flex-end" position="relative" zIndex={1}>
                <Box>
                    <Typography variant="caption" sx={{ opacity: 0.6, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 1 }}>
                        Cardholder
                    </Typography>
                    <Typography variant={isLarge ? "subtitle2" : "body2"} fontWeight="600" sx={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {card.cardName || 'Valued Member'}
                    </Typography>
                </Box>
                <Box textAlign="right">
                    <Typography variant="caption" sx={{ opacity: 0.6, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 1 }}>
                        Issuer
                    </Typography>
                    <Typography variant={isLarge ? "subtitle2" : "body2"} fontWeight="600" sx={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                        {card.bankName || card.issuer || 'Bank'}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default CreditCardVisual;

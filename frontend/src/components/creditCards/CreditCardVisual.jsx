import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const getCardColor = (cardType) => {
    switch (cardType?.toLowerCase()) {
        case 'visa':
            return 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)';
        case 'mastercard':
            return 'linear-gradient(135deg, #EF4444 0%, #F97316 100%)';
        case 'amex':
            return 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)';
        default:
            return 'linear-gradient(135deg, #4B5563 0%, #1F2937 100%)';
    }
};

const getCardLogo = (cardType) => {
    switch (cardType?.toLowerCase()) {
        case 'visa': return 'VISA';
        case 'mastercard': return 'MC';
        case 'amex': return 'AMEX';
        default: return 'CC';
    }
};

const CreditCardVisual = ({ card, showBalances, setShowBalances, height = 190 }) => {
    return (
        <Box
            sx={{
                height: height,
                background: getCardColor(card.cardType),
                p: 3,
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderRadius: height > 200 ? 4 : 0,
                boxShadow: height > 200 ? 3 : 0
            }}
        >
            <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2" sx={{ opacity: 0.8, fontWeight: 'bold' }}>
                    {getCardLogo(card.cardType)}
                </Typography>
                <IconButton
                    size="small"
                    onClick={() => setShowBalances(!showBalances)}
                    sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                >
                    {showBalances ? <VisibilityOff fontSize={height > 200 ? "medium" : "small"} /> : <Visibility fontSize={height > 200 ? "medium" : "small"} />}
                </IconButton>
            </Box>

            <Box>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>Card Number</Typography>
                <Typography variant={height > 200 ? "h5" : "h6"} sx={{ letterSpacing: height > 200 ? 3 : 2, fontFamily: 'monospace', mt: height > 200 ? 0.5 : 0 }}>
                    {showBalances ? card.cardNumber?.replace(/(\d{4})/g, '$1 ').trim() : '•••• •••• •••• ••••'}
                </Typography>
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="flex-end">
                <Box>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>Cardholder</Typography>
                    <Typography variant={height > 200 ? "subtitle2" : "body2"} fontWeight="medium">{card.cardName || 'Card Holder'}</Typography>
                </Box>
                <Box textAlign="right">
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>Bank</Typography>
                    <Typography variant={height > 200 ? "subtitle2" : "body2"} fontWeight="medium">{card.bankName || 'Bank'}</Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default CreditCardVisual;

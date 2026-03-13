import React from 'react';
import { Box, Typography } from '@mui/material';
import { AccountBalanceWallet } from '@mui/icons-material';
import WidgetCard from './WidgetCard';

// Compact ₹ formatter shared across widget
const fmt = (n) => {
    if (Math.abs(n) >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`;
    if (Math.abs(n) >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`;
    return `₹${n.toLocaleString('en-IN')}`;
};

/**
 * DashboardAccountsWidget
 *
 * Props:
 *   accounts – array of account objects
 */
const DashboardAccountsWidget = ({ accounts }) => (
    <WidgetCard title="My Accounts" icon={<AccountBalanceWallet />} accent="#10b981" linkTo="/accounts">
        {accounts.length === 0 ? (
            <Box sx={{ py: 3, textAlign: 'center' }}>
                <AccountBalanceWallet sx={{ fontSize: 36, color: 'text.disabled', opacity: 0.4, mb: 1 }} />
                <Typography variant="body2" color="text.secondary">No accounts linked</Typography>
            </Box>
        ) : (
            <Box>
                {accounts.slice(0, 5).map((account, i) => (
                    <Box key={account.id || i} sx={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        py: 1.1, borderBottom: '1px solid', borderColor: 'divider',
                    }}>
                        {/* Icon + name */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                            <Box sx={{
                                width: 32, height: 32, borderRadius: '9px',
                                background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                '& svg': { fontSize: 16, color: 'white' },
                                flexShrink: 0,
                            }}>
                                <AccountBalanceWallet />
                            </Box>
                            <Box>
                                <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 140 }}>
                                    {account.accountName || account.account_name || account.name || 'Account'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {account.accountType || account.account_type || account.type || '—'}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Balance */}
                        <Typography
                            variant="body2" fontWeight={800}
                            sx={{ color: Number(account.balance) >= 0 ? 'text.primary' : '#f87171' }}
                        >
                            {fmt(Number(account.balance) || 0)}
                        </Typography>
                    </Box>
                ))}
            </Box>
        )}
    </WidgetCard>
);

export default DashboardAccountsWidget;

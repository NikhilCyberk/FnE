import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Box, Avatar, Divider,
} from '@mui/material';
import { WarningAmberRounded } from '@mui/icons-material';

const DeleteAccountDialog = ({ open, account, onClose, onConfirm }) => {
    const name = account?.account_name || account?.accountName || 'this account';

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle fontWeight="bold" sx={{ pb: 1 }}>Delete Account</DialogTitle>
            <Divider />
            <DialogContent>
                <Box display="flex" flexDirection="column" alignItems="center" gap={2} py={1}>
                    <Avatar sx={{ width: 64, height: 64, bgcolor: 'error.light' }}>
                        <WarningAmberRounded sx={{ color: 'error.dark', fontSize: 36 }} />
                    </Avatar>
                    <Typography variant="body1" textAlign="center">
                        Are you sure you want to delete <strong>{name}</strong>? This action cannot be undone.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                        Note: Accounts with existing transactions cannot be deleted. You must remove all related transactions first.
                    </Typography>
                </Box>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button
                    variant="contained" color="error" onClick={onConfirm}
                    sx={{ borderRadius: 2, minWidth: 100 }}
                >
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DeleteAccountDialog;

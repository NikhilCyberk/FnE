import React, { useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Divider, Box, Typography,
    Grid, Alert, CircularProgress
} from '@mui/material';
import { contactsAPI } from '../../api';
import { useForm, useAsyncState } from '../../hooks';

const DEFAULTS = {
    name: '',
    phone: '',
    email: '',
    notes: ''
};

const AddContactDialog = ({ open, onClose, onSuccess, contact }) => {
    const isEdit = !!(contact && contact.id);
    const { form, set, reset, updateForm } = useForm(DEFAULTS);
    const { loading, error, setError, setLoading } = useAsyncState(null);

    useEffect(() => {
        if (!open) return;
        setError(null);

        if (isEdit && contact) {
            updateForm({
                name: contact.name || '',
                phone: contact.phone || '',
                email: contact.email || '',
                notes: contact.notes || ''
            });
        } else {
            reset();
        }
    }, [open, contact, isEdit]);

    const handleSubmit = async () => {
        if (!form.name) {
            return setError('Name is required.');
        }

        setLoading(true);
        setError('');

        try {
            if (isEdit) {
                await contactsAPI.update(contact.id, form);
            } else {
                await contactsAPI.create(form);
            }
            onSuccess?.(`Contact ${isEdit ? 'updated' : 'added'} successfully!`);
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || `Failed to ${isEdit ? 'update' : 'add'} contact.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{ sx: { borderRadius: '20px' } }}
        >
            <DialogTitle sx={{ pb: 1 }} component="div">
                <Typography variant="h6" fontWeight={800} letterSpacing={-0.3}>
                    {isEdit ? 'Edit Contact' : 'Add New Contact'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {isEdit ? 'Update the details for this contact.' : 'Enter the details for the new contact.'}
                </Typography>
            </DialogTitle>
            <Divider />

            <DialogContent sx={{ pt: 2.5 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
                )}

                <Box display="flex" flexDirection="column" gap={2.5}>
                    <TextField
                        fullWidth size="small" label="Name"
                        placeholder="Full Name"
                        required
                        value={form.name} onChange={set('name')}
                    />

                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth size="small" label="Phone"
                                placeholder="+91 ..."
                                value={form.phone} onChange={set('phone')}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth size="small" label="Email"
                                placeholder="example@mail.com"
                                value={form.email} onChange={set('email')}
                            />
                        </Grid>
                    </Grid>

                    <TextField
                        fullWidth size="small" multiline rows={3} label="Notes"
                        placeholder="Additional information..."
                        value={form.notes} onChange={set('notes')}
                    />
                </Box>
            </DialogContent>

            <Divider />
            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} color="inherit" disabled={loading}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
                    sx={{
                        borderRadius: '10px', px: 3, fontWeight: 700,
                        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                        boxShadow: '0 4px 12px rgba(79,70,229,0.35)',
                    }}
                >
                    {loading ? 'Saving…' : isEdit ? 'Update Contact' : 'Add Contact'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddContactDialog;

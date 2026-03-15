import React, { useEffect, useState } from 'react';
import { 
    Box, Typography, Grid, Card, CardContent, Avatar, 
    Button, IconButton, Divider, Chip, Skeleton, 
    TextField, InputAdornment, Drawer, Menu, MenuItem, ListItemIcon, ListItemText,
    Snackbar, Alert
} from '@mui/material';
import { 
    Search, PersonAdd, Phone, Email, MoreVert, 
    History, TrendingUp, TrendingDown, PeopleAlt,
    Close, Edit, Delete
} from '@mui/icons-material';
import { contactsAPI, debtsAPI, transactionsAPI } from '../api';
import { useAsyncState } from '../hooks';
import TransactionTable from '../components/transactions/TransactionTable';
import AddContactDialog from '../components/contacts/AddContactDialog';

const fmt = (val) => `₹${(Math.abs(val) || 0).toLocaleString('en-IN')}`;

const ContactsPage = () => {
    const { data: contactsData, loading: loadingContacts, execute: fetchContacts } = useAsyncState([]);
    const { data: summary, loading: loadingSummary, execute: fetchSummary } = useAsyncState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedContact, setSelectedContact] = useState(null);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [contactTxs, setContactTxs] = useState([]);
    const [loadingTxs, setLoadingTxs] = useState(false);
    
    const [showAddModal, setShowAddModal] = useState(false);
    const [editContact, setEditContact] = useState(null);
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [menuContact, setMenuContact] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        fetchContacts(() => contactsAPI.getAll());
        fetchSummary(() => debtsAPI.getSummary());
    }, []);

    const contacts = (contactsData.contacts || []).map(c => {
        const debtInfo = (summary?.byContact || []).find(d => d.contact_id === c.id);
        return { ...c, ...debtInfo };
    });

    const filtered = contacts.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleViewHistory = async (contact) => {
        setSelectedContact(contact);
        setHistoryOpen(true);
        setLoadingTxs(true);
        try {
            const res = await transactionsAPI.getAll({ limit: 100 });
            const txs = (res.data?.transactions || res.data || []).filter(t => t.contact_id === contact.id);
            setContactTxs(txs);
        } catch (err) {
            console.error('Failed to fetch contact transactions', err);
        } finally {
            setLoadingTxs(false);
        }
    };

    const handleMenuOpen = (event, contact) => {
        setMenuAnchor(event.currentTarget);
        setMenuContact(contact);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
        setMenuContact(null);
    };

    const handleEdit = () => {
        setEditContact(menuContact);
        setShowAddModal(true);
        handleMenuClose();
    };

    const handleDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete ${menuContact.name}? This will not delete their transactions.`)) return;
        try {
            await contactsAPI.delete(menuContact.id);
            setSnackbar({ open: true, message: 'Contact deleted successfully!', severity: 'success' });
            fetchContacts(() => contactsAPI.getAll());
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to delete contact.', severity: 'error' });
        } finally {
            handleMenuClose();
        }
    };

    const handleSuccess = (msg) => {
        setSnackbar({ open: true, message: msg, severity: 'success' });
        fetchContacts(() => contactsAPI.getAll());
        fetchSummary(() => debtsAPI.getSummary());
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography 
                        variant="h4" fontWeight={900} letterSpacing={-1.5}
                        sx={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #4f46e5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                    >
                        Contacts
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Manage people you borrow from or lend to</Typography>
                </Box>
                <Button 
                    variant="contained" startIcon={<PersonAdd />}
                    onClick={() => { setEditContact(null); setShowAddModal(true); }}
                    sx={{ 
                        borderRadius: '12px', px: 3, fontWeight: 700,
                        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                        boxShadow: '0 4px 14px rgba(79,70,229,0.3)',
                    }}
                >
                    Add Contact
                </Button>
            </Box>

            <TextField
                fullWidth variant="outlined" placeholder="Search contacts by name, phone or email..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 4, '& .MuiOutlinedInput-root': { borderRadius: '15px', bgcolor: 'background.paper' } }}
                InputProps={{
                    startAdornment: <InputAdornment position="start"><Search color="primary" /></InputAdornment>
                }}
            />

            {loadingContacts || loadingSummary ? (
                <Grid container spacing={3}>
                    {[1,2,3].map(i => <Grid item xs={12} md={4} key={i}><Skeleton variant="rectangular" height={220} sx={{ borderRadius: '20px' }} /></Grid>)}
                </Grid>
            ) : filtered.length === 0 ? (
                <Box py={10} textAlign="center">
                    <PeopleAlt sx={{ fontSize: 80, color: 'action.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">No contacts found</Typography>
                    <Typography variant="body2" color="text.disabled">Try adding a new contact or checking your P2P transactions</Typography>
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {filtered.map(contact => (
                        <Grid item xs={12} md={4} key={contact.id}>
                            <Card sx={{ 
                                borderRadius: '24px', 
                                border: '1px solid', borderColor: 'divider',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                                '&:hover': { boxShadow: '0 20px 40px rgba(0,0,0,0.08)', transform: 'translateY(-6px)' }
                            }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
                                        <Avatar sx={{ 
                                            width: 52, height: 52, 
                                            background: 'linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)', 
                                            fontSize: '1.2rem', fontWeight: 800,
                                            boxShadow: '0 4px 10px rgba(79,70,229,0.3)'
                                        }}>
                                            {contact.name[0]}
                                        </Avatar>
                                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, contact)}><MoreVert /></IconButton>
                                    </Box>
                                    <Typography variant="h6" fontWeight={800} letterSpacing={-0.3}>{contact.name}</Typography>
                                    <Box display="flex" alignItems="center" gap={1.5} color="text.secondary" mt={0.5} mb={3}>
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <Phone sx={{ fontSize: 13 }} />
                                            <Typography variant="caption" fontWeight={600}>{contact.phone || 'No phone'}</Typography>
                                        </Box>
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <Email sx={{ fontSize: 13 }} />
                                            <Typography variant="caption" fontWeight={600}>{contact.email ? 'Email available' : 'No email'}</Typography>
                                        </Box>
                                    </Box>
                                    
                                    <Box sx={{ 
                                        p: 2, borderRadius: '18px', 
                                        bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                                        border: '1px solid', borderColor: 'divider'
                                    }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Box>
                                                <Typography variant="caption" color="text.disabled" fontWeight={800} sx={{ textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: 0.5 }}>Net Balance</Typography>
                                                <Typography variant="h6" fontWeight={900} color={(contact.netBalance || 0) >= 0 ? "success.main" : "error.main"}>
                                                    {(contact.netBalance || 0) >= 0 ? '+' : '−'} {fmt(contact.netBalance || 0)}
                                                </Typography>
                                            </Box>
                                            <Button 
                                                size="small" variant="contained"
                                                onClick={() => handleViewHistory(contact)}
                                                sx={{ 
                                                    borderRadius: '10px', textTransform: 'none', fontWeight: 700,
                                                    bgcolor: 'background.paper', color: 'text.primary',
                                                    '&:hover': { bgcolor: 'action.hover' },
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                                    border: '1px solid', borderColor: 'divider'
                                                }}
                                            >
                                                History
                                            </Button>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Drawer
                anchor="right" open={historyOpen} onClose={() => setHistoryOpen(false)}
                PaperProps={{ sx: { width: { xs: '100%', md: '50%' }, p: 0, borderRadius: { md: '24px 0 0 24px' } } }}
            >
                {selectedContact && (
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ p: 4, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box display="flex" alignItems="center" gap={2}>
                                <Avatar sx={{ width: 64, height: 64, background: 'linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)', fontWeight: 800 }}>
                                    {selectedContact.name[0]}
                                </Avatar>
                                <Box>
                                    <Typography variant="h5" fontWeight={900} letterSpacing={-0.5}>{selectedContact.name}</Typography>
                                    <Typography variant="body2" color="text.secondary">Debt Visibility & History</Typography>
                                </Box>
                            </Box>
                            <IconButton onClick={() => setHistoryOpen(false)} sx={{ bgcolor: 'action.hover' }}><Close /></IconButton>
                        </Box>

                        <Box sx={{ p: 4, pt: 0, flexGrow: 1, overflowY: 'auto' }}>
                            <Grid container spacing={2} mb={4}>
                                <Grid item xs={6}>
                                    <Box sx={{ p: 2, borderRadius: '20px', bgcolor: 'success.lighter', border: '1px solid', borderColor: 'success.light' }}>
                                        <Typography variant="caption" color="success.dark" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <TrendingUp sx={{ fontSize: 14 }} /> OWED TO YOU
                                        </Typography>
                                        <Typography variant="h5" fontWeight={900} color="success.main">{fmt(selectedContact.totalLent || 0)}</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box sx={{ p: 2, borderRadius: '20px', bgcolor: 'error.lighter', border: '1px solid', borderColor: 'error.light' }}>
                                        <Typography variant="caption" color="error.dark" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <TrendingDown sx={{ fontSize: 14 }} /> YOU OWE
                                        </Typography>
                                        <Typography variant="h5" fontWeight={900} color="error.main">{fmt(selectedContact.totalBorrowed || 0)}</Typography>
                                    </Box>
                                </Grid>
                            </Grid>

                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6" fontWeight={800} letterSpacing={-0.3}>All Related Transactions</Typography>
                                <Chip label={`${contactTxs.length} items`} size="small" sx={{ fontWeight: 700 }} />
                            </Box>

                            {loadingTxs ? (
                                <Box display="flex" justifyContent="center" py={10}><Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: '20px' }} /></Box>
                            ) : contactTxs.length === 0 ? (
                                <Box py={8} textAlign="center" sx={{ bgcolor: 'action.hover', borderRadius: '20px' }}>
                                    <History sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.5, mb: 1 }} />
                                    <Typography variant="body2" color="text.secondary">No transactions found with this contact</Typography>
                                </Box>
                            ) : (
                                <TransactionTable 
                                    filteredTransactions={contactTxs} 
                                    onSuccess={() => {
                                        // Refresh
                                        handleViewHistory(selectedContact);
                                        fetchSummary(() => debtsAPI.getSummary());
                                    }}
                                />
                            )}
                        </Box>
                    </Box>
                )}
            </Drawer>

            <AddContactDialog
                open={showAddModal}
                contact={editContact}
                onClose={() => { setShowAddModal(false); setEditContact(null); }}
                onSuccess={handleSuccess}
            />

            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
                PaperProps={{ sx: { borderRadius: '12px', minWidth: 160, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' } }}
            >
                <MenuItem onClick={handleEdit}>
                    <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Edit Contact" />
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                    <ListItemIcon><Delete fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
                    <ListItemText primary="Delete Contact" />
                </MenuItem>
            </Menu>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} sx={{ borderRadius: '12px', fontWeight: 600 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ContactsPage;

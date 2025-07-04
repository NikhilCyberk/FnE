import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBudgets } from '../slices/budgetsSlice';
import { Box, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, CircularProgress, TableSortLabel, TextField, InputAdornment, TablePagination } from '@mui/material';

const BudgetsPage = () => {
  const dispatch = useDispatch();
  const { items: budgets = [], loading, error } = useSelector((state) => state.budgets || {});
  const [order, setOrder] = React.useState('asc');
  const [orderBy, setOrderBy] = React.useState('name');
  const [filter, setFilter] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  useEffect(() => {
    dispatch(fetchBudgets());
  }, [dispatch]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    setPage(0);
  };

  function descendingComparator(a, b, orderBy) {
    if (b[orderBy] < a[orderBy]) return -1;
    if (b[orderBy] > a[orderBy]) return 1;
    return 0;
  }

  function getComparator(order, orderBy) {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  }

  function applySortFilter(array, comparator, filter) {
    const stabilized = array.map((el, idx) => [el, idx]);
    stabilized.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    });
    let filtered = stabilized.map((el) => el[0]);
    if (filter) {
      filtered = filtered.filter((budget) =>
        budget.name?.toLowerCase().includes(filter.toLowerCase())
      );
    }
    return filtered;
  }

  // Defensive: ensure budgets is always an array
  const safeBudgets = Array.isArray(budgets) ? budgets : [];
  const sortedFilteredBudgets = applySortFilter(safeBudgets, getComparator(order, orderBy), filter);
  const paginatedBudgets = sortedFilteredBudgets.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <Typography variant="h4" mb={3} fontWeight={700} color="primary.main">Budgets</Typography>
      <Box mb={2} display="flex" gap={2} alignItems="center">
        <TextField
          label="Filter by Name"
          value={filter}
          onChange={handleFilterChange}
          InputProps={{
            startAdornment: <InputAdornment position="start">🔍</InputAdornment>,
          }}
          size="small"
          sx={{ width: 300 }}
        />
      </Box>
      {loading ? <CircularProgress /> : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 3, maxHeight: 520 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sortDirection={orderBy === 'name' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'name'}
                    direction={orderBy === 'name' ? order : 'asc'}
                    onClick={() => handleRequestSort('name')}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={orderBy === 'total_amount' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'total_amount'}
                    direction={orderBy === 'total_amount' ? order : 'asc'}
                    onClick={() => handleRequestSort('total_amount')}
                  >
                    Total Amount
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={orderBy === 'spent_amount' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'spent_amount'}
                    direction={orderBy === 'spent_amount' ? order : 'asc'}
                    onClick={() => handleRequestSort('spent_amount')}
                  >
                    Spent Amount
                  </TableSortLabel>
                </TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedBudgets.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center">No budgets found</TableCell></TableRow>
              ) : (
                paginatedBudgets.map((budget, idx) => (
                  <TableRow key={budget.id} hover sx={{ backgroundColor: idx % 2 === 0 ? 'background.default' : 'action.hover', transition: 'background 0.3s' }}>
                    <TableCell>{budget.name || '-'}</TableCell>
                    <TableCell>₹{budget.total_amount || '-'}</TableCell>
                    <TableCell>₹{budget.spent_amount || '-'}</TableCell>
                    <TableCell>{budget.start_date || '-'}</TableCell>
                    <TableCell>{budget.end_date || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <TablePagination
        component="div"
        count={sortedFilteredBudgets.length}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[5, 10, 25, 50]}
        sx={{ mt: 1 }}
      />
      {error && <Typography color="error">{error}</Typography>}
    </Box>
  );
};

export default BudgetsPage; 
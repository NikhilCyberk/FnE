import React from 'react';
import { Box, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, TableSortLabel, InputAdornment, TextField, TablePagination } from '@mui/material';

const mockReports = [
  { id: 1, name: 'Monthly Spending', value: '₹12,000', period: 'May 2024', type: 'Spending' },
  { id: 2, name: 'Top Category', value: 'Groceries', period: 'May 2024', type: 'Category' },
  { id: 3, name: 'Income', value: '₹20,000', period: 'May 2024', type: 'Income' },
];

const ReportsPage = () => {
  // Replace mockReports with real data if available
  const reports = mockReports;

  const [order, setOrder] = React.useState('asc');
  const [orderBy, setOrderBy] = React.useState('name');
  const [filter, setFilter] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

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
      filtered = filtered.filter((report) =>
        report.name?.toLowerCase().includes(filter.toLowerCase()) ||
        report.type?.toLowerCase().includes(filter.toLowerCase())
      );
    }
    return filtered;
  }

  const sortedFilteredReports = applySortFilter(reports, getComparator(order, orderBy), filter);
  const paginatedReports = sortedFilteredReports.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <Typography variant="h4" mb={3} fontWeight={700} color="primary.main">Reports</Typography>
      <Box mb={2} display="flex" gap={2} alignItems="center">
        <TextField
          label="Filter by Name or Type"
          value={filter}
          onChange={handleFilterChange}
          InputProps={{
            startAdornment: <InputAdornment position="start">🔍</InputAdornment>,
          }}
          size="small"
          sx={{ width: 300 }}
        />
      </Box>
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
              <TableCell>Value</TableCell>
              <TableCell>Period</TableCell>
              <TableCell sortDirection={orderBy === 'type' ? order : false}>
                <TableSortLabel
                  active={orderBy === 'type'}
                  direction={orderBy === 'type' ? order : 'asc'}
                  onClick={() => handleRequestSort('type')}
                >
                  Type
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedReports.length === 0 ? (
              <TableRow><TableCell colSpan={4} align="center">No reports found</TableCell></TableRow>
            ) : (
              paginatedReports.map((report, idx) => (
                <TableRow key={report.id} hover sx={{ backgroundColor: idx % 2 === 0 ? 'background.default' : 'action.hover', transition: 'background 0.3s' }}>
                  <TableCell>{report.name}</TableCell>
                  <TableCell>{report.value}</TableCell>
                  <TableCell>{report.period}</TableCell>
                  <TableCell>{report.type}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={sortedFilteredReports.length}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[5, 10, 25, 50]}
        sx={{ mt: 1 }}
      />
    </Box>
  );
};

export default ReportsPage; 
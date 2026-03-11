import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  TablePagination,
  IconButton,
  Menu,
  MenuItem,
  Typography
} from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';

export const DataTable = ({ 
  columns, 
  data, 
  loading, 
  error, 
  emptyMessage = 'No data available',
  pagination,
  onPageChange,
  onRowsPerPageChange,
  actions = []
}) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [selectedRow, setSelectedRow] = React.useState(null);

  const handleMenuOpen = (event, row) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const handleActionClick = (action, row) => {
    action.onClick(row);
    handleMenuClose();
  };

  if (loading) {
    return (
      <TableContainer component={Paper}>
        <Box display="flex" justifyContent="center" p={4}>
          <Typography>Loading...</Typography>
        </Box>
      </TableContainer>
    );
  }

  if (error) {
    return (
      <TableContainer component={Paper}>
        <Box display="flex" justifyContent="center" p={4}>
          <Typography color="error">Error: {error}</Typography>
        </Box>
      </TableContainer>
    );
  }

  return (
    <Paper>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.id} sx={{ fontWeight: 600 }}>
                  {column.label}
                </TableCell>
              ))}
              {actions.length > 0 && <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (actions.length > 0 ? 1 : 0)} align="center">
                  <Typography color="text.secondary">{emptyMessage}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.id} hover>
                  {columns.map((column) => (
                    <TableCell key={column.id}>
                      {column.render ? column.render(row[column.id], row) : row[column.id]}
                    </TableCell>
                  ))}
                  {actions.length > 0 && (
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, row)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                      <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                      >
                        {actions.map((action, index) => (
                          <MenuItem
                            key={index}
                            onClick={() => handleActionClick(action, selectedRow)}
                            sx={{ color: action.color || 'inherit' }}
                          >
                            {action.icon && <action.icon sx={{ mr: 1, fontSize: 20 }} />}
                            {action.label}
                          </MenuItem>
                        ))}
                      </Menu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {pagination && (
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={pagination.total}
          rowsPerPage={pagination.limit}
          page={pagination.page - 1}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
        />
      )}
    </Paper>
  );
};

export const DataTableColumn = ({ id, label, render, sortable = false }) => ({
  id,
  label,
  render,
  sortable
});

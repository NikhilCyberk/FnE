import React from 'react';
import { Box, Typography, Button, Paper, Grid } from '@mui/material';
import { SectionHeader, EmptyState, ErrorState } from '../common/Layout';
import { DataTable } from '../common/Table';
import { ActionButton } from '../common/Form';

export const PageTemplate = ({ 
  title, 
  subtitle, 
  action, 
  children, 
  loading = false, 
  error = null 
}) => (
  <Box>
    <SectionHeader title={title} subtitle={subtitle} action={action} />
    {error && <ErrorState error={error} />}
    {loading ? (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography>Loading...</Typography>
      </Box>
    ) : (
      children
    )}
  </Box>
);

export const ListPageTemplate = ({ 
  title, 
  subtitle, 
  addAction, 
  columns, 
  data, 
  loading, 
  error, 
  emptyMessage, 
  emptyAction,
  actions = [],
  pagination,
  onPageChange 
}) => (
  <PageTemplate 
    title={title} 
    subtitle={subtitle} 
    action={addAction}
    loading={loading}
    error={error}
  >
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      error={error}
      emptyMessage={emptyMessage}
      pagination={pagination}
      onPageChange={onPageChange}
      actions={actions}
    />
  </PageTemplate>
);

export const DetailPageTemplate = ({ 
  title, 
  subtitle, 
  backAction, 
  children, 
  loading, 
  error 
}) => (
  <PageTemplate 
    title={title} 
    subtitle={subtitle} 
    action={backAction}
    loading={loading}
    error={error}
  >
    {children}
  </PageTemplate>
);

export const FormPageTemplate = ({ 
  title, 
  subtitle, 
  onSubmit, 
  onCancel, 
  children, 
  loading = false, 
  error = null,
  submitText = 'Save',
  cancelText = 'Cancel'
}) => (
  <Paper sx={{ p: 3 }}>
    <Typography variant="h6" gutterBottom>
      {title}
    </Typography>
    {subtitle && (
      <Typography variant="body2" color="text.secondary" mb={2}>
        {subtitle}
      </Typography>
    )}
    {error && <ErrorState error={error} />}
    <Box component="form" onSubmit={onSubmit}>
      <Grid container spacing={3}>
        {children}
      </Grid>
      <Box display="flex" gap={2} mt={3}>
        <ActionButton
          type="submit"
          loading={loading}
          variant="contained"
        >
          {submitText}
        </ActionButton>
        <ActionButton
          onClick={onCancel}
          variant="outlined"
          disabled={loading}
        >
          {cancelText}
        </ActionButton>
      </Box>
    </Box>
  </Paper>
);

export const DashboardCard = ({ title, value, subtitle, icon, color = 'primary' }) => (
  <Paper sx={{ p: 2, height: '100%' }}>
    <Box display="flex" alignItems="center" justifyContent="space-between">
      <Box>
        <Typography variant="h4" fontWeight={600} color={`${color}.main`}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {icon && (
        <Box color={`${color}.main`} opacity={0.3}>
          {icon}
        </Box>
      )}
    </Box>
  </Paper>
);

export const StatsGrid = ({ children, columns = { xs: 1, sm: 2, md: 4 } }) => (
  <Grid container spacing={3} mb={3}>
    {React.Children.map(children, (child, index) => (
      <Grid item {...columns} key={index}>
        {child}
      </Grid>
    ))}
  </Grid>
);

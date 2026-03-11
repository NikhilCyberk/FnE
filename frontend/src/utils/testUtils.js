import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '@mui/material/styles';
import lightTheme from '../src/theme';

// Test store factory
export const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = { user: null, token: null, isAuthenticated: false }) => state,
      accounts: (state = { accounts: [], loading: false, error: null }) => state,
      transactions: (state = { transactions: [], loading: false, error: null }) => state,
    },
    preloadedState: initialState,
  });
};

// Test wrapper component
export const TestWrapper = ({ children, store, initialEntries = ['/'] }) => {
  const testStore = store || createTestStore();
  
  return (
    <Provider store={testStore}>
      <BrowserRouter>
        <ThemeProvider theme={lightTheme}>
          {children}
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
};

// Custom render function
export const renderWithProviders = (
  ui,
  { store, initialEntries = '/', ...renderOptions } = {}
) => {
  function Wrapper({ children }) {
    return (
      <TestWrapper store={store} initialEntries={Array.isArray(initialEntries) ? initialEntries : [initialEntries]}>
        {children}
      </TestWrapper>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mock data factories
export const createMockAccount = (overrides = {}) => ({
  id: '1',
  name: 'Test Account',
  type: 'savings',
  balance: 1000,
  accountNumber: '1234567890',
  ...overrides,
});

export const createMockTransaction = (overrides = {}) => ({
  id: '1',
  description: 'Test Transaction',
  amount: 100,
  type: 'expense',
  date: '2024-01-01',
  categoryId: '1',
  accountId: '1',
  ...overrides,
});

export const createMockCreditCard = (overrides = {}) => ({
  id: '1',
  cardName: 'Test Card',
  cardNumberLastFour: '1234',
  limit: 5000,
  balance: 1000,
  ...overrides,
});

// Common test utilities
export const waitForLoadingToFinish = () => {
  return waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
};

export const expectErrorToBeInTheDocument = (errorMessage) => {
  expect(screen.getByText(errorMessage)).toBeInTheDocument();
};

export const expectSuccessMessageToBeInTheDocument = (message) => {
  expect(screen.getByText(message)).toBeInTheDocument();
};

// Form testing utilities
export const fillForm = async (fields) => {
  for (const [fieldName, value] of Object.entries(fields)) {
    const field = screen.getByLabelText(fieldName) || screen.getByPlaceholderText(fieldName);
    fireEvent.change(field, { target: { value } });
  }
};

export const submitForm = async (submitButtonText = 'Submit') => {
  const submitButton = screen.getByRole('button', { name: submitButtonText });
  fireEvent.click(submitButton);
};

// API mocking utilities
export const mockApiResponse = (data, status = 200) => {
  return Promise.resolve({
    ok: true,
    status,
    json: () => Promise.resolve(data),
  });
};

export const mockApiError = (message, status = 400) => {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ error: message }),
  });
};

// Redux testing utilities
export const createMockDispatch = () => {
  const dispatch = jest.fn();
  dispatch.mockReturnValue(Promise.resolve());
  return dispatch;
};

export const expectDispatchToHaveBeenCalledWith = (dispatch, action) => {
  expect(dispatch).toHaveBeenCalledWith(action);
};

// Component testing utilities
export const expectComponentToRender = (Component, props = {}) => {
  renderWithProviders(<Component {...props} />);
  expect(Component).toBeDefined();
};

export const expectButtonToBeDisabled = (buttonText) => {
  expect(screen.getByRole('button', { name: buttonText })).toBeDisabled();
};

export const expectButtonToBeEnabled = (buttonText) => {
  expect(screen.getByRole('button', { name: buttonText })).toBeEnabled();
};

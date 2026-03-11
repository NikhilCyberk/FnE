import { renderWithProviders, createMockAccount, fillForm, submitForm } from '../utils/testUtils';
import { createAccount } from '../store/features/accounts/accountsSlice';
import AddAccountDialog from '../components/accounts/AddAccountDialog';

// Mock the Redux slice
jest.mock('../store/features/accounts/accountsSlice', () => ({
  createAccount: jest.fn(),
}));

describe('AddAccountDialog', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the dialog when open', () => {
    renderWithProviders(<AddAccountDialog {...defaultProps} />);
    
    expect(screen.getByText('Add Account')).toBeInTheDocument();
    expect(screen.getByLabelText('Account Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Account Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Initial Balance')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    renderWithProviders(<AddAccountDialog {...defaultProps} open={false} />);
    
    expect(screen.queryByText('Add Account')).not.toBeInTheDocument();
  });

  it('should fill form fields correctly', async () => {
    renderWithProviders(<AddAccountDialog {...defaultProps} />);
    
    await fillForm({
      'Account Name': 'Test Savings Account',
      'Account Type': 'savings',
      'Initial Balance': '1000',
    });

    expect(screen.getByDisplayValue('Test Savings Account')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
  });

  it('should call createAccount when form is submitted', async () => {
    const mockDispatch = jest.fn();
    createAccount.mockReturnValue({ type: 'accounts/create', payload: createMockAccount() });
    
    renderWithProviders(<AddAccountDialog {...defaultProps} />, {
      store: createTestStore(),
    });

    await fillForm({
      'Account Name': 'Test Account',
      'Account Type': 'savings',
      'Initial Balance': '1000',
    });

    await submitForm('Add Account');

    expect(createAccount).toHaveBeenCalledWith({
      name: 'Test Account',
      type: 'savings',
      balance: 1000,
    });
  });

  it('should show validation errors for required fields', async () => {
    renderWithProviders(<AddAccountDialog {...defaultProps} />);

    await submitForm('Add Account');

    expect(screen.getByText('Account name is required')).toBeInTheDocument();
    expect(screen.getByText('Account type is required')).toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', () => {
    const mockOnClose = jest.fn();
    renderWithProviders(<AddAccountDialog {...defaultProps} onClose={mockOnClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onSuccess when account is created successfully', async () => {
    const mockOnSuccess = jest.fn();
    const mockAccount = createMockAccount();
    createAccount.mockResolvedValue({ payload: mockAccount });

    renderWithProviders(
      <AddAccountDialog {...defaultProps} onSuccess={mockOnSuccess} />
    );

    await fillForm({
      'Account Name': 'Test Account',
      'Account Type': 'savings',
      'Initial Balance': '1000',
    });

    await submitForm('Add Account');

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith('Account created successfully!');
    });
  });
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import TodaysLearning from '../topics/TodaysLearning';
import { createTopic } from '../../services/api';

// Mock the API service
jest.mock('../../services/api');

describe('TodaysLearning Component', () => {
  const mockUser = {
    id: 1,
    username: 'testuser'
  };

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <TodaysLearning />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    createTopic.mockClear();
  });

  test('renders form elements correctly', () => {
    renderComponent();
    
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add topic/i })).toBeInTheDocument();
  });

  test('handles form submission successfully', async () => {
    createTopic.mockResolvedValueOnce({ id: 1, title: 'Test Topic' });
    renderComponent();

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Topic' }
    });
    fireEvent.change(screen.getByLabelText(/content/i), {
      target: { value: 'Test Content' }
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /add topic/i }));

    // Check if API was called with correct data
    expect(createTopic).toHaveBeenCalledWith({
      title: 'Test Topic',
      content: 'Test Content'
    });

    // Check if success message is shown
    await waitFor(() => {
      expect(screen.getByText(/topic added successfully!/i)).toBeInTheDocument();
    });

    // Check if form is cleared
    expect(screen.getByLabelText(/title/i)).toHaveValue('');
    expect(screen.getByLabelText(/content/i)).toHaveValue('');
  });

  test('handles form submission error', async () => {
    createTopic.mockRejectedValueOnce(new Error('Failed to add topic'));
    renderComponent();

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Topic' }
    });
    fireEvent.change(screen.getByLabelText(/content/i), {
      target: { value: 'Test Content' }
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /add topic/i }));

    // Check if error message is shown
    await waitFor(() => {
      expect(screen.getByText(/failed to add topic/i)).toBeInTheDocument();
    });
  });

  test('validates required fields', async () => {
    renderComponent();
    
    // Try to submit without filling in the form
    fireEvent.click(screen.getByRole('button', { name: /add topic/i }));

    // Check if API was not called
    expect(createTopic).not.toHaveBeenCalled();

    // Check if form validation messages are shown
    expect(screen.getByLabelText(/title/i)).toBeInvalid();
    expect(screen.getByLabelText(/content/i)).toBeInvalid();
  });
}); 
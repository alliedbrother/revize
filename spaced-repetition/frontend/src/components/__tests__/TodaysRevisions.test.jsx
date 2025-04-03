import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import TodaysRevisions from '../revisions/TodaysRevisions';
import { getTodaysRevisions, completeRevision, postponeRevision } from '../../services/api';

// Mock the API service
jest.mock('../../services/api');

describe('TodaysRevisions Component', () => {
  const mockRevisions = [
    {
      id: 1,
      topic: {
        title: 'Test Topic 1'
      },
      day_number: 1
    },
    {
      id: 2,
      topic: {
        title: 'Test Topic 2'
      },
      day_number: 2
    }
  ];

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <TodaysRevisions />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    getTodaysRevisions.mockClear();
    completeRevision.mockClear();
    postponeRevision.mockClear();
  });

  test('renders loading state initially', () => {
    getTodaysRevisions.mockImplementation(() => new Promise(() => {}));
    renderComponent();
    expect(screen.getByText(/loading revisions/i)).toBeInTheDocument();
  });

  test('renders empty state when no revisions', async () => {
    getTodaysRevisions.mockResolvedValueOnce([]);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/no revisions scheduled for today/i)).toBeInTheDocument();
    });
  });

  test('renders revisions list correctly', async () => {
    getTodaysRevisions.mockResolvedValueOnce(mockRevisions);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Topic 1')).toBeInTheDocument();
      expect(screen.getByText('Test Topic 2')).toBeInTheDocument();
      expect(screen.getByText('Day 1 of revision schedule')).toBeInTheDocument();
      expect(screen.getByText('Day 2 of revision schedule')).toBeInTheDocument();
    });
  });

  test('handles complete revision successfully', async () => {
    getTodaysRevisions.mockResolvedValueOnce(mockRevisions);
    completeRevision.mockResolvedValueOnce({ success: true });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Topic 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText(/complete/i)[0]);

    expect(completeRevision).toHaveBeenCalledWith(1);
    await waitFor(() => {
      expect(screen.queryByText('Test Topic 1')).not.toBeInTheDocument();
    });
  });

  test('handles postpone revision successfully', async () => {
    getTodaysRevisions.mockResolvedValueOnce(mockRevisions);
    postponeRevision.mockResolvedValueOnce({ success: true });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Topic 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText(/postpone/i)[0]);

    expect(postponeRevision).toHaveBeenCalledWith(1);
    await waitFor(() => {
      expect(screen.queryByText('Test Topic 1')).not.toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    getTodaysRevisions.mockRejectedValueOnce(new Error('Failed to load revisions'));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/failed to load revisions/i)).toBeInTheDocument();
    });
  });

  test('handles complete revision error', async () => {
    getTodaysRevisions.mockResolvedValueOnce(mockRevisions);
    completeRevision.mockRejectedValueOnce(new Error('Failed to complete revision'));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Topic 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText(/complete/i)[0]);

    expect(completeRevision).toHaveBeenCalledWith(1);
    await waitFor(() => {
      expect(screen.getByText(/failed to complete revision/i)).toBeInTheDocument();
    });
  });

  test('handles postpone revision error', async () => {
    getTodaysRevisions.mockResolvedValueOnce(mockRevisions);
    postponeRevision.mockRejectedValueOnce(new Error('Failed to postpone revision'));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Topic 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText(/postpone/i)[0]);

    expect(postponeRevision).toHaveBeenCalledWith(1);
    await waitFor(() => {
      expect(screen.getByText(/failed to postpone revision/i)).toBeInTheDocument();
    });
  });
}); 
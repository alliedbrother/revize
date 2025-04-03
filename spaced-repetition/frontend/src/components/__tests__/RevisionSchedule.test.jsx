import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import RevisionSchedule from '../revisions/RevisionSchedule';
import { getRevisionSchedule } from '../../services/api';

// Mock the API service
jest.mock('../../services/api');

describe('RevisionSchedule Component', () => {
  const mockSchedule = [
    {
      id: 1,
      topic: {
        title: 'Test Topic 1'
      },
      scheduled_date: '2024-04-01',
      completed: false,
      postponed: false,
      day_number: 1
    },
    {
      id: 2,
      topic: {
        title: 'Test Topic 2'
      },
      scheduled_date: '2024-04-02',
      completed: true,
      postponed: false,
      day_number: 2
    },
    {
      id: 3,
      topic: {
        title: 'Test Topic 3'
      },
      scheduled_date: '2024-04-03',
      completed: false,
      postponed: true,
      day_number: 3
    }
  ];

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <RevisionSchedule />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    getRevisionSchedule.mockClear();
  });

  test('renders loading state initially', () => {
    getRevisionSchedule.mockImplementation(() => new Promise(() => {}));
    renderComponent();
    expect(screen.getByText(/loading schedule/i)).toBeInTheDocument();
  });

  test('renders empty state when no schedule', async () => {
    getRevisionSchedule.mockResolvedValueOnce([]);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/no topics in your revision schedule yet/i)).toBeInTheDocument();
    });
  });

  test('renders schedule table correctly', async () => {
    getRevisionSchedule.mockResolvedValueOnce(mockSchedule);
    renderComponent();

    await waitFor(() => {
      // Check table headers
      expect(screen.getByText(/topic/i)).toBeInTheDocument();
      expect(screen.getByText(/scheduled date/i)).toBeInTheDocument();
      expect(screen.getByText(/day number/i)).toBeInTheDocument();
      expect(screen.getByText(/status/i)).toBeInTheDocument();

      // Check topic titles
      expect(screen.getByText('Test Topic 1')).toBeInTheDocument();
      expect(screen.getByText('Test Topic 2')).toBeInTheDocument();
      expect(screen.getByText('Test Topic 3')).toBeInTheDocument();

      // Check day numbers
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();

      // Check status badges
      expect(screen.getByText(/pending/i)).toBeInTheDocument();
      expect(screen.getByText(/completed/i)).toBeInTheDocument();
      expect(screen.getByText(/postponed/i)).toBeInTheDocument();
    });
  });

  test('formats dates correctly', async () => {
    getRevisionSchedule.mockResolvedValueOnce(mockSchedule);
    renderComponent();

    await waitFor(() => {
      // Check if dates are formatted correctly
      expect(screen.getByText('4/1/2024')).toBeInTheDocument();
      expect(screen.getByText('4/2/2024')).toBeInTheDocument();
      expect(screen.getByText('4/3/2024')).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    getRevisionSchedule.mockRejectedValueOnce(new Error('Failed to load schedule'));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/failed to load schedule/i)).toBeInTheDocument();
    });
  });

  test('displays correct status badges', async () => {
    getRevisionSchedule.mockResolvedValueOnce(mockSchedule);
    renderComponent();

    await waitFor(() => {
      // Check status badges
      const badges = screen.getAllByRole('status');
      expect(badges).toHaveLength(3);
      expect(badges[0]).toHaveTextContent(/pending/i);
      expect(badges[1]).toHaveTextContent(/completed/i);
      expect(badges[2]).toHaveTextContent(/postponed/i);
    });
  });
}); 
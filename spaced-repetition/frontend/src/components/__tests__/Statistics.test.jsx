import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import Statistics from '../statistics/Statistics';
import { getStatistics } from '../../services/api';

// Mock the API service
jest.mock('../../services/api');

describe('Statistics Component', () => {
  const mockStats = {
    total_topics: 10,
    completed_revisions: 25,
    pending_revisions: 15,
    topics_this_week: 3,
    revisions_today: 2,
    average_daily_topics: 1.5,
    completion_rate: 62.5
  };

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <Statistics />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    getStatistics.mockClear();
  });

  test('renders loading state initially', () => {
    getStatistics.mockImplementation(() => new Promise(() => {}));
    renderComponent();
    expect(screen.getByText(/loading statistics/i)).toBeInTheDocument();
  });

  test('renders statistics correctly', async () => {
    getStatistics.mockResolvedValueOnce(mockStats);
    renderComponent();

    await waitFor(() => {
      // Check all statistics are displayed
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('1.5')).toBeInTheDocument();
      expect(screen.getByText('62.5%')).toBeInTheDocument();
    });
  });

  test('displays correct labels', async () => {
    getStatistics.mockResolvedValueOnce(mockStats);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/total topics/i)).toBeInTheDocument();
      expect(screen.getByText(/completed revisions/i)).toBeInTheDocument();
      expect(screen.getByText(/pending revisions/i)).toBeInTheDocument();
      expect(screen.getByText(/topics this week/i)).toBeInTheDocument();
      expect(screen.getByText(/revisions today/i)).toBeInTheDocument();
      expect(screen.getByText(/average daily topics/i)).toBeInTheDocument();
      expect(screen.getByText(/completion rate/i)).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    getStatistics.mockRejectedValueOnce(new Error('Failed to load statistics'));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/failed to load statistics/i)).toBeInTheDocument();
    });
  });

  test('displays progress bars correctly', async () => {
    getStatistics.mockResolvedValueOnce(mockStats);
    renderComponent();

    await waitFor(() => {
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars).toHaveLength(2); // One for completion rate, one for weekly progress
      
      // Check completion rate progress bar
      expect(progressBars[0]).toHaveAttribute('aria-valuenow', '62.5');
      
      // Check weekly progress progress bar
      expect(progressBars[1]).toHaveAttribute('aria-valuenow', '42.9'); // 3/7 days
    });
  });

  test('displays correct card icons', async () => {
    getStatistics.mockResolvedValueOnce(mockStats);
    renderComponent();

    await waitFor(() => {
      const icons = screen.getAllByRole('img');
      expect(icons).toHaveLength(7); // One icon for each statistic card
      
      // Check if icons have correct classes
      icons.forEach(icon => {
        expect(icon).toHaveClass('bi');
      });
    });
  });
}); 
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { login, register, logout } from '../../services/api';

// Mock the API service
jest.mock('../../services/api');

const TestComponent = () => {
  const { user, loading, login: authLogin, register: authRegister, logout: authLogout } = useAuth();
  return (
    <div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div>
          {user ? (
            <div>
              <div>Logged in as: {user.username}</div>
              <button onClick={authLogout}>Logout</button>
            </div>
          ) : (
            <div>
              <button onClick={() => authLogin('testuser', 'password')}>Login</button>
              <button onClick={() => authRegister('newuser', 'password', 'email@test.com')}>Register</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    login.mockClear();
    register.mockClear();
    logout.mockClear();
    localStorage.clear();
  });

  const renderWithAuth = () => {
    return render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
  };

  test('provides initial loading state', () => {
    renderWithAuth();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('handles successful login', async () => {
    const mockUser = { username: 'testuser', token: 'test-token' };
    login.mockResolvedValueOnce({ success: true, user: mockUser });
    
    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument();
    });

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByText('Logged in as: testuser')).toBeInTheDocument();
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
    });
  });

  test('handles successful registration', async () => {
    const mockUser = { username: 'newuser', token: 'test-token' };
    register.mockResolvedValueOnce({ success: true, user: mockUser });
    
    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText('Register')).toBeInTheDocument();
    });

    await act(async () => {
      screen.getByText('Register').click();
    });

    await waitFor(() => {
      expect(screen.getByText('Logged in as: newuser')).toBeInTheDocument();
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
    });
  });

  test('handles successful logout', async () => {
    // First login
    const mockUser = { username: 'testuser', token: 'test-token' };
    login.mockResolvedValueOnce({ success: true, user: mockUser });
    logout.mockResolvedValueOnce({ success: true });
    
    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument();
    });

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByText('Logged in as: testuser')).toBeInTheDocument();
    });

    // Then logout
    await act(async () => {
      screen.getByText('Logout').click();
    });

    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  test('handles login error', async () => {
    login.mockRejectedValueOnce(new Error('Invalid credentials'));
    
    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument();
    });

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  test('handles registration error', async () => {
    register.mockRejectedValueOnce(new Error('Username already exists'));
    
    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText('Register')).toBeInTheDocument();
    });

    await act(async () => {
      screen.getByText('Register').click();
    });

    await waitFor(() => {
      expect(screen.getByText('Register')).toBeInTheDocument();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  test('restores user from localStorage on mount', async () => {
    const mockUser = { username: 'testuser', token: 'test-token' };
    localStorage.setItem('user', JSON.stringify(mockUser));
    
    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText('Logged in as: testuser')).toBeInTheDocument();
    });
  });
}); 
import axios from 'axios';
import {
  login,
  register,
  logout,
  createTopic,
  getTopics,
  getTodaysRevisions,
  getRevisionSchedule,
  completeRevision,
  postponeRevision,
  getStatistics
} from '../api';

// Mock axios
jest.mock('axios');

describe('API Service', () => {
  const mockToken = 'test-token';
  const mockUser = { username: 'testuser', token: mockToken };

  beforeEach(() => {
    axios.create.mockReturnValue({
      get: jest.fn(),
      post: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn()
    });
    localStorage.clear();
  });

  describe('Authentication', () => {
    test('login makes correct API call', async () => {
      const mockResponse = { data: { success: true, user: mockUser } };
      axios.create().post.mockResolvedValueOnce(mockResponse);

      const result = await login('testuser', 'password');

      expect(axios.create().post).toHaveBeenCalledWith('/api/token/', {
        username: 'testuser',
        password: 'password'
      });
      expect(result).toEqual(mockResponse.data);
    });

    test('register makes correct API call', async () => {
      const mockResponse = { data: { success: true, user: mockUser } };
      axios.create().post.mockResolvedValueOnce(mockResponse);

      const result = await register('testuser', 'password', 'email@test.com');

      expect(axios.create().post).toHaveBeenCalledWith('/api/register/', {
        username: 'testuser',
        password: 'password',
        email: 'email@test.com'
      });
      expect(result).toEqual(mockResponse.data);
    });

    test('logout makes correct API call', async () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      const mockResponse = { data: { success: true } };
      axios.create().post.mockResolvedValueOnce(mockResponse);

      const result = await logout();

      expect(axios.create().post).toHaveBeenCalledWith('/api/logout/');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('Topics', () => {
    test('createTopic makes correct API call', async () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      const mockTopic = { title: 'Test Topic', content: 'Test Content' };
      const mockResponse = { data: { success: true, topic: mockTopic } };
      axios.create().post.mockResolvedValueOnce(mockResponse);

      const result = await createTopic(mockTopic);

      expect(axios.create().post).toHaveBeenCalledWith('/api/topics/', mockTopic);
      expect(result).toEqual(mockResponse.data);
    });

    test('getTopics makes correct API call', async () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      const mockTopics = [{ id: 1, title: 'Topic 1' }, { id: 2, title: 'Topic 2' }];
      const mockResponse = { data: mockTopics };
      axios.create().get.mockResolvedValueOnce(mockResponse);

      const result = await getTopics();

      expect(axios.create().get).toHaveBeenCalledWith('/api/topics/');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('Revisions', () => {
    test('getTodaysRevisions makes correct API call', async () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      const mockRevisions = [{ id: 1, topic: { title: 'Topic 1' } }];
      const mockResponse = { data: mockRevisions };
      axios.create().get.mockResolvedValueOnce(mockResponse);

      const result = await getTodaysRevisions();

      expect(axios.create().get).toHaveBeenCalledWith('/api/revisions/today/');
      expect(result).toEqual(mockResponse.data);
    });

    test('getRevisionSchedule makes correct API call', async () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      const mockSchedule = [{ id: 1, topic: { title: 'Topic 1' }, scheduled_date: '2024-04-01' }];
      const mockResponse = { data: mockSchedule };
      axios.create().get.mockResolvedValueOnce(mockResponse);

      const result = await getRevisionSchedule();

      expect(axios.create().get).toHaveBeenCalledWith('/api/revisions/schedule/');
      expect(result).toEqual(mockResponse.data);
    });

    test('completeRevision makes correct API call', async () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      const mockResponse = { data: { success: true } };
      axios.create().post.mockResolvedValueOnce(mockResponse);

      const result = await completeRevision(1);

      expect(axios.create().post).toHaveBeenCalledWith('/api/revisions/1/complete/');
      expect(result).toEqual(mockResponse.data);
    });

    test('postponeRevision makes correct API call', async () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      const mockResponse = { data: { success: true } };
      axios.create().post.mockResolvedValueOnce(mockResponse);

      const result = await postponeRevision(1);

      expect(axios.create().post).toHaveBeenCalledWith('/api/revisions/1/postpone/');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('Statistics', () => {
    test('getStatistics makes correct API call', async () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      const mockStats = {
        total_topics: 10,
        completed_revisions: 25,
        pending_revisions: 15
      };
      const mockResponse = { data: mockStats };
      axios.create().get.mockResolvedValueOnce(mockResponse);

      const result = await getStatistics();

      expect(axios.create().get).toHaveBeenCalledWith('/api/statistics/');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('Error Handling', () => {
    test('handles API errors correctly', async () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      const mockError = new Error('API Error');
      axios.create().get.mockRejectedValueOnce(mockError);

      await expect(getTopics()).rejects.toThrow('API Error');
    });

    test('handles network errors correctly', async () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      const mockError = new Error('Network Error');
      axios.create().get.mockRejectedValueOnce(mockError);

      await expect(getTopics()).rejects.toThrow('Network Error');
    });
  });

  describe('Authentication Headers', () => {
    test('includes auth token in requests when user is logged in', async () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      const mockResponse = { data: { success: true } };
      axios.create().get.mockResolvedValueOnce(mockResponse);

      await getTopics();

      expect(axios.create).toHaveBeenCalledWith({
        baseURL: expect.any(String),
        headers: {
          'Authorization': `Token ${mockToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    });

    test('does not include auth token in requests when user is not logged in', async () => {
      const mockResponse = { data: { success: true } };
      axios.create().get.mockResolvedValueOnce(mockResponse);

      await getTopics();

      expect(axios.create).toHaveBeenCalledWith({
        baseURL: expect.any(String),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    });
  });
}); 
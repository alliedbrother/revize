import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Server Time
export const getServerTime = async () => {
  const response = await api.get('/server-time/');
  return response.data;
};

// Topics
export const createTopic = async (topicData) => {
  const response = await api.post('/topics/', topicData);
  return response.data;
};

export const getAllTopics = async () => {
  const response = await api.get('/topics/');
  return response.data;
};

export const getTopic = async (id) => {
  const response = await api.get(`/topics/${id}/`);
  return response.data;
};

export const updateTopic = async (id, topicData) => {
  const response = await api.put(`/topics/${id}/`, topicData);
  return response.data;
};

export const deleteTopic = async (id) => {
  await api.delete(`/topics/${id}/`);
};

// Revisions
export const getTodaysRevisions = async () => {
  // We're using the server's endpoint which determines "today" based on server time
  // This avoids timezone discrepancies between client and server
  const response = await api.get('/revisions/today/');
  return response.data;
};

export const getMissedRevisions = async () => {
  const response = await api.get('/revisions/missed/');
  return response.data;
};

export const getRevisionSchedule = async () => {
  const response = await api.get('/revisions/schedule/');
  return response.data;
};

export const completeRevision = async (revisionId) => {
  const response = await api.post(`/revisions/${revisionId}/complete/`);
  return response.data;
};

export const postponeRevision = async (revisionId) => {
  const response = await api.post(`/revisions/${revisionId}/postpone/`);
  return response.data;
};

// Statistics
export const getStatistics = async () => {
  const response = await api.get('/statistics/');
  return response.data;
};

// Auth Service
export const authService = {
  login: async (credentials) => {
    const response = await api.post('/login/', credentials);
    return response.data;
  },
  
  register: async (userData) => {
    const response = await api.post('/register/', userData);
    return response.data;
  },
  
  logout: async () => {
    await api.post('/logout/');
  },
  
  changePassword: async (passwordData) => {
    const response = await api.post('/change-password/', passwordData);
    return response.data;
  }
};

// User Service
export const userService = {
  getProfile: async () => {
    const response = await api.get('/profile/');
    return response.data;
  },
  
  updateProfile: async (profileData) => {
    const response = await api.put('/profile/', profileData);
    return response.data;
  }
};

export default api; 
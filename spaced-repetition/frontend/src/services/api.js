import axios from 'axios';

const API_URL = 'http://localhost:8001/api/';

// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Authentication services
export const authService = {
  register: (userData) => apiClient.post('register/', userData),
  login: (credentials) => apiClient.post('login/', credentials),
};

// Topic services
export const topicService = {
  getAllTopics: () => apiClient.get('topics/'),
  getTopicById: (id) => apiClient.get(`topics/${id}/`),
  createTopic: (topicData) => apiClient.post('topics/', topicData),
  updateTopic: (id, topicData) => apiClient.put(`topics/${id}/`, topicData),
  deleteTopic: (id) => apiClient.delete(`topics/${id}/`),
};

// Revision services
export const revisionService = {
  getAllRevisions: (filters = {}) => {
    let url = 'revisions/';
    if (filters.date) {
      url += `?date=${filters.date}`;
    }
    if (filters.status) {
      url += filters.date ? `&status=${filters.status}` : `?status=${filters.status}`;
    }
    return apiClient.get(url);
  },
  // We no longer use the Today's Revisions feature
  // getTodayRevisions: () => apiClient.get('today-revisions/'),
  getRevisionById: (id) => apiClient.get(`revisions/${id}/`),
  updateRevision: (id, revisionData) => apiClient.put(`revisions/${id}/`, revisionData),
  completeRevision: (id) => apiClient.put(`revisions/${id}/`, { action: 'complete' }),
  postponeRevision: (id, days = 1) => apiClient.put(`revisions/${id}/`, { action: 'postpone', days }),
};

export default {
  auth: authService,
  topics: topicService,
  revisions: revisionService,
}; 
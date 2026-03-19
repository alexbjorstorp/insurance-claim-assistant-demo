import axios from 'axios';

// Empty string = relative URL, which works when frontend and backend
// are served from the same origin (Railway, packaged .exe, etc.).
// In local dev the Vite proxy forwards /api requests to localhost:8000.
const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  login: (username: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    return api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },
  getCurrentUser: () => api.get('/auth/me'),
};

// Cases API
export const casesAPI = {
  list: (params?: any) => api.get('/cases', { params }),
  search: (query: string, limit?: number) => api.get('/cases/search', { params: { q: query, limit } }),
  get: (id: number) => api.get(`/cases/${id}`),
  create: (data: any) => api.post('/cases', data),
  update: (id: number, data: any) => api.put(`/cases/${id}`, data),
  delete: (id: number) => api.delete(`/cases/${id}`),
};

// Signals API
export const signalsAPI = {
  list: (params?: any) => api.get('/signals', { params }),
  get: (id: number) => api.get(`/signals/${id}`),
  create: (data: any) => api.post('/signals', data),
  update: (id: number, data: any) => api.put(`/signals/${id}`, data),
  delete: (id: number) => api.delete(`/signals/${id}`),
  performAction: (id: number, action: { action_type: string; action_data?: any; action_notes?: string }) => 
    api.post(`/signals/${id}/action`, action),
  resolve: (id: number, notes?: string) => 
    api.post(`/signals/${id}/resolve`, null, { params: { notes } }),
};

// Timeline API
export const timelineAPI = {
  list: (caseId: number, params?: any) => 
    api.get('/timeline', { params: { case_id: caseId, ...params } }),
  create: (data: any) => api.post('/timeline', data),
};

// Behandelplan API
export const behandelplanAPI = {
  get: (caseId: number) => api.get(`/behandelplan/${caseId}`),
  create: (data: any) => api.post('/behandelplan', data),
  update: (caseId: number, data: any) => api.put(`/behandelplan/${caseId}`, data),
  generateSummaries: (caseId: number) => api.post(`/behandelplan/${caseId}/generate-summaries`),
  exportHtml: (caseId: number, darkMode: boolean = false) => 
    api.get(`/behandelplan/${caseId}/export-pdf?dark_mode=${darkMode}`, { responseType: 'text' }),
};

// Reserves API
export const reservesAPI = {
  list: (caseId: number, params?: any) => 
    api.get('/reserves', { params: { case_id: caseId, ...params } }),
  create: (data: any) => api.post('/reserves', data),
  get: (id: number) => api.get(`/reserves/${id}`),
};

// Comparable Cases API
export const comparableCasesAPI = {
  list: (caseId: number, params?: any) => 
    api.get('/comparable-cases', { params: { case_id: caseId, ...params } }),
  create: (data: any) => api.post('/comparable-cases', data),
  delete: (id: number) => api.delete(`/comparable-cases/${id}`),
};

// System API
export const systemAPI = {
  resetDemo: () => api.post('/system/reset-demo'),
};

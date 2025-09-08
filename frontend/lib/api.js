import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 429) {
      console.warn("Rate limited, retrying after 2s...");
      await new Promise(r => setTimeout(r, 2000));
      return api.request(error.config);
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', {
    empId: credentials.empId,
    password: credentials.password
  }),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Research API
export const researchAPI = {
  // CRUD operations
  create: (data) => api.post('/research', data),
  getAll: (params) => api.get('/research', { params }),
  getById: (id) => api.get(`/research/${id}`),
  update: (id, data) => api.put(`/research/${id}`, data),
  delete: (id) => api.delete(`/research/${id}`),
  
  // Status management
  updateStatus: (id, status, rejectionReason) => 
    api.put(`/research/${id}/status`, { status, rejectionReason }),
  
  // Statistics
  getStats: (params) => api.get('/research/stats/overview', { params }),
  
  // Pending research (admin/Incharge)
  getPending: (params) => api.get('/research/pending/all', { params }),
  
  // Attachments
  deleteAttachment: (researchId, attachmentId) => 
    api.delete(`/research/${researchId}/attachments/${attachmentId}`),
};

// Users API (admin only)
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  updateStatus: (id, isActive) => api.put(`/users/${id}/status`, { isActive }),
  getStats: () => api.get('/users/stats/overview'),
};

// Reports API
export const reportsAPI = {
  generate: (data) => api.post('/reports/generate', data),
  getByFaculty: (facultyId, params) => api.get(`/reports/faculty/${facultyId}`, { params }),
  getByDepartment: (department, params) => api.get(`/reports/department/${department}`, { params }),
  getSummary: (params) => api.get('/reports/summary', { params }),
  update: (id, data) => api.put(`/reports/${id}`, data),
  approve: (id, status, comments) => api.put(`/reports/${id}/approve`, { status, comments }),
  delete: (id) => api.delete(`/reports/${id}`),
  getStats: (params) => api.get('/reports/stats/overview', { params }),
};

// Upload API
export const uploadAPI = {
  uploadSingle: (file, type = 'general') => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/upload/single?type=${type}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  uploadMultiple: (files, type = 'general') => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return api.post(`/upload/multiple?type=${type}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  deleteFile: (filename, type = 'general') => 
    api.delete(`/upload/${filename}?type=${type}`),
  
  getFileInfo: (filename, type = 'general') => 
    api.get(`/upload/${filename}?type=${type}`),
  
  listFiles: (type, params) => api.get(`/upload/list/${type}`, { params }),
  
  downloadFile: (filename, type = 'general') => 
    api.get(`/upload/download/${filename}?type=${type}`, { responseType: 'blob' }),
};

// Faculty API
export const facultyAPI = {
  getDashboard: () => api.get('/faculty/dashboard'),
  getResearchByType: (type, params) => api.get(`/faculty/research/${type}`, { params }),
  getDepartmentOverview: (department, params) => api.get(`/faculty/department/${department}`, { params }),
  getStatsByType: (type, params) => api.get(`/faculty/stats/${type}`, { params }),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api; 
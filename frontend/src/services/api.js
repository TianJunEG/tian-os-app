import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Backend origin (without the /api suffix) for serving uploaded files.
export const SERVER_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // For file uploads, drop the JSON content-type so the browser sets the
  // correct multipart/form-data boundary.
  if (config.data instanceof FormData) {
    if (config.headers && typeof config.headers.delete === 'function') {
      config.headers.delete('Content-Type');
    } else if (config.headers) {
      delete config.headers['Content-Type'];
    }
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update-profile', data)
};

// Tutors API
export const tutorsAPI = {
  createProfile: (data) => api.post('/tutors/profile', data),
  completeOnboarding: (data) => api.post('/tutors/onboarding', data),
  getAllTutors: (params) => api.get('/tutors', { params }),
  getTutorProfile: (id) => api.get(`/tutors/${id}`),
  getMyProfile: () => api.get('/tutors/me/profile'),
  updateAvailability: (data) => api.put('/tutors/availability', data)
};

// Parents API
export const parentsAPI = {
  createProfile: (data) => api.post('/parents/profile', data),
  getProfile: () => api.get('/parents/profile'),
  updateProfile: (data) => api.put('/parents/profile', data)
};

// Partners API
export const partnersAPI = {
  submitInquiry: (data) => api.post('/partners/inquiries', data),
  getInquiries: (params) => api.get('/partners/inquiries', { params }),
  updateInquiryStatus: (id, status) => api.patch(`/partners/inquiries/${id}`, { status })
};

// Resources API
export const resourcesAPI = {
  list: (params) => api.get('/resources', { params }),
  getBySlug: (slug) => api.get(`/resources/${slug}`),
  adminList: () => api.get('/resources/admin'),
  create: (formData) =>
    api.post('/resources', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) =>
    api.put(`/resources/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  remove: (id) => api.delete(`/resources/${id}`),
  unlock: (slug, data) => api.post(`/resources/${slug}/unlock`, data),
  getLeads: () => api.get('/resources/leads')
};

// Search API
export const searchAPI = {
  searchTutors: (data) => api.post('/search/tutors', data),
  getRecommendations: () => api.get('/search/recommendations'),
  getCategories: () => api.get('/search/categories')
};

// Bookings API
export const bookingsAPI = {
  createBooking: (data) => api.post('/bookings', data),
  getBookings: (params) => api.get('/bookings', { params }),
  getBooking: (id) => api.get(`/bookings/${id}`),
  confirmBooking: (id) => api.put(`/bookings/${id}/confirm`),
  checkinBooking: (id) => api.put(`/bookings/${id}/checkin`),
  submitSessionNotes: (id, data) => api.post(`/bookings/${id}/notes`, data),
  getSessionNotes: (id) => api.get(`/bookings/${id}/notes`),
  getParentProgress: (parentId) => api.get(`/bookings/parent/${parentId}/progress`),
  cancelBooking: (id, data) => api.put(`/bookings/${id}/cancel`, data)
};

// Payments API
export const paymentsAPI = {
  createPaymentIntent: (data) => api.post('/payments/create-intent', data),
  confirmPayment: (data) => api.post('/payments/confirm', data),
  getPayment: (bookingId) => api.get(`/payments/${bookingId}`)
};

// Messages API
export const messagesAPI = {
  createConversation: (data) => api.post('/messages/conversations', data),
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (conversationId, params) =>
    api.get(`/messages/${conversationId}`, { params }),
  sendMessage: (data) => api.post('/messages', data),
  editMessage: (id, data) => api.put(`/messages/${id}`, data),
  deleteMessage: (id) => api.delete(`/messages/${id}`)
};

// Worksheets API (math misconception practice generator)
export const worksheetsAPI = {
  generate: (formData) => api.post('/worksheets/generate', formData),
  list: () => api.get('/worksheets'),
  get: (id) => api.get(`/worksheets/${id}`),
  updateSession: (id, n, data) => api.patch(`/worksheets/${id}/sessions/${n}`, data),
  markSession: (id, n, data) => api.post(`/worksheets/${id}/sessions/${n}/mark`, data),
  reinforce: (id, data) => api.post(`/worksheets/${id}/reinforce`, data),
  mistakes: (params) => api.get('/worksheets/mistakes', { params }),
  remove: (id) => api.delete(`/worksheets/${id}`)
};

// Students API (student logins managed by a parent/tutor)
export const studentsAPI = {
  create: (data) => api.post('/students', data),
  list: () => api.get('/students'),
  remove: (id) => api.delete(`/students/${id}`)
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getVerificationQueue: (params) => api.get('/admin/verification-queue', { params }),
  verifyTutor: (tutorId, data) => api.put(`/admin/verification/${tutorId}`, data),
  getBookings: (params) => api.get('/admin/bookings', { params }),
  getDisputes: (params) => api.get('/admin/disputes', { params }),
  resolveDispute: (bookingId, data) => api.put(`/admin/disputes/${bookingId}/resolve`, data)
};

// Reviews API
export const reviewsAPI = {
  createReview: (data) => api.post('/reviews', data),
  getUserReviews: (userId, params) =>
    api.get(`/reviews/user/${userId}`, { params }),
  getReview: (id) => api.get(`/reviews/${id}`),
  updateReview: (id, data) => api.put(`/reviews/${id}`, data),
  markHelpful: (id) => api.post(`/reviews/${id}/helpful`),
  deleteReview: (id) => api.delete(`/reviews/${id}`)
};

export default api;

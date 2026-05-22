import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

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
  getAllTutors: (params) => api.get('/tutors', { params }),
  getTutorProfile: (id) => api.get(`/tutors/${id}`),
  getMyProfile: () => api.get('/tutors/me/profile'),
  updateAvailability: (data) => api.put('/tutors/availability', data)
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

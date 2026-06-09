import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15000,
});

// Request interceptor - attach token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // Try localStorage token first (from zustand persist)
    try {
      const stored = localStorage.getItem('techni-auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.state?.token) {
          config.headers.Authorization = `Bearer ${parsed.state.token}`;
        }
      }
    } catch {}

    // Attach admin token if in admin mode (sessionStorage to survive only current tab)
    const adminToken = sessionStorage.getItem('adminToken');
    if (adminToken) {
      config.headers['x-admin-token'] = adminToken;
    }
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('techni-auth');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export const setAdminTokenHeader = (token: string) => {
  sessionStorage.setItem('adminToken', token);
};

export const clearAdminTokenHeader = () => {
  sessionStorage.removeItem('adminToken');
};

// Auth API
export const authAPI = {
  register: (data: { email: string; password: string; grade: string }) =>
    api.post('/auth/register', data),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  verify: (token: string) =>
    api.get(`/auth/verify?token=${token}`),
  me: () => api.get('/auth/me'),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
  resendVerification: (email: string) =>
    api.post('/auth/resend-verification', { email }),
};

// Posts API
export const postsAPI = {
  getFeed: (page = 1, grade?: string) =>
    api.get(`/posts/feed?page=${page}${grade ? `&grade=${grade}` : ''}`),
  createPost: (data: FormData | object) =>
    api.post('/posts', data),
  likePost: (id: string) =>
    api.post(`/posts/${id}/like`),
  commentPost: (id: string, content: string) =>
    api.post(`/posts/${id}/comment`, { content }),
  deleteComment: (postId: string, commentId: string) =>
    api.delete(`/posts/${postId}/comment/${commentId}`),
  sharePost: (id: string, content?: string) =>
    api.post(`/posts/${id}/share`, { content }),
  deletePost: (id: string) =>
    api.delete(`/posts/${id}`),
  getUserPosts: (userId: string, page = 1) =>
    api.get(`/posts/user/${userId}?page=${page}`),
};

// Users API
export const usersAPI = {
  search: (q: string) =>
    api.get(`/users/search?q=${encodeURIComponent(q)}`),
  getUser: (id: string) =>
    api.get(`/users/${id}`),
  updateProfile: (data: { bio?: string; profilePicture?: string; language?: string }) =>
    api.patch('/users/me/profile', data),
  changeGrade: (grade: string) =>
    api.patch('/users/me/grade', { grade }),
  follow: (id: string) =>
    api.post(`/users/${id}/follow`),
};

// Messages API
export const messagesAPI = {
  getConversations: () =>
    api.get('/messages/conversations'),
  getConversation: (userId: string, page = 1) =>
    api.get(`/messages/conversation/${userId}?page=${page}`),
  sendMessage: (recipientId: string, content: string, mediaUrl?: string, mediaType?: string) =>
    api.post('/messages/send', { recipientId, content, mediaUrl, mediaType }),
  getUnreadCount: () =>
    api.get('/messages/unread-count'),
};

// Upload API
export const uploadAPI = {
  uploadImage: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  uploadVideo: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/upload/video', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000, // 2 minutes for video
    });
  },
  uploadAvatar: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/upload/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

// Admin API
export const adminAPI = {
  verifyCode: (code: string) =>
    api.post('/admin/verify-code', { code }),
  getUsers: (page = 1, search?: string) =>
    api.get(`/admin/users?page=${page}${search ? `&search=${search}` : ''}`),
  banUser: (id: string, reason: string) =>
    api.post(`/admin/users/${id}/ban`, { reason }),
  unbanUser: (id: string) =>
    api.post(`/admin/users/${id}/unban`),
  deletePost: (id: string) =>
    api.delete(`/admin/posts/${id}`),
  getPosts: (page = 1) =>
    api.get(`/admin/posts?page=${page}`),
  getStats: () =>
    api.get('/admin/stats'),
};

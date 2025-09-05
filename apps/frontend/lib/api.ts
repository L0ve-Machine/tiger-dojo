import axios from 'axios'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  timeout: 10000,
  withCredentials: true, // Important for cookies
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Token will be automatically sent as cookie
    // But we can also add it to header if needed
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Try to refresh token
        const refreshResponse = await api.post('/api/auth/refresh')
        
        if (refreshResponse.data.tokens?.accessToken) {
          // Update stored token
          localStorage.setItem('accessToken', refreshResponse.data.tokens.accessToken)
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.tokens.accessToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken')
        window.location.href = '/auth/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Auth API functions
export const authApi = {
  register: (data: {
    email: string
    password: string
    passwordConfirmation: string
    name: string
    discordName?: string
    age?: number
    gender?: string
    tradingExperience?: string
    agreeToTerms: boolean
  }) => api.post('/api/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/api/auth/login', data),

  logout: () => api.post('/api/auth/logout'),

  logoutAll: () => api.post('/api/auth/logout-all'),

  refresh: () => api.post('/api/auth/refresh'),

  getCurrentUser: () => api.get('/api/auth/me'),

  verifyToken: () => api.get('/api/auth/verify-token'),

  updateProfile: (data: { name: string }) =>
    api.put('/api/auth/update-profile', data),
}

// Course API functions
export const courseApi = {
  // Public course endpoints
  getAllCourses: () => api.get('/api/courses'),

  getCourseBySlug: (slug: string) => api.get(`/api/courses/${slug}`),

  // Protected course endpoints
  enrollCourse: (courseId: string) => api.post(`/api/courses/${courseId}/enroll`),

  getLessonById: (lessonId: string) => api.get(`/api/courses/lessons/${lessonId}`),

  updateLessonProgress: (lessonId: string, data: {
    watchedSeconds: number
    completed?: boolean
  }) => api.post(`/api/courses/lessons/${lessonId}/progress`, { 
    lessonId, 
    ...data 
  }),

  getUserProgress: (courseId?: string) => 
    api.get('/api/courses/user/progress', { params: { courseId } }),

  // Admin course endpoints
  createCourse: (data: {
    title: string
    description: string
    thumbnail?: string
    slug: string
    isPublished?: boolean
    price?: number
  }) => api.post('/api/courses', data),

  updateCourse: (courseId: string, data: {
    title?: string
    description?: string
    thumbnail?: string
    slug?: string
    isPublished?: boolean
    price?: number
  }) => api.put(`/api/courses/${courseId}`, data),

  deleteCourse: (courseId: string) => api.delete(`/api/courses/${courseId}`),

  // Admin lesson endpoints
  createLesson: (data: {
    courseId: string
    title: string
    description?: string
    videoUrl: string
    duration?: number
    orderIndex: number
    releaseType?: 'IMMEDIATE' | 'SCHEDULED' | 'DRIP' | 'PREREQUISITE'
    releaseDays?: number
    releaseDate?: string
    prerequisiteId?: string
  }) => api.post('/api/courses/lessons', data),

  updateLesson: (lessonId: string, data: {
    title?: string
    description?: string
    videoUrl?: string
    duration?: number
    orderIndex?: number
    releaseType?: 'IMMEDIATE' | 'SCHEDULED' | 'DRIP' | 'PREREQUISITE'
    releaseDays?: number
    releaseDate?: string
    prerequisiteId?: string
  }) => api.put(`/api/courses/lessons/${lessonId}`, data),

  deleteLesson: (lessonId: string) => api.delete(`/api/courses/lessons/${lessonId}`),

  getCourseStats: (courseId: string) => api.get(`/api/courses/${courseId}/stats`),
}

// Dashboard API functions
export const dashboardApi = {
  getStatistics: () => api.get('/api/dashboard/statistics'),
  getLeaderboard: () => api.get('/api/dashboard/leaderboard'),
}

// Admin API functions
export const adminApi = {
  // Dashboard & Analytics
  getDashboard: () => api.get('/api/admin/dashboard'),
  getAnalytics: (period?: string) => 
    api.get('/api/admin/analytics', { params: { period } }),

  // User Management
  getUsers: (params?: {
    page?: number
    limit?: number
    search?: string
    role?: string
  }) => api.get('/api/admin/users', { params }),
  
  getUserById: (userId: string) => api.get(`/api/admin/users/${userId}`),
  
  updateUser: (userId: string, data: {
    name?: string
    email?: string
    role?: string
    isActive?: boolean
  }) => api.put(`/api/admin/users/${userId}`, data),
  
  deleteUser: (userId: string) => api.delete(`/api/admin/users/${userId}`),
  
  updateUserRole: (userId: string, role: string) => 
    api.put(`/api/admin/users/${userId}/role`, { role }),
  
  updateUserStatus: (userId: string, isActive: boolean) => 
    api.put(`/api/admin/users/${userId}/status`, { isActive }),

  // Course Management
  getAdminCourses: () => api.get('/api/admin/courses'),
  createAdminCourse: (data: {
    title: string
    description: string
    slug: string
    thumbnail?: string
    price?: number
  }) => api.post('/api/admin/courses', data),
  
  updateAdminCourse: (courseId: string, data: {
    title?: string
    description?: string
    slug?: string
    thumbnail?: string
    price?: number
  }) => api.put(`/api/admin/courses/${courseId}`, data),
  
  deleteAdminCourse: (courseId: string) => api.delete(`/api/admin/courses/${courseId}`),
  
  publishCourse: (courseId: string, isPublished: boolean) => 
    api.put(`/api/admin/courses/${courseId}/publish`, { isPublished }),

  // Lesson Management
  getAdminLessons: (courseId?: string) => 
    api.get('/api/admin/lessons', { params: { courseId } }),
  
  createAdminLesson: (data: {
    courseId: string
    title: string
    description?: string
    videoUrl: string
    duration?: number
    orderIndex: number
    releaseType?: string
    releaseDays?: number
    releaseDate?: string
    prerequisiteId?: string
  }) => api.post('/api/admin/lessons', data),
  
  updateAdminLesson: (lessonId: string, data: any) => 
    api.put(`/api/admin/lessons/${lessonId}`, data),
  
  deleteAdminLesson: (lessonId: string) => api.delete(`/api/admin/lessons/${lessonId}`),

  // Video Upload (Placeholder)
  uploadVideo: (data: FormData) => 
    api.post('/api/admin/upload/video', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  getUploadStatus: (uploadId: string) => 
    api.get(`/api/admin/upload/video/${uploadId}/status`),

  // Chat Management
  getChatMessages: (params?: {
    page?: number
    limit?: number
    lessonId?: string
  }) => api.get('/api/admin/chat/messages', { params }),
  
  deleteChatMessage: (messageId: string) => 
    api.delete(`/api/admin/chat/messages/${messageId}`),
  
  moderateMessage: (messageId: string, content: string) => 
    api.put(`/api/admin/chat/messages/${messageId}/moderate`, { content }),

  // System Settings
  getSettings: () => api.get('/api/admin/settings'),
  updateSettings: (data: any) => api.put('/api/admin/settings', data),
}

// Generic API helper
export default api
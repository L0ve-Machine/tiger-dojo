import axios from 'axios'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '', // Use relative URLs with Next.js proxy
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

  // User lesson access
  getUserLessons: (courseId?: string) => 
    api.get('/api/courses/lessons', { params: { courseId } }),

  getUserAvailableLessons: (courseId?: string) => 
    api.get('/api/courses/lessons/available', { params: { courseId } }),

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

// Create admin-specific axios instance with authentication
const adminApiClient = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? 'https://trade-dojo-fx.com' : '',
  timeout: 10000,
  withCredentials: true, // Send auth cookies
})

// Add authorization header for admin requests
adminApiClient.interceptors.request.use(
  (config) => {
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

// Admin API functions
export const adminApi = {
  // Dashboard & Analytics
  getDashboard: () => adminApiClient.get('/api/admin/dashboard'),
  getAnalytics: (period?: string) => 
    adminApiClient.get('/api/admin/analytics', { params: { period } }),

  // User Management
  getUsers: (params?: {
    page?: number
    limit?: number
    search?: string
    role?: string
  }) => adminApiClient.get('/api/admin/users', { params }),
  
  getPendingUsers: () => adminApiClient.get('/api/admin/pending-users'),
  
  approveUser: (token: string) => adminApiClient.post(`/api/admin/approve-user/${token}`),
  rejectUser: (token: string) => adminApiClient.post(`/api/admin/reject-user/${token}`),
  
  getUserById: (userId: string) => adminApiClient.get(`/api/admin/users/${userId}`),
  
  updateUser: (userId: string, data: {
    name?: string
    email?: string
    role?: string
    isActive?: boolean
  }) => adminApiClient.put(`/api/admin/users/${userId}`, data),
  
  deleteUser: (userId: string) => adminApiClient.delete(`/api/admin/users/${userId}`),
  
  updateUserRole: (userId: string, role: string) => 
    adminApiClient.put(`/api/admin/users/${userId}/role`, { role }),
  
  updateUserStatus: (userId: string, isActive: boolean) => 
    adminApiClient.put(`/api/admin/users/${userId}/status`, { isActive }),

  // Course Management
  getAdminCourses: () => adminApiClient.get('/api/admin/courses'),
  createAdminCourse: (data: {
    title: string
    description: string
    slug: string
    thumbnail?: string
    price?: number
  }) => adminApiClient.post('/api/admin/courses', data),
  
  updateAdminCourse: (courseId: string, data: {
    title?: string
    description?: string
    slug?: string
    thumbnail?: string
    price?: number
  }) => adminApiClient.put(`/api/admin/courses/${courseId}`, data),
  
  deleteAdminCourse: (courseId: string) => adminApiClient.delete(`/api/admin/courses/${courseId}`),
  
  publishCourse: (courseId: string, isPublished: boolean) => 
    adminApiClient.put(`/api/admin/courses/${courseId}/publish`, { isPublished }),

  // Lesson Management
  getAdminLessons: (courseId?: string) => 
    adminApiClient.get('/api/admin/lessons', { params: { courseId } }),
  
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
  }) => adminApiClient.post('/api/admin/lessons', data),
  
  updateAdminLesson: (lessonId: string, data: any) => 
    adminApiClient.put(`/api/admin/lessons/${lessonId}`, data),
  
  deleteAdminLesson: (lessonId: string) => adminApiClient.delete(`/api/admin/lessons/${lessonId}`),

  // Video Upload (Placeholder)
  uploadVideo: (data: FormData) => 
    adminApiClient.post('/api/admin/upload/video', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  getUploadStatus: (uploadId: string) => 
    adminApiClient.get(`/api/admin/upload/video/${uploadId}/status`),

  // Chat Management
  getChatMessages: (params?: {
    page?: number
    limit?: number
    lessonId?: string
  }) => adminApiClient.get('/api/admin/chat/messages', { params }),
  
  deleteChatMessage: (messageId: string) => 
    adminApiClient.delete(`/api/admin/chat/messages/${messageId}`),
  
  moderateMessage: (messageId: string, content: string) => 
    adminApiClient.put(`/api/admin/chat/messages/${messageId}/moderate`, { content }),

  // Chat Room Management
  getChatRooms: () => adminApiClient.get('/api/admin/chat/rooms'),
  createChatRoom: (data: { title: string; slug: string }) => 
    adminApiClient.post('/api/admin/chat/rooms', data),
  deleteChatRoom: (roomId: string) => 
    adminApiClient.delete(`/api/admin/chat/rooms/${roomId}`),

  // Private Room Management
  createPrivateRoom: (data: { name: string; accessKey: string; isPublic: boolean; maxMembers: number }) =>
    adminApiClient.post('/api/private-rooms', data),
  getPrivateRooms: () => adminApiClient.get('/api/private-rooms'),
  joinPrivateRoom: (roomId: string, accessKey: string) =>
    adminApiClient.post(`/api/private-rooms/${roomId}/join`, { accessKey }),

  // System Settings
  getSettings: () => adminApiClient.get('/api/admin/settings'),
  updateSettings: (data: any) => adminApiClient.put('/api/admin/settings', data),
  
  // Admin Password Management
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    adminApiClient.post('/api/admin/change-password', data),
}

// Vimeo API functions
export const vimeoApi = {
  // Get video data via our proxy endpoint to avoid CORS issues
  getVideoData: (videoUrl: string) => api.get('/api/vimeo/oembed', { params: { url: videoUrl } }),
}

// Helper function to convert relative avatar paths to absolute URLs
export const getAvatarUrl = (avatarPath: string | null | undefined): string | null => {
  if (!avatarPath) return null
  
  // If it's already a full URL, return as is
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath
  }
  
  // If it starts with /uploads/, convert to absolute URL
  if (avatarPath.startsWith('/uploads/')) {
    // Always use the main domain (nginx) for both dev and prod
    return `https://trade-dojo-fx.com${avatarPath}`
  }
  
  return avatarPath
}

// Generic API helper
export default api
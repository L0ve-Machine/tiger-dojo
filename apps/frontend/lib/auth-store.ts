import { create } from 'zustand'

interface User {
  id: string
  email: string
  name: string
  role: string
  avatarColor?: string | null
  avatarImage?: string | null
  subscription_plan?: string
  createdAt?: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
  acceptTerms: boolean
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  checkAuth: () => Promise<void>
  updateUser: (userData: Partial<User>) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null })
      const response = await fetch(`/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        // Store tokens
        if (data.tokens?.accessToken) {
          localStorage.setItem('accessToken', data.tokens.accessToken)
        }
        if (data.tokens?.refreshToken) {
          localStorage.setItem('refreshToken', data.tokens.refreshToken)
        }
        
        set({
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        })
        return true
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || 'ログインに失敗しました'
        set({ 
          isLoading: false, 
          error: errorMessage,
          isAuthenticated: false,
          user: null 
        })
        return false
      }
    } catch (error) {
      console.error('Login error:', error)
      set({ 
        isLoading: false, 
        error: 'サーバーに接続できません',
        isAuthenticated: false,
        user: null 
      })
      return false
    }
  },

  logout: () => {
    fetch(`/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    // Clear cookies
    document.cookie = 'accessToken=; path=/; max-age=0'
    document.cookie = 'user=; path=/; max-age=0'
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })
  },

  checkAuth: async () => {
    try {
      const accessToken = localStorage.getItem('accessToken')
      
      if (!accessToken) {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        })
        return
      }

      const response = await fetch(`/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const userData = await response.json()
        set({
          user: userData,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        })
      } else {
        // Token might be expired, clear it
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        })
      }
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })
    }
  },

  updateUser: (userData: Partial<User>) => {
    const currentUser = get().user
    if (currentUser) {
      set({
        user: { ...currentUser, ...userData }
      })
    }
  },
}))
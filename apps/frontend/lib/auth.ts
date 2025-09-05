'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from './api'

export interface User {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  emailVerified: boolean
  discordName?: string
  age?: number
  gender?: string
  tradingExperience?: string
  registeredAt?: string
  lastLoginAt?: string
  subscription?: {
    plan: 'standard' | 'premium' | null
    status: 'active' | 'inactive' | 'cancelled'
    expiresAt?: string
  }
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  logoutAll: () => Promise<void>
  getCurrentUser: () => Promise<void>
  clearError: () => void
  setLoading: (loading: boolean) => void
}

export interface RegisterData {
  email: string
  password: string
  passwordConfirmation: string
  name: string
  discordName?: string
  age?: number
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY'
  tradingExperience?: 'BEGINNER' | 'UNDER_1_YEAR' | 'ONE_TO_THREE' | 'OVER_THREE'
  agreeToTerms: boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await authApi.login({ email, password })
          const { user, tokens } = response.data
          
          // Store access token in localStorage (optional, cookies are primary)
          if (tokens?.accessToken) {
            localStorage.setItem('accessToken', tokens.accessToken)
          }
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })
          
          return true // Return true on success
          
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'ログインに失敗しました'
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage
          })
          return false // Return false on failure
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await authApi.register(data)
          const { user, tokens } = response.data
          
          // Store access token in localStorage
          if (tokens?.accessToken) {
            localStorage.setItem('accessToken', tokens.accessToken)
          }
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })
          
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || '登録に失敗しました'
          const details = error.response?.data?.details
          
          let fullErrorMessage = errorMessage
          if (details && Array.isArray(details)) {
            fullErrorMessage = details.join(', ')
          }
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: fullErrorMessage
          })
          throw new Error(fullErrorMessage)
        }
      },

      logout: async () => {
        set({ isLoading: true })
        
        try {
          await authApi.logout()
        } catch (error) {
          console.error('Logout error:', error)
          // Continue with logout even if API call fails
        }
        
        localStorage.removeItem('accessToken')
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        })
      },

      logoutAll: async () => {
        set({ isLoading: true })
        
        try {
          await authApi.logoutAll()
        } catch (error) {
          console.error('Logout all error:', error)
        }
        
        localStorage.removeItem('accessToken')
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        })
      },

      getCurrentUser: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await authApi.getCurrentUser()
          const { user } = response.data
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })
          
        } catch (error: any) {
          localStorage.removeItem('accessToken')
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null // Don't show error for failed user fetch
          })
        }
      },

      clearError: () => {
        set({ error: null })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)

// Helper hook for authentication check
export const useAuth = () => {
  const store = useAuthStore()
  
  // Auto-fetch user data on mount if authenticated but no user data
  React.useEffect(() => {
    if (store.isAuthenticated && !store.user && !store.isLoading) {
      store.getCurrentUser()
    }
  }, [store.isAuthenticated, store.user, store.isLoading])
  
  return store
}

// Import React for useEffect
import React from 'react'
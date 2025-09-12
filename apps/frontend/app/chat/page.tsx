'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { useSocketStore } from '@/lib/socket'
import { authApi } from '@/lib/api'
import { Send, Users, Hash, AtSign, Settings, Plus, Search, Mic, Menu, X, AlertTriangle, Loader2, RefreshCw, Lock, UserPlus, Key } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'

// Types for better TypeScript support
interface Channel {
  id: string
  name: string
  type: 'text'
  description: string
}

interface ErrorState {
  message: string
  type: 'error' | 'warning' | 'info'
}

interface LoadingStates {
  sendingMessage: boolean
  creatingChannel: boolean
  deletingChannel: boolean
  connecting: boolean
}

export default function ChatPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const {
    socket,
    isConnected,
    currentRoom,
    currentChannel,
    messagesByChannel,
    roomOnlineUsers,
    typingUsers,
    connect,
    joinRoom,
    joinChannel,
    sendMessage,
    startTyping,
    stopTyping,
    getChannelMessages,
    getDmMessages
  } = useSocketStore()

  const [selectedChannel, setSelectedChannel] = useState<string>('')
  const [messageInput, setMessageInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showUsersSidebar, setShowUsersSidebar] = useState(false)
  const [showChannelModal, setShowChannelModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [channels, setChannels] = useState<Channel[]>([])
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelDescription, setNewChannelDescription] = useState('')
  const [dmUsers, setDmUsers] = useState<{id: string, name: string, unread?: number}[]>([])
  const [selectedDmUser, setSelectedDmUser] = useState<string | null>(null)
  const [error, setError] = useState<ErrorState | null>(null)
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    sendingMessage: false,
    creatingChannel: false,
    deletingChannel: false,
    connecting: false
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ show: boolean, channelId: string, channelName: string }>({
    show: false,
    channelId: '',
    channelName: ''
  })
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [lastPongTime, setLastPongTime] = useState(Date.now())
  const [playNotificationSound, setPlayNotificationSound] = useState(false)
  const [newUserName, setNewUserName] = useState('')
  const [showPrivateRoomModal, setShowPrivateRoomModal] = useState(false)
  const [showJoinRoomModal, setShowJoinRoomModal] = useState(false)
  const [privateRooms, setPrivateRooms] = useState([])
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomDescription, setNewRoomDescription] = useState('')
  const [newRoomAccessKey, setNewRoomAccessKey] = useState('')
  const [isPublicRoom, setIsPublicRoom] = useState(false)
  const [joinRoomSlug, setJoinRoomSlug] = useState('')
  const [joinRoomAccessKey, setJoinRoomAccessKey] = useState('')
  
  // Password prompt modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordPromptRoom, setPasswordPromptRoom] = useState<{id: string, name: string, slug?: string} | null>(null)
  const [roomPassword, setRoomPassword] = useState('')
  const [authenticatedRooms, setAuthenticatedRooms] = useState<Set<string>>(() => {
    // Load authenticated rooms from localStorage on initialization
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('authenticatedRooms')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    }
    return new Set()
  })
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Get current messages (channel or DM)
  const messages = selectedDmUser && currentRoom?.roomType === 'dm' 
    ? (getDmMessages ? getDmMessages(currentRoom.roomId) || [] : [])
    : (getChannelMessages ? getChannelMessages(selectedChannel) || [] : [])

  // Initialize notification sound
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1O/LaiwGJHfH6NabOggVY7zv5J5PEAxPpu/ytmMcBjiS0u/LaiwGJ3fJ6diaSgcdYLvt565pEQ5RqOH0mmcfBD2X2u3Maw==')
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const previousMessageCount = messages.length
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    
    // Play notification sound for new messages (not for first load)
    if (previousMessageCount > 0 && messages.length > previousMessageCount && playNotificationSound) {
      audioRef.current?.play().catch(() => {}) // Ignore errors if user hasn't interacted yet
    }
  }, [messages, playNotificationSound])

  // Fetch chat rooms from API
  const fetchChatRooms = async () => {
    try {
      console.log('Fetching chat rooms...')
      // Use relative URL to go through nginx proxy
      const response = await fetch('/api/admin/chat/rooms')
      const data = await response.json()
      
      console.log('Chat rooms response:', data)
      
      if (data.success && data.rooms && data.rooms.length > 0) {
        const formattedChannels = data.rooms.map((room: any) => ({
          id: room.type === 'private' ? room.id : room.slug, // Use database ID for private rooms, slug for course rooms
          name: room.title,
          slug: room.slug, // Store the actual database slug  
          roomId: room.id, // Store the actual database ID
          roomType: room.type, // Store the room type (private/course)
          type: 'text' as const,
          description: room.description || 'チャットルーム'
        }))
        
        console.log('Formatted channels:', formattedChannels)
        setChannels(formattedChannels)
        
        // Set default channel if not selected (avoid locked channels)
        if (!selectedChannel && formattedChannels.length > 0) {
          const defaultChannel = formattedChannels.find((ch: any) => ch.id === 'general') || 
                                  formattedChannels.find((ch: any) => !ch.id.startsWith('🔒')) || 
                                  formattedChannels[0]
          setSelectedChannel(defaultChannel.id)
        }
      } else {
        console.log('No rooms found or API error, using fallback')
        // Fallback to default channels if no rooms or API fails
        const fallbackChannels = [
          { id: 'general', name: 'General', type: 'text' as const, description: '一般的な雑談や質問のためのチャットルーム' },
          { id: 'announcements', name: 'Announcements', type: 'text' as const, description: '重要なお知らせや発表のためのチャットルーム' },
          { id: 'questions', name: 'Questions', type: 'text' as const, description: '学習に関する質問や疑問のためのチャットルーム' },
          { id: 'resources', name: 'Resources', type: 'text' as const, description: '有益な資料やリンクの共有のためのチャットルーム' }
        ]
        setChannels(fallbackChannels)
        if (!selectedChannel) {
          setSelectedChannel('general')
        }
      }
    } catch (error) {
      console.error('Failed to fetch chat rooms:', error)
      // Fallback to default channels if API fails
      const fallbackChannels = [
        { id: 'general', name: 'General', type: 'text' as const, description: '一般的な雑談や質問のためのチャットルーム' },
        { id: 'announcements', name: 'Announcements', type: 'text' as const, description: '重要なお知らせや発表のためのチャットルーム' },
        { id: 'questions', name: 'Questions', type: 'text' as const, description: '学習に関する質問や疑問のためのチャットルーム' },
        { id: 'resources', name: 'Resources', type: 'text' as const, description: '有益な資料やリンクの共有のためのチャットルーム' }
      ]
      setChannels(fallbackChannels)
      if (!selectedChannel) {
        setSelectedChannel('general')
      }
    }
  }

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    } else {
      // Fetch chat rooms when authenticated
      fetchChatRooms()
    }
  }, [isAuthenticated, router])

  // Connect to socket on mount with error handling and reconnection logic
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token && !isConnected && !socket) {
      setLoadingStates(prev => ({ ...prev, connecting: true }))
      
      try {
        connect(token)
        // Connection success is handled by the socket event listeners
        // The isConnected state will be updated when the socket connects
      } catch (err) {
        console.error('Failed to initialize socket connection:', err)
        setError({ message: 'チャットサーバーへの接続に失敗しました', type: 'error' })
        setLoadingStates(prev => ({ ...prev, connecting: false }))
        
        // Implement exponential backoff for reconnection
        const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
        setTimeout(() => {
          if (reconnectAttempts < 5) {
            setReconnectAttempts(prev => prev + 1)
          }
        }, timeout)
      }
    }
  }, [reconnectAttempts, isConnected, socket, connect])
  
  // Monitor connection status and clear loading state
  useEffect(() => {
    if (isConnected) {
      setError(null)
      setReconnectAttempts(0)
      setLoadingStates(prev => ({ ...prev, connecting: false }))
    }
  }, [isConnected])

  // Heartbeat to detect connection issues
  useEffect(() => {
    if (isConnected && socket) {
      const interval = setInterval(() => {
        socket.emit('ping')
        const checkPong = setTimeout(() => {
          if (Date.now() - lastPongTime > 10000) {
            setError({ message: 'サーバーとの接続が不安定です', type: 'warning' })
          }
        }, 5000)
        
        socket.once('pong', () => {
          setLastPongTime(Date.now())
          clearTimeout(checkPong)
          setError(null)
        })
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [isConnected, socket, lastPongTime])

  // Join default room when connected
  useEffect(() => {
    if (isConnected && !currentRoom) {
      // Join the default general channel
      joinChannel('general')
    }
  }, [isConnected, currentRoom, joinChannel])

  // Sanitize message content to prevent XSS
  const sanitizeMessage = useCallback((content: string): string => {
    return content
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim()
  }, [])

  // Validate input with character limits
  const validateInput = useCallback((input: string, maxLength: number): { isValid: boolean, error?: string } => {
    if (!input.trim()) {
      return { isValid: false, error: 'メッセージが空です' }
    }
    if (input.length > maxLength) {
      return { isValid: false, error: `${maxLength}文字以内で入力してください` }
    }
    return { isValid: true }
  }, [])

  // Handle mention detection
  const processMentions = (text: string): string => {
    return text.replace(/@([a-zA-Z0-9_]+)/g, (match, username) => {
      const mentionedUser = roomOnlineUsers.find(u => u.userName.toLowerCase() === username.toLowerCase())
      if (mentionedUser) {
        return `<span class="bg-yellow-400/20 text-yellow-400 px-1 rounded font-semibold">${match}</span>`
      }
      return match
    })
  }

  // Handle typing indicator with error handling
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    
    // Character limit validation
    if (value.length > 1000) {
      setError({ message: 'メッセージは1000文字以内で入力してください', type: 'warning' })
      return
    }
    
    setMessageInput(value)
    setError(null)
    
    if (!isTyping && value.length > 0) {
      setIsTyping(true)
      try {
        startTyping()
      } catch (err) {
        console.warn('Failed to send typing indicator:', err)
      }
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false)
        try {
          stopTyping()
        } catch (err) {
          console.warn('Failed to stop typing indicator:', err)
        }
      }
    }, 1000)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedMessage = messageInput.trim()
    const validation = validateInput(trimmedMessage, 1000)
    
    if (!validation.isValid) {
      setError({ message: validation.error!, type: 'warning' })
      return
    }
    
    if (!isConnected) {
      setError({ message: 'サーバーに接続されていません', type: 'error' })
      return
    }
    
    const sanitizedMessage = sanitizeMessage(trimmedMessage)
    
    setLoadingStates(prev => ({ ...prev, sendingMessage: true }))
    setError(null)
    
    try {
      sendMessage(sanitizedMessage)
      setMessageInput('')
      
      if (isTyping) {
        setIsTyping(false)
        stopTyping()
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    } catch (err) {
      setError({ message: 'メッセージの送信に失敗しました', type: 'error' })
    } finally {
      setLoadingStates(prev => ({ ...prev, sendingMessage: false }))
    }
  }

  const formatTime = (date: Date) => {
    return format(new Date(date), 'HH:mm')
  }

  const handleChannelChange = async (channelId: string) => {
    // Check if it's a locked room that hasn't been authenticated
    const isLocked = channelId.startsWith('🔒')
    const roomName = isLocked ? channelId.substring(2).trim() : channelId
    
    if (isLocked && !authenticatedRooms.has(channelId)) {
      // Find the room data to get the actual slug
      const roomData = channels.find(ch => ch.id === channelId)
      
      // Show password prompt
      setPasswordPromptRoom({ 
        id: channelId, 
        name: roomName, 
        slug: roomData?.slug // Get the slug from room data
      })
      setShowPasswordModal(true)
      return
    }
    
    setSelectedChannel(channelId)
    setSelectedDmUser(null)
    if (isConnected) {
      // Find the actual channel data to get the proper slug/ID
      const targetChannel = channels.find(ch => ch.id === channelId)
      if (targetChannel) {
        // For private rooms (locked), use the slug; for course rooms, use the slug
        const actualRoomId = targetChannel.slug || channelId
        console.log('Joining channel with actual ID:', actualRoomId, 'from channel:', targetChannel)
        joinChannel(actualRoomId)
      } else {
        joinChannel(channelId)
      }
    }
  }

  const handleCreateChannel = async () => {
    const nameValidation = validateInput(newChannelName, 50)
    const descValidation = validateInput(newChannelDescription || 'Default', 100)
    
    if (!nameValidation.isValid) {
      setError({ message: nameValidation.error!, type: 'warning' })
      return
    }
    
    if (newChannelDescription && !descValidation.isValid) {
      setError({ message: 'チャンネル説明: ' + descValidation.error!, type: 'warning' })
      return
    }
    
    if (!user || user.role !== 'ADMIN') {
      setError({ message: 'チャンネル作成の権限がありません', type: 'error' })
      return
    }
    
    // Check for duplicate channel names
    const channelSlug = newChannelName.toLowerCase().replace(/\s+/g, '-')
    if (channels.some(ch => ch.id === channelSlug)) {
      setError({ message: '同名のチャンネルが既に存在します', type: 'warning' })
      return
    }
    
    setLoadingStates(prev => ({ ...prev, creatingChannel: true }))
    setError(null)
    
    try {
      const response = await fetch('/api/admin/chat/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newChannelName.trim(),
          slug: channelSlug
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Refresh channels list
        await fetchChatRooms()
        setNewChannelName('')
        setNewChannelDescription('')
        setShowChannelModal(false)
      } else {
        setError({ message: data.error || 'チャンネルの作成に失敗しました', type: 'error' })
      }
    } catch (err) {
      setError({ message: 'チャンネルの作成に失敗しました', type: 'error' })
    } finally {
      setLoadingStates(prev => ({ ...prev, creatingChannel: false }))
    }
  }

  const handleDeleteChannel = async (channelId: string) => {
    if (!user || user.role !== 'ADMIN') {
      setError({ message: 'チャンネル削除の権限がありません', type: 'error' })
      return
    }
    
    setLoadingStates(prev => ({ ...prev, deletingChannel: true }))
    setError(null)
    
    try {
      // Find the room ID from channels
      const channelToDelete = channels.find(ch => ch.id === channelId)
      if (!channelToDelete) {
        setError({ message: 'チャンネルが見つかりません', type: 'error' })
        return
      }
      
      // Fetch rooms to get the actual room ID
      const roomsResponse = await fetch('/api/admin/chat/rooms')
      const roomsData = await roomsResponse.json()
      
      if (roomsData.success && roomsData.rooms) {
        const room = roomsData.rooms.find((r: any) => r.slug === channelId)
        
        if (room) {
          const response = await fetch(`/api/admin/chat/rooms/${room.id}`, {
            method: 'DELETE'
          })
          
          const data = await response.json()
          
          if (data.success) {
            // Refresh channels list
            await fetchChatRooms()
            
            if (selectedChannel === channelId) {
              // Select first available channel
              const firstChannel = channels.filter(ch => ch.id !== channelId)[0]
              if (firstChannel) {
                setSelectedChannel(firstChannel.id)
                handleChannelChange(firstChannel.id)
              }
            }
            setShowDeleteConfirm({ show: false, channelId: '', channelName: '' })
          } else {
            setError({ message: data.error || 'チャンネルの削除に失敗しました', type: 'error' })
          }
        } else {
          setError({ message: 'チャンネルが見つかりません', type: 'error' })
        }
      }
    } catch (err) {
      setError({ message: 'チャンネルの削除に失敗しました', type: 'error' })
    } finally {
      setLoadingStates(prev => ({ ...prev, deletingChannel: false }))
    }
  }
  
  const confirmDeleteChannel = (channelId: string, channelName: string) => {
    setShowDeleteConfirm({ show: true, channelId, channelName })
  }

  const handleSaveProfile = async () => {
    const trimmedName = newUserName.trim()
    
    if (!trimmedName) {
      setError({ message: '名前を入力してください', type: 'warning' })
      return
    }
    
    if (trimmedName === user?.name) {
      setShowProfileModal(false)
      return
    }
    
    setLoadingStates(prev => ({ ...prev, sendingMessage: true }))
    setError(null)
    
    try {
      const response = await authApi.updateProfile({ name: trimmedName })
      if (response.data.user) {
        setShowProfileModal(false)
        setError({ message: '名前を更新しました', type: 'info' })
      }
    } catch (err: any) {
      setError({ 
        message: err.response?.data?.error || '名前の更新に失敗しました', 
        type: 'error' 
      })
    } finally {
      setLoadingStates(prev => ({ ...prev, sendingMessage: false }))
    }
  }

  const handleRoomPasswordSubmit = async () => {
    if (!passwordPromptRoom || !roomPassword.trim()) {
      setError({ message: 'パスワードを入力してください', type: 'warning' })
      return
    }

    setLoadingStates(prev => ({ ...prev, sendingMessage: true }))
    setError(null)

    try {
      // For now, we'll use a simple approach since we're using the visual indicator
      // Later this should verify with the backend
      const response = await fetch(`/api/private-rooms/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomSlug: passwordPromptRoom.slug || passwordPromptRoom.name.toLowerCase().replace(/\s+/g, '-'),
          password: roomPassword
        })
      })

      if (response.ok) {
        // Add to authenticated rooms
        const newAuthenticatedRooms = new Set([...authenticatedRooms, passwordPromptRoom.id])
        setAuthenticatedRooms(newAuthenticatedRooms)
        
        // Save to localStorage for persistence
        localStorage.setItem('authenticatedRooms', JSON.stringify([...newAuthenticatedRooms]))
        
        // Join the room
        setSelectedChannel(passwordPromptRoom.id)
        setSelectedDmUser(null)
        if (isConnected) {
          // Use the actual room slug for socket connection
          const roomSlug = passwordPromptRoom.slug || passwordPromptRoom.name.toLowerCase().replace(/\s+/g, '-')
          joinChannel(passwordPromptRoom.id) // Use the channel ID (with lock emoji) for frontend display
        }
        
        // Close modal and reset state
        setShowPasswordModal(false)
        setPasswordPromptRoom(null)
        setRoomPassword('')
        setError({ message: 'ルームに参加しました', type: 'info' })
      } else {
        const data = await response.json()
        setError({ message: data.error || 'パスワードが正しくありません', type: 'error' })
      }
    } catch (err) {
      console.error('Password verification error:', err)
      setError({ message: 'パスワードの確認に失敗しました', type: 'error' })
    } finally {
      setLoadingStates(prev => ({ ...prev, sendingMessage: false }))
    }
  }

  const handleStartDM = async (dmUserId: string) => {
    if (!user?.id) {
      setError({ message: 'ユーザー情報が取得できません', type: 'error' })
      return
    }
    
    if (!isConnected) {
      setError({ message: 'サーバーに接続されていません', type: 'error' })
      return
    }
    
    try {
      const roomId = [user.id, dmUserId].sort().join('_')
      setSelectedDmUser(dmUserId)
      setSelectedChannel('')
      await joinRoom('dm', roomId)
      setError(null)
    } catch (err) {
      setError({ message: 'DMの開始に失敗しました', type: 'error' })
    }
  }
  
  // Keyboard event handlers for accessibility
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (showChannelModal) setShowChannelModal(false)
      if (showProfileModal) setShowProfileModal(false)
      if (showDeleteConfirm.show) setShowDeleteConfirm({ show: false, channelId: '', channelName: '' })
      if (showUsersSidebar) setShowUsersSidebar(false)
      if (showPasswordModal) {
        setShowPasswordModal(false)
        setPasswordPromptRoom(null)
        setRoomPassword('')
      }
    }
  }, [showChannelModal, showProfileModal, showDeleteConfirm.show, showUsersSidebar, showPasswordModal])
  
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
  
  // Focus management for modals
  const channelModalRef = useRef<HTMLDivElement>(null)
  const profileModalRef = useRef<HTMLDivElement>(null)
  const deleteConfirmRef = useRef<HTMLDivElement>(null)
  const passwordModalRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (showChannelModal) {
      channelModalRef.current?.focus()
    }
  }, [showChannelModal])
  
  useEffect(() => {
    if (showProfileModal) {
      profileModalRef.current?.focus()
    }
  }, [showProfileModal])
  
  useEffect(() => {
    if (showDeleteConfirm.show) {
      deleteConfirmRef.current?.focus()
    }
  }, [showDeleteConfirm.show])
  
  useEffect(() => {
    if (showPasswordModal) {
      passwordModalRef.current?.focus()
    }
  }, [showPasswordModal])
  
  // Error dismissal timer
  useEffect(() => {
    if (error && error.type !== 'error') {
      const timer = setTimeout(() => {
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR'

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* Mobile Menu Button */}
      <div className="absolute top-4 left-4 z-50 md:hidden">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="inline-flex items-center justify-center w-10 h-10 bg-black/40 backdrop-blur-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Back to Dashboard Button */}
      <div className="absolute top-4 left-16 md:left-4 z-40">
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all"
        >
          <span className="hidden sm:inline">← ダッシュボードに戻る</span>
          <span className="sm:hidden">← 戻る</span>
        </Link>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`w-72 bg-black/60 backdrop-blur-sm border-r border-gray-700 shadow-lg flex flex-col transition-transform duration-300 md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed md:relative z-40 h-full`}>
        {/* Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-gray-700 mt-12">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md overflow-hidden">
              <Image 
                src="/images/lion-tech.jpeg" 
                alt="Lion Tech" 
                width={32} 
                height={32} 
                className="rounded-lg object-cover"
              />
            </div>
            <h1 className="text-white font-bold">トレード道場</h1>
          </div>
        </div>

        {/* Channels */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-3 py-4">
            <div className="flex items-center justify-between px-2 mb-3">
              <span className="text-xs uppercase font-semibold text-gray-400 tracking-wide">テキストチャンネル</span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={fetchChatRooms}
                  className="text-gray-500 hover:text-yellow-400 p-1 hover:bg-yellow-400/10 rounded transition"
                  title="チャンネルを更新"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                {isAdmin && (
                  <button 
                    onClick={() => setShowChannelModal(true)}
                    className="text-gray-500 hover:text-yellow-400 p-1 hover:bg-yellow-400/10 rounded transition"
                    title="チャンネルを追加"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            {channels.map(channel => (
              <div key={channel.id} className="group relative">
                <button
                  onClick={() => handleChannelChange(channel.id)}
                  className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg mb-2 transition-all text-left ${
                    selectedChannel === channel.id 
                      ? 'bg-yellow-500/20 text-yellow-400 shadow-sm border border-yellow-500/30' 
                      : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Hash className="w-4 h-4 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium">{channel.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{channel.description}</div>
                  </div>
                </button>
                {isAdmin && channel.id !== 'general' && (
                  <button
                    onClick={() => confirmDeleteChannel(channel.id, channel.name)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-1 hover:bg-red-500/20 rounded transition-all"
                    title="チャンネルを削除"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Direct Messages Section */}
          <div className="px-3 py-4 border-t border-gray-700">
            <div className="flex items-center justify-between px-2 mb-3">
              <span className="text-xs uppercase font-semibold text-gray-400 tracking-wide">ダイレクトメッセージ</span>
            </div>
            
            <div className="space-y-2">
              {roomOnlineUsers.filter(u => u.userId !== user?.id).map(onlineUser => (
                <button
                  key={onlineUser.userId}
                  onClick={() => handleStartDM(onlineUser.userId)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left ${
                    selectedDmUser === onlineUser.userId 
                      ? 'bg-blue-50 text-blue-400 shadow-sm border border-blue-200' 
                      : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    {onlineUser.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{onlineUser.userName}</div>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </button>
              ))}
              
              {roomOnlineUsers.filter(u => u.userId !== user?.id).length === 0 && (
                <div className="text-xs text-gray-500 px-2">
                  他のオンラインユーザーがいません
                </div>
              )}
            </div>
          </div>

          {/* Online Users */}
          <div className="px-3 py-4 border-t border-gray-700">
            <div className="flex items-center justify-between px-2 mb-3">
              <span className="text-xs uppercase font-semibold text-gray-400 tracking-wide">オンライン</span>
              <span className="text-xs text-gray-500">{roomOnlineUsers.length}</span>
            </div>
            
            <div className="space-y-2">
              {roomOnlineUsers.map(onlineUser => (
                <div key={onlineUser.userId} className="flex items-center gap-2 px-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-white text-sm font-bold">
                    {onlineUser.userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-300">{onlineUser.userName}</span>
                  {onlineUser.userRole === 'INSTRUCTOR' && (
                    <span className="text-xs bg-yellow-400/20 text-yellow-400 px-1.5 py-0.5 rounded">講師</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="px-3 py-3 border-t border-gray-700 bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-white truncate">{user?.name}</div>
              <div className="text-xs text-gray-400">
                {isConnected ? (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    オンライン
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    オフライン
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                setNewUserName(user?.name || '')
                setShowProfileModal(true)
              }}
              className="text-gray-400 hover:text-white p-1 hover:bg-gray-700 rounded-md transition"
              title="プロフィール設定"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-black/30 backdrop-blur-sm md:ml-0">
        
        {/* Users Sidebar Overlay */}
        {showUsersSidebar && (
          <div 
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setShowUsersSidebar(false)}
          />
        )}
        
        {/* Users Sidebar */}
        {showUsersSidebar && (
          <div className="fixed right-0 top-0 h-full w-80 bg-black/80 backdrop-blur-sm border-l border-gray-700 shadow-lg z-40 flex flex-col">
            <div className="h-16 px-4 flex items-center justify-between border-b border-gray-700 mt-12">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-yellow-400" />
                オンラインユーザー
              </h3>
              <button
                onClick={() => setShowUsersSidebar(false)}
                className="text-gray-400 hover:text-white p-1 hover:bg-gray-700 rounded-md transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {roomOnlineUsers.map(onlineUser => (
                  <div key={onlineUser.userId} className="flex items-center gap-3 p-2 hover:bg-gray-700 rounded-lg transition">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-white font-bold">
                      {onlineUser.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">{onlineUser.userName}</div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        オンライン
                      </div>
                    </div>
                    {onlineUser.userRole === 'INSTRUCTOR' && (
                      <span className="text-xs bg-yellow-400/20 text-yellow-400 px-2 py-1 rounded-full">講師</span>
                    )}
                  </div>
                ))}
                
                {roomOnlineUsers.length === 0 && (
                  <div className="text-center text-gray-400 mt-8">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>オンラインユーザーがいません</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Channel Header */}
        <div className="h-16 px-4 md:px-6 flex items-center justify-between border-b border-gray-700 bg-black/40 backdrop-blur-sm shadow-sm mt-12">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Hash className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-white text-base md:text-lg truncate block">
                {selectedDmUser ? 
                  roomOnlineUsers.find(u => u.userId === selectedDmUser)?.userName || 'DM' 
                  : selectedChannel
                }
              </span>
              <div className="text-xs text-gray-400 hidden md:block">
                {selectedDmUser ? 
                  'ダイレクトメッセージ' 
                  : channels.find(c => c.id === selectedChannel)?.description
                }
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 md:gap-3">
            <button 
              className={`p-2 rounded-lg transition ${
                showUsersSidebar 
                  ? 'text-yellow-400 bg-yellow-400/10' 
                  : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10'
              }`}
              title="メンバー一覧"
              onClick={() => setShowUsersSidebar(!showUsersSidebar)}
            >
              <Users className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 md:px-6 py-4 space-y-4 md:space-y-6">
            {(!messages || messages.length === 0) ? (
              <div className="text-center text-gray-400 mt-16">
                <div className="w-16 h-16 bg-yellow-400/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Hash className="w-8 h-8 text-yellow-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {selectedDmUser ? 
                    `${roomOnlineUsers.find(u => u.userId === selectedDmUser)?.userName}とのDM` 
                    : `#${selectedChannel} へようこそ`
                  }
                </h3>
                <p className="text-gray-400">
                  {selectedDmUser ? 
                    'ダイレクトメッセージの始まりです。' 
                    : `これは #${selectedChannel} チャンネルの始まりです。`
                  }
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="flex gap-2 md:gap-4 hover:bg-gray-800 px-2 md:px-3 py-2 rounded-xl transition group">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-md">
                    <span className="text-white font-bold text-xs md:text-sm">
                      {message.userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 md:gap-3 mb-1 flex-wrap">
                      <span className="font-bold text-white text-sm md:text-base">{message.userName}</span>
                      <span className="text-xs text-gray-400">
                        {formatTime(message.createdAt)}
                      </span>
                      {message.userRole === 'INSTRUCTOR' && (
                        <span className="text-xs bg-gradient-to-r from-yellow-400 to-amber-600 text-white px-1.5 md:px-2 py-0.5 md:py-1 rounded-full shadow-sm">
                          講師
                        </span>
                      )}
                    </div>
                    <div className="text-gray-300 leading-relaxed text-sm md:text-base">
                      {message.type === 'ANNOUNCEMENT' && (
                        <span className="text-yellow-400 font-semibold mr-1">📢</span>
                      )}
                      {message.type === 'QUESTION' && (
                        <span className="text-blue-400 font-semibold mr-1">❓</span>
                      )}
                      <span className="break-words" dangerouslySetInnerHTML={{ __html: processMentions(message.content) }}></span>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {/* Typing Indicator */}
            {typingUsers.size > 0 && (
              <div className="flex items-center gap-3 px-6 py-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="text-gray-400 text-sm">
                  {Array.from(typingUsers).length === 1 
                    ? '誰かが入力中...'
                    : `${Array.from(typingUsers).length}人が入力中...`
                  }
                </span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className={`mx-4 md:mx-6 mb-2 p-3 rounded-lg flex items-center gap-2 ${
            error.type === 'error' ? 'bg-red-500/20 border border-red-500/30 text-red-400' :
            error.type === 'warning' ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-400' :
            'bg-blue-500/20 border border-blue-500/30 text-blue-400'
          }`}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm flex-1">{error.message}</span>
            <button
              onClick={() => setError(null)}
              className="text-gray-400 hover:text-white p-1 rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Connection Status */}
        {loadingStates.connecting && (
          <div className="mx-4 md:mx-6 mb-2 p-3 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">サーバーに接続中...</span>
          </div>
        )}

        {/* Message Input */}
        <div className="px-4 md:px-6 py-4 border-t border-gray-700 bg-black/40 backdrop-blur-sm">
          <form onSubmit={handleSendMessage} className="flex gap-2 md:gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={messageInput}
                onChange={handleInputChange}
                placeholder={selectedDmUser ? 
                  `${roomOnlineUsers.find(u => u.userId === selectedDmUser)?.userName}にメッセージを送信... (@ユーザー名 でメンション)` 
                  : `#${selectedChannel} にメッセージを送信... (@ユーザー名 でメンション)`
                }
                className="w-full bg-gray-800 border border-gray-600 text-white px-3 md:px-4 py-2 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-amber-500 transition shadow-sm text-sm md:text-base pr-12"
                disabled={!isConnected || loadingStates.sendingMessage}
                maxLength={1000}
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                {messageInput.length}/1000
              </div>
              
              {/* Mention suggestions */}
              {messageInput.includes('@') && messageInput.split('@').pop() && (
                <div className="absolute bottom-full mb-2 left-0 right-0 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-32 overflow-y-auto z-10">
                  {roomOnlineUsers
                    .filter(onlineUser => 
                      onlineUser.userName.toLowerCase().includes(messageInput.split('@').pop()!.toLowerCase()) &&
                      onlineUser.userId !== user?.id
                    )
                    .slice(0, 5)
                    .map(mentionUser => (
                      <button
                        key={mentionUser.userId}
                        onClick={() => {
                          const parts = messageInput.split('@')
                          parts[parts.length - 1] = mentionUser.userName + ' '
                          setMessageInput(parts.join('@'))
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-700 flex items-center gap-2 text-sm"
                      >
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-white text-xs font-bold">
                          {mentionUser.userName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white">{mentionUser.userName}</span>
                        {mentionUser.userRole === 'INSTRUCTOR' && (
                          <span className="text-xs bg-yellow-400/20 text-yellow-400 px-1.5 py-0.5 rounded">講師</span>
                        )}
                      </button>
                    ))
                  }
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!messageInput.trim() || !isConnected || loadingStates.sendingMessage}
              className="px-3 md:px-4 py-2 md:py-3 bg-gradient-to-r from-yellow-400 to-amber-600 text-white rounded-xl hover:from-yellow-500 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loadingStates.sendingMessage ? (
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
              ) : (
                <Send className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </button>
          </form>
        </div>
      </div>
      
      {/* Channel Creation Modal */}
    {showChannelModal && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div 
          ref={channelModalRef}
          tabIndex={-1}
          className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700 focus:outline-none"
        >
          <h3 className="text-white font-bold text-lg mb-4">新しいチャンネルを作成</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                チャンネル名
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="チャンネル名を入力"
                  className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-amber-500 pr-16"
                  maxLength={50}
                  autoFocus
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                  {newChannelName.length}/50
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                説明（任意）
              </label>
              <div className="relative">
                <textarea
                  value={newChannelDescription}
                  onChange={(e) => setNewChannelDescription(e.target.value)}
                  placeholder="チャンネルの説明を入力"
                  className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-amber-500 resize-none pr-16"
                  rows={3}
                  maxLength={100}
                />
                <div className="absolute right-2 bottom-2 text-xs text-gray-500">
                  {newChannelDescription.length}/100
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setShowChannelModal(false)}
              className="flex-1 px-4 py-2 text-gray-400 hover:text-white border border-gray-600 hover:border-gray-500 rounded-lg transition"
            >
              キャンセル
            </button>
            <button
              onClick={handleCreateChannel}
              disabled={!newChannelName.trim() || loadingStates.creatingChannel}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-600 text-white rounded-lg hover:from-yellow-500 hover:to-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loadingStates.creatingChannel ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  作成中...
                </>
              ) : (
                '作成'
              )}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Delete Confirmation Modal */}
    {showDeleteConfirm.show && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div 
          ref={deleteConfirmRef}
          tabIndex={-1}
          className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700 focus:outline-none"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h3 className="text-white font-bold text-lg">チャンネルを削除</h3>
          </div>
          
          <p className="text-gray-300 mb-6">
            本当に「{showDeleteConfirm.channelName}」チャンネルを削除しますか？
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteConfirm({ show: false, channelId: '', channelName: '' })}
              disabled={loadingStates.deletingChannel}
              className="flex-1 px-4 py-2 text-gray-400 hover:text-white border border-gray-600 hover:border-gray-500 rounded-lg transition disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              onClick={() => handleDeleteChannel(showDeleteConfirm.channelId)}
              disabled={loadingStates.deletingChannel}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loadingStates.deletingChannel ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  削除中...
                </>
              ) : (
                '削除'
              )}
            </button>
          </div>
        </div>
      </div>
    )}
    
    {/* Profile Edit Modal */}
    {showProfileModal && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div 
          ref={profileModalRef}
          tabIndex={-1}
          className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700 focus:outline-none"
        >
          <h3 className="text-white font-bold text-lg mb-4">プロフィール設定</h3>
          
          <div className="space-y-4">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-white text-xl font-bold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                表示名
              </label>
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="表示名を入力"
                className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-amber-500"
                maxLength={50}
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                アバターカラー
              </label>
              <div className="flex gap-2 flex-wrap">
                {['from-yellow-400 to-amber-600', 'from-blue-400 to-blue-600', 'from-green-400 to-green-600', 'from-red-400 to-red-600', 'from-purple-400 to-purple-600', 'from-pink-400 to-pink-600'].map((gradient) => (
                  <button
                    key={gradient}
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} border-2 border-transparent hover:border-white transition`}
                  />
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                通知音
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={playNotificationSound}
                  onChange={(e) => setPlayNotificationSound(e.target.checked)}
                  className="rounded border-gray-600 bg-gray-700 text-yellow-400 focus:ring-yellow-400"
                  id="notification-sound"
                />
                <label htmlFor="notification-sound" className="text-gray-300">
                  新しいメッセージで音を再生
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setShowProfileModal(false)}
              className="flex-1 px-4 py-2 text-gray-400 hover:text-white border border-gray-600 hover:border-gray-500 rounded-lg transition"
            >
              キャンセル
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={loadingStates.sendingMessage}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-600 text-white rounded-lg hover:from-yellow-500 hover:to-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loadingStates.sendingMessage ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存'
              )}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Room Password Modal */}
    {showPasswordModal && passwordPromptRoom && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div 
          ref={passwordModalRef}
          tabIndex={-1}
          className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700 focus:outline-none"
        >
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-6 h-6 text-yellow-400" />
            <h3 className="text-white font-bold text-lg">鍵付きルームのパスワード</h3>
          </div>
          
          <p className="text-gray-300 mb-6">
            「{passwordPromptRoom.name}」に参加するにはパスワードが必要です。
          </p>
          
          <form onSubmit={(e) => {
            e.preventDefault()
            handleRoomPasswordSubmit()
          }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  パスワード
                </label>
                <input
                  type="password"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  placeholder="パスワードを入力してください"
                  className="w-full bg-gray-700 border border-gray-600 text-black px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-amber-500"
                  autoFocus
                  required
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false)
                  setPasswordPromptRoom(null)
                  setRoomPassword('')
                }}
                disabled={loadingStates.sendingMessage}
                className="flex-1 px-4 py-2 text-gray-400 hover:text-white border border-gray-600 hover:border-gray-500 rounded-lg transition disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={!roomPassword.trim() || loadingStates.sendingMessage}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-600 text-white rounded-lg hover:from-yellow-500 hover:to-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingStates.sendingMessage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    確認中...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    参加
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </div>
  )
}
'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { useSocketStore } from '@/lib/socket'
import { authApi } from '@/lib/api'
import { Send, Users, Hash, AtSign, Settings, Plus, Search, Mic, Menu, X, AlertTriangle, Loader2, RefreshCw, Lock, UserPlus, Key, MessageCircle, Upload, Trash2, Home, BookOpen } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import { format } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'
import DMSidebar from '@/components/chat/DMSidebar'
import DMChat from '@/components/chat/DMChat'
import { fireChatOpenedEvent } from '@/lib/chat-notifications'

// Types for better TypeScript support
interface Channel {
  id: string
  name: string
  type: 'text'
  description: string
  slug?: string
  roomType?: string
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
  const { user, isAuthenticated, updateUser } = useAuthStore()
  const {
    socket,
    isConnected,
    currentRoom,
    currentChannel,
    messagesByChannel,
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
  const [showChannelModal, setShowChannelModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [channels, setChannels] = useState<Channel[]>([])
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelDescription, setNewChannelDescription] = useState('')
  const [dmUsers, setDmUsers] = useState<{id: string, name: string, unread?: number}[]>([])
  const [selectedDmUser, setSelectedDmUser] = useState<string | null>(null)
  const [selectedDmRoomId, setSelectedDmRoomId] = useState<string>('')
  const [showDMSidebar, setShowDMSidebar] = useState(false)
  const [lastReadTimestamps, setLastReadTimestamps] = useState<Record<string, number>>({})
  const [dmUnreadCounts, setDmUnreadCounts] = useState<Record<string, number>>({})
  const [dmLastReadTimestamps, setDmLastReadTimestamps] = useState<Record<string, number>>({})
  const [dmTotalUnreadCount, setDmTotalUnreadCount] = useState(0) // DM全体の未読数
  const [channelTotalUnreadCount, setChannelTotalUnreadCount] = useState(0) // 一般チャンネルの総未読数
  const [channelUnreadCounts, setChannelUnreadCounts] = useState<Record<string, number>>({}) // チャンネル別の未読数
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
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [newUserName, setNewUserName] = useState('')
  const [selectedAvatarColor, setSelectedAvatarColor] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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
  
  // Mention functionality states
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [availableUsers, setAvailableUsers] = useState<{
    id: string, 
    name: string, 
    role: string,
    avatarColor?: string | null,
    avatarImage?: string | null
  }[]>([])
  const [cursorPosition, setCursorPosition] = useState(0)
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0)
  
  // Remove localStorage-based authentication - rely on server-side membership only
  const [authenticatedRooms, setAuthenticatedRooms] = useState<Set<string>>(new Set())
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Get current messages (channel, DM, or private room)
  const messages = selectedDmUser && currentRoom?.roomType === 'dm' 
    ? (getDmMessages ? getDmMessages(currentRoom.roomId) || [] : [])
    : (getChannelMessages ? getChannelMessages(selectedChannel) || [] : [])
  
  // Debug log (temporary)
  // console.log('Selected channel:', selectedChannel, 'Messages count:', messages.length, 'Current room:', currentRoom)

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

  // Load available users for mentions
  const loadAvailableUsers = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/dm/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const users = await response.json()
        setAvailableUsers(users)
      }
    } catch (error) {
      console.error('Failed to load available users:', error)
    }
  }

  // Load all unread counts (DM + channels)
  const loadAllUnreadCounts = async () => {
    try {
      console.log('🔥 [loadAllUnreadCounts] Fetching all unread counts from /api/chat/unread-count...')
      
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/chat/unread-count', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const dmValues = Object.values(data.dmUnreadCounts || {}) as number[]
        const totalDmUnread = dmValues.reduce((sum: number, count: number) => sum + count, 0)
        const channelUnreadByChannel = data.channelUnreadCounts || {}
        const channelValues = Object.values(channelUnreadByChannel) as number[]
        const channelUnread = channelValues.reduce((sum: number, count: number) => sum + count, 0)
        
        console.log('🔥 [loadAllUnreadCounts] Server response:', data)
        console.log('🔥 [loadAllUnreadCounts] Total channel unread count:', channelUnread)
        console.log('🔥 [loadAllUnreadCounts] Channel unread breakdown:', channelUnreadByChannel)
        console.log('🔥 [loadAllUnreadCounts] Total DM unread count:', totalDmUnread)
        console.log('🔥 [loadAllUnreadCounts] DM breakdown:', data.dmUnreadCounts)
        console.log('🔥 [loadAllUnreadCounts] Previous channelUnreadCounts state before update:', channelUnreadCounts)
        
        setChannelTotalUnreadCount(channelUnread)
        setChannelUnreadCounts(channelUnreadByChannel)
        setDmTotalUnreadCount(totalDmUnread)
        setDmUnreadCounts(data.dmUnreadCounts || {})
      } else {
        console.error('🔥 [loadAllUnreadCounts] API failed with status:', response.status)
      }
    } catch (error) {
      console.error('🔥 [loadAllUnreadCounts] Exception:', error)
    }
  }

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    } else {
      // Fetch chat rooms when authenticated
      fetchChatRooms()
      loadAvailableUsers()

      // Fire chat opened event to update last opened timestamp and notify header
      fireChatOpenedEvent()

      // 初回ロード後、5秒後に初回ロードフラグを解除
      setTimeout(() => {
        setIsInitialLoad(false)
      }, 5000)
    }
  }, [isAuthenticated, router])

  // Poll for all unread counts periodically
  useEffect(() => {
    if (!isAuthenticated) return

    // Initial load
    loadAllUnreadCounts()

    // Poll every 30 seconds
    const interval = setInterval(() => {
      loadAllUnreadCounts()
    }, 30000)

    return () => clearInterval(interval)
  }, [isAuthenticated])

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
      // Simply highlight all mentions without checking online users
      return `<span class="bg-yellow-400/20 text-yellow-400 px-1 rounded font-semibold">${match}</span>`
    })
  }

  // Handle typing indicator with error handling and mention detection
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const cursorPos = e.target.selectionStart || 0
    
    // Character limit validation
    if (value.length > 1000) {
      setError({ message: 'メッセージは1000文字以内で入力してください', type: 'warning' })
      return
    }
    
    setMessageInput(value)
    setCursorPosition(cursorPos)
    setError(null)
    
    // Check for @ mention
    const textBeforeCursor = value.substring(0, cursorPos)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)
    
    if (mentionMatch) {
      const query = mentionMatch[1].toLowerCase()
      setMentionQuery(query)
      setShowMentionSuggestions(true)
      setSelectedMentionIndex(0)
    } else {
      setShowMentionSuggestions(false)
      setMentionQuery('')
      setSelectedMentionIndex(0)
    }
    
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

  // Handle mention selection
  const handleMentionSelect = (userName: string) => {
    const textBeforeCursor = messageInput.substring(0, cursorPosition)
    const textAfterCursor = messageInput.substring(cursorPosition)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)
    
    if (mentionMatch) {
      const beforeMention = textBeforeCursor.substring(0, mentionMatch.index)
      const newText = beforeMention + `@${userName} ` + textAfterCursor
      setMessageInput(newText)
      setShowMentionSuggestions(false)
      setMentionQuery('')
    }
  }

  // Filter users for mentions
  const filteredUsers = availableUsers.filter(user => 
    user.name.toLowerCase().includes(mentionQuery)
  ).slice(0, 5) // Limit to 5 suggestions

  // Handle keyboard navigation for mentions in input field
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showMentionSuggestions && filteredUsers.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedMentionIndex(prev => 
            prev < filteredUsers.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedMentionIndex(prev => 
            prev > 0 ? prev - 1 : filteredUsers.length - 1
          )
          break
        case 'Enter':
        case 'Tab':
          e.preventDefault()
          handleMentionSelect(filteredUsers[selectedMentionIndex].name)
          break
        case 'Escape':
          setShowMentionSuggestions(false)
          setMentionQuery('')
          break
      }
    }
  }

  // Check if message mentions current user
  const isUserMentioned = (messageContent: string, userName: string) => {
    return messageContent.includes(`@${userName}`)
  }

  // Format message content with mention highlights
  const formatMessageContent = (content: string, isCurrentUserMentioned: boolean) => {
    // Highlight mentions
    const mentionRegex = /@(\w+)/g
    const formattedContent = content.replace(mentionRegex, (match, username) => {
      const isCurrentUser = username === user?.name
      return `<span class="${isCurrentUser ? 'bg-blue-600/30 text-blue-300 px-1 rounded font-semibold' : 'bg-yellow-400/20 text-yellow-400 px-1 rounded font-semibold'}">${match}</span>`
    })

    return { __html: formattedContent }
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
    
    setLoadingStates(prev => ({ ...prev, sendingMessage: true }))
    setError(null)
    
    try {
      sendMessage(trimmedMessage)
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
    // Find the room data to check if it's private
    const roomData = channels.find(ch => ch.id === channelId)
    const isPrivateRoom = roomData?.roomType === 'private'
    
    console.log('🔒 Channel change:', { channelId, roomData, isPrivateRoom })
    
    if (isPrivateRoom && roomData) {
      // Check server-side membership status
      try {
        const checkResponse = await fetch(`/api/private-rooms/${roomData.slug}/check-membership`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        })
        
        const membershipData = await checkResponse.json()
        console.log('🔒 Membership check:', membershipData)
        
        if (!checkResponse.ok || !membershipData.isMember) {
          // User is not a member, show password prompt
          console.log('🔒 User is not a member, showing password prompt')
          setPasswordPromptRoom({ 
            id: channelId, 
            name: roomData.name, 
            slug: roomData.slug
          })
          setShowPasswordModal(true)
          return
        }
        
        console.log('🔒 User is already a member, allowing access')
        // User is already a member, allow access
        setAuthenticatedRooms(prev => new Set(Array.from(prev).concat([channelId])))
      } catch (error) {
        console.error('🔒 Failed to check membership:', error)
        // On error, show password prompt to be safe
        setPasswordPromptRoom({ 
          id: channelId, 
          name: roomData.name, 
          slug: roomData.slug
        })
        setShowPasswordModal(true)
        return
      }
    }
    
    // Find the actual channel data to get the proper slug/ID
    const targetChannel = channels.find(ch => ch.id === channelId)
    const actualRoomId = targetChannel?.slug || channelId
    const roomType = targetChannel?.roomType || 'course'
    
    // For private rooms, set selectedChannel to match the actualRoomId that will be used as the currentRoom.roomId
    // This ensures messages are stored and retrieved with the same key
    const channelKey = (roomType === 'private') ? actualRoomId : channelId
    
    setSelectedChannel(channelKey)
    setSelectedDmUser(null)
    
    // Update last read timestamp for this channel
    setLastReadTimestamps(prev => ({
      ...prev,
      [channelKey]: Date.now()
    }))
    
    // Clear unread count for this channel
    setChannelUnreadCounts(prev => ({
      ...prev,
      [channelKey]: 0
    }))
    
    // Mark messages in this channel as read on server
    // ただし、初回ロード時は少し遅延させる
    const markAsRead = async () => {
      try {
        console.log('🔥 [handleChannelChange] Marking channel as read:', { channelKey, roomType, actualRoomId })

        const markReadResponse = await fetch('/api/chat/mark-channel-read', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({
            channelId: roomType === 'course' ? channelKey : null,
            lessonId: roomType === 'lesson' ? actualRoomId : null,
            privateRoomId: roomType === 'private' ? actualRoomId : null
          })
        })

        if (markReadResponse.ok) {
          const result = await markReadResponse.json()
          console.log('🔥 [handleChannelChange] Channel marked as read:', result)
          // Update channel total unread count
          setChannelTotalUnreadCount(prev => Math.max(0, prev - (result.markedCount || 0)))
          // Clear this specific channel's unread count only if there were actually unread messages
          if (result.markedCount > 0) {
            setChannelUnreadCounts(prev => ({
              ...prev,
              [channelKey]: 0
            }))
            console.log('🔥 [handleChannelChange] Cleared unread count for channel:', channelKey)
          }
        } else {
          console.error('🔥 [handleChannelChange] Failed to mark channel as read:', markReadResponse.status)
        }
      } catch (error) {
        console.error('🔥 [handleChannelChange] Error marking channel as read:', error)
      }
    }

    if (isConnected) {
      if (targetChannel) {
        console.log('Joining channel with actual ID:', actualRoomId, 'roomType:', roomType, 'from channel:', targetChannel)
        joinChannel(actualRoomId, roomType as 'lesson' | 'course' | 'dm' | 'private')

        // メッセージ取得後に既読マーク
        if (isInitialLoad) {
          // 初回ロード時は5秒遅延してマーク
          console.log('🔥 [handleChannelChange] Initial load - delaying mark as read')
          setTimeout(markAsRead, 5000)
        } else {
          // 通常のチャンネル切り替えは2秒遅延してマーク（メッセージ表示後）
          setTimeout(markAsRead, 2000)
        }
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

  // Avatar functions
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setError({ message: 'ファイルサイズが5MBを超えています', type: 'error' })
        return
      }
      
      setAvatarFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveAvatar = async () => {
    // If it's just a preview, remove it
    if (avatarPreview && !user?.avatarImage) {
      setAvatarFile(null)
      setAvatarPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // If user has an existing avatar, delete it from server
    if (user?.avatarImage) {
      try {
        setLoadingStates(prev => ({ ...prev, sendingMessage: true }))
        
        const response = await fetch('/api/user/avatar', {
          method: 'DELETE',
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          updateUser(data.user)
          setError({ message: 'アバター画像を削除しました', type: 'info' })
        }
      } catch (error) {
        setError({ message: 'アバターの削除に失敗しました', type: 'error' })
      } finally {
        setLoadingStates(prev => ({ ...prev, sendingMessage: false }))
      }
    }
    
    // Clear preview states
    setAvatarFile(null)
    setAvatarPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSaveProfile = async () => {
    const trimmedName = newUserName.trim()
    
    if (!trimmedName) {
      setError({ message: '名前を入力してください', type: 'warning' })
      return
    }
    
    setLoadingStates(prev => ({ ...prev, sendingMessage: true }))
    setError(null)
    
    try {
      // First upload avatar if there's a file
      if (avatarFile) {
        const formData = new FormData()
        formData.append('avatar', avatarFile)
        
        const uploadResponse = await fetch('/api/user/avatar', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        })
        
        if (!uploadResponse.ok) {
          throw new Error('アバターのアップロードに失敗しました')
        }
        
        const uploadData = await uploadResponse.json()
        if (uploadData.user) {
          // Update user state with new avatar image
          updateUser(uploadData.user)
        }
      }
      
      // Update profile data
      const updateData: any = { name: trimmedName }
      if (selectedAvatarColor) {
        updateData.avatarColor = selectedAvatarColor
        updateData.avatarImage = null // Clear image when color is selected
      }
      
      const response = await authApi.updateProfile(updateData)
      if (response.data.user) {
        // Update local user state immediately
        updateUser(response.data.user)
        
        setShowProfileModal(false)
        setError({ message: 'プロフィールを更新しました', type: 'info' })
        
        // Reset avatar states
        setAvatarFile(null)
        setAvatarPreview(null)
        setSelectedAvatarColor('')
      }
    } catch (err: any) {
      setError({ 
        message: err.response?.data?.error || 'プロフィールの更新に失敗しました', 
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
        const data = await response.json()
        
        // Now join the private room as a member
        const roomSlug = passwordPromptRoom.slug || passwordPromptRoom.name.toLowerCase().replace(/\s+/g, '-')
        
        try {
          const joinResponse = await fetch(`/api/private-rooms/${data.roomId}/join`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            },
            body: JSON.stringify({
              accessKey: roomPassword
            })
          })
          
          if (joinResponse.ok) {
            // Add to authenticated rooms (session only, no localStorage)
            const newAuthenticatedRooms = new Set(Array.from(authenticatedRooms).concat([passwordPromptRoom.id]))
            setAuthenticatedRooms(newAuthenticatedRooms)
            
            // Join the room - use roomSlug as selectedChannel since that's what currentRoom.roomId will be
            setSelectedChannel(roomSlug)
            setSelectedDmUser(null)
            if (isConnected) {
              // Use private room type for socket connection
              joinChannel(roomSlug, 'private')
            }
            
            // Close modal and reset state
            setShowPasswordModal(false)
            setPasswordPromptRoom(null)
            setRoomPassword('')
            setError({ message: 'ルームに参加しました', type: 'info' })
          } else {
            const joinData = await joinResponse.json()
            setError({ message: joinData.error || 'ルームへの参加に失敗しました', type: 'error' })
          }
        } catch (joinError) {
          console.error('Failed to join room:', joinError)
          setError({ message: 'ルームへの参加に失敗しました', type: 'error' })
        }
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

  // Handle DM button click with mark as read functionality
  const handleDMButtonClick = async () => {
    console.log('🔥 [handleDMButtonClick] DM button clicked, total unread:', dmTotalUnreadCount)
    
    // Mark all DM rooms as read if there are unread messages
    if (dmTotalUnreadCount > 0 && dmUnreadCounts) {
      console.log('🔥 [handleDMButtonClick] Marking all DM rooms as read:', dmUnreadCounts)
      
      try {
        const dmRoomIds = Object.keys(dmUnreadCounts).filter(roomId => dmUnreadCounts[roomId] > 0)
        console.log('🔥 [handleDMButtonClick] DM room IDs to mark as read:', dmRoomIds)
        
        // Mark each DM room as read
        for (const dmRoomId of dmRoomIds) {
          console.log('🔥 [handleDMButtonClick] Marking DM room as read:', dmRoomId)
          
          const response = await fetch('/api/chat/mark-channel-read', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            },
            body: JSON.stringify({
              dmRoomId: dmRoomId
            })
          })
          
          console.log('🔥 [handleDMButtonClick] API response status for', dmRoomId, ':', response.status)
          
          if (response.ok) {
            const responseData = await response.json()
            console.log('🔥 [handleDMButtonClick] API response data for', dmRoomId, ':', responseData)
          } else {
            const errorData = await response.text()
            console.error('🔥 [handleDMButtonClick] API failed for', dmRoomId, ':', errorData)
          }
        }
        
        // Update local state immediately
        setDmTotalUnreadCount(0)
        setDmUnreadCounts({})
        
        // Trigger update events
        window.dispatchEvent(new CustomEvent('dm-unread-update'))
        window.dispatchEvent(new CustomEvent('chat-unread-update'))
        
        console.log('🔥 [handleDMButtonClick] Fired update events')
      } catch (error) {
        console.error('🔥 [handleDMButtonClick] Exception:', error)
      }
    }
    
    // Navigate to DM page
    router.push('/dm')
  }
  
  // Keyboard event handlers for accessibility
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (showChannelModal) setShowChannelModal(false)
      if (showProfileModal) setShowProfileModal(false)
      if (showDeleteConfirm.show) setShowDeleteConfirm({ show: false, channelId: '', channelName: '' })
      if (showPasswordModal) {
        setShowPasswordModal(false)
        setPasswordPromptRoom(null)
        setRoomPassword('')
      }
    }
  }, [showChannelModal, showProfileModal, showDeleteConfirm.show, showPasswordModal])
  
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
  
  // Note: Removed redundant useEffect that was causing duplicate mark-channel-read calls
  // The handleChannelChange function already handles marking channels as read when switching

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
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-semibold text-gray-400 tracking-wide">テキストチャンネル</span>
              </div>
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
                  {channelUnreadCounts[channel.id] > 0 && (
                    <div className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1 font-semibold">
                      new
                    </div>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Direct Messages Link */}
          <div className="px-3 py-4 border-t border-gray-700">
            <button
              onClick={handleDMButtonClick}
              className="relative w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">ダイレクトメッセージ</span>
              {dmTotalUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                  NEW
                </span>
              )}
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="px-3 py-3 border-t border-gray-700 bg-gray-800/50">
          <div className="flex items-center gap-3">
            <Avatar user={{
              name: user?.name || 'U',
              avatarColor: user?.avatarColor,
              avatarImage: user?.avatarImage
            }} size="md" />
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
                setSelectedAvatarColor(user?.avatarColor || '')
                setAvatarFile(null)
                setAvatarPreview(null)
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
        
        {/* Channel Header */}
        <div className="h-16 px-4 md:px-6 flex items-center justify-between border-b border-gray-700 bg-black/40 backdrop-blur-sm shadow-sm mt-12">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Hash className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-white text-base md:text-lg truncate block">
                {selectedDmUser ? 
                  'DM' 
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
          
          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <Home size={16} />
              <span className="hidden lg:inline text-sm">ダッシュボード</span>
            </Link>
            <Link
              href="/videos"
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <BookOpen size={16} />
              <span className="hidden lg:inline text-sm">講習</span>
            </Link>
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
                    `DM` 
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
              messages.map((message) => {
                const isCurrentUserMentioned = user ? isUserMentioned(message.content, user.name) : false
                const isOwnMessage = user && message.userId === user.id
                
                return (
                <div 
                  key={message.id} 
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2 md:mb-4`}
                >
                  <div className={`flex gap-2 md:gap-4 max-w-[75%] px-2 md:px-3 py-2 rounded-xl transition group ${
                    isCurrentUserMentioned ? 'bg-blue-600/10 border-l-4 border-blue-500' : 
                    isOwnMessage ? '' : 'hover:bg-gray-800'
                  } ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar (only for other user's messages) */}
                    {!isOwnMessage && (
                      <Avatar 
                        user={{ 
                          name: message.userName,
                          avatarColor: message.avatarColor,
                          avatarImage: message.avatarImage
                        }} 
                        size="lg" 
                        className="md:w-10 md:h-10 shadow-md flex-shrink-0"
                      />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      {/* Header (only for other user's messages or mentions) */}
                      {(!isOwnMessage || isCurrentUserMentioned) && (
                        <div className="flex items-baseline gap-2 md:gap-3 mb-1 flex-wrap">
                          {!isOwnMessage && (
                            <span className="font-bold text-white text-sm md:text-base">{message.userName}</span>
                          )}
                          <span className="text-xs text-gray-400">
                            {formatTime(message.createdAt)}
                          </span>
                          {message.userRole === 'INSTRUCTOR' && (
                            <span className="text-xs bg-gradient-to-r from-yellow-400 to-amber-600 text-white px-1.5 md:px-2 py-0.5 md:py-1 rounded-full shadow-sm">
                              講師
                            </span>
                          )}
                          {isCurrentUserMentioned && (
                            <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full shadow-sm animate-pulse">
                              メンションされました
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Message content */}
                      <div className={`px-3 py-2 md:px-4 md:py-2 text-sm md:text-base ${
                        isOwnMessage
                          ? 'bg-blue-600 text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg rounded-br-sm'
                          : 'bg-gray-700 text-gray-300 rounded-tl-lg rounded-tr-lg rounded-bl-sm rounded-br-lg'
                      }`}>
                        {message.type === 'ANNOUNCEMENT' && (
                          <span className="text-yellow-400 font-semibold mr-1">📢</span>
                        )}
                        {message.type === 'QUESTION' && (
                          <span className="text-blue-400 font-semibold mr-1">❓</span>
                        )}
                        <span 
                          className="break-words leading-relaxed"
                          dangerouslySetInnerHTML={formatMessageContent(message.content, isCurrentUserMentioned)}
                        />
                        {/* Own message timestamp */}
                        {isOwnMessage && (
                          <div className="text-xs text-blue-200 mt-1 text-right">
                            {formatTime(message.createdAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
              })
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
                onKeyDown={handleInputKeyDown}
                placeholder={selectedDmUser ? 
                  `メッセージを送信... (@ユーザー名 でメンション)` 
                  : `#${selectedChannel} にメッセージを送信... (@ユーザー名 でメンション)`
                }
                className="w-full bg-gray-800 border border-gray-600 text-white px-3 md:px-4 py-2 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-amber-500 transition shadow-sm text-sm md:text-base pr-12"
                disabled={!isConnected || loadingStates.sendingMessage}
                maxLength={1000}
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                {messageInput.length}/1000
              </div>
              
              {/* Mention Suggestions Dropdown */}
              {showMentionSuggestions && filteredUsers.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
                  {filteredUsers.map((user, index) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleMentionSelect(user.name)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-700 focus:bg-gray-700 focus:outline-none transition ${
                        index === selectedMentionIndex ? 'bg-gray-700' : ''
                      }`}
                    >
                      <Avatar user={{
                        name: user.name,
                        avatarColor: user.avatarColor,
                        avatarImage: user.avatarImage
                      }} size="sm" className="w-6 h-6" />
                      <div>
                        <div className="text-white text-sm font-medium">{user.name}</div>
                        <div className="text-xs text-gray-400">
                          {user.role === 'ADMIN' ? '管理者' : user.role === 'INSTRUCTOR' ? '講師' : '生徒'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!messageInput.trim() || loadingStates.sendingMessage}
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
            <div className="flex flex-col items-center mb-4">
              <div className="relative mb-3">
                {avatarPreview ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden">
                    <img
                      src={avatarPreview}
                      alt="アバタープレビュー"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <Avatar
                    user={{
                      name: user?.name || '',
                      avatarColor: selectedAvatarColor || user?.avatarColor,
                      avatarImage: user?.avatarImage
                    }}
                    size="xl"
                  />
                )}
              </div>
              
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  画像アップロード
                </button>
                {(avatarPreview || user?.avatarImage) && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    削除
                  </button>
                )}
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
                {[
                  'from-yellow-400 to-amber-600',
                  'from-blue-400 to-blue-600',
                  'from-green-400 to-green-600',
                  'from-red-400 to-red-600',
                  'from-purple-400 to-purple-600',
                  'from-pink-400 to-pink-600',
                  'from-indigo-400 to-indigo-600',
                  'from-teal-400 to-teal-600'
                ].map((gradient) => (
                  <button
                    key={gradient}
                    onClick={() => setSelectedAvatarColor(gradient)}
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} border-2 transition ${
                      selectedAvatarColor === gradient
                        ? 'border-white'
                        : 'border-transparent hover:border-gray-400'
                    }`}
                  />
                ))}
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
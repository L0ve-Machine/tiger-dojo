'use client'

import { io, Socket } from 'socket.io-client'
import { create } from 'zustand'

// Types
export interface ChatMessage {
  id: string
  userId: string
  userName: string
  userRole: string
  content: string
  type: 'TEXT' | 'QUESTION' | 'ANSWER' | 'ANNOUNCEMENT'
  createdAt: Date
  isEdited: boolean
}

export interface OnlineUser {
  userId: string
  userName: string
  userRole: string
  isOnline?: boolean
  connectionCount?: number
}

export interface RoomInfo {
  roomType: 'lesson' | 'course' | 'dm'
  roomId: string
  roomName: string
}

// Socket Store
interface SocketState {
  socket: Socket | null
  isConnected: boolean
  currentRoom: RoomInfo | null
  currentChannel: string
  messagesByChannel: Record<string, ChatMessage[]>
  onlineUsers: OnlineUser[]
  roomOnlineUsers: OnlineUser[]
  typingUsers: Set<string>
  
  // Actions
  connect: (token: string) => void
  disconnect: () => void
  joinRoom: (roomType: 'lesson' | 'course' | 'dm', roomId: string) => void
  joinChannel: (channelId: string) => void
  leaveRoom: () => void
  sendMessage: (content: string, type?: ChatMessage['type']) => void
  startTyping: () => void
  stopTyping: () => void
  clearMessages: () => void
  getChannelMessages: (channelId: string) => ChatMessage[]
  getDmMessages: (dmRoomId: string) => ChatMessage[]
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  currentRoom: null,
  currentChannel: 'general',
  messagesByChannel: {},
  onlineUsers: [],
  roomOnlineUsers: [],
  typingUsers: new Set(),

  connect: (token: string) => {
    const state = get()
    if (state.socket?.connected) return

    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://trade-dojo-fx.com'
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      forceNew: true
    })

    // Connection events
    socket.on('connect', () => {
      console.log('✅ Connected to chat server')
      set({ isConnected: true })
    })

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from chat server')
      set({ isConnected: false })
    })

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error.message)
    })

    // Room events
    socket.on('room_joined', (data: RoomInfo) => {
      console.log('Joined room:', data)
      set({ currentRoom: data })
    })

    socket.on('user_joined', (data: { userId: string; userName: string }) => {
      console.log(`${data.userName} joined the room`)
    })

    socket.on('user_left', (data: { userId: string; userName: string }) => {
      console.log(`${data.userName} left the room`)
    })

    // Message events
    socket.on('new_message', (message: ChatMessage & { channelId?: string }) => {
      set(state => {
        // Use room ID as the key for storing messages
        const roomId = state.currentRoom?.roomId || state.currentChannel
        const updatedMessages = {
          ...state.messagesByChannel,
          [roomId]: [
            ...(state.messagesByChannel[roomId] || []),
            {
              ...message,
              createdAt: new Date(message.createdAt)
            }
          ]
        }
        
        // Clear typing indicator for this user
        const newTypingUsers = new Set(state.typingUsers)
        newTypingUsers.delete(message.userId)
        
        return { 
          messagesByChannel: updatedMessages,
          typingUsers: newTypingUsers
        }
      })
    })

    socket.on('message_history', (data: { messages: ChatMessage[] }) => {
      set(state => {
        const roomId = state.currentRoom?.roomId || state.currentChannel
        return {
          messagesByChannel: {
            ...state.messagesByChannel,
            [roomId]: data.messages.map(msg => ({
              ...msg,
              createdAt: new Date(msg.createdAt)
            }))
          }
        }
      })
    })

    // Typing events
    socket.on('user_typing', (data: { userId: string; userName: string; isTyping: boolean }) => {
      set(state => {
        const newTypingUsers = new Set(state.typingUsers)
        if (data.isTyping) {
          newTypingUsers.add(data.userId)
        } else {
          newTypingUsers.delete(data.userId)
        }
        return { typingUsers: newTypingUsers }
      })
    })

    // Online status events
    socket.on('online_users', (users: OnlineUser[]) => {
      set({ onlineUsers: users })
    })

    socket.on('room_online_users', (users: OnlineUser[]) => {
      set({ roomOnlineUsers: users })
    })

    socket.on('user_status_changed', (data: { userId: string; isOnline: boolean }) => {
      set(state => ({
        onlineUsers: state.onlineUsers.map(user =>
          user.userId === data.userId
            ? { ...user, isOnline: data.isOnline }
            : user
        )
      }))
    })

    // Error events
    socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error.message)
    })

    set({ socket })
  },

  disconnect: () => {
    const { socket, currentRoom } = get()
    
    if (currentRoom) {
      socket?.emit('leave_room', currentRoom)
    }
    
    socket?.disconnect()
    set({
      socket: null,
      isConnected: false,
      currentRoom: null,
      messagesByChannel: {},
      typingUsers: new Set()
    })
  },

  joinRoom: (roomType: 'lesson' | 'course' | 'dm', roomId: string) => {
    const { socket, currentRoom } = get()
    
    // Leave current room if in one
    if (currentRoom) {
      socket?.emit('leave_room', currentRoom)
    }

    // Clear typing for room switching
    set({ typingUsers: new Set() })

    // Join new room
    socket?.emit('join_room', { roomType, roomId })
  },

  leaveRoom: () => {
    const { socket, currentRoom } = get()
    
    if (currentRoom) {
      socket?.emit('leave_room', currentRoom)
      set({
        currentRoom: null,
        roomOnlineUsers: [],
        typingUsers: new Set()
      })
    }
  },

  sendMessage: (content: string, type: ChatMessage['type'] = 'TEXT') => {
    const { socket, currentRoom } = get()
    
    if (!currentRoom) {
      console.error('Not in a room')
      return
    }

    socket?.emit('send_message', {
      roomType: currentRoom.roomType,
      roomId: currentRoom.roomId,
      content,
      type
    })
  },

  startTyping: () => {
    const { socket, currentRoom } = get()
    
    if (currentRoom) {
      socket?.emit('typing_start', {
        roomType: currentRoom.roomType,
        roomId: currentRoom.roomId
      })
    }
  },

  stopTyping: () => {
    const { socket, currentRoom } = get()
    
    if (currentRoom) {
      socket?.emit('typing_stop', {
        roomType: currentRoom.roomType,
        roomId: currentRoom.roomId
      })
    }
  },

  joinChannel: (channelId: string) => {
    const { socket, currentRoom } = get()
    
    // Leave current room if in one
    if (currentRoom) {
      socket?.emit('leave_room', currentRoom)
    }
    
    // Clear typing for room switching
    set({ typingUsers: new Set() })
    
    // Join the specific channel room - use channel ID directly as room ID
    socket?.emit('join_room', { roomType: 'course', roomId: channelId })
    
    set({ currentChannel: channelId })
  },

  clearMessages: () => {
    set({ messagesByChannel: {} })
  },

  getChannelMessages: (channelId: string) => {
    const state = get()
    return state.messagesByChannel[channelId] || []
  },

  getDmMessages: (dmRoomId: string) => {
    const state = get()
    return state.messagesByChannel[dmRoomId] || []
  }
}))

// Hook for easy socket management
export const useSocket = () => {
  const store = useSocketStore()
  
  // Auto-connect on mount if authenticated
  React.useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token && !store.isConnected && !store.socket) {
      store.connect(token)
    }

    return () => {
      // Don't auto-disconnect on unmount to maintain connection across pages
      // User can manually disconnect if needed
    }
  }, [])

  return store
}

// Import React for useEffect
import React from 'react'
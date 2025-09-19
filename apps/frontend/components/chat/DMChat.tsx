'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Send, User, ArrowLeft } from 'lucide-react'
import { useSocketStore } from '@/lib/socket'
import { format } from 'date-fns'
import Avatar from '@/components/ui/Avatar'

interface DMUser {
  id: string
  name: string
  role: string
  avatarColor?: string | null
  avatarImage?: string | null
}

interface DMMessage {
  id: string
  userId: string
  userName: string
  userRole: string
  avatarColor?: string | null
  avatarImage?: string | null
  content: string
  type: string
  createdAt: string
  isEdited: boolean
}

interface DMChatProps {
  dmRoomId: string
  otherUser: DMUser
  currentUserId: string
  onBack: () => void
}

export default function DMChat({ dmRoomId, otherUser, currentUserId, onBack }: DMChatProps) {
  const [messages, setMessages] = useState<DMMessage[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [lastReadTimestamp, setLastReadTimestamp] = useState<number>(Date.now())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { socket, isConnected, sendMessage } = useSocketStore()

  // Load conversation history
  useEffect(() => {
    loadConversation()
  }, [dmRoomId])

  // Join DM room via socket
  useEffect(() => {
    if (isConnected && socket && dmRoomId) {
      console.log('Joining DM room:', dmRoomId)
      
      // Join the DM room
      socket.emit('join_room', {
        roomType: 'dm',
        roomId: dmRoomId
      })

      // Listen for message history
      const handleMessageHistory = (data: { channelId: string, messages: DMMessage[] }) => {
        if (data.channelId === dmRoomId) {
          console.log('Received DM history:', data.messages)
          setMessages(data.messages)
          scrollToBottom()
        }
      }

      socket.on('message_history', handleMessageHistory)

      return () => {
        socket.off('message_history', handleMessageHistory)
        
        // Leave the DM room
        socket.emit('leave_room', {
          roomType: 'dm',
          roomId: dmRoomId
        })
      }
    }
  }, [isConnected, socket, dmRoomId])

  const loadConversation = async () => {
    try {
      setLoading(true)
      console.log('Loading conversation for otherUser:', otherUser.id)
      
      const response = await fetch(`/api/dm/conversation/${otherUser.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })
      
      console.log('Conversation API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Loaded conversation data:', data)
        setMessages(data.messages || [])
        scrollToBottom()
      } else {
        const errorText = await response.text()
        console.error('Failed to load conversation:', response.status, errorText)
      }
    } catch (err) {
      console.error('Failed to load conversation:', err)
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleSendMessage = async () => {
    if (!messageInput.trim() || sending) return

    setSending(true)
    const content = messageInput.trim()
    
    try {
      // Try Socket.io first if connected
      if (isConnected && socket?.connected) {
        socket.emit('send_message', {
          roomType: 'dm',
          roomId: dmRoomId,
          content,
          type: 'TEXT'
        })
        setMessageInput('')
      } else {
        // Fallback to HTTP API
        console.log('Socket not connected, using HTTP API for DM')
        
        const response = await fetch('/api/dm/message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({
            content,
            otherUserId: otherUser.id
          })
        })

        if (response.ok) {
          const data = await response.json()
          console.log('DM sent via HTTP API:', data)
          
          // Add message to local state immediately
          const message = data.message
          setMessages(prev => [...prev, message])
          setMessageInput('')
          scrollToBottom()
        } else {
          console.error('Failed to send DM via HTTP API:', response.statusText)
          throw new Error('Failed to send message')
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'text-red-400'
      case 'INSTRUCTOR': return 'text-blue-400'
      default: return 'text-green-400'
    }
  }

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'HH:mm')
    } catch {
      return ''
    }
  }

  // Check if message is new (arrived after last read timestamp)
  const isNewMessage = (messageCreatedAt: string, messageUserId: string) => {
    const messageTime = new Date(messageCreatedAt).getTime()
    return messageTime > lastReadTimestamp && messageUserId !== currentUserId
  }

  // Update last read timestamp when component mounts or dm room changes
  useEffect(() => {
    setLastReadTimestamp(Date.now())
  }, [dmRoomId])

  // Mark DM messages as read when opening this chat
  useEffect(() => {
    if (!dmRoomId || !currentUserId) return

    const markDMAsRead = async () => {
      try {
        await fetch('/api/chat/mark-channel-read', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({
            dmRoomId: dmRoomId
          })
        })
        console.log('Marked DM as read:', dmRoomId)
        
        // Trigger unread count update
        window.dispatchEvent(new CustomEvent('dm-unread-update'))
      } catch (error) {
        console.error('Failed to mark DM messages as read:', error)
      }
    }

    // Small delay to ensure messages are loaded before marking as read
    const timer = setTimeout(markDMAsRead, 500)
    return () => clearTimeout(timer)
  }, [dmRoomId, currentUserId])

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      if (date.toDateString() === today.toDateString()) {
        return '今日'
      } else if (date.toDateString() === yesterday.toDateString()) {
        return '昨日'
      } else {
        return format(date, 'M月d日')
      }
    } catch {
      return ''
    }
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups: { [key: string]: DMMessage[] }, message) => {
    const date = new Date(message.createdAt).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(message)
    return groups
  }, {})

  return (
    <div className="flex-1 flex flex-col bg-gray-800 h-full">
      {/* Header */}
      <div className="p-3 md:p-4 border-b border-gray-700 flex items-center gap-3 md:gap-4 flex-shrink-0">
        <button
          onClick={onBack}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors md:hidden"
        >
          <ArrowLeft size={20} />
        </button>
        
        <Avatar user={{
          name: otherUser.name,
          avatarColor: otherUser.avatarColor,
          avatarImage: otherUser.avatarImage
        }} size="lg" className="w-8 h-8 md:w-10 md:h-10" />
        
        <div className="flex-1 min-w-0">
          <h2 className="text-base md:text-lg font-semibold text-white truncate">{otherUser.name}</h2>
          <p className={`text-xs md:text-sm ${getRoleColor(otherUser.role)}`}>
            {otherUser.role === 'ADMIN' ? '管理者' : otherUser.role === 'INSTRUCTOR' ? '講師' : '生徒'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 md:space-y-4">
        {loading ? (
          <div className="text-center text-gray-400 py-8">
            メッセージを読み込み中...
          </div>
        ) : Object.keys(groupedMessages).length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <User size={32} className="mx-auto mb-4 opacity-50 md:w-12 md:h-12" />
            <p className="text-sm md:text-base">まだメッセージがありません</p>
            <p className="text-xs md:text-sm text-gray-500 mt-1">最初のメッセージを送信してみましょう！</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dayMessages]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-4">
                <div className="bg-gray-700 px-3 py-1 rounded-full text-xs text-gray-300">
                  {formatDate(dayMessages[0].createdAt)}
                </div>
              </div>

              {/* Messages for this date */}
              {dayMessages.map((message, index) => {
                const isOwnMessage = message.userId === currentUserId
                const showAvatar = index === 0 || dayMessages[index - 1].userId !== message.userId

                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2 md:mb-4`}
                  >
                    <div className={`flex gap-2 md:gap-3 max-w-[75%] sm:max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar (only for other user's messages) */}
                      {!isOwnMessage && showAvatar && (
                        <Avatar user={{
                          name: message.userName,
                          avatarColor: message.avatarColor,
                          avatarImage: message.avatarImage
                        }} size="sm" className="w-6 h-6 md:w-8 md:h-8" />
                      )}
                      
                      {!isOwnMessage && !showAvatar && (
                        <div className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0" />
                      )}

                      <div className="flex flex-col">
                        {showAvatar && !isOwnMessage && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-white">
                              {message.userName}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatTime(message.createdAt)}
                            </span>
                          </div>
                        )}

                        <div className="relative">
                          <div
                            className={`px-3 py-2 md:px-4 md:py-2 ${
                              isOwnMessage
                                ? 'bg-blue-600 text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg rounded-br-sm'
                                : isNewMessage(message.createdAt, message.userId)
                                ? 'bg-green-700 text-white rounded-tl-lg rounded-tr-lg rounded-bl-sm rounded-br-lg border-l-4 border-green-400'
                                : 'bg-gray-700 text-white rounded-tl-lg rounded-tr-lg rounded-bl-sm rounded-br-lg'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                            {isOwnMessage && (
                              <div className="text-xs text-blue-200 mt-1 text-right">
                                {formatTime(message.createdAt)}
                              </div>
                            )}
                          </div>
                          
                          {/* New message indicator */}
                          {!isOwnMessage && isNewMessage(message.createdAt, message.userId) && (
                            <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-lg">
                              New
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-3 md:p-4 border-t border-gray-700 flex-shrink-0">
        <div className="flex gap-2 md:gap-3">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`${otherUser.name}にメッセージを送信...`}
            className="flex-1 px-3 py-2 md:px-4 md:py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm md:text-base"
            maxLength={1000}
            disabled={false}
          />
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || sending}
            className="px-3 py-2 md:px-6 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 md:gap-2 text-sm md:text-base"
          >
            <Send size={16} className="md:hidden" />
            <Send size={18} className="hidden md:block" />
            <span className="hidden sm:inline">{sending ? '送信中...' : '送信'}</span>
          </button>
        </div>
        
        {!isConnected && (
          <p className="text-xs text-yellow-400 mt-2 text-center">
            リアルタイム機能は無効ですが、メッセージ送信は可能です
          </p>
        )}
      </div>
    </div>
  )
}
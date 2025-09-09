'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useSocketStore } from '@/lib/socket'
import { Send, MessageCircle, X, Users, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

interface LessonChatProps {
  lessonId: string
  lessonTitle: string
}

export function LessonChat({ lessonId, lessonTitle }: LessonChatProps) {
  const {
    isConnected,
    currentRoom,
    messages,
    messagesByChannel,
    roomOnlineUsers,
    typingUsers,
    connect,
    joinRoom,
    leaveRoom,
    sendMessage,
    startTyping,
    stopTyping
  } = useSocketStore()
  
  // Get messages for current lesson
  const currentMessages = React.useMemo(() => {
    if (currentRoom?.roomId === lessonId) {
      return messages
    }
    return messagesByChannel[lessonId] || []
  }, [messages, messagesByChannel, lessonId, currentRoom])

  const [isChatOpen, setIsChatOpen] = useState(false)
  const [messageInput, setMessageInput] = useState('')
  const [messageType, setMessageType] = useState<'TEXT' | 'QUESTION'>('TEXT')
  const [isTyping, setIsTyping] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [currentMessages, isChatOpen])

  // Connect to socket and join lesson room when chat opens
  useEffect(() => {
    if (isChatOpen) {
      // Try to connect if not connected
      if (!isConnected) {
        const token = localStorage.getItem('accessToken')
        if (token) {
          connect(token)
        }
      }
      
      // Join room if connected
      if (isConnected) {
        joinRoom('lesson', lessonId)
      }
    }
    
    return () => {
      if (currentRoom?.roomId === lessonId) {
        leaveRoom()
      }
    }
  }, [isChatOpen, isConnected, lessonId, connect, joinRoom, leaveRoom, currentRoom])

  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value)
    
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true)
      startTyping()
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false)
        stopTyping()
      }
    }, 1000)
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (messageInput.trim()) {
      sendMessage(messageInput.trim(), messageType)
      setMessageInput('')
      setMessageType('TEXT')
      
      if (isTyping) {
        setIsTyping(false)
        stopTyping()
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }

  const formatTime = (date: Date) => {
    return format(new Date(date), 'HH:mm')
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 bg-yellow-500 hover:bg-yellow-600 text-black p-4 rounded-full shadow-lg transition-all z-40"
      >
        {isChatOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-6 h-6" />
            {currentMessages && currentMessages.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {currentMessages.length > 99 ? '99+' : currentMessages.length}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Chat Panel */}
      {isChatOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-gray-900 rounded-lg shadow-2xl flex flex-col z-40">
          {/* Header */}
          <div className="px-4 py-3 bg-gray-800 rounded-t-lg border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold">{lessonTitle}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-xs text-gray-400">
                    {isConnected ? 'Connected' : 'Connecting...'}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-400">{roomOnlineUsers.length}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {!currentMessages || currentMessages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs mt-1">Be the first to ask a question!</p>
              </div>
            ) : (
              currentMessages?.map((message) => (
                <div key={message.id} className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-black text-xs font-bold">
                      {message.userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-white">
                        {message.userName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(message.createdAt)}
                      </span>
                      {message.userRole === 'INSTRUCTOR' && (
                        <span className="text-xs bg-yellow-500 text-black px-1 rounded">
                          Instructor
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-300 mt-0.5">
                      {message.type === 'QUESTION' && (
                        <span className="text-blue-400 mr-1">❓</span>
                      )}
                      {message.type === 'ANSWER' && (
                        <span className="text-green-400 mr-1">✅</span>
                      )}
                      {message.type === 'ANNOUNCEMENT' && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2 mb-1">
                          <AlertCircle className="w-3 h-3 text-yellow-500 inline mr-1" />
                          <span className="text-yellow-500 text-xs font-semibold">Announcement</span>
                        </div>
                      )}
                      {message.content}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {/* Typing Indicator */}
            {typingUsers.size > 0 && (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <div className="flex gap-0.5">
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="text-xs">typing...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Online Users (Collapsed) */}
          <div className="px-4 py-2 bg-gray-800 border-t border-gray-700">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Users className="w-3 h-3" />
              <span>Online ({roomOnlineUsers.length}):</span>
              <div className="flex gap-1 flex-1 overflow-hidden">
                {roomOnlineUsers.slice(0, 3).map((user) => (
                  <span key={user.userId} className="text-gray-300">
                    {user.userName}
                    {user.userRole === 'INSTRUCTOR' && ' 👑'}
                  </span>
                ))}
                {roomOnlineUsers.length > 3 && (
                  <span>+{roomOnlineUsers.length - 3} more</span>
                )}
              </div>
            </div>
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-3 bg-gray-800 rounded-b-lg border-t border-gray-700">
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setMessageType('TEXT')}
                className={`px-2 py-1 text-xs rounded ${
                  messageType === 'TEXT'
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-900 text-gray-400 hover:text-white'
                }`}
              >
                Message
              </button>
              <button
                type="button"
                onClick={() => setMessageType('QUESTION')}
                className={`px-2 py-1 text-xs rounded ${
                  messageType === 'QUESTION'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-900 text-gray-400 hover:text-white'
                }`}
              >
                ❓ Question
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={handleInputChange}
                placeholder={
                  messageType === 'QUESTION' 
                    ? "Ask a question about this lesson..."
                    : "Type a message..."
                }
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                disabled={!isConnected}
              />
              <button
                type="submit"
                disabled={!isConnected || !messageInput.trim()}
                className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-black p-2 rounded transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
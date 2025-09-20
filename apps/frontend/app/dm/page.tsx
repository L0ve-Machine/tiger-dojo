'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { ArrowLeft, MessageCircle, Home, BookOpen } from 'lucide-react'
import Link from 'next/link'
import DMSidebar from '@/components/chat/DMSidebar'
import DMChat from '@/components/chat/DMChat'
import { io, Socket } from 'socket.io-client'
import { fireChatOpenedEvent } from '@/lib/chat-notifications'

interface DMUser {
  id: string
  name: string
  role: string
  avatarColor?: string | null
  avatarImage?: string | null
}

export default function DMPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [selectedDmRoomId, setSelectedDmRoomId] = useState<string>('')
  const [selectedOtherUser, setSelectedOtherUser] = useState<DMUser | null>(null)
  const [showMobileSidebar, setShowMobileSidebar] = useState(true)
  const [dmUnreadCounts, setDmUnreadCounts] = useState<Record<string, number>>({})
  const [dmLastReadTimestamps, setDmLastReadTimestamps] = useState<Record<string, number>>({})
  const [recentlyReadDMs, setRecentlyReadDMs] = useState<Set<string>>(new Set())
  const [socket, setSocket] = useState<Socket | null>(null)
  const [dmOpenedTimestamp, setDmOpenedTimestamp] = useState<number>(Date.now())

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    } else {
      // Fire chat opened event when DM page is opened
      fireChatOpenedEvent()
      setDmOpenedTimestamp(Date.now())
    }
  }, [isAuthenticated, router])

  // Fetch DM unread counts
  const fetchDmUnreadCounts = async () => {
    if (!user) return
    
    try {
      console.log('📊 [fetchDmUnreadCounts] Fetching unread counts from server...')
      
      const response = await fetch('/api/chat/unread-count', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const serverUnreadCounts = data.dmUnreadCounts || {}

        console.log('📊 [fetchDmUnreadCounts] Server unread counts:', serverUnreadCounts)
        console.log('📊 [fetchDmUnreadCounts] Recently read DMs:', Array.from(recentlyReadDMs))
        
        // Don't overwrite counts for recently read DMs
        const filteredCounts = { ...serverUnreadCounts }
        recentlyReadDMs.forEach(dmRoomId => {
          if (filteredCounts[dmRoomId] !== undefined) {
            console.log('📊 [fetchDmUnreadCounts] Filtering out recently read DM:', dmRoomId)
            filteredCounts[dmRoomId] = 0
          }
        })
        
        console.log('📊 [fetchDmUnreadCounts] Final filtered counts:', filteredCounts)
        setDmUnreadCounts(filteredCounts)
      } else {
        console.error('📊 [fetchDmUnreadCounts] API failed with status:', response.status)
      }
    } catch (error) {
      console.error('📊 [fetchDmUnreadCounts] Exception:', error)
    }
  }

  // Load DM unread counts with periodic refresh
  useEffect(() => {
    if (user && isAuthenticated) {
      fetchDmUnreadCounts()

      // Poll for unread count updates every 30 seconds
      const interval = setInterval(() => {
        fetchDmUnreadCounts()
      }, 30000)
      
      return () => {
        clearInterval(interval)
      }
    }
  }, [user, isAuthenticated])

  const handleMarkAsRead = async (dmRoomId: string) => {
    console.log('🔥 [handleMarkAsRead] Starting for dmRoomId:', dmRoomId)
    
    // Clear unread count for this DM immediately (for instant UI feedback)
    console.log('🔥 [handleMarkAsRead] Immediately clearing unread count for dmRoomId:', dmRoomId)
    setDmUnreadCounts(prev => {
      const newCounts = { ...prev, [dmRoomId]: 0 }
      console.log('🔥 [handleMarkAsRead] Updated DM unread counts:', newCounts)
      return newCounts
    })

    // Fire chat opened event
    fireChatOpenedEvent()

    // Mark DM messages as read in backend
    try {
      console.log('🔥 [handleMarkAsRead] Sending API request to mark-channel-read with dmRoomId:', dmRoomId)
      
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
      
      console.log('🔥 [handleMarkAsRead] API response status:', response.status)
      
      if (response.ok) {
        const responseData = await response.json()
        console.log('🔥 [handleMarkAsRead] API response data:', responseData)
        
        // Trigger unread count update immediately
        window.dispatchEvent(new CustomEvent('dm-unread-update'))
        window.dispatchEvent(new CustomEvent('chat-unread-update'))
        console.log('🔥 [handleMarkAsRead] Fired update events')
      } else {
        const errorData = await response.text()
        console.error('🔥 [handleMarkAsRead] API failed with status:', response.status, 'error:', errorData)
      }
    } catch (error) {
      console.error('🔥 [handleMarkAsRead] Exception:', error)
    }
  }

  const handleSelectDM = async (dmRoomId: string, otherUser: DMUser) => {
    setSelectedDmRoomId(dmRoomId)
    setSelectedOtherUser(otherUser)
    setShowMobileSidebar(false) // Hide sidebar on mobile when chat is selected
    
    // Update last read timestamp for this DM
    setDmLastReadTimestamps(prev => ({
      ...prev,
      [dmRoomId]: Date.now()
    }))
    
    // Mark as read (this will be called again, but it's idempotent)
    await handleMarkAsRead(dmRoomId)
  }

  const handleBackToSidebar = () => {
    setShowMobileSidebar(true)
    setSelectedDmRoomId('')
    setSelectedOtherUser(null)
    // Fire chat opened event when going back to ensure notification state is updated
    fireChatOpenedEvent()
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-400">認証中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Header */}
      <div className="bg-black/50 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/chat')}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <MessageCircle className="text-yellow-400" size={28} />
              ダイレクトメッセージ
            </h1>
          </div>
          
          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <Home size={18} />
              <span className="hidden sm:inline">ダッシュボード</span>
            </Link>
            <Link
              href="/videos"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <BookOpen size={18} />
              <span className="hidden sm:inline">講習</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto h-[calc(100vh-80px)] flex">
        {/* Desktop: Always show sidebar */}
        <div className={`${showMobileSidebar ? 'block' : 'hidden'} md:block`}>
          <DMSidebar
            currentUserId={user.id}
            onSelectDM={handleSelectDM}
            selectedDmRoomId={selectedDmRoomId}
            dmUnreadCounts={dmUnreadCounts}
            onMarkAsRead={handleMarkAsRead}
            key={JSON.stringify(dmUnreadCounts)} // Force re-render when counts change
          />
        </div>

        {/* Chat Area */}
        <div className={`flex-1 ${!showMobileSidebar || selectedDmRoomId ? 'block' : 'hidden'} md:block`}>
          {selectedDmRoomId && selectedOtherUser ? (
            <DMChat
              dmRoomId={selectedDmRoomId}
              otherUser={selectedOtherUser}
              currentUserId={user.id}
              onBack={handleBackToSidebar}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-800">
              <div className="text-center">
                <MessageCircle size={64} className="mx-auto mb-4 text-gray-600" />
                <h2 className="text-xl font-semibold text-white mb-2">
                  ダイレクトメッセージ
                </h2>
                <p className="text-gray-400 max-w-sm">
                  左のサイドバーからユーザーを選択してDMを開始してください。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
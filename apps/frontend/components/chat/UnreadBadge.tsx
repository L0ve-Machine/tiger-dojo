'use client'

import React, { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { io, Socket } from 'socket.io-client'
import { 
  checkUnreadMessagesSince, 
  onChatOpened, 
  startUnreadPolling,
  onChatLastOpenedChanged 
} from '@/lib/chat-notifications'

interface UnreadBadgeProps {
  className?: string
  forceHide?: boolean
  useTimestampBased?: boolean // 新しいlocalStorage基盤システムを使うかどうか
}

export function UnreadBadge({ className = '', forceHide = false, useTimestampBased = false }: UnreadBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const { user } = useAuthStore()

  const fetchUnreadCount = async () => {
    if (!user) {
      setUnreadCount(0)
      return
    }
    
    try {
      setIsLoading(true)
      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken) {
        setUnreadCount(0)
        return
      }

      // 統一的にlocalStorage基盤のタイムスタンプ方式を使用
      const unreadData = await checkUnreadMessagesSince(accessToken)
      if (unreadData) {
        console.log('UnreadBadge counts:', unreadData)
        setUnreadCount(unreadData.totalUnread)
      } else {
        setUnreadCount(0)
      }
    } catch (error: any) {
      // 401エラーの場合はログインしていないので、エラーログを出さない
      if (error?.response?.status !== 401) {
        console.error('Error fetching unread count:', error)
      }
      setUnreadCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return

    fetchUnreadCount()
    
    // Refresh unread count when user comes back to the page
    const handleFocus = () => {
      fetchUnreadCount()
    }
    
    // Refresh unread count when user switches tabs/windows
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchUnreadCount()
      }
    }
    
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user])

  // Listen for unread count updates via custom events
  useEffect(() => {
    const handleUnreadUpdate = () => {
      fetchUnreadCount()
    }

    window.addEventListener('chat-unread-update', handleUnreadUpdate)
    window.addEventListener('dm-unread-update', handleUnreadUpdate)
    
    return () => {
      window.removeEventListener('chat-unread-update', handleUnreadUpdate)
      window.removeEventListener('dm-unread-update', handleUnreadUpdate)
    }
  }, [])

  // Listen for chat opened events and cross-tab localStorage changes (timestamp-based mode)
  useEffect(() => {
    if (!useTimestampBased || !user) return

    // Listen for chat opened events to refresh unread count
    const cleanupChatOpened = onChatOpened(() => {
      console.log('Chat opened event detected, refreshing unread count')
      fetchUnreadCount()
    })

    // Listen for localStorage changes from other tabs
    const cleanupStorageListener = onChatLastOpenedChanged((newTimestamp) => {
      console.log('Chat last opened timestamp changed in another tab:', newTimestamp)
      fetchUnreadCount()
    })

    return () => {
      cleanupChatOpened()
      cleanupStorageListener()
    }
  }, [useTimestampBased, user])

  // Don't show badge if no unread messages or still loading or not logged in or force hidden
  if (!user || isLoading || unreadCount === 0 || forceHide) {
    return null
  }

  return (
    <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full ${className}`}>
      {unreadCount > 0 ? 'NEW' : ''}
    </span>
  )
}

interface ChatLinkWithBadgeProps {
  href: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
  useTimestampBased?: boolean
}

export function ChatLinkWithBadge({ href, children, className = '', onClick, useTimestampBased = true }: ChatLinkWithBadgeProps) {
  const [isReset, setIsReset] = useState(false)
  
  const handleClick = () => {
    // チャットページに行く時に未読カウントをリセット
    setIsReset(true)
    if (onClick) onClick()
  }
  
  return (
    <div className="relative inline-block">
      <a href={href} className={className} onClick={handleClick}>
        {children}
      </a>
      <div className="absolute -top-2 -right-2">
        <UnreadBadge forceHide={isReset} useTimestampBased={useTimestampBased} />
      </div>
    </div>
  )
}
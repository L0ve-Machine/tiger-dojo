'use client'

import React, { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { io, Socket } from 'socket.io-client'

interface UnreadBadgeProps {
  className?: string
  forceHide?: boolean
}

export function UnreadBadge({ className = '', forceHide = false }: UnreadBadgeProps) {
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
      const response = await fetch('/api/chat/unread-count', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        // チャットとDMの未読数を合計
        const chatUnread = data.unreadCount || 0
        const dmUnreadCounts = data.dmUnreadCounts || {}
        const totalDmUnread = Object.values(dmUnreadCounts).reduce((sum: number, count: any) => sum + (count || 0), 0)
        const totalUnread = chatUnread + totalDmUnread
        
        console.log('UnreadBadge counts:', { chatUnread, totalDmUnread, totalUnread })
        setUnreadCount(totalUnread)
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

  // Don't show badge if no unread messages or still loading or not logged in or force hidden
  if (!user || isLoading || unreadCount === 0 || forceHide) {
    return null
  }

  return (
    <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full ${className}`}>
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  )
}

interface ChatLinkWithBadgeProps {
  href: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function ChatLinkWithBadge({ href, children, className = '', onClick }: ChatLinkWithBadgeProps) {
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
        <UnreadBadge forceHide={isReset} />
      </div>
    </div>
  )
}
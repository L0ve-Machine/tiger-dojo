'use client'

import React, { useState, useEffect } from 'react'
import { User, MessageCircle, Search, Plus, X } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'

interface DMUser {
  id: string
  name: string
  role: string
  avatarColor?: string | null
  avatarImage?: string | null
  lastLoginAt?: string
}

interface DMConversation {
  dmRoomId: string
  otherUser: DMUser
  unreadCount: number
  lastMessage?: {
    id: string
    userId: string
    userName: string
    content: string
    createdAt: string
  }
}

interface DMSidebarProps {
  currentUserId: string
  onSelectDM: (dmRoomId: string, otherUser: DMUser) => void
  selectedDmRoomId?: string
  dmUnreadCounts?: Record<string, number>
  onMarkAsRead?: (dmRoomId: string) => void
}

export default function DMSidebar({ currentUserId, onSelectDM, selectedDmRoomId, dmUnreadCounts = {}, onMarkAsRead }: DMSidebarProps) {
  const [users, setUsers] = useState<DMUser[]>([])
  const [conversations, setConversations] = useState<DMConversation[]>([])
  const [showAllUsers, setShowAllUsers] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load users and recent conversations
  useEffect(() => {
    loadUsers()
    loadRecentConversations()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dm/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        setError('ユーザーリストの取得に失敗しました')
      }
    } catch (err) {
      setError('ユーザーリストの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const loadRecentConversations = async () => {
    try {
      const response = await fetch('/api/dm/recent', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setConversations(data)
        
        // If the selected DM room isn't in conversations, add it
        if (selectedDmRoomId && !data.some((conv: DMConversation) => conv.dmRoomId === selectedDmRoomId)) {
          // Find the other user for this DM room
          const otherUserId = selectedDmRoomId.split('_').find(id => id !== currentUserId)
          const otherUser = users.find(u => u.id === otherUserId)
          
          if (otherUser) {
            // Add the conversation to the list
            setConversations(prev => [{
              dmRoomId: selectedDmRoomId,
              otherUser: otherUser,
              unreadCount: 0,
              lastMessage: undefined
            }, ...prev])
          }
        }
      }
    } catch (err) {
      console.error('Failed to load recent conversations:', err)
    }
  }

  const handleUserClick = (otherUser: DMUser) => {
    const dmRoomId = [currentUserId, otherUser.id].sort().join('_')
    onSelectDM(dmRoomId, otherUser)
    setShowAllUsers(false)
  }

  const handleConversationClick = (conversation: DMConversation) => {
    // 即座に既読処理を呼び出す
    if (onMarkAsRead) {
      onMarkAsRead(conversation.dmRoomId)
    }
    onSelectDM(conversation.dmRoomId, conversation.otherUser)
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'text-red-400'
      case 'INSTRUCTOR': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }

  const formatLastMessage = (content: string) => {
    return content.length > 30 ? content.substring(0, 30) + '...' : content
  }

  return (
    <div className="w-full md:w-64 lg:w-80 bg-gray-900 border-r border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-3 md:p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
            <MessageCircle size={18} className="md:hidden" />
            <MessageCircle size={20} className="hidden md:block" />
            <span className="hidden sm:inline">ダイレクトメッセージ</span>
            <span className="sm:hidden">DM</span>
          </h2>
          <button
            onClick={() => setShowAllUsers(!showAllUsers)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="新しいDMを開始"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* User Search Modal */}
      {showAllUsers && (
        <div className="absolute top-0 left-0 w-full h-full bg-gray-900 z-50 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">ユーザーを選択</h3>
              <button
                onClick={() => setShowAllUsers(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="ユーザー名で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-400">読み込み中...</div>
            ) : error ? (
              <div className="p-4 text-center text-red-400">{error}</div>
            ) : (
              <div className="p-2">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserClick(user)}
                    className="w-full p-3 text-left hover:bg-gray-800 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar user={{
                        name: user.name,
                        avatarColor: user.avatarColor,
                        avatarImage: user.avatarImage
                      }} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{user.name}</p>
                        <p className={`text-xs ${getRoleColor(user.role)}`}>
                          {user.role === 'ADMIN' ? '管理者' : user.role === 'INSTRUCTOR' ? '講師' : '生徒'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Conversations */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            <MessageCircle size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">まだDMがありません</p>
            <p className="text-xs text-gray-500 mt-1">
              上の + ボタンからユーザーを選択してDMを開始できます
            </p>
          </div>
        ) : (
          <div className="p-2">
            {conversations.map((conversation) => (
              <button
                key={conversation.dmRoomId}
                onClick={() => handleConversationClick(conversation)}
                className={`w-full p-3 text-left hover:bg-gray-800 rounded-lg transition-colors group ${
                  selectedDmRoomId === conversation.dmRoomId ? 'bg-gray-800 ring-1 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar user={{
                    name: conversation.otherUser.name,
                    avatarColor: conversation.otherUser.avatarColor,
                    avatarImage: conversation.otherUser.avatarImage
                  }} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-white font-medium truncate">{conversation.otherUser.name}</p>
                      {conversation.lastMessage && (
                        <span className="text-xs text-gray-400">
                          {new Date(conversation.lastMessage.createdAt).toLocaleDateString('ja-JP', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      )}
                    </div>
                    {conversation.lastMessage ? (
                      <p className="text-sm text-gray-400 truncate">
                        {conversation.lastMessage.userId === currentUserId ? 'あなた: ' : ''}
                        {formatLastMessage(conversation.lastMessage.content)}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 italic">メッセージがありません</p>
                    )}
                  </div>
                  {(() => {
                    const parentCount = dmUnreadCounts[conversation.dmRoomId] || 0
                    const conversationCount = conversation.unreadCount || 0
                    const finalCount = parentCount !== undefined ? parentCount : conversationCount
                    console.log(`DM ${conversation.dmRoomId}: parentCount=${parentCount}, conversationCount=${conversationCount}, finalCount=${finalCount}`)
                    return finalCount > 0 && (
                      <div className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center font-semibold ml-2">
                        {finalCount}
                      </div>
                    )
                  })()}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
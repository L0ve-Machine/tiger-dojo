'use client'

import { useState, useEffect } from 'react'
import { adminApi } from '@/lib/api'
import { 
  MessageSquare,
  Search,
  Filter,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  User,
  Clock,
  MessageCircle,
  Flag,
  Edit3,
  Plus,
  Home,
  Hash,
  Lock,
  Users
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface ChatMessage {
  id: string
  content: string
  type: 'TEXT' | 'QUESTION' | 'ANSWER'
  isEdited: boolean
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  lesson?: {
    id: string
    title: string
  }
  course?: {
    id: string
    title: string
  }
}

interface ChatStats {
  totalMessages: number
  todayMessages: number
  activeUsers: number
  questionMessages: number
}

interface ChatRoom {
  id: string
  title: string
  slug: string
  createdAt: string
  _count: {
    messages: number
  }
}

export default function ChatManagementPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [stats, setStats] = useState<ChatStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [selectedMessages, setSelectedMessages] = useState<string[]>([])
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [newRoom, setNewRoom] = useState({ 
    title: '', 
    slug: '', 
    isPrivate: false, 
    accessKey: '', 
    maxMembers: 50 
  })
  const [roomsLoading, setRoomsLoading] = useState(false)

  useEffect(() => {
    fetchChatData()
    fetchChatRooms()
  }, [])

  const fetchChatData = async () => {
    try {
      setLoading(true)
      const response = await adminApi.getChatMessages()
      setMessages(response.data.messages || [])
      
      // Calculate stats
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      const todayMessages = response.data.messages.filter((msg: ChatMessage) => 
        new Date(msg.createdAt) >= today
      ).length
      
      const uniqueUsers = new Set(response.data.messages.map((msg: ChatMessage) => msg.user.id))
      const questionMessages = response.data.messages.filter((msg: ChatMessage) => 
        msg.type === 'QUESTION'
      ).length

      setStats({
        totalMessages: response.data.messages.length,
        todayMessages,
        activeUsers: uniqueUsers.size,
        questionMessages
      })
    } catch (err: any) {
      console.error('Chat fetch error:', err)
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchChatRooms = async () => {
    try {
      setRoomsLoading(true)
      const response = await fetch('/api/admin/chat/rooms')
      
      if (response.ok) {
        const data = await response.json()
        setRooms(data.rooms || [])
      } else {
        console.error('Failed to fetch chat rooms')
      }
    } catch (err: any) {
      console.error('Chat rooms fetch error:', err)
    } finally {
      setRoomsLoading(false)
    }
  }

  const deleteMessage = async (messageId: string) => {
    try {
      await adminApi.deleteChatMessage(messageId)
      setMessages(prev => prev.filter(msg => msg.id !== messageId))
      setSelectedMessages(prev => prev.filter(id => id !== messageId))
      
      // Update stats
      if (stats) {
        setStats({
          ...stats,
          totalMessages: stats.totalMessages - 1
        })
      }
    } catch (err: any) {
      console.error('Delete message error:', err)
      alert('メッセージの削除に失敗しました')
    }
  }

  const moderateMessage = async (messageId: string, newContent: string) => {
    try {
      await adminApi.moderateMessage(messageId, newContent)
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: newContent, isEdited: true }
          : msg
      ))
    } catch (err: any) {
      console.error('Moderate message error:', err)
      alert('メッセージの編集に失敗しました')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'QUESTION': return <MessageCircle className="w-4 h-4 text-blue-400" />
      case 'ANSWER': return <MessageSquare className="w-4 h-4 text-green-400" />
      default: return <MessageSquare className="w-4 h-4 text-gray-400" />
    }
  }

  const getMessageTypeBadge = (type: string) => {
    switch (type) {
      case 'QUESTION': 
        return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">質問</span>
      case 'ANSWER': 
        return <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">回答</span>
      default: 
        return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded">通常</span>
    }
  }

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.user.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = !typeFilter || message.type === typeFilter
    return matchesSearch && matchesType
  })

  const toggleMessageSelection = (messageId: string) => {
    setSelectedMessages(prev => 
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    )
  }

  const deleteSelectedMessages = async () => {
    if (selectedMessages.length === 0) return
    
    if (confirm(`選択された ${selectedMessages.length} 件のメッセージを削除しますか？`)) {
      try {
        await Promise.all(selectedMessages.map(id => adminApi.deleteChatMessage(id)))
        setMessages(prev => prev.filter(msg => !selectedMessages.includes(msg.id)))
        setSelectedMessages([])
        
        if (stats) {
          setStats({
            ...stats,
            totalMessages: stats.totalMessages - selectedMessages.length
          })
        }
      } catch (err) {
        alert('一部のメッセージの削除に失敗しました')
      }
    }
  }

  const createChatRoom = async () => {
    console.log('Creating room with data:', newRoom)
    console.log('All localStorage keys:', Object.keys(localStorage))
    console.log('sessionStorage adminAccess:', sessionStorage.getItem('adminAccess'))
    
    if (!newRoom.title.trim() || !newRoom.slug.trim()) {
      alert('タイトルとスラッグを入力してください')
      return
    }

    if (newRoom.isPrivate && !newRoom.accessKey.trim()) {
      alert('プライベートルームの場合はアクセスキーを設定してください')
      return
    }

    try {
      if (newRoom.isPrivate) {
        // Create private room
        const accessToken = localStorage.getItem('accessToken')
        console.log('Access token from localStorage:', accessToken ? 'EXISTS' : 'NOT FOUND')
        console.log('Access token length:', accessToken?.length || 0)
        
        const response = await fetch('/api/private-rooms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          credentials: 'include',
          body: JSON.stringify({
            name: newRoom.title.trim(),
            slug: newRoom.slug.trim() || newRoom.title.trim().toLowerCase().replace(/[^a-z0-9]/g, '-'),
            accessKey: newRoom.accessKey.trim(),
            isPublic: false,
            maxMembers: newRoom.maxMembers
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'プライベートルームの作成に失敗しました')
        }
      } else {
        // Create regular course room
        const response = await fetch('/api/admin/chat/rooms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: newRoom.title.trim(),
            slug: newRoom.slug.trim()
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'チャットルームの作成に失敗しました')
        }
      }
      
      setNewRoom({ 
        title: '', 
        slug: '', 
        isPrivate: false, 
        accessKey: '', 
        maxMembers: 50 
      })
      setShowCreateRoom(false)
      fetchChatRooms()
      alert(`${newRoom.isPrivate ? 'プライベート' : ''}チャットルームが作成されました`)
    } catch (err: any) {
      console.error('Create chat room error:', err)
      alert(err.message || err.response?.data?.error || 'チャットルームの作成に失敗しました')
    }
  }

  const deleteChatRoom = async (roomId: string, roomTitle: string) => {
    if (!confirm(`「${roomTitle}」チャットルームを削除しますか？\n\n⚠️ このルームの全メッセージも削除されます。この操作は元に戻せません。`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/chat/rooms/${roomId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'チャットルームの削除に失敗しました')
      }
      
      fetchChatRooms()
      alert('チャットルームが削除されました')
    } catch (err: any) {
      console.error('Delete chat room error:', err)
      alert(err.message || 'チャットルームの削除に失敗しました')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <p className="text-gray-400">チャットデータを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">❌</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">データの読み込みに失敗しました</h2>
        <p className="text-gray-400 mb-4">{error}</p>
        <Button onClick={fetchChatData} className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          再試行
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">チャット管理</h1>
          <p className="text-gray-400 mt-1">メッセージの監視と管理</p>
        </div>
        <Button 
          onClick={fetchChatData}
          className="bg-gray-800 text-gray-300 hover:bg-gray-700"
        >
          更新
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.totalMessages}</p>
                  <p className="text-sm text-gray-400">総メッセージ数</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.todayMessages}</p>
                  <p className="text-sm text-gray-400">今日のメッセージ</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.activeUsers}</p>
                  <p className="text-sm text-gray-400">アクティブユーザー</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.questionMessages}</p>
                  <p className="text-sm text-gray-400">質問メッセージ</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chat Room Management */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Hash className="w-5 h-5" />
              チャットルーム管理
            </CardTitle>
            <Button
              onClick={() => setShowCreateRoom(true)}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              新規作成
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {roomsLoading ? (
            <div className="text-center py-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
                <Hash className="w-4 h-4 text-white" />
              </div>
              <p className="text-gray-400 text-sm">ルーム一覧を読み込み中...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-4">
              <Hash className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">チャットルームがありません</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <div key={room.id} className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">{room.title}</h4>
                    <p className="text-sm text-gray-400">/{room.slug}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteChatRoom(room.id, room.title)}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-gray-900 border-gray-800 w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-white">新しいチャットルーム</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="room-title" className="text-gray-300">ルームタイトル</Label>
                <Input
                  id="room-title"
                  value={newRoom.title}
                  onChange={(e) => setNewRoom(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="例: 初心者向けFX相談"
                  className="bg-white border-gray-600 text-black"
                />
              </div>
              
              {/* ルームタイプ選択 */}
              <div>
                <Label className="text-gray-300">ルームタイプ</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 text-gray-300">
                    <input
                      type="radio"
                      name="roomType"
                      checked={!newRoom.isPrivate}
                      onChange={() => setNewRoom(prev => ({ ...prev, isPrivate: false }))}
                      className="text-green-500"
                    />
                    <Hash className="w-4 h-4" />
                    通常ルーム (公開)
                  </label>
                  <label className="flex items-center gap-2 text-gray-300">
                    <input
                      type="radio"
                      name="roomType"
                      checked={newRoom.isPrivate}
                      onChange={() => setNewRoom(prev => ({ ...prev, isPrivate: true }))}
                      className="text-green-500"
                    />
                    <Lock className="w-4 h-4" />
                    プライベートルーム (鍵付き)
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="room-slug" className="text-gray-300">スラッグ (URL用)</Label>
                <Input
                  id="room-slug"
                  value={newRoom.slug}
                  onChange={(e) => setNewRoom(prev => ({ ...prev, slug: e.target.value }))}
                  onBlur={(e) => {
                    // フォーカスを外した時に適切なスラッグに変換
                    const cleanSlug = e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9\u3042-\u3096\u30a2-\u30f6\u4e00-\u9faf\s-]/g, '')
                      .replace(/[\s\u3042-\u3096\u30a2-\u30f6\u4e00-\u9faf]+/g, '-')
                      .replace(/^-+|-+$/g, '')
                    setNewRoom(prev => ({ ...prev, slug: cleanSlug }))
                  }}
                  placeholder="例: fx-beginners または FX初心者"
                  className="bg-white border-gray-600 text-black"
                />
              </div>

              {newRoom.isPrivate && (
                <>
                  <div>
                    <Label htmlFor="access-key" className="text-gray-300">アクセスキー (パスワード)</Label>
                    <Input
                      id="access-key"
                      type="password"
                      value={newRoom.accessKey}
                      onChange={(e) => setNewRoom(prev => ({ ...prev, accessKey: e.target.value }))}
                      placeholder="鍵付きルームのパスワードを入力"
                      className="bg-white border-gray-600 text-black"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 参加者がルームに入るために必要なパスワードです
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="max-members" className="text-gray-300">最大参加者数</Label>
                    <Input
                      id="max-members"
                      type="number"
                      min="2"
                      max="100"
                      value={newRoom.maxMembers}
                      onChange={(e) => setNewRoom(prev => ({ ...prev, maxMembers: parseInt(e.target.value) || 50 }))}
                      className="bg-white border-gray-600 text-black"
                    />
                  </div>
                </>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowCreateRoom(false)
                    setNewRoom({ 
                      title: '', 
                      slug: '', 
                      isPrivate: false, 
                      accessKey: '', 
                      maxMembers: 50 
                    })
                  }}
                  className="text-gray-400"
                >
                  キャンセル
                </Button>
                <Button
                  onClick={createChatRoom}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white"
                >
                  作成
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="メッセージまたはユーザー名で検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800/50 border-gray-600 text-white"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-md text-white min-w-32"
        >
          <option value="">全タイプ</option>
          <option value="TEXT">通常</option>
          <option value="QUESTION">質問</option>
          <option value="ANSWER">回答</option>
        </select>
        {selectedMessages.length > 0 && (
          <Button
            onClick={deleteSelectedMessages}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            選択削除 ({selectedMessages.length})
          </Button>
        )}
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {filteredMessages.length === 0 ? (
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">
                {searchTerm || typeFilter ? 'メッセージが見つかりませんでした' : 'まだメッセージがありません'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredMessages.map((message) => (
            <Card key={message.id} className="bg-gray-900/50 border-gray-800 hover:bg-gray-900/70 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedMessages.includes(message.id)}
                    onChange={() => toggleMessageSelection(message.id)}
                    className="mt-1"
                  />
                  
                  <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-black text-sm font-bold">
                      {message.user.name.charAt(0)}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-white font-medium">{message.user.name}</h4>
                      <span className="text-sm text-gray-400">({message.user.email})</span>
                      {getMessageTypeBadge(message.type)}
                      {message.isEdited && (
                        <span className="text-xs text-yellow-400 bg-yellow-400/20 px-1.5 py-0.5 rounded">編集済み</span>
                      )}
                      <span className="text-xs text-gray-500 ml-auto">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                    
                    <div className="bg-gray-800/50 rounded-lg p-3 mb-3">
                      <p className="text-gray-300">{message.content}</p>
                    </div>
                    
                    {(message.lesson || message.course) && (
                      <p className="text-xs text-gray-500 mb-2">
                        📚 {message.course?.title} {message.lesson && `→ ${message.lesson.title}`}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          const newContent = prompt('新しいメッセージ内容を入力:', message.content)
                          if (newContent && newContent !== message.content) {
                            moderateMessage(message.id, newContent)
                          }
                        }}
                        className="text-gray-400 hover:text-blue-400"
                      >
                        <Edit3 className="w-3 h-3 mr-1" />
                        編集
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          if (confirm('このメッセージを削除しますか？')) {
                            deleteMessage(message.id)
                          }
                        }}
                        className="text-gray-400 hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        削除
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
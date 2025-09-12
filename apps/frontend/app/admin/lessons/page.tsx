'use client'

import React, { useState, useEffect } from 'react'
import { adminApi } from '@/lib/api'
import { 
  Plus,
  Search,
  Video,
  Play,
  Edit3,
  Trash2,
  Clock,
  BookOpen,
  FileText,
  Eye,
  Calendar,
  Users,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Globe,
  Lock,
  Timer
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

interface Lesson {
  id: string
  title: string
  description: string | null
  videoUrl: string
  vimeoEmbedCode?: string
  duration?: number
  orderIndex: number
  releaseType: 'IMMEDIATE' | 'SCHEDULED' | 'DRIP' | 'PREREQUISITE' | 'HIDDEN'
  releaseDays?: number
  releaseDate?: string
  prerequisiteId?: string
  prerequisite?: {
    id: string
    title: string
  }
  createdAt: string
  updatedAt: string
  course: {
    id: string
    title: string
    slug: string
  }
}

interface Course {
  id: string
  title: string
  slug: string
  isPublished: boolean
}

interface CreateLessonData {
  courseId: string
  title: string
  description: string
  vimeoEmbedCode: string
  duration?: number
  orderIndex: number
  releaseType: 'IMMEDIATE' | 'SCHEDULED' | 'DRIP' | 'PREREQUISITE' | 'HIDDEN'
  releaseDays?: number
  releaseDate?: string
  prerequisiteId?: string
}

export default function VideoManagementPage() {
  // State management
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<CreateLessonData>({
    courseId: '',
    title: '',
    description: '',
    vimeoEmbedCode: '',
    duration: undefined,
    orderIndex: 1,
    releaseType: 'IMMEDIATE',
    releaseDays: undefined,
    releaseDate: undefined,
    prerequisiteId: undefined
  })

  // Fetch data on component mount
  useEffect(() => {
    fetchLessons()
    fetchCourses()
  }, [])

  const fetchLessons = async () => {
    try {
      setLoading(true)
      console.log('Fetching lessons...', { selectedCourse })
      console.log('Access token:', localStorage.getItem('accessToken') ? 'Present' : 'Missing')
      
      const response = await adminApi.getAdminLessons(selectedCourse || undefined)
      console.log('Lessons API response:', response)
      
      // Handle different response structures
      const lessonsData = response.data?.lessons || response.data || []
      console.log('Lessons data count:', Array.isArray(lessonsData) ? lessonsData.length : 0)
      
      if (Array.isArray(lessonsData)) {
        // Fetch duration for each lesson if not already set
        const lessonsWithDuration = await Promise.all(
          lessonsData.map(async (lesson) => {
            if (!lesson.duration && lesson.videoUrl) {
              const match = lesson.videoUrl.match(/vimeo\.com\/video\/(\d+)|player\.vimeo\.com\/video\/(\d+)/)
              if (match) {
                const vimeoId = match[1] || match[2]
                const duration = await fetchVideoDuration(vimeoId)
                if (duration) {
                  // Update duration in database
                  await adminApi.updateAdminLesson(lesson.id, { duration })
                  return { ...lesson, duration }
                }
              }
            }
            return lesson
          })
        )
        setLessons(lessonsWithDuration)
      } else {
        console.warn('Lessons data is not an array:', lessonsData)
        setLessons([])
      }
      
      setError('') // Clear any previous errors
    } catch (err: any) {
      console.error('Fetch lessons error:', err)
      console.error('Error status:', err.response?.status)
      console.error('Error response:', err.response?.data)
      setError(err.response?.data?.error || 'レッスンの取得に失敗しました')
      setLessons([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      console.log('Fetching courses...')
      const response = await adminApi.getAdminCourses()
      console.log('Courses API response:', response)
      
      // Handle different response structures
      const coursesData = response.data?.courses || response.data || []
      console.log('Courses data:', coursesData, 'Is array:', Array.isArray(coursesData))
      
      if (Array.isArray(coursesData)) {
        setCourses(coursesData)
      } else {
        console.warn('Courses data is not an array:', coursesData)
        setCourses([])
      }
    } catch (err: any) {
      console.error('Fetch courses error:', err)
      console.error('Courses error response:', err.response?.data)
      setCourses([]) // Ensure we always have an array
    }
  }

  // Filter lessons based on search only
  const filteredLessons = React.useMemo(() => {
    console.log('Lessons data:', lessons, 'Type:', typeof lessons, 'Is array:', Array.isArray(lessons))
    
    if (!Array.isArray(lessons)) {
      console.warn('Lessons is not an array, returning empty array')
      return []
    }
    
    return lessons.filter(lesson => {
      const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           lesson.description?.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch
    })
  }, [lessons, searchTerm])

  // Extract video ID from Vimeo embed code
  const extractVimeoId = (embedCode: string): string | null => {
    const match = embedCode.match(/vimeo\.com\/video\/(\d+)/i) || embedCode.match(/player\.vimeo\.com\/video\/(\d+)/i)
    return match ? match[1] : null
  }

  // Fetch video data from Vimeo API
  const fetchVimeoData = async (vimeoId: string): Promise<{duration?: number, title?: string} | undefined> => {
    try {
      const response = await fetch(`/api/vimeo/oembed?url=https://player.vimeo.com/video/${vimeoId}`)
      if (!response.ok) {
        console.error('Failed to fetch video data from Vimeo')
        return undefined
      }
      const data = await response.json()
      console.log('Vimeo video data:', data)
      return {
        duration: data.duration, // Returns duration in seconds
        title: data.title // Returns video title
      }
    } catch (error) {
      console.error('Error fetching video data:', error)
      return undefined
    }
  }
  
  // Legacy function for backward compatibility
  const fetchVideoDuration = async (vimeoId: string): Promise<number | undefined> => {
    const data = await fetchVimeoData(vimeoId)
    return data?.duration
  }

  // Create new lesson
  const handleCreateLesson = async () => {
    try {
      if (!formData.vimeoEmbedCode) {
        setError('Vimeo埋め込みコードは必須です')
        return
      }

      const vimeoId = extractVimeoId(formData.vimeoEmbedCode)
      if (!vimeoId) {
        setError('有効なVimeo埋め込みコードを入力してください')
        return
      }

      // Fetch video data from Vimeo API
      const vimeoData = await fetchVimeoData(vimeoId)
      
      // Use the first course as default, or create a default course
      const defaultCourseId = courses.length > 0 ? courses[0].id : 'default-course-id'
      
      const lessonData = {
        ...formData,
        courseId: defaultCourseId,
        title: vimeoData?.title || formData.title || 'Untitled Video', // Use Vimeo title or form title
        videoUrl: `https://player.vimeo.com/video/${vimeoId}`,
        duration: vimeoData?.duration || formData.duration, // Use fetched duration or manual input
        releaseDate: formData.releaseType === 'SCHEDULED' ? formData.releaseDate : undefined,
        releaseDays: formData.releaseType === 'DRIP' ? formData.releaseDays : undefined,
        prerequisiteId: formData.releaseType === 'PREREQUISITE' ? formData.prerequisiteId : undefined
      }

      await adminApi.createAdminLesson(lessonData)
      await fetchLessons()
      
      // Reset form
      setFormData({
        courseId: '',
        title: '',
        description: '',
        vimeoEmbedCode: '',
        duration: undefined,
        orderIndex: 1,
        releaseType: 'IMMEDIATE',
        releaseDays: undefined,
        releaseDate: undefined,
        prerequisiteId: undefined
      })
      setShowCreateModal(false)
      setError(null)
    } catch (err: any) {
      console.error('Create lesson error:', err)
      setError(err.response?.data?.error || 'レッスンの作成に失敗しました')
    }
  }

  // Update lesson (only release settings and order)
  const handleUpdateLesson = async () => {
    if (!editingLesson) return

    try {
      const updateData: any = {
        orderIndex: formData.orderIndex,
        releaseType: formData.releaseType,
      }

      // リリースタイプに応じて適切なフィールドを設定
      if (formData.releaseType === 'SCHEDULED') {
        updateData.releaseDate = formData.releaseDate
        updateData.releaseDays = null
        updateData.prerequisiteId = null
      } else if (formData.releaseType === 'DRIP') {
        updateData.releaseDays = formData.releaseDays
        updateData.releaseDate = null
        updateData.prerequisiteId = null
      } else if (formData.releaseType === 'PREREQUISITE') {
        updateData.prerequisiteId = formData.prerequisiteId
        updateData.releaseDate = null
        updateData.releaseDays = null
      } else {
        updateData.releaseDate = null
        updateData.releaseDays = null
        updateData.prerequisiteId = null
      }

      console.log('Sending update data:', updateData)
      await adminApi.updateAdminLesson(editingLesson.id, updateData)
      await fetchLessons()
      
      setShowEditModal(false)
      setEditingLesson(null)
      setError(null)
    } catch (err: any) {
      console.error('Update lesson error:', err)
      console.error('Update lesson error response:', err.response?.data)
      setError(err.response?.data?.error || 'レッスンの更新に失敗しました')
    }
  }

  // Delete lesson
  const handleDeleteLesson = async (lessonId: string, lessonTitle: string) => {
    if (!confirm(`「${lessonTitle}」を削除しますか？この操作は元に戻せません。`)) {
      return
    }

    try {
      await adminApi.deleteAdminLesson(lessonId)
      await fetchLessons()
    } catch (err: any) {
      console.error('Delete lesson error:', err)
      setError(err.response?.data?.error || 'レッスンの削除に失敗しました')
    }
  }


  // Open edit modal (only for release settings)
  const openEditModal = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setFormData({
      courseId: '',
      title: '',  // Not needed for edit
      description: '',  // Not needed for edit
      vimeoEmbedCode: '',  // Not needed for edit
      duration: undefined,  // Not needed for edit
      orderIndex: lesson.orderIndex,
      releaseType: lesson.releaseType,
      releaseDays: lesson.releaseDays,
      releaseDate: lesson.releaseDate ? lesson.releaseDate.split('T')[0] : undefined,
      prerequisiteId: lesson.prerequisiteId
    })
    setShowEditModal(true)
  }

  // Format release info
  const formatReleaseInfo = (lesson: Lesson) => {
    switch (lesson.releaseType) {
      case 'IMMEDIATE':
        return { text: 'すぐに公開', icon: <Globe className="w-4 h-4 text-green-500" /> }
      case 'HIDDEN':
        return { text: '非公開', icon: <Eye className="w-4 h-4 text-red-500 line-through" /> }
      case 'DRIP':
        return { text: `登録${lesson.releaseDays}日後`, icon: <Timer className="w-4 h-4 text-blue-500" /> }
      case 'SCHEDULED':
        return { 
          text: lesson.releaseDate ? new Date(lesson.releaseDate).toLocaleDateString('ja-JP') : '日付未設定',
          icon: <Calendar className="w-4 h-4 text-purple-500" />
        }
      case 'PREREQUISITE':
        return { text: '前提条件あり', icon: <Lock className="w-4 h-4 text-orange-500" /> }
      default:
        return { text: '不明', icon: <AlertTriangle className="w-4 h-4 text-gray-500" /> }
    }
  }

  // Format duration
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '未設定'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Video className="w-6 h-6 text-white" />
          </div>
          <p className="text-gray-400">講習データを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">講習管理</h1>
          <p className="text-gray-400 mt-1">Vimeo埋め込み講習の管理とリリーススケジュール設定</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={fetchLessons}
            className="bg-gray-800 text-gray-300 hover:bg-gray-700"
          >
            更新
          </Button>
          <Button
            onClick={() => {
              // 新規作成時は最後の表示順+1をデフォルトに設定
              const maxOrderIndex = lessons.length > 0 ? Math.max(...lessons.map(l => l.orderIndex)) + 1 : 1
              setFormData(prev => ({
                ...prev,
                orderIndex: maxOrderIndex,
                title: '',
                description: ''
              }))
              setShowCreateModal(true)
            }}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            講習を追加
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <p className="text-red-400 font-medium">エラー</p>
          </div>
          <p className="text-red-300 mt-1">{error}</p>
          <Button
            onClick={() => setError(null)}
            className="mt-3 bg-red-600 hover:bg-red-700 text-white text-sm"
          >
            閉じる
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="講習タイトルや説明で検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800/50 border-gray-600 text-black"
          />
        </div>
      </div>

      {/* Lessons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLessons.length === 0 ? (
          <div className="col-span-full">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-12 text-center">
                <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">講習がありません</h3>
                <p className="text-gray-400 mb-4">
                  {searchTerm || selectedCourse ? '検索条件に一致する講習が見つかりませんでした' : 'まだ講習が追加されていません'}
                </p>
                <Button
                  onClick={() => {
                    // 新規作成時は最後の表示順+1をデフォルトに設定
                    const maxOrderIndex = lessons.length > 0 ? Math.max(...lessons.map(l => l.orderIndex)) + 1 : 1
                    setFormData(prev => ({
                      ...prev,
                      orderIndex: maxOrderIndex,
                      title: '',
                      description: ''
                    }))
                    setShowCreateModal(true)
                  }}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  最初の講習を追加
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredLessons.map((lesson) => {
            const releaseInfo = formatReleaseInfo(lesson)
            
            return (
              <Card key={lesson.id} className="bg-gray-900/50 border-gray-800 hover:bg-gray-900/70 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg text-white truncate">{lesson.title}</CardTitle>
                      <p className="text-sm text-gray-400 truncate">{lesson.course.title}</p>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
                      #{lesson.orderIndex}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Video Preview */}
                  <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center relative overflow-hidden">
                    {lesson.videoUrl ? (
                      <iframe
                        src={lesson.videoUrl}
                        className="w-full h-full rounded-lg"
                        frameBorder="0"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        title={lesson.title}
                      />
                    ) : (
                      <div className="text-center">
                        <Video className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">講習なし</p>
                      </div>
                    )}
                  </div>

                  {/* Video Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300">{formatDuration(lesson.duration)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {releaseInfo.icon}
                        <span className="text-gray-300">{releaseInfo.text}</span>
                      </div>
                    </div>

                    {lesson.description && (
                      <p className="text-sm text-gray-400 line-clamp-2">{lesson.description}</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => openEditModal(lesson)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Edit3 className="w-3 h-3 mr-1" />
                      編集
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-gray-900 border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Plus className="w-5 h-5" />
                新しい講習を追加
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info - Simplified */}

              <div>
                <Label className="text-gray-300">Vimeo埋め込みコード *</Label>
                <textarea
                  value={formData.vimeoEmbedCode}
                  onChange={async (e) => {
                    const embedCode = e.target.value
                    setFormData(prev => ({ ...prev, vimeoEmbedCode: embedCode }))
                    
                    // Auto-fetch duration and title when embed code is pasted
                    const vimeoId = extractVimeoId(embedCode)
                    if (vimeoId) {
                      const vimeoData = await fetchVimeoData(vimeoId)
                      if (vimeoData) {
                        setFormData(prev => ({ 
                          ...prev, 
                          duration: vimeoData.duration,
                          title: vimeoData.title || prev.title
                        }))
                      }
                    }
                  }}
                  placeholder='<iframe src="https://player.vimeo.com/video/123456789" width="640" height="360" frameborder="0" allowfullscreen></iframe>'
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-black font-mono text-sm resize-none"
                  rows={4}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  VimeoのEmbedコードをそのまま貼り付けてください（講習時間は自動取得されます）
                </p>
              </div>


              {/* Release Settings */}
              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  リリース設定
                </h3>

                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-300">公開方法</Label>
                    <select
                      value={formData.releaseType}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        releaseType: e.target.value as any,
                        releaseDays: undefined,
                        releaseDate: undefined,
                        prerequisiteId: undefined
                      }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-black"
                    >
                      <option value="IMMEDIATE">すぐに公開</option>
                      <option value="HIDDEN">非公開（一時的に視聴不可）</option>
                      <option value="DRIP">登録X日後に公開</option>
                      <option value="SCHEDULED">指定日に公開</option>
                      <option value="PREREQUISITE">前提レッスン完了後</option>
                    </select>
                  </div>

                  {formData.releaseType === 'DRIP' && (
                    <div>
                      <Label className="text-gray-300">公開日数</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.releaseDays || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, releaseDays: parseInt(e.target.value) || undefined }))}
                        placeholder="登録から何日後に公開するか"
                        className="bg-gray-800 border-gray-600 text-black"
                      />
                    </div>
                  )}

                  {formData.releaseType === 'SCHEDULED' && (
                    <div>
                      <Label className="text-gray-300">公開日</Label>
                      <Input
                        type="date"
                        value={formData.releaseDate || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, releaseDate: e.target.value }))}
                        className="bg-gray-800 border-gray-600 text-black"
                      />
                    </div>
                  )}

                  {formData.releaseType === 'PREREQUISITE' && (
                    <div>
                      <Label className="text-gray-300">前提レッスン</Label>
                      <select
                        value={formData.prerequisiteId || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, prerequisiteId: e.target.value || undefined }))}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-black"
                      >
                        <option value="">前提レッスンを選択</option>
                        {lessons.map(lesson => (
                          <option key={lesson.id} value={lesson.id}>
                            {lesson.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-gray-700">
                <Button
                  onClick={() => {
                    setShowCreateModal(false)
                    setFormData({
                      courseId: '',
                      title: '',
                      description: '',
                      vimeoEmbedCode: '',
                      duration: undefined,
                      orderIndex: 1,
                      releaseType: 'IMMEDIATE',
                      releaseDays: undefined,
                      releaseDate: undefined,
                      prerequisiteId: undefined
                    })
                  }}
                  variant="ghost"
                  className="flex-1 text-gray-400 hover:text-white"
                >
                  キャンセル
                </Button>
                <Button
                  onClick={handleCreateLesson}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white"
                >
                  講習を追加
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingLesson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-gray-900 border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="w-5 h-5" />
                リリース設定を編集: {editingLesson.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Display Order and Release Settings only */}
              <div>
                <Label className="text-gray-300">表示順</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.orderIndex}
                  onChange={(e) => setFormData(prev => ({ ...prev, orderIndex: parseInt(e.target.value) || 1 }))}
                  className="bg-gray-800 border-gray-600 text-black"
                />
              </div>

              {/* Release Settings */}
              <div className="pt-4 border-t border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">
                  公開設定
                </h3>

                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-300">公開方法</Label>
                    <select
                      value={formData.releaseType}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        releaseType: e.target.value as any,
                        releaseDays: undefined,
                        releaseDate: undefined,
                        prerequisiteId: undefined
                      }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-black"
                    >
                      <option value="IMMEDIATE">すぐに公開</option>
                      <option value="HIDDEN">非公開（一時的に視聴不可）</option>
                      <option value="DRIP">登録X日後に公開</option>
                      <option value="SCHEDULED">指定日に公開</option>
                      <option value="PREREQUISITE">前提レッスン完了後</option>
                    </select>
                  </div>

                  {formData.releaseType === 'DRIP' && (
                    <div>
                      <Label className="text-gray-300">公開日数</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.releaseDays || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, releaseDays: parseInt(e.target.value) || undefined }))}
                        className="bg-gray-800 border-gray-600 text-black"
                      />
                    </div>
                  )}

                  {formData.releaseType === 'SCHEDULED' && (
                    <div>
                      <Label className="text-gray-300">公開日</Label>
                      <Input
                        type="date"
                        value={formData.releaseDate || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, releaseDate: e.target.value }))}
                        className="bg-gray-800 border-gray-600 text-black"
                      />
                    </div>
                  )}

                  {formData.releaseType === 'PREREQUISITE' && (
                    <div>
                      <Label className="text-gray-300">前提レッスン</Label>
                      <select
                        value={formData.prerequisiteId || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, prerequisiteId: e.target.value || undefined }))}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-black"
                      >
                        <option value="">前提レッスンを選択</option>
                        {lessons
                          .filter(lesson => lesson.id !== editingLesson?.id)
                          .map(lesson => (
                            <option key={lesson.id} value={lesson.id}>
                              {lesson.title}
                            </option>
                          ))
                        }
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-gray-700">
                <Button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingLesson(null)
                  }}
                  variant="ghost"
                  className="flex-1 text-gray-400 hover:text-white"
                >
                  キャンセル
                </Button>
                <Button
                  onClick={handleUpdateLesson}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                >
                  更新
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
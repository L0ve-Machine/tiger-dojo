'use client'

import { useState, useEffect } from 'react'
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
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface Lesson {
  id: string
  title: string
  description: string
  videoUrl?: string
  duration?: number
  order: number
  isPublished: boolean
  createdAt: string
  course: {
    id: string
    title: string
    slug: string
  }
}

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<string>('')

  useEffect(() => {
    fetchLessons()
  }, [])

  const fetchLessons = async () => {
    try {
      setLoading(true)
      const response = await adminApi.getAdminLessons()
      setLessons(response.data.lessons || [])
    } catch (err: any) {
      console.error('Lessons fetch error:', err)
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '未設定'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lesson.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCourse = !selectedCourse || lesson.course.id === selectedCourse
    return matchesSearch && matchesCourse
  })

  const uniqueCourses = Array.from(new Set(lessons.map(l => l.course.id)))
    .map(courseId => lessons.find(l => l.course.id === courseId)?.course)
    .filter(Boolean) as Lesson['course'][]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-gold-500 to-gold-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Video className="w-6 h-6 text-black" />
          </div>
          <p className="text-gray-400">レッスンを読み込み中...</p>
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
        <Button onClick={fetchLessons} className="bg-gradient-to-r from-gold-500 to-gold-600 text-black">
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
          <h1 className="text-3xl font-bold text-white">レッスン管理</h1>
          <p className="text-gray-400 mt-1">動画レッスンとコンテンツの管理</p>
        </div>
        <Button className="bg-gradient-to-r from-gold-500 to-gold-600 text-black hover:from-gold-600 hover:to-gold-700">
          <Plus className="w-4 h-4 mr-2" />
          新規レッスン作成
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="レッスン名で検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800/50 border-gray-600 text-white"
          />
        </div>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-md text-white min-w-40"
        >
          <option value="">全コース</option>
          {uniqueCourses.map(course => (
            <option key={course.id} value={course.id}>{course.title}</option>
          ))}
        </select>
        <Button 
          onClick={fetchLessons}
          className="bg-gray-800 text-gray-300 hover:bg-gray-700"
        >
          更新
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gold-500 to-gold-600 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-black" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{lessons.length}</p>
                <p className="text-sm text-gray-400">総レッスン数</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{lessons.filter(l => l.isPublished).length}</p>
                <p className="text-sm text-gray-400">公開中</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{uniqueCourses.length}</p>
                <p className="text-sm text-gray-400">コース数</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Play className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {lessons.filter(l => l.videoUrl).length}
                </p>
                <p className="text-sm text-gray-400">動画あり</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lessons List */}
      <div className="space-y-4">
        {filteredLessons.length === 0 ? (
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-8 text-center">
              <Video className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">
                {searchTerm || selectedCourse ? 'レッスンが見つかりませんでした' : 'まだレッスンがありません'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredLessons.map((lesson) => (
            <Card key={lesson.id} className="bg-gray-900/50 border-gray-800 hover:bg-gray-900/70 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-gold-500 to-gold-600 rounded-lg flex items-center justify-center">
                        {lesson.videoUrl ? (
                          <Play className="w-5 h-5 text-black" />
                        ) : (
                          <FileText className="w-5 h-5 text-black" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{lesson.title}</h3>
                        <p className="text-sm text-gray-400">
                          {lesson.course.title} • 順序: {lesson.order}
                        </p>
                      </div>
                      <div className="ml-auto flex items-center gap-2">
                        {lesson.isPublished ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                            <Eye className="w-3 h-3 mr-1" />
                            公開中
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">
                            <Clock className="w-3 h-3 mr-1" />
                            下書き
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-300 mb-4 line-clamp-2">{lesson.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatDuration(lesson.duration)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>{formatDate(lesson.createdAt)}</span>
                        </div>
                        {lesson.videoUrl && (
                          <div className="flex items-center gap-1">
                            <Video className="w-4 h-4" />
                            <span>動画あり</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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
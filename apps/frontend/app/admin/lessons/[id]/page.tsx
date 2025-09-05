'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Video, Clock, Users, Settings, Save } from 'lucide-react'
import { AdhocAccessManager } from '@/components/admin/AdhocAccessManager'

interface Lesson {
  id: string
  title: string
  description: string
  videoUrl: string
  duration: number
  orderIndex: number
  releaseType: string
  releaseDays?: number
  releaseDate?: string
  course: {
    id: string
    title: string
  }
}

export default function AdminLessonDetailPage() {
  const params = useParams()
  const router = useRouter()
  const lessonId = params.id as string

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    duration: 0,
    orderIndex: 0,
    releaseType: 'IMMEDIATE',
    releaseDays: 0,
    releaseDate: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchLesson()
  }, [lessonId])

  const fetchLesson = async () => {
    try {
      const res = await fetch(`/api/lessons/${lessonId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (res.ok) {
        const data = await res.json()
        setLesson(data.lesson)
        setFormData({
          title: data.lesson.title,
          description: data.lesson.description || '',
          videoUrl: data.lesson.videoUrl,
          duration: data.lesson.duration || 0,
          orderIndex: data.lesson.orderIndex,
          releaseType: data.lesson.releaseType,
          releaseDays: data.lesson.releaseDays || 0,
          releaseDate: data.lesson.releaseDate 
            ? new Date(data.lesson.releaseDate).toISOString().split('T')[0]
            : ''
        })
      }
    } catch (error) {
      console.error('Failed to fetch lesson:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          releaseDate: formData.releaseDate ? new Date(formData.releaseDate) : null
        })
      })

      if (res.ok) {
        alert('レッスンを更新しました')
        setIsEditing(false)
        fetchLesson()
      } else {
        alert('レッスンの更新に失敗しました')
      }
    } catch (error) {
      console.error('Failed to update lesson:', error)
      alert('レッスンの更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-dark-950 to-black p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-white text-center">読み込み中...</div>
        </div>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-dark-950 to-black p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-white text-center">レッスンが見つかりません</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-950 to-black">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            戻る
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{lesson.title}</h1>
              <p className="text-gray-400">コース: {lesson.course.title}</p>
            </div>
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={saving}
              className="flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {isEditing ? (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  {saving ? '保存中...' : '保存'}
                </>
              ) : (
                <>
                  <Settings className="w-5 h-5 mr-2" />
                  編集
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Lesson Details */}
          <div className="bg-dark-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Video className="w-5 h-5 mr-2" />
              レッスン詳細
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  タイトル
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  disabled={!isEditing}
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  説明
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={!isEditing}
                  rows={4}
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Vimeo動画ID
                </label>
                <input
                  type="text"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  disabled={!isEditing}
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    動画時間（秒）
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    disabled={!isEditing}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    表示順
                  </label>
                  <input
                    type="number"
                    value={formData.orderIndex}
                    onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) })}
                    disabled={!isEditing}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  公開タイプ
                </label>
                <select
                  value={formData.releaseType}
                  onChange={(e) => setFormData({ ...formData, releaseType: e.target.value })}
                  disabled={!isEditing}
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="IMMEDIATE">即時公開</option>
                  <option value="SCHEDULED">日時指定</option>
                  <option value="DRIP">ドリップ配信</option>
                  <option value="PREREQUISITE">前提条件</option>
                </select>
              </div>

              {formData.releaseType === 'DRIP' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    登録から何日後
                  </label>
                  <input
                    type="number"
                    value={formData.releaseDays}
                    onChange={(e) => setFormData({ ...formData, releaseDays: parseInt(e.target.value) })}
                    disabled={!isEditing}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}

              {formData.releaseType === 'SCHEDULED' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    公開日時
                  </label>
                  <input
                    type="date"
                    value={formData.releaseDate}
                    onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                    disabled={!isEditing}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Adhoc Access Manager */}
          <AdhocAccessManager lessonId={lessonId} />
        </div>
      </div>
    </div>
  )
}
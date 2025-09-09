'use client'

import { useState, useRef } from 'react'
import { adminApi } from '@/lib/api'
import { 
  Upload as UploadIcon,
  VideoIcon,
  File,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Folder
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

interface UploadItem {
  id: string
  file: File
  title: string
  description: string
  courseId: string
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  error?: string
  vimeoId?: string
}

export default function UploadPage() {
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [courses] = useState([
    { id: 'course1', title: 'FX基礎コース', slug: 'fx-basics' },
    { id: 'course2', title: 'FX応用コース', slug: 'fx-advanced' }
  ]) // TODO: 実際のコースデータを取得
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('video/')) {
        const newUpload: UploadItem = {
          id: Date.now().toString() + Math.random(),
          file,
          title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          description: '',
          courseId: courses[0]?.id || '',
          status: 'pending',
          progress: 0
        }
        setUploads(prev => [...prev, newUpload])
      }
    })
  }

  const updateUpload = (id: string, updates: Partial<UploadItem>) => {
    setUploads(prev => prev.map(upload => 
      upload.id === id ? { ...upload, ...updates } : upload
    ))
  }

  const removeUpload = (id: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== id))
  }

  const startUpload = async (upload: UploadItem) => {
    if (!upload.title.trim() || !upload.courseId) {
      updateUpload(upload.id, { 
        status: 'error', 
        error: 'タイトルとコースを設定してください' 
      })
      return
    }

    updateUpload(upload.id, { status: 'uploading', progress: 0 })

    try {
      // Create FormData for multipart upload
      const formData = new FormData()
      formData.append('video', upload.file)
      formData.append('title', upload.title)
      formData.append('description', upload.description)
      formData.append('courseId', upload.courseId)

      // TODO: Implement actual upload with progress tracking
      // For now, simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200))
        updateUpload(upload.id, { progress: i })
        
        if (i === 50) {
          updateUpload(upload.id, { status: 'processing' })
        }
      }

      // Simulate successful upload
      updateUpload(upload.id, { 
        status: 'completed',
        progress: 100,
        vimeoId: `video_${Date.now()}`
      })

    } catch (error: any) {
      updateUpload(upload.id, {
        status: 'error',
        error: error.message || 'アップロードに失敗しました'
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIcon = (status: UploadItem['status']) => {
    switch (status) {
      case 'pending': return <File className="w-5 h-5 text-gray-400" />
      case 'uploading': return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
      case 'processing': return <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'error': return <AlertCircle className="w-5 h-5 text-red-400" />
      default: return <File className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusText = (status: UploadItem['status']) => {
    switch (status) {
      case 'pending': return '待機中'
      case 'uploading': return 'アップロード中'
      case 'processing': return '処理中'
      case 'completed': return '完了'
      case 'error': return 'エラー'
      default: return '不明'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">動画アップロード</h1>
        <p className="text-gray-400 mt-1">レッスン動画をアップロードして管理します</p>
      </div>

      {/* Upload Zone */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <UploadIcon className="w-5 h-5" />
            ファイルアップロード
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${dragActive 
                ? 'border-gold-400 bg-gold-400/10' 
                : 'border-gray-600 hover:border-gray-500'
              }
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <VideoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-white mb-2">
              動画ファイルをドラッグ&ドロップ
            </p>
            <p className="text-gray-400 mb-4">
              または
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-to-r from-gold-500 to-gold-600 text-black hover:from-gold-600 hover:to-gold-700"
            >
              <Folder className="w-4 h-4 mr-2" />
              ファイルを選択
            </Button>
            <p className="text-sm text-gray-500 mt-4">
              対応形式: MP4, MOV, AVI, WMV (最大2GB)
            </p>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            multiple
            onChange={handleFileInput}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Upload Queue */}
      {uploads.length > 0 && (
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">アップロードキュー ({uploads.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploads.map((upload) => (
                <div key={upload.id} className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {getStatusIcon(upload.status)}
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{upload.file.name}</p>
                          <p className="text-sm text-gray-400">
                            {formatFileSize(upload.file.size)} • {getStatusText(upload.status)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeUpload(upload.id)}
                          className="text-gray-400 hover:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Progress bar */}
                      {(upload.status === 'uploading' || upload.status === 'processing') && (
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-gold-500 to-gold-600 h-2 rounded-full transition-all"
                            style={{ width: `${upload.progress}%` }}
                          />
                        </div>
                      )}

                      {/* Error message */}
                      {upload.status === 'error' && upload.error && (
                        <p className="text-sm text-red-400">{upload.error}</p>
                      )}

                      {/* Upload form */}
                      {upload.status === 'pending' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-gray-300">レッスンタイトル</Label>
                            <Input
                              value={upload.title}
                              onChange={(e) => updateUpload(upload.id, { title: e.target.value })}
                              className="bg-gray-700 border-gray-600 text-white"
                              placeholder="レッスンのタイトルを入力"
                            />
                          </div>
                          
                          <div>
                            <Label className="text-gray-300">コース</Label>
                            <select
                              value={upload.courseId}
                              onChange={(e) => updateUpload(upload.id, { courseId: e.target.value })}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                            >
                              {courses.map(course => (
                                <option key={course.id} value={course.id}>
                                  {course.title}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="md:col-span-2">
                            <Label className="text-gray-300">説明</Label>
                            <Textarea
                              value={upload.description}
                              onChange={(e) => updateUpload(upload.id, { description: e.target.value })}
                              className="bg-gray-700 border-gray-600 text-white"
                              placeholder="レッスンの説明を入力"
                              rows={2}
                            />
                          </div>
                          
                          <div className="md:col-span-2">
                            <Button
                              onClick={() => startUpload(upload)}
                              className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
                            >
                              <UploadIcon className="w-4 h-4 mr-2" />
                              アップロード開始
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Success message */}
                      {upload.status === 'completed' && (
                        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                          <p className="text-green-400 text-sm">
                            ✓ アップロード完了！レッスンが作成されました。
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">アップロード手順</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-gray-300">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gold-500 text-black rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <p>動画ファイルを選択またはドラッグ&ドロップ</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gold-500 text-black rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <p>レッスンタイトル、コース、説明を入力</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gold-500 text-black rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <p>アップロード開始ボタンをクリック</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gold-500 text-black rounded-full flex items-center justify-center text-sm font-bold">4</div>
              <p>処理完了後、レッスン管理ページで詳細設定を行う</p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
            <p className="text-yellow-400 text-sm">
              💡 <strong>ヒント:</strong> 高品質な学習体験のため、1080p以上の解像度での動画アップロードを推奨します。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
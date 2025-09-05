'use client'

import { useEffect, useState } from 'react'
import { VimeoPlayer } from './VimeoPlayer'
import { useAuthStore } from '@/lib/auth-store'
import { VimeoProgressData } from '@/lib/vimeo'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Lock, AlertTriangle } from 'lucide-react'

interface ProtectedVideoPlayerProps {
  lessonId: string
  videoId: string
  title?: string
  startTime?: number
  onProgress?: (data: VimeoProgressData) => void
  onComplete?: () => void
  className?: string
  enableDRM?: boolean
  allowDownload?: boolean
  requiresAuth?: boolean
  watermarkText?: string
}

export default function ProtectedVideoPlayer({
  lessonId,
  videoId,
  title,
  startTime,
  onProgress,
  onComplete,
  className,
  enableDRM = true,
  allowDownload = false,
  requiresAuth = true,
  watermarkText
}: ProtectedVideoPlayerProps) {
  const { user } = useAuthStore()
  const [accessGranted, setAccessGranted] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Verify user access to this lesson
  useEffect(() => {
    const verifyAccess = async () => {
      if (!requiresAuth) {
        setAccessGranted(true)
        setIsVerifying(false)
        return
      }

      if (!user) {
        setError('ログインが必要です')
        setIsVerifying(false)
        return
      }

      // Check user's subscription status
      if (!user.subscription || user.subscription.status !== 'active') {
        setError('有料プランへの登録が必要です')
        setIsVerifying(false)
        return
      }
      
      try {
        // Check if user has access to this lesson
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/lessons/${lessonId}/access`, {
          credentials: 'include'
        })

        if (response.ok) {
          const data = await response.json()
          if (data.hasAccess) {
            setAccessGranted(true)
          } else {
            setError(data.reason || 'このレッスンにアクセスする権限がありません')
          }
        } else if (response.status === 401) {
          setError('認証が必要です。再ログインしてください。')
        } else {
          setError('アクセス権限の確認に失敗しました')
        }
      } catch (error) {
        console.error('Access verification error:', error)
        setError('サーバーエラーが発生しました')
      } finally {
        setIsVerifying(false)
      }
    }

    verifyAccess()
  }, [user, lessonId, requiresAuth])

  // Enhanced progress tracking with session verification
  const handleProgress = async (data: VimeoProgressData) => {
    if (!user || !accessGranted) return

    try {
      // Send progress update to server with session verification
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/progress/${lessonId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          watchedSeconds: data.seconds,
          duration: data.duration,
          completed: data.percent > 0.9, // Mark as completed if 90% watched
          timestamp: new Date().toISOString()
        })
      })

      // Call parent handler if provided
      onProgress?.(data)
    } catch (error) {
      console.error('Progress tracking error:', error)
    }
  }

  const handleComplete = async () => {
    if (!user || !accessGranted) return

    try {
      // Mark lesson as completed
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/progress/${lessonId}/complete`, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          completedAt: new Date().toISOString()
        })
      })

      onComplete?.()
    } catch (error) {
      console.error('Completion tracking error:', error)
      // Still call parent handler even if tracking fails
      onComplete?.()
    }
  }

  // Generate watermark text
  const generateWatermark = (): string => {
    if (watermarkText) return watermarkText
    if (!user) return 'FX Tiger Dojo'
    
    return `${user.name} - ${user.email} - FX Tiger Dojo`
  }

  // Security: Prevent video access in development tools
  useEffect(() => {
    if (enableDRM && accessGranted) {
      let devToolsOpen = false

      // Detect if dev tools are open
      const detectDevTools = () => {
        const threshold = 160
        setInterval(() => {
          if (window.outerHeight - window.innerHeight > threshold || 
              window.outerWidth - window.innerWidth > threshold) {
            if (!devToolsOpen) {
              devToolsOpen = true
              console.clear()
              console.warn('%cSecurity Warning: Developer tools detected. Video content is protected.', 
                'color: red; font-size: 20px; font-weight: bold;')
              // Could pause video or show warning overlay
            }
          } else {
            devToolsOpen = false
          }
        }, 500)
      }

      detectDevTools()

      // Disable console in production
      if (process.env.NODE_ENV === 'production') {
        console.log = () => {}
        console.warn = () => {}
        console.error = () => {}
        console.info = () => {}
        console.debug = () => {}
      }
    }
  }, [enableDRM, accessGranted])

  if (isVerifying) {
    return (
      <div className={`aspect-video bg-gray-900 rounded-xl flex items-center justify-center ${className}`}>
        <div className="text-center text-white">
          <Shield className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-lg font-semibold">アクセス権限を確認中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`aspect-video rounded-xl ${className}`}>
        <Alert variant="destructive" className="h-full flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
            <AlertDescription className="text-lg font-semibold mb-2">
              動画にアクセスできません
            </AlertDescription>
            <AlertDescription>{error}</AlertDescription>
          </div>
        </Alert>
      </div>
    )
  }

  if (!accessGranted) {
    return (
      <div className={`aspect-video bg-gray-900 rounded-xl flex items-center justify-center ${className}`}>
        <div className="text-center text-white">
          <Lock className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <p className="text-lg font-semibold mb-2">制限されたコンテンツ</p>
          <p className="text-sm text-gray-400">このレッスンにアクセスする権限がありません</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Security Notice */}
      {enableDRM && (
        <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
          <Shield className="w-4 h-4" />
          <span>このコンテンツはDRM保護されています</span>
        </div>
      )}

      <VimeoPlayer
        videoId={videoId}
        startTime={startTime}
        onProgress={handleProgress}
        onComplete={handleComplete}
        enableDRM={enableDRM}
        allowDownload={allowDownload}
        watermark={generateWatermark()}
        autoplay={false}
        controls={true}
      />

      {/* Security Footer */}
      {enableDRM && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          <p>© FX Tiger Dojo - 無断転載・複製を禁じます</p>
          <p>画面録画・ダウンロードは利用規約で禁止されています</p>
        </div>
      )}
    </div>
  )
}
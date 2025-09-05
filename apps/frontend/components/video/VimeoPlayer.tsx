'use client'

import React, { useEffect, useRef, useState } from 'react'
import { VimeoService, VimeoProgressData } from '@/lib/vimeo'
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, RotateCw, Loader2 } from 'lucide-react'

interface VimeoPlayerProps {
  videoId: string
  startTime?: number // seconds
  onProgress?: (data: VimeoProgressData) => void
  onComplete?: () => void
  onPlay?: () => void
  onPause?: () => void
  onMetadataLoaded?: (metadata: { title: string; description: string; duration: number }) => void
  className?: string
  autoplay?: boolean
  loop?: boolean
  controls?: boolean
  enableDRM?: boolean // DRM protection
  allowDownload?: boolean // Download control
  watermark?: string // Watermark text
}

export const VimeoPlayer: React.FC<VimeoPlayerProps> = ({
  videoId,
  startTime = 0,
  onProgress,
  onComplete,
  onPlay,
  onPause,
  onMetadataLoaded,
  className = '',
  autoplay = false,
  loop = false,
  controls = true,
  enableDRM = true,
  allowDownload = false,
  watermark
}) => {
  const playerRef = useRef<HTMLDivElement>(null)
  const vimeoServiceRef = useRef<VimeoService | null>(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // DRM and download protection
  useEffect(() => {
    if (enableDRM) {
      // Disable right-click context menu
      const handleContextMenu = (e: MouseEvent) => e.preventDefault()
      
      // Disable common keyboard shortcuts for downloading/inspecting
      const handleKeyDown = (e: KeyboardEvent) => {
        // Disable F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S, etc.
        if (
          e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'C' || e.key === 'J')) ||
          (e.ctrlKey && (e.key === 'u' || e.key === 's' || e.key === 'a')) ||
          e.key === 'PrintScreen'
        ) {
          e.preventDefault()
          return false
        }
      }

      // Disable text selection
      const handleSelectStart = (e: Event) => e.preventDefault()
      
      // Disable drag and drop
      const handleDragStart = (e: DragEvent) => e.preventDefault()

      document.addEventListener('contextmenu', handleContextMenu)
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('selectstart', handleSelectStart)
      document.addEventListener('dragstart', handleDragStart)

      return () => {
        document.removeEventListener('contextmenu', handleContextMenu)
        document.removeEventListener('keydown', handleKeyDown)
        document.removeEventListener('selectstart', handleSelectStart)
        document.removeEventListener('dragstart', handleDragStart)
      }
    }
  }, [enableDRM])

  useEffect(() => {
    let isDestroyed = false

    const initializePlayer = async () => {
      if (!playerRef.current || !videoId) return

      try {
        setIsLoading(true)
        setError(null)

        // Destroy any existing player first
        if (vimeoServiceRef.current) {
          vimeoServiceRef.current.destroy()
        }

        // Always create new VimeoService instance
        vimeoServiceRef.current = new VimeoService()

        // Clear the container
        if (playerRef.current) {
          playerRef.current.innerHTML = ''
        }

        // Short delay to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100))

        if (isDestroyed) return

        const playerOptions: any = {
          id: videoId,
          autoplay,
          loop,
          controls,
          responsive: true,
          quality: 'auto',
          speed: true
        }

        // DRM protection settings
        if (enableDRM) {
          playerOptions.dnt = true
          playerOptions.pip = false
          playerOptions.portrait = false
          playerOptions.title = false
          playerOptions.byline = false
          playerOptions.transparent = false
        }

        const player = vimeoServiceRef.current.initPlayer(playerRef.current!, playerOptions)

        if (isDestroyed) {
          vimeoServiceRef.current.destroy()
          return
        }

        // Set up progress tracking before ready
        if (onProgress) {
          vimeoServiceRef.current.onProgress(onProgress)
        }

        // Wait for player ready with proper error handling
        try {
          await player.ready()
        } catch (readyError) {
          console.warn('Player ready failed:', readyError)
          if (isDestroyed) return
          throw new Error('プレイヤーの初期化に失敗しました')
        }

        if (isDestroyed) {
          vimeoServiceRef.current.destroy()
          return
        }

        // Get video metadata including duration, title, and description
        try {
          const videoData = await vimeoServiceRef.current.getVideoData()
          if (!isDestroyed) {
            setDuration(videoData.duration)
            
            // Call the metadata callback if provided
            if (onMetadataLoaded) {
              onMetadataLoaded({
                title: videoData.title,
                description: videoData.description,
                duration: videoData.duration
              })
            }
          }
        } catch (metadataError) {
          console.warn('Failed to get video metadata:', metadataError)
          // Fallback to just getting duration
          try {
            const videoDuration = await player.getDuration()
            if (!isDestroyed) {
              setDuration(videoDuration)
            }
          } catch (durationError) {
            console.warn('Failed to get duration:', durationError)
          }
        }

        // Set start time if provided
        if (startTime > 0 && !isDestroyed) {
          try {
            await player.setCurrentTime(startTime)
          } catch (seekError) {
            console.warn('Failed to set start time:', seekError)
          }
        }

        if (isDestroyed) {
          vimeoServiceRef.current.destroy()
          return
        }

        // Set up event listeners
        player.on('play', () => {
          if (!isDestroyed) {
            setIsPlaying(true)
            onPlay?.()
          }
        })

        player.on('pause', () => {
          if (!isDestroyed) {
            setIsPlaying(false)
            onPause?.()
          }
        })

        player.on('ended', () => {
          if (!isDestroyed) {
            setIsPlaying(false)
            onComplete?.()
          }
        })

        player.on('volumechange', (data: { volume: number }) => {
          if (!isDestroyed) {
            setIsMuted(data.volume === 0)
          }
        })

        player.on('timeupdate', (data: VimeoProgressData) => {
          if (!isDestroyed) {
            setCurrentTime(data.seconds)
          }
        })

        if (!isDestroyed) {
          setIsLoading(false)
        }

      } catch (err) {
        console.error('Failed to initialize Vimeo player:', err)
        if (!isDestroyed) {
          setError('動画の読み込みに失敗しました')
          setIsLoading(false)
        }
      }
    }

    initializePlayer()

    // Cleanup function
    return () => {
      isDestroyed = true
      if (vimeoServiceRef.current) {
        vimeoServiceRef.current.destroy()
      }
    }
  }, [videoId, startTime, autoplay, loop, controls, enableDRM, onProgress, onPlay, onPause, onComplete, onMetadataLoaded])

  const handlePlayPause = async () => {
    try {
      if (!vimeoServiceRef.current || !vimeoServiceRef.current.playerInstance) {
        console.warn('Player not available for play/pause')
        return
      }
      
      if (isPlaying) {
        await vimeoServiceRef.current.pause()
      } else {
        await vimeoServiceRef.current.play()
      }
    } catch (err) {
      console.error('Play/pause error:', err)
    }
  }

  const handleSeek = async (seconds: number) => {
    try {
      if (!vimeoServiceRef.current || !vimeoServiceRef.current.playerInstance) {
        console.warn('Player not available for seek')
        return
      }
      
      await vimeoServiceRef.current.setCurrentTime(seconds)
    } catch (err) {
      console.error('Seek error:', err)
    }
  }

  const handleSkip = async (seconds: number) => {
    try {
      if (!vimeoServiceRef.current || !vimeoServiceRef.current.playerInstance) {
        console.warn('Player not available for skip')
        return
      }
      
      const current = await vimeoServiceRef.current.getCurrentTime()
      const newTime = Math.max(0, Math.min(duration, current + seconds))
      await vimeoServiceRef.current.setCurrentTime(newTime)
    } catch (err) {
      console.error('Skip error:', err)
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  if (error) {
    return (
      <div className={`relative aspect-video bg-gray-900 rounded-xl flex items-center justify-center ${className}`}>
        <div className="text-center text-red-400 p-6">
          <div className="w-12 h-12 mx-auto mb-4 text-red-400">⚠️</div>
          <p className="text-lg font-semibold mb-2">動画の読み込みエラー</p>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative group ${className} ${enableDRM ? 'select-none' : ''}`} style={{ userSelect: enableDRM ? 'none' : 'auto' }}>
      {/* Vimeo Player Container */}
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden" style={{ 
        pointerEvents: enableDRM ? 'auto' : 'auto',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        userSelect: 'none'
      }}>
        <div ref={playerRef} className="w-full h-full" />
        
        {/* DRM Protection Overlay */}
        {enableDRM && (
          <div className="absolute inset-0 pointer-events-none" style={{ 
            background: 'transparent',
            zIndex: enableDRM ? 999 : 'auto'
          }} />
        )}
        
        {/* Watermark */}
        {watermark && (
          <div className="absolute top-4 right-4 text-white/50 text-sm font-semibold pointer-events-none z-50">
            {watermark}
          </div>
        )}
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="text-center text-white">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-sm">動画を読み込み中...</p>
            </div>
          </div>
        )}

        {/* Custom Controls Overlay */}
        {!isLoading && controls && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {/* Center Play/Pause Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={handlePlayPause}
                className="w-16 h-16 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70 transition-all transform hover:scale-110"
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8" />
                ) : (
                  <Play className="w-8 h-8 ml-1" />
                )}
              </button>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4">
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="w-full bg-gray-600 rounded-full h-1 cursor-pointer"
                     onClick={(e) => {
                       const rect = e.currentTarget.getBoundingClientRect()
                       const clickX = e.clientX - rect.left
                       const percentage = clickX / rect.width
                       handleSeek(duration * percentage)
                     }}>
                  <div 
                    className="bg-gold-500 h-1 rounded-full transition-all"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Play/Pause */}
                  <button
                    onClick={handlePlayPause}
                    className="text-white hover:text-gold-400 transition"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>

                  {/* Skip Backward */}
                  <button
                    onClick={() => handleSkip(-10)}
                    className="text-white hover:text-gold-400 transition"
                    title="10秒戻る"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>

                  {/* Skip Forward */}
                  <button
                    onClick={() => handleSkip(10)}
                    className="text-white hover:text-gold-400 transition"
                    title="10秒進む"
                  >
                    <RotateCw className="w-5 h-5" />
                  </button>

                  {/* Volume */}
                  <button
                    className="text-white hover:text-gold-400 transition"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>

                  {/* Time Display */}
                  <div className="text-white text-sm font-mono">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Fullscreen */}
                  <button
                    className="text-white hover:text-gold-400 transition"
                    title="フルスクリーン"
                  >
                    <Maximize className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="mt-4 text-white">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>進捗: {Math.round(progressPercentage)}%</span>
          <span>再生時間: {formatTime(currentTime)} / {formatTime(duration)}</span>
        </div>
      </div>
    </div>
  )
}
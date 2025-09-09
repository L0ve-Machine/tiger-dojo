'use client'

import Player from '@vimeo/player'

export interface VimeoPlayerOptions {
  id: string | number
  responsive?: boolean
  controls?: boolean
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  quality?: 'auto' | 'hd' | 'sd'
  speed?: boolean
  title?: boolean
  portrait?: boolean
  byline?: boolean
}

export interface VimeoProgressData {
  seconds: number
  percent: number
  duration: number
}

export class VimeoService {
  private player: Player | null = null
  private progressCallback: ((data: VimeoProgressData) => void) | null = null
  private lastSavedProgress = 0
  private progressSaveInterval = 10 // Save progress every 10 seconds

  constructor() {}

  get playerInstance(): Player | null {
    return this.player
  }

  initPlayer(element: HTMLElement, options: VimeoPlayerOptions): Player {
    // Destroy any existing player first
    if (this.player) {
      this.destroy()
    }

    const playerOptions = {
      id: options.id,
      responsive: options.responsive ?? true,
      controls: options.controls ?? true,
      autoplay: options.autoplay ?? false,
      loop: options.loop ?? false,
      muted: options.muted ?? false,
      quality: options.quality ?? 'auto',
      speed: options.speed ?? true,
      title: options.title ?? false,
      portrait: options.portrait ?? false,
      byline: options.byline ?? false,
      dnt: true, // Do not track
      color: '#EAB308', // Gold color for controls
    }

    try {
      this.player = new Player(element, playerOptions)
      this.setupEventListeners()
    } catch (error) {
      console.error('Failed to create Vimeo player:', error)
      throw error
    }
    
    return this.player
  }

  private setupEventListeners() {
    if (!this.player) return

    // Progress tracking
    this.player.on('timeupdate', (data: VimeoProgressData) => {
      if (this.progressCallback) {
        // Save progress every 10 seconds of actual viewing
        if (data.seconds - this.lastSavedProgress >= this.progressSaveInterval) {
          this.progressCallback(data)
          this.lastSavedProgress = data.seconds
        }
      }
    })

    // Video events for analytics
    this.player.on('play', () => {
      console.log('Video started playing')
    })

    this.player.on('pause', () => {
      console.log('Video paused')
    })

    this.player.on('ended', () => {
      console.log('Video ended')
      // Auto-save progress when video ends
      if (this.progressCallback) {
        this.player?.getCurrentTime().then(seconds => {
          this.player?.getDuration().then(duration => {
            this.progressCallback?.({
              seconds,
              percent: (seconds / duration) * 100,
              duration
            })
          })
        })
      }
    })

    this.player.on('error', (error) => {
      console.error('Vimeo player error:', error)
    })
  }

  onProgress(callback: (data: VimeoProgressData) => void) {
    this.progressCallback = callback
  }

  async play(): Promise<void> {
    if (!this.player) {
      console.warn('Player not initialized for play()')
      return
    }
    try {
      return await this.player.play()
    } catch (error) {
      console.error('Play error:', error)
      throw error
    }
  }

  async pause(): Promise<void> {
    if (!this.player) {
      console.warn('Player not initialized for pause()')
      return
    }
    try {
      return await this.player.pause()
    } catch (error) {
      console.error('Pause error:', error)
      throw error
    }
  }

  async getCurrentTime(): Promise<number> {
    if (!this.player) {
      console.warn('Player not initialized for getCurrentTime()')
      return 0
    }
    try {
      return await this.player.getCurrentTime()
    } catch (error) {
      console.error('Get current time error:', error)
      return 0
    }
  }

  async getDuration(): Promise<number> {
    if (!this.player) {
      console.warn('Player not initialized for getDuration()')
      return 0
    }
    try {
      return await this.player.getDuration()
    } catch (error) {
      console.error('Get duration error:', error)
      return 0
    }
  }

  async setCurrentTime(seconds: number): Promise<number> {
    if (!this.player) {
      console.warn('Player not initialized for setCurrentTime()')
      return 0
    }
    try {
      return await this.player.setCurrentTime(seconds)
    } catch (error) {
      console.error('Set current time error:', error)
      return 0
    }
  }

  async getVideoData(): Promise<{
    id: number
    title: string
    description: string
    duration: number
    width: number
    height: number
  }> {
    if (!this.player) throw new Error('Player not initialized')
    
    const [id, title, description, duration, width, height] = await Promise.all([
      this.player.getVideoId(),
      this.player.getVideoTitle(),
      this.player.getVideoDescription(),
      this.player.getDuration(),
      this.player.getVideoWidth(),
      this.player.getVideoHeight()
    ])

    return { id, title, description, duration, width, height }
  }

  destroy() {
    if (this.player) {
      try {
        // Remove all event listeners first
        this.player.off('timeupdate')
        this.player.off('play')
        this.player.off('pause')
        this.player.off('ended')
        this.player.off('error')
        
        // Destroy the player
        this.player.destroy()
      } catch (error) {
        console.warn('Error destroying Vimeo player:', error)
      }
      this.player = null
    }
    this.progressCallback = null
    this.lastSavedProgress = 0
  }

  // Static helper methods
  static extractVideoId(url: string): string | null {
    // Extract Vimeo video ID from various URL formats
    const patterns = [
      /vimeo\.com\/(\d+)/,
      /player\.vimeo\.com\/video\/(\d+)/,
      /vimeo\.com\/video\/(\d+)/
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        return match[1]
      }
    }

    // If it's just a number, assume it's already an ID
    if (/^\d+$/.test(url)) {
      return url
    }

    return null
  }

  static isValidVimeoUrl(url: string): boolean {
    return this.extractVideoId(url) !== null
  }

  static generateThumbnailUrl(videoId: string, size: 'small' | 'medium' | 'large' = 'medium'): string {
    const sizes = {
      small: '200x150',
      medium: '640x360',
      large: '1280x720'
    }
    
    return `https://i.vimeocdn.com/video/${videoId}_${sizes[size]}.webp`
  }

  static generateEmbedUrl(videoId: string, options: {
    autoplay?: boolean
    loop?: boolean
    title?: boolean
    portrait?: boolean
    byline?: boolean
    color?: string
  } = {}): string {
    const params = new URLSearchParams({
      autoplay: options.autoplay ? '1' : '0',
      loop: options.loop ? '1' : '0',
      title: options.title ? '1' : '0',
      portrait: options.portrait ? '1' : '0',
      byline: options.byline ? '1' : '0',
      color: options.color || 'EAB308',
      dnt: '1'
    })

    return `https://player.vimeo.com/video/${videoId}?${params.toString()}`
  }
}
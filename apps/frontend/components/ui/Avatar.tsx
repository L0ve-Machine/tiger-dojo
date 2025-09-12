'use client'

import { useState } from 'react'
import { getAvatarUrl } from '@/lib/api'

interface AvatarProps {
  user: {
    id?: string
    name: string
    avatarColor?: string | null
    avatarImage?: string | null
  }
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const Avatar: React.FC<AvatarProps> = ({ user, size = 'md', className = '' }) => {
  const [imageError, setImageError] = useState(false)
  
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
    xl: 'w-16 h-16 text-xl'
  }
  
  const defaultGradient = 'from-yellow-400 to-amber-600'
  const gradient = user.avatarColor || defaultGradient
  
  // Convert avatar image path to full URL
  const avatarImageUrl = getAvatarUrl(user.avatarImage)
  
  
  // If user has an avatar image and it hasn't errored, show image
  if (avatarImageUrl && !imageError) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0 ${className}`}>
        <img
          src={avatarImageUrl}
          alt={`${user.name}のアバター`}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    )
  }
  
  // Otherwise show color gradient with initial
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md ${className}`}>
      {user.name?.charAt(0).toUpperCase() || 'U'}
    </div>
  )
}

export default Avatar
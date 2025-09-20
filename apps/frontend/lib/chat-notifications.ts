/**
 * Chat notification system utility functions
 * Manages localStorage for last opened timestamps and provides functions for checking unread messages
 */

const CHAT_LAST_OPENED_KEY = 'chat_last_opened'

/**
 * Get the last time chat was opened from localStorage
 * @returns ISO date string or null if never opened
 */
export function getChatLastOpened(): string | null {
  if (typeof window === 'undefined') return null
  
  return localStorage.getItem(CHAT_LAST_OPENED_KEY)
}

/**
 * Set the current time as the last chat opened timestamp
 */
export function setChatLastOpened(): void {
  if (typeof window === 'undefined') return
  
  const now = new Date().toISOString()
  localStorage.setItem(CHAT_LAST_OPENED_KEY, now)
}

/**
 * Get the last opened timestamp as Date object
 * @returns Date object or very old date if never opened
 */
export function getChatLastOpenedAsDate(): Date {
  const lastOpened = getChatLastOpened()
  
  if (lastOpened) {
    return new Date(lastOpened)
  }
  
  // Return very old date if never opened (1970-01-01)
  return new Date('1970-01-01T00:00:00.000Z')
}

/**
 * Check if there are unread messages since last opened
 * @param accessToken - Authentication token
 * @returns Promise with unread count and breakdown
 */
export async function checkUnreadMessagesSince(accessToken: string): Promise<{
  totalUnread: number
  messagesByChannel: Record<string, number>
  messagesByDM: Record<string, number>
  messagesByPrivateRoom: Record<string, number>
  since: string
} | null> {
  try {
    if (typeof window === 'undefined') return null
    
    // Use a very old timestamp to get all unread messages
    // The backend will filter using MessageRead table, which is more reliable
    const sinceDate = new Date('1970-01-01T00:00:00.000Z')
    
    const response = await fetch(`/api/chat/unread-since?since=${sinceDate.toISOString()}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.success ? {
        totalUnread: data.totalUnread,
        messagesByChannel: data.messagesByChannel || {},
        messagesByDM: data.messagesByDM || {},
        messagesByPrivateRoom: data.messagesByPrivateRoom || {},
        since: data.since
      } : null
    }
    
    return null
  } catch (error) {
    console.error('Failed to check unread messages:', error)
    return null
  }
}

/**
 * Fire a global event when chat is opened
 */
export function fireChatOpenedEvent(): void {
  if (typeof window === 'undefined') return
  
  // Update timestamp first
  setChatLastOpened()
  
  // Fire custom event
  window.dispatchEvent(new CustomEvent('chat-opened'))
}

/**
 * Listen for chat opened events
 * @param callback - Function to call when chat is opened
 * @returns Cleanup function
 */
export function onChatOpened(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  
  const handleChatOpened = () => callback()
  
  window.addEventListener('chat-opened', handleChatOpened)
  
  return () => window.removeEventListener('chat-opened', handleChatOpened)
}

/**
 * Start polling for unread messages
 * @param accessToken - Authentication token
 * @param callback - Function to call with unread data
 * @param interval - Polling interval in milliseconds (default: 60000)
 * @returns Stop function
 */
export function startUnreadPolling(
  accessToken: string, 
  callback: (unreadData: Awaited<ReturnType<typeof checkUnreadMessagesSince>>) => void,
  interval: number = 60000
): () => void {
  if (typeof window === 'undefined') return () => {}
  
  let isRunning = true
  
  const poll = async () => {
    if (!isRunning) return
    
    const unreadData = await checkUnreadMessagesSince(accessToken)
    callback(unreadData)
    
    if (isRunning) {
      setTimeout(poll, interval)
    }
  }
  
  // Initial check
  poll()
  
  return () => {
    isRunning = false
  }
}

/**
 * Setup storage event listener for cross-tab synchronization
 * @param callback - Function to call when chat last opened changes
 * @returns Cleanup function
 */
export function onChatLastOpenedChanged(callback: (newTimestamp: string | null) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === CHAT_LAST_OPENED_KEY) {
      callback(e.newValue)
    }
  }
  
  window.addEventListener('storage', handleStorageChange)
  
  return () => window.removeEventListener('storage', handleStorageChange)
}
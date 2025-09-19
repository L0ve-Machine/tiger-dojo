import { Router, Request, Response } from 'express'
import { authenticateToken } from '../middleware/auth.middleware'
import { prisma } from '../index'
import { io } from '../index'

const router = Router()

// POST /api/chat/message - Send a message via HTTP
router.post('/message', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const { content, channelId = 'general', roomType = 'course', roomId } = req.body

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' })
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, role: true, avatarColor: true, avatarImage: true }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Save message to database
    const message = await prisma.chatMessage.create({
      data: {
        userId: user.id,
        content: content.trim(),
        type: 'text',
        channelId,
        courseId: roomType === 'course' ? roomId : null,
        lessonId: roomType === 'lesson' ? roomId : null,
        privateRoomId: roomType === 'private' ? roomId : null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            avatarColor: true,
            avatarImage: true
          }
        }
      }
    })

    // Auto-mark user's own message as read
    await prisma.messageRead.create({
      data: {
        userId: user.id,
        messageId: message.id,
        readAt: new Date()
      }
    })

    // Format message for Socket.io broadcast
    const formattedMessage = {
      id: message.id,
      userId: message.user.id,
      userName: message.user.name,
      userRole: message.user.role,
      avatarColor: message.user.avatarColor,
      avatarImage: message.user.avatarImage,
      content: message.content,
      type: message.type,
      channelId: message.channelId,
      createdAt: message.createdAt,
      isEdited: message.isEdited
    }

    // Broadcast to Socket.io room if available
    const roomName = `${roomType}:${roomId || 'general'}`
    io.to(roomName).emit('new_message', formattedMessage)

    res.json({
      success: true,
      message: formattedMessage
    })

  } catch (error: any) {
    console.error('Send message error:', error)
    res.status(500).json({ error: 'Failed to send message' })
  }
})

// GET /api/chat/messages - Get messages for a channel
router.get('/messages', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const { channelId = 'general', roomType = 'course', roomId, limit = 50 } = req.query
    const userId = req.user.userId

    console.log(`📊 [get-messages] Starting for userId: ${userId}, channelId: ${channelId}, roomType: ${roomType}, roomId: ${roomId}`)

    const whereClause = {
      channelId: channelId as string,
      ...(roomType === 'course' && roomId ? { courseId: roomId as string } : {}),
      ...(roomType === 'lesson' && roomId ? { lessonId: roomId as string } : {}),
      ...(roomType === 'private' && roomId ? { privateRoomId: roomId as string } : {})
    }

    console.log(`📊 [get-messages] whereClause:`, whereClause)

    const messages = await prisma.chatMessage.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            avatarColor: true,
            avatarImage: true
          }
        },
        readBy: {
          where: {
            userId: userId
          },
          select: {
            readAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit)
    })

    console.log(`📊 [get-messages] Found ${messages.length} messages`)
    
    // Debug: Show read status for each message
    messages.forEach(msg => {
      const isRead = msg.readBy.length > 0
      const isOwnMessage = msg.userId === userId
      console.log(`📊 [get-messages] Message ${msg.id}: content="${msg.content.substring(0, 20)}", isOwnMessage=${isOwnMessage}, isRead=${isRead}, readBy=${msg.readBy.length}`)
    })

    const formattedMessages = messages.reverse().map(msg => ({
      id: msg.id,
      userId: msg.user.id,
      userName: msg.user.name,
      userRole: msg.user.role,
      avatarColor: msg.user.avatarColor,
      avatarImage: msg.user.avatarImage,
      content: msg.content,
      type: msg.type,
      channelId: msg.channelId,
      createdAt: msg.createdAt,
      isEdited: msg.isEdited
    }))

    res.json({
      success: true,
      messages: formattedMessages
    })

  } catch (error: any) {
    console.error('Get messages error:', error)
    res.status(500).json({ error: 'Failed to get messages' })
  }
})

// GET /api/chat/unread-count - Get unread message count for a user
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    console.log(`📊 [unread-count] Starting for userId: ${userId}`)

    // チャンネル別の未読数を計算
    const channelUnreadResult = await prisma.$queryRaw`
      SELECT cm.channelId, COUNT(*) as count
      FROM ChatMessage cm
      LEFT JOIN MessageRead mr ON cm.id = mr.messageId AND mr.userId = ${userId}
      WHERE cm.userId != ${userId}
        AND cm.dmRoomId IS NULL
        AND cm.privateRoomId IS NULL
        AND mr.messageId IS NULL
      GROUP BY cm.channelId
    `
    
    const channelUnreadMap: Record<string, number> = {}
    ;(channelUnreadResult as any[]).forEach(item => {
      if (item.channelId) {
        channelUnreadMap[item.channelId] = Number(item.count)
      }
    })
    
    // 合計未読数も計算（既存のコードとの互換性のため）
    const totalUnreadCount = Object.values(channelUnreadMap).reduce((sum, count) => sum + count, 0)
    
    console.log(`📊 [unread-count] Channel unread counts for user ${userId}:`, channelUnreadMap)
    console.log(`📊 [unread-count] Total unread count for user ${userId}: ${totalUnreadCount}`)

    // DM未読数も直接SQLで取得
    const dmUnreadResult = await prisma.$queryRaw`
      SELECT cm.dmRoomId, COUNT(*) as count
      FROM ChatMessage cm
      LEFT JOIN MessageRead mr ON cm.id = mr.messageId AND mr.userId = ${userId}
      WHERE cm.userId != ${userId}
        AND cm.dmRoomId IS NOT NULL
        AND mr.messageId IS NULL
      GROUP BY cm.dmRoomId
    `
    
    const dmUnreadMap: Record<string, number> = {}
    ;(dmUnreadResult as any[]).forEach(item => {
      if (item.dmRoomId) {
        dmUnreadMap[item.dmRoomId] = Number(item.count)
      }
    })

    console.log(`📊 [unread-count] DM unread counts for user ${userId}:`, dmUnreadMap)

    // デバッグ用：特定のDMルームの詳細を確認
    for (const dmRoomId of Object.keys(dmUnreadMap)) {
      const dmMessages = await prisma.chatMessage.findMany({
        where: {
          dmRoomId,
          NOT: { userId }
        },
        select: {
          id: true,
          content: true,
          userId: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })

      const readMessages = await prisma.messageRead.findMany({
        where: {
          userId,
          messageId: { in: dmMessages.map(m => m.id) }
        },
        select: {
          messageId: true,
          readAt: true
        }
      })

      console.log(`📊 [unread-count] DM ${dmRoomId} - Messages:`, dmMessages.length, 'Read:', readMessages.length)
      console.log(`📊 [unread-count] DM ${dmRoomId} - Recent messages:`, dmMessages.map(m => ({ id: m.id, content: m.content.substring(0, 20) })))
      console.log(`📊 [unread-count] DM ${dmRoomId} - Read message IDs:`, readMessages.map(r => r.messageId))
    }

    res.json({ 
      unreadCount: totalUnreadCount,
      channelUnreadCounts: channelUnreadMap,
      dmUnreadCounts: dmUnreadMap
    })
  } catch (error) {
    console.error('📊 [unread-count] Error getting unread count:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/chat/mark-read - Mark messages as read
router.post('/mark-read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId
    const { messageIds } = req.body

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!Array.isArray(messageIds)) {
      return res.status(400).json({ error: 'messageIds must be an array' })
    }

    // Create read records for the messages
    await Promise.all(
      messageIds.map(async (messageId: string) => {
        try {
          await prisma.messageRead.upsert({
            where: {
              userId_messageId: {
                userId,
                messageId
              }
            },
            update: {
              readAt: new Date()
            },
            create: {
              userId,
              messageId,
              readAt: new Date()
            }
          })
        } catch (error) {
          // Skip if message doesn't exist or other errors
          console.warn(`Failed to mark message ${messageId} as read:`, error)
        }
      })
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Error marking messages as read:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/chat/mark-channel-read - Mark all messages in a channel as read
router.post('/mark-channel-read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId
    const { channelId, lessonId, privateRoomId, dmRoomId } = req.body

    console.log('[mark-channel-read] Called with:', { channelId, lessonId, privateRoomId, dmRoomId, userId })

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Find all messages in the specified channel/context
    const whereClause: any = {
      NOT: { userId: userId } // Don't mark own messages as read
    }

    if (dmRoomId) {
      whereClause.dmRoomId = dmRoomId
      console.log('[mark-channel-read] Marking DM messages as read for room:', dmRoomId)
    } else if (privateRoomId) {
      whereClause.privateRoomId = privateRoomId
      console.log('[mark-channel-read] Marking private room messages as read for room:', privateRoomId)
    } else if (lessonId) {
      whereClause.lessonId = lessonId
      if (channelId) {
        whereClause.channelId = channelId
      }
      console.log('[mark-channel-read] Marking lesson messages as read for lesson:', lessonId, 'channel:', channelId)
    } else if (channelId) {
      whereClause.channelId = channelId
      // チャンネルの場合、lessonIdとdmRoomIdは両方nullにする
      whereClause.lessonId = null
      whereClause.dmRoomId = null
      console.log('[mark-channel-read] Marking channel messages as read for channel:', channelId)
    }

    console.log('[mark-channel-read] whereClause:', whereClause)

    // デバッグ: 実際にそのチャンネルにあるすべてのメッセージを確認
    if (channelId) {
      const allChannelMessages = await prisma.chatMessage.findMany({
        where: { channelId: channelId },
        select: { 
          id: true, 
          userId: true, 
          channelId: true, 
          content: true,
          createdAt: true 
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
      console.log(`[mark-channel-read] DEBUG: All messages in channel ${channelId}:`, allChannelMessages)
    }

    const messages = await prisma.chatMessage.findMany({
      where: whereClause,
      select: { id: true }
    })

    console.log(`[mark-channel-read] Found ${messages.length} messages to mark as read`)

    // Mark all these messages as read
    let markedCount = 0
    await Promise.all(
      messages.map(async (message) => {
        try {
          await prisma.messageRead.upsert({
            where: {
              userId_messageId: {
                userId,
                messageId: message.id
              }
            },
            update: {
              readAt: new Date()
            },
            create: {
              userId,
              messageId: message.id,
              readAt: new Date()
            }
          })
          markedCount++
        } catch (error) {
          console.warn(`[mark-channel-read] Failed to mark message ${message.id} as read:`, error)
        }
      })
    )

    console.log(`[mark-channel-read] Successfully marked ${markedCount} messages as read`)

    // Broadcast unread count update via Socket.io
    try {
      // Recalculate unread counts for this user
      const totalUnreadCount = await prisma.chatMessage.count({
        where: {
          AND: [
            { NOT: { userId: userId } },
            {
              NOT: {
                readBy: {
                  some: {
                    userId: userId
                  }
                }
              }
            }
          ]
        }
      })

      // Get DM-specific unread counts
      const dmUnreadCounts = await prisma.chatMessage.groupBy({
        by: ['dmRoomId'],
        where: {
          AND: [
            { dmRoomId: { not: null } },
            { NOT: { userId: userId } },
            {
              NOT: {
                readBy: {
                  some: {
                    userId: userId
                  }
                }
              }
            }
          ]
        },
        _count: {
          id: true
        }
      })

      const dmUnreadMap: Record<string, number> = {}
      dmUnreadCounts.forEach(item => {
        if (item.dmRoomId) {
          dmUnreadMap[item.dmRoomId] = item._count.id
        }
      })

      // Broadcast to user's room
      io.to(`user:${userId}`).emit('unread_count_update', {
        userId,
        unreadCount: totalUnreadCount,
        dmUnreadCounts: dmUnreadMap
      })
    } catch (socketError) {
      console.log('Socket.io broadcast failed:', socketError)
    }

    res.json({ success: true, markedCount: messages.length })
  } catch (error) {
    console.error('Error marking channel messages as read:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/chat/unread-since - Get unread messages since timestamp for notification system
router.get('/unread-since', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const { since } = req.query
    const userId = req.user.userId

    if (!since) {
      return res.status(400).json({ error: 'since parameter is required (ISO date string)' })
    }

    let sinceDate: Date
    try {
      sinceDate = new Date(since as string)
      if (isNaN(sinceDate.getTime())) {
        throw new Error('Invalid date')
      }
    } catch (error) {
      return res.status(400).json({ error: 'Invalid since date format. Use ISO 8601 format.' })
    }

    // Get unread messages since the specified time using MessageRead table for consistency
    const unreadMessages = await prisma.chatMessage.findMany({
      where: {
        AND: [
          { createdAt: { gt: sinceDate } },
          { NOT: { userId: userId } }, // Exclude own messages
          {
            // Only include messages that are NOT in the MessageRead table for this user
            NOT: {
              readBy: {
                some: {
                  userId: userId
                }
              }
            }
          },
          {
            OR: [
              // Public channel messages
              { 
                AND: [
                  { dmRoomId: null },
                  { privateRoomId: null }
                ]
              },
              // Direct messages where user is participant
              {
                dmRoomId: {
                  contains: userId // DM room IDs contain both user IDs
                }
              },
              // Private room messages where user is member
              { privateRoomId: { not: null } }
            ]
          }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit to prevent huge responses
    })

    // Group by channel/room for easier client handling
    const messagesByChannel: Record<string, number> = {}
    const messagesByDM: Record<string, number> = {}
    const messagesByPrivateRoom: Record<string, number> = {}

    for (const message of unreadMessages) {
      if (message.dmRoomId) {
        messagesByDM[message.dmRoomId] = (messagesByDM[message.dmRoomId] || 0) + 1
      } else if (message.privateRoomId) {
        messagesByPrivateRoom[message.privateRoomId] = (messagesByPrivateRoom[message.privateRoomId] || 0) + 1
      } else {
        const channelKey = message.channelId || 'general'
        messagesByChannel[channelKey] = (messagesByChannel[channelKey] || 0) + 1
      }
    }

    const totalUnread = unreadMessages.length

    console.log(`[unread-since] User ${userId}: ${totalUnread} unread since ${sinceDate.toISOString()}`)

    res.json({
      success: true,
      totalUnread,
      messagesByChannel,
      messagesByDM, 
      messagesByPrivateRoom,
      since: sinceDate.toISOString()
    })

  } catch (error: any) {
    console.error('Get unread since error:', error)
    res.status(500).json({ error: 'Failed to get unread messages' })
  }
})

export default router
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

    const messages = await prisma.chatMessage.findMany({
      where: {
        channelId: channelId as string,
        ...(roomType === 'course' && roomId ? { courseId: roomId as string } : {}),
        ...(roomType === 'lesson' && roomId ? { lessonId: roomId as string } : {}),
        ...(roomType === 'private' && roomId ? { privateRoomId: roomId as string } : {})
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
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit)
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

    // 直接SQLクエリで未読数計算
    const unreadCountResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM ChatMessage cm 
      WHERE cm.userId != ${userId} 
        AND cm.dmRoomId IS NULL 
        AND cm.privateRoomId IS NULL 
        AND cm.id NOT IN (
          SELECT messageId FROM MessageRead WHERE userId = ${userId}
        )
    `
    const unreadCount = Number((unreadCountResult as any)[0].count)
    
    console.log(`Unread count for user ${userId}: ${unreadCount}`)

    // DM未読数も直接SQLで取得
    const dmUnreadResult = await prisma.$queryRaw`
      SELECT cm.dmRoomId, COUNT(*) as count 
      FROM ChatMessage cm 
      WHERE cm.userId != ${userId} 
        AND cm.dmRoomId IS NOT NULL 
        AND cm.id NOT IN (
          SELECT messageId FROM MessageRead WHERE userId = ${userId}
        )
      GROUP BY cm.dmRoomId
    `
    
    const dmUnreadMap: Record<string, number> = {}
    ;(dmUnreadResult as any[]).forEach(item => {
      if (item.dmRoomId) {
        dmUnreadMap[item.dmRoomId] = Number(item.count)
      }
    })

    res.json({ 
      unreadCount,
      dmUnreadCounts: dmUnreadMap
    })
  } catch (error) {
    console.error('Error getting unread count:', error)
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

    console.log('mark-channel-read called with:', { channelId, lessonId, privateRoomId, dmRoomId, userId })

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Find all messages in the specified channel/context
    const whereClause: any = {
      NOT: { userId: userId } // Don't mark own messages as read
    }

    if (dmRoomId) {
      whereClause.dmRoomId = dmRoomId
    } else if (privateRoomId) {
      whereClause.privateRoomId = privateRoomId
    } else if (lessonId) {
      whereClause.lessonId = lessonId
      if (channelId) {
        whereClause.channelId = channelId
      }
    } else if (channelId) {
      whereClause.channelId = channelId
      // チャンネルの場合、lessonIdとdmRoomIdは両方nullにする
      whereClause.lessonId = null
      whereClause.dmRoomId = null
    }

    console.log('whereClause:', whereClause)

    const messages = await prisma.chatMessage.findMany({
      where: whereClause,
      select: { id: true }
    })

    console.log(`Found ${messages.length} messages to mark as read`)

    // Mark all these messages as read
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
        } catch (error) {
          console.warn(`Failed to mark message ${message.id} as read:`, error)
        }
      })
    )

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

export default router
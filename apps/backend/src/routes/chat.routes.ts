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

export default router
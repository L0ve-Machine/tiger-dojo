import { Router, Request, Response } from 'express'
import { authenticateToken as authMiddleware } from '../middleware/auth.middleware'
import { prisma } from '../index'

const router = Router()

// Get all users for DM (excluding self)
router.get('/users', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    
    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        role: true,
        avatarColor: true,
        avatarImage: true,
        lastLoginAt: true
      },
      orderBy: [
        { role: 'desc' }, // ADMIN, INSTRUCTOR, STUDENT
        { name: 'asc' }
      ]
    })

    res.json(users)
  } catch (error) {
    console.error('Get DM users error:', error)
    res.status(500).json({ error: 'Failed to get users' })
  }
})

// Get DM conversation with a specific user
router.get('/conversation/:otherUserId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    
    const { otherUserId } = req.params
    
    // Create consistent DM room ID
    const dmRoomId = [userId, otherUserId].sort().join('_')
    
    const messages = await prisma.chatMessage.findMany({
      where: {
        dmRoomId: dmRoomId
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
      take: 100
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
      createdAt: msg.createdAt,
      isEdited: msg.isEdited
    }))

    // Get other user info
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: {
        id: true,
        name: true,
        role: true,
        avatarColor: true,
        avatarImage: true
      }
    })

    res.json({
      dmRoomId,
      otherUser,
      messages: formattedMessages
    })
  } catch (error) {
    console.error('Get DM conversation error:', error)
    res.status(500).json({ error: 'Failed to get conversation' })
  }
})

// Get recent DM conversations
router.get('/recent', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    
    // Get recent DM messages where user participated
    const recentMessages = await prisma.chatMessage.findMany({
      where: {
        dmRoomId: {
          contains: userId
        }
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
      take: 50
    })

    // Group by DM room and get latest message for each
    const conversationsMap = new Map()
    
    for (const message of recentMessages) {
      const dmRoomId = message.dmRoomId
      
      if (!dmRoomId) continue // Skip messages without dmRoomId
      
      if (!conversationsMap.has(dmRoomId)) {
        // Get the other user ID
        const userIds = dmRoomId.split('_')
        const otherUserId = userIds.find(id => id !== userId)
        
        if (otherUserId) {
          const otherUser = await prisma.user.findUnique({
            where: { id: otherUserId },
            select: {
              id: true,
              name: true,
              role: true,
              avatarColor: true,
              avatarImage: true
            }
          })

          conversationsMap.set(dmRoomId, {
            dmRoomId,
            otherUser,
            lastMessage: {
              id: message.id,
              userId: message.user.id,
              userName: message.user.name,
              content: message.content,
              createdAt: message.createdAt
            }
          })
        }
      }
    }

    const conversations = Array.from(conversationsMap.values())
    res.json(conversations)
  } catch (error) {
    console.error('Get recent DMs error:', error)
    res.status(500).json({ error: 'Failed to get recent conversations' })
  }
})

// POST /api/dm/message - Send a DM message via HTTP
router.post('/message', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const { content, otherUserId } = req.body

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' })
    }

    if (!otherUserId) {
      return res.status(400).json({ error: 'Other user ID is required' })
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, role: true, avatarColor: true, avatarImage: true }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Create consistent DM room ID
    const dmRoomId = [user.id, otherUserId].sort().join('_')

    // Save DM message to database
    const message = await prisma.chatMessage.create({
      data: {
        userId: user.id,
        content: content.trim(),
        type: 'text',
        dmRoomId: dmRoomId
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

    // Format message for response
    const formattedMessage = {
      id: message.id,
      userId: message.user.id,
      userName: message.user.name,
      userRole: message.user.role,
      avatarColor: message.user.avatarColor,
      avatarImage: message.user.avatarImage,
      content: message.content,
      type: message.type,
      createdAt: message.createdAt,
      isEdited: message.isEdited
    }

    // Try to broadcast to Socket.io room if available
    try {
      const { io } = require('../index')
      const roomName = `dm:${dmRoomId}`
      io.to(roomName).emit('new_message', formattedMessage)
    } catch (socketError) {
      console.log('Socket.io broadcast failed, message saved to DB only:', socketError.message)
    }

    res.json({
      success: true,
      message: formattedMessage
    })

  } catch (error: any) {
    console.error('Send DM message error:', error)
    res.status(500).json({ error: 'Failed to send message' })
  }
})

export default router
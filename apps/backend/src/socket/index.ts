import { Server, Socket } from 'socket.io'
import { Server as HTTPServer } from 'http'
import jwt from 'jsonwebtoken'
import { prisma } from '../index'

interface SocketData {
  userId: string
  userName: string
  userRole: string
  email: string
}

interface JoinRoomData {
  roomType: 'lesson' | 'course' | 'dm' | 'private'
  roomId: string
}

interface SendMessageData {
  roomType: 'lesson' | 'course' | 'dm' | 'private'
  roomId: string
  content: string
  type?: 'TEXT' | 'QUESTION' | 'ANSWER' | 'ANNOUNCEMENT'
}

interface TypingData {
  roomType: 'lesson' | 'course' | 'dm' | 'private'
  roomId: string
}

export class SocketServer {
  private io: Server
  private userSockets: Map<string, Set<string>> = new Map() // userId -> Set of socketIds
  private typingUsers: Map<string, Set<string>> = new Map() // roomId -> Set of userIds

  constructor(httpServer: HTTPServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: (process.env.CLIENT_URL || 'http://localhost:3000').split(',').map(url => url.trim()),
        credentials: true
      },
      transports: ['websocket', 'polling']
    })

    this.setupMiddleware()
    this.setupEventHandlers()
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token
        
        console.log('Socket authentication attempt with token:', token ? 'Present' : 'Missing')
        
        if (!token) {
          return next(new Error('Authentication token required'))
        }

        // Verify JWT token
        const decoded = jwt.verify(
          token,
          process.env.JWT_ACCESS_SECRET || 'fallback-secret'
        ) as any
        
        console.log('Token decoded successfully for userId:', decoded.userId)

        // Get user from database
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true
          }
        })

        if (!user) {
          return next(new Error('User not found'))
        }

        if (!user.isActive) {
          return next(new Error('Account is disabled'))
        }

        // Store user data in socket
        socket.data = {
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          email: user.email
        } as SocketData

        next()
      } catch (error) {
        console.error('Socket authentication error:', error)
        next(new Error('Authentication failed'))
      }
    })
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`✅ User ${socket.data.userName} connected (${socket.id})`)
      
      // Track user socket connections
      this.addUserSocket(socket.data.userId, socket.id)
      
      // Broadcast user online status
      this.broadcastUserStatus(socket.data.userId, true)

      // Handle room joining
      socket.on('join_room', async (data: JoinRoomData) => {
        await this.handleJoinRoom(socket, data)
      })

      // Handle leaving room
      socket.on('leave_room', async (data: JoinRoomData) => {
        await this.handleLeaveRoom(socket, data)
      })

      // Handle sending messages
      socket.on('send_message', async (data: SendMessageData) => {
        await this.handleSendMessage(socket, data)
      })

      // Handle typing indicators
      socket.on('typing_start', async (data: TypingData) => {
        await this.handleTypingStart(socket, data)
      })

      socket.on('typing_stop', async (data: TypingData) => {
        await this.handleTypingStop(socket, data)
      })

      // Handle fetching chat history
      socket.on('get_history', async (data: JoinRoomData) => {
        await this.handleGetHistory(socket, data)
      })

      // Handle fetching online users
      socket.on('get_online_users', async () => {
        await this.handleGetOnlineUsers(socket)
      })

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`👋 User ${socket.data.userName} disconnected (${socket.id})`)
        
        // Remove user socket and check if completely offline
        this.removeUserSocket(socket.data.userId, socket.id)
        
        // Clear typing status from all rooms
        this.clearUserTyping(socket.data.userId)
      })
    })
  }

  private async handleJoinRoom(socket: Socket, data: JoinRoomData) {
    const { roomType, roomId } = data
    const roomName = this.getRoomName(roomType, roomId)
    
    console.log(`User ${socket.data.userName} (${socket.data.userId}) attempting to join room: ${roomName}`)
    console.log(`Join room data: roomType=${roomType}, roomId=${roomId}`)
    
    // Extract channel from roomId if it contains channel info
    let channelId = 'general'
    let baseRoomId = roomId
    
    if (roomId.includes('_')) {
      const parts = roomId.split('_')
      baseRoomId = parts[0]
      channelId = parts[parts.length - 1]
    }

    try {
      // Check access permissions - pass the full roomId for course rooms
      const hasAccess = await this.checkRoomAccess(
        socket.data.userId,
        socket.data.userRole,
        roomType,
        roomId  // Use full roomId instead of baseRoomId
      )

      if (!hasAccess) {
        console.log(`Access denied for user ${socket.data.userName} to room ${roomName}`)
        socket.emit('error', { message: 'Access denied to this room' })
        return
      }

      // Leave all previous rooms
      socket.rooms.forEach(room => {
        if (room !== socket.id) {
          socket.leave(room)
        }
      })

      // Join the room
      socket.join(roomName)
      console.log(`User ${socket.data.userName} joined ${roomName} (channel: ${channelId})`)

      // Send room joined confirmation
      socket.emit('room_joined', {
        roomType,
        roomId,
        roomName,
        channelId
      })

      // Notify others in the room
      socket.to(roomName).emit('user_joined', {
        userId: socket.data.userId,
        userName: socket.data.userName,
        roomName,
        channelId
      })

      // Send recent chat history for this channel or DM
      if (roomType === 'dm') {
        const messages = await this.getRecentDmMessages(roomId, 50)
        socket.emit('message_history', { channelId: roomId, messages })
      } else {
        const messages = await this.getRecentMessages(roomType, baseRoomId, 50, channelId)
        socket.emit('message_history', { channelId, messages })
      }

      // Send current online users in room
      const onlineUsers = await this.getRoomOnlineUsers(roomName)
      socket.emit('room_online_users', onlineUsers)

    } catch (error) {
      console.error('Join room error:', error)
      socket.emit('error', { message: 'Failed to join room' })
    }
  }

  private async handleLeaveRoom(socket: Socket, data: JoinRoomData) {
    const { roomType, roomId } = data
    const roomName = this.getRoomName(roomType, roomId)

    socket.leave(roomName)
    console.log(`User ${socket.data.userName} left ${roomName}`)

    // Notify others in the room
    socket.to(roomName).emit('user_left', {
      userId: socket.data.userId,
      userName: socket.data.userName,
      roomName
    })

    // Clear typing status for this room
    this.removeTypingUser(roomName, socket.data.userId)
  }

  private async handleSendMessage(socket: Socket, data: SendMessageData) {
    const { roomType, roomId, content, type = 'TEXT' } = data
    const roomName = this.getRoomName(roomType, roomId)
    
    // Extract channel from roomId
    let channelId = 'general'
    let baseRoomId = roomId
    
    if (roomId.includes('_')) {
      const parts = roomId.split('_')
      baseRoomId = parts[0]
      channelId = parts[parts.length - 1]
    }

    try {
      // Check if user is in the room
      if (!socket.rooms.has(roomName)) {
        socket.emit('error', { message: 'You must join the room first' })
        return
      }

      // Save message to database with channel/DM/private room info
      let privateRoomId = null
      if (roomType === 'private') {
        // Get the actual private room ID from slug
        const privateRoom = await prisma.privateRoom.findUnique({
          where: { slug: baseRoomId }
        })
        privateRoomId = privateRoom?.id || null
      }

      const message = await this.saveMessage({
        userId: socket.data.userId,
        lessonId: roomType === 'lesson' ? baseRoomId : null,
        courseId: roomType === 'course' ? baseRoomId : null,
        privateRoomId,
        content,
        type,
        channelId: roomType === 'dm' ? undefined : channelId,
        dmRoomId: roomType === 'dm' ? roomId : null
      })

      // Get user avatar info
      const userInfo = await prisma.user.findUnique({
        where: { id: socket.data.userId },
        select: {
          avatarColor: true,
          avatarImage: true
        }
      })

      // Prepare message data
      const messageData = {
        id: message.id,
        userId: socket.data.userId,
        userName: socket.data.userName,
        userRole: socket.data.userRole,
        avatarColor: userInfo?.avatarColor,
        avatarImage: userInfo?.avatarImage,
        content: message.content,
        type: message.type,
        createdAt: message.createdAt,
        isEdited: message.isEdited,
        channelId
      }

      // Send to all users in the room (including sender)
      this.io.to(roomName).emit('new_message', messageData)

      // Clear typing indicator
      this.removeTypingUser(roomName, socket.data.userId)

    } catch (error) {
      console.error('Send message error:', error)
      socket.emit('error', { message: 'Failed to send message' })
    }
  }

  private async handleTypingStart(socket: Socket, data: TypingData) {
    const { roomType, roomId } = data
    const roomName = this.getRoomName(roomType, roomId)

    if (!socket.rooms.has(roomName)) return

    // Add to typing users
    if (!this.typingUsers.has(roomName)) {
      this.typingUsers.set(roomName, new Set())
    }
    this.typingUsers.get(roomName)!.add(socket.data.userId)

    // Broadcast typing status
    socket.to(roomName).emit('user_typing', {
      userId: socket.data.userId,
      userName: socket.data.userName,
      isTyping: true
    })
  }

  private async handleTypingStop(socket: Socket, data: TypingData) {
    const { roomType, roomId } = data
    const roomName = this.getRoomName(roomType, roomId)

    if (!socket.rooms.has(roomName)) return

    // Remove from typing users
    this.removeTypingUser(roomName, socket.data.userId)
  }

  private async handleGetHistory(socket: Socket, data: JoinRoomData) {
    const { roomType, roomId } = data

    try {
      const messages = await this.getRecentMessages(roomType, roomId, 100)
      socket.emit('message_history', messages)
    } catch (error) {
      console.error('Get history error:', error)
      socket.emit('error', { message: 'Failed to get message history' })
    }
  }

  private async handleGetOnlineUsers(socket: Socket) {
    const onlineUsers = await this.getAllOnlineUsers()
    socket.emit('online_users', onlineUsers)
  }

  // Helper methods
  private getRoomName(roomType: string, roomId: string): string {
    return `${roomType}_${roomId}`
  }

  private addUserSocket(userId: string, socketId: string) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set())
    }
    this.userSockets.get(userId)!.add(socketId)
  }

  private removeUserSocket(userId: string, socketId: string) {
    const sockets = this.userSockets.get(userId)
    if (sockets) {
      sockets.delete(socketId)
      if (sockets.size === 0) {
        this.userSockets.delete(userId)
        // User is completely offline
        this.broadcastUserStatus(userId, false)
      }
    }
  }

  private broadcastUserStatus(userId: string, isOnline: boolean) {
    this.io.emit('user_status_changed', {
      userId,
      isOnline
    })
  }

  private removeTypingUser(roomName: string, userId: string) {
    const typingSet = this.typingUsers.get(roomName)
    if (typingSet) {
      typingSet.delete(userId)
      if (typingSet.size === 0) {
        this.typingUsers.delete(roomName)
      }
    }

    // Broadcast typing stopped
    this.io.to(roomName).emit('user_typing', {
      userId,
      isTyping: false
    })
  }

  private clearUserTyping(userId: string) {
    this.typingUsers.forEach((users, roomName) => {
      if (users.has(userId)) {
        this.removeTypingUser(roomName, userId)
      }
    })
  }

  private async checkRoomAccess(
    userId: string,
    userRole: string,
    roomType: string,
    roomId: string
  ): Promise<boolean> {
    console.log(`🔒 Checking room access for user ${userId}, roomType: ${roomType}, roomId: ${roomId}`)
    
    try {
      // For private rooms (including locked chat rooms), verify membership
      if (roomType === 'private') {
        console.log(`🔒 Checking private room access for roomId: ${roomId}`)
        
        // First check if this is a private room by slug
        const privateRoom = await prisma.privateRoom.findUnique({
          where: { slug: roomId },
          include: {
            members: {
              where: {
                userId,
                isActive: true,
                isBanned: false
              }
            }
          }
        })
        
        if (privateRoom) {
          console.log(`🔒 Private room found: ${privateRoom.name}, checking membership`)
          const isCreator = privateRoom.createdBy === userId
          const isMember = privateRoom.members.length > 0
          const hasAccess = isCreator || isMember
          
          console.log(`🔒 Access result: isCreator=${isCreator}, isMember=${isMember}, hasAccess=${hasAccess}`)
          return hasAccess
        }
      }
      
      // For lesson and course rooms, check enrollment
      if (roomType === 'lesson' || roomType === 'course') {
        // Admin and instructors have access to all rooms
        if (userRole === 'ADMIN' || userRole === 'INSTRUCTOR') {
          console.log(`🔒 Granting access to ${userRole}`)
          return true
        }
        
        // TODO: Check course enrollment for students
        // For now, allow all authenticated users
        console.log(`🔒 Granting access to authenticated user for lesson/course room`)
        return true
      }
      
      // For DM rooms, allow all authenticated users
      if (roomType === 'dm') {
        console.log(`🔒 Granting access to DM room`)
        return true
      }
      
      // For regular chat rooms, allow all authenticated users
      console.log(`🔒 Granting access to regular chat room`)
      return true
      
    } catch (error) {
      console.error('🔒 Error checking room access:', error)
      return false
    }
  }

  private async saveMessage(data: {
    userId: string
    lessonId?: string | null
    courseId?: string | null
    privateRoomId?: string | null
    content: string
    type: string
    channelId?: string
    dmRoomId?: string | null
  }) {
    return prisma.chatMessage.create({
      data: {
        userId: data.userId,
        lessonId: data.lessonId,
        courseId: data.courseId,
        privateRoomId: data.privateRoomId,
        content: data.content,
        type: data.type as any,
        channelId: data.channelId || 'general',
        dmRoomId: data.dmRoomId
      }
    })
  }

  private async getRecentDmMessages(
    dmRoomId: string,
    limit: number
  ) {
    const messages = await prisma.chatMessage.findMany({
      where: { 
        dmRoomId: dmRoomId
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
      take: limit
    })

    return messages.reverse().map(msg => ({
      id: msg.id,
      userId: msg.user.id,
      userName: msg.user.name,
      userRole: msg.user.role,
      content: msg.content,
      type: msg.type,
      createdAt: msg.createdAt,
      isEdited: msg.isEdited
    }))
  }

  private async getRecentMessages(
    roomType: string,
    roomId: string,
    limit: number,
    channelId: string = 'general'
  ) {
    if (roomType === 'lesson') {
      const messages = await prisma.chatMessage.findMany({
        where: { 
          lessonId: roomId,
          channelId: channelId
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
        take: limit
      })

      return messages.reverse().map(msg => ({
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
    }

    if (roomType === 'course') {
      const messages = await prisma.chatMessage.findMany({
        where: { 
          courseId: roomId,
          channelId: channelId
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
        take: limit
      })

      return messages.reverse().map(msg => ({
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
    }

    if (roomType === 'private') {
      // Get the actual private room ID from slug
      const privateRoom = await prisma.privateRoom.findUnique({
        where: { slug: roomId }
      })
      
      if (!privateRoom) {
        return []
      }

      const messages = await prisma.chatMessage.findMany({
        where: { 
          privateRoomId: privateRoom.id,
          channelId: channelId
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
        take: limit
      })

      return messages.reverse().map(msg => ({
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
    }

    // For DM rooms, return empty array for now
    return []
  }

  private async getRoomOnlineUsers(roomName: string) {
    const sockets = await this.io.in(roomName).fetchSockets()
    const users = sockets.map(s => ({
      userId: s.data.userId,
      userName: s.data.userName,
      userRole: s.data.userRole
    }))

    // Remove duplicates (same user with multiple connections)
    const uniqueUsers = Array.from(
      new Map(users.map(u => [u.userId, u])).values()
    )

    return uniqueUsers
  }

  private async getAllOnlineUsers() {
    const onlineUsers: any[] = []
    
    for (const [userId, socketIds] of this.userSockets.entries()) {
      if (socketIds.size > 0) {
        // Get one socket to fetch user data
        const socketId = socketIds.values().next().value
        const socket = this.io.sockets.sockets.get(socketId)
        
        if (socket) {
          onlineUsers.push({
            userId: socket.data.userId,
            userName: socket.data.userName,
            userRole: socket.data.userRole,
            connectionCount: socketIds.size
          })
        }
      }
    }

    return onlineUsers
  }

  public getIO(): Server {
    return this.io
  }
}
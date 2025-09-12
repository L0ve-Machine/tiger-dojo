import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function createTestLockedRoom() {
  try {
    console.log('Creating test locked room...')
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('test123', 12)
    
    // Get admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    
    if (!adminUser) {
      throw new Error('Admin user not found')
    }
    
    // Create the private room
    const room = await prisma.privateRoom.create({
      data: {
        name: 'Test Room',
        slug: 'test-room',
        description: 'テスト用鍵付きルーム - パスワード: test123',
        accessKey: hashedPassword,
        isPublic: false,
        maxMembers: 50,
        allowInvites: true,
        requireApproval: false,
        createdBy: adminUser.id,
        members: {
          create: {
            userId: adminUser.id,
            role: 'OWNER'
          }
        }
      }
    })
    
    console.log('Created locked room:', {
      id: room.id,
      name: room.name,
      slug: room.slug,
      password: 'test123'
    })
    
    console.log('✅ Test locked room created successfully!')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestLockedRoom()
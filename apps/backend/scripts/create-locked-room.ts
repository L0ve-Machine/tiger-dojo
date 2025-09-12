import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function createLockedRoom() {
  try {
    console.log('Creating locked room test2...')
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('password123', 12)
    
    // Create the private room
    const room = await prisma.privateRoom.create({
      data: {
        name: 'test2',
        slug: 'test2',
        description: 'テスト用の鍵付きルーム',
        accessKey: hashedPassword,
        isPublic: false,
        maxMembers: 50,
        allowInvites: true,
        requireApproval: false,
        createdBy: 'cmfcoa0w20001392kkov15tyk' // Admin user ID
      }
    })
    
    console.log('Created locked room:', room)
    
    // Delete the fake locked room from Course table
    const fakeLocked = await prisma.course.findFirst({
      where: {
        OR: [
          { title: { contains: '🔒' } },
          { slug: 'test2' }
        ]
      }
    })
    
    if (fakeLocked) {
      console.log('Deleting fake locked room from Course table:', fakeLocked.title)
      await prisma.course.delete({
        where: { id: fakeLocked.id }
      })
    }
    
    console.log('Done!')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createLockedRoom()
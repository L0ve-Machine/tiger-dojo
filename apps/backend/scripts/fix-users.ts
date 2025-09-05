import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 ユーザーを作成しています...')
  
  // パスワードをハッシュ化
  const hashedPassword = await bcrypt.hash('password123!A', 10)
  
  try {
    // Student user
    const student = await prisma.user.upsert({
      where: { email: 'student@fx-tiger-dojo.com' },
      update: {
        password: hashedPassword,
        name: 'Student User',
        role: 'USER',
        isActive: true,
        emailVerified: true,
      },
      create: {
        email: 'student@fx-tiger-dojo.com',
        password: hashedPassword,
        name: 'Student User',
        role: 'USER',
        isActive: true,
        emailVerified: true,
      },
    })
    
    // Admin user
    const admin = await prisma.user.upsert({
      where: { email: 'admin@fx-tiger-dojo.com' },
      update: {
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
        isActive: true,
        emailVerified: true,
      },
      create: {
        email: 'admin@fx-tiger-dojo.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
        isActive: true,
        emailVerified: true,
      },
    })
    
    console.log('✅ ユーザーを作成しました:')
    console.log(`   - ${student.email} (password: password123!A)`)
    console.log(`   - ${admin.email} (password: password123!A)`)
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
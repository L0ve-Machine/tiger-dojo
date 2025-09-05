import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function restoreUsers() {
  try {
    console.log('🔄 既存ユーザーを復元しています...');

    // student@fx-tiger-dojo.com を作成
    const studentPassword = await bcrypt.hash('password123!A', 10);
    const student = await prisma.user.upsert({
      where: { email: 'student@fx-tiger-dojo.com' },
      update: {
        password: studentPassword,
      },
      create: {
        email: 'student@fx-tiger-dojo.com',
        password: studentPassword,
        name: 'Student User',
        role: 'USER',
        isActive: true,
        emailVerified: true,
      },
    });

    // admin@fx-tiger-dojo.com を作成
    const adminPassword = await bcrypt.hash('password123!A', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@fx-tiger-dojo.com' },
      update: {
        password: adminPassword,
      },
      create: {
        email: 'admin@fx-tiger-dojo.com',
        password: adminPassword,
        name: 'Admin User',
        role: 'ADMIN',
        isActive: true,
        emailVerified: true,
      },
    });

    console.log('✅ 既存ユーザーを復元しました:');
    console.log('   - student@fx-tiger-dojo.com (password: password123!A)');
    console.log('   - admin@fx-tiger-dojo.com (password: password123!A)');

  } catch (error) {
    console.error('❌ ユーザー復元エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreUsers();
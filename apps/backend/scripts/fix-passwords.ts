import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function fixPasswords() {
  try {
    console.log('🔄 パスワードを正しいものに更新しています...');
    const correctPassword = 'password123!A';
    const hashedPassword = await bcrypt.hash(correctPassword, 10);

    // student@fx-tiger-dojo.com のパスワード更新
    await prisma.user.update({
      where: { email: 'student@fx-tiger-dojo.com' },
      data: { password: hashedPassword }
    });

    // admin@fx-tiger-dojo.com のパスワード更新
    await prisma.user.update({
      where: { email: 'admin@fx-tiger-dojo.com' },
      data: { password: hashedPassword }
    });

    console.log('✅ パスワードを更新しました (password123!A)');

  } catch (error) {
    console.error('❌ パスワード更新エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPasswords();
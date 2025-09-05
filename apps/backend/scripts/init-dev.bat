@echo off
echo 開発環境を初期化しています...

echo データベースのマイグレーションを実行...
call npx prisma migrate dev --name init

echo シードデータを投入...
call npm run seed

echo 初期化が完了しました！
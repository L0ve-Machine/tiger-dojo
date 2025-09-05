#!/bin/bash

echo "🚀 FX Trading Platform セットアップ開始"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js がインストールされていません。Node.js 18以上をインストールしてください。"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18以上が必要です。現在のバージョン: $(node -v)"
    exit 1
fi

echo "✅ Node.js バージョン確認: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm がインストールされていません。"
    exit 1
fi

echo "✅ npm バージョン確認: $(npm -v)"

# 1. Root dependencies installation
echo "📦 ルート依存関係をインストール中..."
npm install

# 2. Frontend dependencies installation
echo "📦 フロントエンド依存関係をインストール中..."
cd apps/frontend
npm install
cd ../..

# 3. Backend dependencies installation
echo "📦 バックエンド依存関係をインストール中..."
cd apps/backend
npm install
cd ../..

# 4. Environment variables setup
echo "⚙️ 環境変数を設定中..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ .env ファイルを作成しました"
else
    echo "⚠️  .env ファイルは既に存在します"
fi

if [ ! -f apps/frontend/.env.local ]; then
    cp apps/frontend/.env.example apps/frontend/.env.local
    echo "✅ フロントエンド .env.local ファイルを作成しました"
else
    echo "⚠️  フロントエンド .env.local ファイルは既に存在します"
fi

if [ ! -f apps/backend/.env ]; then
    cp apps/backend/.env.example apps/backend/.env
    echo "✅ バックエンド .env ファイルを作成しました"
else
    echo "⚠️  バックエンド .env ファイルは既に存在します"
fi

# 5. Check for PostgreSQL
echo "🐘 PostgreSQL 接続をチェック中..."
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL がインストールされています"
    
    # Try to create database if it doesn't exist
    DB_NAME="fx_platform"
    DB_EXISTS=$(psql -lqt | cut -d \| -f 1 | grep -wq $DB_NAME; echo $?)
    
    if [ $DB_EXISTS -eq 0 ]; then
        echo "✅ データベース '$DB_NAME' は既に存在します"
    else
        echo "📊 データベース '$DB_NAME' を作成中..."
        createdb $DB_NAME 2>/dev/null || echo "⚠️  データベース作成に失敗しました。手動で作成してください。"
    fi
else
    echo "⚠️  PostgreSQL がインストールされていません。"
    echo "   Docker を使用する場合: docker run --name fx-postgres -e POSTGRES_DB=fx_platform -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15"
    echo "   または PostgreSQL を直接インストールしてください。"
fi

# 6. Prisma setup
echo "📊 Prisma をセットアップ中..."
cd apps/backend
npx prisma generate
echo "✅ Prisma クライアントを生成しました"

# Check if DATABASE_URL is set
if grep -q "postgresql://user:password@localhost:5432/fx_platform" .env 2>/dev/null; then
    echo "⚠️  DATABASE_URL を実際の接続文字列に更新してください"
    echo "   例: DATABASE_URL=\"postgresql://postgres:password@localhost:5432/fx_platform\""
fi

cd ../..

# 7. Generate JWT secrets
echo "🔐 JWT シークレットを生成中..."
if command -v openssl &> /dev/null; then
    ACCESS_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    REFRESH_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    
    echo "✅ JWT シークレットを生成しました。以下の値を .env ファイルに設定してください:"
    echo "JWT_ACCESS_SECRET=$ACCESS_SECRET"
    echo "JWT_REFRESH_SECRET=$REFRESH_SECRET"
else
    echo "⚠️  OpenSSL が見つかりません。JWT シークレットを手動で生成してください。"
fi

echo ""
echo "✅ セットアップ完了！"
echo ""
echo "🚀 開発サーバーを起動するには:"
echo "   npm run dev"
echo ""
echo "📍 アプリケーション URL:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo ""
echo "⚠️  忘れずに以下を確認してください:"
echo "   1. PostgreSQL が起動していること"
echo "   2. .env ファイルの DATABASE_URL が正しいこと"
echo "   3. JWT シークレットが設定されていること"
echo ""
echo "📚 データベースマイグレーションを実行するには:"
echo "   cd apps/backend && npm run db:migrate"
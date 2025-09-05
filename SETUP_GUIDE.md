# FX Tiger Dojo - ローカル環境セットアップガイド

## 前提条件

以下がインストールされていることを確認してください：
- Node.js (v18以上)
- PostgreSQL (v14以上)
- Git

## PostgreSQLのセットアップ (Windows)

### 1. PostgreSQLのインストール

1. [公式サイト](https://www.postgresql.org/download/windows/)からPostgreSQLをダウンロード
2. インストーラーを実行し、以下の設定で進める：
   - パスワード: `postgres` (開発用)
   - ポート: `5432` (デフォルト)
   - ロケール: デフォルトのまま

### 2. データベースの作成

PowerShell または コマンドプロンプトを開いて実行：

```bash
# PostgreSQLのbinディレクトリに移動（デフォルトのパス）
cd "C:\Program Files\PostgreSQL\16\bin"

# postgresユーザーでログイン
psql -U postgres

# パスワードを入力（インストール時に設定したもの）

# データベースを作成
CREATE DATABASE fx_platform;

# 確認
\l

# 終了
\q
```

または、pgAdmin（PostgreSQLと一緒にインストールされる）を使用してGUIで作成することもできます。

## プロジェクトのセットアップ

### 1. 依存関係のインストール

```bash
# ルートディレクトリで
npm install

# バックエンドの依存関係
cd apps/backend
npm install

# フロントエンドの依存関係
cd ../frontend
npm install
```

### 2. 環境変数の設定

`.env`ファイルが以下の場所に作成されていることを確認：
- `/fx_tiger_dojo/.env`
- `/fx_tiger_dojo/apps/backend/.env`
- `/fx_tiger_dojo/apps/frontend/.env.local`

### 3. データベースのマイグレーション

```bash
cd apps/backend
npx prisma migrate dev --name init
```

### 4. シードデータの投入（オプション）

```bash
cd apps/backend
npm run seed
```

## 開発サーバーの起動

### 方法1: 同時起動（推奨）

ルートディレクトリで：
```bash
npm run dev
```

これにより以下が起動します：
- フロントエンド: http://localhost:3000
- バックエンド: http://localhost:5000

### 方法2: 個別起動

ターミナル1（バックエンド）：
```bash
cd apps/backend
npm run dev
```

ターミナル2（フロントエンド）：
```bash
cd apps/frontend
npm run dev
```

## 動作確認

1. http://localhost:3000 にアクセス
2. 新規登録: http://localhost:3000/auth/register
3. ログイン: http://localhost:3000/auth/login
4. ダッシュボード: http://localhost:3000/dashboard
5. チャット: http://localhost:3000/chat

## トラブルシューティング

### PostgreSQLに接続できない

1. PostgreSQLサービスが起動しているか確認：
   - Windows: サービス管理で「postgresql-x64-16」が実行中か確認
   - `services.msc`を実行して確認

2. 接続情報を確認：
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fx_platform"
   ```

### ポートが使用中

```bash
# Windows - ポート3000の確認
netstat -ano | findstr :3000

# Windows - ポート5000の確認
netstat -ano | findstr :5000

# プロセスを終了
taskkill /PID [プロセスID] /F
```

### Prismaエラー

```bash
# Prismaクライアントの再生成
cd apps/backend
npx prisma generate

# データベースをリセット
npx prisma migrate reset
```

### npm installエラー

```bash
# キャッシュクリア
npm cache clean --force

# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

## 開発用アカウント

シードデータを投入した場合、以下のアカウントが利用可能：

**管理者:**
- Email: admin@fx-tiger.com
- Password: Admin123!@#

**講師:**
- Email: tanaka@fx-tiger.com
- Password: Instructor123!

**生徒:**
- Email: student1@example.com
- Password: Student123!

## 機能一覧

### Phase 1 - 認証システム ✅
- ユーザー登録・ログイン
- JWT認証
- リフレッシュトークン

### Phase 2 - 動画配信 ✅
- Vimeo統合
- 段階的コンテンツ解放
- 視聴進捗トラッキング

### Phase 3 - リアルタイムチャット ✅
- Socket.io統合
- Discord風UI
- レッスン毎のチャットルーム
- タイピングインジケーター
- オンラインステータス

## 次のステップ

1. PostgreSQLをインストール・起動
2. データベース`fx_platform`を作成
3. `npm install`で依存関係をインストール
4. `npx prisma migrate dev`でマイグレーション実行
5. `npm run dev`で開発サーバー起動
6. http://localhost:3000 でアプリケーションにアクセス
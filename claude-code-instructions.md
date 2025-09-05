# Claude Code 実装指示書 - FX動画配信プラットフォーム

## 🎯 プロジェクト概要

FX教育に特化した動画配信プラットフォームのMVP開発を6つのフェーズに分けて実装します。
各フェーズは独立して動作確認可能で、段階的に機能を追加していきます。

---

## 📁 プロジェクト構造

```
fx-trading-platform/
├── apps/
│   ├── frontend/          # Next.js 14 (App Router)
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── public/
│   │   └── package.json
│   │
│   ├── backend/           # Node.js + Express API
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── middleware/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   └── utils/
│   │   ├── prisma/
│   │   └── package.json
│   │
│   └── admin/            # 管理画面 (Next.js)
│       └── [Phase 4で作成]
│
├── packages/
│   ├── shared/          # 共通型定義・ユーティリティ
│   └── ui/              # 共通UIコンポーネント
│
├── docker/
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   └── docker-compose.yml
│
├── scripts/
│   ├── setup.sh
│   └── seed.js
│
├── .env.example
├── .gitignore
├── package.json         # monorepo root
└── README.md
```

---

## 🚀 Phase 1: 基盤構築（認証システム）

### 実装タスク

```markdown
## Phase 1 チェックリスト
- [ ] プロジェクト初期設定
- [ ] データベース設計・接続
- [ ] 認証API実装
- [ ] ログイン/登録画面
- [ ] セッション管理
```

### 具体的な実装指示

```markdown
# Claude Codeへの指示（Phase 1）

## 1. プロジェクトセットアップ

以下の構成でモノレポプロジェクトを作成してください：

### Frontend (Next.js 14)
```bash
npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir
```

### Backend (Node.js + Express)
```bash
mkdir backend && cd backend
npm init -y
npm install express cors dotenv bcrypt jsonwebtoken
npm install -D typescript @types/node @types/express nodemon
```

### 必要なパッケージ
Frontend:
- next-auth
- axios
- react-hook-form
- zod
- zustand

Backend:
- prisma
- @prisma/client
- express-rate-limit
- helmet
- cookie-parser

## 2. データベーススキーマ (Prisma)

```prisma
// backend/prisma/schema.prisma

model User {
  id              String    @id @default(cuid())
  email           String    @unique
  password        String
  name            String
  role            Role      @default(STUDENT)
  discordName     String?
  age             Int?
  gender          Gender?
  registeredAt    DateTime  @default(now())
  lastLoginAt     DateTime?
  isActive        Boolean   @default(true)
  emailVerified   Boolean   @default(false)
  verificationToken String?
  
  sessions        Session[]
  enrollments     Enrollment[]
  progress        Progress[]
  messages        ChatMessage[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Session {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  token           String    @unique
  refreshToken    String    @unique
  ipAddress       String?
  userAgent       String?
  expiresAt       DateTime
  createdAt       DateTime  @default(now())
}

enum Role {
  STUDENT
  INSTRUCTOR
  ADMIN
}

enum Gender {
  MALE
  FEMALE
  OTHER
  PREFER_NOT_TO_SAY
}
```

## 3. 認証エンドポイント

Backend APIに以下のエンドポイントを実装：

```typescript
// backend/src/routes/auth.routes.ts

POST   /api/auth/register     // 新規登録
POST   /api/auth/login        // ログイン
POST   /api/auth/logout       // ログアウト
POST   /api/auth/refresh      // トークンリフレッシュ
GET    /api/auth/me          // 現在のユーザー情報
POST   /api/auth/verify-email // メール認証
```

## 4. フロントエンド画面

以下の画面を作成（黒×ゴールドのデザイン）：

### /auth/login
- メールアドレス入力
- パスワード入力（表示/非表示トグル）
- 「ログイン」ボタン
- 「パスワードを忘れた方」リンク
- 「新規登録はこちら」リンク

### /auth/register  
- 必須フィールド：
  - メールアドレス
  - パスワード（12文字以上、複雑性チェック）
  - パスワード確認
  - お名前
  - 利用規約同意チェックボックス
- オプションフィールド：
  - Discord名
  - 年齢
  - 性別
  - トレード経験

### /dashboard (ログイン後のホーム)
- ウェルカムメッセージ
- 「ログアウト」ボタン
- ユーザー情報表示

## 5. セキュリティ実装

- JWT + Refresh Token
- パスワードハッシュ化 (bcrypt, rounds=12)
- Rate Limiting (5回/15分 for login)
- CORS設定
- HTTPOnly Cookie for tokens
```

### 環境変数設定

```bash
# .env.example

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/fx_platform"

# Backend
PORT=5000
NODE_ENV=development

# JWT
JWT_ACCESS_SECRET=your-super-secret-access-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (Phase 2で使用)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

### 動作確認項目

```markdown
## Phase 1 完了基準
✅ ユーザー登録ができる
✅ ログイン/ログアウトができる
✅ JWTトークンが正しく発行される
✅ 認証が必要なページにアクセス制限がかかる
✅ パスワードが安全にハッシュ化される
✅ Rate Limitingが機能する
```

---

## 📺 Phase 2: 動画配信機能

### 実装タスク

```markdown
## Phase 2 チェックリスト
- [ ] コース/レッスンのデータモデル
- [ ] 動画一覧画面
- [ ] 動画視聴画面
- [ ] Vimeoプレーヤー統合
- [ ] 視聴履歴記録
```

### 具体的な実装指示

```markdown
# Claude Codeへの指示（Phase 2）

## 1. データベース拡張

```prisma
model Course {
  id              String    @id @default(cuid())
  title           String
  description     String
  thumbnail       String?
  slug            String    @unique
  isPublished     Boolean   @default(false)
  price           Int?      // 将来の有料化対応
  
  lessons         Lesson[]
  enrollments     Enrollment[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Lesson {
  id              String    @id @default(cuid())
  courseId        String
  course          Course    @relation(fields: [courseId], references: [id])
  title           String
  description     String?
  videoUrl        String    // Vimeo video ID
  duration        Int?      // 動画時間（秒）
  orderIndex      Int       // 表示順
  
  // コンテンツ解放設定
  releaseType     ReleaseType @default(IMMEDIATE)
  releaseDays     Int?      // 登録から何日後に公開
  releaseDate     DateTime? // 特定日に公開
  prerequisiteId  String?   // 前提となるレッスンID
  
  progress        Progress[]
  resources       Resource[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Enrollment {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  courseId        String
  course          Course    @relation(fields: [courseId], references: [id])
  enrolledAt      DateTime  @default(now())
  completedAt     DateTime?
  
  @@unique([userId, courseId])
}

model Progress {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  lessonId        String
  lesson          Lesson    @relation(fields: [lessonId], references: [id])
  watchedSeconds  Int       @default(0)
  completed       Boolean   @default(false)
  completedAt     DateTime?
  lastWatchedAt   DateTime  @default(now())
  
  @@unique([userId, lessonId])
}

enum ReleaseType {
  IMMEDIATE       // すぐに公開
  SCHEDULED      // 特定日に公開
  DRIP          // 段階的公開
  PREREQUISITE  // 前提レッスン完了後
}
```

## 2. Vimeo統合

```typescript
// lib/vimeo.ts
import Player from '@vimeo/player';

export const VimeoPlayer = {
  init: (element: HTMLElement, videoId: string) => {
    return new Player(element, {
      id: videoId,
      responsive: true,
      dnt: true,
      controls: true,
      speed: true,
      quality: 'auto',
    });
  },
  
  // 視聴時間トラッキング
  trackProgress: (player: Player, onProgress: (seconds: number) => void) => {
    let lastSaved = 0;
    player.on('timeupdate', (data) => {
      if (data.seconds - lastSaved > 10) { // 10秒ごとに保存
        onProgress(data.seconds);
        lastSaved = data.seconds;
      }
    });
  }
};
```

## 3. 画面実装

### /courses
- コース一覧グリッド表示
- 各コースカード：
  - サムネイル
  - タイトル
  - 説明文（最初の100文字）
  - レッスン数
  - 「受講する」ボタン

### /courses/[slug]
- コース詳細情報
- レッスン一覧（ロック状態表示）
- 「受講開始」または「続きから見る」ボタン

### /lessons/[id]
- Vimeoプレーヤー（大画面）
- レッスンタイトル・説明
- 前/次のレッスンナビゲーション
- ダウンロード資料リンク
- 進捗自動保存

## 4. APIエンドポイント

```typescript
GET    /api/courses              // コース一覧
GET    /api/courses/:slug        // コース詳細
POST   /api/courses/:id/enroll   // コース登録
GET    /api/lessons/:id          // レッスン詳細
POST   /api/lessons/:id/progress // 進捗更新
GET    /api/users/me/courses     // 受講中コース
```

## 5. コンテンツ解放ロジック

```typescript
// services/contentAccess.service.ts
export const checkLessonAccess = async (userId: string, lessonId: string) => {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }});
  const enrollment = await prisma.enrollment.findFirst({
    where: { userId, courseId: lesson.courseId }
  });
  
  if (!enrollment) return { hasAccess: false, reason: 'NOT_ENROLLED' };
  
  switch (lesson.releaseType) {
    case 'DRIP':
      const daysSinceEnrollment = 
        (Date.now() - enrollment.enrolledAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceEnrollment < lesson.releaseDays) {
        return { 
          hasAccess: false, 
          reason: 'NOT_YET_AVAILABLE',
          availableIn: lesson.releaseDays - daysSinceEnrollment 
        };
      }
      break;
      
    case 'PREREQUISITE':
      const prerequisiteProgress = await prisma.progress.findFirst({
        where: { 
          userId, 
          lessonId: lesson.prerequisiteId,
          completed: true 
        }
      });
      if (!prerequisiteProgress) {
        return { 
          hasAccess: false, 
          reason: 'PREREQUISITE_NOT_COMPLETED' 
        };
      }
      break;
  }
  
  return { hasAccess: true };
};
```
```

### Vimeo設定

```markdown
## Vimeo アカウント設定

1. Vimeo Plusアカウントを作成
2. 動画をアップロード時の設定：
   - Privacy: "Hide from Vimeo"
   - Embed: "Specific domains"
   - Allowed domains: localhost:3000, your-domain.com
3. APIトークンを取得して環境変数に設定

VIMEO_ACCESS_TOKEN=your-vimeo-access-token
VIMEO_CLIENT_ID=your-client-id
VIMEO_CLIENT_SECRET=your-client-secret
```

---

## 💬 Phase 3: リアルタイムチャット

### 実装タスク

```markdown
## Phase 3 チェックリスト
- [ ] Socket.ioサーバー設定
- [ ] チャットデータモデル
- [ ] チャットUI実装
- [ ] リアルタイム通信
- [ ] メッセージ履歴
```

### 具体的な実装指示

```markdown
# Claude Codeへの指示（Phase 3）

## 1. Socket.ioサーバー設定

```typescript
// backend/src/socket/index.ts
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

export const initSocketServer = (httpServer: any) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true
    }
  });
  
  // 認証ミドルウェア
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.data.userId = decoded.userId;
      socket.data.userName = decoded.name;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });
  
  io.on('connection', (socket) => {
    console.log(`User ${socket.data.userName} connected`);
    
    // レッスンルームに参加
    socket.on('join_lesson', async (lessonId) => {
      // アクセス権限チェック
      const hasAccess = await checkLessonAccess(socket.data.userId, lessonId);
      if (!hasAccess) {
        socket.emit('error', 'Access denied');
        return;
      }
      
      socket.join(`lesson_${lessonId}`);
      
      // 過去のメッセージを送信
      const messages = await getRecentMessages(lessonId, 50);
      socket.emit('message_history', messages);
      
      // 入室通知
      socket.to(`lesson_${lessonId}`).emit('user_joined', {
        userName: socket.data.userName
      });
    });
    
    // メッセージ送信
    socket.on('send_message', async (data) => {
      const message = await saveMessage({
        userId: socket.data.userId,
        lessonId: data.lessonId,
        content: data.content,
        type: 'text'
      });
      
      io.to(`lesson_${data.lessonId}`).emit('new_message', {
        ...message,
        userName: socket.data.userName
      });
    });
    
    // タイピング表示
    socket.on('typing', (data) => {
      socket.to(`lesson_${data.lessonId}`).emit('user_typing', {
        userId: socket.data.userId,
        userName: socket.data.userName
      });
    });
    
    // 切断処理
    socket.on('disconnect', () => {
      console.log(`User ${socket.data.userName} disconnected`);
    });
  });
  
  return io;
};
```

## 2. データモデル

```prisma
model ChatMessage {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  lessonId        String
  content         String
  type            MessageType @default(TEXT)
  isEdited        Boolean   @default(false)
  editedAt        DateTime?
  
  createdAt       DateTime  @default(now())
}

enum MessageType {
  TEXT
  QUESTION
  ANSWER
  ANNOUNCEMENT
}
```

## 3. チャットUIコンポーネント

```typescript
// components/chat/LessonChat.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export function LessonChat({ lessonId, token }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL, {
      auth: { token }
    });
    
    newSocket.on('connect', () => {
      newSocket.emit('join_lesson', lessonId);
    });
    
    newSocket.on('message_history', (history) => {
      setMessages(history);
    });
    
    newSocket.on('new_message', (message) => {
      setMessages(prev => [...prev, message]);
    });
    
    newSocket.on('user_typing', (data) => {
      setTypingUsers(prev => [...prev, data.userName]);
      setTimeout(() => {
        setTypingUsers(prev => prev.filter(u => u !== data.userName));
      }, 3000);
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.close();
    };
  }, [lessonId, token]);
  
  const sendMessage = () => {
    if (!inputMessage.trim() || !socket) return;
    
    socket.emit('send_message', {
      lessonId,
      content: inputMessage
    });
    
    setInputMessage('');
  };
  
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socket?.emit('typing', { lessonId });
      setTimeout(() => setIsTyping(false), 2000);
    }
  };
  
  return (
    <div className="flex flex-col h-[500px] bg-black border border-gold-500 rounded-lg">
      {/* チャットヘッダー */}
      <div className="p-4 border-b border-gold-500">
        <h3 className="text-gold-400 font-bold">レッスンチャット</h3>
      </div>
      
      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className="flex gap-3">
            <div className="w-8 h-8 bg-gold-500 rounded-full" />
            <div>
              <p className="text-gold-400 text-sm">{msg.userName}</p>
              <p className="text-gray-200">{msg.content}</p>
              <p className="text-gray-500 text-xs">
                {new Date(msg.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        {typingUsers.length > 0 && (
          <p className="text-gray-500 text-sm italic">
            {typingUsers.join(', ')}が入力中...
          </p>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* 入力エリア */}
      <div className="p-4 border-t border-gold-500">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => {
              setInputMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 bg-gray-900 text-white p-2 rounded border border-gold-500 focus:outline-none focus:border-gold-400"
            placeholder="メッセージを入力..."
          />
          <button
            onClick={sendMessage}
            className="px-6 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-black font-bold rounded hover:from-gold-600 hover:to-gold-700"
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
}
```
```

---

## 👨‍💼 Phase 4: 管理画面

### 実装タスク

```markdown
## Phase 4 チェックリスト
- [ ] 管理者認証
- [ ] 動画アップロード機能
- [ ] コース/レッスン管理
- [ ] ユーザー管理
- [ ] 統計ダッシュボード
```

### 具体的な実装指示

```markdown
# Claude Codeへの指示（Phase 4）

## 1. 管理画面プロジェクト作成

```bash
# apps/admin として新規Next.jsプロジェクト作成
npx create-next-app@latest admin --typescript --tailwind --app
```

## 2. 管理者用ルート保護

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token');
  
  if (!token) {
    return NextResponse.redirect('/admin/login');
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'ADMIN' && decoded.role !== 'INSTRUCTOR') {
      return NextResponse.redirect('/unauthorized');
    }
  } catch {
    return NextResponse.redirect('/admin/login');
  }
}

export const config = {
  matcher: '/admin/:path*'
};
```

## 3. 管理画面ページ構成

### /admin/dashboard
- 統計サマリー（総ユーザー数、アクティブユーザー、総視聴時間）
- 最近の登録ユーザー
- 人気のレッスン

### /admin/courses
- コース一覧テーブル
- 「新規コース作成」ボタン
- 編集/削除アクション

### /admin/courses/[id]/edit
- コース情報編集フォーム
- レッスン並び替え（ドラッグ&ドロップ）
- レッスン追加/削除

### /admin/lessons/create
- レッスン作成フォーム
- Vimeo動画URL入力
- 公開設定（即時/スケジュール/段階的）
- 資料アップロード

### /admin/users
- ユーザー一覧テーブル
- 検索/フィルター
- ロール変更
- アカウント停止/有効化

## 4. 動画アップロードフロー

```typescript
// services/videoUpload.service.ts
import { Vimeo } from 'vimeo';

const client = new Vimeo(
  process.env.VIMEO_CLIENT_ID,
  process.env.VIMEO_CLIENT_SECRET,
  process.env.VIMEO_ACCESS_TOKEN
);

export const uploadToVimeo = async (file: File) => {
  return new Promise((resolve, reject) => {
    client.upload(
      file.path,
      {
        name: file.originalname,
        description: 'FX Trading Lesson',
        privacy: {
          view: 'disable',
          embed: 'whitelist',
          download: false
        },
        embed: {
          buttons: {
            like: false,
            watchlater: false,
            share: false
          }
        }
      },
      (uri) => {
        const videoId = uri.split('/').pop();
        resolve(videoId);
      },
      (bytesUploaded, bytesTotal) => {
        const percentage = (bytesUploaded / bytesTotal * 100).toFixed(2);
        console.log(`Upload progress: ${percentage}%`);
      },
      (error) => {
        reject(error);
      }
    );
  });
};
```

## 5. 管理APIエンドポイント

```typescript
// Admin専用エンドポイント
POST   /api/admin/courses          // コース作成
PUT    /api/admin/courses/:id      // コース更新
DELETE /api/admin/courses/:id      // コース削除

POST   /api/admin/lessons          // レッスン作成
PUT    /api/admin/lessons/:id      // レッスン更新
DELETE /api/admin/lessons/:id      // レッスン削除
PUT    /api/admin/lessons/reorder  // レッスン順序変更

GET    /api/admin/users            // ユーザー一覧
PUT    /api/admin/users/:id/role   // ロール変更
PUT    /api/admin/users/:id/status // アカウント状態変更

GET    /api/admin/stats            // 統計情報
GET    /api/admin/stats/users      // ユーザー統計
GET    /api/admin/stats/videos     // 動画視聴統計
```
```

---

## 💳 Phase 5: 決済システム（オプション）

### 実装タスク

```markdown
## Phase 5 チェックリスト
- [ ] Stripe統合
- [ ] サブスクリプションプラン
- [ ] 支払い履歴
- [ ] 請求書発行
```

### 簡易実装案

```markdown
# 決済なしの代替実装

## シンプルな会員レベル管理

```prisma
model Membership {
  id              String    @id @default(cuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id])
  tier            MembershipTier @default(STANDARD)
  validUntil      DateTime
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

enum MembershipTier {
  STANDARD      // 基本プラン
  PREMIUM       // プレミアムプラン
  VIP           // VIPプラン（初期メンバー）
}
```

管理画面から手動でメンバーシップを付与・変更する形で運用
```

---

## 🧪 Phase 6: テスト・最適化

### 実装タスク

```markdown
## Phase 6 チェックリスト
- [ ] E2Eテスト実装
- [ ] パフォーマンス最適化
- [ ] セキュリティ監査
- [ ] 本番環境デプロイ
```

---

## 🛠️ 開発環境セットアップスクリプト

```bash
#!/bin/bash
# scripts/setup.sh

echo "🚀 FX Trading Platform セットアップ開始"

# 1. 依存関係インストール
echo "📦 依存関係をインストール中..."
npm install

# 2. PostgreSQLコンテナ起動
echo "🐘 PostgreSQLを起動中..."
docker-compose up -d postgres

# 3. 環境変数コピー
echo "⚙️ 環境変数を設定中..."
cp .env.example .env.local

# 4. データベースマイグレーション
echo "📊 データベースをセットアップ中..."
cd apps/backend && npx prisma migrate dev && cd ../..

# 5. シードデータ投入
echo "🌱 初期データを投入中..."
cd apps/backend && npm run seed && cd ../..

# 6. 開発サーバー起動
echo "✨ 開発サーバーを起動中..."
npm run dev

echo "✅ セットアップ完了！"
echo "📍 Frontend: http://localhost:3000"
echo "📍 Backend: http://localhost:5000"
echo "📍 Admin: http://localhost:3001"
```

---

## 📋 各フェーズの完了基準

### Phase 1（認証）完了条件
- [ ] ユーザー登録・ログインが正常に動作
- [ ] JWTトークンによる認証が機能
- [ ] パスワードの安全な保存
- [ ] Rate Limitingが有効

### Phase 2（動画）完了条件
- [ ] 動画一覧・詳細表示が正常
- [ ] Vimeoプレーヤーが動作
- [ ] 視聴進捗が保存される
- [ ] コンテンツ解放ロジックが機能

### Phase 3（チャット）完了条件
- [ ] リアルタイムメッセージ送受信
- [ ] 過去のメッセージ表示
- [ ] タイピングインジケーター動作
- [ ] 複数ユーザーでの動作確認

### Phase 4（管理）完了条件
- [ ] 管理者認証が機能
- [ ] コース/レッスン作成・編集
- [ ] ユーザー管理機能
- [ ] 統計情報の表示

### Phase 5（決済）完了条件
- [ ] メンバーシップ管理
- [ ] プランによるアクセス制御

### Phase 6（最適化）完了条件
- [ ] Lighthouse スコア 90以上
- [ ] セキュリティテスト合格
- [ ] 負荷テスト実施
- [ ] 本番環境で安定動作

---

## 🚨 実装時の注意事項

### セキュリティ
- 環境変数は絶対にGitにコミットしない
- SQLインジェクション対策（Prismaで自動対策）
- XSS対策（React/Next.jsで自動エスケープ）
- CORS設定を本番では厳密に

### パフォーマンス
- 画像は最適化して配信（next/image使用）
- 動画はVimeoのCDN経由で配信
- データベースクエリの最適化
- キャッシュ戦略の実装

### スケーラビリティ
- マイクロサービス化を視野に入れた設計
- データベースのインデックス適切に設定
- 非同期処理の活用（Bull Queue等）
- CDNの積極的な利用

---

## 💡 Claude Codeへの依頼テンプレート

```markdown
# Phase [番号] 実装依頼

上記のPhase [番号]の仕様に従って実装してください。

## 技術スタック
- Frontend: Next.js 14, TypeScript, Tailwind CSS
- Backend: Node.js, Express, Prisma
- Database: PostgreSQL
- その他: [Phase固有の技術]

## デザイン要件
- 黒×ゴールドの高級感あるデザイン
- レスポンシブ対応（モバイルファースト）
- ダークモード基調

## 実装優先順位
1. [最重要機能]
2. [次に重要な機能]
3. [あれば良い機能]

## 動作確認項目
- [確認項目1]
- [確認項目2]
- [確認項目3]

よろしくお願いします。
```

---

## 📝 トラブルシューティングガイド

### よくある問題と解決方法

```markdown
## 1. CORS エラー
症状: "Access to XMLHttpRequest blocked by CORS policy"
解決: 
- Backend の CORS 設定確認
- 環境変数の NEXT_PUBLIC_API_URL 確認

## 2. Prisma エラー
症状: "Cannot find module '@prisma/client'"
解決:
```bash
cd apps/backend
npx prisma generate
```

## 3. Socket.io 接続エラー
症状: "WebSocket connection failed"
解決:
- ポート番号確認（5000番が開いているか）
- 認証トークンが正しく送信されているか確認

## 4. Vimeo 動画が表示されない
症状: 動画プレーヤーが黒い画面
解決:
- Vimeo のドメイン制限設定確認
- 動画のプライバシー設定確認
- API トークンの権限確認
```


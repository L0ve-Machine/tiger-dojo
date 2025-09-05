# FX動画配信サイト・オンライン学習プラットフォーム要件定義書

## エグゼクティブサマリー

本要件定義書は、FX教育に特化した動画配信・オンライン学習プラットフォームの構築に必要な機能、技術、セキュリティ要件を包括的にまとめたものです。最小限の機能で実装可能なMVP（Minimum Viable Product）から段階的な機能拡張まで、実装優先順位を明確にした実用的なロードマップを提供します。

---

## 1. 類似サービスの機能比較と推奨実装

### 1.1 主要学習プラットフォームの中核機能

**国内外プラットフォーム機能比較:**

| 機能カテゴリ | Teachable | Thinkific | みんなのFX | DMM FX | MVP実装推奨 |
|------------|-----------|-----------|-----------|---------|------------|
| **コンテンツ配信** |
| 動画ホスティング | 無制限 | 無制限 | リアルタイム | リアルタイム | Vimeo統合 |
| ドリップコンテンツ | ✅ | ✅ | ❌ | ❌ | ✅ 必須 |
| ダウンロード保護 | 基本 | 基本 | N/A | N/A | DRM実装 |
| **学習管理** |
| 進捗トラッキング | 詳細 | 詳細 | 取引履歴 | 取引履歴 | ✅ 必須 |
| クイズ・評価 | ✅ | ✅ | ❌ | ❌ | Phase 2 |
| 修了証 | ✅ | ✅ | ❌ | ❌ | Phase 2 |
| **デモ取引** |
| シミュレーター | ❌ | ❌ | ✅ 100万円 | ✅ 500万円 | ✅ 必須 |
| リアルタイムデータ | ❌ | ❌ | ✅ | ✅ | ✅ 必須 |

### 1.2 FX教育特化機能（MVP必須）

1. **デモ取引シミュレーター**
   - 仮想資金：100万～500万円
   - リアルタイムマーケットデータ統合
   - 取引履歴・パフォーマンス分析
   - リスクフリー練習環境

2. **段階的コンテンツ解放**
   - 時間ベース：登録後の経過日数で解放
   - 進捗ベース：前のレッスン完了で次を解放
   - ハイブリッド：両方の組み合わせ

3. **ビデオ保護（Vimeo OTT）**
   - Multi-DRM対応（Widevine、FairPlay、PlayReady）
   - HLS暗号化ストリーミング
   - ドメイン制限・有効期限付きURL

---

## 2. 必要なページ構成とサイトマップ

### 2.1 最小限のページ構成（MVP）

```
FX学習プラットフォーム サイトマップ

【公開エリア】
├── ホーム
├── コース一覧
│   ├── 初級コース
│   ├── 中級コース
│   └── 上級コース
├── 料金プラン
├── ログイン/新規登録
└── ヘルプ/FAQ

【会員エリア】（認証必須）
├── ダッシュボード
│   ├── 学習進捗サマリー
│   ├── 次のレッスン
│   └── お知らせ
├── マイコース
│   ├── 受講中コース
│   └── 完了コース
├── 動画視聴ページ
│   ├── ビデオプレーヤー
│   ├── レッスンノート
│   ├── ダウンロード資料
│   └── チャット/質問
├── デモ取引
│   ├── トレーディング画面
│   ├── ポートフォリオ
│   └── 取引履歴
└── アカウント設定
    ├── プロフィール
    └── 通知設定

【管理画面】（管理者のみ）
├── ダッシュボード
│   ├── ユーザー統計
│   └── システム状態
├── ユーザー管理
│   ├── ユーザー一覧
│   └── アクセス権限
├── コンテンツ管理
│   ├── 動画アップロード
│   ├── コース編集
│   └── 公開スケジュール
└── 設定
    └── サイト設定
```

### 2.2 ページ階層の設計原則

- **プログレッシブディスクロージャー**: ユーザーのレベルに応じて段階的に情報開示
- **モバイルファースト**: スマートフォンでの学習を最優先に設計
- **シンプルなナビゲーション**: 3クリック以内で目的のコンテンツに到達

---

## 3. 各ページの機能要件

### 3.1 ログイン/会員登録ページ

**必須実装項目:**
```javascript
// 登録フォーム必須フィールド
const registrationFields = {
  email: { type: 'email', required: true, validation: 'RFC5322' },
  password: { type: 'password', minLength: 12, complexity: 'high' },
  name: { type: 'text', required: true },
  tradingExperience: { 
    type: 'select', 
    options: ['初心者', '1年未満', '1-3年', '3年以上'] 
  },
  agreeToTerms: { type: 'checkbox', required: true }
};

// セキュリティ要件
const securityRequirements = {
  captcha: 'reCAPTCHA v3',
  emailVerification: true,
  twoFactorAuth: 'optional', // Phase 2で必須化
  sessionTimeout: 30 * 60 * 1000 // 30分
};
```

### 3.2 動画視聴ページUI/UX設計

**コアコンポーネント:**
1. **ビデオプレーヤー（Vimeo Player）**
   - 1920x1080 HD対応
   - 再生速度調整（0.5x～2.0x）
   - 10秒巻き戻し/早送り
   - 字幕対応

2. **レッスンナビゲーション**
   - 前/次のレッスンボタン
   - コース全体の進捗バー
   - チャプターマーカー

3. **補助機能**
   - レッスンノート（メモ機能）
   - ダウンロード可能な資料リンク
   - リアルタイムQ&Aチャット

### 3.3 チャット機能の実装パターン

**Socket.io実装構成:**
```javascript
// サーバー側実装
const chatRooms = {
  courseRoom: `course_${courseId}`, // コース別チャット
  lessonRoom: `lesson_${lessonId}`, // レッスン別チャット
  supportRoom: 'support', // サポートチャット
};

// クライアント側実装
const chatFeatures = {
  realTimeMessaging: true,
  typingIndicator: true,
  userPresence: true,
  messageHistory: 100, // 直近100メッセージ保存
  fileSharing: false, // Phase 2で実装
};
```

### 3.4 管理画面の最小限機能

**MVP管理機能:**
1. **動画管理**
   - アップロード（最大500MB/ファイル）
   - メタデータ編集（タイトル、説明、タグ）
   - 公開スケジュール設定
   - 視聴統計

2. **ユーザー管理**
   - ユーザー一覧・検索
   - アクセス権限設定（学生/管理者）
   - 学習進捗モニタリング
   - アカウント停止/削除

---

## 4. 技術的な実装要件

### 4.1 Vimeo API実装

**実装アーキテクチャ:**
```javascript
// Vimeo Player初期化
const vimeoConfig = {
  apiEndpoint: 'https://api.vimeo.com',
  playerOptions: {
    autopause: false,
    autoplay: false,
    byline: false,
    color: '#00adef',
    controls: true,
    dnt: true, // プライバシー保護
    encrypted: true, // HLS暗号化
    quality: 'auto',
    responsive: true
  },
  
  // DRM設定（Enterprise契約必須）
  drmConfig: {
    enabled: true,
    widevine: true,
    fairplay: true,
    playready: true
  }
};

// API認証
const vimeoAuth = {
  clientId: process.env.VIMEO_CLIENT_ID,
  clientSecret: process.env.VIMEO_CLIENT_SECRET,
  accessToken: process.env.VIMEO_ACCESS_TOKEN,
  
  // レート制限対策
  rateLimitHandler: {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2
  }
};
```

### 4.2 段階的動画公開の実装

**データベーススキーマ:**
```sql
-- コンテンツ公開スケジュール
CREATE TABLE content_schedule (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id),
  lesson_id INTEGER REFERENCES lessons(id),
  release_type ENUM('immediate', 'scheduled', 'drip'),
  release_days_after_enrollment INTEGER,
  release_date TIMESTAMP,
  prerequisite_lesson_id INTEGER REFERENCES lessons(id)
);

-- ユーザー進捗管理
CREATE TABLE user_progress (
  user_id INTEGER REFERENCES users(id),
  lesson_id INTEGER REFERENCES lessons(id),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  completion_percentage DECIMAL(5,2),
  PRIMARY KEY (user_id, lesson_id)
);
```

**実装パターン:**
```javascript
// コンテンツアクセス制御
const checkContentAccess = async (userId, lessonId) => {
  const enrollment = await getEnrollment(userId, courseId);
  const schedule = await getContentSchedule(lessonId);
  
  if (schedule.releaseType === 'drip') {
    const daysSinceEnrollment = 
      (Date.now() - enrollment.enrolledAt) / (1000 * 60 * 60 * 24);
    
    if (daysSinceEnrollment < schedule.releaseDaysAfterEnrollment) {
      return { 
        hasAccess: false, 
        availableIn: schedule.releaseDaysAfterEnrollment - daysSinceEnrollment 
      };
    }
  }
  
  if (schedule.prerequisiteLessonId) {
    const prerequisiteCompleted = 
      await checkLessonCompletion(userId, schedule.prerequisiteLessonId);
    
    if (!prerequisiteCompleted) {
      return { 
        hasAccess: false, 
        requiresCompletion: schedule.prerequisiteLessonId 
      };
    }
  }
  
  return { hasAccess: true };
};
```

### 4.3 Socket.ioリアルタイムチャット

**実装構成:**
```javascript
// サーバー側（Node.js + Socket.io）
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true
  }
});

io.use(async (socket, next) => {
  // JWT認証
  const token = socket.handshake.auth.token;
  const user = await verifyToken(token);
  socket.userId = user.id;
  next();
});

io.on('connection', (socket) => {
  // ルーム参加
  socket.on('join_lesson', async (lessonId) => {
    const hasAccess = await checkLessonAccess(socket.userId, lessonId);
    if (hasAccess) {
      socket.join(`lesson_${lessonId}`);
      
      // 過去のメッセージ送信
      const messages = await getRecentMessages(lessonId, 50);
      socket.emit('message_history', messages);
    }
  });
  
  // メッセージ送信
  socket.on('send_message', async (data) => {
    const message = await saveMessage({
      userId: socket.userId,
      lessonId: data.lessonId,
      text: data.text,
      timestamp: new Date()
    });
    
    io.to(`lesson_${data.lessonId}`).emit('new_message', message);
  });
  
  // タイピングインジケーター
  socket.on('typing', (data) => {
    socket.to(`lesson_${data.lessonId}`)
      .emit('user_typing', { userId: socket.userId });
  });
});
```

### 4.4 レスポンシブデザイン実装

**ブレークポイント戦略:**
```css
/* モバイルファースト設計 */
/* ベース（モバイル）: 320px - 768px */
.video-container {
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  position: relative;
}

/* タブレット: 768px - 1024px */
@media (min-width: 768px) {
  .course-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
}

/* デスクトップ: 1024px+ */
@media (min-width: 1024px) {
  .main-layout {
    display: grid;
    grid-template-columns: 250px 1fr 300px;
    gap: 2rem;
  }
  
  .course-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* ラージデスクトップ: 1440px+ */
@media (min-width: 1440px) {
  .container {
    max-width: 1280px;
    margin: 0 auto;
  }
}
```

---

## 5. セキュリティ要件

### 5.1 動画コンテンツ保護（最優先実装）

**実装レベル別対策:**

| 保護レベル | 技術 | 実装難易度 | 効果 | MVP推奨 |
|----------|------|-----------|------|---------|
| **基本** |
| 右クリック無効化 | JavaScript | 低 | 低 | ✅ |
| Blob URL | JavaScript | 低 | 中 | ✅ |
| ドメイン制限 | CDN設定 | 低 | 中 | ✅ |
| **中級** |
| HLS暗号化 | AES-128 | 中 | 高 | ✅ |
| 有効期限付きURL | サーバー側 | 中 | 高 | ✅ |
| トークン認証 | JWT | 中 | 高 | ✅ |
| **上級** |
| Multi-DRM | Vimeo OTT | 高 | 最高 | Phase 2 |
| 動的透かし | サーバー側 | 高 | 高 | Phase 3 |
| 画面録画検知 | JavaScript | 中 | 中 | Phase 2 |

### 5.2 会員認証セキュリティ

**JWT実装（推奨）:**
```javascript
// JWT設定
const jwtConfig = {
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET,
    expiresIn: '15m',
    algorithm: 'HS256'
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '7d',
    algorithm: 'HS256'
  },
  
  // セキュリティオプション
  security: {
    httpOnly: true,
    secure: true, // HTTPS必須
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7日
  }
};

// パスワード要件
const passwordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: true,
  preventCommon: true, // 一般的なパスワード禁止
  preventReuse: 12 // 過去12回のパスワード再利用禁止
};
```

### 5.3 不正アクセス対策

**実装優先順位:**

1. **Phase 1（MVP必須）**
   - IPベースレート制限（100req/分）
   - ログイン試行制限（5回/15分）
   - CAPTCHA（reCAPTCHA v3）
   - 基本的な同時セッション制限（3セッション）

2. **Phase 2（30日以内）**
   - デバイスフィンガープリンティング
   - 異常検知アラート
   - 2要素認証（TOTP）
   - 詳細な行動分析

3. **Phase 3（60日以降）**
   - 機械学習による不正検知
   - 高度な透かし技術
   - リアルタイム脅威分析

---

## 6. 推奨技術スタック

### 6.1 MVP技術選定

```yaml
# 推奨技術スタック
frontend:
  framework: Next.js 14
  ui_library: React 18
  styling: Tailwind CSS
  state_management: Zustand
  
backend:
  runtime: Node.js 20 LTS
  framework: Express.js
  realtime: Socket.io
  
database:
  primary: PostgreSQL 15
  cache: Redis 7
  
video:
  hosting: Vimeo (Plus/Pro プラン)
  player: Vimeo Player SDK
  
hosting:
  frontend: Vercel
  backend: AWS EC2 / Railway
  database: AWS RDS / Supabase
  
security:
  authentication: JWT + Refresh Token
  encryption: bcrypt (passwords)
  rate_limiting: express-rate-limit
  
monitoring:
  analytics: Google Analytics 4
  error_tracking: Sentry
  uptime: UptimeRobot
```

### 6.2 開発環境構成

```javascript
// package.json 依存関係（主要なもの）
{
  "dependencies": {
    // Frontend
    "next": "^14.0.0",
    "react": "^18.2.0",
    "@vimeo/player": "^2.20.0",
    "socket.io-client": "^4.6.0",
    
    // Backend
    "express": "^4.18.0",
    "socket.io": "^4.6.0",
    "jsonwebtoken": "^9.0.0",
    "bcrypt": "^5.1.0",
    "pg": "^8.11.0",
    "redis": "^4.6.0",
    
    // Utilities
    "zod": "^3.22.0", // バリデーション
    "date-fns": "^2.30.0", // 日付処理
    "axios": "^1.6.0", // HTTP client
    "dotenv": "^16.3.0" // 環境変数
  }
}
```

---

## 7. 実装ロードマップ

### Phase 1: MVP（4-6週間）

**Week 1-2: 基盤構築**
- Next.js + PostgreSQL環境構築
- 認証システム（JWT）実装
- 基本的なページ構造作成

**Week 3-4: コア機能**
- Vimeo統合・動画再生機能
- コース/レッスン管理
- 段階的コンテンツ公開

**Week 5-6: 仕上げ**
- Socket.ioチャット実装
- 管理画面基本機能
- セキュリティ対策（基本レベル）

### Phase 2: 機能拡張（4週間）

- DRM保護強化
- デモ取引シミュレーター
- 高度な進捗トラッキング
- モバイルアプリ開発検討

### Phase 3: 最適化（継続的）

- パフォーマンス最適化
- A/Bテスト実装
- 機械学習による個別最適化
- 国際化対応

---

## 8. コスト見積もり

### 月額ランニングコスト（100-1000ユーザー想定）

| サービス | プラン | 月額費用 |
|---------|-------|---------|
| Vimeo | Pro | $79 |
| Vercel | Pro | $20 |
| PostgreSQL (Supabase) | Pro | $25 |
| Redis Cloud | Essentials | $5 |
| その他（ドメイン、SSL等） | - | $20 |
| **合計** | | **$149/月** |

### 初期開発コスト

- 開発期間：6-8週間
- 必要人員：フルスタック開発者1-2名
- 外注の場合：200-400万円（MVP完成まで）

---

## 9. 実装上の注意事項

### 9.1 法的考慮事項

1. **金融商品取引法への配慮**
   - 投資助言に該当しない教育コンテンツとする
   - 免責事項の明確な表示
   - リスク警告の適切な配置

2. **個人情報保護**
   - プライバシーポリシーの策定
   - GDPRへの対応（EU圏ユーザーがいる場合）
   - 適切なデータ保持期間の設定

### 9.2 スケーラビリティ考慮

1. **データベース設計**
   - 適切なインデックス設定
   - パーティショニング戦略
   - 読み取り専用レプリカの活用

2. **CDN活用**
   - 静的アセットのCDN配信
   - エッジキャッシング戦略
   - 地理的分散への対応

### 9.3 ユーザビリティ向上

1. **オンボーディング**
   - インタラクティブなチュートリアル
   - 段階的な機能開放
   - ヘルプツールチップの配置

2. **フィードバック収集**
   - ユーザーアンケート機能
   - 行動分析ツールの導入
   - A/Bテストの実施

---

## まとめ

本要件定義書は、FX動画配信・学習プラットフォームの構築に必要な全要素を網羅しています。MVP開発では、基本的な動画配信機能、段階的コンテンツ公開、基礎的なセキュリティ対策に焦点を当て、4-6週間での実装を目指します。

推奨される技術スタック（Next.js + Vimeo + PostgreSQL）は、拡張性とコストパフォーマンスのバランスが取れており、将来的な機能追加にも柔軟に対応できます。セキュリティ面では、段階的なアプローチを採用し、まず基本的な保護から始めて、徐々に高度な対策を追加していくことで、開発速度と安全性のバランスを保ちます。

この要件定義に基づいて開発を進めることで、競争力のあるFX学習プラットフォームを効率的に構築できるでしょう。
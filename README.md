# FX Tiger Dojo - プロトレーダー養成所

FX教育に特化した動画配信・オンライン学習プラットフォーム

## 🌟 特徴

- **月2本の厳選動画**: 質の高いコンテンツで確実にスキルアップ
- **段階的コンテンツ解放**: 学習進度に応じた動画配信システム
- **講師との直接チャット**: リアルタイムでの質問・サポート体制
- **プレミアムUIデザイン**: 黒×ゴールドの高級感あるインターface
- **完全レスポンシブ**: スマートフォンでもデスクトップでも最適表示

## 🏗️ 技術スタック

### フロントエンド
- **Next.js 14** - React フレームワーク (App Router)
- **TypeScript** - 型安全な開発
- **Tailwind CSS** - ユーティリティファーストCSS
- **Zustand** - 軽量状態管理
- **Axios** - HTTP クライアント
- **React Hook Form** - フォーム管理
- **Zod** - バリデーション

### バックエンド
- **Node.js** - JavaScript ランタイム
- **Express.js** - Web アプリケーションフレームワーク
- **TypeScript** - 型安全な開発
- **Prisma** - データベース ORM
- **PostgreSQL** - リレーショナルデータベース
- **JWT + Refresh Token** - 認証システム
- **bcrypt** - パスワードハッシュ化
- **Socket.io** - リアルタイム通信

### インフラ・ツール
- **Docker** - コンテナ化
- **Prisma Studio** - データベース管理UI
- **ESLint** - コード品質管理

## 🚀 クイックスタート

### 前提条件

- Node.js 18以上
- PostgreSQL 12以上
- npm または yarn

### 1. リポジトリのクローン

```bash
git clone https://github.com/your-username/fx-tiger-dojo.git
cd fx-tiger-dojo
```

### 2. セットアップスクリプトの実行

```bash
# Linux/Mac
chmod +x scripts/setup.sh
./scripts/setup.sh

# Windows (Git Bash recommended)
bash scripts/setup.sh
```

### 3. 環境変数の設定

`.env` ファイルを編集して、実際のデータベース接続情報を設定:

```bash
# .env
DATABASE_URL="postgresql://postgres:password@localhost:5432/fx_platform"
JWT_ACCESS_SECRET="your-generated-access-secret"
JWT_REFRESH_SECRET="your-generated-refresh-secret"
```

### 4. データベースマイグレーション

```bash
cd apps/backend
npm run db:migrate
```

### 5. 開発サーバー起動

```bash
# ルートディレクトリで
npm run dev

# または個別に起動
npm run dev:frontend  # http://localhost:3000
npm run dev:backend   # http://localhost:5000
```

## 📁 プロジェクト構造

```
fx-tiger-dojo/
├── apps/
│   ├── frontend/          # Next.js フロントエンド
│   │   ├── app/           # App Router pages
│   │   ├── components/    # 再利用可能コンポーネント
│   │   ├── lib/          # ユーティリティ・API
│   │   └── public/       # 静的ファイル
│   │
│   ├── backend/          # Node.js バックエンド
│   │   ├── src/
│   │   │   ├── routes/   # API ルート
│   │   │   ├── services/ # ビジネスロジック
│   │   │   ├── middleware/ # Express ミドルウェア
│   │   │   └── utils/    # ユーティリティ関数
│   │   └── prisma/       # データベーススキーマ
│   │
│   └── admin/            # 管理画面 (Phase 4)
│
├── packages/             # 共通パッケージ
│   ├── shared/          # 型定義・ユーティリティ
│   └── ui/              # 共通UIコンポーネント
│
├── scripts/             # セットアップ・デプロイスクリプト
└── docker/              # Docker 設定
```

## 🔐 認証システム

### JWT + Refresh Token
- **Access Token**: 15分間有効、API アクセス用
- **Refresh Token**: 7日間有効、Access Token 更新用
- **HTTP-Only Cookie**: セキュアなトークン保存
- **Rate Limiting**: ブルートフォース攻撃対策

### パスワード要件
- 12文字以上
- 大文字・小文字・数字・特殊文字を含む
- 一般的なパスワードの禁止
- bcrypt による安全なハッシュ化

## 📊 データベース設計

### 主要エンティティ
- **User**: ユーザー情報・認証データ
- **Course**: コース情報
- **Lesson**: レッスン詳細・公開設定
- **Progress**: 学習進捗
- **Session**: 認証セッション管理
- **ChatMessage**: チャットメッセージ

### 段階的コンテンツ解放
- **IMMEDIATE**: 即座に公開
- **SCHEDULED**: 特定日時に公開
- **DRIP**: 登録からの経過日数で公開
- **PREREQUISITE**: 前提レッスン完了後に公開

## 🎨 UIデザイン

### カラーパレット
- **プライマリ**: ゴールド (#EAB308, #FACC15, #CA8A04)
- **背景**: ダークグレー (#0F0F0F, #0A0A0A)
- **アクセント**: グラデーション効果
- **テキスト**: 白・グレー階調

### レスポンシブデザイン
- **モバイルファースト**: 320px から対応
- **ブレークポイント**: 768px, 1024px, 1440px
- **柔軟なグリッドシステム**: Tailwind CSS Grid

## 🛡️ セキュリティ

### 実装済み対策
- **Helmet**: セキュリティヘッダー設定
- **CORS**: クロスオリジンリクエスト制御
- **Rate Limiting**: リクエスト制限 (100req/15min)
- **認証制限**: ログイン試行制限 (5回/15分)
- **入力バリデーション**: Zod による厳密な検証
- **SQLインジェクション対策**: Prisma ORM

### 予定されている追加対策 (Phase 2-3)
- **2要素認証 (TOTP)**
- **デバイスフィンガープリンティング**
- **異常検知アラート**
- **機械学習による不正検知**

## 📈 開発ロードマップ

### ✅ Phase 1: 基盤構築 (完了)
- モノレポプロジェクト構造
- 認証システム (JWT + Refresh Token)
- ログイン・登録UI
- データベース設計
- 基本的なセキュリティ対策

### 🔄 Phase 2: 動画配信機能 (4-6週間)
- Vimeo 統合・プレーヤー実装
- コース・レッスン管理
- 段階的コンテンツ解放システム
- 視聴進捗トラッキング
- DRM保護強化

### 🔄 Phase 3: リアルタイムチャット (2-3週間)
- Socket.io サーバー設定
- Discord風チャットUI
- リアルタイムメッセージング
- 講師・生徒間コミュニケーション

### 🔄 Phase 4: 管理画面 (3-4週間)
- 管理者認証システム
- 動画アップロード機能
- ユーザー管理
- 統計ダッシュボード

### 🔄 Phase 5: 決済システム (オプション)
- メンバーシップ管理
- プランによるアクセス制御

### 🔄 Phase 6: テスト・最適化
- E2Eテスト実装
- パフォーマンス最適化
- セキュリティ監査

## 🧪 テスト

```bash
# フロントエンドテスト
cd apps/frontend
npm test

# バックエンドテスト
cd apps/backend
npm test

# E2Eテスト (Phase 6)
npm run test:e2e
```

## 📦 本番デプロイ

### 推奨環境
- **Frontend**: Vercel
- **Backend**: AWS EC2 / Railway / Heroku
- **Database**: AWS RDS / Supabase
- **CDN**: Cloudflare

### Docker デプロイ
```bash
docker-compose up -d
```

## 🤝 コントリビューション

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 ライセンス

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 サポート

### トラブルシューティング

**問題**: データベース接続エラー
```bash
# PostgreSQL の起動確認
sudo service postgresql status

# データベースの存在確認
psql -l | grep fx_platform
```

**問題**: ポート衝突
```bash
# ポート使用状況確認
lsof -i :3000
lsof -i :5000
```

**問題**: 依存関係エラー
```bash
# node_modules のクリーンアップ
rm -rf node_modules apps/*/node_modules
npm install
```

### お問い合わせ
- 📧 Email: support@fx-tiger-dojo.com
- 🐛 Issues: GitHub Issues
- 💬 Discord: [コミュニティサーバー]

---

**Developed with ❤️ by FX Tiger Dojo Team**
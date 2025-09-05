# FX動画配信サイト UIテンプレート実装ガイド

## 📌 概要

FX動画配信サイトを**2つの独立したページ**として実装します：
1. **動画視聴ページ** - 月2本の動画をミニマルに表示
2. **チャットページ** - Discord/Slack風の講師とのDM機能

両ページとも黒ベースの高級感あるダークテーマで統一します。

---

## 🎬 Part 1: 動画視聴ページ

### 使用テンプレート

**Mux Video Course Starter Kit** (無料・GitHub)
- GitHub: https://github.com/muxinc/video-course-starter-kit
- 特徴：ミニマルなコース動画表示に特化
- ライセンス：MIT

### カスタマイズ実装

```typescript
// pages/videos/index.tsx
// 月2本の動画をエレガントに表示するページ

import { useState } from 'react';
import { Lock, PlayCircle, Calendar, Clock } from 'lucide-react';

const VideoCoursePage = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black">
      {/* ヘッダー */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center">
                <span className="text-xl">🦁</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent">
                TRADE DOJO
              </h1>
            </div>
            <nav className="flex items-center gap-6">
              <a href="/videos" className="text-yellow-400">動画</a>
              <a href="/chat" className="text-gray-400 hover:text-white transition">チャット</a>
              <a href="/profile" className="text-gray-400 hover:text-white transition">プロフィール</a>
            </nav>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* 今月の動画セクション */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              今月の講座
            </h2>
            <p className="text-gray-400">
              2025年1月 - プロトレーダーへの道
            </p>
          </div>

          {/* 動画カード（月2本を大きく表示） */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* 動画1 - 解放済み */}
            <div className="group cursor-pointer" onClick={() => setSelectedVideo(1)}>
              <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden border border-gray-800 group-hover:border-yellow-500/50 transition-all duration-300">
                <img 
                  src="/api/placeholder/640/360" 
                  alt="FX基礎講座"
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                      視聴可能
                    </span>
                    <span className="text-gray-400 text-sm flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 45分
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    第1回：相場分析の基礎
                  </h3>
                  <p className="text-gray-300 text-sm">
                    テクニカル分析とファンダメンタル分析の使い分け
                  </p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <div className="w-20 h-20 bg-yellow-500/90 rounded-full flex items-center justify-center transform group-hover:scale-110 transition">
                    <PlayCircle className="w-10 h-10 text-black" />
                  </div>
                </div>
              </div>
            </div>

            {/* 動画2 - ロック状態 */}
            <div className="group cursor-pointer relative">
              <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden border border-gray-800 opacity-60">
                <img 
                  src="/api/placeholder/640/360" 
                  alt="リスク管理"
                  className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full border border-gray-500/30">
                      1月15日公開
                    </span>
                    <span className="text-gray-400 text-sm flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 50分
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    第2回：リスク管理とポジションサイジング
                  </h3>
                  <p className="text-gray-300 text-sm">
                    資金を守りながら利益を最大化する方法
                  </p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center">
                    <Lock className="w-10 h-10 text-gray-500" />
                  </div>
                </div>
              </div>
              {/* カウントダウン表示 */}
              <div className="absolute top-4 right-4 bg-black/80 backdrop-blur px-3 py-2 rounded-lg">
                <p className="text-yellow-400 text-sm font-semibold">
                  あと5日で公開
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 過去の動画アーカイブ */}
        <section>
          <h3 className="text-2xl font-bold text-white mb-6">
            過去の講座アーカイブ
          </h3>
          <div className="space-y-4">
            {[
              { month: '2024年12月', title: 'エントリーポイントの見極め方', duration: '42分' },
              { month: '2024年12月', title: 'トレンドフォロー戦略', duration: '38分' },
              { month: '2024年11月', title: 'ボラティリティの理解と活用', duration: '45分' },
              { month: '2024年11月', title: '経済指標の読み方', duration: '40分' },
            ].map((video, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-gray-700 transition cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                    <PlayCircle className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{video.title}</h4>
                    <p className="text-gray-500 text-sm">{video.month}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-400 text-sm">{video.duration}</span>
                  <button className="text-yellow-400 hover:text-yellow-300 transition">
                    視聴する →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default VideoCoursePage;
```

### スタイリング（Tailwind設定）

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'gold': {
          400: '#FACC15',
          500: '#EAB308',
          600: '#CA8A04',
        },
        'dark': {
          900: '#0F0F0F',
          950: '#0A0A0A',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    }
  }
}
```

---

## 💬 Part 2: チャットページ（Discord風DM）

### 使用テンプレート

**Discord Clone UI** をベースにカスタマイズ
- 参考：Stream Chat Discord テーマ
- TalkJS Discord テーマ設定

### 実装コード

```typescript
// pages/chat/index.tsx
// Discord風のDMチャットページ

import { useState } from 'react';
import { Send, Search, Hash, AtSign, Settings, Plus, Mic, Video, Phone } from 'lucide-react';

const ChatPage = () => {
  const [selectedChannel, setSelectedChannel] = useState('dm-instructor');
  const [message, setMessage] = useState('');
  
  return (
    <div className="h-screen flex bg-[#313338]">
      {/* サイドバー - サーバー/DM一覧 */}
      <div className="w-72 bg-[#2B2D31] flex">
        {/* 左端のサーバーリスト */}
        <div className="w-[72px] bg-[#1E1F22] py-3 flex flex-col items-center gap-2">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-2xl flex items-center justify-center hover:rounded-xl transition-all cursor-pointer">
            <span className="text-2xl">🦁</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-700 rounded-full" />
          <div className="w-12 h-12 bg-[#313338] rounded-3xl flex items-center justify-center hover:rounded-2xl hover:bg-yellow-500 transition-all cursor-pointer group">
            <Plus className="w-5 h-5 text-gray-400 group-hover:text-white" />
          </div>
        </div>

        {/* チャンネル/DM リスト */}
        <div className="flex-1 flex flex-col">
          {/* 検索バー */}
          <div className="p-3 border-b border-[#1F2023]">
            <div className="relative">
              <input 
                type="text"
                placeholder="会話を検索または開始"
                className="w-full bg-[#1E1F22] text-gray-300 pl-3 pr-8 py-1.5 rounded text-sm focus:outline-none"
              />
              <Search className="absolute right-2 top-2 w-4 h-4 text-gray-500" />
            </div>
          </div>

          {/* DM リスト */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-2 py-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase px-2 mb-2">
                ダイレクトメッセージ
              </h3>
              
              {/* 講師とのDM（アクティブ） */}
              <div 
                className="flex items-center gap-3 px-2 py-2 rounded bg-[#404249] cursor-pointer mb-1"
                onClick={() => setSelectedChannel('dm-instructor')}
              >
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-black">講</span>
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#2B2D31]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">ASO講師</p>
                  <p className="text-xs text-gray-400">オンライン</p>
                </div>
              </div>

              {/* 他のメンバー */}
              <div className="flex items-center gap-3 px-2 py-2 rounded hover:bg-[#35373C] cursor-pointer mb-1">
                <div className="relative">
                  <div className="w-8 h-8 bg-gray-600 rounded-full" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-gray-500 rounded-full border-2 border-[#2B2D31]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-300">山田太郎</p>
                  <p className="text-xs text-gray-500">オフライン</p>
                </div>
              </div>

              {/* グループチャンネル */}
              <h3 className="text-xs font-semibold text-gray-400 uppercase px-2 mb-2 mt-4">
                テキストチャンネル
              </h3>
              
              <div className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-[#35373C] cursor-pointer">
                <Hash className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">general</span>
              </div>
              
              <div className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-[#35373C] cursor-pointer">
                <Hash className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">質問コーナー</span>
              </div>
              
              <div className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-[#35373C] cursor-pointer">
                <Hash className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">相場分析</span>
              </div>
            </div>
          </div>

          {/* ユーザー情報バー */}
          <div className="p-2 bg-[#232428] flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-600 rounded-full" />
            <div className="flex-1">
              <p className="text-xs text-white font-medium">あなた</p>
              <p className="text-xs text-gray-400">#1234</p>
            </div>
            <button className="p-1.5 hover:bg-[#35373C] rounded">
              <Mic className="w-4 h-4 text-gray-400" />
            </button>
            <button className="p-1.5 hover:bg-[#35373C] rounded">
              <Settings className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* メインチャットエリア */}
      <div className="flex-1 flex flex-col">
        {/* チャットヘッダー */}
        <div className="h-12 bg-[#313338] border-b border-[#27282C] flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <AtSign className="w-5 h-5 text-gray-400" />
            <span className="text-white font-semibold">ASO講師</span>
            <span className="text-xs text-gray-400 bg-green-500/20 px-2 py-0.5 rounded-full">
              オンライン
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-[#35373C] rounded">
              <Phone className="w-5 h-5 text-gray-400" />
            </button>
            <button className="p-2 hover:bg-[#35373C] rounded">
              <Video className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* メッセージエリア */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 講師からのメッセージ */}
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-black">講</span>
            </div>
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-yellow-400 font-semibold">ASO講師</span>
                <span className="text-xs text-gray-500">今日 14:30</span>
              </div>
              <div className="text-gray-100">
                本日の相場分析動画をアップしました。<br/>
                ドル円の重要なサポートラインについて解説しています。
              </div>
              <div className="mt-2 p-3 bg-[#2B2D31] rounded-lg border border-[#27282C] max-w-md">
                <p className="text-yellow-400 text-sm font-semibold mb-1">📊 今日の相場分析</p>
                <p className="text-gray-300 text-sm">USD/JPY: 148.50がキーレベル</p>
              </div>
            </div>
          </div>

          {/* 自分のメッセージ */}
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-gray-600 rounded-full flex-shrink-0" />
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-white font-semibold">あなた</span>
                <span className="text-xs text-gray-500">今日 14:45</span>
              </div>
              <div className="text-gray-100">
                ありがとうございます！<br/>
                RSIの使い方について質問があります。ダイバージェンスの見方を詳しく教えていただけますか？
              </div>
            </div>
          </div>

          {/* 講師の返信 */}
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-black">講</span>
            </div>
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-yellow-400 font-semibold">ASO講師</span>
                <span className="text-xs text-gray-500">今日 14:50</span>
              </div>
              <div className="text-gray-100">
                良い質問ですね！RSIのダイバージェンスは重要なシグナルです。<br/>
                明日のライブ配信で詳しく解説する予定ですが、簡単に説明すると...
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-400 italic">ASO講師が入力中...</span>
              </div>
            </div>
          </div>
        </div>

        {/* メッセージ入力エリア */}
        <div className="p-4 bg-[#313338]">
          <div className="bg-[#383A40] rounded-lg flex items-center px-4">
            <button className="p-2 hover:bg-[#35373C] rounded">
              <Plus className="w-5 h-5 text-gray-400" />
            </button>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="ASO講師へメッセージを送信"
              className="flex-1 bg-transparent text-gray-100 py-3 px-3 focus:outline-none placeholder-gray-500"
            />
            <button className="p-2 hover:bg-[#35373C] rounded">
              <Send className="w-5 h-5 text-gray-400 hover:text-yellow-400 transition" />
            </button>
          </div>
        </div>
      </div>

      {/* 右サイドバー（メンバーリスト） */}
      <div className="w-60 bg-[#2B2D31] p-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">
          オンライン — 2
        </h3>
        
        {/* 講師 */}
        <div className="flex items-center gap-3 py-2 px-2 rounded hover:bg-[#35373C] cursor-pointer">
          <div className="relative">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-black">講</span>
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#2B2D31]" />
          </div>
          <div>
            <p className="text-sm text-yellow-400 font-medium">ASO講師</p>
            <p className="text-xs text-gray-400">配信中</p>
          </div>
        </div>

        {/* 自分 */}
        <div className="flex items-center gap-3 py-2 px-2 rounded hover:bg-[#35373C] cursor-pointer">
          <div className="relative">
            <div className="w-8 h-8 bg-gray-600 rounded-full" />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#2B2D31]" />
          </div>
          <div>
            <p className="text-sm text-gray-300">あなた</p>
            <p className="text-xs text-gray-400">オンライン</p>
          </div>
        </div>

        <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3 mt-6">
          オフライン — 8
        </h3>
        
        {/* オフラインメンバー */}
        {['山田太郎', '佐藤花子', '鈴木一郎'].map((name, idx) => (
          <div key={idx} className="flex items-center gap-3 py-2 px-2 rounded hover:bg-[#35373C] cursor-pointer opacity-50">
            <div className="relative">
              <div className="w-8 h-8 bg-gray-700 rounded-full" />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-gray-600 rounded-full border-2 border-[#2B2D31]" />
            </div>
            <div>
              <p className="text-sm text-gray-400">{name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatPage;
```

---

## 🔧 Claude Codeへの実装指示

### Step 1: プロジェクト初期設定

```bash
# Next.jsプロジェクト作成
npx create-next-app@latest fx-platform --typescript --tailwind --app

# 必要なパッケージインストール
npm install lucide-react framer-motion @vimeo/player
npm install -D @types/node
```

### Step 2: ファイル構成

```
fx-platform/
├── app/
│   ├── layout.tsx       # 共通レイアウト
│   ├── page.tsx         # ホームページ
│   ├── videos/
│   │   └── page.tsx     # 動画視聴ページ
│   └── chat/
│       └── page.tsx     # チャットページ
├── components/
│   ├── VideoPlayer.tsx  # Vimeoプレーヤーコンポーネント
│   ├── ChatMessage.tsx  # チャットメッセージコンポーネント
│   └── Navigation.tsx   # ナビゲーションバー
└── styles/
    └── globals.css      # グローバルスタイル
```

### Step 3: カラーテーマ設定

```css
/* styles/globals.css */
:root {
  --color-gold-400: #facc15;
  --color-gold-500: #eab308;
  --color-gold-600: #ca8a04;
  
  --color-dark-900: #0f0f0f;
  --color-dark-950: #0a0a0a;
  
  /* Discord風カラー */
  --discord-bg: #313338;
  --discord-sidebar: #2b2d31;
  --discord-dark: #1e1f22;
  --discord-hover: #35373c;
  --discord-active: #404249;
}

body {
  background: var(--color-dark-950);
  color: #e0e0e0;
}
```

---

## 📝 実装優先順位

1. **Phase 1**: 基本レイアウトとナビゲーション
2. **Phase 2**: 動画ページの実装（Vimeo統合なし版）
3. **Phase 3**: チャットページUI実装（静的版）
4. **Phase 4**: バックエンド統合（認証、動画制御、リアルタイムチャット）

---

## 🎨 デザインのポイント

### 動画ページ
- 月2本を**大きくエレガント**に表示
- 余白を活かした高級感
- ロック/アンロック状態の明確な視覚的区別
- ミニマルなアーカイブリスト

### チャットページ
- **Discord風**の親しみやすいUI
- 講師を**ゴールドカラー**で強調
- オンライン/オフライン状態の表示
- 既読機能（Phase 4で実装）

両ページとも**黒×ゴールド**のカラースキームで統一し、FXトレード教育の**プレミアム感**を演出します。
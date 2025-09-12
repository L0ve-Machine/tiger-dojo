'use client'

import Link from 'next/link'
import { ArrowRight, Play, Users, Shield, TrendingUp, Star, Award, Globe, ExternalLink, MessageCircle, Phone, Check, Crown, Zap } from 'lucide-react'
import Image from 'next/image'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      {/* ヘッダー */}
      <header className="border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image 
                src="/images/lion-tech.jpeg" 
                alt="Lion Logo" 
                width={48}
                height={48}
                className="rounded-xl object-cover"
              />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent">
                TRADE DOJO
              </h1>
            </div>
            <nav className="flex items-center gap-6">
              <Link 
                href="/auth/login" 
                className="px-4 py-2 border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 rounded-lg font-medium transition-all"
              >
                ログイン
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
        
        {/* Background Image */}
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1647510283848-1884fb01e887?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB0cmFkaW5nJTIwZGVzayUyMGZpbmFuY2lhbHxlbnwxfHx8fDE3NTY1MTIyMDl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Professional Trading Environment"
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent"></div>
        
        <div className="relative container mx-auto px-6 py-20 z-10">
          <div className="max-w-3xl">
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full text-yellow-400 text-sm font-medium mb-4">
                FXサロン
              </span>
              <h1 className="text-5xl md:text-6xl lg:text-7xl text-white mb-6 leading-tight">
                <span className="block">トレード</span>
                <span className="block text-yellow-400">道場</span>
              </h1>
            </div>
            
            <div className="space-y-6 text-xl text-gray-300 leading-relaxed mb-10">
              <p>
                マンツーマン講習／講習講習／特別ラウンジ／個別チャット対応で、
              </p>
              <p className="text-yellow-400 font-medium">
                "勝てる型"を一緒に作るFXオンライン学習コミュニティです。
              </p>
            </div>
          
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/pricing"
                className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-500 hover:to-yellow-700 font-semibold rounded-lg text-lg transition-all"
              >
                詳しく見る
              </Link>
              <Link 
                href="/auth/login"
                className="px-8 py-4 border border-white/30 text-white hover:bg-white/10 font-medium rounded-lg text-lg transition-all"
              >
                ログイン
              </Link>
            </div>
            
            <div className="mt-12 flex items-center space-x-6 text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>即時入会可能</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>無料体験あり</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>FX技術向上</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute bottom-10 right-10 opacity-10">
          <div className="w-32 h-32 border border-white/20 rounded-full"></div>
          <div className="absolute top-4 left-4 w-24 h-24 border border-yellow-400/30 rounded-full"></div>
        </div>
      </section>


      {/* Features Section */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full text-yellow-400 text-sm font-medium mb-4">
              サービス内容
            </span>
            <h2 className="text-4xl md:text-5xl text-white mb-6">
              チャート読解から相場環境認識まで
              <span className="text-yellow-400"> 体系的に学ぶ</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              チャート分析・相場環境認識・エントリータイミングを実践的に学ぶFXオンライン学習環境
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-black/50 border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105 backdrop-blur-sm rounded-xl p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mr-4">
                  <TrendingUp className="w-6 h-6 text-yellow-400" />
                </div>
                <h3 className="text-xl text-white">根拠ある先出し</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                テクニカル分析とファンダメンタル分析に基づいた、確度の高いトレード予測を提供します。
              </p>
            </div>

            <div className="bg-black/50 border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105 backdrop-blur-sm rounded-xl p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mr-4">
                  <MessageCircle className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl text-white">添削フィードバック</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                あなたのトレード履歴を詳細に分析し、改善点を具体的にアドバイスします。
              </p>
            </div>

            <div className="bg-black/50 border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105 backdrop-blur-sm rounded-xl p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mr-4">
                  <Play className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-xl text-white">オンライン相談</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                マンツーマンでのリアルタイム相談で、疑問をその場で解決できます。
              </p>
            </div>

            <div className="bg-black/50 border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105 backdrop-blur-sm rounded-xl p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mr-4">
                  <Shield className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl text-white">トレード管理シートの配布</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                プロトレーダーが実際に使用している管理シートを提供し、資金管理やリスク管理を体系的に学べます。
              </p>
            </div>

            <div className="bg-black/50 border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105 backdrop-blur-sm rounded-xl p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mr-4">
                  <Users className="w-6 h-6 text-pink-400" />
                </div>
                <h3 className="text-xl text-white">コミュニティ</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                同じ志を持つトレーダーとの情報交換で、モチベーションを維持できます。
              </p>
            </div>

            <div className="bg-black/50 border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105 backdrop-blur-sm rounded-xl p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mr-4">
                  <TrendingUp className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-xl text-white">パフォーマンス分析</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                詳細なデータ分析により、トレード成績の向上をサポートします。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans Section */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full text-yellow-400 text-sm font-medium mb-4">
              料金プラン
            </span>
            <h2 className="text-4xl md:text-5xl text-white mb-6">
              あなたの成長段階に合わせた
              <span className="text-yellow-400"> 最適なプラン</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              無料体験から始めて、段階的にスキルアップできる料金体系をご用意しています
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <Card 
              className="relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl flex flex-col h-full border-2 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #1a1b3a 0%, #0a0b1a 100%)',
                borderColor: '#4a5568'
              }}
            >
              <div className="absolute top-0 left-0 right-0">
                <div 
                  className="text-center py-2 text-sm text-white relative"
                  style={{ background: 'linear-gradient(90deg, #4a5568, #2d3748)' }}
                >
                  お試しプラン
                </div>
              </div>

              <CardHeader className="text-center pt-12">
                <div className="flex items-center justify-center mb-4 p-3 rounded-full w-16 h-16 mx-auto bg-gray-600 text-white">
                  <span className="text-2xl">🔰</span>
                </div>
                
                <h3 className="text-2xl mb-2 text-white">フリープラン</h3>
                
                <div className="mb-4">
                  <span className="text-4xl text-white">¥0</span>
                  <span className="text-lg text-gray-300">/月</span>
                </div>
                
                <p className="text-sm leading-relaxed text-gray-300">
                  まずは先出しトレードおよびラウンジを体験
                </p>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-green-500" />
                    <span className="text-sm leading-relaxed text-gray-200">
                      先出しLINE参加
                    </span>
                  </li>
                  <li className="ml-8 text-xs text-gray-400">
                    完全無料先出しルームに参加し、指定の口座開設でプロトレーダーの先出しLINEに参加
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-green-500" />
                    <span className="text-sm leading-relaxed text-gray-200">
                      トレード道場特別ラウンジ体験
                    </span>
                  </li>
                  <li className="ml-8 text-xs text-gray-400">
                    オンラインサロンに参加し、体験希望を伝えることで会員限定ラウンジをお試し体験（一人一回）
                  </li>
                </ul>
                
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white text-xs"
                    onClick={() => window.open('https://line.me/ti/g2/9Pr6jxLGQOdaKuKY5eDLAOa3-p8zU5Ht8N1laA?utm_source=invitation&utm_medium=link_copy&utm_campaign=default', '_blank')}
                  >
                    完全無料先出しルームはこちら
                  </Button>
                  <Button 
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white text-xs"
                    onClick={() => window.open('https://discord.gg/f3vr94Qhqr', '_blank')}
                  >
                    トレード道場特別ラウンジ体験はこちら
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Standard Plan */}
            <Card 
              className="relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl flex flex-col h-full border-2 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #2a2d5a 0%, #1a1b3a 100%)',
                borderColor: '#d4af37'
              }}
            >
              <div className="absolute top-0 left-0 right-0">
                <div 
                  className="text-center py-2 text-sm text-white relative"
                  style={{ background: 'linear-gradient(90deg, #d4af37, #e6c547)' }}
                >
                  エントリープラン
                </div>
              </div>

              <CardHeader className="text-center pt-12">
                <div className="flex items-center justify-center mb-4 p-3 rounded-full w-16 h-16 mx-auto bg-yellow-500 text-black">
                  <Star className="w-6 h-6" />
                </div>
                
                <h3 className="text-2xl mb-2 text-white">スタンダードプラン</h3>
                
                <div className="mb-4">
                  <span className="text-4xl text-white">¥15,000</span>
                  <span className="text-lg text-gray-300">/月</span>
                </div>
                
                <p className="text-sm leading-relaxed text-gray-300">
                  サロン参加でトレードの基礎を学ぶ
                </p>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-yellow-500" />
                    <span className="text-sm leading-relaxed text-gray-200">
                      麻生のトレードに関する発信
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-yellow-500" />
                    <span className="text-sm leading-relaxed text-gray-200">
                      ライブトレード＆質問会（チャット参加のみ）
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-yellow-500" />
                    <span className="text-sm leading-relaxed text-gray-200">
                      定期通貨分析
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-yellow-500" />
                    <span className="text-sm leading-relaxed text-gray-200">
                      特別ラウンジ（チャット参加のみ）
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-yellow-500" />
                    <span className="text-sm leading-relaxed text-gray-200">
                      先出しサポート
                    </span>
                  </li>
                </ul>

                <div className="space-y-3">
                  <Button 
                    onClick={() => window.open('https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-8PD885481X888505ENAAKQAQ', '_blank')}
                    className="w-full py-3 transition-all duration-300 text-black border-2 hover:bg-yellow-500 rounded-lg font-bold"
                    style={{
                      background: 'linear-gradient(135deg, #d4af37, #e6c547)'
                    }}
                  >
                    今すぐ申し込む
                  </Button>
                  <Button
                    onClick={() => window.open('https://discord.gg/f3vr94Qhqr', '_blank')}
                    className="w-full py-2 bg-transparent border border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 rounded-lg text-sm"
                  >
                    申込済会員はこちら（Discord）
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card 
              className="relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl flex flex-col h-full border-2 shadow-xl"
              style={{
                background: 'linear-gradient(135deg, #d4af37 0%, #e6c547 100%)',
                borderColor: '#b8941f'
              }}
            >
              <div className="absolute top-0 left-0 right-0">
                <div 
                  className="text-center py-2 text-sm relative"
                  style={{ 
                    background: 'linear-gradient(90deg, #1a1b3a, #2a2d5a)',
                    color: '#d4af37'
                  }}
                >
                  人気プラン
                </div>
              </div>

              <CardHeader className="text-center pt-12">
                <div className="flex items-center justify-center mb-4 p-3 rounded-full w-16 h-16 mx-auto bg-gray-900 text-yellow-500">
                  <Crown className="w-6 h-6" />
                </div>
                
                <h3 className="text-2xl mb-2 text-gray-900">プレミアムプラン</h3>
                
                <div className="mb-4">
                  <span className="text-4xl text-gray-900">¥40,000</span>
                  <span className="text-lg text-gray-700">/月</span>
                </div>
                
                <p className="text-sm leading-relaxed text-gray-800">
                  プロレベルの実践力を身につける最上位プラン
                </p>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-gray-800" />
                    <span className="text-sm leading-relaxed text-gray-800">
                      麻生のトレードに関する発信
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-gray-800" />
                    <span className="text-sm leading-relaxed text-gray-800">
                      ライブトレード＆質問会（フル参加）
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-gray-800" />
                    <span className="text-sm leading-relaxed text-gray-800">
                      定期通貨分析
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-gray-800" />
                    <span className="text-sm leading-relaxed text-gray-800">
                      特別ラウンジ（フル参加）
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-gray-800" />
                    <span className="text-sm leading-relaxed text-gray-800">
                      月2回の講習講義配信
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-gray-800" />
                    <span className="text-sm leading-relaxed text-gray-800">
                      トレード管理表配布と添削
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-gray-800" />
                    <span className="text-sm leading-relaxed text-gray-800">
                      DMによるトレードの質問
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-gray-800" />
                    <span className="text-sm leading-relaxed text-gray-800">
                      月1回のトレード振り返り講習（50分）
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-gray-800" />
                    <span className="text-sm leading-relaxed text-gray-800">
                      イベント
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-gray-800" />
                    <span className="text-sm leading-relaxed text-gray-800">
                      先出しサポート
                    </span>
                  </li>
                </ul>

                <div className="space-y-3">
                  <Button 
                    onClick={() => window.open('https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-6NX871965X4205206NAAKOJI', '_blank')}
                    className="w-full py-3 transition-all duration-300 bg-gray-900 text-yellow-500 hover:bg-gray-800 rounded-lg font-bold text-center border-2 border-gray-900"
                    style={{
                      background: '#1f2937'
                    }}
                  >
                    今すぐ申し込む
                  </Button>
                  <Button
                    onClick={() => window.open('https://discord.gg/f3vr94Qhqr', '_blank')}
                    className="w-full py-2 bg-transparent border border-gray-900 text-gray-900 hover:bg-gray-900/10 rounded-lg text-sm"
                  >
                    申込済会員はこちら（Discord）
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 max-w-3xl mx-auto text-center">
            <p className="text-gray-400 text-sm">
              ※ 銀行振り込みも対応しておりますが、個別相談者限定としております
            </p>
            <p className="text-gray-400 text-sm mt-2">
              ※ プレミアムプランが満員の場合、スタンダードプランの方から優先案内となります
            </p>
            <p className="text-gray-400 text-sm mt-2">
              ※ プレミアムプラン申し込み後に会員登録してください（未入会者は登録不可）
            </p>
            <p className="text-gray-400 text-sm mt-2">
              ※ プランのグレードアップは可能ですが、グレードを下げることはできません
            </p>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-400 mb-6">
              ご不明な点がございましたら、お気軽にお問い合わせください
            </p>
            <div className="flex justify-center">
              <a
                href="https://lin.ee/EzJAtsw"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-green-600/20 text-green-300 hover:bg-green-600/30 rounded-lg transition-all font-medium"
              >
                <MessageCircle className="w-5 h-5" />
                麻生個人LINE
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link 
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-600 text-gray-300 hover:border-yellow-400 hover:bg-yellow-400/10 rounded-xl font-medium transition-all"
            >
              詳しい料金プランを見る
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="border-t border-white/10 bg-black py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-6 overflow-hidden" style={{ height: '60px' }}>
              <Image 
                src="/images/trade-dojo-gold.png" 
                alt="TRADE DOJO Logo" 
                width={400}
                height={100}
                className="object-cover object-center"
                style={{ marginTop: '-20px', marginBottom: '-20px' }}
              />
            </div>
            <p className="text-gray-300 text-lg mb-8">
              "勝てる型"を一緒に作るオンライン環境で、あなたの人生を変える
            </p>

            {/* Social Links */}
            <p className="text-gray-400 mb-4">各種SNSはこちら</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-8">
              <a
                href="https://youtube.com/@aso_trade_infx?si=Szeu_8dcrATZ--0U"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded-lg transition-all font-medium"
              >
                <Play className="w-5 h-5" />
                トレード道場YouTube
                <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href="https://line.me/ti/g2/9Pr6jxLGQOdaKuKY5eDLAOa3-p8zU5Ht8N1laA?utm_source=invitation&utm_medium=link_copy&utm_campaign=default"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-300 hover:bg-green-500/30 rounded-lg transition-all font-medium"
              >
                <MessageCircle className="w-5 h-5" />
                完全無料先出しLINE
                <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com/ASO_TRADE_SC"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 text-gray-300 hover:bg-gray-700/70 rounded-lg transition-all font-medium"
              >
                <span className="text-xl font-bold">𝕏</span>
                麻生賢吾Xアカウント
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 text-center">
            <p className="text-gray-400">
              © 2025 FXサロン「TRADE DOJO」. All rights reserved. | 
              <Link href="/privacy" className="hover:text-white transition">プライバシーポリシー</Link> | 
              <Link href="/terms" className="hover:text-white transition">利用規約</Link>
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
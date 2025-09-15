'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { Check, Crown, Star, Zap, Loader2, Play, MessageCircle, ExternalLink, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface PlanFeature {
  text: string;
  included: boolean;
}

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
  premium?: boolean;
  icon: React.ReactNode;
  isActive: boolean;
}

interface CurrentSubscription {
  id: string
  status: string
  startDate: string
  endDate: string
  autoRenew: boolean
  plan: {
    name: string
    price: number
    features: string[]
  }
}

export default function PricingPlans() {
  const { user } = useAuthStore()
  const router = useRouter()
  
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const mockPlans: PricingPlan[] = [
          {
            id: 'free',
            name: "フリープラン",
            price: "¥0",
            description: "まずは先出しトレードおよびラウンジを体験",
            icon: <span className="text-2xl">🔰</span>,
            popular: false,
            isActive: true,
            features: [
              { text: "先出しLINE参加", included: true },
              { text: "トレード道場特別ラウンジ体験", included: true },
            ]
          },
          {
            id: 'standard',
            name: "スタンダードプラン",
            price: "¥15,000",
            description: "サロン参加でトレードの基礎を学ぶ",
            icon: <Star className="w-6 h-6" />,
            popular: true,
            isActive: true,
            features: [
              { text: "麻生のトレードに関する発信", included: true },
              { text: "ライブトレード＆質問会（チャット参加のみ）", included: true },
              { text: "定期通貨分析", included: true },
              { text: "特別ラウンジ（チャット参加のみ）", included: true },
              { text: "先出しサポート", included: true },
            ]
          },
          {
            id: 'premium',
            name: "プレミアムプラン",
            price: "¥40,000",
            description: "プロの指導により一人で勝てるスキルを身に付ける",
            icon: <Crown className="w-6 h-6" />,
            premium: true,
            isActive: true,
            features: [
              { text: "麻生のトレードに関する発信", included: true },
              { text: "ライブトレード＆質問会（フル参加）", included: true },
              { text: "定期通貨分析", included: true },
              { text: "特別ラウンジ（フル参加）", included: true },
              { text: "月2回の講習講義配信", included: true },
              { text: "トレード管理表配布と添削", included: true },
              { text: "DMによるトレードの質問", included: true },
              { text: "月1回のトレード振り返り講習（50分）", included: true },
              { text: "イベント", included: true },
              { text: "先出しサポート", included: true },
            ]
          }
        ];
        
        setPlans(mockPlans)
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to fetch pricing data:', error)
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user])

  const handleSubscribe = async (planId: string) => {
    setSubscribingPlanId(planId)
    
    try {
      let paypalUrl = ''
      if (planId === 'standard') {
        paypalUrl = 'https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-8PD885481X888505ENAAKQAQ'
      } else if (planId === 'premium') {
        paypalUrl = 'https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-6NX871965X4205206NAAKOJI'
      }
      
      if (paypalUrl) {
        window.open(paypalUrl, '_blank')
      }
    } catch (error) {
      alert("エラーが発生しました")
    } finally {
      setSubscribingPlanId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
        <span className="ml-2 text-gray-400">料金プランを読み込み中...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-16 px-4" style={{ background: 'linear-gradient(135deg, #0a0b14 0%, #1a1b3a 50%, #0f1020 100%)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 bg-transparent border border-gray-600 text-gray-300 hover:bg-gray-800/50 hover:border-gray-500 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            ホームに戻る
          </Button>
        </div>
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl mb-6 text-white">
            料金プラン
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            あなたのトレーディングレベルに合わせた最適なプランをお選びください
          </p>
        </div>

        {currentSubscription && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-2xl p-6 mb-12 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-1">
                  現在のプラン: {currentSubscription.plan.name}
                </h3>
                <p className="text-green-300">
                  次回更新日: {new Date(currentSubscription.endDate).toLocaleDateString('ja-JP')}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">
                  ¥{currentSubscription.plan.price.toLocaleString()}
                </div>
                <div className="text-sm text-green-300">月額</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const isSubscribing = subscribingPlanId === plan.id
            const isDisabled = !plan.isActive
            
            return (
              <Card 
                key={plan.name} 
                className={`relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl flex flex-col h-full ${
                  plan.premium 
                    ? 'border-2 shadow-xl' 
                    : plan.popular 
                      ? 'border-2 shadow-lg' 
                      : 'border shadow-md'
                }`}
                style={{
                  background: plan.premium 
                    ? 'linear-gradient(135deg, #d4af37 0%, #e6c547 100%)'
                    : plan.popular
                      ? 'linear-gradient(135deg, #2a2d5a 0%, #1a1b3a 100%)'
                      : 'linear-gradient(135deg, #1f2128 0%, #151822 100%)',
                  borderColor: plan.premium 
                    ? '#b8941f'
                    : plan.popular
                      ? '#d4af37'
                      : '#3a3f5a'
                }}
              >
                {plan.id === 'free' && (
                  <div className="absolute top-0 left-0 right-0">
                    <div 
                      className="text-center py-2 text-sm text-white relative"
                      style={{ background: 'linear-gradient(90deg, #4a5568, #2d3748)' }}
                    >
                      お試しプラン
                    </div>
                  </div>
                )}

                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0">
                    <div 
                      className="text-center py-2 text-sm text-white relative"
                      style={{ background: 'linear-gradient(90deg, #d4af37, #e6c547)' }}
                    >
                      エントリープラン
                    </div>
                  </div>
                )}
                
                {plan.premium && (
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
                )}

                <CardHeader className={`text-center ${plan.popular || plan.premium || plan.id === 'free' ? 'pt-12' : 'pt-8'}`}>
                  <div className={`flex items-center justify-center mb-4 p-3 rounded-full w-16 h-16 mx-auto ${
                    plan.premium 
                      ? 'bg-gray-900 text-yellow-500' 
                      : plan.popular
                      ? 'bg-yellow-500 text-black'
                      : 'bg-gray-700 text-gray-300'
                  }`}>
                    {plan.icon}
                  </div>
                  
                  <h3 className={`text-2xl mb-2 ${
                    plan.premium ? 'text-gray-900' : 'text-white'
                  }`}>
                    {plan.name}
                  </h3>
                  
                  <div className="mb-4">
                    <span className={`text-4xl ${
                      plan.premium ? 'text-gray-900' : 'text-white'
                    }`}>
                      {plan.price}
                    </span>
                    <span className={`text-lg ${
                      plan.premium ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      /月
                    </span>
                  </div>
                  
                  <p className={`text-sm leading-relaxed ${
                    plan.premium ? 'text-gray-800' : 'text-gray-300'
                  }`}>
                    {plan.description}
                  </p>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 ${
                          plan.premium 
                            ? 'text-gray-800' 
                            : feature.included 
                              ? 'text-yellow-500' 
                              : 'text-gray-500'
                        }`} />
                        <span className={`text-sm leading-relaxed ${
                          plan.premium 
                            ? 'text-gray-800' 
                            : feature.included 
                              ? 'text-gray-200' 
                              : 'text-gray-400'
                        }`}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {plan.id === 'free' ? (
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
                  ) : (
                    <div className="space-y-3">
                      <Button 
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={isSubscribing || isDisabled}
                        className={`w-full py-3 transition-all duration-300 ${
                          plan.premium
                            ? 'bg-gray-900 text-yellow-500 hover:bg-gray-800 border-2 border-gray-900'
                            : 'text-black border-2 hover:bg-yellow-500'
                        }`}
                        style={{
                          background: plan.premium 
                            ? '#1f2937'
                            : plan.popular
                              ? 'linear-gradient(135deg, #d4af37, #e6c547)'
                              : 'linear-gradient(135deg, #d4af37, #e6c547)'
                        }}
                      >
                        {isDisabled ? (
                          '募集停止中'
                        ) : isSubscribing ? (
                          <div className="flex items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            処理中...
                          </div>
                        ) : currentSubscription?.plan.name === plan.name ? (
                          '現在のプラン'
                        ) : (
                          '今すぐ申し込む（PayPal）'
                        )}
                      </Button>
                      <Button
                        onClick={() => window.open('https://discord.gg/f3vr94Qhqr', '_blank')}
                        className={`w-full py-2 bg-transparent border rounded-lg text-xs ${
                          plan.premium 
                            ? 'border-gray-900 text-gray-900 hover:bg-gray-900/10'
                            : 'border-yellow-500 text-yellow-500 hover:bg-yellow-500/10'
                        }`}
                      >
                        申込相談/申込済会員はこちら（Discord）
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
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

        <div className="text-center mt-16">
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
      </div>
    </div>
  )
}
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Check, Star, Crown, Zap } from "lucide-react";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface PricingPlan {
  name: string;
  price: string;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
  premium?: boolean;
  icon: React.ReactNode;
}

const plans: PricingPlan[] = [
  {
    name: "Free",
    price: "¥0",
    description: "まずはお試しでご利用",
    icon: <Zap className="w-6 h-6" />,
    features: [
      { text: "先出しルームへご招待", included: true },
      { text: "その他麻生からの発信", included: true },
    ]
  },
  {
    name: "Trial",
    price: "¥9,800",
    description: "\"感覚を磨きたい\"あなたへ",
    icon: <Star className="w-6 h-6" />,
    popular: true,
    features: [
      { text: "先出しルームへご招待", included: true },
      { text: "その他麻生からの発信", included: true },
      { text: "トレード選抜Discord招待", included: true },
      { text: "週1回ライブトレード配信", included: true },
      { text: "週1回のライブ質問会", included: true },
    ]
  },
  {
    name: "Standard",
    price: "¥30,000",
    description: "1人で送る時間を共に考え学ぶ\"時間\"へ",
    icon: <Check className="w-6 h-6" />,
    features: [
      { text: "Trialコースの内容全て", included: true },
      { text: "1日10時間開催するライブ配信への参加（自由）", included: true },
      { text: "※チャット参加", included: true },
      { text: "チャットでの質問し放題", included: true },
      { text: "トレード管理シート配布", included: true },
      { text: "配信によるトレード講習", included: true },
      { text: "※チャット参加", included: true },
    ]
  },
  {
    name: "Premium",
    price: "¥50,000",
    description: "勝ち方を\"知る\"ではなく\"できる\"ようになる場所",
    icon: <Crown className="w-6 h-6" />,
    premium: true,
    features: [
      { text: "Standardコースの内容全て", included: true },
      { text: "マンツーマン指導&講習", included: true },
      { text: "ラウンジ音声参加OK", included: true },
      { text: "全エントリーを添削", included: true },
      { text: "年に一度イベントご招待", included: true },
      { text: "24時間質問対応可能", included: true },
      { text: "（麻生と友達に笑）", included: true },
    ]
  }
];

export function PricingPlans() {
  return (
    <div className="min-h-screen py-16 px-4" style={{ background: 'linear-gradient(135deg, #0a0b14 0%, #1a1b3a 50%, #0f1020 100%)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl mb-6 text-white">
            料金プラン
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            あなたのトレーディングレベルに合わせた最適なプランをお選びください
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan, index) => (
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
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0">
                  <div 
                    className="text-center py-2 text-sm text-white relative"
                    style={{ background: 'linear-gradient(90deg, #d4af37, #e6c547)' }}
                  >
                    人気プラン
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
                    最上位プラン
                  </div>
                </div>
              )}

              <CardHeader className={`text-center ${plan.popular || plan.premium ? 'pt-12' : 'pt-8'}`}>
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
                  plan.premium ? 'text-gray-900' : plan.popular ? 'text-black' : 'text-white'
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
                  plan.premium ? 'text-gray-800' : plan.popular ? 'text-gray-800' : 'text-gray-300'
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
                          : plan.popular
                            ? (feature.included ? 'text-gray-300' : 'text-gray-500')
                            : feature.included 
                              ? 'text-gray-200' 
                              : 'text-gray-400'
                      }`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full py-3 transition-all duration-300 mt-auto ${
                    plan.premium
                      ? 'bg-gray-900 text-yellow-500 hover:bg-gray-800 border-2 border-gray-900'
                      : plan.popular
                        ? 'text-black border-2 hover:bg-yellow-500'
                        : 'bg-yellow-600 text-black hover:bg-yellow-500'
                  }`}
                  style={{
                    background: plan.premium 
                      ? '#1f2937'
                      : plan.popular
                        ? 'linear-gradient(135deg, #d4af37, #e6c547)'
                        : 'linear-gradient(135deg, #d4af37, #e6c547)'
                  }}
                >
                  {plan.name === 'Free' ? 'はじめる' : 'プランを選択'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-gray-400 mb-4">
            ご不明な点がございましたら、お気軽にお問い合わせください
          </p>
          <Button 
            variant="outline" 
            className="border-2 border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black px-8 py-3 bg-transparent"
          >
            お問い合わせ
          </Button>
        </div>
      </div>
    </div>
  );
}
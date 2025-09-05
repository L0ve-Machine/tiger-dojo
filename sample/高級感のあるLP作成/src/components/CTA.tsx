import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Check, Star } from "lucide-react";

const plans = [
  {
    name: "ベーシック",
    price: "¥29,800",
    period: "/月",
    description: "FXトレードを始めたい方向け",
    features: [
      "週2回のライブ分析セッション",
      "基本的なトレード添削",
      "コミュニティアクセス",
      "月1回のZoom相談"
    ],
    popular: false
  },
  {
    name: "プレミアム",
    price: "¥49,800",
    period: "/月",
    description: "本格的にトレードスキルを向上させたい方",
    features: [
      "毎日のライブ分析セッション",
      "詳細なトレード添削",
      "コミュニティアクセス",
      "週2回のZoom相談",
      "個別戦略構築サポート",
      "リアルタイム通知"
    ],
    popular: true
  },
  {
    name: "マスター",
    price: "¥89,800",
    period: "/月",
    description: "プロレベルを目指す方向け",
    features: [
      "全サービス利用可能",
      "24時間サポート",
      "マンツーマン指導",
      "無制限Zoom相談",
      "専用戦略開発",
      "実績保証制度"
    ],
    popular: false
  }
];

export function CTA() {
  return (
    <section id="pricing" className="py-20 bg-gray-900">
      <div className="container mx-auto px-6">
        {/* Free Trial Section */}
        <div className="text-center mb-20">
          <div className="relative inline-block">
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl blur opacity-30"></div>
            <Card className="relative bg-black border-yellow-400/30 p-12">
              <div className="max-w-2xl mx-auto">
                <Badge className="bg-yellow-400 text-black mb-6 text-sm px-4 py-2">
                  期間限定
                </Badge>
                <h2 className="text-4xl md:text-5xl text-white mb-6">
                  まずは<span className="text-yellow-400">無料体験</span>から
                </h2>
                <p className="text-xl text-gray-300 mb-8">
                  7日間、すべてのサービスを無料でお試しいただけます。<br />
                  リスクなしで、プロの指導を体験してください。
                </p>
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-500 hover:to-yellow-700 font-semibold px-12 py-4 text-xl h-auto"
                >
                  今すぐ無料体験を開始
                </Button>
                <p className="text-gray-400 mt-4 text-sm">
                  ※クレジットカード不要・自動課金なし
                </p>
              </div>
            </Card>
          </div>
        </div>
        
        {/* Pricing Plans */}
        <div className="mb-16 text-center">
          <span className="inline-block px-4 py-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full text-yellow-400 text-sm font-medium mb-6">
            料金プラン
          </span>
          <h3 className="text-4xl text-white mb-4">
            あなたに最適な<span className="text-yellow-400">プランを選択</span>
          </h3>
          <p className="text-xl text-gray-300">
            どのプランも7日間の無料体験が可能です
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative ${
                plan.popular 
                  ? 'bg-black border-yellow-400/50 transform scale-105' 
                  : 'bg-gray-800/50 border-white/10'
              } hover:border-white/20 transition-all duration-300`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-4 py-2">
                    <Star className="w-4 h-4 mr-1" />
                    人気プラン
                  </Badge>
                </div>
              )}
              
              <div className="p-8">
                <div className="text-center mb-8">
                  <h4 className="text-2xl text-white mb-2">{plan.name}</h4>
                  <p className="text-gray-400 mb-6">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl text-white">{plan.price}</span>
                    <span className="text-gray-400 ml-1">{plan.period}</span>
                  </div>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${
                    plan.popular
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-500 hover:to-yellow-700'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  } font-semibold py-3`}
                >
                  {plan.popular ? '無料体験を開始' : 'プランを選択'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-gray-400">
            すべてのプランに30日間返金保証が付いています
          </p>
        </div>
      </div>
    </section>
  );
}
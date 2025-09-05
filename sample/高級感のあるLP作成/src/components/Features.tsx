import { Card } from "./ui/card";
import { TrendingUp, MessageSquare, Video, Target, Users, BarChart3 } from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    title: "根拠ある先出し",
    description: "テクニカル分析とファンダメンタル分析に基づいた、確度の高いトレード予測を提供します。",
    color: "text-yellow-400"
  },
  {
    icon: MessageSquare,
    title: "添削フィードバック",
    description: "あなたのトレード履歴を詳細に分析し、改善点を具体的にアドバイスします。",
    color: "text-blue-400"
  },
  {
    icon: Video,
    title: "Zoom相談",
    description: "マンツーマンでのリアルタイム相談で、疑問をその場で解決できます。",
    color: "text-green-400"
  },
  {
    icon: Target,
    title: "勝てる型の構築",
    description: "あなた専用のトレード手法を一緒に開発し、継続的な利益を目指します。",
    color: "text-purple-400"
  },
  {
    icon: Users,
    title: "コミュニティ",
    description: "同じ志を持つトレーダーとの情報交換で、モチベーションを維持できます。",
    color: "text-pink-400"
  },
  {
    icon: BarChart3,
    title: "パフォーマンス分析",
    description: "詳細なデータ分析により、トレード成績の向上をサポートします。",
    color: "text-cyan-400"
  }
];

export function Features() {
  return (
    <section id="features" className="py-20 bg-gray-900">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full text-yellow-400 text-sm font-medium mb-4">
            サービス内容
          </span>
          <h2 className="text-4xl md:text-5xl text-white mb-6">
            プロレベルの
            <span className="text-yellow-400"> トレード指導</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            初心者から上級者まで、あなたのレベルに合わせた包括的なサポートを提供します
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="bg-black/50 border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105 backdrop-blur-sm">
                <div className="p-8">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mr-4">
                      <IconComponent className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl text-white">{feature.title}</h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
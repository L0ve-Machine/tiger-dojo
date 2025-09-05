import { ImageWithFallback } from "./figma/ImageWithFallback";
import { CheckCircle } from "lucide-react";

const benefits = [
  "経験豊富な講師による直接指導",
  "24時間アクセス可能なオンライン環境",
  "個別カスタマイズされた学習プログラム",
  "リアルタイムでの市場分析",
  "メンタル面のサポートも充実",
  "継続的なアフターフォロー"
];

export function Benefits() {
  return (
    <section id="benefits" className="py-20 bg-black">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-block px-4 py-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full text-yellow-400 text-sm font-medium mb-6">
              トレード道場の強み
            </span>
            
            <h2 className="text-4xl md:text-5xl text-white mb-8 leading-tight">
              なぜ多くのトレーダーに
              <span className="text-yellow-400 block">選ばれるのか</span>
            </h2>
            
            <p className="text-xl text-gray-300 mb-10 leading-relaxed">
              単なる情報提供ではなく、あなたの成長に本気で向き合う環境です。
              一人ひとりの個性や目標に合わせて、最適なトレード戦略を一緒に構築していきます。
            </p>
            
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                  <span className="text-gray-300 text-lg">{benefit}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-12 p-6 bg-gradient-to-r from-yellow-400/10 to-yellow-600/10 border border-yellow-400/20 rounded-xl">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-yellow-400/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🏆</span>
                </div>
                <div>
                  <h4 className="text-white text-xl mb-2">成功実績</h4>
                  <p className="text-gray-300">
                    90%以上の受講生が3ヶ月以内に安定した収益を達成
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="relative z-10">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1505624198937-c704aff72608?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBidXNpbmVzcyUyMG1lZXRpbmclMjByb29tfGVufDF8fHx8MTc1NjUxMjIxMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Professional Meeting Room"
                className="w-full h-96 object-cover rounded-2xl"
              />
            </div>
            
            {/* Floating Stats */}
            <div className="absolute -top-6 -right-6 bg-black/90 backdrop-blur-sm border border-white/10 p-6 rounded-xl z-20">
              <div className="text-center">
                <div className="text-3xl text-yellow-400 mb-2">500+</div>
                <div className="text-gray-300 text-sm">成功実績</div>
              </div>
            </div>
            
            <div className="absolute -bottom-6 -left-6 bg-black/90 backdrop-blur-sm border border-white/10 p-6 rounded-xl z-20">
              <div className="text-center">
                <div className="text-3xl text-green-400 mb-2">24/7</div>
                <div className="text-gray-300 text-sm">サポート体制</div>
              </div>
            </div>
            
            {/* Background Decoration */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 rounded-full blur-3xl -z-10"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
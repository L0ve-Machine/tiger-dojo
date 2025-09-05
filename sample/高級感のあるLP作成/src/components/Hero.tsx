import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
      
      {/* Background Image */}
      <div className="absolute inset-0 opacity-20">
        <ImageWithFallback 
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
              根拠ある先出し／添削フィードバック／Zoom相談など、
            </p>
            <p className="text-yellow-400 font-medium">
              "勝てる型"を一緒に作るオンライン環境です。
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-500 hover:to-yellow-700 font-semibold px-8 py-4 text-lg h-auto"
            >
              無料体験を始める
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg h-auto"
            >
              詳しく見る
            </Button>
          </div>
          
          <div className="mt-12 flex items-center space-x-6 text-gray-400">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>オンライン対応</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>初心者歓迎</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>専門指導</span>
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
  );
}
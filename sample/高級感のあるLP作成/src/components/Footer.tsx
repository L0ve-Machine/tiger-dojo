import { Mail, Phone, MapPin } from "lucide-react";
import lionIcon from "figma:asset/51608039d7a98182b8d957396e5f4c1171a2333b.png";

export function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 py-16">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <img 
                src={lionIcon} 
                alt="トレード道場 Lion Logo" 
                className="w-12 h-12 object-contain"
              />
              <span className="text-white text-2xl font-semibold">トレード道場</span>
            </div>
            
            <p className="text-gray-300 text-lg leading-relaxed mb-6 max-w-md">
              プロフェッショナルなFXトレード指導を通じて、あなたの投資人生をサポートします。
              確実なスキルアップと継続的な収益を目指しましょう。
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-yellow-400" />
                <span className="text-gray-300">info@trade-dojo.jp</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-yellow-400" />
                <span className="text-gray-300">03-1234-5678</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-yellow-400" />
                <span className="text-gray-300">東京都千代田区</span>
              </div>
            </div>
          </div>
          
          {/* Services */}
          <div>
            <h4 className="text-white text-xl mb-6">サービス</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">ライブ分析</a></li>
              <li><a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">トレード添削</a></li>
              <li><a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">Zoom相談</a></li>
              <li><a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">コミュニティ</a></li>
              <li><a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">戦略構築</a></li>
            </ul>
          </div>
          
          {/* Resources */}
          <div>
            <h4 className="text-white text-xl mb-6">リソース</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">よくある質問</a></li>
              <li><a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">利用規約</a></li>
              <li><a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">プライバシー</a></li>
              <li><a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">お問い合わせ</a></li>
              <li><a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">ブログ</a></li>
            </ul>
          </div>
        </div>
        
        <hr className="border-white/10 my-12" />
        
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-gray-400">
            © 2024 FXトレード道場. All rights reserved.
          </p>
          
          <div className="flex space-x-6">
            <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">
              Twitter
            </a>
            <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">
              YouTube
            </a>
            <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">
              Instagram
            </a>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
          <p className="text-yellow-400 text-sm text-center">
            ⚠️ 投資にはリスクが伴います。余裕資金での取引をお勧めします。
          </p>
        </div>
      </div>
    </footer>
  );
}
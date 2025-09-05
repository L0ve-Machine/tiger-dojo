import { Button } from "./ui/button";
import lionIcon from "figma:asset/51608039d7a98182b8d957396e5f4c1171a2333b.png";

export function Header() {
  return (
    <header className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-sm border-b border-white/10">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src={lionIcon} 
              alt="トレード道場 Lion Logo" 
              className="w-10 h-10 object-contain"
            />
            <span className="text-white text-xl font-semibold">トレード道場</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-300 hover:text-yellow-400 transition-colors">
              サービス
            </a>
            <a href="#benefits" className="text-gray-300 hover:text-yellow-400 transition-colors">
              特徴
            </a>
            <a href="#pricing" className="text-gray-300 hover:text-yellow-400 transition-colors">
              料金
            </a>
            <a href="#contact" className="text-gray-300 hover:text-yellow-400 transition-colors">
              お問い合わせ
            </a>
          </nav>
          
          <Button className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-500 hover:to-yellow-700 font-semibold px-6">
            無料体験
          </Button>
        </div>
      </div>
    </header>
  );
}
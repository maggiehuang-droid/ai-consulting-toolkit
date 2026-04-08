import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, UserPlus, ArrowRight, Sparkles } from 'lucide-react';

export default function RoleLandingPage() {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  // 觸發載入動畫
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row font-sans overflow-hidden bg-[#F6F8F9]">
      
      {/* ========================================================================
        左側面板：品牌視覺區
        ========================================================================
      */}
      <div className="hidden md:flex md:w-[45%] bg-gradient-to-br from-[#1F49A3] to-[#4586F0] relative flex-col justify-start pt-32 lg:pt-40 xl:pt-48 px-12 lg:px-16 xl:px-20 overflow-hidden shadow-2xl z-10">
        
        {/* 抽象背景裝飾 */}
        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-white/5 rounded-full blur-3xl mix-blend-overlay"></div>
          <div className="absolute bottom-20 right-10 w-[30rem] h-[30rem] bg-[#B5D1FE]/20 rounded-full blur-3xl mix-blend-overlay"></div>
          
          <svg className="absolute top-1/4 left-0 w-full h-full opacity-[0.07]" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,50 C30,20 70,80 100,50 L100,100 L0,100 Z" fill="#ffffff" />
          </svg>
        </div>

        {/* 品牌內容區塊 */}
        <div className={`relative z-10 flex flex-col items-start w-full max-w-[560px] mx-auto transition-all duration-1000 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          
          {/* Logo */}
          <img 
            src="https://i.ibb.co/MxgTGTLH/Logo-black.png" 
            alt="Crescendo Lab Logo" 
            className="h-8 lg:h-9 w-auto object-contain mb-12 filter brightness-0 invert opacity-90"
          />

          {/* Tag */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-8 shadow-sm">
            <Sparkles className="w-5 h-5 text-[#B5D1FE]" />
            <span className="text-base font-semibold text-[#B5D1FE] tracking-widest">內部專屬平台</span>
          </div>

          {/* 主副標題 */}
          <h1 className="text-[40px] lg:text-[48px] xl:text-[56px] whitespace-nowrap font-extrabold text-white leading-[1.2] mb-6 tracking-tight drop-shadow-sm">
            AI 顧問工作坊工具箱
          </h1>
          <p className="text-xl lg:text-2xl text-[#B5D1FE] leading-relaxed opacity-90">
            協助團隊快速對齊問題與解法
          </p>
        </div>

        {/* 底部版權宣告 */}
        <div className="absolute bottom-10 left-12 lg:left-16 xl:left-20 z-10 text-white/50 text-sm tracking-wider">
          © {new Date().getFullYear()} Crescendo Lab.
        </div>
      </div>

      {/* ========================================================================
        右側面板：身份選擇 / 操作區
        ========================================================================
      */}
      <div className="w-full md:w-[55%] flex flex-col justify-start items-center pt-32 lg:pt-40 xl:pt-48 px-6 sm:px-12 lg:px-20 relative">
        
        {/* 放大最大寬度，讓按鈕整體更寬闊 */}
        <div className="w-full max-w-[500px]">
          
          {/* 隱藏的佔位區塊，用來與左側的 Logo 高度對齊 */}
          <div className="hidden md:block h-8 lg:h-9 mb-12"></div>

          {/* 區塊標題 */}
          <div className={`mb-8 text-center md:text-left transition-all duration-700 delay-100 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <h2 className="text-2xl md:text-[28px] font-bold text-[#222A36] tracking-tight leading-snug">
              請選擇您的身份以繼續進入工作區
            </h2>
          </div>

          {/* 卡片容器 */}
          <div className="space-y-6">
            
            {/* 卡片 1：管理者 */}
            <button 
              onClick={() => navigate('/admin')}
              className={`group w-full flex items-center justify-between py-6 px-8 bg-[#1F49A3] rounded-[24px] text-white text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_32px_-8px_rgba(31,73,163,0.4)] transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
              style={{ transitionDelay: '200ms' }}
            >
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <ShieldCheck className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold tracking-wide">我是管理者</h3>
                  <p className="text-[#B5D1FE] text-[15px] font-medium mt-1.5 opacity-90">建立工作坊、管理小組、查看進度</p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-white/50 group-hover:text-white group-hover:translate-x-2 transition-all duration-300" />
            </button>

            {/* 卡片 2：參與者 */}
            <button 
              onClick={() => navigate('/entry')}
              className={`group w-full flex items-center justify-between py-6 px-8 bg-white border border-gray-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-[24px] text-left transition-all duration-300 hover:border-[#1F49A3]/30 hover:-translate-y-1 hover:shadow-[0_16px_32px_-8px_rgba(31,73,163,0.1)] transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
              style={{ transitionDelay: '300ms' }}
            >
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-full bg-[#F6F8F9] flex items-center justify-center flex-shrink-0 group-hover:bg-[#1F49A3]/10 group-hover:scale-105 transition-all duration-300">
                  <UserPlus className="w-7 h-7 text-[#1F49A3]" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#222A36] tracking-wide">我是參與者</h3>
                  <p className="text-[#5F6368] text-[15px] mt-1.5 font-medium">輸入工作坊代碼，進入小組工作區</p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-300 group-hover:text-[#1F49A3] group-hover:translate-x-2 transition-all duration-300" />
            </button>

          </div>

          {/* 底部協助連結 */}
          <div className={`mt-10 text-center md:text-left transition-all duration-700 delay-500 transform ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            <a href="#" className="text-[15px] text-[#222A36] hover:text-[#1F49A3] font-bold transition-colors underline-offset-4 hover:underline">
              需要協助登入嗎？
            </a>
          </div>
          
        </div>
      </div>
    </div>
  );
}

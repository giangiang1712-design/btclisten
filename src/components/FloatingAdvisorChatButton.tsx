import React, { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';

interface FloatingAdvisorChatButtonProps {
  onClick: () => void;
  isOpen?: boolean;
}

export const FloatingAdvisorChatButton: React.FC<FloatingAdvisorChatButtonProps> = ({
  onClick,
  isOpen = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isScrollHidden, setIsScrollHidden] = useState(false);

  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollYRef.current;

      // If close to top, keep button visible
      if (currentScrollY < 60) {
        setIsScrollHidden(false);
      } else if (delta > 6) {
        // Scrolling down past threshold
        setIsScrollHidden(true);
      } else if (delta < -6) {
        // Scrolling up past threshold
        setIsScrollHidden(false);
      }

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const isExpanded = isHovered || isFocused;
  const isHidden = isScrollHidden && !isHovered && !isFocused;

  if (isOpen) return null;

  return (
    <button
      id="floating-advisor-chat-btn"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className={`fixed bottom-18 right-3 md:bottom-6 md:right-6 z-40 group flex items-center p-2 sm:p-2.5 bg-gradient-to-r from-red-700 to-amber-700 hover:from-red-800 hover:to-amber-800 text-white rounded-full border border-amber-300/80 shadow-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] transform cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
        isHidden
          ? 'translate-y-24 opacity-0 pointer-events-none scale-90'
          : 'translate-y-0 opacity-100 scale-100 hover:scale-105 active:scale-95 pointer-events-auto'
      }`}
      title="Trợ lý AI tham mưu, đề xuất hướng xử lý"
      aria-label="Trợ lý AI tham mưu, đề xuất hướng xử lý"
      aria-expanded={isExpanded}
      aria-hidden={isHidden}
    >
      {/* Icon Badge */}
      <div className="relative shrink-0 flex items-center justify-center">
        <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 text-amber-300 flex items-center justify-center transition-transform duration-300 ease-out group-hover:rotate-12 group-focus-visible:rotate-12 group-hover:scale-110">
          <Sparkles className="w-5 h-5 animate-spin text-amber-300" style={{ animationDuration: '6s' }} />
        </span>
        
        {/* Pulsing AI Online Status Indicator */}
        <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border-2 border-red-900"></span>
        </span>
      </div>

      {/* Fluid Sliding Text Label Container */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col justify-center text-left ${
          isExpanded
            ? 'max-w-[240px] opacity-100 ml-2.5 mr-2 pr-1'
            : 'max-w-0 opacity-0 ml-0 mr-0 pr-0'
        }`}
      >
        <div
          className={`text-xs font-black leading-tight whitespace-nowrap tracking-wide transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isExpanded ? 'translate-x-0' : 'translate-x-2'
          }`}
        >
          Trợ Lý Tham Mưu AI
        </div>
        <div
          className={`text-[10px] font-semibold text-amber-200/90 whitespace-nowrap transition-transform duration-300 delay-75 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isExpanded ? 'translate-x-0' : 'translate-x-2'
          }`}
        >
          Đề xuất hướng xử lý & Tạo văn bản
        </div>
      </div>
    </button>
  );
};


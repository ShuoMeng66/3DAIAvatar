import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, Monitor } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [_titlePressCount, setTitlePressCount] = useState(0);
  const [titlePressTimer, setTitlePressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const isActive = (path: string) => location.pathname === path;

  const handleTitlePress = useCallback(() => {
    setTitlePressCount(prev => {
      const next = prev + 1;
      if (next >= 3) {
        navigate('/settings');
        return 0;
      }
      return next;
    });
    if (titlePressTimer) clearTimeout(titlePressTimer);
    const timer = setTimeout(() => setTitlePressCount(0), 2000);
    setTitlePressTimer(timer);
  }, [navigate, titlePressTimer]);

  useEffect(() => {
    return () => { if (titlePressTimer) clearTimeout(titlePressTimer); };
  }, [titlePressTimer]);

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gradient-to-b from-warm-bg to-warm-bg-dark">
      {/* 标题栏 */}
      <header className="flex items-center justify-center h-16 px-4 bg-white/80 backdrop-blur-sm border-b border-warm-border flex-shrink-0">
        <button
          onClick={handleTitlePress}
          className="text-2xl font-black text-warm-primary cursor-pointer select-none"
          aria-label="小暖陪聊"
        >
          小暖陪聊
        </button>
      </header>

      {/* 内容区 */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>

      {/* 底部导航 */}
      <nav className="flex items-center justify-around h-16 bg-white/80 backdrop-blur-sm border-t border-warm-border flex-shrink-0">
        <button
          onClick={() => navigate('/chat')}
          className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-colors ${isActive('/chat') ? 'text-warm-primary bg-warm-bg' : 'text-warm-text-light hover:text-warm-primary'}`}
        >
          <MessageCircle size={28} />
          <span className="text-base font-medium">聊天</span>
        </button>
        <button
          onClick={() => navigate('/hologram')}
          className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-colors ${isActive('/hologram') ? 'text-warm-primary bg-warm-bg' : 'text-warm-text-light hover:text-warm-primary'}`}
        >
          <Monitor size={28} />
          <span className="text-base font-medium">全息</span>
        </button>
      </nav>
    </div>
  );
}
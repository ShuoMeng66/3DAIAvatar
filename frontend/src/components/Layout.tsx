import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, Monitor, Home } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { BRAND } from '../config/brand';
import AppLogo from './AppLogo';

const NAV_ITEMS = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/chat', icon: MessageCircle, label: '聊天' },
  { path: '/hologram', icon: Monitor, label: '全息' },
] as const;

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [_titlePressCount, setTitlePressCount] = useState(0);
  const [titlePressTimer, setTitlePressTimer] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  const isActive = (path: string) => location.pathname === path;

  const handleTitlePress = useCallback(() => {
    setTitlePressCount((prev) => {
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
    return () => {
      if (titlePressTimer) clearTimeout(titlePressTimer);
    };
  }, [titlePressTimer]);

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gradient-to-b from-purple-bg to-purple-bg-soft">
      <header className="flex items-center justify-center h-16 px-4 glass-panel border-b border-purple-border flex-shrink-0">
        <button
          onClick={handleTitlePress}
          className="flex items-center gap-3 cursor-pointer select-none"
          aria-label={BRAND.cabinetTitle}
        >
          <div className="w-10 h-10 rounded-full gradient-purple flex items-center justify-center p-1.5">
            <AppLogo size={28} />
          </div>
          <span className="text-2xl font-black text-purple-text">{BRAND.nameZh}</span>
          <span className="text-base font-medium text-purple-light">{BRAND.nameEn}</span>
        </button>
      </header>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>

      <nav className="flex items-center justify-around h-[72px] px-3 glass-panel border-t border-purple-border flex-shrink-0">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const active = isActive(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={[
                'flex flex-col items-center gap-1 px-5 py-2 rounded-full transition-colors duration-200',
                active
                  ? 'bg-purple-primary text-white'
                  : 'text-purple-text-muted hover:text-purple-primary',
              ].join(' ')}
            >
              <Icon size={active && path === '/chat' ? 28 : 24} />
              <span className="text-sm font-medium">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
